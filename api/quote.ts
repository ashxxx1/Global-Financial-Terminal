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
      // Cache the refusal too. Otherwise every client retries independently and
      // the stampede keeps us rate-limited far longer than necessary.
      return new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
        headers: { "content-type": "application/json", "cache-control": "public, s-maxage=20" },
      });
    }
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);

    const q = await upstream.json();
    // Return only the two fields the client needs — never the raw upstream,
    // and never anything that could echo the token.
    return new Response(JSON.stringify({ c: q.c, dp: q.dp }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Shared edge cache is the only thing standing between us and the
        // 60 req/min free-tier cap. The client sweeps symbols round-robin, so
        // two visitors almost never ask for the same ticker inside a 5s window
        // — at s-maxage=5 every extra visitor multiplied upstream calls and the
        // feed spent most of its time in 429 backoff, which is what made prices
        // look frozen. 30s is well inside the delay the free tier already has,
        // and stale-while-revalidate means nobody ever waits on a refresh.
        "cache-control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}
