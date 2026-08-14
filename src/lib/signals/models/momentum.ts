import type { ModelScore } from "../types";
import type { Bar } from "../indicators";
import { closesOf, roc, rsi } from "../indicators";

/** Momentum: RSI + rate of change. */
export function MomentumModel(bars: Bar[]): ModelScore {
  const closes = closesOf(bars);
  const r = rsi(closes, 14);
  const rate = roc(closes, 10);
  if (r == null || rate == null) {
    return { key: "momentum", label: "Momentum", score: 0, detail: "Insufficient history for momentum" };
  }
  let score = 0;
  if (r >= 55 && r <= 70) score += 40;
  else if (r > 70) score += 15;
  else if (r <= 45 && r >= 30) score -= 40;
  else if (r < 30) score -= 15;
  else score += (r - 50) * 1.2;

  score += Math.max(-50, Math.min(50, rate * 8));
  score = Math.max(-100, Math.min(100, score));
  const detail = `RSI ${r.toFixed(1)}, 10D ROC ${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`;
  return { key: "momentum", label: "Momentum", score, detail };
}
