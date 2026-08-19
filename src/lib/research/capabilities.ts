/**
 * Data availability registry.
 *
 * Every analyzer declares the capabilities it needs, and asks this registry
 * rather than reaching for an endpoint. Three things fall out of that:
 *
 *  1. When a user asks for something we cannot see, the system says so by name
 *     and points at the nearest honest substitute — instead of silently
 *     answering a slightly different question and letting the user assume it
 *     was the one they asked.
 *  2. Adding a premium source later is a data change, not a rewrite: flip
 *     `availability` to "available", register the fetcher, and every analyzer
 *     that declared the capability starts using it.
 *  3. What we can and cannot see is stated in one auditable place, with the
 *     date we last verified it, rather than scattered through analyzer prose.
 *
 * `verifiedAt` is when the claim in `availability` was last checked against the
 * live API — not when this file was edited. Re-probe before trusting an old date.
 */

export type Availability = "available" | "premium" | "unsupported";

export interface Capability {
  id: CapabilityId;
  label: string;
  availability: Availability;
  /** Which dataset in api/research.ts serves it, when available. */
  dataset?: string;
  provider: string;
  /** Why it is missing, in the user's terms. Required when not available. */
  absence?: string;
  /** The closest thing we *can* answer, and the honest difference. */
  alternative?: { capability: CapabilityId; difference: string };
  verifiedAt: string;
}

export type CapabilityId =
  | "quote" | "price-history" | "company-profile" | "fundamentals" | "fundamental-history"
  | "earnings-surprises" | "analyst-ratings" | "company-news" | "sec-filings"
  | "insider-transactions" | "peers" | "upcoming-earnings"
  // Known-absent. Declared so analyzers can name them precisely.
  | "eps-estimates" | "revenue-estimates" | "price-targets"
  | "earnings-transcripts" | "options-positioning" | "filing-text"
  | "short-interest" | "institutional-holdings";

/** Probed against the live API on 2026-08-15; see docs/RESEARCH-CAPABILITIES.md. */
const VERIFIED = "2026-08-15";

