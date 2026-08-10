/** Shared market / OHLCV types for the trading chart system. */

export type MarketDataSource = "live" | "cached" | "sim" | "delayed";

export interface OhlcvBar {
  /** Unix ms */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type CandleResolution =
  | "1"
  | "5"
  | "15"
  | "30"
  | "60"
  | "240"
  | "D"
  | "W"
  | "M";

export interface MarketDataRequest {
  ticker: string;
  timeframe: string;
  start?: number;
  end?: number;
  resolution?: CandleResolution;
}

export interface MarketDataResult {
  candles: OhlcvBar[];
  source: MarketDataSource;
  resolution: CandleResolution;
  /** Honest status for UI banners */
  status: "ok" | "loading" | "error" | "no_data" | "market_closed" | "rate_limited" | "unconfigured";
  error?: string;
  delayed?: boolean;
  fetchedAt: number;
}

export interface CompareSeries {
  symbol: string;
  name: string;
  candles: OhlcvBar[];
  /** Normalized % from first close in window */
  perfPct: number;
  source: MarketDataSource;
}
