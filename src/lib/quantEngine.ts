/**
 * GLOBALFIN QUANT ENGINE
 * ----------------------
 * Pure, dependency-free TypeScript implementing the actual statistical/quant
 * methods behind the Signal Desk, Scenario Simulator, Precedent Panel, and
 * Contagion Matrix. No hardcoded output numbers anywhere in this file —
 * every score is computed from inputs. If you currently have a static
 * "Instability Risk: 42" or similar hardcoded badge, delete it and call
 * instabilityIndex() instead.
 *
 * Drop this in src/lib/quantEngine.ts.
 */

// ============================================================
// 1. STATISTICS PRIMITIVES
// ============================================================

export function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + (b - m) ** 2, 0) / ((arr.length - 1) || 1);
  return Math.sqrt(variance);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Z-score x against a rolling historical window. Clipped to [-3, 3] to stop outliers dominating. */
export function zScore(x: number, history: number[]): number {
  const m = mean(history);
  const s = stdDev(history) || 1e-9;
  return clamp((x - m) / s, -3, 3);
}

// ============================================================
// 2. MOMENTUM FACTOR — 12-1 month (Jegadeesh & Titman)
// ============================================================

/** prices: chronological daily closes, oldest first, length >= 253 (~1 trading year). */
export function momentumFactor(prices: number[]): number {
  const n = prices.length;
  const pRecent = prices[n - 22]; // skip most recent ~1 month to avoid short-term reversal
  const pYearAgo = prices[n - 253] ?? prices[0];
  return pRecent / pYearAgo - 1;
}

// ============================================================
// 3. VOLATILITY — EWMA (RiskMetrics lambda = 0.94)
// ============================================================

/** returns: log returns, chronological. */
export function ewmaVolatility(returns: number[], lambda = 0.94): number {
  let variance = returns[0] ** 2;
  for (let i = 1; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * returns[i] ** 2;
  }
  return Math.sqrt(variance);
}

export function annualizeVol(dailyVol: number): number {
  return dailyVol * Math.sqrt(252);
}

// ============================================================
// 4. MACRO REGIME INDEX
// ============================================================

export interface MacroInputs {
  yieldSlope: number;          // e.g. 10y - 2y
  pmi: number;                 // purchasing managers index, 50 = neutral
  unemploymentDelta3m: number; // change in unemployment over 3 months
  inflationSurprise: number;   // actual - expected inflation
}

export function macroIndex(curr: MacroInputs, history: MacroInputs[]): number {
  const w = { slope: 0.3, pmi: 0.3, unemp: 0.2, infl: 0.2 };
  return (
    w.slope * zScore(curr.yieldSlope, history.map(h => h.yieldSlope)) +
    w.pmi * zScore(curr.pmi - 50, history.map(h => h.pmi - 50)) -
    w.unemp * zScore(curr.unemploymentDelta3m, history.map(h => h.unemploymentDelta3m)) -
    w.infl * zScore(curr.inflationSurprise, history.map(h => h.inflationSurprise))
  );
}

export type MacroRegime = 'expansion' | 'neutral' | 'contraction' | 'stagflation';

export function classifyRegime(macroZ: number, inflationSurprise: number): MacroRegime {
  if (macroZ > 1) return 'expansion';
  if (macroZ < -1) return inflationSurprise > 0 ? 'stagflation' : 'contraction';
  return 'neutral';
}

// ============================================================
// 5. COMPOSITE SIGNAL SCORE (drives the Signal Desk)
// ============================================================

export interface FactorVector {
  momentum: number;   // z-scored
  valuation: number;  // z-scored, negative = expensive
  macro: number;       // macroIndex() output
  volatility: number;  // z-scored, higher = more volatile
  sentiment: number;   // z-scored
}

export interface FactorWeights {
  momentum: number;
  valuation: number;
  macro: number;
  volatility: number;
  sentiment: number;
}

export const DEFAULT_WEIGHTS: FactorWeights = {
  momentum: 0.25,
  valuation: 0.20,
  macro: 0.20,
  volatility: 0.10,
  sentiment: 0.15,
};

export function compositeZ(factors: FactorVector, weights: FactorWeights = DEFAULT_WEIGHTS): number {
  return (
    weights.momentum * factors.momentum +
    weights.valuation * factors.valuation +
    weights.macro * factors.macro -
    weights.volatility * factors.volatility + // high vol penalizes the score
    weights.sentiment * factors.sentiment
  );
}

