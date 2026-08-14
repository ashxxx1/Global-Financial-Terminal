/**
 * SignalScoringEngine — combines modular model scores into direction + confidence.
 * Confidence is model agreement, NOT a claim of statistical predictive power.
 */
import type { ModelScore, SignalDirection, SignalFactor } from "./types";

const WEIGHTS: Record<string, number> = {
  trend: 0.20,
  momentum: 0.20,
  volatility: 0.15,
  volume: 0.15,
  regime: 0.15,
  levels: 0.05,
  eventRisk: 0.10,
  // Historical setup performance placeholder (neutral until calibrated)
  historical: 0.0,
};

export function compositeDirectionalScore(scores: ModelScore[]): number {
  let num = 0;
  let den = 0;
  for (const s of scores) {
    const w = WEIGHTS[s.key] ?? 0.1;
    // Volume and volatility are confirmation — sign them by trend/momentum later
    num += s.score * w;
    den += w;
  }
  return den ? num / den : 0;
}

export function directionFromScore(score: number): SignalDirection {
  if (score >= 18) return "BULLISH";
  if (score <= -18) return "BEARISH";
  return "NEUTRAL";
}

/**
 * Confidence 0–100 from agreement of factor signs with chosen direction,
 * plus setup quality (vol, volume, regime, historical placeholder).
 */
export function confidenceFromScores(
  scores: ModelScore[],
  direction: SignalDirection,
): { confidence: number; factors: SignalFactor[] } {
  const dirSign = direction === "BULLISH" ? 1 : direction === "BEARISH" ? -1 : 0;
  const factors: SignalFactor[] = [];

  const buckets: { key: string; weight: number; agree: number; label: string; detail: string }[] = [
    { key: "trend", weight: 0.20, agree: 0, label: "Trend agreement", detail: "" },
    { key: "momentum", weight: 0.20, agree: 0, label: "Momentum agreement", detail: "" },
    { key: "volatility", weight: 0.15, agree: 0, label: "Volatility setup", detail: "" },
    { key: "volume", weight: 0.15, agree: 0, label: "Volume confirmation", detail: "" },
    { key: "regime", weight: 0.15, agree: 0, label: "Market regime", detail: "" },
    { key: "historical", weight: 0.15, agree: 0.5, label: "Historical setup performance", detail: "Baseline model — no calibrated history yet" },
  ];

  for (const b of buckets) {
    if (b.key === "historical") {
      factors.push({
        key: b.key, label: b.label, score: 0, weight: b.weight,
        polarity: "neutral", detail: b.detail,
      });
      continue;
    }
    const s = scores.find((x) => x.key === b.key);
    if (!s) continue;
    let agree: number;
    if (b.key === "volatility" || b.key === "volume" || b.key === "eventRisk") {
      // Higher score = cleaner setup (less event risk / better vol)
      agree = (s.score + 100) / 200;
    } else if (dirSign === 0) {
      agree = 1 - Math.min(1, Math.abs(s.score) / 100);
    } else {
      agree = s.score * dirSign > 0 ? Math.min(1, Math.abs(s.score) / 80) : Math.max(0, 0.35 - Math.abs(s.score) / 200);
    }
    b.agree = agree;
    b.detail = s.detail;
    const signed = dirSign === 0 ? 0 : s.score * dirSign;
    factors.push({
      key: s.key,
      label: b.label,
      score: s.score,
      weight: b.weight,
      polarity: signed > 8 ? "positive" : signed < -8 ? "negative" : "neutral",
      detail: s.detail,
    });
  }

  // Event risk as a soft penalty inside confidence
  const event = scores.find((x) => x.key === "eventRisk");
  if (event && event.score < -20) {
    factors.push({
      key: "eventRisk",
      label: "Event risk",
      score: event.score,
      weight: 0.1,
      polarity: "negative",
      detail: event.detail,
    });
  }

  let conf = 0;
  for (const b of buckets) conf += b.agree * b.weight * 100;
  if (event && event.score < -20) conf *= 0.9;
  conf = Math.round(Math.max(0, Math.min(100, conf)));
  return { confidence: conf, factors };
}

export function buildReasoning(factors: SignalFactor[], direction: SignalDirection): string {
  const lines: string[] = [];
  for (const f of factors) {
    if (f.key === "historical") continue;
    const prefix = f.polarity === "positive" ? "+" : f.polarity === "negative" ? "-" : "·";
    lines.push(`${prefix} ${f.detail}`);
  }
  lines.push(`MODEL VIEW: ${direction}`);
  return lines.join("\n");
}
