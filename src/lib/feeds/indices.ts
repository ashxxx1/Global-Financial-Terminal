import { setLiveQuote } from "../market";
import { ETF_PROXIES } from "./proxies";

/**
 * Real prices for indices and commodities, via their tracking ETFs.
 *
 * These 30 instruments were the largest simulated surface left in the product.
 * Their ETF proxies are ordinary US tickers, so they go through the same
 * /api/quote path the equity feed already uses — same key, same 30s shared edge
 * cache, no new provider and no new secret.
 *
 * Rate budget: the equity feed sweeps 20 symbols and this adds 30, so the two
 * together poll 50 tickers. At 1.8s each that is a ~90s cycle, roughly 33
 * upstream requests a minute against Finnhub's 60/min free cap — and because
 * the proxy caches for 30s, every additional visitor is served from the edge
 * rather than multiplying that number.
 */

const POLL_MS = 1800;
const BACKOFF_MS = 30000;
const REPROBE_MS = 120000;

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

interface Quote { c?: number; dp?: number }

export function startIndexFeed(): () => void {
  if (started) return () => {};
  started = true;

  const entries = Object.entries(ETF_PROXIES).map(([name, p]) => ({
    key: `IDX:${name}`,   // how the registry stores these instruments
    etf: p.etf,
  }));
  if (entries.length === 0) { started = false; return () => {}; }

  let i = 0;
  let dead = 0;

  const tick = async () => {
    const { key, etf } = entries[i++ % entries.length];
    try {
      const r = await fetch(`/api/quote?symbol=${encodeURIComponent(etf)}`);
      if (r.status === 429) { schedule(BACKOFF_MS); return; }
      if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
        const q = (await r.json()) as Quote;
        if (typeof q.c === "number" && q.c > 0) {
          dead = 0;
          // The ETF's real price and real change. Deliberately NOT rescaled
          // into an index level — a synthesised number that looks official is
          // worse than an honest proxy that says what it is.
          setLiveQuote(key, {
            price: q.c,
            changePct: typeof q.dp === "number" ? q.dp : 0,
            source: "live",
          });
          schedule(POLL_MS);
          return;
        }
      }
      // 501/404 → this deployment has no proxy; stop hammering it.
      if (r.status === 501 || r.status === 404) {
        started = false;
        return;
      }
    } catch {
      // dev has no /api runtime, or the network blipped
      if (++dead >= 3) { dead = 0; schedule(REPROBE_MS); return; }
    }
    schedule(POLL_MS);
  };

  const schedule = (ms: number) => { timer = setTimeout(tick, ms); };
  schedule(900);   // let the equity feed take the first slot

  return () => { started = false; if (timer) clearTimeout(timer); };
}
