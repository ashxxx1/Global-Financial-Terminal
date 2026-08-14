/**
 * Publish-time validation. Invalid candidates are rejected — never stored.
 */
import { MIN_RISK_REWARD, type Signal, type SignalCandidate } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateCandidate(c: SignalCandidate): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(c.entryLow) || !Number.isFinite(c.entryHigh)) errors.push("entry missing");
  if (!Number.isFinite(c.targetPrice)) errors.push("target missing");
  if (!Number.isFinite(c.stopPrice)) errors.push("stop missing");
  if (c.confidence < 0 || c.confidence > 100) errors.push("confidence out of range");
  if (!["BULLISH", "BEARISH", "NEUTRAL"].includes(c.direction)) errors.push("direction invalid");
  if (c.entryLow > c.entryHigh) errors.push("entryLow > entryHigh");

  if (c.direction === "BULLISH") {
    if (!(c.targetPrice > c.entryHigh)) errors.push("bullish target must be above entry");
    if (!(c.stopPrice < c.entryLow)) errors.push("bullish stop must be below entry");
  }
  if (c.direction === "BEARISH") {
    if (!(c.targetPrice < c.entryLow)) errors.push("bearish target must be below entry");
    if (!(c.stopPrice > c.entryHigh)) errors.push("bearish stop must be above entry");
  }
  if (!(c.riskReward >= MIN_RISK_REWARD)) errors.push(`risk/reward below ${MIN_RISK_REWARD}`);
  if (!c.snapshot || !Number.isFinite(c.snapshot.price)) errors.push("snapshot invalid");
  if (!c.factors?.length) errors.push("factors missing");

  return { ok: errors.length === 0, errors };
}

export function validatePublishedSignal(s: Signal): ValidationResult {
  const errors: string[] = [];
  if (!s.id || !s.symbol || !s.modelName || !s.modelVersion) errors.push("identity incomplete");
  if (!s.createdAt) errors.push("timestamp invalid");
  if (!s.assetId) errors.push("asset invalid");
  const cand: SignalCandidate = {
    direction: s.direction,
    signalType: s.signalType,
    confidence: s.confidence,
    entryLow: s.entryLow,
    entryHigh: s.entryHigh,
    targetPrice: s.targetPrice,
    stopPrice: s.stopPrice,
    expectedReturn: s.expectedReturn,
    expectedMove: s.expectedMove,
    risk: s.risk,
    riskReward: s.riskReward,
    factors: s.factors,
    reasoning: s.reasoning,
    snapshot: s.sourceSnapshot,
  };
  const base = validateCandidate(cand);
  return { ok: base.ok && errors.length === 0, errors: [...errors, ...base.errors] };
}

/**
 * Enforce immutability: reject any attempt to change locked prediction fields.
 */
export function assertImmutableUpdate(
  existing: Signal,
  patch: Partial<Signal>,
): { ok: boolean; errors: string[] } {
  const locked = [
    "id", "assetId", "symbol", "name", "assetType", "market", "exchange",
    "direction", "signalType", "entryLow", "entryHigh", "signalPrice",
    "referencePrice", "targetPrice", "stopPrice", "expectedReturn",
    "expectedMove", "risk", "riskReward", "confidence", "timeframe",
    "modelName", "modelVersion", "reasoning", "createdAt", "expiresAt",
    "sourceSnapshot", "demo",
  ] as const;
  const errors: string[] = [];
  for (const k of locked) {
    if (k in patch && (patch as any)[k] !== undefined && JSON.stringify((patch as any)[k]) !== JSON.stringify((existing as any)[k])) {
      errors.push(`immutable field changed: ${k}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
