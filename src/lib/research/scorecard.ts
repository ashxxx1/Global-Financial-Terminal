/**
 * Research scorecard.
 *
 * Eight dimensions, each scored from evidence we can point at. The scores
 * describe what the data says about the company as it stands — they are not a
 * view on what the shares will do, and there is deliberately no composite
 * "buy score". Rolling eight measurements into one number would imply a
 * weighting we cannot justify and a prediction we are not making.
 *
 * Every dimension carries its own confidence and freshness, because they are
 * not equally knowable: profitability comes from a quarterly filing, price
 * momentum from today's tape, and a reader deserves to see which is which
 * without digging.
 */
import { num, type EarningsPoint, type Recommendation, type InsiderTx } from "./data";
import { distribution, trend } from "./series";
import { hist } from "./analyzers/shared";
import { attribution } from "./analyzers/relative";
import type { CompanyContext } from "./context";
import type { Source } from "./types";
import type { Cadence } from "./providers/types";

export type ScoreBand = "strong" | "above" | "neutral" | "below" | "weak" | "unknown";

export interface ScoreDimension {
  id: string;
  label: string;
  /** −2…+2, or null when there is not enough evidence to place it. */
  score: number | null;
  band: ScoreBand;
  /** One line naming the measurement behind the score. */
  basis: string;
  confidence: number;
  sources: Source[];
  /** How current the underlying data is. */
  cadence: Cadence;
  asOf: number;
  period?: string;
  /** Why we could not score it, when score is null. */
  missing?: string;
}

const band = (s: number | null): ScoreBand =>
  s === null ? "unknown"
  : s >= 1.5 ? "strong" : s >= 0.5 ? "above"
  : s > -0.5 ? "neutral" : s > -1.5 ? "below" : "weak";

/** Map a percentile (0–100) to the −2…+2 scale, direction-aware. */
const fromPercentile = (p: number, higherIsBetter: boolean): number => {
  const centred = (p - 50) / 25;            // 50 -> 0, 100 -> +2, 0 -> -2
  return higherIsBetter ? centred : -centred;
};

