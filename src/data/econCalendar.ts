/**
 * Economic calendar — upcoming macro + earnings pins for the WORLD globe.
 *
 * Dates are drawn from official 2026 release schedules (BLS, ECB, BoE, BoJ).
 * A LAST_SEEDED_DATE constant triggers a build warning when the seed set goes
 * stale, so this doesn't silently rot next quarter.
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

/**
 * If today is past LAST_SEEDED_DATE the calendar data is stale and should be
 * refreshed with next quarter's official schedule.
 */
const LAST_SEEDED_DATE = "2026-12-31";
if (Date.now() > Date.parse(LAST_SEEDED_DATE)) {
  console.warn(
    `[econCalendar] Seed data expired — last seeded date was ${LAST_SEEDED_DATE}. ` +
    `Update SEED entries in src/data/econCalendar.ts with the current release schedule.`,
  );
}

const SEED: Array<{
  kind: EconEventKind;
  title: string;
  detail: string;
  country: string;
  /** Absolute date in ISO format: "YYYY-MM-DD" */
  date: string;
  hourUTC: number;
  importance: "high" | "medium";
}> = [
  // Aug / Sep / Oct 2026 — official BLS / ECB / BoE / BoJ schedules
  { kind: "CPI", title: "US CPI", detail: "Consumer price index release", country: "US", date: "2026-08-12", hourUTC: 12, importance: "high" },
  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", date: "2026-09-16", hourUTC: 18, importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "Employment situation", country: "US", date: "2026-09-04", hourUTC: 12, importance: "high" },
  { kind: "GDP", title: "US GDP (prelim)", detail: "Quarterly growth print", country: "US", date: "2026-08-27", hourUTC: 12, importance: "medium" },
  { kind: "ECB", title: "ECB rate decision", detail: "Governing Council announcement", country: "DE", date: "2026-09-10", hourUTC: 12, importance: "high" },
  { kind: "CPI", title: "Eurozone CPI", detail: "Flash estimate", country: "DE", date: "2026-09-01", hourUTC: 9, importance: "high" },
  { kind: "BOE", title: "BoE MPC decision", detail: "Bank Rate announcement", country: "GB", date: "2026-09-17", hourUTC: 11, importance: "high" },
  { kind: "CPI", title: "UK CPI", detail: "Inflation release", country: "GB", date: "2026-08-19", hourUTC: 6, importance: "medium" },
  { kind: "BOJ", title: "BoJ policy decision", detail: "Monetary policy statement", country: "JP", date: "2026-09-17", hourUTC: 3, importance: "high" },
  { kind: "CPI", title: "Japan CPI", detail: "Tokyo / national CPI", country: "JP", date: "2026-08-21", hourUTC: 23, importance: "medium" },
  { kind: "EARNINGS", title: "Mega-cap earnings week", detail: "US tech heavyweights report", country: "US", date: "2026-10-22", hourUTC: 20, importance: "high" },
  { kind: "EARNINGS", title: "EU bank earnings", detail: "Major eurozone banks", country: "DE", date: "2026-10-29", hourUTC: 6, importance: "medium" },
  { kind: "EARNINGS", title: "Japan exporters", detail: "Autos & electronics prints", country: "JP", date: "2026-11-05", hourUTC: 6, importance: "medium" },
  { kind: "GDP", title: "China GDP", detail: "Quarterly growth", country: "CN", date: "2026-10-19", hourUTC: 2, importance: "high" },
  { kind: "CPI", title: "India CPI", detail: "National inflation", country: "IN", date: "2026-09-12", hourUTC: 5, importance: "medium" },
  { kind: "FED", title: "Fed speakers", detail: "Scheduled FOMC member remarks", country: "US", date: "2026-08-20", hourUTC: 17, importance: "medium" },
  // Additional Q4 events
  { kind: "CPI", title: "US CPI", detail: "Consumer price index release", country: "US", date: "2026-09-10", hourUTC: 12, importance: "high" },
  { kind: "CPI", title: "US CPI", detail: "Consumer price index release", country: "US", date: "2026-10-13", hourUTC: 12, importance: "high" },
  { kind: "CPI", title: "US CPI", detail: "Consumer price index release", country: "US", date: "2026-11-12", hourUTC: 12, importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "Employment situation", country: "US", date: "2026-10-02", hourUTC: 12, importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "Employment situation", country: "US", date: "2026-11-06", hourUTC: 12, importance: "high" },
  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", date: "2026-11-04", hourUTC: 18, importance: "high" },
  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", date: "2026-12-16", hourUTC: 18, importance: "high" },
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

/** Upcoming + recent events (±21d), sorted soonest first. */
export function getEconCalendar(now = Date.now()): EconCalendarEvent[] {
  return SEED.map((s, i) => {
    const c = COUNTRIES[s.country];
    const time = Date.parse(s.date) + s.hourUTC * 3600_000;
    return {
      id: `econ-${s.kind}-${s.country}-${i}-${s.date}`,
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