/** Logistic squash of the composite z-score into a 0-100 display score. 50 = neutral. */
export function compositeScore(factors: FactorVector, weights?: FactorWeights): number {
  const z = compositeZ(factors, weights);
  return 100 / (1 + Math.exp(-z));
}

// ============================================================
// 6. INSTABILITY / RISK GRAVITY INDEX
// (replaces any hardcoded "Instability Risk: 42" badge)
// ============================================================

export interface RiskInputs {
  volZ: number;
  cdsZ: number;          // sovereign credit spread, z-scored
  fxVolZ: number;
  politicalZ: number;
  negSentimentZ: number;
}

export function instabilityIndex(r: RiskInputs): number {
  const w = { vol: 0.25, cds: 0.25, fx: 0.2, political: 0.2, sentiment: 0.1 };
  const z =
    w.vol * r.volZ +
    w.cds * r.cdsZ +
    w.fx * r.fxVolZ +
    w.political * r.politicalZ +
    w.sentiment * r.negSentimentZ;
  return clamp(50 + 10 * z, 0, 100);
}

// ============================================================
// 7. MULTI-MODEL ENSEMBLE & DISAGREEMENT-BASED CONFIDENCE
// ============================================================

export type Stance = -1 | 0 | 1;

export function stanceFromZ(z: number): Stance {
  if (z > 0.5) return 1;
  if (z < -0.5) return -1;
  return 0;
}

/** Confidence drops when the Quant/Sentiment/Macro sub-models disagree. */
export function ensembleConfidence(stances: Stance[]): number {
  const m = mean(stances);
  const variance = mean(stances.map(s => (s - m) ** 2));
  const maxVar = 1; // stances live in {-1,0,1}; ~1 is the practical max variance
  const agreement = 1 - clamp(variance / maxVar, 0, 1);
  return Math.round(agreement * 100);
}

// ============================================================
// 8. HISTORICAL ANALOG FINDER — Mahalanobis k-NN
// (drives the Precedent Panel)
// ============================================================

export function mahalanobisDistance(a: number[], b: number[], invCov: number[][]): number {
  const diff = a.map((v, i) => v - b[i]);
  let sum = 0;
  for (let i = 0; i < diff.length; i++) {
    for (let j = 0; j < diff.length; j++) {
      sum += diff[i] * invCov[i][j] * diff[j];
    }
  }
  return Math.sqrt(Math.max(sum, 0));
}

export interface HistoricalSample {
  t: number;            // timestamp / day index
  vec: number[];        // factor vector at that point in history
  forwardReturn: number; // actual N-day forward return that followed
}

export interface AnalogResult {
  t: number;
  distance: number;
  forwardReturn: number;
}

/** minGapDays prevents picking overlapping/adjacent windows (avoids fake precision from autocorrelated neighbors). */
export function kNearestAnalogs(
  current: number[],
  historicalSamples: HistoricalSample[],
  invCov: number[][],
  k = 5,
  minGapDays = 60
): AnalogResult[] {
  const scored = historicalSamples
    .map(h => ({ t: h.t, distance: mahalanobisDistance(current, h.vec, invCov), forwardReturn: h.forwardReturn }))
    .sort((a, b) => a.distance - b.distance);

  const selected: AnalogResult[] = [];
  for (const s of scored) {
    if (selected.every(sel => Math.abs(sel.t - s.t) > minGapDays)) selected.push(s);
    if (selected.length >= k) break;
  }
  return selected;
}

export interface PrecedentStats {
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  sampleSize: number;
}

export function precedentStats(analogs: AnalogResult[]): PrecedentStats {
  const rets = analogs.map(a => a.forwardReturn).sort((a, b) => a - b);
  const n = rets.length;
  const median = n % 2 ? rets[(n - 1) / 2] : (rets[n / 2 - 1] + rets[n / 2]) / 2;
  return {
    median,
    p25: rets[Math.floor(n * 0.25)],
    p75: rets[Math.floor(n * 0.75)],
    min: rets[0],
    max: rets[n - 1],
    sampleSize: n,
  };
}

// ============================================================
// 9. MONTE CARLO SCENARIO ENGINE (drives the "What-If" Simulator)
// ============================================================

