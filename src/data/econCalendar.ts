/**
 * Economic calendar — upcoming macro + earnings pins for the WORLD globe.
 * Dates are rolled forward from a seed schedule so the overlay always has
 * near-term events without a paid calendar feed.
 */
import { COUNTRIES } from "../lib/market";

export type EconEventKind = "CPI" | "FED" | "EARNINGS" | "GDP" | "JOBS" | "ECB" | "BOE" | "BOJ";

export interface EconCalendarEvent {
  id: string;
  kind: EconEventKind;
  title: string;
  detail: string;
  /** Unix ms */
  time: number;
  country: string;
  lat: number;
  lng: number;
  importance: "high" | "medium";
}

const SEED: Array<{
  kind: EconEventKind;
  title: string;
  detail: string;
  country: string;
  /** Day offset from today (can be negative for recent) */
  dayOffset: number;
  hourUTC: number;
  importance: "high" | "medium";
}> = [
  { kind: "CPI", title: "US CPI", detail: "Consumer price index release", country: "US", dayOffset: 2, hourUTC: 12, importance: "high" },
  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", dayOffset: 9, hourUTC: 18, importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "Employment situation", country: "US", dayOffset: 5, hourUTC: 12, importance: "high" },
  { kind: "GDP", title: "US GDP (prelim)", detail: "Quarterly growth print", country: "US", dayOffset: 16, hourUTC: 12, importance: "medium" },
  { kind: "ECB", title: "ECB rate decision", detail: "Governing Council announcement", country: "DE", dayOffset: 7, hourUTC: 12, importance: "high" },
  { kind: "CPI", title: "Eurozone CPI", detail: "Flash estimate", country: "DE", dayOffset: 3, hourUTC: 9, importance: "high" },
  { kind: "BOE", title: "BoE MPC decision", detail: "Bank Rate announcement", country: "GB", dayOffset: 11, hourUTC: 11, importance: "high" },
  { kind: "CPI", title: "UK CPI", detail: "Inflation release", country: "GB", dayOffset: 4, hourUTC: 6, importance: "medium" },
  { kind: "BOJ", title: "BoJ policy decision", detail: "Monetary policy statement", country: "JP", dayOffset: 14, hourUTC: 3, importance: "high" },
  { kind: "CPI", title: "Japan CPI", detail: "Tokyo / national CPI", country: "JP", dayOffset: 1, hourUTC: 23, importance: "medium" },
  { kind: "EARNINGS", title: "Mega-cap earnings week", detail: "US tech heavyweights report", country: "US", dayOffset: 6, hourUTC: 20, importance: "high" },
  { kind: "EARNINGS", title: "EU bank earnings", detail: "Major eurozone banks", country: "DE", dayOffset: 8, hourUTC: 6, importance: "medium" },
  { kind: "EARNINGS", title: "Japan exporters", detail: "Autos & electronics prints", country: "JP", dayOffset: 12, hourUTC: 6, importance: "medium" },
  { kind: "GDP", title: "China GDP", detail: "Quarterly growth", country: "CN", dayOffset: 10, hourUTC: 2, importance: "high" },
  { kind: "CPI", title: "India CPI", detail: "National inflation", country: "IN", dayOffset: 13, hourUTC: 5, importance: "medium" },
  { kind: "FED", title: "Fed speakers", detail: "Scheduled FOMC member remarks", country: "US", dayOffset: 0, hourUTC: 17, importance: "medium" },
];

const KIND_COLOR: Record<EconEventKind, string> = {
  CPI: "#FFFFFF",
  FED: "rgba(255,255,255,0.58)",
  ECB: "rgba(255,255,255,0.58)",
  BOE: "rgba(255,255,255,0.58)",
  BOJ: "rgba(255,255,255,0.58)",
  EARNINGS: "rgba(255,255,255,0.48)",
  GDP: "rgba(255,255,255,0.66)",
  JOBS: "rgba(255,255,255,0.30)",
};

export function colorForEconKind(kind: EconEventKind): string {
  return KIND_COLOR[kind];
}

/** Upcoming + recent events (±14d), sorted soonest first. */
export function getEconCalendar(now = Date.now()): EconCalendarEvent[] {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const base = startOfDay.getTime();

  return SEED.map((s, i) => {
    const c = COUNTRIES[s.country];
    const time = base + s.dayOffset * 86400_000 + s.hourUTC * 3600_000;
    return {
      id: `econ-${s.kind}-${s.country}-${i}-${s.dayOffset}`,
      kind: s.kind,
      title: s.title,
      detail: s.detail,
      time,
      country: s.country,
      lat: c?.lat ?? 0,
      lng: c?.lng ?? 0,
      importance: s.importance,
    } satisfies EconCalendarEvent;
  })
    .filter((e) => e.lat !== 0 || e.lng !== 0)
    .filter((e) => e.time >= now - 2 * 86400_000 && e.time <= now + 21 * 86400_000)
    .sort((a, b) => a.time - b.time);
}
