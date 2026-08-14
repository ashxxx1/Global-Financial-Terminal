/**
 * Non-US daily closes via Alpha Vantage.
 *
 * Finnhub's free tier prices US tickers only, which left 573 of 593 instruments
 * permanently simulated. Alpha Vantage's free tier does return several
 * international exchanges — verified working for .LON (London) and .BSE
 * (Bombay); .TYO/.T (Tokyo) returns an empty quote and is not supported.
 *
 * The hard limit is 25 requests PER DAY. That is far too few to poll, so this
 * is not a live feed and is not presented as one: it fetches an official
 * previous close, caches it at the edge for 12 hours, and the client rotates a
 * handful of symbols per session. Coverage therefore builds up over days rather
 * than arriving at once, and every value it produces is labelled as a daily
 * close, never as a live price.
 *
 * GET /api/intl-quote?symbol=SHEL.LON -> { c, dp, day }
 */

export const config = { runtime: "edge" };

// Prefers the env var; falls back to the free key supplied for this project.
// It is rate-limited to 25 req/day, carries no billing, and is regenerable —
// but it should still move to ALPHAVANTAGE_KEY in project settings when
// convenient, and must be rotated if this repository is ever made public.
const KEY = process.env.ALPHAVANTAGE_KEY || "DMLME2ASCXPNJHSA";

const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,16}$/;

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return Response.json({ error: "bad symbol" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${KEY}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const j = await upstream.json();

    // Alpha Vantage answers 200 with an "Information"/"Note" body when the
    // daily quota is spent, and an empty object for unsupported exchanges.
    // Both must read as "no data", not as a price of zero.
    const q = j["Global Quote"];
    if (!q || !q["05. price"]) {
      const throttled = Boolean(j.Information || j.Note);
      return new Response(
        JSON.stringify({ error: throttled ? "quota" : "unsupported" }),
        {
          status: throttled ? 429 : 404,
          headers: {
            "content-type": "application/json",
            // Cache the refusal hard: with 25 calls a day, a retry storm is
            // more expensive than the miss it is trying to fix.
            "cache-control": "public, s-maxage=3600",
          },
        },
      );
    }

    const c = parseFloat(q["05. price"]);
    const dp = parseFloat(String(q["10. change percent"] || "0").replace("%", ""));

    return new Response(
      JSON.stringify({ c, dp: Number.isFinite(dp) ? dp : 0, day: q["07. latest trading day"] || null }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          // A daily close does not change intraday. 12h shared cache keeps the
          // whole site inside 25 calls/day no matter how many people visit.
          "cache-control": "public, s-maxage=43200, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}
