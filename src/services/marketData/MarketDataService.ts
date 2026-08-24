/**
 * MarketDataService — single chart-facing OHLCV abstraction.
 *
 * Priority:
 *  1. Live/delayed candles via /api/candles (Finnhub → Yahoo → Alpha Vantage)
 *  2. Honest SIM fallback from market.ts history engine (never labeled live)
 *
 * Never silently invents "live" data.
 */
import { historyFor, metaFor, type Source, type HistorySource } from "../../lib/market";
import type {
  CandleResolution,
  CompareSeries,
  MarketDataRequest,
  MarketDataResult,
  MarketDataSource,
  OhlcvBar,
} from "../../types/market";
import type { ChartRange, IntradayResolution } from "../../types/chart";
import {
  finnhubResolution,
  windowForIntraday,
  windowForRange,
} from "../../lib/charts/timeframes";
import { aggregateBars } from "../../lib/charts/indicators";

const cache = new Map<string, { at: number; result: MarketDataResult }>();
const CACHE_TTL_LIVE_MS = 30_000;
const CACHE_TTL_SIM_MS = 120_000;

/**
 * Local-dev-only fallback key.
 *
 * Two things matter here and both were wrong before:
 *
 *  1. The access must be the literal `import.meta.env.X`. Writing
 *     `(import.meta as any).env?.X` is a DYNAMIC lookup, which Vite cannot
 *     statically replace — so it inlined the entire env object into the
 *     production bundle, publishing this key and every other VITE_ variable.
 *  2. It must be gated on DEV so the production build drops the reference
 *     altogether rather than shipping a key that simply happens to be unused.
 */
const DEV_KEY: string = import.meta.env.DEV
  ? (import.meta.env.VITE_FINNHUB_API_KEY || "")
  : "";

function cacheKey(ticker: string, resolution: string, from: number, to: number): string {
  return `${ticker}|${resolution}|${from}|${to}`;
}

/**
 * Chart history carries HistorySource, not Source — spot prices no longer have
 * a simulated state but candle series still do, and the two must not be
 * conflated.
 */
function mapSource(s: Source | HistorySource): MarketDataSource {
  if (s === "live") return "live";
  if (s === "cached") return "cached";
  return "sim";
}

/** Deterministic volume from price action when provider omits it. */
function synthVolume(symbol: string, o: number, h: number, l: number, c: number, i: number): number {
  let hsh = 2166136261;
  const key = `${symbol}:${i}`;
  for (let n = 0; n < key.length; n++) {
    hsh ^= key.charCodeAt(n);
    hsh = Math.imul(hsh, 16777619);
  }
  const range = Math.max(h - l, c * 0.001);
  const body = Math.abs(c - o);
  const base = Math.abs(c) * 8000;
  const factor = 0.55 + ((hsh >>> 0) % 900) / 1000;
  return Math.max(1000, Math.round((base + body * 250000 + range * 180000) * factor));
}

