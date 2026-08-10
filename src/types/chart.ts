/** Chart UI / indicator configuration types. */

export type ChartType = "candlestick" | "line" | "area";

/** Range presets shown in the primary selector. */
export type ChartRange =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "MAX";

/** Intraday resolutions when the provider supports them. */
export type IntradayResolution = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";

export type IndicatorId =
  | "sma20"
  | "sma50"
  | "sma200"
  | "ema20"
  | "ema50"
  | "rsi"
  | "macd"
  | "bb"
  | "volume";

export interface IndicatorDef {
  id: IndicatorId;
  label: string;
  group: "ma" | "oscillator" | "bands" | "volume";
  defaultOn: boolean;
}

export const INDICATOR_DEFS: IndicatorDef[] = [
  { id: "sma20", label: "SMA 20", group: "ma", defaultOn: false },
  { id: "sma50", label: "SMA 50", group: "ma", defaultOn: false },
  { id: "sma200", label: "SMA 200", group: "ma", defaultOn: false },
  { id: "ema20", label: "EMA 20", group: "ma", defaultOn: false },
  { id: "ema50", label: "EMA 50", group: "ma", defaultOn: false },
  { id: "bb", label: "Bollinger Bands", group: "bands", defaultOn: false },
  { id: "rsi", label: "RSI 14", group: "oscillator", defaultOn: false },
  { id: "macd", label: "MACD", group: "oscillator", defaultOn: false },
  { id: "volume", label: "Volume", group: "volume", defaultOn: true },
];

export type DrawingTool = "none" | "trendline" | "horizontal" | "vertical" | "sr";

export interface ChartOhlcHover {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDrawing {
  id: string;
  tool: DrawingTool;
  /** Price for horizontal / first point price for trend */
  price?: number;
  price2?: number;
  /** Unix sec for vertical / first point time */
  time?: number;
  time2?: number;
}
