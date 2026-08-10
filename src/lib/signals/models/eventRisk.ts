import type { ModelScore } from "../types";
import type { Bar } from "../indicators";
import { atr, closesOf } from "../indicators";

/**
 * Event-risk proxy from sudden volatility spikes.
 * Elevated event risk reduces confidence (score near 0 / negative weight in confidence).
 */
export function EventRiskModel(bars: Bar[]): ModelScore {
  const a = atr(bars, 14);
  const closes = closesOf(bars);
  const price = closes[closes.length - 1];
  if (a == null || !price || bars.length < 5) {
    return { key: "eventRisk", label: "Event risk", score: 0, detail: "No elevated event-risk proxy" };
  }
  // Compare last bar range to ATR
  const last = bars[bars.length - 1];
  const range = last.h - last.l;
  const spike = range / a;
  let score: number;
  if (spike > 2.2) score = -60;
  else if (spike > 1.6) score = -30;
  else score = 15;
  const detail =
    spike > 1.6
      ? `Elevated range spike (${spike.toFixed(2)}× ATR) — event risk caution`
      : "No elevated event-risk proxy from recent range";
  return { key: "eventRisk", label: "Event risk", score, detail };
}
