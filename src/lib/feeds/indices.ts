import { setLiveQuote } from "../market";
import { ETF_PROXIES } from "./proxies";
import { ADR_MAP, adrFor } from "./adrs";
import { YAHOO_SYMBOLS } from "./yahooSymbols";
import { metaFor } from "../market";

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

// 66 symbols (30 ETFs + 36 ADRs) at 3s = a ~200s cycle -> ~20 upstream req/min.
// Paired with the equity feed's ~24/min that is ~44 against a 60/min cap, with
// headroom for the occasional retry. Sweeping faster does not get fresher data
// — the free tier is delayed anyway — it just buys 429s, which is what made
// prices freeze the first time.
const POLL_MS = 3000;
const BACKOFF_MS = 30000;
const REPROBE_MS = 120000;

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * The non-US symbol the user is actually looking at.
 *
 * The sweep is ~200 tickers deep, so a given stock comes round roughly every
 * ten minutes — fine for a background tape, useless for the page in front of
 * you. The open symbol takes every other slot instead, which puts it on a ~6s
 * refresh without adding a single request to the overall budget.
 */
let priority: { key: string; etf: string } | null = null;
export function setIndexPriority(sym: string | null): void {
  const country = sym ? metaFor(sym)?.country : null;
  const adr = sym && country ? adrFor(sym, country) : undefined;
  priority = sym && adr ? { key: sym, etf: adr } : null;
}

interface Quote { c?: number; dp?: number }

export function startIndexFeed(): () => void {
  if (started) return () => {};
  started = true;

  const entries = [
    // Indices and commodities are stored under an "IDX:" key…
    ...Object.entries(ETF_PROXIES).map(([name, p]) => ({ key: `IDX:${name}`, etf: p.etf })),
    // …non-US equities via a US listing — but ONLY where the local exchange
    // feed cannot price them. Polling both would have the ADR's USD proxy
    // overwrite the real local share price a moment after it arrived, and the
    // provenance badge would then be describing the wrong number.
    ...Object.entries(ADR_MAP)
      .filter(([scoped]) => !YAHOO_SYMBOLS[scoped])
      .map(([scoped, adr]) => ({ key: scoped.split(":")[1], etf: adr })),
  ];
  if (entries.length === 0) { started = false; return () => {}; }

  let i = 0;
  let dead = 0;
  let alternate = false;

  const tick = async () => {
    alternate = !alternate;
    const { key, etf } = priority && alternate ? priority : entries[i++ % entries.length];
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
