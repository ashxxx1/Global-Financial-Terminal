/**
 * Question → intent routing.
 *
 * Deterministic rather than a model call. The question space is bounded (a
 * dozen intents over a known symbol registry), and a parser that fails visibly
 * — "we could not tell which company you meant" — beats one that guesses wrong
 * and then answers fluently about the wrong company.
 *
 * It also detects questions aimed at data we do not have, so the system can say
 * which capability is missing instead of quietly answering a nearby question.
 */
import { allStockSymbols, metaFor } from "../market";
import type { CapabilityId } from "./capabilities";
import { looksLikeImpactQuestion } from "../impact/extract";

export type Intent =
  | "moving" | "persistence" | "changed" | "valuation" | "valuation-pair"
  | "momentum" | "risks" | "filings" | "screen"
  | "market" | "portfolio" | "macro" | "impact" | "unavailable";

export interface Parsed {
  intent: Intent;
  symbols: string[];
  inherited: boolean;
  /** Set when the question targets a capability we do not have. */
  wants?: CapabilityId;
  unresolved?: string;
}

/**
 * Generic corporate-suffix and sector words that appear in many company names
 * and should never trigger a name-word match on their own. Used in addition
 * to, not instead of, the existing STOP set for ticker tokens.
 */
const GENERIC_NAME_WORDS = new Set([
  "company", "companies", "corp", "corporation", "inc", "incorporated",
  "group", "holdings", "holding", "international", "national", "global",
  "industries", "industry", "systems", "technologies", "technology",
  "resources", "solutions", "enterprises", "limited", "ltd", "plc",
  "co", "the",
]);

let index: { symbol: string; name: string; words: string[] }[] | null = null;
function symbolIndex() {
  if (index) return index;
  index = allStockSymbols().map((s) => {
    const name = (metaFor(s)?.name || s).toLowerCase();
    return {
      symbol: s, name,
      words: name.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !GENERIC_NAME_WORDS.has(w)),
    };
  });
  return index;
}

const STOP = new Set([
  "the", "and", "for", "are", "why", "how", "what", "who", "was", "has", "its",
  "up", "down", "is", "in", "on", "to", "of", "vs", "or", "at", "it", "this",
  "risk", "risks", "stock", "stocks", "today", "latest", "biggest", "compare",
  "earnings", "market", "temporary", "estimates", "valuation", "filings", "call",
  "key", "changed", "change", "expensive", "cheap", "momentum", "improving",
]);

function resolveSymbols(qLower: string): string[] {
  const found: { symbol: string; at: number; strong: boolean }[] = [];
  const seen = new Set<string>();

  // Exact ticker matches — strong signal.
  for (const m of qLower.matchAll(/\b([a-z]{1,5})\b/g)) {
    const up = m[1].toUpperCase();
    if (STOP.has(m[1])) continue;
    if (metaFor(up) && !seen.has(up)) {
      seen.add(up);
      found.push({ symbol: up, at: m.index ?? 0, strong: true });
    }
  }
  // Name-word matches — weak signal.
  for (const entry of symbolIndex()) {
    if (seen.has(entry.symbol)) continue;
    for (const w of entry.words) {
      if (new RegExp(`\\b${w}\\b`).test(qLower)) {
        seen.add(entry.symbol);
        found.push({ symbol: entry.symbol, at: qLower.indexOf(w), strong: false });
        break;
      }
    }
  }
  // Strong (exact ticker) matches always outrank name-word matches;
  // within the same tier, earliest mention wins.
  return found
    .sort((a, b) => (a.strong === b.strong ? a.at - b.at : a.strong ? -1 : 1))
    .map((f) => f.symbol);
}

/**
 * Questions that target data we do not have. Checked before intent routing so
 * the answer names the missing capability rather than silently substituting.
 */
const UNAVAILABLE_PATTERNS: { test: RegExp; wants: CapabilityId }[] = [
  { test: /price target|target price|fair value estimate|analyst target/i, wants: "price-targets" },
  { test: /estimate revision|estimates? (are )?(rising|falling|being raised|being cut)|forward estimate|consensus estimate for next|raising estimates/i, wants: "eps-estimates" },
  { test: /revenue estimate|revenue forecast|sales forecast/i, wants: "revenue-estimates" },
  { test: /transcript|earnings call|what did management say|on the call|management said|guidance language/i, wants: "earnings-transcripts" },
  { test: /option|implied vol|iv |skew|open interest|put\/call|gamma/i, wants: "options-positioning" },
  { test: /short interest|days to cover|shorted/i, wants: "short-interest" },
  { test: /institutional (ownership|holding)|13f|hedge fund (position|holding)/i, wants: "institutional-holdings" },
  { test: /risk factors? section|read the (10-k|10-q|filing)|summari[sz]e the (filing|10-k|10-q)/i, wants: "filing-text" },
];