export const CAPABILITIES: Record<CapabilityId, Capability> = {
  quote: { id: "quote", label: "Live quote", availability: "available", provider: "Finnhub / Binance / ECB", verifiedAt: VERIFIED },
  "price-history": { id: "price-history", label: "Price history", availability: "available", provider: "Finnhub", verifiedAt: VERIFIED },
  "company-profile": { id: "company-profile", label: "Company profile", availability: "available", dataset: "profile", provider: "Finnhub", verifiedAt: VERIFIED },
  fundamentals: { id: "fundamentals", label: "Current fundamentals", availability: "available", dataset: "metrics", provider: "Finnhub", verifiedAt: VERIFIED },
  "fundamental-history": { id: "fundamental-history", label: "Historical fundamentals", availability: "available", dataset: "metrics", provider: "Finnhub", verifiedAt: VERIFIED },
  "earnings-surprises": { id: "earnings-surprises", label: "Earnings surprises", availability: "available", dataset: "earnings", provider: "Finnhub", verifiedAt: VERIFIED },
  "analyst-ratings": { id: "analyst-ratings", label: "Analyst ratings", availability: "available", dataset: "recommendations", provider: "Finnhub", verifiedAt: VERIFIED },
  "company-news": { id: "company-news", label: "Company news", availability: "available", dataset: "news", provider: "Finnhub", verifiedAt: VERIFIED },
  "sec-filings": { id: "sec-filings", label: "SEC filings index", availability: "available", dataset: "filings", provider: "Finnhub", verifiedAt: VERIFIED },
  "insider-transactions": { id: "insider-transactions", label: "Insider transactions", availability: "available", dataset: "insider", provider: "Finnhub", verifiedAt: VERIFIED },
  peers: { id: "peers", label: "Peer list", availability: "available", dataset: "peers", provider: "Finnhub", verifiedAt: VERIFIED },
  "upcoming-earnings": {
    id: "upcoming-earnings", label: "Scheduled earnings dates", availability: "available",
    dataset: "earnings-calendar", provider: "Finnhub", verifiedAt: "2026-08-19",
  },

  "eps-estimates": {
    id: "eps-estimates", label: "Forward EPS estimates", availability: "premium", provider: "Finnhub (paid tier)",
    absence: "The estimate-revision dataset is paid and our plan returns 403 for it, so we cannot see whether analysts have been RAISING OR CUTTING their numbers. Note the earnings calendar does carry a single consensus EPS estimate for a scheduled print, so what consensus currently expects is visible — the history of how it got there is not.",
    alternative: { capability: "upcoming-earnings", difference: "We can show the next scheduled print and the single consensus EPS estimate attached to it, plus what the company actually delivered in past quarters. What is missing is the direction of travel — whether that estimate has been rising or falling." },
    verifiedAt: "2026-08-19",
  },
  "revenue-estimates": {
    id: "revenue-estimates", label: "Forward revenue estimates", availability: "premium", provider: "Finnhub (paid tier)",
    absence: "Forward revenue estimates are a paid dataset our plan returns 403 for.",
    alternative: { capability: "fundamental-history", difference: "We can show the revenue and margin trend the business has actually reported over time, which is history rather than a forecast." },
    verifiedAt: VERIFIED,
  },
  "price-targets": {
    id: "price-targets", label: "Analyst price targets", availability: "premium", provider: "Finnhub (paid tier)",
    absence: "Analyst price targets are a paid dataset our plan returns 403 for.",
    alternative: { capability: "analyst-ratings", difference: "We can show the buy/hold/sell distribution and how it has shifted. That gives direction of sentiment but no target price." },
    verifiedAt: VERIFIED,
  },
  "earnings-transcripts": {
    id: "earnings-transcripts", label: "Earnings call transcripts", availability: "premium", provider: "Finnhub (paid tier)",
    absence: "Earnings-call transcripts are a paid dataset our plan returns 403 for, so nothing here reflects what management actually said — guidance language, tone, or the Q&A.",
    alternative: { capability: "earnings-surprises", difference: "We can show the reported numbers and how they compared with consensus. The numbers are what happened; the call is how management framed it, and those often differ." },
    verifiedAt: VERIFIED,
  },
  "options-positioning": {
    id: "options-positioning", label: "Options positioning", availability: "unsupported", provider: "none",
    absence: "We have no options data at all — no implied volatility, no skew, no open interest. We cannot see what the options market expects.",
    alternative: { capability: "price-history", difference: "We can measure realised volatility from actual price history. That is what already happened, not what the market is pricing for the future." },
    verifiedAt: VERIFIED,
  },
  "filing-text": {
    id: "filing-text", label: "Full filing text", availability: "unsupported", provider: "none",
    absence: "We receive filing metadata and links, not the documents' text, so we cannot read or summarise risk-factor sections.",
    alternative: { capability: "sec-filings", difference: "We can list and link every filing so you can read the original. We will not summarise a document we have not read." },
    verifiedAt: VERIFIED,
  },
  "short-interest": {
    id: "short-interest", label: "Short interest", availability: "unsupported", provider: "none",
    absence: "Short interest is not in any dataset we hold.",
    alternative: { capability: "insider-transactions", difference: "Insider buying and selling is a different signal entirely — it reflects insiders, not short sellers." },
    verifiedAt: VERIFIED,
  },
  "institutional-holdings": {
    id: "institutional-holdings", label: "Institutional holdings", availability: "unsupported", provider: "none",
    absence: "Institutional ownership and 13F positioning are not available to us.",
    alternative: { capability: "insider-transactions", difference: "We can show insider transactions, which cover officers and directors rather than funds." },
    verifiedAt: VERIFIED,
  },
};

export const isAvailable = (id: CapabilityId): boolean =>
  CAPABILITIES[id].availability === "available";

/** Of the capabilities an analyzer wants, the ones we cannot serve. */
export const missingFrom = (ids: CapabilityId[]): Capability[] =>
  ids.map((id) => CAPABILITIES[id]).filter((c) => c.availability !== "available");

/**
 * The caveat text for an unavailable capability: what is missing, and what we
 * substituted. Written as one sentence pair so it reads as an admission rather
 * than boilerplate.
 */
export function absenceNote(c: Capability): string {
  const alt = c.alternative ? ` Instead: ${CAPABILITIES[c.alternative.capability].label.toLowerCase()} — ${c.alternative.difference}` : "";
  return `${c.absence ?? `${c.label} is unavailable.`}${alt}`;
}

/** Capabilities grouped for the UI's availability panel. */
export function capabilitySummary() {
  const all = Object.values(CAPABILITIES);
  return {
    available: all.filter((c) => c.availability === "available"),
    premium: all.filter((c) => c.availability === "premium"),
    unsupported: all.filter((c) => c.availability === "unsupported"),
  };
}
