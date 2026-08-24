/**
 * feeds/fx.ts — LIVE FX via ECB reference rates (frankfurter.dev; keyless, CORS-open).
 * Polls every 60s; day-change computed against the previous business day.
 */
import { publish } from "./bus";
import { setLiveQuote } from "../market";

/** USD-base rates: rates[X] = units of X per 1 USD. */
type Rates = Record<string, number>;

/**
 * Every pair we publish, and how to build it from the USD-base table.
 *
 * `invert` marks the pairs conventionally quoted as USD-per-unit (EUR/USD is
 * dollars per euro) rather than units-per-USD. Getting that backwards produces
 * a number that looks plausible and is upside down, which is the kind of error
 * nobody catches by eye.
 *
 * Cross rates (EUR/GBP) are derived from the same published table, so no two
 * pairs on the page can disagree with each other.
 */
const PAIRS: { key: string; iso: string; invert: boolean; cross?: string }[] = [
  { key: "IDX:EUR/USD", iso: "EUR", invert: true },
  { key: "IDX:GBP/USD", iso: "GBP", invert: true },
  { key: "IDX:AUD/USD", iso: "AUD", invert: true },
  { key: "IDX:NZD/USD", iso: "NZD", invert: true },
  { key: "IDX:USD/JPY", iso: "JPY", invert: false },
  { key: "IDX:USD/CHF", iso: "CHF", invert: false },
  { key: "IDX:USD/CAD", iso: "CAD", invert: false },
  { key: "IDX:USD/CNY", iso: "CNY", invert: false },
  { key: "IDX:USD/INR", iso: "INR", invert: false },
  { key: "IDX:USD/KRW", iso: "KRW", invert: false },
  { key: "IDX:USD/SGD", iso: "SGD", invert: false },
  { key: "IDX:USD/SEK", iso: "SEK", invert: false },
  { key: "IDX:USD/NOK", iso: "NOK", invert: false },
  { key: "IDX:USD/MXN", iso: "MXN", invert: false },
  { key: "IDX:USD/BRL", iso: "BRL", invert: false },
  { key: "IDX:USD/ZAR", iso: "ZAR", invert: false },
  { key: "IDX:USD/TRY", iso: "TRY", invert: false },
  // A cross: euros per pound, from the two USD legs.
  { key: "IDX:EUR/GBP", iso: "EUR", invert: false, cross: "GBP" },
];

const SYMBOLS = [...new Set(PAIRS.flatMap((p) => [p.iso, p.cross]).filter(Boolean))].join(",");

/** Price for one pair from a USD-base rate table, or null if unavailable. */
function priceOf(p: (typeof PAIRS)[number], r: Rates): number | null {
  const base = r[p.iso];
  if (typeof base !== "number" || !(base > 0)) return null;
  if (p.cross) {
    const q = r[p.cross];
    if (typeof q !== "number" || !(q > 0)) return null;
    // EUR/GBP means POUNDS PER EURO. rates[X] is X-per-USD, so that is
    // GBP-per-USD ÷ EUR-per-USD — the quote currency over the base, not the
    // other way round. Inverted it returns 1.17 where the answer is 0.855:
    // a number well inside a believable range and completely wrong.
    return q / base;
  }
  return p.invert ? 1 / base : base;
}

let started = false;
let prevDay: Rates | null = null;

async function getJson(url: string): Promise<any> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

function toQuotes(now: Rates, prev: Rates | null) {
  // Registry keys: EUR/USD & GBP/USD are USD-per-unit (inverse of USD-base rates);
  // USD/JPY is JPY-per-USD (direct).
  const defs: [string, number, number | null][] = [];
  for (const p of PAIRS) {
    const price = priceOf(p, now);
    if (price === null) continue;    // a missing currency is skipped, never guessed
    defs.push([p.key, price, prev ? priceOf(p, prev) : null]);
  }
  for (const [key, price, prevPrice] of defs) {
    const changePct = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
    setLiveQuote(key, { price, changePct, source: "live" });
    publish({
      id: `ecb-${key}-${Math.floor(Date.now() / 60000)}`,
      kind: "quote",
      timestamp: Date.now(),
      received: Date.now(),
      source: "ECB via frankfurter.dev",
      confidence: 96,
      countryTags: key.includes("EUR") ? ["DE", "FR"] : key.includes("GBP") ? ["GB"] : ["JP", "US"],
      marketTags: [key, "fx"],
      industryTags: [],
      summary: `${key.slice(4)} ${price.toFixed(4)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% d/d)`,
      impact: Math.abs(changePct) > 1 ? "Medium" : "Low",
      payload: { price, changePct },
    });
  }
}

async function poll(): Promise<void> {
  try {
    const now = (await getJson(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS}`)).rates as Rates;
    if (!prevDay) {
      // previous business day for the day-over-day change
      const d = new Date(Date.now() - 86400000 * 4);
      const iso = d.toISOString().slice(0, 10);
      try {
        const hist = await getJson(`https://api.frankfurter.dev/v1/${iso}..?base=USD&symbols=${SYMBOLS}`);
        const days = Object.keys(hist.rates || {}).sort();
        const prior = days.length > 1 ? days[days.length - 2] : days[0];
        prevDay = hist.rates[prior] as Rates;
      } catch { prevDay = now; }
    }
    toQuotes(now, prevDay);
  } catch { /* offline / rate-limited — SIM fallback keeps rendering */ }
}

export function startFxFeed(): void {
  if (started) return;
  started = true;
  poll();
  setInterval(poll, 60000);
}
