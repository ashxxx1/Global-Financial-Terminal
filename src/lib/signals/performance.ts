/**
 * Performance statistics — always computed from stored signal results.
 * WIN = TARGET_HIT only. LOSS = STOP_HIT. EXPIRED / AMBIGUOUS are separate.
 * Active/pending never enter win rate.
 */
import type { DailyPerformance, PerformanceStats, Signal } from "./types";

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

export function isResolved(s: Signal): boolean {
  return s.status === "TARGET_HIT" || s.status === "STOP_HIT" || s.status === "EXPIRED" || s.status === "AMBIGUOUS";
}

export function isWin(s: Signal): boolean {
  return s.status === "TARGET_HIT";
}

export function isLoss(s: Signal): boolean {
  return s.status === "STOP_HIT";
}

export function computePerformance(signals: Signal[]): PerformanceStats {
  const resolved = signals.filter(isResolved);
  const wins = resolved.filter(isWin);
  const losses = resolved.filter(isLoss);
  const expired = resolved.filter((s) => s.status === "EXPIRED");
  const ambiguous = resolved.filter((s) => s.status === "AMBIGUOUS");
  const active = signals.filter((s) => s.status === "ACTIVE" || s.status === "PENDING");

  const winReturns = wins.map((s) => s.realizedReturn ?? 0);
  const lossReturns = losses.map((s) => s.realizedReturn ?? 0);
  const decided = [...wins, ...losses];
  const decidedN = decided.length;

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const averageWin = avg(winReturns);
  const averageLoss = avg(lossReturns);

  const grossWin = winReturns.reduce((a, b) => a + b, 0);
  const grossLossAbs = Math.abs(lossReturns.reduce((a, b) => a + b, 0));
  const profitFactor = grossLossAbs > 0 ? grossWin / grossLossAbs : (grossWin > 0 ? Infinity : null);

  const winRate = decidedN ? wins.length / decidedN : null;
  const pWin = winRate ?? 0;
  const pLoss = decidedN ? losses.length / decidedN : 0;
  const expectancy =
    decidedN && averageWin != null && averageLoss != null
      ? pWin * averageWin - pLoss * Math.abs(averageLoss)
      : null;

  // Equal-notional cumulative on chronological resolved (wins+losses+expired+ambiguous with return)
  const chrono = [...resolved]
    .filter((s) => s.realizedReturn != null && s.resolvedAt != null)
    .sort((a, b) => (a.resolvedAt! - b.resolvedAt!));
  let cum = 0;
  let peak = 0;
  let maxDd = 0;
  for (const s of chrono) {
    cum += s.realizedReturn!;
    peak = Math.max(peak, cum);
    maxDd = Math.min(maxDd, cum - peak);
  }

  const holdings = resolved
    .filter((s) => s.resolvedAt != null)
    .map((s) => s.resolvedAt! - s.createdAt);

  // Streak: consecutive TARGET_HIT from most recent decided
  let streak = 0;
  const recentDecided = [...decided].sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
  for (const s of recentDecided) {
    if (s.status === "TARGET_HIT") streak++;
    else break;
  }
  // Negative streak for consecutive stops
  if (streak === 0) {
    for (const s of recentDecided) {
      if (s.status === "STOP_HIT") streak--;
      else break;
    }
  }

  const withReturn = resolved.filter((s) => s.realizedReturn != null);
  const best = withReturn.length
    ? withReturn.reduce((a, b) => ((b.realizedReturn ?? -Infinity) > (a.realizedReturn ?? -Infinity) ? b : a))
    : null;
  const worst = withReturn.length
    ? withReturn.reduce((a, b) => ((b.realizedReturn ?? Infinity) < (a.realizedReturn ?? Infinity) ? b : a))
    : null;

  const group = (keyFn: (s: Signal) => string) => {
    const map: Record<string, { n: number; winRate: number | null; avgReturn: number | null }> = {};
    const buckets = new Map<string, Signal[]>();
    for (const s of resolved) {
      const k = keyFn(s);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(s);
    }
    for (const [k, list] of buckets) {
      const d = list.filter((s) => s.status === "TARGET_HIT" || s.status === "STOP_HIT");
      const w = d.filter((s) => s.status === "TARGET_HIT").length;
      const rets = list.map((s) => s.realizedReturn).filter((x): x is number => x != null);
      map[k] = {
        n: list.length,
        winRate: d.length ? w / d.length : null,
        avgReturn: rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : null,
      };
    }
    return map;
  };

  const allReturns = withReturn.map((s) => s.realizedReturn!);

  return {
    totalSignals: signals.length,
    resolvedSignals: resolved.length,
    targetHits: wins.length,
    stopHits: losses.length,
    expired: expired.length,
    ambiguous: ambiguous.length,
    active: active.filter((s) => s.status === "ACTIVE").length,
    pending: active.filter((s) => s.status === "PENDING").length,
    winRate,
    targetHitRate: resolved.length ? wins.length / resolved.length : null,
    stopHitRate: resolved.length ? losses.length / resolved.length : null,
    expiredRate: resolved.length ? expired.length / resolved.length : null,
    ambiguousRate: resolved.length ? ambiguous.length / resolved.length : null,
    averageWin,
    averageLoss,
    medianReturn: median(allReturns),
    profitFactor: profitFactor === Infinity ? null : profitFactor,
    expectancy,
    cumulativeReturn: cum,
    maxDrawdown: maxDd,
    averageHoldingPeriodMs: holdings.length ? holdings.reduce((a, b) => a + b, 0) / holdings.length : null,
    currentStreak: streak,
    bestSignal: best,
    worstSignal: worst,
    byMarket: group((s) => s.market),
    byAsset: group((s) => s.symbol),
    byTimeframe: group((s) => s.timeframe),
  };
}

