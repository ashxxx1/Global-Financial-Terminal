/**
 * Question → intent routing.
 *
 * Deliberately a deterministic parser rather than a model call. The question
 * space here is bounded (a dozen intents over a known symbol registry), and a
 * parser that fails visibly — "I could not tell which company you meant" — is
 * better than one that silently guesses wrong and then answers fluently about
 * the wrong company.
 */
import { allStockSymbols, metaFor } from "../market";

export type Intent =
  | "move" | "persistence" | "valuation" | "earnings"
  | "risks" | "filings" | "screen" | "market" | "portfolio" | "macro";

export interface Parsed {
  intent: Intent;
  symbols: string[];
  /** True when the symbol came from conversation context, not this question. */
  inherited: boolean;
  /** Set when we could not resolve something the question clearly referred to. */
  unresolved?: string;
}

/** Cached name→symbol index, built once from the registry. */
let index: { symbol: string; name: string; words: string[] }[] | null = null;
function symbolIndex() {
  if (index) return index;
  index = allStockSymbols().map((s) => {
    const name = (metaFor(s)?.name || s).toLowerCase();
    return { symbol: s, name, words: name.split(/[^a-z0-9]+/).filter((w) => w.length > 2) };
  });
  return index;
}

/** Words that look like tickers but are ordinary English — never match these. */
const STOP = new Set([
  "the", "and", "for", "are", "why", "how", "what", "who", "was", "has", "its",
  "up", "down", "is", "in", "on", "to", "of", "vs", "or", "at", "it", "this",
  "risk", "risks", "stock", "stocks", "today", "latest", "biggest", "compare",
  "earnings", "market", "temporary", "estimates", "valuation", "filings", "call",
]);

/** Resolve every company the question names, in the order mentioned. */
function resolveSymbols(qLower: string): string[] {
  const found: { symbol: string; at: number }[] = [];
  const seen = new Set<string>();

  // Explicit tickers first — highest confidence, and they are unambiguous.
  for (const m of qLower.matchAll(/\b([a-z]{1,5})\b/g)) {
    const up = m[1].toUpperCase();
    if (STOP.has(m[1])) continue;
    if (metaFor(up) && !seen.has(up)) {
      seen.add(up);
      found.push({ symbol: up, at: m.index ?? 0 });
    }
  }

  // Then company names, so "apple" and "microsoft" resolve.
  for (const entry of symbolIndex()) {
    if (seen.has(entry.symbol)) continue;
    for (const w of entry.words) {
      const at = qLower.indexOf(w);
      // Require a word boundary so "at" inside "attention" cannot match.
      if (at >= 0 && new RegExp(`\\b${w}\\b`).test(qLower)) {
        seen.add(entry.symbol);
        found.push({ symbol: entry.symbol, at });
        break;
      }
    }
  }

  return found.sort((a, b) => a.at - b.at).map((f) => f.symbol);
}

export function parseQuestion(raw: string, context: { symbol?: string }): Parsed {
  const q = raw.toLowerCase().trim();
  const symbols = resolveSymbols(q);
  const primary = symbols[0] ?? context.symbol;
  const inherited = symbols.length === 0 && !!context.symbol;

  const has = (...xs: string[]) => xs.some((x) => q.includes(x));

  // Follow-ups first: they are short, pronoun-heavy, and must inherit context.
  if (has("temporary", "will it last", "is this permanent", "does it recover", "bounce back", "revert")) {
    return { intent: "persistence", symbols: primary ? [primary] : [], inherited };
  }

  if (has("compare", " vs ", "versus", "against") && symbols.length >= 2) {
    return { intent: "valuation", symbols: symbols.slice(0, 2), inherited: false };
  }
  if (has("valuation", "expensive", "cheap", "multiple", "p/e", "pe ratio")) {
    if (symbols.length >= 2) return { intent: "valuation", symbols: symbols.slice(0, 2), inherited: false };
    return { intent: "valuation", symbols: primary ? [primary, "SPY"] : [], inherited };
  }
  if (has("screen", "find stocks", "find companies", "estimates are rising", "screener")) {
    return { intent: "screen", symbols: [], inherited: false };
  }
  if (has("earnings", "quarter", "eps", "beat", "miss", "guidance")) {
    return { intent: "earnings", symbols: primary ? [primary] : [], inherited };
  }
  if (has("risk", "danger", "downside", "what could go wrong")) {
    return { intent: "risks", symbols: primary ? [primary] : [], inherited };
  }
  if (has("filing", "10-k", "10-q", "8-k", "sec ")) {
    return { intent: "filings", symbols: primary ? [primary] : [], inherited };
  }
  if (has("watchlist", "portfolio", "my positions", "my stocks")) {
    return { intent: "portfolio", symbols: [], inherited: false };
  }
  if (has("macro", "inflation", "rates", "dollar", "currency", "gold", "bitcoin")) {
    return { intent: "macro", symbols: [], inherited: false };
  }
  if (has("market", "breadth", "overall", "everything")) {
    return { intent: "market", symbols: [], inherited: false };
  }
  if (has("why", "moving", "up", "down", "drop", "fall", "rally", "jump")) {
    if (!primary) {
      return { intent: "market", symbols: [], inherited: false, unresolved: "no company recognised in that question" };
    }
    return { intent: "move", symbols: [primary], inherited };
  }

  // Default: if a company was named, describe its move; otherwise the market.
  if (primary) return { intent: "move", symbols: [primary], inherited };
  return { intent: "market", symbols: [], inherited: false };
}

/** Starter questions per mode — only ones the available data can answer. */
export const STARTERS: Record<string, string[]> = {
  company:   ["Why is NVDA up today?", "Compare Apple vs Microsoft on valuation", "What are the biggest risks to TSLA?"],
  market:    ["What is the market doing today?", "Where is the leadership today?"],
  portfolio: ["How is my watchlist doing?", "Am I concentrated in one sector?"],
  macro:     ["What is the macro backdrop?", "How is gold and bitcoin trading?"],
  trade:     ["Find stocks with improving earnings surprises", "Screen for cheap valuations"],
  earnings:  ["What changed in AAPL's latest earnings?", "Has NVDA been beating estimates?"],
};
