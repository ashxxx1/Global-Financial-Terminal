/**
 * Server-side Finnhub quote proxy.
 *
 * The stock feed used to call Finnhub directly from the browser with a VITE_
 * key, which meant the key was baked into the client bundle and readable by
 * anyone. This proxies the call so the key lives only in a server env var
 * (FINNHUB_API_KEY, NOT VITE_-prefixed) and never reaches the client.
 *
 * GET /api/quote?symbol=AAPL  ->  { c, dp }  (current price, percent change)
 */

export const config = { runtime: "edge" };

const KEY = process.env.FINNHUB_API_KEY || "";

/** Finnhub free tier prices plain US tickers: letters, digits, dot, dash. */
const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,12}$/;

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return Response.json({ error: "bad symbol" }, { status: 400 });
  }
  if (!KEY) {
    // Not configured on this deployment — tell the client clearly so it can
    // stop polling instead of hammering a proxy that will never answer.
    return Response.json({ error: "not configured" }, { status: 501 });
  }

  try {
    const upstream = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${KEY}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (upstream.status === 429) {
      return Response.json({ error: "rate limited" }, { status: 429 });
    }
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);

    const q = await upstream.json();
    // Return only the two fields the client needs — never the raw upstream,
    // and never anything that could echo the token.
    return new Response(JSON.stringify({ c: q.c, dp: q.dp }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Quotes move constantly but a few seconds of shared cache smooths the
        // round-robin and keeps us well under the rate limit.
        "cache-control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}