export function buildScorecard(ctx: CompanyContext): ScoreDimension[] {
  const dims: ScoreDimension[] = [];
  const m = ctx.metrics.ok ? ctx.metrics.data : undefined;
  const metricsAsOf = ctx.metrics.ok ? ctx.metrics.provenance.fetchedAt : ctx.builtAt;
  const metricsPeriod = ctx.metrics.ok ? ctx.metrics.provenance.period : undefined;

  const src = (label: string, detail: string, cap: Source["capability"], key?: string): Source =>
    ({ kind: "fundamental-history", label, detail, asOf: metricsAsOf, capability: cap, metricKey: key });

  /* Valuation — where the multiple sits in its own history. Cheap scores
     positively; that is a statement about the multiple, not about the shares. */
  {
    const d = distribution(hist(m, "peTTM"), 40);
    dims.push(d ? {
      id: "valuation", label: "Valuation",
      score: fromPercentile(d.percentile, false), band: band(fromPercentile(d.percentile, false)),
      basis: `P/E ${d.current.toFixed(1)}× sits at the ${d.percentile.toFixed(0)}th percentile of its own ${d.n}-quarter range (median ${d.median.toFixed(1)}×).`,
      confidence: 0.85,
      sources: [src("P/E history", `current ${d.current.toFixed(2)}, median ${d.median.toFixed(2)}, range ${d.min.toFixed(1)}–${d.max.toFixed(1)}`, "fundamental-history", "peTTM")],
      cadence: "quarterly", asOf: metricsAsOf, period: metricsPeriod,
    } : unknownDim("valuation", "Valuation", "Fewer than eight quarters of P/E history.", metricsAsOf));
  }

  /* Growth — reported revenue and EPS growth. */
  {
    const rev = num(m, "revenueGrowthTTMYoy");
    const eps = num(m, "epsGrowthTTMYoy");
    if (rev === null && eps === null) {
      dims.push(unknownDim("growth", "Growth", "No reported growth figures.", metricsAsOf));
    } else {
      const vals = [rev, eps].filter((x): x is number => x !== null && Number.isFinite(x));
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      // 20%+ is strong, 0% neutral, negative weak. Thresholds are conventions.
      const score = Math.max(-2, Math.min(2, avg / 10));
      dims.push({
        id: "growth", label: "Growth", score, band: band(score),
        basis: `${rev !== null ? `Revenue ${rev >= 0 ? "+" : ""}${rev.toFixed(1)}%` : ""}${rev !== null && eps !== null ? ", " : ""}${eps !== null ? `EPS ${eps >= 0 ? "+" : ""}${eps.toFixed(1)}%` : ""} year on year.`,
        confidence: 0.8,
        sources: [src("Growth", `revenueGrowthTTMYoy ${rev ?? "—"}, epsGrowthTTMYoy ${eps ?? "—"}`, "fundamentals")],
        cadence: "quarterly", asOf: metricsAsOf, period: metricsPeriod,
      });
    }
  }

  /* Profitability — margins and returns against the company's own history. */
  {
    const d = distribution(hist(m, "netMargin"), 40);
    const roe = num(m, "roeTTM");
    dims.push(d ? {
      id: "profitability", label: "Profitability",
      score: fromPercentile(d.percentile, true), band: band(fromPercentile(d.percentile, true)),
      basis: `Net margin ${d.current.toFixed(1)}% is at the ${d.percentile.toFixed(0)}th percentile of its ${d.n}-quarter range${roe !== null ? `; ROE ${roe.toFixed(0)}%` : ""}.`,
      confidence: 0.85,
      sources: [src("Net margin history", `current ${d.current.toFixed(2)}%, median ${d.median.toFixed(2)}%`, "fundamental-history", "netMargin")],
      cadence: "quarterly", asOf: metricsAsOf, period: metricsPeriod,
    } : unknownDim("profitability", "Profitability", "Not enough margin history.", metricsAsOf));
  }

  /* Earnings momentum — realised surprises, not estimates, and it says so. */
  {
    if (!ctx.earnings.ok) {
      dims.push(unknownDim("earnings", "Earnings momentum", "No earnings history retrieved.", ctx.builtAt));
    } else {
      const sp = (ctx.earnings.data as EarningsPoint[])
        .map((e) => e.surprisePercent).filter((x): x is number => typeof x === "number" && Number.isFinite(x));
      if (sp.length < 3) {
        dims.push(unknownDim("earnings", "Earnings momentum", `Only ${sp.length} quarters of surprise data.`, ctx.builtAt));
      } else {
        const avg = sp.reduce((a, b) => a + b, 0) / sp.length;
        const beats = sp.filter((x) => x > 0).length;
        const score = Math.max(-2, Math.min(2, avg / 5 + (beats / sp.length - 0.5) * 2));
        dims.push({
          id: "earnings", label: "Earnings momentum", score, band: band(score),
          basis: `Beat consensus in ${beats} of ${sp.length} quarters, averaging ${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%. Realised results, not forward estimates.`,
          confidence: 0.75,
          sources: [{ kind: "earnings", label: "Surprise history", detail: sp.map((x) => `${x >= 0 ? "+" : ""}${x.toFixed(1)}%`).join(" · "), asOf: ctx.earnings.provenance.fetchedAt, capability: "earnings-surprises" }],
          cadence: "quarterly", asOf: ctx.earnings.provenance.fetchedAt, period: ctx.earnings.provenance.period,
        });
      }
    }
  }

  /* Price momentum — relative to peers, not absolute. Rising with the market
     is not momentum in any sense worth scoring. */
  {
    const a = attribution(ctx, "3M");
    if (a.stock === null || a.peerMedian === null) {
      dims.push(unknownDim("price", "Price momentum", "Not enough price history for the stock or its peers.", ctx.builtAt));
    } else {
      const gap = a.stock - a.peerMedian;
      const score = Math.max(-2, Math.min(2, gap / 10));
      dims.push({
        id: "price", label: "Price momentum", score, band: band(score),
        basis: `${a.stock >= 0 ? "+" : ""}${a.stock.toFixed(1)}% over 3M against a peer median of ${a.peerMedian >= 0 ? "+" : ""}${a.peerMedian.toFixed(1)}%.`,
        confidence: 0.8,
        sources: [{ kind: "market", label: "Relative return", detail: `3M: stock ${a.stock.toFixed(2)}%, peers ${a.peerMedian.toFixed(2)}% across ${a.peerN} names`, asOf: ctx.builtAt, capability: "price-history", unpriced: ctx.quote ? !ctx.quote.live : true }],
        cadence: "daily", asOf: ctx.builtAt,
      });
    }
  }

  /* Balance-sheet risk — leverage and liquidity against their own history. */
  {
    const lev = distribution(hist(m, "totalDebtToEquity"), 40);
    const cur = num(m, "currentRatioQuarterly");
    if (!lev) {
      dims.push(unknownDim("balance", "Balance-sheet risk", "Not enough leverage history.", metricsAsOf));
    } else {
      // High leverage percentile is bad, so the score is inverted.
      const score = fromPercentile(lev.percentile, false);
      dims.push({
        id: "balance", label: "Balance-sheet risk", score, band: band(score),
        basis: `Debt/equity ${lev.current.toFixed(2)} at the ${lev.percentile.toFixed(0)}th percentile of its ${lev.n}-quarter range${cur !== null ? `; current ratio ${cur.toFixed(2)}` : ""}.`,
        confidence: 0.8,
        sources: [src("Leverage history", `current ${lev.current.toFixed(2)}, median ${lev.median.toFixed(2)}`, "fundamental-history", "totalDebtToEquity")],
        cadence: "quarterly", asOf: metricsAsOf, period: metricsPeriod,
      });
    }
  }

  /* Analyst sentiment — the rating mix and its direction. */
  {
    if (!ctx.recommendations.ok || (ctx.recommendations.data as Recommendation[]).length < 2) {
      dims.push(unknownDim("analysts", "Analyst sentiment", "Fewer than two rating periods.", ctx.builtAt));
    } else {
      const recs = ctx.recommendations.data as Recommendation[];
      const scoreOf = (r: Recommendation) => {
        const t = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
        return t === 0 ? 0 : (r.strongBuy * 2 + r.buy - r.sell - r.strongSell * 2) / t;
      };
      const now = scoreOf(recs[0]), then = scoreOf(recs[recs.length - 1]);
      const score = Math.max(-2, Math.min(2, now * 1.2 + (now - then) * 2));
      dims.push({
        id: "analysts", label: "Analyst sentiment", score, band: band(score),
        basis: `Weighted rating ${now.toFixed(2)} (was ${then.toFixed(2)} at ${recs[recs.length - 1].period}). A rating mix is a blunter instrument than the estimate revisions we cannot see.`,
        confidence: 0.65,
        sources: [{ kind: "analysts", label: "Analyst ratings", detail: recs.slice(0, 4).map((r) => `${r.period}: ${r.strongBuy}/${r.buy}/${r.hold}/${r.sell}/${r.strongSell}`).join(" · "), asOf: ctx.recommendations.provenance.fetchedAt, capability: "analyst-ratings" }],
        cadence: "event-driven", asOf: ctx.recommendations.provenance.fetchedAt, period: ctx.recommendations.provenance.period,
      });
    }
  }

  /* Insider activity — direction only, and scored weakly on purpose. */
  {
    if (!ctx.insider.ok) {
      dims.push(unknownDim("insider", "Insider activity", "No insider filings retrieved.", ctx.builtAt));
    } else {
      const txs = ((ctx.insider.data.data ?? []) as InsiderTx[]).slice(0, 60);
      const buys = txs.filter((t) => (t.change ?? 0) > 0).length;
      const sells = txs.filter((t) => (t.change ?? 0) < 0).length;
      const total = buys + sells;
      const score = total === 0 ? 0 : Math.max(-1, Math.min(1, ((buys - sells) / total) * 1.2));
      dims.push({
        id: "insider", label: "Insider activity", score, band: band(score),
        basis: `${buys} buys against ${sells} sells in the last ${total} filings. Sales frequently reflect scheduled 10b5-1 plans rather than a view, so this is capped at ±1.`,
        confidence: 0.5,
        sources: [{ kind: "insider", label: "Insider filings", detail: `${buys} buys, ${sells} sells across ${total} transactions`, asOf: ctx.insider.provenance.fetchedAt, capability: "insider-transactions" }],
        cadence: "event-driven", asOf: ctx.insider.provenance.fetchedAt,
      });
    }
  }

  return dims;
}

function unknownDim(id: string, label: string, missing: string, asOf: number): ScoreDimension {
  return {
    id, label, score: null, band: "unknown",
    basis: "Not enough evidence to place this.",
    confidence: 0, sources: [], cadence: "quarterly", asOf, missing,
  };
}

/** How much of the scorecard could actually be filled — shown, not hidden. */
export function scorecardCoverage(dims: ScoreDimension[]): { scored: number; total: number } {
  return { scored: dims.filter((d) => d.score !== null).length, total: dims.length };
}
