/**
 * ingest/fx.js — LIVE FX via ECB reference rates (frankfurter.dev, keyless).
 * Polls every 60s; publishes EUR/USD, GBP/USD, USD/JPY quote Envelopes with a
 * day-over-day change computed against the prior business day.
 */
import { ingest } from "../store.js";

let prevDay = null;

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

function emit(now, prev) {
  const defs = [
    ["IDX:EUR/USD", 1 / now.EUR, prev ? 1 / prev.EUR : null, ["DE", "FR"]],
    ["IDX:GBP/USD", 1 / now.GBP, prev ? 1 / prev.GBP : null, ["GB"]],
    ["IDX:USD/JPY", now.JPY, prev ? prev.JPY : null, ["JP", "US"]],
  ];
  for (const [key, price, prevPrice, countries] of defs) {
    const changePct = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
    ingest({
      id: `ecb-${key}-${Math.floor(Date.now() / 60000)}`,
      kind: "quote",
      timestamp: Date.now(),
      received: Date.now(),
      source: "ECB via frankfurter.dev",
      confidence: 96,
      countryTags: countries,
      marketTags: [key, "fx"],
      industryTags: [],
      summary: `${key.slice(4)} ${price.toFixed(4)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% d/d)`,
      impact: Math.abs(changePct) > 1 ? "Medium" : "Low",
      payload: { price, changePct },
    });
  }
}

async function poll() {
  try {
    const now = (await getJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY")).rates;
    if (!prevDay) {
      const iso = new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10);
      try {
        const hist = await getJson(`https://api.frankfurter.dev/v1/${iso}..?base=USD&symbols=EUR,GBP,JPY`);
        const days = Object.keys(hist.rates || {}).sort();
        prevDay = hist.rates[days.length > 1 ? days[days.length - 2] : days[0]];
      } catch { prevDay = now; }
    }
    emit(now, prevDay);
  } catch (e) {
    console.warn("[fx] poll failed:", e.message);
  }
}

export function startFxIngest() {
  poll();
  setInterval(poll, 60000);
  console.log("[fx] ingest started (ECB, 60s poll)");
}
