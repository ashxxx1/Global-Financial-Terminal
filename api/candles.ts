/**
 * Server-side OHLCV candle proxy.
 *
 * GET /api/candles?symbol=AAPL&resolution=D&from=<unix>&to=<unix>
 *   -> { candles: [{t,o,h,l,c,v}, ...], source: "live"|"delayed", provider }
 *
 * Finnhub free tier returns 403 on /stock/candle (quotes still work).
 * Order: Finnhub (if keyed) → Yahoo chart → Alpha Vantage (optional key).
 * Never returns synthetic bars.
 */

export const config = { runtime: "edge" };

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";
const AV_KEY = process.env.ALPHA_VANTAGE_KEY || process.env.VITE_ALPHA_VANTAGE_KEY || "";
const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,12}$/;
const RESOLUTIONS = new Set(["1", "5", "15", "30", "60", "D", "W", "M"]);

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };

function json(data: unknown, status = 200, maxAge = 60): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    },
  });
}

function yahooInterval(resolution: string): string {
  switch (resolution) {
    case "1": return "1m";
    case "5": return "5m";
    case "15": return "15m";
    case "30": return "30m";
    case "60": return "60m";
    case "W": return "1wk";
    case "M": return "1mo";
    default: return "1d";
  }
}

async function fromFinnhub(
  symbol: string, resolution: string, from: number, to: number,
): Promise<{ bars: Bar[]; blocked?: boolean } | null> {
  if (!FINNHUB_KEY) return null;
  const url =
    `https://finnhub.io/api/v1/stock/candle` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${encodeURIComponent(resolution)}` +
    `&from=${Math.floor(from)}&to=${Math.floor(to)}` +
    `&token=${FINNHUB_KEY}`;
  const upstream = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (upstream.status === 403) return { bars: [], blocked: true };
  if (upstream.status === 429) throw new Error("rate limited");
  if (!upstream.ok) return null;
  const raw = await upstream.json() as {
    s?: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[];
  };
  if (raw.s === "no_data" || !raw.t?.length) return { bars: [] };
  if (raw.s !== "ok") return null;
  return {
    bars: raw.t.map((t, i) => ({
      t: t * 1000,
      o: raw.o![i],
      h: raw.h![i],
      l: raw.l![i],
      c: raw.c![i],
      v: raw.v?.[i] ?? 0,
    })),
  };
}

async function fromYahoo(
  symbol: string, resolution: string, from: number, to: number,
): Promise<Bar[] | null> {
  const interval = yahooInterval(resolution);
  // Intraday Yahoo history is shallow; clamp window to stay under limits.
  let period1 = Math.floor(from);
  let period2 = Math.floor(to);
  if (["1m", "5m", "15m", "30m", "60m"].includes(interval)) {
    const maxSpan =
      interval === "1m" ? 7 * 86400
        : interval === "5m" || interval === "15m" ? 60 * 86400
          : 730 * 86400;
    period1 = Math.max(period1, period2 - maxSpan);
  }
  const url =
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false&events=div%2Csplits`;
  const upstream = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; GFTTerminal/1.0; +https://global-financial-terminal-eight.vercel.app)",
      accept: "application/json",
    },
  });
  if (upstream.status === 429) throw new Error("rate limited");
  if (!upstream.ok) return null;
  const raw = await upstream.json() as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ open?: (number|null)[]; high?: (number|null)[]; low?: (number|null)[]; close?: (number|null)[]; volume?: (number|null)[] }> };
      }>;
      error?: unknown;
    };
  };
  const result = raw.chart?.result?.[0];
  const ts = result?.timestamp;
  const q = result?.indicators?.quote?.[0];
  if (!ts?.length || !q) return [];
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    if (![o, h, l, c].every(Number.isFinite)) continue;
    bars.push({ t: ts[i] * 1000, o, h, l, c, v: q.volume?.[i] ?? 0 });
  }
  return bars;
}

