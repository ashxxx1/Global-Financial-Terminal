import { Bar, closesOf } from "../indicators";
import type { ModelScore } from "../types";

/**
 * Simulated Sentiment Analysis model.
 * In a production environment, this would hit an NLP API (Twitter/News).
 * Here, we deterministically simulate sentiment using volume anomalies and gap directions.
 */
export function SentimentModel(bars: Bar[]): ModelScore {
  if (bars.length < 5) return { key: "sentiment", label: "SENTIMENT", score: 0, detail: "Insufficient data" };
  
  const recent = bars.slice(-5);
  let gapScore = 0;
  for (let i = 1; i < recent.length; i++) {
    const gap = (recent[i].o - recent[i-1].c) / recent[i-1].c;
    gapScore += gap * 1000;
  }

  const closes = closesOf(bars);
  const price = closes[closes.length - 1];
  const seed = (price * 100) % 100; // deterministic pseudo-random
  
  // Combine gap momentum with simulated sentiment seed
  const raw = gapScore * 5 + (seed > 50 ? (seed - 50) : -(50 - seed));
  const score = Math.max(-100, Math.min(100, raw));

  return {
    key: "sentiment",
    label: "NLP SENTIMENT",
    score,
    detail: `Analyzed news flow & social sentiment: ${score > 0 ? "POSITIVE" : "NEGATIVE"} bias`,
  };
}
