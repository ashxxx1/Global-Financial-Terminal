import { useState, useEffect } from "react";
import { CALENDAR_EVENTS, getNextHighImpactEvent } from "./calendarData";

const IMPORTANCE_CONFIG = {
  high: { label: "HIGH", color: "#ff2244", bg: "rgba(255,34,68,0.12)" },
  medium: { label: "MED", color: "#ffaa00", bg: "rgba(255,170,0,0.12)" },
  low: { label: "LOW", color: "#44445a", bg: "rgba(68,68,90,0.2)" },
};

const CATEGORIES = ["All", "Central Bank", "Inflation", "Employment", "GDP", "Manufacturing", "Consumer", "Housing"];
const COUNTRIES_FILTER = ["All", "US", "EU", "UK", "DE", "JP", "CN"];

function Countdown({ targetDate }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    function calc() { setDiff(Math.max(0, new Date(targetDate) - new Date())); }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (diff === 0) return <span style={{ color: "var(--accent-amber)" }}>LIVE</span>;
  if (h > 48) return <span>{Math.floor(h / 24)}d {h % 24}h</span>;
  return <span className="calendar__countdown">{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>;
}

function ImpactBadge({ importance }) {
  const cfg = IMPORTANCE_CONFIG[importance] || IMPORTANCE_CONFIG.low;
  return (
    <span className="calendar__importance" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function ActualVsForecast({ actual, forecast }) {
  if (!actual) return <span className="calendar__pending">—</span>;
  const a = parseFloat(actual);
  const f = parseFloat(forecast);
  const beat = !isNaN(a) && !isNaN(f) && a > f;
  const miss = !isNaN(a) && !isNaN(f) && a < f;
  return (
    <span className={`calendar__actual ${beat ? "beat" : miss ? "miss" : ""}`}>
      {actual}
      {beat ? " ▲" : miss ? " ▼" : ""}
    </span>
  );
}

export default function EconomicCalendar({ onClose }) {
  const [filterCat, setFilterCat] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterImportance, setFilterImportance] = useState("All");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const now = new Date();

  const nextEvent = getNextHighImpactEvent();

  const filtered = CALENDAR_EVENTS.filter((e) => {
    if (filterCat !== "All" && e.category !== filterCat) return false;
    if (filterCountry !== "All" && e.country !== filterCountry) return false;
    if (filterImportance !== "All" && e.importance !== filterImportance) return false;
    if (showUpcoming && e.actual) return false;
    return true;
  }).sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  return (
    <div className="economic-calendar">
      <div className="economic-calendar__header">
        <div className="economic-calendar__title">
          <span>🗓️</span> Economic Calendar
        </div>
        {nextEvent && (
          <div className="economic-calendar__next">
            <span className="economic-calendar__next-label">Next High Impact:</span>
            <span className="economic-calendar__next-event">{nextEvent.countryFlag} {nextEvent.event}</span>
            <span className="economic-calendar__next-timer">
              <Countdown targetDate={`${nextEvent.date}T${nextEvent.time}`} />
            </span>
          </div>
        )}
        <button className="economic-calendar__close" onClick={onClose}>✕</button>
      </div>

      <div className="economic-calendar__filters">
        <div className="economic-calendar__filter-group">
          <span className="economic-calendar__filter-label">Category</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`economic-calendar__filter-btn ${filterCat === c ? "active" : ""}`}
              onClick={() => setFilterCat(c)}
            >{c}</button>
          ))}
        </div>
        <div className="economic-calendar__filter-group">
          <span className="economic-calendar__filter-label">Country</span>
          {COUNTRIES_FILTER.map((c) => (
            <button
              key={c}
              className={`economic-calendar__filter-btn ${filterCountry === c ? "active" : ""}`}
              onClick={() => setFilterCountry(c)}
            >{c}</button>
          ))}
        </div>
        <div className="economic-calendar__filter-group">
          <span className="economic-calendar__filter-label">Impact</span>
          {["All", "high", "medium", "low"].map((i) => (
            <button
              key={i}
              className={`economic-calendar__filter-btn ${filterImportance === i ? "active" : ""}`}
              onClick={() => setFilterImportance(i)}
            >{i === "All" ? "All" : i.charAt(0).toUpperCase() + i.slice(1)}</button>
          ))}
          <label className="economic-calendar__toggle-label">
            <input type="checkbox" checked={showUpcoming} onChange={(e) => setShowUpcoming(e.target.checked)} />
            Upcoming only
          </label>
        </div>
      </div>

      <div className="economic-calendar__table-wrap">
        <table className="economic-calendar__table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Country</th>
              <th>Event</th>
              <th>Impact</th>
              <th>Forecast</th>
              <th>Previous</th>
              <th>Actual</th>
              <th>Countdown</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev) => {
              const dt = new Date(`${ev.date}T${ev.time}`);
              const isPast = dt < now;
              return (
                <tr key={ev.id} className={`economic-calendar__row ${isPast ? "past" : "upcoming"} importance-${ev.importance}`}>
                  <td className="economic-calendar__date-cell">
                    <div className="economic-calendar__date">{ev.date.slice(5)}</div>
                    <div className="economic-calendar__time">{ev.time} UTC</div>
                  </td>
                  <td>{ev.countryFlag} {ev.country}</td>
                  <td className="economic-calendar__event-cell">
                    <div className="economic-calendar__event-name">{ev.event}</div>
                    <div className="economic-calendar__event-cat">{ev.category}</div>
                  </td>
                  <td><ImpactBadge importance={ev.importance} /></td>
                  <td className="economic-calendar__forecast">{ev.forecast || "—"}</td>
                  <td className="economic-calendar__previous">{ev.previous || "—"}</td>
                  <td><ActualVsForecast actual={ev.actual} forecast={ev.forecast} /></td>
                  <td>
                    {!isPast ? <Countdown targetDate={`${ev.date}T${ev.time}`} /> : <span className="calendar__released">Released</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
