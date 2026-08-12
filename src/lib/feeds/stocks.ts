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
// 20 US symbols at 1.5s = a 30s sweep, which lines up with the proxy's 30s
// edge cache: by the time we come back to a ticker its cached entry has just
// expired, so we refresh it exactly once per cycle (~40 upstream req/min) and
// every additional visitor is served from cache instead of multiplying calls.
const POLL_MS = 1500;
const BACKOFF_MS = 30000;        // pause this long after a 429 rate-limit
const REPROBE_MS = 120000;       // re-test a "not configured" proxy every 2 min

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
// The proxy is presumed available until it answers 501 (not configured) or 404
// (static host with no functions). Once ruled out we only use the dev key —
// but we re-probe periodically, so deploying the key makes quotes go live
// without anyone reloading the page.
let useProxy = true;

/** The symbol the user is actually looking at, polled far more often than the
 *  round-robin so an open stock page updates in seconds rather than minutes. */
let priority: string | null = null;
export function setPrioritySymbol(sym: string | null): void {
  priority = sym && metaFor(sym)?.country === "US" ? sym : null;
}

/** Why quotes are or aren't live — surfaced for diagnostics. */
export type FeedStatus = "live" | "probing" | "unconfigured";
let status: FeedStatus = "probing";
export const stockFeedStatus = (): FeedStatus => status;

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
  let dead = 0;      // consecutive nulls → nothing is configured anywhere
  let alternate = false;
  const tick = async () => {
    // Alternate between the symbol on screen and the round-robin, so an open
    // stock page refreshes every ~2s instead of once per full sweep.
    alternate = !alternate;
    const symbol = priority && alternate ? priority : symbols[i++ % symbols.length];

    const q = await fetchQuote(symbol);
    if (q === "rate-limited") { schedule(BACKOFF_MS); return; }
    if (q && typeof q.c === "number" && q.c > 0) {
      dead = 0;
      status = "live";
      setLiveQuote(symbol, { price: q.c, changePct: typeof q.dp === "number" ? q.dp : 0, source: "live" });
    } else if (q === null) {
      // Nothing configured. Don't die permanently — back off and re-probe, so
      // adding FINNHUB_API_KEY on the server takes effect on its own.
      if (++dead >= 3) {
        status = "unconfigured";
        dead = 0;
        useProxy = true;          // re-test the proxy on the next attempt
        schedule(REPROBE_MS);
        return;
      }
    }
    schedule(POLL_MS);
  };

  const schedule = (ms: number) => { timer = setTimeout(tick, ms); };
  schedule(300);   // small initial delay so the app paints first

  return () => { started = false; if (timer) clearTimeout(timer); };
}

/** Live stock quotes are attempted via the proxy (prod) or a dev key (local). */
export const stockFeedEnabled = (): boolean => true;
