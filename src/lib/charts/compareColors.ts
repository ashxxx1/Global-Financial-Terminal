/** Shared palette for multi-asset compare overlays (primary first). */
export const COMPARE_COLORS = ["rgba(255,255,255,0.48)", "#FFFFFF", "rgba(255,255,255,0.58)", "rgba(255,255,255,0.30)", "rgba(255,255,255,0.66)"] as const;

export const POPULAR_COMPARE_PAIRS: Array<[string, string]> = [
  ["AAPL", "MSFT"],
  ["NVDA", "AMD"],
  ["GOOGL", "META"],
  ["AMZN", "TSLA"],
  ["SPY", "QQQ"],
  ["JPM", "BAC"],
  ["XOM", "CVX"],
];
