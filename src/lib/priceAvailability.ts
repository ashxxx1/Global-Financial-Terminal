/**
 * Whether an instrument can be priced at all, and if not, why.
 *
 * The terminal used to fall back to a deterministic simulation whenever a feed
 * was missing. Every such number was labelled, but a labelled invented price is
 * still an invented price sitting where a real one belongs — and a reader
 * skimming a table does not read badges.
 *
 * So the fallback is gone. An instrument is now in exactly one of three states:
 *
 *   live       a feed answered and the number is real
 *   pending    a feed covers it but has not swept yet — show a dash, not a guess
 *   unavailable  no feed exists for it, and we say which and why
 *
 * The distinction between `pending` and `unavailable` is the whole point.
 * Blanking everything on load would be honest and useless; blanking only what
 * can never arrive is honest and correct.
 */
import { YAHOO_SYMBOLS } from "./feeds/yahooSymbols";
import { ADR_MAP } from "./feeds/adrs";
import { ETF_PROXIES } from "./feeds/proxies";

export type Availability = "coverable" | "unavailable";

/** Markets with no feed on any provider we can reach, and the reason. */
const MARKET_REASONS: Record<string, string> = {
  NG: "The Nigerian Exchange is not carried by any price feed we can reach.",
  PH: "The Philippine Stock Exchange returns no data through our providers.",
  MA: "The Casablanca Stock Exchange is not covered by our providers.",
  KE: "The Nairobi Securities Exchange is not carried by any feed we can reach.",
  BD: "The Dhaka Stock Exchange is not covered by our providers.",
  LK: "The Colombo Stock Exchange is not carried by any feed we can reach.",
  GH: "The Ghana Stock Exchange is not covered by our providers.",
  OM: "The Muscat Securities Market is not carried by any feed we can reach.",
  JO: "The Amman Stock Exchange is not covered by our providers.",
  BH: "The Bahrain Bourse is not carried by any feed we can reach.",
  IR: "Iranian listings are unavailable to us; sanctions exclude them from every provider we can use.",
  CI: "The BRVM (Abidjan) is not covered by our providers.",
  TZ: "The Dar es Salaam Stock Exchange is not carried by any feed we can reach.",
  KZ: "The Kazakhstan Stock Exchange is not covered by our providers.",
  GY: "The Guyana Stock Exchange is not carried by any feed we can reach.",
  DZ: "The Algiers Stock Exchange is not covered by our providers.",
  UA: "This Ukrainian listing is not carried by any feed we can reach.",
};

/** The generic reason, used when a single name in a covered market is missing. */
const SINGLE_NAME_REASON =
  "Our providers return no data for this specific listing, though the exchange itself is covered.";

/**
 * Can this instrument ever be priced live?
 *
 * Deliberately structural rather than a lookup of what happens to be loaded:
 * asking "is there a feed for this" gives a stable answer, where asking "do we
 * have a price right now" flickers between states during a sweep.
 */
export function availabilityOf(
  symbol: string, kind: string, country: string | null, name: string,
): Availability {
  // FX and crypto are fully covered by ECB and Binance.
  if (kind === "fx" || kind === "crypto") return "coverable";
  // Indices and commodities are priced through a tracking ETF where one exists.
  if (kind === "index" || kind === "commodity") {
    return ETF_PROXIES[name] ? "coverable" : "unavailable";
  }
  // US equities go through the quote proxy directly.
  if (country === "US") return "coverable";
  // Everything else needs a home-exchange listing or a US listing.
  if (country && (YAHOO_SYMBOLS[`${country}:${symbol}`] || ADR_MAP[`${country}:${symbol}`])) {
    return "coverable";
  }
  return "unavailable";
}

/** Why this instrument has no price. Empty string when it is coverable. */
export function unavailableReason(
  symbol: string, kind: string, country: string | null, name: string,
): string {
  if (availabilityOf(symbol, kind, country, name) === "coverable") return "";
  if (kind === "index" || kind === "commodity") {
    return `No tracking fund we can price follows ${name}, so we do not publish a level for it.`;
  }
  if (country && MARKET_REASONS[country]) return MARKET_REASONS[country];
  return SINGLE_NAME_REASON;
}

/** One-line summary for a whole market, for the browse page. */
export const marketReason = (country: string): string =>
  MARKET_REASONS[country] ?? SINGLE_NAME_REASON;