export function parseQuestion(raw: string, context: { symbol?: string }): Parsed {
  const q = raw.toLowerCase().trim();
  const symbols = resolveSymbols(q);
  const primary = symbols[0] ?? context.symbol;
  const inherited = symbols.length === 0 && !!context.symbol;
  const hasWord = (haystack: string, w: string) => new RegExp(`\\b${w}\\b`, "i").test(haystack);
  const has = (...xs: string[]) =>
    xs.some((x) => (x.includes(" ") ? q.includes(x) : hasWord(q, x)));

  for (const p of UNAVAILABLE_PATTERNS) {
    if (p.test.test(raw)) {
      return { intent: "unavailable", symbols: primary ? [primary] : [], inherited, wants: p.wants };
    }
  }

  // Event → impact questions belong to the Impact Copilot, not the company
  // fact panel. Checked before "rates"/"macro" so a Fed-cut query is not
  // answered as a generic backdrop.
  if (looksLikeImpactQuestion(raw)) {
    return { intent: "impact", symbols: primary ? [primary] : [], inherited: false };
  }

  if (has("temporary", "will it last", "permanent", "does it recover", "bounce back", "revert", "is this a blip")) {
    return { intent: "persistence", symbols: primary ? [primary] : [], inherited };
  }
  if (has("what changed", "what has changed", "what's changed", "changed at", "changed in", "latest quarter", "most recent quarter")) {
    return { intent: "changed", symbols: primary ? [primary] : [], inherited };
  }
  if (has("compare", " vs ", "versus") && symbols.length >= 2) {
    return { intent: "valuation-pair", symbols: symbols.slice(0, 2), inherited: false };
  }
  if (has("valuation", "expensive", "cheap", "overvalued", "undervalued", "multiple", "p/e", "pe ratio", "rich")) {
    if (symbols.length >= 2) return { intent: "valuation-pair", symbols: symbols.slice(0, 2), inherited: false };
    return { intent: "valuation", symbols: primary ? [primary] : [], inherited };
  }
  if (has("momentum", "earnings improving", "beating", "beat", "surprise", "eps trend", "earnings trend", "earnings")) {
    return { intent: "momentum", symbols: primary ? [primary] : [], inherited };
  }
  if (has("risk", "danger", "downside", "what could go wrong", "leverage", "debt")) {
    return { intent: "risks", symbols: primary ? [primary] : [], inherited };
  }
  if (has("filing", "10-k", "10-q", "8-k", "sec ")) {
    return { intent: "filings", symbols: primary ? [primary] : [], inherited };
  }
  if (has("screen", "find stocks", "find companies", "screener")) {
    return { intent: "screen", symbols: [], inherited: false };
  }
  if (has("watchlist", "portfolio", "my positions", "my stocks")) {
    return { intent: "portfolio", symbols: [], inherited: false };
  }
  if (has("macro", "inflation", "rates", "dollar", "currency", "gold", "bitcoin")) {
    return { intent: "macro", symbols: [], inherited: false };
  }
  if (has("market", "breadth", "leadership", "overall")) {
    return { intent: "market", symbols: [], inherited: false };
  }
  if (has("why", "moving", "up", "down", "drop", "fall", "rally", "jump", "sell-off", "selloff")) {
    if (!primary) return { intent: "market", symbols: [], inherited: false, unresolved: "no company recognised" };
    return { intent: "moving", symbols: [primary], inherited };
  }

  if (primary) return { intent: "moving", symbols: [primary], inherited };
  return { intent: "market", symbols: [], inherited: false };
}

/** Starter questions per mode — only ones the available data can answer. */
export const STARTERS: Record<string, string[]> = {
  moving:    ["Why is NVDA moving today?", "Why is AAPL up?", "Is this temporary?"],
  changed:   ["What changed at AAPL?", "What changed in MSFT's latest quarter?"],
  valuation: ["Is AAPL's valuation expensive?", "Compare Apple vs Microsoft on valuation"],
  momentum:  ["Is earnings momentum improving at NVDA?", "Has AAPL been beating estimates?"],
  risks:     ["What are the key risks to TSLA?", "What are the key risks to AAPL?"],
  market:    ["What is the market doing today?", "Where is the leadership today?"],
  portfolio: ["How is my watchlist doing?", "Am I concentrated in one sector?"],
  macro:     ["What is the macro backdrop?", "How are gold and bitcoin trading?"],
};
