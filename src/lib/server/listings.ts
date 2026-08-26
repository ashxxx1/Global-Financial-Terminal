/**
 * Registry lookups and quote fetching for the edge functions.
 *
 * Shared by the share-card endpoint and the embed endpoint so the two cannot
 * describe the same company differently. Lives under src/ rather than api/
 * because Vercel builds every file in api/ into its own function, and this is
 * a library, not an endpoint. Nothing here is imported by client code.
 */
import { STOCKS_BY_COUNTRY } from "../../data/stocksData.js";
import { COUNTRIES_DATA } from "../../data/mockData.js";

/** As stored in the registry, before the market it belongs to is attached. */
interface Row { ticker: string; name: string; sector: string; currency: string }

export interface Listing extends Row { country: string }

export interface CountryMeta {
  name: string; exchange: string; marketIndex: string; currency: string; tradingHours: string;
}

const KEY = process.env.FINNHUB_API_KEY || "";
/** Finnhub's free tier prices plain US tickers: letters, digits, dot, dash. */
const SYMBOL_RE = /^[A-Za-z0-9.-]{1,12}$/;

let index: Map<string, Listing> | null = null;

export function listing(symbol: string): Listing | undefined {
  if (!index) {
    index = new Map();
    for (const [code, list] of Object.entries(STOCKS_BY_COUNTRY as Record<string, Row[]>)) {
      // First-wins, matching the app registry — eight tickers appear in more
      // than one market and the app resolves them the same way.
      for (const s of list) if (!index.has(s.ticker)) index.set(s.ticker, { ...s, country: code });
    }
  }
  return index.get(symbol);
}

export function country(code: string): CountryMeta | undefined {
  return (COUNTRIES_DATA as Record<string, CountryMeta>)[code];
}

export const countryName = (code: string): string => country(code)?.name ?? code;

export interface Quote { price: number; changePct: number }

/**
 * Live quote, or null. US listings only: that is what the free tier covers, and
 * guessing at a foreign listing would be worse than reporting the gap.
 */
export async function quote(symbol: string): Promise<Quote | null> {
  if (!KEY || !SYMBOL_RE.test(symbol)) return null;
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${KEY}`,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { c?: number; dp?: number };
    // Finnhub answers an unknown symbol with zeroes rather than an error, so a
    // zero price is "we do not have this", not "this is worth nothing".
    if (typeof j.c !== "number" || !Number.isFinite(j.c) || j.c === 0) return null;
    return { price: j.c, changePct: Number.isFinite(j.dp) ? (j.dp as number) : 0 };
  } catch {
    return null;
  }
}
