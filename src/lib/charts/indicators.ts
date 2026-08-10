/**
 * Chart indicator series builders — pure functions over OHLCV bars.
 */
import type { OhlcvBar } from "../../types/market";

export type LinePoint = { t: number; v: number };

function smaAt(values: number[], period: number, i: number): number | null {
  if (i + 1 < period) return null;
  let sum = 0;
  for (let j = i - period + 1; j <= i; j++) sum += values[j];
  return sum / period;
}

function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let e = 0;
  for (let i = 0; i < period; i++) e += values[i];
  e /= period;
  out[period - 1] = e;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

function toPoints(bars: OhlcvBar[], series: (number | null)[]): LinePoint[] {
  const pts: LinePoint[] = [];
  for (let i = 0; i < bars.length; i++) {
    const v = series[i];
    if (v != null && Number.isFinite(v)) pts.push({ t: bars[i].t, v });
  }
  return pts;
}

export function computeSma(bars: OhlcvBar[], period: number): LinePoint[] {
  const closes = bars.map((b) => b.c);
  const series = closes.map((_, i) => smaAt(closes, period, i));
  return toPoints(bars, series);
}

export function computeEma(bars: OhlcvBar[], period: number): LinePoint[] {
  return toPoints(bars, emaSeries(bars.map((b) => b.c), period));
}

export function computeRsi(bars: OhlcvBar[], period = 14): LinePoint[] {
  const closes = bars.map((b) => b.c);
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return [];

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return toPoints(bars, out);
}

export interface MacdSeries {
  macd: LinePoint[];
  signal: LinePoint[];
  hist: LinePoint[];
}

export function computeMacd(bars: OhlcvBar[], fast = 12, slow = 26, signalPeriod = 9): MacdSeries {
  const closes = bars.map((b) => b.c);
  const emaFast = emaSeries(closes, fast);
  const emaSlow = emaSeries(closes, slow);
  const macdRaw: (number | null)[] = closes.map((_, i) => {
    if (emaFast[i] == null || emaSlow[i] == null) return null;
    return emaFast[i]! - emaSlow[i]!;
  });

  // EMA of MACD line — only over defined values, indexed to bars
  const macdVals: number[] = [];
  const macdIdx: number[] = [];
  for (let i = 0; i < macdRaw.length; i++) {
    if (macdRaw[i] != null) {
      macdVals.push(macdRaw[i]!);
      macdIdx.push(i);
    }
  }
  const sigEma = emaSeries(macdVals, signalPeriod);
  const signalRaw: (number | null)[] = new Array(closes.length).fill(null);
  const histRaw: (number | null)[] = new Array(closes.length).fill(null);
  for (let j = 0; j < macdIdx.length; j++) {
    const i = macdIdx[j];
    if (sigEma[j] != null) {
      signalRaw[i] = sigEma[j];
      histRaw[i] = macdRaw[i]! - sigEma[j]!;
    }
  }

  return {
    macd: toPoints(bars, macdRaw),
    signal: toPoints(bars, signalRaw),
    hist: toPoints(bars, histRaw),
  };
}

export interface BollingerSeries {
  mid: LinePoint[];
  upper: LinePoint[];
  lower: LinePoint[];
}

export function computeBollinger(bars: OhlcvBar[], period = 20, mult = 2): BollingerSeries {
  const closes = bars.map((b) => b.c);
  const mid: (number | null)[] = [];
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    const m = smaAt(closes, period, i);
    if (m == null) {
      mid.push(null); upper.push(null); lower.push(null);
      continue;
    }
    let var_ = 0;
    for (let j = i - period + 1; j <= i; j++) var_ += (closes[j] - m) ** 2;
    const sd = Math.sqrt(var_ / period);
    mid.push(m);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return {
    mid: toPoints(bars, mid),
    upper: toPoints(bars, upper),
    lower: toPoints(bars, lower),
  };
}

/** Aggregate 60m bars into 4H candles. */
export function aggregateBars(bars: OhlcvBar[], bucketMs: number): OhlcvBar[] {
  if (!bars.length) return [];
  const out: OhlcvBar[] = [];
  let cur: OhlcvBar | null = null;
  let bucket = -1;
  for (const b of bars) {
    const k = Math.floor(b.t / bucketMs);
    if (k !== bucket || !cur) {
      if (cur) out.push(cur);
      bucket = k;
      cur = { ...b };
    } else {
      cur.h = Math.max(cur.h, b.h);
      cur.l = Math.min(cur.l, b.l);
      cur.c = b.c;
      cur.v += b.v;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function formatVolume(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}
