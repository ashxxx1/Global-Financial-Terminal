/**
 * USD conversion for multi-currency portfolios.
 *
 * A portfolio spanning Tokyo, London and Sao Paulo has no meaningful total
 * until everything is in one currency. ECB reference rates (via frankfurter,
 * keyless) cover 26 of the 37 currencies our universe quotes in.
 *
 * The remainder are handled by being explicit rather than clever:
 *   - Three are hard pegs, fixed by their central banks for decades. They are
 *     converted and labelled as pegs, never as live quotes.
 *   - The rest float and we have no rate, so positions in them are EXCLUDED
 *     from the total and listed by name. A total that silently omits holdings
 *     is worse than one that says which holdings it omitted.
 */

const ENDPOINT = "https://api.frankfurter.dev/v1/latest?base=USD";
const REFRESH_MS = 60 * 60 * 1000;   // ECB publishes once a business day

/**
 * Currencies pegged to the dollar at a rate set by the central bank. These have
 * not moved in decades, but they are still not live quotes and the UI says so.
 */
export const PEGGED: Record<string, { rate: number; since: string }> = {
  SAR: { rate: 3.75, since: "1986" },      // Saudi riyal
  AED: { rate: 3.6725, since: "1997" },    // UAE dirham
  QAR: { rate: 3.64, since: "2001" },      // Qatari riyal
};

/** Symbols our universe uses, mapped to ISO codes the rate table is keyed by. */
export const SYMBOL_TO_ISO: Record<string, string> = {
  "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR", "₩": "KRW",
  "R$": "BRL", "C$": "CAD", "A$": "AUD", "CHF": "CHF", "HK$": "HKD",
  "S$": "SGD", "NT$": "TWD", "R": "ZAR", "₺": "TRY", "₪": "ILS",
  "zł": "PLN", "Kč": "CZK", "Ft": "HUF", "kr": "SEK", "₱": "PHP",
  "RM": "MYR", "฿": "THB", "Rp": "IDR", "₫": "VND", "₨": "PKR",
  "Mex$": "MXN", "CL$": "CLP", "COL$": "COP", "AR$": "ARS", "S/": "PEN",
};

let rates: Record<string, number> | null = null;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;

/** ECB rates are USD-base here: rates[X] = units of X per 1 USD. */
async function load(): Promise<void> {
  if (rates && Date.now() - fetchedAt < REFRESH_MS) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch(ENDPOINT);
      if (!r.ok) return;
      const j = (await r.json()) as { rates?: Record<string, number> };
      if (j.rates) { rates = j.rates; fetchedAt = Date.now(); }
    } catch {
      /* keep the last good table; a stale rate beats no portfolio */
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export const ensureRates = (): Promise<void> => load();

export type ConversionBasis = "live" | "peg" | "usd" | "unavailable";

export interface Converted {
  usd: number | null;
  basis: ConversionBasis;
  /** Units of the local currency per 1 USD, for the evidence trail. */
  rate: number | null;
}

/** Convert an amount in `currency` (ISO code or our display symbol) to USD. */
export function toUsd(amount: number, currency: string): Converted {
  const iso = SYMBOL_TO_ISO[currency] ?? currency;
  if (iso === "USD") return { usd: amount, basis: "usd", rate: 1 };

  const peg = PEGGED[iso];
  if (peg) return { usd: amount / peg.rate, basis: "peg", rate: peg.rate };

  const r = rates?.[iso];
  if (typeof r === "number" && r > 0) return { usd: amount / r, basis: "live", rate: r };

  return { usd: null, basis: "unavailable", rate: null };
}

/** Whether a currency can be converted at all — used to explain exclusions. */
export const canConvert = (currency: string): boolean =>
  toUsd(1, currency).usd !== null;

export const ratesAsOf = (): number => fetchedAt;