function simBars(symbol: string, range: ChartRange, resolution: CandleResolution): MarketDataResult {
  // Map chart ranges onto the existing history engine day counts.
  const histRange =
    range === "1D" || range === "5D" ? "1W"
      : range === "1M" ? "1M"
        : range === "3M" ? "3M"
          : range === "6M" || range === "YTD" ? "6M"
            : "1Y";

  const { candles, source } = historyFor(symbol, histRange);
  let bars: OhlcvBar[] = candles.map((c, i) => ({
    t: c.t,
    o: c.o,
    h: c.h,
    l: c.l,
    c: c.c,
    v: synthVolume(symbol, c.o, c.h, c.l, c.c, i),
  }));

  // Trim / expand for YTD / 5Y / MAX approximations from available SIM series
  const now = Date.now();
  if (range === "YTD") {
    const y0 = Date.UTC(new Date(now).getUTCFullYear(), 0, 1);
    bars = bars.filter((b) => b.t >= y0);
  }
  if (range === "1D") {
    // Build synthetic intraday from last daily bar + quote wiggle — labeled SIM.
    const last = bars[bars.length - 1];
    if (last) {
      const out: OhlcvBar[] = [];
      const step = resolution === "1" ? 60_000
        : resolution === "5" ? 300_000
          : resolution === "15" ? 900_000
            : resolution === "30" ? 1_800_000
              : 3_600_000;
      const n = Math.min(78, Math.floor(6.5 * 3600_000 / step));
      let px = last.o;
      for (let i = 0; i < n; i++) {
        const t = now - (n - i) * step;
        const wobble = last.c * 0.0012 * Math.sin(i / 3.2);
        const o = px;
        const c = last.c * (1 + wobble * 0.4) * (1 + (i / n - 0.5) * ((last.c - last.o) / last.o) * 0.3);
        const h = Math.max(o, c) * (1 + Math.abs(wobble) * 0.3);
        const l = Math.min(o, c) * (1 - Math.abs(wobble) * 0.3);
        out.push({ t, o, h, l, c, v: synthVolume(symbol, o, h, l, c, i) });
        px = c;
      }
      // Anchor last close to daily close
      if (out.length) out[out.length - 1].c = last.c;
      bars = out;
    }
  } else if (range === "5D" && (resolution === "5" || resolution === "15" || resolution === "30" || resolution === "60" || resolution === "240")) {
    // Expand last 5 daily bars into coarse intraday SIM bars
    const last5 = bars.slice(-5);
    const step = resolution === "5" ? 300_000 : resolution === "15" ? 900_000 : resolution === "30" ? 1_800_000 : 3_600_000;
    const out: OhlcvBar[] = [];
    for (const day of last5) {
      const n = Math.max(6, Math.floor(6.5 * 3600_000 / step));
      for (let i = 0; i < n; i++) {
        const t = day.t - (n - i) * step + 6.5 * 3600_000;
        const f = i / (n - 1 || 1);
        const o = day.o + (day.c - day.o) * Math.max(0, f - 0.05);
        const c = day.o + (day.c - day.o) * f;
        const h = Math.max(o, c, day.h * (0.998 + f * 0.002));
        const l = Math.min(o, c, day.l * (1.002 - f * 0.002));
        out.push({ t, o, h, l, c, v: Math.round(day.v / n) });
      }
    }
    if (out.length) bars = out;
  } else if (range === "5Y" || range === "MAX") {
    // Upsample available year of SIM into weekly-ish by keeping every 5th bar
    // and synthesizing earlier history by walking seed backwards.
    const seed = bars[0];
    if (seed) {
      const weeks = range === "MAX" ? 520 : 260;
      const extra: OhlcvBar[] = [];
      let close = seed.o;
      let hsh = 2166136261 ^ symbol.length;
      const rnd = () => {
        hsh = Math.imul(hsh ^ (hsh >>> 13), 0x5bd1e995);
        return ((hsh >>> 0) % 10000) / 10000;
      };
      for (let i = weeks; i > bars.length; i--) {
        const drift = (rnd() - 0.48) * 0.04;
        const o = close / (1 + drift);
        const c = close;
        const h = Math.max(o, c) * (1 + rnd() * 0.015);
        const l = Math.min(o, c) * (1 - rnd() * 0.015);
        extra.unshift({
          t: now - i * 7 * 86400000,
          o, h, l, c,
          v: synthVolume(symbol, o, h, l, c, i),
        });
        close = o;
      }
      bars = [...extra, ...bars.filter((_, i) => i % 5 === 0 || i > bars.length - 40)];
    }
  }

  return {
    candles: bars,
    source: mapSource(source),
    resolution,
    status: bars.length ? "ok" : "no_data",
    fetchedAt: Date.now(),
  };
}

async function fetchLiveCandles(
  symbol: string,
  resolution: CandleResolution,
  fromSec: number,
  toSec: number,
): Promise<MarketDataResult | null> {
  const fhRes = finnhubResolution(resolution);
  const qs =
    `symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${encodeURIComponent(fhRes)}` +
    `&from=${fromSec}&to=${toSec}`;

  const tryProxy = async (): Promise<Response | null> => {
    try {
      return await fetch(`/api/candles?${qs}`);
    } catch {
      return null;
    }
  };

  let res = await tryProxy();
  if (res && (res.status === 501 || res.status === 404)) {
    res = null;
  }

  // Local vite fallback: direct Finnhub with VITE_ key (dev only)
  if ((!res || !res.ok) && DEV_KEY) {
    try {
      const url =
        `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}` +
        `&resolution=${encodeURIComponent(fhRes)}&from=${fromSec}&to=${toSec}&token=${DEV_KEY}`;
      res = await fetch(url);
    } catch {
      return null;
    }
  }

  if (!res) return null;

  if (res.status === 429) {
    return {
      candles: [],
      source: "live",
      resolution,
      status: "rate_limited",
      error: "Market data rate limited — retry shortly",
      fetchedAt: Date.now(),
    };
  }
  if (res.status === 501) {
    return {
      candles: [],
      source: "sim",
      resolution,
      status: "unconfigured",
      error: "Live candle feed not configured",
      fetchedAt: Date.now(),
    };
  }
  if (!res.ok) return null;

  // Vite may serve api/*.ts as JS (200 text/javascript) in local dev — never treat that as market data.
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("application/json") && !ctype.includes("text/json")) {
    return null;
  }

  let data: {
    candles?: OhlcvBar[];
    source?: MarketDataSource;
    provider?: string;
    status?: string;
    s?: string;
    t?: number[];
    o?: number[];
    h?: number[];
    l?: number[];
    c?: number[];
    v?: number[];
    error?: string;
  };
  try {
    data = await res.json();
  } catch {
    return null;
  }

  // Normalize both proxy shape and raw Finnhub shape
  let candles: OhlcvBar[] = [];
  if (Array.isArray(data.candles)) {
    candles = data.candles.map((c) => ({
      t: c.t < 1e12 ? c.t * 1000 : c.t,
      o: c.o, h: c.h, l: c.l, c: c.c, v: c.v ?? 0,
    }));
  } else if (data.s === "ok" && data.t?.length) {
    candles = data.t.map((t, i) => ({
      t: t * 1000,
      o: data.o![i],
      h: data.h![i],
      l: data.l![i],
      c: data.c![i],
      v: data.v?.[i] ?? 0,
    }));
  } else if (data.s === "no_data" || data.status === "no_data") {
    return {
      candles: [],
      source: "delayed",
      resolution,
      status: "no_data",
      fetchedAt: Date.now(),
    };
  }

  if (resolution === "240") {
    candles = aggregateBars(candles, 4 * 3600_000);
  }

  const src: MarketDataSource =
    data.source === "live" || data.source === "delayed" || data.source === "cached" || data.source === "sim"
      ? data.source
      : "delayed";

  return {
    candles,
    source: src,
    resolution,
    status: candles.length ? "ok" : "no_data",
    delayed: src !== "live",
    fetchedAt: Date.now(),
  };
}

