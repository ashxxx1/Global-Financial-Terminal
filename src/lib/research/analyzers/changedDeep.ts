/**
 * "What changed?" — ranked by materiality.
 *
 * The shallow version compared the latest quarter with the previous one and
 * listed whatever moved. That produces a wall of metrics in which inventory
 * turnover sits beside EPS as though they matter equally.
 *
 * Materiality here is three things multiplied: how unusual the move is against
 * the metric's own history (a 0.4pp swing in a stable gross margin is a bigger
 * event than 3pp in a volatile one), how large it is economically, and how much
 * the line matters to an equity holder at all. The weights are ours and the UI
 * says so — but they are stated once, here, rather than implied by ordering.
 */
import { clean, trend, consistencyWord, seriesDetail } from "../series";
import type { CompanyContext } from "../context";
import type { Claim } from "../types";
import type { EarningsPoint, Recommendation, InsiderTx } from "../data";
import { num } from "../data";
import { hist } from "./shared";

/**
 * Importance to an equity holder, 0–1. Earnings and revenue move a valuation;
 * inventory turnover is a diagnostic. Both are worth surfacing, not equally.
 */
const IMPORTANCE: Record<string, number> = {
  eps: 1.0, salesPerShare: 0.95, netMargin: 0.9, operatingMargin: 0.85,
  grossMargin: 0.8, fcfMargin: 0.8, roeTTM: 0.7, roicTTM: 0.7,
  totalDebtToEquity: 0.75, currentRatio: 0.6, cashRatio: 0.55,
  bookValue: 0.5, inventoryTurnoverTTM: 0.4, receivablesTurnoverTTM: 0.35,
  assetTurnoverTTM: 0.4, evEbitdaTTM: 0.7, peTTM: 0.7, pb: 0.5,
};

const WATCHED: { key: string; label: string; unit: string; goodUp: boolean; group: string }[] = [
  { key: "eps", label: "Reported EPS", unit: "", goodUp: true, group: "Earnings" },
  { key: "salesPerShare", label: "Revenue per share", unit: "", goodUp: true, group: "Revenue" },
  { key: "grossMargin", label: "Gross margin", unit: "pp", goodUp: true, group: "Margins" },
  { key: "operatingMargin", label: "Operating margin", unit: "pp", goodUp: true, group: "Margins" },
  { key: "netMargin", label: "Net margin", unit: "pp", goodUp: true, group: "Margins" },
  { key: "fcfMargin", label: "Free cash flow margin", unit: "pp", goodUp: true, group: "Cash" },
  { key: "cashRatio", label: "Cash ratio", unit: "", goodUp: true, group: "Cash" },
  { key: "roeTTM", label: "Return on equity", unit: "pp", goodUp: true, group: "Profitability" },
  { key: "roicTTM", label: "Return on invested capital", unit: "pp", goodUp: true, group: "Profitability" },
  { key: "totalDebtToEquity", label: "Debt to equity", unit: "", goodUp: false, group: "Debt" },
  { key: "currentRatio", label: "Current ratio", unit: "", goodUp: true, group: "Debt" },
  { key: "peTTM", label: "P/E", unit: "×", goodUp: false, group: "Valuation" },
  { key: "evEbitdaTTM", label: "EV/EBITDA", unit: "×", goodUp: false, group: "Valuation" },
  { key: "inventoryTurnoverTTM", label: "Inventory turnover", unit: "×", goodUp: true, group: "Operations" },
];

export interface MaterialChange {
  key: string; label: string; group: string; unit: string;
  latest: number; prior: number; change: number; changePct: number | null;
  /** Change in standard deviations of this metric's own quarterly changes. */
  z: number; sd: number; n: number; period: string;
  better: boolean;
  /** 0–1, the ranking score. Our convention, stated in the claim. */
  materiality: number;
}

export function materialChanges(ctx: CompanyContext): MaterialChange[] {
  if (!ctx.metrics.ok) return [];
  const out: MaterialChange[] = [];

  for (const w of WATCHED) {
    const pts = clean(hist(ctx.metrics.data, w.key)).slice(0, 20);
    if (pts.length < 8) continue;
    const latest = pts[0].v, prior = pts[1].v;
    const change = latest - prior;
    if (change === 0) continue;

    const deltas: number[] = [];
    for (let i = 1; i < pts.length; i++) deltas.push(pts[i - 1].v - pts[i].v);
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const sd = Math.sqrt(deltas.reduce((a, d) => a + (d - mean) ** 2, 0) / Math.max(1, deltas.length - 1));
    if (!(sd > 0)) continue;

    const z = change / sd;
    const changePct = Math.abs(prior) > 1e-9 ? (change / Math.abs(prior)) * 100 : null;
    const importance = IMPORTANCE[w.key] ?? 0.5;

    // Statistical surprise, economic size, and what the line is worth knowing.
    const statistical = Math.min(1, Math.abs(z) / 3);
    const economic = Math.min(1, Math.abs(changePct ?? 0) / 25);
    const materiality = statistical * 0.5 + economic * 0.2 + importance * 0.3;

    out.push({
      key: w.key, label: w.label, group: w.group, unit: w.unit,
      latest, prior, change, changePct, z, sd, n: pts.length - 1,
      period: pts[0].period,
      better: (change > 0) === w.goodUp,
      materiality,
    });
  }

  return out.sort((a, b) => b.materiality - a.materiality);
}

