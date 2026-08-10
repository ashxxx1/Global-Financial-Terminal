/**
 * Backtest engine — walk-forward aware, no look-ahead bias.
 * Only data ≤ simulated timestamp T is available to the model.
 */
import { GftCoreModel } from "./engine";
import { getMarketDataProvider } from "./marketDataProvider";
import { resolveSignalAgainstBars, applyResolution } from "./resolve";
import { computePerformance } from "./performance";
import { validateCandidate } from "./validate";
import { SIGNAL_ASSETS } from "./assets";
import type { PerformanceStats, Signal, SignalAsset, SignalTimeframe } from "./types";
import { MODEL_CORE } from "./types";

export interface BacktestRequest {
  assetId: string;
  from: number;
  to: number;
  timeframe?: SignalTimeframe;
  modelName?: string;
  modelVersion?: string;
  /** Walk-forward windows (optional). */
  trainUntil?: number;
  validateUntil?: number;
}

export interface BacktestResult {
  request: BacktestRequest;
  signals: Signal[];
  stats: PerformanceStats;
  inSampleStats: PerformanceStats | null;
  outOfSampleStats: PerformanceStats | null;
  note: string;
  sharpe: number | null;
}

function sharpeFromReturns(returns: number[]): number | null {
  if (returns.length < 5) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const v = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const sd = Math.sqrt(v);
  if (sd === 0) return null;
  // Per-signal Sharpe, annualized approx assuming ~252 signals/year if daily
  return (mean / sd) * Math.sqrt(252);
}

export function runBacktest(req: BacktestRequest): BacktestResult {
  const asset = SIGNAL_ASSETS.find((a) => a.assetId === req.assetId) as SignalAsset | undefined;
  if (!asset) {
    return emptyResult(req, "Unknown asset");
  }
  const provider = getMarketDataProvider();
  const timeframe = req.timeframe ?? "1D";
  const modelName = req.modelName ?? MODEL_CORE.name;
  const modelVersion = req.modelVersion ?? MODEL_CORE.version;

  // Walk calendar days; at each T use only candles <= T
  const signals: Signal[] = [];
  for (let t = req.from; t <= req.to; t += 86400000) {
    const dow = new Date(t).getUTCDay();
    if (dow === 0 || dow === 6) continue;

    const candles = provider.getHistoricalData(asset.quoteSymbol, "1Y", t)
      .map((c, i) => ({ ...c, v: c.v ?? 800 + (i % 50) }));
    const candidate = GftCoreModel.generateSignal({ asset, candles, asOf: t });
    if (!candidate) continue;
    if (!validateCandidate(candidate).ok) continue;

    let signal: Signal = {
      id: `bt_${asset.assetId}_${t}`,
      assetId: asset.assetId,
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      market: asset.market,
      exchange: asset.exchange,
      direction: candidate.direction,
      signalType: candidate.signalType,
      entryLow: candidate.entryLow,
      entryHigh: candidate.entryHigh,
      signalPrice: candidate.snapshot.price,
      referencePrice: candidate.snapshot.price,
      targetPrice: candidate.targetPrice,
      stopPrice: candidate.stopPrice,
      expectedReturn: candidate.expectedReturn,
      expectedMove: candidate.expectedMove,
      risk: candidate.risk,
      riskReward: candidate.riskReward,
      confidence: candidate.confidence,
      timeframe,
      modelName,
      modelVersion,
      reasoning: candidate.reasoning,
      factors: candidate.factors,
      createdAt: t,
      expiresAt: t + 86400000,
      status: "ACTIVE",
      entryPriceActual: null,
      exitPriceActual: null,
      realizedReturn: null,
      resolvedAt: null,
      resolutionNote: null,
      sourceSnapshot: candidate.snapshot,
      demo: true,
    };

    const futureBars = provider.getHistoricalData(asset.quoteSymbol, "1Y", req.to)
      .filter((b) => b.t > t && b.t <= Math.min(req.to, t + 5 * 86400000));
    const update = resolveSignalAgainstBars(signal, futureBars, Math.min(req.to, t + 5 * 86400000));
    if (update) signal = applyResolution(signal, update);
    signals.push(signal);
  }

  const stats = computePerformance(signals);
  const rets = signals.map((s) => s.realizedReturn).filter((x): x is number => x != null);

  let inSampleStats: PerformanceStats | null = null;
  let outOfSampleStats: PerformanceStats | null = null;
  let note = "Backtest uses only data available at each simulated timestamp (no look-ahead).";

  if (req.trainUntil && req.validateUntil) {
    const is = signals.filter((s) => s.createdAt <= req.trainUntil!);
    const oos = signals.filter((s) => s.createdAt > req.validateUntil!);
    inSampleStats = computePerformance(is);
    outOfSampleStats = oos.length ? computePerformance(oos) : null;
    if (!oos.length) note = "Insufficient validated history.";
    else note = "Walk-forward: training ≤ trainUntil; out-of-sample after validateUntil.";
  } else if (signals.length < 10) {
    note = "Insufficient validated history.";
  }

  return {
    request: req,
    signals,
    stats,
    inSampleStats,
    outOfSampleStats,
    note,
    sharpe: sharpeFromReturns(rets),
  };
}

function emptyResult(req: BacktestRequest, note: string): BacktestResult {
  return {
    request: req,
    signals: [],
    stats: computePerformance([]),
    inSampleStats: null,
    outOfSampleStats: null,
    note,
    sharpe: null,
  };
}