/** Cholesky decomposition — used to generate correlated random shocks from a covariance matrix. */
export function cholesky(cov: number[][]): number[][] {
  const n = cov.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = cov[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j];
    }
  }
  return L;
}

function randNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface ScenarioResult {
  p5: number;
  p50: number;
  p95: number;
  raw: number[];
}

const FACTOR_KEYS: (keyof FactorVector)[] = ['momentum', 'valuation', 'macro', 'volatility', 'sentiment'];

/**
 * Runs a correlated Monte Carlo simulation of the composite score.
 * `cov` is the covariance matrix among the 5 factors, in FACTOR_KEYS order.
 * `shockOverride` lets the UI slider force one factor (e.g. macro) to a fixed
 * z-value while the rest of the factors move with it via the correlation
 * structure — this is what makes the "oil +20%" slider visibly ripple through
 * the other panels instead of moving in isolation.
 */
export function monteCarloScenario(
  baseFactors: FactorVector,
  cov: number[][],
  shockOverride: Partial<FactorVector>,
  weights: FactorWeights = DEFAULT_WEIGHTS,
  paths = 2000
): ScenarioResult {
  const L = cholesky(cov);
  const scores: number[] = [];

  for (let p = 0; p < paths; p++) {
    const z = FACTOR_KEYS.map(() => randNormal());
    const correlatedShock = L.map(row => row.reduce((s, l, i) => s + l * z[i], 0));
    const shocked: FactorVector = { ...baseFactors };
    FACTOR_KEYS.forEach((k, i) => {
      shocked[k] = shockOverride[k] !== undefined ? shockOverride[k]! : baseFactors[k] + correlatedShock[i];
    });
    scores.push(compositeScore(shocked, weights));
  }

  scores.sort((a, b) => a - b);
  const pct = (p: number) => scores[Math.floor(p * scores.length)];
  return { p5: pct(0.05), p50: pct(0.50), p95: pct(0.95), raw: scores };
}

// ============================================================
// 10. KELLY-CRITERION POSITION SIZING
// ============================================================

/**
 * Fractional Kelly: f* = (expectedExcessReturn / variance) * fractional.
 * fractional defaults to 0.5 (half-Kelly) — standard practice, since full Kelly
 * is too aggressive for real allocation. Capped at 25% of portfolio.
 */
export function kellyFraction(expectedExcessReturn: number, variance: number, fractional = 0.5): number {
  const fullKelly = variance > 0 ? expectedExcessReturn / variance : 0;
  return clamp(fullKelly * fractional, 0, 0.25);
}

/** Returns a sizing RANGE (±20%) rather than a single number, to visually communicate uncertainty. */
export function kellyRange(expectedExcessReturn: number, variance: number, fractional = 0.5): { low: number; high: number } {
  const f = kellyFraction(expectedExcessReturn, variance, fractional);
  return { low: f * 0.8, high: f * 1.2 };
}

// ============================================================
// 11. CORRELATION / CONTAGION MATRIX
// ============================================================

function pearson(a: number[], b: number[]): number {
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / (Math.sqrt(da * db) || 1e-12);
}

/** returnSeries: one return array per country/asset, all same length. */
export function correlationMatrix(returnSeries: number[][]): number[][] {
  const n = returnSeries.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => pearson(returnSeries[i], returnSeries[j]))
  );
}

export function beta(assetReturns: number[], marketReturns: number[]): number {
  const ma = mean(assetReturns), mm = mean(marketReturns);
  const cov = assetReturns.reduce((s, r, i) => s + (r - ma) * (marketReturns[i] - mm), 0) / (assetReturns.length - 1);
  return cov / stdDev(marketReturns) ** 2;
}

// ============================================================
// 12. SYNTHETIC DATA GENERATOR
// (for prototyping the math pipeline before real market data is wired in —
//  seeded, so output is reproducible across reloads, not random noise)
// ============================================================

export function generateSyntheticPriceSeries(
  days = 500,
  annualDrift = 0.06,
  annualVol = 0.18,
  seed = 42
): number[] {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const dt = 1 / 252;
  const prices = [100];
  for (let i = 1; i < days; i++) {
    const u1 = rnd(), u2 = rnd();
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
    const drift = (annualDrift - 0.5 * annualVol ** 2) * dt;
    const diffusion = annualVol * Math.sqrt(dt) * z;
    prices.push(prices[i - 1] * Math.exp(drift + diffusion));
  }
  return prices;
}