async function fromAlphaVantage(symbol: string, resolution: string): Promise<Bar[] | null> {
  if (!AV_KEY) return null;
  // AV free tier is daily-focused; skip intraday here to avoid burning the key.
  if (!["D", "W", "M"].includes(resolution)) return null;
  const fn =
    resolution === "W" ? "TIME_SERIES_WEEKLY"
      : resolution === "M" ? "TIME_SERIES_MONTHLY"
        : "TIME_SERIES_DAILY";
  const url =
    `https://www.alphavantage.co/query?function=${fn}` +
    `&symbol=${encodeURIComponent(symbol)}&apikey=${AV_KEY}&outputsize=compact`;
  const upstream = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!upstream.ok) return null;
  const raw = await upstream.json() as Record<string, Record<string, Record<string, string>> | string>;
  if (typeof raw["Note"] === "string" || typeof raw["Information"] === "string") {
    throw new Error("rate limited");
  }
  const seriesKey = Object.keys(raw).find((k) => k.includes("Time Series") || k.includes("Weekly") || k.includes("Monthly"));
  if (!seriesKey || typeof raw[seriesKey] !== "object") return null;
  const series = raw[seriesKey] as Record<string, Record<string, string>>;
  const bars: Bar[] = Object.entries(series).map(([day, row]) => ({
    t: Date.parse(`${day}T00:00:00Z`),
    o: Number(row["1. open"]),
    h: Number(row["2. high"]),
    l: Number(row["3. low"]),
    c: Number(row["4. close"]),
    v: Number(row["5. volume"] || 0),
  })).filter((b) => Number.isFinite(b.t) && Number.isFinite(b.c));
  bars.sort((a, b) => a.t - b.t);
  return bars;
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();
  const resolution = (searchParams.get("resolution") || "D").toUpperCase();
  const from = Number(searchParams.get("from") || "0");
  const to = Number(searchParams.get("to") || "0");

  if (!symbol || !SYMBOL_RE.test(symbol)) return json({ error: "bad symbol" }, 400);
  if (!RESOLUTIONS.has(resolution)) return json({ error: "bad resolution" }, 400);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0 || from >= to) {
    return json({ error: "bad from/to" }, 400);
  }

  try {
    // 1) Finnhub (premium candle entitlement)
    try {
      const fh = await fromFinnhub(symbol, resolution, from, to);
      if (fh && !fh.blocked && fh.bars.length) {
        const maxAge = resolution === "D" || resolution === "W" || resolution === "M" ? 300 : 30;
        return json({ candles: fh.bars, source: "live", provider: "finnhub", status: "ok" }, 200, maxAge);
      }
      if (fh && !fh.blocked && fh.bars.length === 0) {
        // Explicit empty from Finnhub — still try Yahoo for coverage gaps.
      }
    } catch (e) {
      if (e instanceof Error && e.message === "rate limited") return json({ error: "rate limited" }, 429);
    }

    // 2) Yahoo Finance chart (no key; delayed / free)
    try {
      const y = await fromYahoo(symbol, resolution, from, to);
      if (y && y.length) {
        const maxAge = resolution === "D" || resolution === "W" || resolution === "M" ? 300 : 45;
        return json({ candles: y, source: "delayed", provider: "yahoo", status: "ok" }, 200, maxAge);
      }
      if (y && y.length === 0) {
        return json({ candles: [], source: "delayed", provider: "yahoo", status: "no_data" }, 200, 60);
      }
    } catch (e) {
      if (e instanceof Error && e.message === "rate limited") {
        // Fall through to Alpha Vantage if available.
      } else {
        // continue
      }
    }

    // 3) Optional Alpha Vantage
    try {
      const av = await fromAlphaVantage(symbol, resolution);
      if (av && av.length) {
        const clipped = av.filter((b) => b.t >= from * 1000 && b.t <= to * 1000);
        const bars = clipped.length ? clipped : av.slice(-120);
        return json({ candles: bars, source: "delayed", provider: "alphavantage", status: "ok" }, 200, 300);
      }
    } catch (e) {
      if (e instanceof Error && e.message === "rate limited") return json({ error: "rate limited" }, 429);
    }

    return json({
      error: "No candle provider returned data. Finnhub free tier blocks /stock/candle; Yahoo/Alpha Vantage also failed.",
      status: "unconfigured",
    }, 502);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "fetch failed" }, 502);
  }
}
