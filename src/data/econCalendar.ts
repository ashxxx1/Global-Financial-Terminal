/**
 * Economic calendar — upcoming macro + earnings pins for the WORLD globe.
 *
 * CPI and jobs dates are the official BLS / ONS / Eurostat 2026 release
 * calendars. Other central-bank and earnings pins are published schedules
 * where we have them. A LAST_SEEDED_DATE constant warns when the seed set
 * goes stale, so this doesn't silently rot next quarter.
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
  /** IANA zone used to display the stamp (release local time, not the viewer's). */
  timeZone: string;
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
  /** Absolute date in ISO format: "YYYY-MM-DD" (calendar date in `timeZone`) */
  date: string;
  hour: number;
  minute: number;
  timeZone: string;
  importance: "high" | "medium";
}> = [
  // Official BLS CPI — 8:30 a.m. Eastern
  { kind: "CPI", title: "US CPI", detail: "July consumer price index (BLS)", country: "US", date: "2026-08-12", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "CPI", title: "US CPI", detail: "August consumer price index (BLS)", country: "US", date: "2026-09-11", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "CPI", title: "US CPI", detail: "September consumer price index (BLS)", country: "US", date: "2026-10-14", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "CPI", title: "US CPI", detail: "October consumer price index (BLS)", country: "US", date: "2026-11-10", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "CPI", title: "US CPI", detail: "November consumer price index (BLS)", country: "US", date: "2026-12-10", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },

  // Official BLS Employment Situation — 8:30 a.m. Eastern
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "August employment situation (BLS)", country: "US", date: "2026-09-04", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "September employment situation (BLS)", country: "US", date: "2026-10-02", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "October employment situation (BLS)", country: "US", date: "2026-11-06", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },
  { kind: "JOBS", title: "US Nonfarm payrolls", detail: "November employment situation (BLS)", country: "US", date: "2026-12-04", hour: 8, minute: 30, timeZone: "America/New_York", importance: "high" },

  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", date: "2026-09-16", hour: 14, minute: 0, timeZone: "America/New_York", importance: "high" },
  { kind: "GDP", title: "US GDP (prelim)", detail: "Quarterly growth print", country: "US", date: "2026-08-27", hour: 8, minute: 30, timeZone: "America/New_York", importance: "medium" },
  { kind: "ECB", title: "ECB rate decision", detail: "Governing Council announcement", country: "DE", date: "2026-09-10", hour: 14, minute: 15, timeZone: "Europe/Berlin", importance: "high" },
  // Eurostat: July full HICP 19 Aug 12:00 CEST; August flash 1 Sep 15:00 CEST; August full 17 Sep 12:00 CEST
  { kind: "CPI", title: "Eurozone CPI", detail: "July HICP full release (Eurostat)", country: "DE", date: "2026-08-19", hour: 12, minute: 0, timeZone: "Europe/Berlin", importance: "high" },
  { kind: "CPI", title: "Eurozone CPI", detail: "August HICP flash estimate (Eurostat)", country: "DE", date: "2026-09-01", hour: 15, minute: 0, timeZone: "Europe/Berlin", importance: "high" },
  { kind: "CPI", title: "Eurozone CPI", detail: "August HICP full release (Eurostat)", country: "DE", date: "2026-09-17", hour: 12, minute: 0, timeZone: "Europe/Berlin", importance: "high" },
  { kind: "BOE", title: "BoE MPC decision", detail: "Bank Rate announcement", country: "GB", date: "2026-09-17", hour: 12, minute: 0, timeZone: "Europe/London", importance: "high" },
  // ONS: July CPI released 19 Aug; August CPI 16 Sep 07:00 UK
  { kind: "CPI", title: "UK CPI", detail: "July inflation (ONS)", country: "GB", date: "2026-08-19", hour: 7, minute: 0, timeZone: "Europe/London", importance: "medium" },
  { kind: "CPI", title: "UK CPI", detail: "August inflation (ONS)", country: "GB", date: "2026-09-16", hour: 7, minute: 0, timeZone: "Europe/London", importance: "medium" },
  { kind: "BOJ", title: "BoJ policy decision", detail: "Monetary policy statement", country: "JP", date: "2026-09-17", hour: 12, minute: 0, timeZone: "Asia/Tokyo", importance: "high" },
  { kind: "CPI", title: "Japan CPI", detail: "Tokyo / national CPI", country: "JP", date: "2026-08-21", hour: 8, minute: 30, timeZone: "Asia/Tokyo", importance: "medium" },
  { kind: "EARNINGS", title: "Mega-cap earnings week", detail: "US tech heavyweights report", country: "US", date: "2026-10-22", hour: 16, minute: 0, timeZone: "America/New_York", importance: "high" },
  { kind: "EARNINGS", title: "EU bank earnings", detail: "Major eurozone banks", country: "DE", date: "2026-10-29", hour: 8, minute: 0, timeZone: "Europe/Berlin", importance: "medium" },
  { kind: "EARNINGS", title: "Japan exporters", detail: "Autos & electronics prints", country: "JP", date: "2026-11-05", hour: 15, minute: 0, timeZone: "Asia/Tokyo", importance: "medium" },
  { kind: "GDP", title: "China GDP", detail: "Quarterly growth", country: "CN", date: "2026-10-19", hour: 10, minute: 0, timeZone: "Asia/Shanghai", importance: "high" },
  { kind: "CPI", title: "India CPI", detail: "National inflation", country: "IN", date: "2026-09-12", hour: 11, minute: 0, timeZone: "Asia/Kolkata", importance: "medium" },
  { kind: "FED", title: "Fed speakers", detail: "Scheduled FOMC member remarks", country: "US", date: "2026-08-20", hour: 13, minute: 0, timeZone: "America/New_York", importance: "medium" },
  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", date: "2026-11-04", hour: 14, minute: 0, timeZone: "America/New_York", importance: "high" },
  { kind: "FED", title: "FOMC decision", detail: "Federal Reserve rate decision", country: "US", date: "2026-12-16", hour: 14, minute: 0, timeZone: "America/New_York", importance: "high" },
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

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** How far ahead of UTC the zone is at `utcMs` (positive = east of Greenwich). */
function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUTC - utcMs;
}

/** Convert a wall-clock time in `timeZone` to a UTC instant. */
export function zonedLocalToUtc(date: string, hour: number, minute: number, timeZone: string): number {
  const utcGuess = Date.parse(`${date}T${pad(hour)}:${pad(minute)}:00.000Z`);
  const first = utcGuess - tzOffsetMs(utcGuess, timeZone);
  return utcGuess - tzOffsetMs(first, timeZone);
}

/** Release-local stamp, so a viewer in IST does not see 08:30 ET as 18:00. */
export function formatEconStamp(e: EconCalendarEvent): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: e.timeZone,
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(new Date(e.time));
  } catch {
    return new Date(e.time).toISOString();
  }
}

/** Upcoming + recent events, sorted soonest first. Window matches /calendar (45d). */
export function getEconCalendar(now = Date.now()): EconCalendarEvent[] {
  return SEED.map((s, i) => {
    const c = COUNTRIES[s.country];
    const time = zonedLocalToUtc(s.date, s.hour, s.minute, s.timeZone);
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
      timeZone: s.timeZone,
    } satisfies EconCalendarEvent;
  })
    .filter((e) => e.lat !== 0 || e.lng !== 0)
    .filter((e) => e.time >= now - 3 * 86400_000 && e.time <= now + 45 * 86400_000)
    .sort((a, b) => a.time - b.time);
}
