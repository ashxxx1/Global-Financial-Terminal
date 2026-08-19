import { setLiveQuote } from "../market";
import { ALL_YAHOO_ENTRIES } from "./yahooSymbols";

/**
 * Live prices for non-US equities, from their own exchanges.
 *
 * Sweeps the verified symbol list in batches of 20 through /api/intl-quotes.
 * 400 symbols is 20 requests a sweep; at one batch every 2.5s a full pass takes
 * ~50s, and because the batches are fixed and in a stable order their cache
 * keys are stable too, so every visitor after the first is served from the edge.
 *
 * This supersedes the ADR feed for any name it covers. An ADR was always a
 * compromise — a dollar proxy for a foreign company — where this is the actual
 * local listing in the local currency the terminal already shows.
 */

const BATCH = 20;
const POLL_MS = 2500;
const BACKOFF_MS = 30000;
const REPROBE_MS = 120000;

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** The symbol on screen, polled every other slot so an open page is seconds
 *  fresh rather than waiting out a full sweep. */
let priority: { key: string; y: string } | null = null;
export function setIntlPriority(sym: string | null): void {
  const hit = sym ? ALL_YAHOO_ENTRIES.find((e) => e.key === sym) : undefined;
  priority = hit ? { key: hit.key, y: hit.y } : null;
}

/** Which symbols this feed can price — used to avoid double-polling via ADRs. */
export const intlCoverage = (): Set<string> =>
  new Set(ALL_YAHOO_ENTRIES.map((e) => e.key));

interface QuoteMap {
  quotes?: Record<string, { p: number; dp: number; cur: string; at: number }>;
}

export function startIntlFeed(): () => void {
  if (started) return () => {};
  started = true;

  // Fixed batches, built once, so the URLs — and therefore the edge cache
  // entries — are identical for every visitor.
  const batches: { key: string; y: string }[][] = [];
  for (let i = 0; i < ALL_YAHOO_ENTRIES.length; i += BATCH) {
    batches.push(ALL_YAHOO_ENTRIES.slice(i, i + BATCH).map((e) => ({ key: e.key, y: e.y })));
  }
  if (batches.length === 0) { started = false; return () => {}; }

  let i = 0;
  let dead = 0;
  let alternate = false;

  const tick = async () => {
    alternate = !alternate;
    const batch = priority && alternate ? [priority] : batches[i++ % batches.length];
    const params = batch.map((b) => b.y).join(",");

    try {
      const r = await fetch(`/api/intl-quotes?symbols=${encodeURIComponent(params)}`);
      if (r.status === 429) { schedule(BACKOFF_MS); return; }
      if (r.status === 501 || r.status === 404) { started = false; return; }
      if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
        const body = (await r.json()) as QuoteMap;
        const quotes = body.quotes ?? {};
        dead = 0;
        for (const b of batch) {
          const q = quotes[b.y];
          if (q && q.p > 0) {
            setLiveQuote(b.key, { price: q.p, changePct: q.dp, source: "live" });
          }
        }
      }
    } catch {
      if (++dead >= 3) { dead = 0; schedule(REPROBE_MS); return; }
    }
    schedule(POLL_MS);
  };

  const schedule = (ms: number) => { timer = setTimeout(tick, ms); };
  schedule(1200);   // after the US equity feed takes its first slot

  return () => { started = false; if (timer) clearTimeout(timer); };
}
