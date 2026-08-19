/**
 * Core Web Vitals field measurement — growth-plan item 27.
 *
 * Lab numbers from a fast laptop on a fast connection tell you very little.
 * These are the real ones, from real sessions, reported to the same endpoint
 * as crash reports so there is no new vendor and no new key.
 *
 * Implemented against the browser's own PerformanceObserver rather than the
 * web-vitals package: the three metrics that matter here are a handful of lines
 * each, and a performance budget should not be paid for with a dependency.
 */

const ENDPOINT = "/api/client-error";

interface Vital { name: "LCP" | "INP" | "CLS"; value: number; rating: "good" | "needs-improvement" | "poor" }

/** Google's own thresholds, so "good" here means what it means everywhere. */
const THRESHOLDS: Record<Vital["name"], [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
};

const rate = (name: Vital["name"], v: number): Vital["rating"] => {
  const [good, poor] = THRESHOLDS[name];
  return v <= good ? "good" : v <= poor ? "needs-improvement" : "poor";
};

const collected: Vital[] = [];
let sent = false;

function record(name: Vital["name"], value: number): void {
  const existing = collected.findIndex((c) => c.name === name);
  const v: Vital = { name, value, rating: rate(name, value) };
  if (existing >= 0) collected[existing] = v; else collected.push(v);
}

/** One report per page view, on the way out — the metrics are not final until then. */
function flush(): void {
  if (sent || collected.length === 0) return;
  sent = true;
  try {
    const payload = JSON.stringify({
      kind: "vitals",
      message: collected.map((c) => `${c.name} ${c.value.toFixed(c.name === "CLS" ? 3 : 0)} ${c.rating}`).join(" | "),
      path: window.location.pathname,
      release: (import.meta as { env?: { VITE_RELEASE?: string } }).env?.VITE_RELEASE || "dev",
    });
    navigator.sendBeacon?.(ENDPOINT, new Blob([payload], { type: "application/json" }));
  } catch {
    /* never let measurement break the page it is measuring */
  }
}

export function measureVitals(): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  try {
    // LCP — the last entry before the user interacts is the real one.
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (last) record("LCP", last.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });

    // CLS — sum of layout shifts not caused by recent input.
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) cls += e.value;
      }
      record("CLS", cls);
    }).observe({ type: "layout-shift", buffered: true });

    // INP — approximated by the worst interaction latency observed. The full
    // definition uses a high percentile across all interactions; the worst case
    // is stricter, which is the right direction to be wrong in for a budget.
    let worst = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { duration: number })[]) {
        if (e.duration > worst) { worst = e.duration; record("INP", worst); }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
  } catch {
    /* an unsupported entry type must not take the others down */
  }

  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  addEventListener("pagehide", flush);
}

/** Current readings, for the diagnostics panel. */
export const currentVitals = (): Vital[] => [...collected];
