/**
 * Company research timeline.
 *
 * Every dataset we hold is a stream of dated events, and they are far more
 * useful interleaved than in separate panels. A filing three days before an
 * insider sale, an earnings beat that the stock fell on — those are the shapes
 * a research workflow is looking for, and no single panel can show them.
 *
 * Each event carries the market's reaction measured from price history, which
 * is the part that turns "what happened" into "what changed". The reaction is
 * a FACT about price; whether the event caused it is not, and the analyzers
 * never claim otherwise.
 */
import { historyFor } from "../../market";
import type { CompanyContext } from "../context";
import type { Source } from "../types";
import type { EarningsPoint, NewsItem, Filing, Recommendation, InsiderTx } from "../data";

export type EventKind = "earnings" | "filing" | "insider" | "rating" | "news";

export interface MarketReaction {
  /** Close-to-close move on the first session on or after the event. */
  dayPct: number | null;
  /** Move over the following five sessions. */
  weekPct: number | null;
  /** How the reaction was measured, for the evidence panel. */
  basis: string;
}

export interface TimelineEvent {
  id: string;
  at: number;
  kind: EventKind;
  title: string;
  detail: string;
  /**
   * 0–1. Used for ranking and filtering, never presented as importance in
   * itself — it is our convention, and the UI says so.
   */
  weight: number;
  sources: Source[];
  reaction?: MarketReaction;
  url?: string;
}

/** Price reaction around a timestamp, from our own candle history. */
function reactionAt(symbol: string, at: number): MarketReaction | undefined {
  const { candles } = historyFor(symbol, "1Y");
  if (candles.length < 10) return undefined;

  // First session on or after the event.
  const i = candles.findIndex((c) => c.t >= at);
  if (i <= 0) return undefined;

  const prior = candles[i - 1].c;
  const onDay = candles[i].c;
  const dayPct = prior > 0 ? ((onDay - prior) / prior) * 100 : null;

  const j = Math.min(i + 5, candles.length - 1);
  const weekPct = j > i && onDay > 0 ? ((candles[j].c - onDay) / onDay) * 100 : null;

  return {
    dayPct,
    weekPct,
    basis: `Close on the first session at or after the event (${new Date(candles[i].t).toISOString().slice(0, 10)}) against the prior close, then the following ${j - i} sessions.`,
  };
}

