export const config = { runtime: "edge" };

/**
 * Batched local-exchange quotes for non-US equities.
 *
 * Finnhub's free tier is US-only, which left ~400 of our non-US names on
 * simulated prices. Yahoo's chart feed prices them on their own exchange in
 * their own currency — a better answer than the ADR route, which could only
 * ever give a dollar proxy for a foreign company.
 *
 * Batching is the whole design. One request per symbol would be 400 requests a
 * sweep; the spark endpoint takes 20 symbols at a time, so a full sweep is 20
 * requests. The 20 is measured, not guessed: 20 returns 200 and 25 returns 400.
 *
 * Caveat worth stating plainly: this is an undocumented endpoint. It is already
 * what backs our candles fallback, but this materially deepens the dependency.
 * See docs/DATA-LICENSING.md — it needs a licensed provider before we charge.
 */

const SPARK = "https://query1.finance.yahoo.com/v7/finance/spark";
/** Measured ceiling: 20 symbols answers 200, 25 answers 400. */
const MAX_SYMBOLS = 20;

/** Exchanges that quote in a sub-unit, and the divisor back to the major unit. */
const SUBUNIT: Record<string, number> = { GBp: 100, ZAc: 100, ILA: 100, KWF: 1000 };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("symbols") || "").trim();
  if (!raw) return json({ error: "no symbols" }, 400);

  const symbols = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (symbols.length > MAX_SYMBOLS) {
    return json({ error: `too many symbols (max ${MAX_SYMBOLS})` }, 400);
  }
  // Yahoo symbols are alphanumerics plus dot, dash and caret. Anything else is
  // someone probing, and it would be interpolated into an upstream URL.
  if (symbols.some((s) => !/^[A-Za-z0-9.\-^]{1,16}$/.test(s))) {
    return json({ error: "bad symbol" }, 400);
  }

  try {
    const upstream = await fetch(
      `${SPARK}?symbols=${symbols.map(encodeURIComponent).join(",")}&range=5d&interval=1d`,
      {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; GFTTerminal/1.0)",
          accept: "application/json",
        },
      },
    );
    if (upstream.status === 429) return json({ error: "rate limited" }, 429, "public, s-maxage=30");
    if (!upstream.ok) return json({ error: `upstream ${upstream.status}` }, 502);

    const body = await upstream.json();
    const results: Record<string, { p: number; dp: number; cur: string; at: number }> = {};

    for (const entry of body?.spark?.result ?? []) {
      const meta = entry?.response?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      const prev = meta?.chartPreviousClose;
      if (typeof price !== "number" || !(price > 0)) continue;

      const cur: string = meta.currency || "";
      const div = SUBUNIT[cur] ?? 1;
      // Both price and previous close are quoted in the same unit, so the
      // percentage is unaffected — but the level must be converted or a £33.93
      // share renders as £3,393.
      results[entry.symbol] = {
        p: price / div,
        dp: typeof prev === "number" && prev > 0 ? ((price - prev) / prev) * 100 : 0,
        cur,
        at: (meta.regularMarketTime ?? 0) * 1000,
      };
    }

    return json(
      { quotes: results, fetchedAt: Date.now() },
      200,
      "public, s-maxage=60, stale-while-revalidate=120",
    );
  } catch {
    return json({ error: "fetch failed" }, 502);
  }
}

function json(body: unknown, status: number, cache?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": cache ?? "no-store",
    },
  });
}
