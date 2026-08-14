import type { ModelScore } from "../types";
import type { Bar } from "../indicators";
import { closesOf, sma } from "../indicators";

/** Trend: short vs long moving average relationship. */
export function TrendModel(bars: Bar[]): ModelScore {
  const closes = closesOf(bars);
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const price = closes[closes.length - 1];
  if (s20 == null || s50 == null || price == null) {
    return { key: "trend", label: "Trend", score: 0, detail: "Insufficient history for MA trend" };
  }
  let score = 0;
  if (price > s20) score += 35;
  else score -= 35;
  if (s20 > s50) score += 40;
  else score -= 40;
  if (price > s50) score += 25;
  else score -= 25;
  score = Math.max(-100, Math.min(100, score));
  const detail =
    price > s20 && s20 > s50
      ? "Price above 20D & 50D; short MA above long MA"
      : price < s20 && s20 < s50
        ? "Price below 20D & 50D; short MA below long MA"
        : "Mixed moving-average structure";
  return { key: "trend", label: "Trend", score, detail };
}
