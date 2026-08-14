/**
 * GFT CORE v1.0 — transparent baseline SignalModel.
 * Do NOT claim statistical edge until validated out-of-sample.
 */
import { atr, closesOf, roc, rsi, sma, stdev, recentHigh, recentLow, volumeRatio } from "./indicators";
import type { Bar } from "./indicators";
import { runModularModels } from "./models";
import {
  buildReasoning,
  confidenceFromScores,
  compositeDirectionalScore,
  directionFromScore,
} from "./scoring";
import {
  MAX_RISK_REWARD,
  MIN_CONFIDENCE,
  MIN_RISK_REWARD,
  MODEL_CORE,
  type MarketSnapshot,
  type SignalCandidate,
  type SignalModel,
  type SignalType,
} from "./types";

function buildSnapshot(bars: Bar[], regime: MarketSnapshot["regime"], support: number, resistance: number): MarketSnapshot | null {
  const closes = closesOf(bars);
  const price = closes[closes.length - 1];
  if (price == null) return null;
  const a = atr(bars, 14);
  const r = rsi(closes, 14);
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const s200 = sma(closes, 200);
  const vol = stdev(closes, 20);
  const rate = roc(closes, 10);
  if (a == null || r == null || s20 == null || s50 == null || vol == null || rate == null) return null;
  return {
    price,
    rsi: r,
    atr: a,
    sma20: s20,
    sma50: s50,
    sma200: s200,
    volumeRatio: volumeRatio(bars, 20),
    volatility: vol / price,
    roc10: rate,
    regime,
    recentHigh20: recentHigh(bars, 20),
    recentLow20: recentLow(bars, 20),
    support,
    resistance,
    capturedAt: bars[bars.length - 1]?.t ?? Date.now(),
  };
}

function computeLevels(
  direction: "BULLISH" | "BEARISH",
  price: number,
  atrVal: number,
  support: number,
  resistance: number,
): { entryLow: number; entryHigh: number; target: number; stop: number; rr: number; expectedReturn: number; risk: number } | null {
  const band = Math.max(atrVal * 0.25, price * 0.0015);
  const entryLow = price - band;
  const entryHigh = price + band;
  const entryMid = price;

  if (direction === "BULLISH") {
    const stopFromSupport = Math.min(support, entryMid - atrVal * 1.0);
    const stop = Math.min(stopFromSupport, entryLow - atrVal * 0.35);
    const riskDist = entryMid - stop;
    if (riskDist <= 0) return null;
    let target = Math.max(resistance, entryMid + riskDist * MIN_RISK_REWARD);
    // Prefer 1.5–3.0 R:R using ATR extension
    const atrTarget = entryMid + atrVal * 1.8;
    target = Math.max(target, atrTarget);
    let rr = (target - entryMid) / riskDist;
    if (rr > MAX_RISK_REWARD) {
      target = entryMid + riskDist * MAX_RISK_REWARD;
      rr = MAX_RISK_REWARD;
    }
    if (rr < MIN_RISK_REWARD) return null;
    if (!(target > entryHigh && stop < entryLow)) return null;
    const expectedReturn = (target - entryMid) / entryMid;
    const risk = (stop - entryMid) / entryMid;
    return { entryLow, entryHigh, target, stop, rr, expectedReturn, risk };
  }

  // BEARISH
  const stopFromRes = Math.max(resistance, entryMid + atrVal * 1.0);
  const stop = Math.max(stopFromRes, entryHigh + atrVal * 0.35);
  const riskDist = stop - entryMid;
  if (riskDist <= 0) return null;
  let target = Math.min(support, entryMid - riskDist * MIN_RISK_REWARD);
  const atrTarget = entryMid - atrVal * 1.8;
  target = Math.min(target, atrTarget);
  let rr = (entryMid - target) / riskDist;
  if (rr > MAX_RISK_REWARD) {
    target = entryMid - riskDist * MAX_RISK_REWARD;
    rr = MAX_RISK_REWARD;
  }
  if (rr < MIN_RISK_REWARD) return null;
  if (!(target < entryLow && stop > entryHigh)) return null;
  const expectedReturn = (entryMid - target) / entryMid; // positive magnitude for short
  const risk = (entryMid - stop) / entryMid; // negative
  return { entryLow, entryHigh, target, stop, rr, expectedReturn: -expectedReturn, risk: -risk };
}

function signalTypeFor(direction: SignalCandidate["direction"], scores: ReturnType<typeof runModularModels>["scores"]): SignalType {
  if (direction === "NEUTRAL") return "NEUTRAL";
  const mom = scores.find((s) => s.key === "momentum");
  const levels = scores.find((s) => s.key === "levels");
  if (levels && Math.abs(levels.score) > 20) return "BREAKOUT";
  if (mom && Math.abs(mom.score) > 40) return "MOMENTUM";
  return direction;
}

export const GftCoreModel: SignalModel = {
  name: MODEL_CORE.name,
  version: MODEL_CORE.version,
  generateSignal({ candles, asOf }) {
    const bars = candles.filter((c) => c.t <= asOf) as Bar[];
    if (bars.length < 55) return null;

    const bundle = runModularModels(bars);
    const composite = compositeDirectionalScore(bundle.scores);
    const direction = directionFromScore(composite);
    if (direction === "NEUTRAL") return null; // MVP: no low-edge neutral publications

    const snapshot = buildSnapshot(bars, bundle.regime, bundle.support, bundle.resistance);
    if (!snapshot) return null;

    const levels = computeLevels(direction, snapshot.price, snapshot.atr, snapshot.support, snapshot.resistance);
    if (!levels) return null;

    const { confidence, factors } = confidenceFromScores(bundle.scores, direction);
    if (confidence < MIN_CONFIDENCE) return null;

    const reasoning = buildReasoning(factors, direction);
    const expectedMove = direction === "BULLISH"
      ? (levels.target - snapshot.price) / snapshot.price
      : (snapshot.price - levels.target) / snapshot.price;

    return {
      direction,
      signalType: signalTypeFor(direction, bundle.scores),
      confidence,
      entryLow: roundPx(levels.entryLow, snapshot.price),
      entryHigh: roundPx(levels.entryHigh, snapshot.price),
      targetPrice: roundPx(levels.target, snapshot.price),
      stopPrice: roundPx(levels.stop, snapshot.price),
      expectedReturn: levels.expectedReturn,
      expectedMove,
      risk: levels.risk,
      riskReward: levels.rr,
      factors,
      reasoning,
      snapshot,
    };
  },
};

function roundPx(v: number, ref: number): number {
  if (ref >= 1000) return Math.round(v * 100) / 100;
  if (ref >= 100) return Math.round(v * 100) / 100;
  if (ref >= 1) return Math.round(v * 10000) / 10000;
  return Math.round(v * 1e6) / 1e6;
}

export function listModels(): SignalModel[] {
  return [GftCoreModel];
}
