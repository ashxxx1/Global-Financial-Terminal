/**
 * The evidence model for the research copilot.
 *
 * The rule this file makes structurally impossible to break: a claim cannot be
 * rendered without its tier and its sources, because they are not optional
 * fields. Confidence is never a mood — every analyzer computes it from
 * something stated in `why`, and if it cannot, it must not emit the claim.
 *
 * A CALCULATION additionally carries its `Calculation`: the inputs by metric
 * key, the expression, and the result. That is the difference between citing a
 * dataset and being reproducible — a reader can recompute the number by hand
 * from what the evidence panel shows them.
 */
import type { CapabilityId } from "./capabilities";

export type Tier = "FACT" | "CALCULATION" | "INFERENCE" | "OPINION";

export const TIER_MEANING: Record<Tier, string> = {
  FACT: "Reported by a primary source and repeated verbatim.",
  CALCULATION: "Arithmetic on the facts listed — the inputs and expression are shown, so you can recompute it.",
  INFERENCE: "A reasoned connection between facts. The facts can be right and this still wrong.",
  OPINION: "A judgement the data supports but does not establish.",
};

export type SourceKind =
  | "market" | "fundamentals" | "fundamental-history" | "earnings" | "news"
  | "filing" | "analysts" | "insider" | "peers";

/** One retrievable data point, identified precisely enough to look up again. */
export interface Source {
  kind: SourceKind;
  label: string;
  /** The precise figure or text this claim rests on. */
  detail: string;
  /** When the underlying datum was reported — not when we fetched it. */
  asOf: number;
  /** The provider's own field name, e.g. "peTTM". Makes the trail exact. */
  metricKey?: string;
  /** The raw value before any formatting. */
  raw?: number;
  unit?: string;
  url?: string;
  /** Which capability served this, so the trail survives a provider swap. */
  capability?: CapabilityId;
  /**
   * Set when the instrument has no usable price — either a feed covers it and
   * has not answered, or none reaches it at all. Previously named `simulated`,
   * which stopped being true when the price simulation was removed: the
   * evidence panel was telling readers a claim rested on a simulated price
   * where in fact there was no price.
   */
  unpriced?: boolean;
}

/** A reproducible computation: inputs in, expression, result out. */
export interface Calculation {
  expression: string;
  inputs: { label: string; metricKey?: string; value: number; asOf?: number }[];
  result: number;
  unit: string;
  /** Sample size, when the result is a statistic over history. */
  n?: number;
}

export interface Claim {
  text: string;
  tier: Tier;
  /** 0..1. Must be justified by `why`. */
  confidence: number;
  why: string;
  sources: Source[];
  /** Required in spirit for CALCULATION claims; the UI shows it when present. */
  calculation?: Calculation;
}

export type Mode =
  | "moving" | "changed" | "valuation" | "momentum" | "risks"
  | "market" | "portfolio" | "macro";

export const MODES: { id: Mode; label: string; question: string; blurb: string }[] = [
  { id: "moving",    label: "Why moving",   question: "Why is this stock moving?",     blurb: "Separates the company's own move from its sector, sizes it against its normal range, and lists the news without claiming it caused anything." },
  { id: "changed",   label: "What changed", question: "What changed?",                 blurb: "Compares the latest reported quarter against the company's own recent history across margins, returns and leverage." },
  { id: "valuation", label: "Valuation",    question: "Is this valuation expensive?",  blurb: "Places today's multiples inside the company's own historical range, rather than calling a number high in the abstract." },
  { id: "momentum",  label: "Earnings",     question: "Is earnings momentum improving?", blurb: "Earnings surprise history, the reported EPS trend and how analyst ratings have shifted." },
  { id: "risks",     label: "Key risks",    question: "What are the key risks?",       blurb: "Leverage, liquidity, margin direction and concentration — each measured against the company's own past." },
  { id: "market",    label: "Market",       question: "What is the market doing?",     blurb: "Breadth and sector leadership across instruments that are actually on a live feed." },
  { id: "portfolio", label: "Watchlist",    question: "How is my watchlist doing?",    blurb: "Concentration and today's moves across the names you follow." },
  { id: "macro",     label: "Macro",        question: "What is the macro backdrop?",   blurb: "Cross-asset levels, each labelled with its true source." },
];

export interface Answer {
  title: string;
  mode: Mode;
  headline: string;
  claims: Claim[];
  /** What we could not see. Populated from the capability registry and real
   *  empty datasets, never boilerplate. */
  caveats: string[];
  asOf: number;
  suggestions: string[];
  /** Set when the question asked for something unavailable. */
  unavailable?: { label: string; note: string }[];
  table?: { label: string; a: number | null; b: number | null }[];
  /** Column labels for the comparison table (e.g. { a: "AAPL", b: "MSFT" }). */
  tableColumns?: { a: string; b: string };
}

/** The weakest tier present — an answer is only as strong as its softest claim. */
export function weakestTier(claims: Claim[]): Tier {
  const order: Tier[] = ["FACT", "CALCULATION", "INFERENCE", "OPINION"];
  return claims.reduce<Tier>((w, c) =>
    order.indexOf(c.tier) > order.indexOf(w) ? c.tier : w, "FACT");
}

/** Overall confidence is the weakest link, not the average — averaging lets
 *  three trivia facts drown out the one shaky inference the answer rests on. */
export function overallConfidence(claims: Claim[]): number {
  if (claims.length === 0) return 0;
  return Math.min(...claims.map((c) => c.confidence));
}
