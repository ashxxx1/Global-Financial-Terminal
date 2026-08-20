/**
 * Client API for signals — prefers backend when VITE_API_URL is set,
 * otherwise uses local deterministic demo/live store.
 */
import { BACKEND_URL } from "../feeds/backend";
import { loadPublishedRecord, hasPublishedRecord } from "./publishedRecord";
import { ensureDemoDataset } from "./demo";
import { generateSignals, isDemoMode as isModelDemoMode } from "./generate";
import { computeDailyPerformance, computePerformance, trailingReturn } from "./performance";
import { resolveActiveSignals } from "./resolve";
import { getMarketDataProvider } from "./marketDataProvider";
import { signalStore } from "./store";
import { SIGNAL_ASSETS } from "./assets";
import type { DailyPerformance, PerformanceStats, Signal } from "./types";

let bootstrapped = false;

/** Signals from the published record, if one has been loaded. */
function publishedSignals(): Signal[] {
  const rec = hasPublishedRecord() ? loadedRecord : null;
  return rec?.signals ?? [];
}

let loadedRecord: Awaited<ReturnType<typeof loadPublishedRecord>> = null;

/**
 * Load the shared record before bootstrapping.
 *
 * Callers should await this; bootstrapSignals stays synchronous so existing
 * call sites keep working, and simply falls back to the demo seed if this has
 * not run yet.
 */
export async function initSignals(now = Date.now()): Promise<Signal[]> {
  loadedRecord = await loadPublishedRecord();

  // Publish independently of the `bootstrapped` guard. Another surface — the
  // rail's signals widget — usually calls bootstrapSignals on mount first, and
  // that guard would otherwise skip hydration entirely, leaving the demo seed
  // in place with a published record sitting unused on disk.
  const rec = publishedSignals();
  if (rec.length > 0) {
    signalStore.hydrate();

    // Migration: browsers that visited before the published record existed
    // still hold the seeded demo signals. Left in place they would blend with
    // the real ones and the performance pages would report a hit rate mixing
    // both — worse than the demo was, because it would no longer be labelled.
    // replaceAll is the only clean way to drop them.
    signalStore.replaceAll(rec, []);
    bootstrapped = true;
    return signalStore.list();
  }
  return bootstrapSignals(now);
}

/**
 * Is the track record still a demo?
 *
 * False once a published record exists — that record is shared, real-priced and
 * auditable, so the DEMO label would be actively misleading. The label stays on
 * until then, because a per-browser seed is not a track record.
 */
export function isDemoMode(): boolean {
  return !hasPublishedRecord() && isModelDemoMode();
}

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

  // A published record supersedes everything below. It is shared, resolved
  // against real prices, and its history is auditable in git — where the demo
  // seed was per-browser, so no two visitors ever saw the same "record".
  if (hasPublishedRecord()) {
    const rec = publishedSignals();
    if (rec.length > 0) {
      signalStore.publish(rec, []);
      return signalStore.list();
    }
  }

  if (isModelDemoMode()) {
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

export { signalStore };
