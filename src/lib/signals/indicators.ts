/**
 * Technical indicators used by the baseline GFT CORE model.
 * Pure functions — no I/O, no look-ahead (caller supplies candles ≤ asOf).
 */

export type Bar = { t: number; o: number; h: number; l: number; c: number; v?: number };

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function atr(bars: Bar[], period = 14): number | null {
  if (bars.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i];
    const prev = bars[i - 1];
    trs.push(Math.max(b.h - b.l, Math.abs(b.h - prev.c), Math.abs(b.l - prev.c)));
  }
  return sma(trs, period);
}

export function roc(closes: number[], period = 10): number | null {
  if (closes.length <= period) return null;
  const prev = closes[closes.length - 1 - period];
  if (!prev) return null;
  return ((closes[closes.length - 1] - prev) / prev) * 100;
}

export function stdev(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const var_ = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  return Math.sqrt(var_);
}

export function recentHigh(bars: Bar[], period = 20): number {
  const slice = bars.slice(-period);
  return Math.max(...slice.map((b) => b.h));
}

export function recentLow(bars: Bar[], period = 20): number {
  const slice = bars.slice(-period);
  return Math.min(...slice.map((b) => b.l));
}

/** Simple volume ratio vs 20-bar average. Missing volume → 1.0 (neutral). */
export function volumeRatio(bars: Bar[], period = 20): number {
  const slice = bars.slice(-period);
  if (!slice.length || slice.every((b) => b.v == null)) return 1;
  const vols = slice.map((b) => b.v ?? 0);
  const avg = vols.reduce((a, b) => a + b, 0) / vols.length;
  const last = vols[vols.length - 1];
  if (!avg) return 1;
  return last / avg;
}

export function closesOf(bars: Bar[]): number[] {
  return bars.map((b) => b.c);
}
