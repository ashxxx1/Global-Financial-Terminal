/**
 * Timeframe → resolution / lookback mapping.
 * Requests only the bars needed for the selected window.
 */
import type { CandleResolution } from "../../types/market";
import type { ChartRange, IntradayResolution } from "../../types/chart";

export const CHART_RANGES: ChartRange[] = [
  "1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX",
];

export const INTRADAY_RESOLUTIONS: IntradayResolution[] = [
  "1m", "5m", "15m", "30m", "1H", "4H", "1D",
];

export interface TimeWindow {
  from: number; // unix sec
  to: number;   // unix sec
  resolution: CandleResolution;
  /** Cap on bars returned after aggregation */
  maxBars: number;
}

function startOfYearMs(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), 0, 1);
}

/** Map a range preset to Finnhub resolution + lookback. */
export function windowForRange(range: ChartRange, now = Date.now()): TimeWindow {
  const to = Math.floor(now / 1000);
  const day = 86400;
  switch (range) {
    case "1D":
      return { from: to - day, to, resolution: "5", maxBars: 400 };
    case "5D":
      return { from: to - 5 * day, to, resolution: "15", maxBars: 500 };
    case "1M":
      return { from: to - 31 * day, to, resolution: "D", maxBars: 40 };
    case "3M":
      return { from: to - 93 * day, to, resolution: "D", maxBars: 100 };
    case "6M":
      return { from: to - 186 * day, to, resolution: "D", maxBars: 200 };
    case "YTD":
      return { from: Math.floor(startOfYearMs(now) / 1000), to, resolution: "D", maxBars: 280 };
    case "1Y":
      return { from: to - 365 * day, to, resolution: "D", maxBars: 280 };
    case "5Y":
      return { from: to - 5 * 365 * day, to, resolution: "W", maxBars: 280 };
    case "MAX":
      return { from: to - 20 * 365 * day, to, resolution: "W", maxBars: 1100 };
    default: {
      const _exhaustive: never = range;
      return _exhaustive;
    }
  }
}

/** Override resolution when user picks an explicit intraday interval. */
export function windowForIntraday(
  res: IntradayResolution,
  range: ChartRange,
  now = Date.now(),
): TimeWindow {
  const base = windowForRange(range, now);
  const to = base.to;
  const day = 86400;
  switch (res) {
    case "1m":
      return { from: to - Math.min(base.to - base.from, 2 * day), to, resolution: "1", maxBars: 800 };
    case "5m":
      return { from: to - Math.min(base.to - base.from, 5 * day), to, resolution: "5", maxBars: 800 };
    case "15m":
      return { from: to - Math.min(base.to - base.from, 10 * day), to, resolution: "15", maxBars: 800 };
    case "30m":
      return { from: to - Math.min(base.to - base.from, 20 * day), to, resolution: "30", maxBars: 800 };
    case "1H":
      return { from: to - Math.min(base.to - base.from, 40 * day), to, resolution: "60", maxBars: 800 };
    case "4H":
      // Finnhub has no 4H — fetch 60m and aggregate client-side.
      return { from: to - Math.min(base.to - base.from, 90 * day), to, resolution: "240", maxBars: 500 };
    case "1D":
      return { ...base, resolution: "D", maxBars: Math.max(base.maxBars, 400) };
    default: {
      const _exhaustive: never = res;
      return _exhaustive;
    }
  }
}

/** Finnhub resolution string (240 → fetch 60, aggregate later). */
export function finnhubResolution(res: CandleResolution): string {
  if (res === "240") return "60";
  return res;
}

export function isIntradayRange(range: ChartRange): boolean {
  return range === "1D" || range === "5D";
}
