import type { Source } from "./market";

/**
 * Human "as of" labelling for a quote — growth-plan item 7.
 *
 * A real price that isn't moving (weekend, after-hours) reads as fake unless
 * the UI says *when* it's from. This turns a source + the clock into a short,
 * honest freshness label so nobody mistakes a genuine Friday close for a
 * simulation.
 */

export type FreshTone = "live" | "stale" | "sim";
export interface Freshness {
  label: string;
  tone: FreshTone;
  detail: string;
}

/** US equity session from NYSE local wall-clock (handles DST via Intl). */
function usSession(now: Date): "open" | "pre" | "post" | "weekend" {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday");
  if (day === "Sat" || day === "Sun") return "weekend";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const mins = hour * 60 + parseInt(get("minute"), 10);
  if (mins < 9 * 60 + 30) return "pre";
  if (mins >= 16 * 60) return "post";
  return "open";
}

export function freshness(source: Source, country: string | null, now: Date = new Date()): Freshness {
  if (source !== "live") {
    return { label: "Simulated", tone: "sim", detail: "Illustrative value, not real market data. See /data-sources." };
  }
  // Live, non-equity (crypto 24/7, FX daily) — treat as current.
  if (country !== "US") {
    return { label: "Live", tone: "live", detail: "Live feed." };
  }
  switch (usSession(now)) {
    case "open":
      return { label: "Live", tone: "live", detail: "US market open — quotes update through the session." };
    case "weekend":
      return { label: "At Fri close", tone: "stale", detail: "US markets are closed for the weekend; showing the last close." };
    case "pre":
      return { label: "Prev close", tone: "stale", detail: "Before the US open; showing the previous close." };
    case "post":
      return { label: "At close", tone: "stale", detail: "US market closed for the day; showing today's close." };
  }
}
