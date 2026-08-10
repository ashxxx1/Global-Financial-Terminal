/**
 * Server-side Finnhub candle proxy.
 *
 * GET /api/candles?symbol=AAPL&resolution=D&from=<unix>&to=<unix>
 *   -> { candles: [{t,o,h,l,c,v}, ...], source: "live" }
 *
 * Key stays server-side (FINNHUB_API_KEY). Never returns synthetic bars.
 */

export const config = { runtime: "edge" };

const KEY = process.env.FINNHUB_API_KEY || "";
const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,12}$/;
const RESOLUTIONS = new Set(["1", "5", "15", "30", "60", "D", "W", "M"]);

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();
  const resolution = (searchParams.get("resolution") || "D").toUpperCase();
  const from = Number(searchParams.get("from") || "0");
  const to = Number(searchParams.get("to") || "0");

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return Response.json({ error: "bad symbol" }, { status: 400 });
  }
  if (!RESOLUTIONS.has(resolution)) {
    return Response.json({ error: "bad resolution" }, { status: 400 });
  }
  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0 || from >= to) {
    return Response.json({ error: "bad from/to" }, { status: 400 });
  }
  if (!KEY) {
    return Response.json({ error: "not configured" }, { status: 501 });
  }

  try {
    const url =
      `https://finnhub.io/api/v1/stock/candle` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&from=${Math.floor(from)}` +
      `&to=${Math.floor(to)}` +
      `&token=${KEY}`;

    const upstream = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (upstream.status === 429) {
      return Response.json({ error: "rate limited" }, { status: 429 });
    }
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);

    const raw = await upstream.json() as {
      s?: string;
      t?: number[];
      o?: number[];
      h?: number[];
      l?: number[];
      c?: number[];
      v?: number[];
    };

    if (raw.s === "no_data" || !raw.t?.length) {
      return new Response(JSON.stringify({ candles: [], source: "live", status: "no_data" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }
    if (raw.s !== "ok") {
      return Response.json({ error: `upstream status ${raw.s || "unknown"}` }, { status: 502 });
    }

    const candles = raw.t.map((t, i) => ({
      t: t * 1000,
      o: raw.o![i],
      h: raw.h![i],
      l: raw.l![i],
      c: raw.c![i],
      v: raw.v?.[i] ?? 0,
    }));

    const maxAge = resolution === "D" || resolution === "W" || resolution === "M" ? 300 : 30;
    return new Response(JSON.stringify({ candles, source: "live", status: "ok" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}
