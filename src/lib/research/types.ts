/**
 * The evidence model for the research copilot.
 *
 * The rule this file exists to make structurally impossible to break: a claim
 * cannot be rendered without its tier and its sources, because they are not
 * optional fields. Confidence is never a mood — every analyzer computes it from
 * something stated in `why`, and if it cannot, it must not emit the claim.
 */

/**
 * The epistemic tier of a statement. The spec's central requirement is that an
 * inference is never presented as an established fact, so this is carried on
 * every claim and always rendered.
 */
export type Tier =
  /** Reported by a primary source. We are repeating it, not deriving it. */
  | "FACT"
  /** Arithmetic we performed on facts. Reproducible from the sources shown. */
  | "CALCULATION"
  /** A reasoned link between facts. Could be wrong even when the facts are right. */
  | "INFERENCE"
  /** A judgement. Not derivable from the data alone. Always the weakest tier. */
  | "OPINION";

export const TIER_MEANING: Record<Tier, string> = {
  FACT: "Reported by a primary source and repeated verbatim.",
  CALCULATION: "Arithmetic on the facts listed — reproducible from them.",
  INFERENCE: "A reasoned connection between facts. The facts can be right and this still wrong.",
  OPINION: "A judgement that the data supports but does not establish.",
};

export type SourceKind =
  | "market" | "fundamentals" | "earnings" | "news"
  | "filing" | "analysts" | "insider" | "peers";

/** One retrievable data point. `detail` is the exact value used, for evidence. */
export interface Source {
  kind: SourceKind;
  /** Short label shown as a chip, e.g. "Q3 Earnings" or "SEC 10-Q". */
  label: string;
  /** The precise figure or text this claim rests on. */
  detail: string;
  /** When the underlying datum was reported — not when we fetched it. */
  asOf: number;
  url?: string;
  /** Set when the number came from the simulation rather than a live feed. */
  simulated?: boolean;
}

export interface Claim {
  text: string;
  tier: Tier;
  /** 0..1. Must be justified by `why`. */
  confidence: number;
  /** How the confidence was arrived at. Shown under Show Evidence. */
  why: string;
  sources: Source[];
}

export type Mode =
  | "company" | "market" | "portfolio" | "macro" | "trade" | "earnings";

export const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "company",   label: "Company",   blurb: "One business: what moved it, what it is worth, what could break it." },
  { id: "market",    label: "Market",    blurb: "Breadth, leadership and where today's move actually came from." },
  { id: "portfolio", label: "Portfolio", blurb: "Your watchlist: concentration, correlation and what needs attention." },
  { id: "macro",     label: "Macro",     blurb: "Rates, inflation and currency context behind the tape." },
  { id: "trade",     label: "Trade idea", blurb: "A thesis stated with its disconfirming evidence attached." },
  { id: "earnings",  label: "Earnings",  blurb: "Surprise history, revision trend and what the print changed." },
];

export interface Answer {
  title: string;
  mode: Mode;
  /** One-line summary. Always the weakest tier among its claims. */
  headline: string;
  claims: Claim[];
  /**
   * What we could not see. Populated from real 403s and empty datasets, never
   * boilerplate — a caveat that is always the same is one nobody reads.
   */
  caveats: string[];
  asOf: number;
  /** Follow-ups the data actually supports answering. */
  suggestions: string[];
}

/** The weakest tier present — an answer is only as strong as its softest claim. */
export function weakestTier(claims: Claim[]): Tier {
  const order: Tier[] = ["FACT", "CALCULATION", "INFERENCE", "OPINION"];
  return claims.reduce<Tier>((w, c) =>
    order.indexOf(c.tier) > order.indexOf(w) ? c.tier : w, "FACT");
}

/** Overall confidence: the weakest link, not the average — averaging lets three
 *  trivia facts drown out the one shaky inference the conclusion rests on. */
export function overallConfidence(claims: Claim[]): number {
  if (claims.length === 0) return 0;
  return Math.min(...claims.map((c) => c.confidence));
}
