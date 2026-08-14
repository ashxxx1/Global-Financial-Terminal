/**
 * Model evaluation framework.
 * Financial metrics dominate classification accuracy for trading signals.
 */
import { isLoss, isWin, isResolved } from "./performance";
import type { Signal } from "./types";

export interface EvaluationReport {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  hitRate: number | null;
  profitFactor: number | null;
  maxDrawdown: number;
  expectancy: number | null;
  sampleSize: number;
  note: string;
}

/**
 * Treat TARGET_HIT as positive class, STOP_HIT as negative.
 * EXPIRED/AMBIGUOUS excluded from classification metrics.
 */
export function evaluateSignals(signals: Signal[]): EvaluationReport {
  const decided = signals.filter((s) => s.status === "TARGET_HIT" || s.status === "STOP_HIT");
  const tp = decided.filter(isWin).length;
  const fn = 0; // no explicit "missed opportunity" labels in MVP
  const fp = decided.filter(isLoss).length;
  const n = decided.length;

  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  const accuracy = n ? tp / n : null;
  const f1 = precision != null && recall != null && precision + recall
    ? (2 * precision * recall) / (precision + recall)
    : null;

  const wins = decided.filter(isWin).map((s) => s.realizedReturn ?? 0);
  const losses = decided.filter(isLoss).map((s) => s.realizedReturn ?? 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : null;

  let cum = 0, peak = 0, maxDd = 0;
  for (const s of [...signals].filter(isResolved).sort((a, b) => (a.resolvedAt ?? 0) - (b.resolvedAt ?? 0))) {
    cum += s.realizedReturn ?? 0;
    peak = Math.max(peak, cum);
    maxDd = Math.min(maxDd, cum - peak);
  }

  const pWin = n ? tp / n : 0;
  const pLoss = n ? fp / n : 0;
  const avgW = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgL = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  const expectancy = n ? pWin * avgW - pLoss * avgL : null;

  return {
    accuracy,
    precision,
    recall,
    f1,
    hitRate: accuracy,
    profitFactor,
    maxDrawdown: maxDd,
    expectancy,
    sampleSize: n,
    note: "Classification metrics use TARGET_HIT vs STOP_HIT only. Prefer profit factor, expectancy, and drawdown over raw accuracy.",
  };
}
