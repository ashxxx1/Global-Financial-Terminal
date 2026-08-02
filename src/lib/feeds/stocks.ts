/**
 * feeds/stocks.ts — LIVE US equity quotes via Finnhub.
 *
 * Primary path is the server-side proxy at /api/quote, which keeps the Finnhub
 * key in a secret server env var (FINNHUB_API_KEY) so it never ships in the
 * client bundle. In production the proxy is always present, so the feed runs
 * without any VITE_ key.
 *
 * Local dev fallback: `vite dev` does not run the /api functions, so if the
 * proxy is unreachable and a VITE_FINNHUB_API_KEY is set in .env.local we call
 * Finnhub directly — a developer convenience only, never shipped to users.
 *
 * We poll US symbols in a slow round-robin (~1/sec, under the 60/min free cap)
 * and push each into the live-override layer — SIM badges flip to LIVE. No key
 * anywhere, non-US symbols, or an error → silent no-op; the deterministic
 * engine keeps every panel populated and honestly badged SIM.
 */
import { setLiveQuote, allStockSymbols, metaFor } from "../market";

// Local-dev-only fallback key. Absent in production, where the proxy is used.
const DEV_KEY: string = (import.meta as any).env?.VITE_FINNHUB_API_KEY || "";
const POLL_MS = 1100;            // ≈54 req/min — safely under the 60/min free cap
const BACKOFF_MS = 30000;        // pause this long after a 429 rate-limit

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
// The proxy is presumed available until it answers 501 (not configured) or 404
// (static host with no functions). Once ruled out we only use the dev key.
let useProxy = true;

interface Quote { c?: number; dp?: number }

/** Fetch one quote via the proxy, falling back to a direct dev-key call. */
async function fetchQuote(symbol: string): Promise<Quote | "rate-limited" | null> {
  if (useProxy) {
    try {
      const r = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      if (r.status === 429) return "rate-limited";
      if (r.ok) return (await r.json()) as Quote;
      // 501/404 → no proxy on this deployment; stop trying it.
      if (r.status === 501 || r.status === 404) useProxy = false;
    } catch {
      useProxy = false; // network/dev — the /api route isn't running
    }
  }
  if (!useProxy && DEV_KEY) {
    try {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${DEV_KEY}`);
      if (r.status === 429) return "rate-limited";
      if (r.ok) return (await r.json()) as Quote;
    } catch { /* transient */ }
  }
  return null;
}

/** Begin polling live US quotes. Returns a stop function. */
export function startStockFeed(): () => void {
  if (started) return () => {};
  started = true;

  // Finnhub free tier resolves plain US tickers (AAPL, MSFT, …). Restrict to
  // US equities so we never waste calls on symbols the free tier won't price.
  const symbols = allStockSymbols().filter((s) => metaFor(s)?.country === "US");
  if (symbols.length === 0) { started = false; return () => {}; }

  let i = 0;
  let dead = 0; // consecutive nulls → nothing is configured anywhere; give up
  const tick = async () => {
    const symbol = symbols[i % symbols.length];
    i++;
    const q = await fetchQuote(symbol);
    if (q === "rate-limited") { schedule(BACKOFF_MS); return; }
    if (q && typeof q.c === "number" && q.c > 0) {
      dead = 0;
      setLiveQuote(symbol, { price: q.c, changePct: typeof q.dp === "number" ? q.dp : 0, source: "live" });
    } else if (q === null) {
      // No proxy and no dev key: stop after a short probe rather than poll forever.
      if (++dead >= 3) { started = false; return; }
    }
    schedule(POLL_MS);
  };

  const schedule = (ms: number) => { timer = setTimeout(tick, ms); };
  schedule(300);   // small initial delay so the app paints first

  return () => { started = false; if (timer) clearTimeout(timer); };
}

/** Live stock quotes are attempted via the proxy (prod) or a dev key (local). */
export const stockFeedEnabled = (): boolean => true;
