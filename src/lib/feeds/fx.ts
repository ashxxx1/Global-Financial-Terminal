/**
 * feeds/fx.ts — LIVE FX via ECB reference rates (frankfurter.dev; keyless, CORS-open).
 * Polls every 60s; day-change computed against the previous business day.
 */
import { publish } from "./bus";
import { setLiveQuote } from "../market";

interface Rates { EUR: number; GBP: number; JPY: number; INR: number; }

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
  const defs: [string, number, number | null][] = [
    ["IDX:EUR/USD", 1 / now.EUR, prev ? 1 / prev.EUR : null],
    ["IDX:GBP/USD", 1 / now.GBP, prev ? 1 / prev.GBP : null],
    ["IDX:USD/JPY", now.JPY, prev ? prev.JPY : null],
  ];
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
    const now = (await getJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY,INR")).rates as Rates;
    if (!prevDay) {
      // previous business day for the day-over-day change
      const d = new Date(Date.now() - 86400000 * 4);
      const iso = d.toISOString().slice(0, 10);
      try {
        const hist = await getJson(`https://api.frankfurter.dev/v1/${iso}..?base=USD&symbols=EUR,GBP,JPY,INR`);
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
