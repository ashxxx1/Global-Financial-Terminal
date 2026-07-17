import { X, ShieldAlert, Building2, Calendar } from "lucide-react";
import { getCountryStats } from "./data";
import MarketTable from "../MarketTable/MarketTable";
import { getCountryData, getCountrySignalMetrics } from "../../lib/quantFeed";
import { kNearestAnalogs } from "../../lib/quantEngine";
import { CALENDAR_EVENTS } from "../EconomicCalendar/calendarData";

// ── Data helpers (unchanged logic, same as before) ────────────
function getUpcomingEvents(iso) {
  const isEuro = ["DE", "FR", "IT", "NL", "SE"].includes(iso);
  const events = CALENDAR_EVENTS.filter(
    (e) => e.country === iso || (isEuro && e.country === "EU")
  );
  if (events.length > 0) {
    return events.slice(0, 3).map((e) => ({
      title: e.event,
      type: e.category,
      countdown: `${e.time} · ${e.date}`,
    }));
  }
  const seed = (iso.charCodeAt(0) || 65) + (iso.charCodeAt(1) || 66);
  return [
    { title: "Central Bank Rate Decision", type: "Monetary Policy", countdown: `In ${(seed % 4) + 1}d` },
    { title: "CPI Inflation Report",       type: "Macro Inflation", countdown: `In ${(seed % 5) + 3}d` },
  ];
}

function getSentimentData(iso) {
  try {
    const metrics = getCountrySignalMetrics(iso);
    const score = Math.round(Math.max(0, Math.min(100, 50 + metrics.factors.sentiment * 15)));
    const seed = (iso.charCodeAt(0) || 65) * 100 + (iso.charCodeAt(1) || 66);
    const history = Array.from({ length: 10 }, (_, i) =>
      Math.round(Math.max(0, Math.min(100, 50 + Math.sin(i + seed) * 15 + metrics.factors.sentiment * 5)))
    );
    const label = score > 58 ? "BULLISH" : score < 42 ? "BEARISH" : "NEUTRAL";
    const color = score > 58 ? "#46d38a" : score < 42 ? "#e8635a" : "#f5b13d";
    return { score, label, color, history };
  } catch {
    return { score: 50, label: "NEUTRAL", color: "#f5b13d", history: Array(10).fill(50) };
  }
}

function getHistoricalAnalog(iso) {
  try {
    const { prices, baseFactors } = getCountryData(iso);
    const currentVec = [baseFactors.momentum, baseFactors.valuation, baseFactors.macro, baseFactors.volatility, baseFactors.sentiment];
    const invCov = [[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1]];
    const seed = (iso.charCodeAt(0) || 65) * 100 + (iso.charCodeAt(1) || 66);
    let s = seed + 2000;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const samples = [];
    for (let t = 253; t < prices.length - 30; t += 5) {
      samples.push({
        t,
        vec: currentVec.map((v, i) => v + (rnd() - 0.5) * (i < 3 ? 1.5 : 1.0)),
        forwardReturn: (prices[t + 30] / prices[t] - 1) * (1.0 + (rnd() - 0.5) * 0.2),
      });
    }
    const analogs = kNearestAnalogs(currentVec, samples, invCov, 5, 20);
    const best = analogs[0];
    let period = `T − ${500 - best.t}d Setup`;
    if (iso === "US") period = best.t > 380 ? "Mid-2023 Consolidation" : "Late-2022 Valuation Low";
    else if (iso === "JP") period = best.t > 380 ? "Post-YCC Pivot Phase" : "Mid-2023 Export Surge";
    else if (iso === "DE") period = best.t > 380 ? "2023 Energy Crunch" : "2022 Supply Chain Peak";
    else period = best.t > 380 ? "H1 2024 Regime Shift" : "H2 2023 Consolidation";
    const correlation = Math.round(Math.max(65, Math.min(98, 98 - best.distance * 10)));
    return { period, correlation, current: prices.slice(-10), historical: prices.slice(best.t, best.t + 10) };
  } catch {
    return { period: "H1 2024 Regime Shift", correlation: 85,
      current: [100,101,102,101,103,104,103,105,106,107],
      historical: [100,99,101,102,100,103,104,102,104,105] };
  }
}