/** Claims for the most material changes, plus the non-fundamental movements. */
export function changedClaims(ctx: CompanyContext, top = 5): Claim[] {
  const claims: Claim[] = [];
  const changes = materialChanges(ctx);

  if (changes.length === 0 && ctx.metrics.ok) {
    claims.push({
      text: "No tracked fundamental moved enough between the last two reported quarters to rank as material.",
      tier: "CALCULATION", confidence: 0.8,
      why: "Every watched metric was compared with the volatility of its own past changes; none scored above the reporting threshold. A quiet quarter is a finding, and padding it with the largest raw move would misrepresent it.",
      sources: [{ kind: "fundamental-history", label: "Quarterly fundamentals", detail: `${WATCHED.length} metrics checked`, asOf: ctx.builtAt, capability: "fundamental-history" }],
    });
  }

  for (const c of changes.slice(0, top)) {
    if (Math.abs(c.z) < 0.8) continue;
    claims.push({
      text: `${c.label} moved from ${c.prior.toFixed(2)}${c.unit} to ${c.latest.toFixed(2)}${c.unit} in the quarter to ${c.period.slice(0, 7)} — a ${Math.abs(c.z).toFixed(1)}σ ${c.better ? "improvement" : "deterioration"}${c.changePct !== null ? `, ${c.changePct >= 0 ? "+" : ""}${c.changePct.toFixed(0)}% in relative terms` : ""}.`,
      tier: "CALCULATION",
      confidence: 0.9,
      why: `Latest minus prior quarter over the standard deviation of the last ${c.n} quarterly changes in the same metric (±${c.sd.toFixed(2)}). Ranked by materiality — half the statistical surprise, a fifth the economic size, and three-tenths how much the line matters to a shareholder. Those weights are our convention, not a standard.`,
      sources: [{
        kind: "fundamental-history", label: `${c.label} history`,
        detail: seriesDetail(hist(ctx.metrics.ok ? ctx.metrics.data : undefined, c.key), 8, c.unit === "pp" ? "%" : c.unit),
        asOf: ctx.builtAt, metricKey: c.key, raw: c.latest, unit: c.unit, capability: "fundamental-history",
      }],
      calculation: {
        expression: `(${c.latest.toFixed(2)} − ${c.prior.toFixed(2)}) ÷ ${c.sd.toFixed(2)}`,
        inputs: [
          { label: "latest quarter", metricKey: c.key, value: c.latest },
          { label: "prior quarter", metricKey: c.key, value: c.prior },
          { label: "σ of quarterly changes", value: c.sd },
          { label: "materiality score", value: c.materiality },
        ],
        result: c.z, unit: "σ", n: c.n,
      },
    });
  }

  // Multi-quarter direction, so one quarter is not mistaken for a turn.
  if (ctx.metrics.ok) {
    const nm = trend(hist(ctx.metrics.data, "netMargin"), 8);
    if (nm) {
      claims.push({
        text: `Over eight quarters net margin has moved ${nm.change >= 0 ? "up" : "down"} ${Math.abs(nm.change).toFixed(2)}pp overall, ${consistencyWord(nm.consistency)}.`,
        tier: "CALCULATION", confidence: 0.85,
        why: `Newest against oldest across ${nm.n} quarters, with the share of steps moving the same way as the total (${(nm.consistency * 100).toFixed(0)}%). A steady drift and a noisy series with the same endpoints are different findings.`,
        sources: [{ kind: "fundamental-history", label: "Net margin history", detail: seriesDetail(hist(ctx.metrics.data, "netMargin"), 8, "%"), asOf: ctx.builtAt, metricKey: "netMargin", capability: "fundamental-history" }],
        calculation: {
          expression: `${nm.last.v.toFixed(2)} − ${nm.first.v.toFixed(2)}`,
          inputs: [
            { label: `newest (${nm.last.period.slice(0, 7)})`, metricKey: "netMargin", value: nm.last.v },
            { label: `oldest (${nm.first.period.slice(0, 7)})`, metricKey: "netMargin", value: nm.first.v },
          ],
          result: nm.change, unit: "pp", n: nm.n,
        },
      });
    }
  }

  // The latest print against consensus.
  if (ctx.earnings.ok) {
    const e = (ctx.earnings.data as EarningsPoint[])[0];
    if (e && e.actual !== null && e.estimate !== null) {
      claims.push({
        text: `Most recent print (${e.period}): EPS ${e.actual} against consensus ${e.estimate}, a ${(e.surprisePercent ?? 0) >= 0 ? "beat" : "miss"} of ${Math.abs(e.surprisePercent ?? 0).toFixed(1)}%.`,
        tier: "FACT", confidence: 1,
        why: "Reported actual and the consensus it was measured against, repeated as published.",
        sources: [{ kind: "earnings", label: "Earnings surprise", detail: (ctx.earnings.data as EarningsPoint[]).slice(0, 4).map((x) => `${x.period}: ${x.actual} vs ${x.estimate}`).join(" · "), asOf: ctx.builtAt, capability: "earnings-surprises" }],
      });
    }
  }

  // Analyst mix.
  if (ctx.recommendations.ok) {
    const recs = ctx.recommendations.data as Recommendation[];
    if (recs.length >= 2) {
      const now = recs[0], prev = recs[recs.length - 1];
      const bull = (r: Recommendation) => r.strongBuy + r.buy;
      const d = bull(now) - bull(prev);
      if (d !== 0) {
        claims.push({
          text: `Buy-side ratings went from ${bull(prev)} to ${bull(now)} between ${prev.period} and ${now.period}.`,
          tier: "FACT", confidence: 1,
          why: "Recommendation counts as published by the contributing analysts.",
          sources: [{ kind: "analysts", label: "Analyst ratings", detail: recs.slice(0, 4).map((r) => `${r.period}: ${r.strongBuy}/${r.buy}/${r.hold}/${r.sell}/${r.strongSell}`).join(" · "), asOf: ctx.builtAt, capability: "analyst-ratings" }],
        });
      }
    }
  }

  // Insider direction over the window we hold.
  if (ctx.insider.ok) {
    const txs = (ctx.insider.data.data ?? []) as InsiderTx[];
    const net = txs.slice(0, 60).reduce((a, t) => a + (t.change ?? 0), 0);
    if (txs.length > 0) {
      claims.push({
        text: `Insiders were net ${net >= 0 ? "buyers" : "sellers"} of ${Math.abs(net).toLocaleString()} shares across the last ${Math.min(60, txs.length)} filings.`,
        tier: "FACT", confidence: 1,
        why: "Summed from reported transaction filings. Sales frequently reflect scheduled 10b5-1 plans or tax events rather than a view on the business, so direction alone carries little signal.",
        sources: [{ kind: "insider", label: "Insider transactions", detail: txs.slice(0, 4).map((t) => `${t.name ?? "?"} ${(t.change ?? 0) > 0 ? "+" : ""}${t.change ?? "?"} on ${t.transactionDate ?? "?"}`).join(" · "), asOf: ctx.builtAt, capability: "insider-transactions" }],
      });
    }
  }

  // Valuation movement, which is a change in what the market pays rather than
  // in the business — kept separate for that reason.
  if (ctx.metrics.ok) {
    const pe = num(ctx.metrics.data, "peTTM");
    const t = trend(hist(ctx.metrics.data, "peTTM"), 4);
    if (pe !== null && t && Math.abs(t.changePct ?? 0) > 5) {
      claims.push({
        text: `The multiple itself has re-rated: P/E moved ${t.changePct !== null ? `${t.changePct >= 0 ? "+" : ""}${t.changePct.toFixed(0)}%` : ""} over four quarters, to ${pe.toFixed(1)}×.`,
        tier: "CALCULATION", confidence: 0.85,
        why: "A change in what the market pays for the same earnings, rather than a change in the business. Reported separately for that reason.",
        sources: [{ kind: "fundamental-history", label: "P/E history", detail: seriesDetail(hist(ctx.metrics.data, "peTTM"), 6, "×"), asOf: ctx.builtAt, metricKey: "peTTM", capability: "fundamental-history" }],
        calculation: {
          expression: `(${t.last.v.toFixed(2)} − ${t.first.v.toFixed(2)}) ÷ |${t.first.v.toFixed(2)}| × 100`,
          inputs: [
            { label: "latest P/E", metricKey: "peTTM", value: t.last.v },
            { label: "four quarters ago", metricKey: "peTTM", value: t.first.v },
          ],
          result: t.changePct ?? 0, unit: "%", n: t.n,
        },
      });
    }
  }

  return claims;
}
