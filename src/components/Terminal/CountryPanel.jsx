import { useState, useEffect, useRef } from "react";
import { X, Cpu, Globe, Activity, ShieldAlert, Building2 } from "lucide-react";
import { getCountryStats } from "./data";
import MarketTable from "../MarketTable/MarketTable";
import { getLocalNewsOutlets, getLocalHeadlines, generateGeopoliticalSummary } from "../NewsPanel/localNewsData";

// ── Typewriter ──────────────────────────────────────────────
function TypewriterSummary({ text, speed = 10 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return (
    <p style={{ fontSize: "12px", color: "#c9bea3", lineHeight: "1.65", margin: 0, minHeight: "56px" }}>
      {displayed}
      {displayed.length < (text?.length || 0) && (
        <span style={{ display: "inline-block", width: "6px", height: "12px", background: "#f5b13d", marginLeft: "2px", verticalAlign: "text-bottom" }}
          className="animate-pulse">▋</span>
      )}
    </p>
  );
}

const MONO    = "'JetBrains Mono', monospace";
const SERIF   = "'Fraunces', Georgia, serif";
const BRASS   = "#f5b13d";
const HAIRLINE = "rgba(245, 177, 61,0.16)";

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: "8px", fontWeight: 700,
      letterSpacing: "0.2em", color: "#5c5546",
      textTransform: "uppercase", marginBottom: "10px",
    }}>
      {children}
    </div>
  );
}

// ── Mobile country panel — compact scroll sheet ──────────────
export function CountryPanel({ country, onClose, timeframe = "1D" }) {
  if (!country) return null;

  const name           = country.properties?.ADMIN || country.name || "Unknown";
  const iso            = country.properties?.ISO_A2 || country.code || "XX";
  const stats          = getCountryStats(iso);
  const localOutlets   = getLocalNewsOutlets(iso);
  const localHeadlines = getLocalHeadlines(iso);
  const geoSummary     = generateGeopoliticalSummary(iso, stats.sentiment || "neutral");

  const riskColor =
    stats.riskScore > 75 ? "#e8635a" :
    stats.riskScore > 40 ? "#f5b13d" : "#46d38a";
  const inflColor = parseFloat(stats.inflation) > 4 ? "#e8635a" : "#46d38a";

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        background: "rgba(5,7,13,0.98)",
        border: `1px solid ${HAIRLINE}`,
        borderRadius: "4px",
        maxHeight: "85vh",
        position: "relative",
      }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 shrink-0"
        style={{
          background: "rgba(5,7,13,0.98)",
          borderBottom: `1px solid ${HAIRLINE}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-sm shrink-0"
            style={{
              width: 40, height: 40,
              background: "rgba(245, 177, 61,0.08)",
              border: `1px solid rgba(245, 177, 61,0.3)`,
              fontFamily: MONO, fontSize: "11px", fontWeight: 700,
              color: BRASS, letterSpacing: "0.06em",
            }}
          >
            {iso}
          </div>
          <div>
            <h2 style={{
              fontFamily: SERIF, fontStyle: "italic",
              fontSize: "17px", fontWeight: 500,
              color: "#f0e6d2", margin: 0, letterSpacing: "0.01em",
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
          aria-label="Close panel"
          className="flex items-center justify-center w-8 h-8 rounded-sm transition-all cursor-pointer"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b6354" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#e8635a"; e.currentTarget.style.borderColor = "rgba(232,99,90,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#6b6354"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">

        {/* ── Macro stats ── */}
        <div>
          <SectionLabel>Macro Indicators</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "GDP",       value: `$${stats.gdp}T`,       color: "#f0e6d2" },
              { label: "Inflation", value: `${stats.inflation}%`,  color: inflColor },
              { label: "C.B. Rate", value: `${stats.rate}%`,       color: BRASS },
              { label: "FX",        value: stats.currency,         color: "#a89c84" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col gap-0.5 p-3 rounded-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${HAIRLINE}` }}>
                <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#5c5546" }}>{label}</span>
                <span style={{ fontFamily: MONO, fontSize: "18px", fontWeight: 700, color, lineHeight: 1.1 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Risk + AI synthesis side-by-side ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk */}
          <div className="flex flex-col gap-3 p-4 rounded-sm"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}>
            <SectionLabel>Risk Gravity</SectionLabel>
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center rounded-full shrink-0"
                style={{ width: 64, height: 64, border: "4px solid rgba(255,255,255,0.06)" }}>
                <div className="absolute inset-0 rounded-full rotate-12"
                  style={{ border: `4px solid ${riskColor}`, borderTopColor: "transparent", borderLeftColor: "transparent" }} />
                <span style={{ fontFamily: MONO, fontSize: "18px", fontWeight: 700, color: riskColor }}>{stats.riskScore}</span>
              </div>
              <span style={{ fontSize: "11px", color: "#a89c84", lineHeight: 1.5 }}>
                Geopolitical exposure is&nbsp;
                <strong style={{ color: riskColor }}>
                  {stats.riskScore > 75 ? "critical" : stats.riskScore > 40 ? "elevated" : "stable"}
                </strong>.
              </span>
            </div>
          </div>

          {/* AI synthesis */}
          <div className="md:col-span-2 relative overflow-hidden p-4 rounded-sm"
            style={{ background: "rgba(10,14,26,0.8)", border: `1px solid rgba(245, 177, 61,0.25)` }}>
            <div className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: "linear-gradient(180deg, rgba(245, 177, 61,0.8), rgba(245, 177, 61,0.1))" }} />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-3.5 h-3.5" style={{ color: BRASS }} />
                <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#a89c84" }}>
                  AI GEOPOLITICAL SYNTHESIS
                </span>
              </div>
              <TypewriterSummary text={geoSummary || stats.aiAnalysis} speed={10} />
            </div>
          </div>
        </div>

        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Strategic equities ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Strategic Equities</SectionLabel>
            <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546", marginBottom: "10px" }}>{timeframe}</span>
          </div>
          <MarketTable countryCode={iso} />
        </div>

        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Connected channels ── */}
        <div>
          <SectionLabel>Connected Channels</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {localOutlets.map((outlet, i) => (
              <div key={i} className="flex flex-col justify-center p-2.5 rounded-sm"
                style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${HAIRLINE}`, minHeight: "44px" }}>
                <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, color: BRASS }}>{outlet.name}</span>
                <span style={{ fontSize: "9px", color: "#5c5546", fontFamily: MONO, marginTop: "2px", lineHeight: 1.3 }}>{outlet.focus}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Local news ── */}
        <div>
          <SectionLabel>Local News Feed</SectionLabel>
          <div className="flex flex-col gap-2">
            {localHeadlines.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-sm"
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE}` }}>
                <span style={{ fontSize: "12px", color: "#c9bea3", lineHeight: "1.5", fontWeight: 500 }}>{item.title}</span>
                <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
                  {item.source}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CountryPanel;