// ── Shared style tokens ───────────────────────────────────────
const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Fraunces', Georgia, serif";
const BRASS = "#f5b13d";
const BRASS_SOFT = "rgba(245, 177, 61,0.1)";
const HAIRLINE = "rgba(245, 177, 61,0.14)";
const INK = "#05070d";

function SectionLabel({ children }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: "8px", fontWeight: 700,
      letterSpacing: "0.2em", color: "#5c5546",
      textTransform: "uppercase", display: "block", marginBottom: "8px",
    }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, valueColor = "#f0e6d2" }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-sm" style={{
      background: "rgba(255,255,255,0.025)",
      border: HAIRLINE ? `1px solid ${HAIRLINE}` : undefined,
    }}>
      <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#5c5546" }}>
        {label}
      </span>
      <span style={{ fontFamily: MONO, fontSize: "16px", fontWeight: 700, color: valueColor, lineHeight: 1.1 }}>
        {value}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function CountryLeftPanel({ country, onClose, timeframe = "1D" }) {
  if (!country) return null;

  const name = country.properties?.ADMIN || country.name || "Unknown Region";
  const iso  = country.properties?.ISO_A2 || country.code || "XX";
  const stats = getCountryStats(iso);

  const riskColor =
    stats.riskScore > 75 ? "#e8635a" :
    stats.riskScore > 40 ? "#f5b13d" : "#46d38a";

  const riskLabel =
    stats.riskScore > 75 ? "CRITICAL" :
    stats.riskScore > 40 ? "ELEVATED" : "STABLE";

  const inflColor = parseFloat(stats.inflation) > 4 ? "#e8635a" : "#46d38a";

  // Sentiment data for sparkline
  const sent = getSentimentData(iso);
  const sentMax = Math.max(...sent.history);
  const sentMin = Math.min(...sent.history);
  const sentRange = sentMax - sentMin || 1;
  const sentPoints = sent.history.map((v, i) => `${(i / 9) * 70},${14 - ((v - sentMin) / sentRange) * 12}`).join(" ");

  // Analog sparklines
  const analog = getHistoricalAnalog(iso);
  const makePoints = (arr) => {
    const max = Math.max(...arr), min = Math.min(...arr), r = max - min || 1;
    return arr.map((v, i) => `${(i / (arr.length - 1)) * 50},${10 - ((v - min) / r) * 8}`).join(" ");
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(5,7,13,0.98)",
        borderRight: `1px solid ${HAIRLINE}`,
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-3">
          {/* ISO badge */}
          <div
            className="flex items-center justify-center rounded-sm"
            style={{
              width: 36, height: 36,
              background: BRASS_SOFT,
              border: `1px solid rgba(245, 177, 61,0.35)`,
              fontFamily: MONO, fontSize: "11px", fontWeight: 700,
              color: BRASS, letterSpacing: "0.08em",
            }}
          >
            {iso}
          </div>
          <div>
            <h2 style={{
              fontFamily: SERIF, fontStyle: "italic",
              fontSize: "15px", fontWeight: 500,
              color: "#f0e6d2", letterSpacing: "0.01em",
              margin: 0, lineHeight: 1.1,
            }}>
              {name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full motion-safe:animate-pulse"
                style={{ background: "#46d38a", boxShadow: "0 0 4px rgba(70, 211, 138,0.8)" }} />
              <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#46d38a" }}>
                LIVE DATA
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-sm transition-all cursor-pointer"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#6b6354" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#e8635a"; e.currentTarget.style.borderColor = "rgba(232,99,90,0.35)"; e.currentTarget.style.background = "rgba(232,99,90,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#6b6354"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

        {/* ── Macro stats ── */}
        <div>
          <SectionLabel>Macro Indicators</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="GDP" value={`$${stats.gdp}T`} />
            <StatCard label="Inflation" value={`${stats.inflation}%`} valueColor={inflColor} />
            <StatCard label="C.B. Rate" value={`${stats.rate}%`} valueColor={BRASS} />
            <StatCard label="FX" value={stats.currency} valueColor="#a89c84" />
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Risk gravity ── */}
        <div>
          <SectionLabel>Risk Gravity</SectionLabel>
          <div
            className="flex items-center gap-4 p-3 rounded-sm"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}
          >
            {/* Ring */}
            <div className="relative shrink-0 flex items-center justify-center rounded-full"
              style={{ width: 60, height: 60, border: `4px solid rgba(255,255,255,0.06)` }}>
              <div className="absolute inset-0 rounded-full rotate-12"
                style={{ border: `4px solid ${riskColor}`, borderTopColor: "transparent", borderLeftColor: "transparent" }} />
              <span style={{ fontFamily: MONO, fontSize: "17px", fontWeight: 700, color: riskColor }}>
                {stats.riskScore}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: riskColor }}>
                {riskLabel}
              </span>
              <span style={{ fontSize: "11px", color: "#a89c84", lineHeight: 1.5 }}>
                Geopolitical exposure is&nbsp;
                <strong style={{ color: riskColor }}>
                  {stats.riskScore > 75 ? "critical" : stats.riskScore > 40 ? "elevated" : "stable"}
                </strong>
                &nbsp;across transmission channels.
              </span>
            </div>
          </div>
        </div>

        {/* ── Sentiment sparkline ── */}
        <div>
          <SectionLabel>Sentiment Pulse</SectionLabel>
          <div
            className="flex items-center justify-between p-3 rounded-sm"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex flex-col gap-0.5">
              <span style={{ fontFamily: MONO, fontSize: "20px", fontWeight: 700, color: sent.color, lineHeight: 1 }}>
                {sent.score}
              </span>
              <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: sent.color }}>
                {sent.label}
              </span>
            </div>
            <svg width="72" height="18" viewBox="0 0 72 18" overflow="visible">
              <defs>
                <linearGradient id={`sg-${iso}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sent.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={sent.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`M ${sentPoints}`} fill="none" stroke={sent.color} strokeWidth="1.5" strokeLinecap="round" />
              <polygon points={`0,18 ${sentPoints} 70,18`} fill={`url(#sg-${iso})`} />
              <circle cx="70" cy={14 - ((sent.history[9] - sentMin) / sentRange) * 12} r="2.5"
                fill={sent.color} className="motion-safe:animate-pulse" />
            </svg>
          </div>
        </div>

        {/* ── Historical analog ── */}
        <div>
          <SectionLabel>Historical Analog</SectionLabel>
          <div
            className="p-3 rounded-sm flex items-center justify-between gap-3"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, color: BRASS, letterSpacing: "0.04em" }}>
                {analog.period}
              </span>
              <span style={{ fontFamily: MONO, fontSize: "8px", color: "#6b6354", letterSpacing: "0.1em" }}>
                {analog.correlation}% CORRELATION
              </span>
            </div>
            <div className="flex gap-3 shrink-0">
              {[{ label: "NOW", pts: makePoints(analog.current), color: BRASS },
                { label: "HIST", pts: makePoints(analog.historical), color: "#c97b4a" }].map(({ label, pts, color }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span style={{ fontFamily: MONO, fontSize: "7px", color: "#5c5546", letterSpacing: "0.1em" }}>{label}</span>
                  <svg width="52" height="14" viewBox="0 0 52 14" overflow="visible">
                    <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Upcoming events ── */}
        <div>
          <SectionLabel>Policy Calendar</SectionLabel>
          <div className="flex flex-col gap-2">
            {getUpcomingEvents(iso).map((evt, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm"
                style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${HAIRLINE}` }}
              >
                <div className="flex flex-col min-w-0">
                  <span style={{ fontSize: "11.5px", color: "#c9bea3", fontWeight: 500, lineHeight: 1.3 }}>
                    {evt.title}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", color: "#5c5546" }}>
                    {evt.type.toUpperCase()}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-sm px-2 py-1"
                  style={{
                    fontFamily: MONO, fontSize: "9px", fontWeight: 700,
                    letterSpacing: "0.06em", color: BRASS,
                    background: BRASS_SOFT,
                    border: `1px solid rgba(245, 177, 61,0.28)`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {evt.countdown}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Strategic Equities ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Strategic Equities</SectionLabel>
            <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546", letterSpacing: "0.1em", marginBottom: "8px" }}>
              {timeframe}
            </span>
          </div>
          <MarketTable countryCode={iso} />
        </div>

      </div>
    </div>
  );
}

export default CountryLeftPanel;
