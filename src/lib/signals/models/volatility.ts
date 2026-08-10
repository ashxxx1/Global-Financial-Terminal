import type { ModelScore } from "../types";
import type { Bar } from "../indicators";
import { atr, closesOf, stdev } from "../indicators";

/**
 * Volatility: ATR / price and recent compression.
 * Contracting vol after a trend can support breakout setups (mild positive).
 * Extreme vol reduces confidence in either direction (score → 0).
 */
export function VolatilityModel(bars: Bar[]): ModelScore {
  const closes = closesOf(bars);
  const a = atr(bars, 14);
  const price = closes[closes.length - 1];
  const vol = stdev(closes, 20);
  if (a == null || !price || vol == null) {
    return { key: "volatility", label: "Volatility", score: 0, detail: "Insufficient history for ATR" };
  }
  const atrPct = a / price;
  const volPct = vol / price;
  let score = 0;
  // Prefer moderate/contracting volatility for cleaner R:R
  if (atrPct < 0.012) score += 35;
  else if (atrPct < 0.02) score += 15;
  else if (atrPct > 0.04) score -= 40;
  else score -= 10;

  // Compression vs recent: last ATR vs prior window approx via volPct
  if (volPct < 0.015) score += 20;
  score = Math.max(-100, Math.min(100, score));
  const detail = `ATR ${(atrPct * 100).toFixed(2)}% of price; 20D vol ${(volPct * 100).toFixed(2)}%`;
  return { key: "volatility", label: "Volatility", score, detail };
}
