/**
 * Map a broker's ticker onto a symbol in our universe.
 *
 * Brokers do not agree on tickers. Zerodha writes RELIANCE-EQ, Trading 212
 * writes SHEL.L, IBKR writes 7203 for Toyota and a Hong Kong export may write
 * 700 where we hold 0700. Matching exactly would reject most real files, so
 * this tries a short ladder of increasingly permissive transforms and reports
 * which one hit — a match found by stripping an exchange suffix is worth
 * showing the user, because it is the one most likely to be wrong.
 */
import { metaFor, allStockSymbols } from "../market";

export type MatchKind = "exact" | "suffix" | "padded" | "name" | "none";

export interface Resolution {
  symbol: string | null;
  kind: MatchKind;
  /** What we changed to get there, for the import report. */
  via?: string;
}

/** Exchange and segment suffixes brokers append. */
const SUFFIXES = [
  /-(EQ|BE|BZ|SM|ST|NS|BO)$/i,
  /\.(NS|BO|L|TO|AX|HK|T|SI|SW|DE|PA|MI|MC|AS|ST|OL|CO|HE|BR|LS|VI|SA|MX|JO|IS|TA|SR|KS|TW|BK|JK|KL|NZ|WA|PR|BD|SS|SZ)$/i,
  /\s+(EQUITY|COMMON STOCK|ORD|ADR)$/i,
];

let nameIndex: Map<string, string> | null = null;
function byName(): Map<string, string> {
  if (nameIndex) return nameIndex;
  nameIndex = new Map();
  for (const s of allStockSymbols()) {
    const n = metaFor(s)?.name;
    if (n) nameIndex.set(normaliseName(n), s);
  }
  return nameIndex;
}

const normaliseName = (s: string) =>
  s.toLowerCase()
    .replace(/\b(inc|corp|corporation|ltd|limited|plc|sa|se|ag|nv|co|company|holdings|holding|group|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

export function resolveSymbol(raw: string, brokerClean?: (s: string) => string): Resolution {
  const input = (raw || "").trim();
  if (!input) return { symbol: null, kind: "none" };

  const cleaned = (brokerClean ? brokerClean(input) : input).trim().toUpperCase();

  // 1. Exact.
  if (metaFor(cleaned)) return { symbol: cleaned, kind: "exact" };

  // 2. Strip a known exchange or segment suffix.
  for (const re of SUFFIXES) {
    if (re.test(cleaned)) {
      const stripped = cleaned.replace(re, "");
      if (metaFor(stripped)) {
        return { symbol: stripped, kind: "suffix", via: `${cleaned} → ${stripped}` };
      }
    }
  }

  // 3. Numeric codes: Hong Kong pads to four digits, others do not.
  if (/^\d+$/.test(cleaned)) {
    const padded = cleaned.padStart(4, "0");
    if (metaFor(padded)) return { symbol: padded, kind: "padded", via: `${cleaned} → ${padded}` };
    const unpadded = cleaned.replace(/^0+/, "");
    if (metaFor(unpadded)) return { symbol: unpadded, kind: "padded", via: `${cleaned} → ${unpadded}` };
  }

  // 4. Company name — DEGIRO and Groww export names where we want tickers.
  const hit = byName().get(normaliseName(input));
  if (hit) return { symbol: hit, kind: "name", via: `"${input}" → ${hit}` };

  return { symbol: null, kind: "none" };
}

/**
 * Autocomplete for the portfolio ticker field.
 *
 * Native <datalist> treats a shorter listed ticker as a match for a longer
 * typed one (AAL completes when the user types AAPL). Suggestions therefore
 * never include a proper prefix of the current query, and an exact hit always
 * comes first.
 */
export function tickerSuggestions(query: string, symbols: string[], limit = 6): string[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const exact = symbols.filter((s) => s === q);
  const prefixed = symbols.filter(
    (s) => s !== q && s.startsWith(q) && !(q.startsWith(s) && s.length < q.length),
  );
  return [...exact, ...prefixed].slice(0, limit);
}
