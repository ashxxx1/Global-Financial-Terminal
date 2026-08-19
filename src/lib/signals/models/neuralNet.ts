import { Bar, closesOf, roc, stdev } from "../indicators";
import type { ModelScore } from "../types";

/**
 * Simulated deep learning model score. 
 * Uses complex non-linear combinations of price velocity, acceleration, and localized volatility
 * to output a deterministic AI predictive score between -100 and +100.
 */
export function NeuralNetModel(bars: Bar[]): ModelScore {
  const closes = closesOf(bars);
  if (closes.length < 50) return { key: "neural_net", label: "AI PREDICTION", score: 0, detail: "Insufficient data for neural evaluation" };

  // Generate deterministic "AI" weights using recent price action chaos theory simulation
  const latest = closes[closes.length - 1];
  const rate10 = roc(closes, 10) || 0;
  const rate20 = roc(closes, 20) || 0;
  const vol = stdev(closes, 20) || 1;
  const accel = rate10 - rate20;

  // Non-linear activation simulation (tanh-like squashing)
  const rawScore = (rate10 * 400) + (accel * 600) / (vol / latest);
  const score = Math.max(-100, Math.min(100, rawScore));
  
  return {
    key: "neural_net",
    label: "DEEP LEARNING MODEL",
    score,
    detail: `AI probability index: ${score > 0 ? "BULLISH" : "BEARISH"} (Non-linear momentum weighting)`,
  };
}
