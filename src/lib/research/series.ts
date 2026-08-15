/**
 * Historical statistics over Finnhub's fundamental time series.
 *
 * This is what lets the engine say "expensive against its own ten-year range,
 * 88th percentile" instead of "expensive". Directional comparisons — is A above
 * B — are cheap to compute and nearly meaningless: they rationalise a 24%
 * premium on a 1pp growth edge, which is exactly the bug the last iteration
 * shipped. Everything here is about magnitude and position in a distribution.
 *
 * Every function returns null rather than a fabricated value when there is not
 * enough history, and every result carries the sample size so the caller can
 * state it. A percentile over four observations is not a percentile.
 */

export interface Point { period: string; v: number | null }

/**
 * Series keys the provider reports as fractions while the point-in-time metric
 * for the same concept is a percentage: series netMargin is 0.2723 where
 * metric netProfitMarginTTM is 27.62. Mixing the two scales silently
 * understates every margin and return move by 100× — an 11.7pp margin swing
 * printed as "+0.12pp", which reads as a business that barely moved.
 *
 * Verified against AAPL/MSFT/NVDA/TSLA on 2026-08-15. Ratios (currentRatio,
 * totalDebtToEquity) and multiples (peTTM, pb) are already on the same scale in
 * both places and must NOT be touched.
 */
const FRACTIONAL_SERIES = new Set([
  "grossMargin", "operatingMargin", "netMargin", "pretaxMargin", "fcfMargin",
  "roe", "roeTTM", "roa", "roaTTM", "roic", "roicTTM", "rotc", "rotcTTM",
  "payoutRatio", "payoutRatioTTM", "sgaToSale",
]);

/** Multiplier that puts a series on the same scale as its point-in-time twin. */
export const scaleFor = (key: string): number => (FRACTIONAL_SERIES.has(key) ? 100 : 1);

/** Scale a series to percentage points where the provider used fractions. */
export function normalize(key: string, points: Point[] | undefined): Point[] | undefined {
  const k = scaleFor(key);
  if (k === 1 || !points) return points;
  return points.map((p) => ({ period: p.period, v: typeof p.v === "number" ? p.v * k : p.v }));
}
export interface CleanPoint { period: string; v: number; at: number }

/** Drop nulls and undefineds — Finnhub has genuine holes (AAPL FY2001). */
export function clean(points: Point[] | undefined): CleanPoint[] {
  if (!points) return [];
  return points
    .filter((p): p is { period: string; v: number } => typeof p.v === "number" && Number.isFinite(p.v))
    .map((p) => ({ period: p.period, v: p.v, at: Date.parse(p.period) || 0 }))
    .sort((a, b) => b.at - a.at);
}

export interface Distribution {
  current: number;
  /** 0–100. Share of history at or below the current value. */
  percentile: number;
  median: number;
  min: number;
  max: number;
  n: number;
  /** Oldest and newest period covered, for the evidence trail. */
  from: string;
  to: string;
}

/**
 * Where the newest observation sits within its own history.
 *
 * `lookback` caps how far back to go: a P/E from 2003 says little about whether
 * today's is stretched, and including it quietly flatters every current
 * reading. Defaults to 10 years of annual or 40 quarters.
 */
export function distribution(points: Point[] | undefined, lookback = 40): Distribution | null {
  const all = clean(points);
  if (all.length < 8) return null;               // too few to call a percentile
  const window = all.slice(0, lookback);
  const current = window[0].v;
  const history = window.slice(1);               // compare against the past, not itself
  if (history.length < 6) return null;

  const sorted = [...history].map((p) => p.v).sort((a, b) => a - b);
  const below = sorted.filter((v) => v <= current).length;
  const mid = Math.floor(sorted.length / 2);

  return {
    current,
    percentile: (below / sorted.length) * 100,
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    n: history.length,
    from: window[window.length - 1].period,
    to: window[0].period,
  };
}

export interface Trend {
  /** Change from the oldest to newest point in the window, in the metric's units. */
  change: number;
  /** Same, relative to the starting value. Null when the start is ~0. */
  changePct: number | null;
  /** How many of the step-to-step moves went the same way as the total. 0–1. */
  consistency: number;
  first: CleanPoint;
  last: CleanPoint;
  n: number;
}

/**
 * Direction and, importantly, how steady it was.
 *
 * A metric that fell for eight straight quarters is a different statement from
 * one that fell overall while bouncing around, and collapsing both to "down"
 * loses the part that matters. `consistency` is what separates them.
 */
export function trend(points: Point[] | undefined, periods = 8): Trend | null {
  const all = clean(points).slice(0, periods);
  if (all.length < 3) return null;
  const chron = [...all].reverse();               // oldest → newest
  const first = chron[0], last = chron[chron.length - 1];
  const change = last.v - first.v;

  let sameWay = 0;
  for (let i = 1; i < chron.length; i++) {
    const step = chron[i].v - chron[i - 1].v;
    if (Math.sign(step) === Math.sign(change) && step !== 0) sameWay++;
  }

  return {
    change,
    changePct: Math.abs(first.v) > 1e-9 ? (change / Math.abs(first.v)) * 100 : null,
    consistency: sameWay / Math.max(1, chron.length - 1),
    first, last,
    n: chron.length,
  };
}

/** Plain-English position in a distribution. Thresholds are conventions and
 *  the callers say so; they exist so the same number always reads the same. */
export function percentileWord(p: number): string {
  if (p >= 90) return "near the top of";
  if (p >= 75) return "in the upper quarter of";
  if (p >= 55) return "modestly above the middle of";
  if (p > 45) return "around the middle of";
  if (p > 25) return "modestly below the middle of";
  if (p > 10) return "in the lower quarter of";
  return "near the bottom of";
}

/** How steady a trend was, in words. Same reasoning as percentileWord. */
export function consistencyWord(c: number): string {
  if (c >= 0.85) return "in almost every period";
  if (c >= 0.6) return "in most periods";
  if (c >= 0.4) return "unevenly";
  return "erratically, with the direction reversing often";
}

/** Compact evidence string for a series: the actual numbers used. */
export function seriesDetail(points: Point[] | undefined, n = 6, unit = ""): string {
  return clean(points).slice(0, n)
    .map((p) => `${p.period.slice(0, 7)}: ${p.v.toFixed(2)}${unit}`)
    .join(" · ");
}
