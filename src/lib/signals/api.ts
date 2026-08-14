/**
 * Client API for signals — prefers backend when VITE_API_URL is set,
 * otherwise uses local deterministic demo/live store.
 */
import { BACKEND_URL } from "../feeds/backend";
import { ensureDemoDataset } from "./demo";
import { generateSignals, isDemoMode } from "./generate";
import { computeDailyPerformance, computePerformance, trailingReturn } from "./performance";
import { resolveActiveSignals } from "./resolve";
import { getMarketDataProvider } from "./marketDataProvider";
import { signalStore } from "./store";
import { SIGNAL_ASSETS } from "./assets";
import type { DailyPerformance, PerformanceStats, Signal } from "./types";

let bootstrapped = false;

export function bootstrapSignals(now = Date.now()): Signal[] {
  if (bootstrapped) {
    // Periodically resolve actives
    const list = signalStore.list();
    const resolved = resolveActiveSignals(list, getMarketDataProvider(), now);
    for (const s of resolved) {
      const prev = signalStore.get(s.id);
      if (prev && prev.status !== s.status) {
        signalStore.updateResolution(s.id, {
          status: s.status,
          entryPriceActual: s.entryPriceActual,
          exitPriceActual: s.exitPriceActual,
          realizedReturn: s.realizedReturn,
          resolvedAt: s.resolvedAt,
          resolutionNote: s.resolutionNote,
        });
      }
    }
    return signalStore.list();
  }
  bootstrapped = true;
  signalStore.hydrate();

  if (isDemoMode()) {
    ensureDemoDataset(now);
  } else if (signalStore.size === 0) {
    const { signals, audits } = generateSignals({ asOf: now, allowClosedMarket: true, demo: false });
    signalStore.publish(signals, audits);
  } else {
    // Refresh today's generation if missing
    const day = new Date(now).toISOString().slice(0, 10);
    const hasToday = signalStore.list().some((s) => new Date(s.createdAt).toISOString().slice(0, 10) === day);
    if (!hasToday) {
      const { signals, audits } = generateSignals({ asOf: now, allowClosedMarket: true, demo: false });
      signalStore.publish(signals, audits);
    }
  }

  const resolved = resolveActiveSignals(signalStore.list(), getMarketDataProvider(), now);
  for (const s of resolved) {
    const prev = signalStore.get(s.id);
    if (prev && (prev.status !== s.status || prev.realizedReturn !== s.realizedReturn)) {
      try {
        signalStore.updateResolution(s.id, {
          status: s.status,
          entryPriceActual: s.entryPriceActual,
          exitPriceActual: s.exitPriceActual,
          realizedReturn: s.realizedReturn,
          resolvedAt: s.resolvedAt,
          resolutionNote: s.resolutionNote,
        });
      } catch { /* immutable guard */ }
    }
  }
  return signalStore.list();
}

export async function fetchSignals(): Promise<Signal[]> {
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/signals`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.signals) && data.signals.length) {
          signalStore.publish(data.signals);
          return signalStore.list();
        }
      }
    } catch {
      /* fall through to local */
    }
  }
  return bootstrapSignals();
}

export async function fetchSignal(id: string): Promise<Signal | null> {
  await fetchSignals();
  return signalStore.get(id) ?? null;
}

export function getLocalSignals(): Signal[] {
  signalStore.hydrate();
  if (!bootstrapped) bootstrapSignals();
  return signalStore.list();
}

export function getPerformance(): PerformanceStats {
  return computePerformance(getLocalSignals());
}

export function getDailyPerformance(): DailyPerformance[] {
  return computeDailyPerformance(getLocalSignals());
}

export function getDashboardMetrics(now = Date.now()) {
  const signals = getLocalSignals();
  const day = new Date(now).toISOString().slice(0, 10);
  const todays = signals.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === day);
  const stats = computePerformance(signals);
  return {
    todaysCount: todays.length,
    active: signals.filter((s) => s.status === "ACTIVE").length,
    targetsHitToday: todays.filter((s) => s.status === "TARGET_HIT").length,
    winRate: stats.winRate,
    return30d: trailingReturn(signals, 30, now),
    streak: stats.currentStreak,
    demo: isDemoMode(),
    stats,
  };
}

export function quoteSymbolFor(signal: Signal): string {
  return SIGNAL_ASSETS.find((a) => a.assetId === signal.assetId)?.quoteSymbol ?? `IDX:${signal.symbol}`;
}

export { signalStore, isDemoMode };