export function buildTimeline(ctx: CompanyContext, limit = 40): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const push = (e: TimelineEvent) => { if (Number.isFinite(e.at) && e.at > 0) events.push(e); };

  // Earnings — the highest-weight events we hold.
  if (ctx.earnings.ok) {
    for (const e of ctx.earnings.data as EarningsPoint[]) {
      const at = Date.parse(e.period);
      const sp = e.surprisePercent;
      push({
        id: `earn-${e.period}`,
        at, kind: "earnings",
        title: `Earnings ${sp === null ? "reported" : sp >= 0 ? "beat" : "miss"}${sp === null ? "" : ` ${Math.abs(sp).toFixed(1)}%`}`,
        detail: `EPS ${e.actual ?? "—"} against consensus ${e.estimate ?? "—"}.`,
        weight: sp === null ? 0.6 : Math.min(1, 0.6 + Math.abs(sp) / 40),
        sources: [{
          kind: "earnings", label: "Earnings surprise",
          detail: `${e.period}: actual ${e.actual}, estimate ${e.estimate}, surprise ${sp?.toFixed(2) ?? "—"}%`,
          asOf: at, capability: "earnings-surprises",
          raw: e.actual ?? undefined,
        }],
      });
    }
  }

  // Analyst rating changes — only when the mix actually moved.
  if (ctx.recommendations.ok) {
    const recs = ctx.recommendations.data as Recommendation[];
    for (let i = 0; i < recs.length - 1; i++) {
      const now = recs[i], prev = recs[i + 1];
      const bull = (r: Recommendation) => r.strongBuy + r.buy;
      const delta = bull(now) - bull(prev);
      if (delta === 0) continue;
      const at = Date.parse(now.period);
      push({
        id: `rating-${now.period}`,
        at, kind: "rating",
        title: `Analyst buy ratings ${delta > 0 ? "rose" : "fell"} ${Math.abs(delta)}`,
        detail: `${bull(prev)} → ${bull(now)} buy-side ratings between ${prev.period} and ${now.period}.`,
        weight: Math.min(0.8, 0.3 + Math.abs(delta) / 20),
        sources: [{
          kind: "analysts", label: "Analyst ratings",
          detail: `${now.period}: ${now.strongBuy}/${now.buy}/${now.hold}/${now.sell}/${now.strongSell} (strong buy/buy/hold/sell/strong sell)`,
          asOf: at, capability: "analyst-ratings",
        }],
      });
    }
  }

  // Filings — periodic and material-event forms only; the rest is noise.
  if (ctx.filings.ok) {
    for (const f of (ctx.filings.data as Filing[]).slice(0, 40)) {
      const form = f.form || "";
      if (!/^(10-K|10-Q|8-K)/i.test(form)) continue;
      const at = Date.parse(f.filedDate || f.acceptedDate || "");
      push({
        id: `filing-${f.accessNumber || form + at}`,
        at, kind: "filing",
        title: `${form} filed`,
        detail: /10-K/i.test(form) ? "Annual report." : /10-Q/i.test(form) ? "Quarterly report." : "Material event disclosure.",
        weight: /10-K/i.test(form) ? 0.7 : /10-Q/i.test(form) ? 0.6 : 0.4,
        url: f.reportUrl || f.filingUrl,
        sources: [{
          kind: "filing", label: form,
          detail: `${form} filed ${f.filedDate}`,
          asOf: at, url: f.reportUrl || f.filingUrl, capability: "sec-filings",
        }],
      });
    }
  }

  // Insider transactions — aggregated per day, since a single filing often
  // produces a dozen lines that would otherwise flood the timeline.
  if (ctx.insider.ok) {
    const txs = (ctx.insider.data.data ?? []) as InsiderTx[];
    const byDay = new Map<string, { net: number; count: number; names: Set<string> }>();
    for (const t of txs.slice(0, 120)) {
      const d = t.transactionDate || t.filingDate;
      if (!d) continue;
      const cur = byDay.get(d) ?? { net: 0, count: 0, names: new Set<string>() };
      cur.net += t.change ?? 0;
      cur.count++;
      if (t.name) cur.names.add(t.name);
      byDay.set(d, cur);
    }
    for (const [day, agg] of byDay) {
      if (agg.net === 0) continue;
      const at = Date.parse(day);
      push({
        id: `insider-${day}`,
        at, kind: "insider",
        title: `Insiders net ${agg.net > 0 ? "bought" : "sold"} ${Math.abs(agg.net).toLocaleString()} shares`,
        detail: `${agg.count} transaction${agg.count === 1 ? "" : "s"} across ${agg.names.size} insider${agg.names.size === 1 ? "" : "s"}. Sales often reflect scheduled 10b5-1 plans rather than a view on the business.`,
        weight: Math.min(0.6, 0.2 + agg.count / 30),
        sources: [{
          kind: "insider", label: "Insider filings",
          detail: `${day}: net ${agg.net > 0 ? "+" : ""}${agg.net} shares over ${agg.count} transactions (${[...agg.names].slice(0, 3).join(", ")})`,
          asOf: at, capability: "insider-transactions",
        }],
      });
    }
  }

  // News — capped, because 250 headlines would bury everything else.
  if (ctx.news.ok) {
    for (const n of (ctx.news.data as NewsItem[]).slice(0, 12)) {
      const at = n.datetime * 1000;
      push({
        id: `news-${n.datetime}-${n.headline.slice(0, 20)}`,
        at, kind: "news",
        // Wire headlines run to several hundred characters and would dominate
        // the rail; the full text stays in `detail` and on the source link.
        title: n.headline.length > 110 ? `${n.headline.slice(0, 108)}…` : n.headline,
        detail: n.summary?.slice(0, 200) || n.source || "",
        weight: 0.3,
        url: n.url,
        sources: [{
          kind: "news", label: n.source || "News",
          detail: n.headline, asOf: at, url: n.url, capability: "company-news",
        }],
      });
    }
  }

  // Attach the market's reaction to the events where it is meaningful. News is
  // excluded: at a dozen headlines a day the attribution would be noise.
  for (const e of events) {
    if (e.kind === "news") continue;
    e.reaction = reactionAt(ctx.symbol, e.at);
  }

  // Select by weight, then present chronologically.
  //
  // Slicing the most recent N looks like the obvious thing and is wrong: this
  // company publishes a dozen headlines a day, so a straight date sort buries
  // every earnings print and filing under market-wrap noise. Rank first so the
  // material events survive the cut, then restore date order for reading.
  const byWeight = [...events].sort((a, b) => b.weight - a.weight || b.at - a.at);
  const kept = byWeight.slice(0, limit);
  return kept.sort((a, b) => b.at - a.at);
}

/**
 * How the stock behaved after previous surprises of the same sign.
 *
 * This is the historical-context question that matters most around earnings:
 * not "did it beat" but "when it beat before, what happened next".
 */
export function earningsReactionHistory(ctx: CompanyContext): {
  rows: { period: string; surprisePct: number; dayPct: number | null; weekPct: number | null }[];
  medianDayAfterBeat: number | null;
  medianDayAfterMiss: number | null;
} {
  const rows: { period: string; surprisePct: number; dayPct: number | null; weekPct: number | null }[] = [];
  if (ctx.earnings.ok) {
    for (const e of ctx.earnings.data as EarningsPoint[]) {
      if (typeof e.surprisePercent !== "number") continue;
      const r = reactionAt(ctx.symbol, Date.parse(e.period));
      rows.push({ period: e.period, surprisePct: e.surprisePercent, dayPct: r?.dayPct ?? null, weekPct: r?.weekPct ?? null });
    }
  }
  const med = (xs: number[]) => {
    if (xs.length === 0) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return {
    rows,
    medianDayAfterBeat: med(rows.filter((r) => r.surprisePct > 0 && r.dayPct !== null).map((r) => r.dayPct as number)),
    medianDayAfterMiss: med(rows.filter((r) => r.surprisePct <= 0 && r.dayPct !== null).map((r) => r.dayPct as number)),
  };
}
