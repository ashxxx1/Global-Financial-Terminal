/**
 * feeds/stocks.ts — LIVE US equity quotes via Finnhub (real-time, CORS-open).
 *
 * Activates automatically when VITE_FINNHUB_API_KEY is set (locally in
 * .env.local, or in Vercel → Settings → Environment Variables). Finnhub's free
 * tier streams real-time US stock prices at 60 calls/min, so we poll the app's
 * US symbols in a slow round-robin (≈1/sec) and push each into the market
 * provider's live-override layer — SIM badges flip to LIVE, prices go current.
 *
 * No key, non-US symbols, or an error → this feed is a silent no-op and the
 * deterministic engine keeps every panel populated and honestly badged SIM.
 * (Finnhub's free tier is US-only; other markets stay SIM until a feed is keyed.)
 */
import { setLiveQuote, allStockSymbols, metaFor } from "../market";

const KEY: string = (import.meta as any).env?.VITE_FINNHUB_API_KEY || "";
const POLL_MS = 1100;            // ≈54 req/min — safely under the 60/min free cap
const BACKOFF_MS = 30000;        // pause this long after a 429 rate-limit

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Begin polling live US quotes. Returns an unsubscribe/stop function. */
export function startStockFeed(): () => void {
  if (started || !KEY) return () => {};
  started = true;

  // Finnhub free tier resolves plain US tickers (AAPL, MSFT, …). Restrict to
  // US equities so we never waste calls on symbols the free tier won't price.
  const symbols = allStockSymbols().filter((s) => metaFor(s)?.country === "US");
  if (symbols.length === 0) { started = false; return () => {}; }

  let i = 0;
  const tick = async () => {
    const symbol = symbols[i % symbols.length];
    i++;
    try {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${KEY}`);
      if (r.status === 429) { schedule(BACKOFF_MS); return; }   // rate-limited → back off
      if (r.ok) {
        const q = await r.json();
        // c = current price, dp = percent change on the day. c === 0 → unsupported.
        if (typeof q.c === "number" && q.c > 0) {
          setLiveQuote(symbol, { price: q.c, changePct: typeof q.dp === "number" ? q.dp : 0, source: "live" });
        }
      }
    } catch { /* transient network error — keep rotating */ }
    schedule(POLL_MS);
  };

  const schedule = (ms: number) => { timer = setTimeout(tick, ms); };
  schedule(300);   // small initial delay so the app paints first

  return () => { started = false; if (timer) clearTimeout(timer); };
}

/** Whether the live stock feed is configured (a key is present). */
export const stockFeedEnabled = (): boolean => !!KEY;
