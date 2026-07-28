import { useEffect, useMemo, useState } from "react";

/**
 * Global exchange session strip.
 *
 * A world-markets terminal has to answer "who is trading right now?" before
 * anything else — a 2% move on Nikkei means something different at 03:00 UTC
 * with Tokyo open than it does after the close.
 *
 * Session state is derived from each exchange's *local* wall clock via Intl
 * time zones, so daylight saving is handled by the platform rather than by
 * hardcoded UTC offsets that silently drift twice a year.
 */

interface Exchange {
  code: string;
  city: string;
  tz: string;
  /** Local session, minutes from midnight. */
  open: number;
  close: number;
}

const M = (h: number, m = 0) => h * 60 + m;

const EXCHANGES: Exchange[] = [
  { code: "ASX", city: "Sydney",    tz: "Australia/Sydney", open: M(10),     close: M(16) },
  { code: "TSE", city: "Tokyo",     tz: "Asia/Tokyo",       open: M(9),      close: M(15) },
  { code: "HKG", city: "Hong Kong", tz: "Asia/Hong_Kong",   open: M(9, 30),  close: M(16) },
  { code: "NSE", city: "Mumbai",    tz: "Asia/Kolkata",     open: M(9, 15),  close: M(15, 30) },
  { code: "LSE", city: "London",    tz: "Europe/London",    open: M(8),      close: M(16, 30) },
  { code: "FRA", city: "Frankfurt", tz: "Europe/Berlin",    open: M(9),      close: M(17, 30) },
  { code: "NYS", city: "New York",  tz: "America/New_York", open: M(9, 30),  close: M(16) },
];

interface SessionState {
  ex: Exchange;
  localLabel: string;
  isOpen: boolean;
  isWeekend: boolean;
  /** 0–1 through the session when open. */
  progress: number;
  /** Minutes until the next state change. */
  until: number;
}

/** Read an exchange's local weekday + minute-of-day using its IANA zone. */
function localNow(tz: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some ICU builds emit 24 for midnight
  const minute = parseInt(get("minute"), 10);
  return { weekday: get("weekday"), minutes: hour * 60 + minute, hour, minute };
}

function evaluate(ex: Exchange, now: Date): SessionState {
  const { weekday, minutes, hour, minute } = localNow(ex.tz, now);
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const isOpen = !isWeekend && minutes >= ex.open && minutes < ex.close;

  const progress = isOpen ? (minutes - ex.open) / (ex.close - ex.open) : 0;
  const until = isOpen
    ? ex.close - minutes
    : minutes < ex.open
      ? ex.open - minutes
      : 24 * 60 - minutes + ex.open;

  return {
    ex,
    localLabel: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    isOpen,
    isWeekend,
    progress,
    until,
  };
}

function humanise(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function MarketSessions({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(iv);
  }, []);

  const sessions = useMemo(() => EXCHANGES.map((ex) => evaluate(ex, now)), [now]);
  const openCount = sessions.filter((s) => s.isOpen).length;

  return (
    <div className="sessions" role="group" aria-label="Global exchange sessions">
      <div className="sessions-head">
        <span className="panel-title">Market sessions</span>
        <span className="label" style={{ color: openCount ? "var(--up)" : "var(--faint)" }}>
          {openCount} OPEN
        </span>
      </div>
      <div className={`sessions-grid ${compact ? "compact" : ""}`}>
        {sessions.map((s) => (
          <div
            key={s.ex.code}
            className={`session ${s.isOpen ? "on" : ""}`}
            title={`${s.ex.city} — ${s.isOpen ? `closes in ${humanise(s.until)}` : s.isWeekend ? "weekend" : `opens in ${humanise(s.until)}`}`}
          >
            <div className="session-top">
              <span className="session-code">{s.ex.code}</span>
              <span className={`session-dot ${s.isOpen ? "pulse-dot" : ""}`} />
            </div>
            <div className="session-time mono">{s.localLabel}</div>
            <div className="session-meta">
              {s.isOpen ? `${humanise(s.until)} left` : s.isWeekend ? "Weekend" : `in ${humanise(s.until)}`}
            </div>
            <div className="session-bar">
              <div className="session-fill" style={{ width: `${Math.round(s.progress * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
