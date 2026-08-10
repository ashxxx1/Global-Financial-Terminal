/**
 * Deterministic DEMO track record (past ~90 days).
 * Clearly labeled DEMO — never presented as live historical performance.
 *
 * Uses the real model + market provider at historical timestamps so metrics
 * are calculated from stored results, not hardcoded.
 */
import { SIGNAL_ASSETS } from "./assets";
import { generateSignals, isDemoMode } from "./generate";
import { resolveSignalAgainstBars, applyResolution } from "./resolve";
import { getMarketDataProvider } from "./marketDataProvider";
import { signalStore } from "./store";
import type { AuditEvent, Signal } from "./types";

const DEMO_FLAG = "gft.signals.demoSeeded.v1";
const DEMO_DAYS = 75;

function dayUtc(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 9, 15, 0);
}

/**
 * Seed demo history once per browser. Idempotent.
 */
export function ensureDemoDataset(now = Date.now()): Signal[] {
  signalStore.hydrate();
  if (!isDemoMode()) return signalStore.list();

  if (typeof localStorage !== "undefined" && localStorage.getItem(DEMO_FLAG) === "1" && signalStore.size > 0) {
    return signalStore.list();
  }

  const provider = getMarketDataProvider();
  const all: Signal[] = [];
  const audits: AuditEvent[] = [];

  // Generate ~1 session per weekday for 75 days
  for (let d = DEMO_DAYS; d >= 0; d--) {
    const asOf = dayUtc(now - d * 86400000);
    const dow = new Date(asOf).getUTCDay();
    if (dow === 0 || dow === 6) continue;

    // Rotate asset subsets to keep daily count in 5–12 range
    const offset = d % 3;
    const subset = SIGNAL_ASSETS.filter((_, i) => (i + offset) % 3 !== 2);

    const { signals, audits: a, } = generateSignals({
      asOf,
      assets: subset,
      limit: 10,
      demo: true,
      allowClosedMarket: true,
      timeframe: "1D",
    });
    audits.push(...a);

    // Resolve with subsequent daily bars (no look-ahead at generation time)
    for (const raw of signals) {
      let s = raw;
      if (d > 0) {
        const bars = provider.getHistoricalData(
          SIGNAL_ASSETS.find((x) => x.assetId === s.assetId)!.quoteSymbol,
          "3M",
          now,
        ).filter((b) => b.t > s.createdAt && b.t <= asOf + 2 * 86400000);
        const update = resolveSignalAgainstBars(s, bars, asOf + 2 * 86400000);
        if (update) s = applyResolution(s, update);
      }
      all.push(s);
    }
  }

  // Also ensure today's open signals exist
  const today = generateSignals({
    asOf: now,
    limit: 12,
    demo: true,
    allowClosedMarket: true,
  });
  for (const s of today.signals) {
    if (!all.find((x) => x.id === s.id)) all.push(s);
  }
  audits.push(...today.audits);

  signalStore.replaceAll(all, audits);
  if (typeof localStorage !== "undefined") localStorage.setItem(DEMO_FLAG, "1");
  return signalStore.list();
}

export function isDemoTrackRecord(signals: Signal[]): boolean {
  return signals.length > 0 && signals.every((s) => s.demo);
}
