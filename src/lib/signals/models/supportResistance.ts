import type { ModelScore } from "../types";
import type { Bar } from "../indicators";
import { recentHigh, recentLow } from "../indicators";

/** Support / resistance from recent swing highs/lows. */
export function SupportResistanceModel(bars: Bar[]): ModelScore & { support: number; resistance: number } {
  const support = recentLow(bars, 20);
  const resistance = recentHigh(bars, 20);
  const price = bars[bars.length - 1]?.c ?? 0;
  const range = resistance - support || 1;
  const pos = (price - support) / range; // 0 near support, 1 near resistance
  let score: number;
  // Near breakout of resistance → mild bullish pressure; near support → bounce bias
  if (pos > 0.85) score = 25;
  else if (pos < 0.15) score = -10; // could bounce, but treat as caution until confirmed
  else score = (0.5 - pos) * 20;
  score = Math.max(-100, Math.min(100, score));
  return {
    key: "levels",
    label: "Support / resistance",
    score,
    detail: `20D range ${support.toFixed(2)} – ${resistance.toFixed(2)}; position ${(pos * 100).toFixed(0)}%`,
    support,
    resistance,
  };
}
