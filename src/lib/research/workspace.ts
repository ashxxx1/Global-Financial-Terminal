/**
 * The research workspace.
 *
 * One company, one context, every section built from it. The point is that the
 * valuation panel, the timeline and the peer table are reading the same numbers
 * fetched at the same instant — not eleven widgets each going off to fetch on
 * their own and quietly disagreeing about what the latest quarter was.
 *
 * Sections are assembled lazily by section id so opening the workspace does not
 * compute eleven analyses the user may never scroll to, but they all share the
 * context, so nothing refetches.
 */
import { buildContext, contextAge, contextFailures, CONTEXT_CAPABILITIES, type CompanyContext } from "./context";
import { gapFor, gapsFor, type ResearchGap } from "./gaps";
import { buildTimeline, earningsReactionHistory, type TimelineEvent } from "./analyzers/timeline";
import { comparePeers, type PeerComparison } from "./analyzers/peers";
import { changedClaims } from "./analyzers/changedDeep";
import { analyzeMoving, analyzeValuationHistory, analyzeMomentum, analyzeRisks } from "./analyzers";
import type { Answer, Claim } from "./types";
import type { CapabilityId } from "./capabilities";
import type { NewsItem, Filing, Recommendation, InsiderTx } from "./data";
import { num } from "./data";

export type SectionId =
  | "moving" | "changed" | "valuation" | "momentum" | "risks"
  | "news" | "fundamentals" | "analysts" | "filings" | "insider" | "peers";

export const SECTIONS: { id: SectionId; label: string; blurb: string; needs: CapabilityId[] }[] = [
  { id: "moving",       label: "Why it's moving",  blurb: "Today's move, sized against its own range and separated from its sector.", needs: ["quote", "price-history", "company-news"] },
  { id: "changed",      label: "What changed",     blurb: "The most material movements in the latest reported quarter.",             needs: ["fundamental-history", "earnings-surprises"] },
  { id: "valuation",    label: "Valuation",        blurb: "Today's multiples inside the company's own historical range.",            needs: ["fundamentals", "fundamental-history"] },
  { id: "momentum",     label: "Earnings",         blurb: "Surprise history, reported EPS trend and the analyst rating mix.",        needs: ["earnings-surprises", "analyst-ratings"] },
  { id: "risks",        label: "Key risks",        blurb: "Leverage, liquidity and margins against this company's own past.",        needs: ["fundamentals", "fundamental-history"] },
  { id: "peers",        label: "Peers",            blurb: "Comparable companies, and whether the valuation gap has support.",        needs: ["peers", "fundamentals"] },
  { id: "news",         label: "News",             blurb: "Recent coverage, as published.",                                          needs: ["company-news"] },
  { id: "fundamentals", label: "Fundamentals",     blurb: "The reported figures behind everything else.",                            needs: ["fundamentals"] },
  { id: "analysts",     label: "Analysts",         blurb: "Rating distribution and how it has shifted.",                             needs: ["analyst-ratings"] },
  { id: "filings",      label: "Filings",          blurb: "Periodic and material-event filings, linked to source.",                  needs: ["sec-filings"] },
  { id: "insider",      label: "Insiders",         blurb: "Reported officer and director transactions.",                             needs: ["insider-transactions"] },
];

export interface Section {
  id: SectionId;
  label: string;
  claims: Claim[];
  gaps: ResearchGap[];
  /** Free-form rows for the reference sections (news, filings, insiders). */
  rows?: { primary: string; secondary?: string; meta?: string; url?: string }[];
  table?: { label: string; values: (number | null)[]; unit?: string };
}

export interface Workspace {
  ctx: CompanyContext;
  timeline: TimelineEvent[];
  freshness: { oldestMs: number; anyStale: boolean; builtAt: number };
  /** Everything the workspace as a whole could not obtain. */
  gaps: ResearchGap[];
}

export async function openWorkspace(symbol: string): Promise<Workspace> {
  const ctx = await buildContext(symbol);
  const failures = contextFailures(ctx);
  const age = contextAge(ctx);

  // Gaps from declared-unavailable capabilities, plus anything that failed at
  // fetch time. Both are real holes; the user should not have to tell them apart.
  const declared = gapsFor([
    "eps-estimates", "revenue-estimates", "price-targets",
    "earnings-transcripts", "options-positioning", "filing-text",
  ]);
  const runtime = failures
    .filter((f) => CONTEXT_CAPABILITIES.includes(f.capability))
    .map((f) => ({ ...gapFor(f.capability, "blocking"), missing: `${gapFor(f.capability).missing} (${f.reason})` }));

  return {
    ctx,
    timeline: buildTimeline(ctx),
    freshness: { ...age, builtAt: ctx.builtAt },
    gaps: [...runtime, ...declared],
  };
}

