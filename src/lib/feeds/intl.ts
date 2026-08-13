import { setLiveQuote, metaFor } from "../market";
import { STOCKS_BY_COUNTRY } from "../../data/stocksData";

/**
 * Real daily closes for non-US equities, built up gradually.
 *
 * Alpha Vantage's free tier allows 25 requests per DAY, so this deliberately
 * does not poll. It fetches a small rotating batch once per session, the proxy
 * caches each result at the edge for 12 hours, and coverage accumulates across
 * visits instead of arriving at once.
 *
 * The rotation offset is derived from the day number, so consecutive days cover
 * different symbols rather than re-fetching the same ones forever.
 *
 * Values are marked `source: "cached"`, not `"live"` — they are an official
 * previous close, and the provenance badge renders that honestly rather than
 * claiming a live feed the free tier does not provide.
 */

/** Exchange suffixes Alpha Vantage's free tier actually answers for.
 *  Verified: .LON and .BSE return quotes; Tokyo (.TYO/.T) returns an empty
 *  object and is omitted rather than wasting one of 25 daily calls. */
const SUFFIX: Record<string, string> = {
  GB: ".LON",
  IN: ".BSE",
  DE: ".DEX",
  FR: ".PAR",
  CA: ".TRT",
  BR: ".SAO",
  AU: ".AX",
};

const PER_SESSION = 6;      // stay well inside 25/day across a few visitors
const SPACING_MS = 1500;    // Alpha Vantage asks for ~1 request/second

interface Row { ticker: string; }

function candidates(): { local: string; remote: string }[] {
  const out: { local: string; remote: string }[] = [];
  for (const [country, suffix] of Object.entries(SUFFIX)) {
    const roster = (STOCKS_BY_COUNTRY as Record<string, Row[]>)[country] || [];
    for (const r of roster) {
      if (!metaFor(r.ticker)) continue;
      out.push({ local: r.ticker, remote: `${r.ticker}${suffix}` });
    }
  }
  return out;
}

export function startIntlFeed(): () => void {
  // `vite dev` does not run the /api functions; it resolves /api/intl-quote to
  // the source file and tries to transform TypeScript as a browser module,
  // which throws a parse-error overlay over the whole app. Same trap the candle
  // fetch hit earlier. There is nothing to gain from running this locally, so
  // it simply does not start.
  if (import.meta.env.DEV) return () => {};

  const all = candidates();
  if (all.length === 0) return () => {};

  // Rotate by day so the covered set moves rather than repeating.
  const day = Math.floor(Date.now() / 86_400_000);
  const start = (day * PER_SESSION) % all.length;
  const batch = Array.from({ length: Math.min(PER_SESSION, all.length) },
    (_, i) => all[(start + i) % all.length]);

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = async (i: number) => {
    if (cancelled || i >= batch.length) return;
    const { local, remote } = batch[i];
    try {
      const r = await fetch(`/api/intl-quote?symbol=${encodeURIComponent(remote)}`);
      // Belt and braces: if anything ever serves this route as something other
      // than JSON, treat it as no data rather than throwing on parse.
      if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
        const q = await r.json();
        if (typeof q.c === "number" && q.c > 0) {
          // "cached", not "live": this is yesterday's official close.
          setLiveQuote(local, { price: q.c, changePct: q.dp ?? 0, source: "cached" });
        }
      }
      // 404 (unsupported exchange) and 429 (daily quota spent) both simply mean
      // no data — the deterministic engine keeps the panel populated and the
      // badge keeps saying SIMULATED, which stays true.
    } catch { /* offline or proxy absent in dev */ }
    timer = setTimeout(() => void run(i + 1), SPACING_MS);
  };

  timer = setTimeout(() => void run(0), 2500);   // let the app paint first

  return () => { cancelled = true; if (timer) clearTimeout(timer); };
}
