/**
 * Research gaps.
 *
 * A caveat saying "transcripts unavailable" tells a user a fact about our
 * plan. What they actually need to know is what conclusion they therefore
 * cannot draw, and what they can look at instead. A gap is that three-part
 * statement, structured so the UI can render it consistently and so the test
 * suite can assert on it:
 *
 *   missing      Forward EPS estimates
 *   blocks       whether consensus expectations are rising or falling
 *   instead      realised earnings-surprise trend + analyst rating changes
 *
 * The difference matters. The alternative is not a substitute — a company can
 * beat consensus for four quarters while analysts cut the year ahead — so the
 * `difference` line is mandatory, not decorative.
 */
import { CAPABILITIES, type CapabilityId, type Capability } from "./capabilities";

export interface ResearchGap {
  capability: CapabilityId;
  /** What we do not have. */
  missing: string;
  /** The specific question this makes unanswerable. */
  blocks: string;
  /** What we can answer instead, and how it differs. Null when nothing does. */
  instead: { capability: CapabilityId; label: string; difference: string } | null;
  severity: "blocking" | "limiting";
  availability: Capability["availability"];
}

/**
 * What each absent capability actually prevents. Written per capability rather
 * than generated, because "blocks" is a claim about analysis, not about data.
 */
const BLOCKS: Partial<Record<CapabilityId, string>> = {
  "eps-estimates": "whether consensus expectations for future quarters are rising or falling, and therefore whether the market's forward view is improving",
  "revenue-estimates": "what revenue the market expects next year, and whether that expectation is being revised",
  "price-targets": "where analysts think the price should be, and whether those targets are moving",
  "earnings-transcripts": "what management actually said — guidance language, tone, and the analyst Q&A that often moves the stock more than the printed numbers",
  "options-positioning": "what the options market expects, including implied volatility and whether positioning is skewed to one side",
  "filing-text": "what the company discloses as its own risk factors, and any change in that language between filings",
  "short-interest": "how heavily the stock is shorted and whether that has been building",
  "institutional-holdings": "which funds hold the stock and whether they have been adding or cutting",
  "company-news": "whether there is a news catalyst behind a move",
  "earnings-surprises": "how the company has performed against consensus",
  "fundamental-history": "how any current figure compares with this company's own past",
  peers: "how this company compares with its competitors",
};

/** Build the gap for one capability we could not serve. */
export function gapFor(capability: CapabilityId, severity: ResearchGap["severity"] = "limiting"): ResearchGap {
  const cap = CAPABILITIES[capability];
  const alt = cap.alternative ? CAPABILITIES[cap.alternative.capability] : null;
  return {
    capability,
    missing: cap.label,
    blocks: BLOCKS[capability] ?? `analysis that depends on ${cap.label.toLowerCase()}`,
    instead: alt && cap.alternative
      ? { capability: alt.id, label: alt.label, difference: cap.alternative.difference }
      : null,
    severity,
    availability: cap.availability,
  };
}

/** Gaps for every capability an analyzer wanted but could not get. */
export function gapsFor(wanted: CapabilityId[], blocking: CapabilityId[] = []): ResearchGap[] {
  return wanted
    .filter((c) => CAPABILITIES[c].availability !== "available")
    .map((c) => gapFor(c, blocking.includes(c) ? "blocking" : "limiting"));
}

/** One-line rendering, used where a full gap card would be too heavy. */
export function gapSentence(g: ResearchGap): string {
  const head = `${g.missing} unavailable → cannot determine ${g.blocks}.`;
  return g.instead
    ? `${head} Available alternative: ${g.instead.label.toLowerCase()} — ${g.instead.difference}`
    : `${head} We have no alternative for this.`;
}