export function computeCumulativeSeries(
  signals: Signal[],
): Array<{ date: string; cumulativeReturn: number; dailyReturn: number }> {
  const chrono = [...signals]
    .filter((s) => isResolved(s) && s.realizedReturn != null && s.resolvedAt != null)
    .sort((a, b) => a.resolvedAt! - b.resolvedAt!);

  const byDay = new Map<string, number>();
  for (const s of chrono) {
    const k = dayKey(s.resolvedAt!);
    byDay.set(k, (byDay.get(k) ?? 0) + s.realizedReturn!);
  }
  let cum = 0;
  const out: Array<{ date: string; cumulativeReturn: number; dailyReturn: number }> = [];
  for (const [date, dailyReturn] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    cum += dailyReturn;
    out.push({ date, cumulativeReturn: cum, dailyReturn });
  }
  return out;
}

export function computeDailyPerformance(signals: Signal[]): DailyPerformance[] {
  const byDay = new Map<string, Signal[]>();
  for (const s of signals) {
    const k = dayKey(s.createdAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  const series = computeCumulativeSeries(signals);
  const cumByDate = new Map(series.map((s) => [s.date, s.cumulativeReturn]));
  let running = 0;
  const days = [...byDay.keys()].sort();
  return days.map((date) => {
    const list = byDay.get(date)!;
    const rets = list.map((s) => s.realizedReturn).filter((x): x is number => x != null);
    const avgReturn = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : null;
    if (cumByDate.has(date)) running = cumByDate.get(date)!;
    return {
      date,
      signalsGenerated: list.length,
      targetHits: list.filter((s) => s.status === "TARGET_HIT").length,
      stopHits: list.filter((s) => s.status === "STOP_HIT").length,
      expired: list.filter((s) => s.status === "EXPIRED").length,
      ambiguous: list.filter((s) => s.status === "AMBIGUOUS").length,
      active: list.filter((s) => s.status === "ACTIVE" || s.status === "PENDING").length,
      avgReturn,
      cumulativeReturn: running,
    };
  });
}

/** 30D hypothetical return from resolved signals in the window. */
export function trailingReturn(signals: Signal[], days = 30, now = Date.now()): number {
  const cutoff = now - days * 86400000;
  return signals
    .filter((s) => isResolved(s) && (s.resolvedAt ?? 0) >= cutoff && s.realizedReturn != null)
    .reduce((a, s) => a + (s.realizedReturn ?? 0), 0);
}