/** Build one section against an already-open workspace. */
export async function buildSection(ws: Workspace, id: SectionId): Promise<Section> {
  const { ctx } = ws;
  const def = SECTIONS.find((s) => s.id === id)!;
  const gaps = gapsFor(def.needs);
  const base = { id, label: def.label, gaps };

  switch (id) {
    case "moving":    return { ...base, claims: (await analyzeMoving(ctx.symbol)).claims };
    case "valuation": return { ...base, claims: (await analyzeValuationHistory(ctx.symbol)).claims };
    case "momentum":  return { ...base, claims: [...(await analyzeMomentum(ctx.symbol)).claims, ...reactionClaims(ctx)] };
    case "risks":     return { ...base, claims: (await analyzeRisks(ctx.symbol)).claims };
    case "changed":   return { ...base, claims: changedClaims(ctx) };
    case "peers": {
      const cmp: PeerComparison = await comparePeers(ctx);
      return { ...base, claims: cmp.claims };
    }
    case "news":
      return {
        ...base, claims: [],
        rows: ctx.news.ok
          ? (ctx.news.data as NewsItem[]).slice(0, 20).map((n) => ({
              primary: n.headline,
              secondary: n.source,
              meta: new Date(n.datetime * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC",
              url: n.url,
            }))
          : [],
      };
    case "filings":
      return {
        ...base, claims: [],
        rows: ctx.filings.ok
          ? (ctx.filings.data as Filing[]).slice(0, 25).map((f) => ({
              primary: f.form || "Filing",
              secondary: f.filedDate || "",
              meta: f.acceptedDate || "",
              url: f.reportUrl || f.filingUrl,
            }))
          : [],
      };
    case "insider":
      return {
        ...base, claims: [],
        rows: ctx.insider.ok
          ? ((ctx.insider.data.data ?? []) as InsiderTx[]).slice(0, 25).map((t) => ({
              primary: t.name || "—",
              secondary: `${(t.change ?? 0) > 0 ? "+" : ""}${(t.change ?? 0).toLocaleString()} shares`,
              meta: t.transactionDate || t.filingDate || "",
            }))
          : [],
      };
    case "analysts":
      return {
        ...base, claims: [],
        rows: ctx.recommendations.ok
          ? (ctx.recommendations.data as Recommendation[]).map((r) => ({
              primary: r.period,
              secondary: `${r.strongBuy} strong buy · ${r.buy} buy · ${r.hold} hold · ${r.sell} sell · ${r.strongSell} strong sell`,
            }))
          : [],
      };
    case "fundamentals":
      return {
        ...base, claims: [],
        rows: ctx.metrics.ok
          ? [
              ["P/E (trailing)", "peTTM"], ["P/E (forward)", "forwardPE"], ["PEG", "pegTTM"],
              ["P/S", "psTTM"], ["P/B", "pb"], ["EV/EBITDA", "evEbitdaTTM"],
              ["Gross margin %", "grossMarginTTM"], ["Operating margin %", "operatingMarginTTM"],
              ["Net margin %", "netProfitMarginTTM"], ["ROE %", "roeTTM"], ["ROA %", "roaTTM"],
              ["Revenue growth %", "revenueGrowthTTMYoy"], ["EPS growth %", "epsGrowthTTMYoy"],
              ["Debt/equity", "totalDebt/totalEquityQuarterly"], ["Current ratio", "currentRatioQuarterly"],
              ["Beta", "beta"], ["52w high", "52WeekHigh"], ["52w low", "52WeekLow"],
            ].map(([label, key]) => {
              const v = num(ctx.metrics.ok ? ctx.metrics.data : undefined, key);
              return { primary: label, secondary: v === null ? "—" : v.toFixed(2), meta: key };
            })
          : [],
      };
    default:
      return { ...base, claims: [] };
  }
}

/**
 * How the stock has behaved after past surprises — the historical context that
 * makes an earnings section useful rather than descriptive.
 */
function reactionClaims(ctx: CompanyContext): Claim[] {
  const h = earningsReactionHistory(ctx);
  if (h.rows.length < 3) return [];
  const beats = h.rows.filter((r) => r.surprisePct > 0 && r.dayPct !== null);
  const misses = h.rows.filter((r) => r.surprisePct <= 0 && r.dayPct !== null);
  if (beats.length + misses.length < 3) return [];

  return [{
    text: h.medianDayAfterBeat !== null
      ? `After its last ${beats.length} beat${beats.length === 1 ? "" : "s"} the stock moved a median ${h.medianDayAfterBeat >= 0 ? "+" : ""}${h.medianDayAfterBeat.toFixed(1)}% on the day${misses.length ? `, against ${h.medianDayAfterMiss !== null ? `${h.medianDayAfterMiss >= 0 ? "+" : ""}${h.medianDayAfterMiss.toFixed(1)}%` : "—"} after ${misses.length} miss${misses.length === 1 ? "" : "es"}` : ""}.`
      : `We have price reactions for ${misses.length} miss${misses.length === 1 ? "" : "es"} but no beats in the window.`,
    tier: "CALCULATION",
    confidence: 0.75,
    why: `Median close-to-close move on the first session at or after each reported period, split by whether the print beat or missed. Only ${h.rows.length} periods are available from this dataset, so this is a small sample and describes what happened, not what will.`,
    sources: [{
      kind: "earnings", label: "Reaction history",
      detail: h.rows.map((r) => `${r.period}: surprise ${r.surprisePct >= 0 ? "+" : ""}${r.surprisePct.toFixed(1)}%, day ${r.dayPct === null ? "—" : `${r.dayPct >= 0 ? "+" : ""}${r.dayPct.toFixed(1)}%`}`).join(" · "),
      asOf: ctx.builtAt, capability: "earnings-surprises",
    }],
    calculation: {
      expression: `median(day moves after beats) vs median(day moves after misses)`,
      inputs: [
        ...(h.medianDayAfterBeat !== null ? [{ label: "median after beat", value: h.medianDayAfterBeat }] : []),
        ...(h.medianDayAfterMiss !== null ? [{ label: "median after miss", value: h.medianDayAfterMiss }] : []),
      ],
      result: h.medianDayAfterBeat ?? h.medianDayAfterMiss ?? 0,
      unit: "% on the day", n: h.rows.length,
    },
  }];
}

/** Re-exported so the panel can render an Answer or a Section uniformly. */
export type { Answer };