export class MarketDataService {
  /** Fetch OHLCV for a ticker + timeframe. */
  async getOhlcv(req: MarketDataRequest): Promise<MarketDataResult> {
    const ticker = req.ticker.toUpperCase();
    const timeframe = (req.timeframe || "3M") as ChartRange;
    const now = req.end ?? Date.now();

    const win = req.resolution
      ? {
          from: Math.floor((req.start ?? now - 90 * 86400000) / 1000),
          to: Math.floor(now / 1000),
          resolution: req.resolution,
          maxBars: 800,
        }
      : windowForRange(timeframe, now);

    const key = cacheKey(ticker, win.resolution, win.from, win.to);
    const hit = cache.get(key);
    if (hit) {
      const ttl = hit.result.source === "live" ? CACHE_TTL_LIVE_MS : CACHE_TTL_SIM_MS;
      if (Date.now() - hit.at < ttl) return hit.result;
    }

    const meta = metaFor(ticker);
    const canLive = !!meta && meta.kind === "stock" && meta.country === "US";

    if (canLive) {
      const live = await fetchLiveCandles(ticker, win.resolution, win.from, win.to);
      if (live && live.status === "rate_limited") {
        cache.set(key, { at: Date.now(), result: live });
        return live;
      }
      if (live && live.status === "ok" && live.candles.length > 0) {
        // Cap bars
        if (live.candles.length > win.maxBars) {
          live.candles = live.candles.slice(-win.maxBars);
        }
        cache.set(key, { at: Date.now(), result: live });
        return live;
      }
      // Live empty/error → fall through to SIM with honest labeling
    }

    const sim = simBars(ticker, timeframe, win.resolution);
    if (sim.candles.length > win.maxBars) {
      sim.candles = sim.candles.slice(-win.maxBars);
    }
    cache.set(key, { at: Date.now(), result: sim });
    return sim;
  }

  async getForRange(
    ticker: string,
    range: ChartRange,
    intraday?: IntradayResolution | null,
  ): Promise<MarketDataResult> {
    const win = intraday && (range === "1D" || range === "5D" || intraday !== "1D")
      ? windowForIntraday(intraday, range)
      : windowForRange(range);
    return this.getOhlcv({
      ticker,
      timeframe: range,
      start: win.from * 1000,
      end: win.to * 1000,
      resolution: win.resolution,
    });
  }

  /** Normalized % performance comparison series. */
  async compare(symbols: string[], range: ChartRange): Promise<CompareSeries[]> {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await this.getForRange(symbol, range);
        const candles = data.candles;
        const first = candles.find((c) => c.c > 0)?.c ?? 0;
        const last = candles[candles.length - 1]?.c ?? first;
        const perfPct = first ? ((last - first) / first) * 100 : 0;
        return {
          symbol,
          name: metaFor(symbol)?.name ?? symbol,
          candles,
          perfPct,
          source: data.source,
        } satisfies CompareSeries;
      }),
    );
    return results;
  }

  clearCache(ticker?: string): void {
    if (!ticker) {
      cache.clear();
      return;
    }
    const prefix = ticker.toUpperCase() + "|";
    for (const k of cache.keys()) {
      if (k.startsWith(prefix)) cache.delete(k);
    }
  }
}

let singleton: MarketDataService | null = null;

export function getMarketDataService(): MarketDataService {
  if (!singleton) singleton = new MarketDataService();
  return singleton;
}
