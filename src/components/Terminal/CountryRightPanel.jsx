import { useState, useEffect, useRef } from "react";
import { Cpu, Globe, Pin } from "lucide-react";
import { getCountryStats } from "./data";
import { getLocalNewsOutlets, getLocalHeadlines, generateGeopoliticalSummary } from "../NewsPanel/localNewsData";
import useTerminalStore from "../../store/terminalStore";

// ── Typewriter (preserved exactly) ────────────────────────────
function TypewriterSummary({ text, speed = 10 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) { setPrevText(text); setDisplayed(""); }
  useEffect(() => {
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
    <p style={{ fontSize: "11.5px", color: "#c9bea3", lineHeight: "1.65", margin: 0, minHeight: "56px" }}>
      {displayed}
      {displayed.length < (text?.length || 0) && (
        <span style={{ display: "inline-block", width: "6px", height: "12px", background: "#d4af37", marginLeft: "2px", verticalAlign: "text-bottom" }}
          className="animate-pulse">▋</span>
      )}
    </p>
  );
}

// ── Supply chain data (unchanged logic) ───────────────────────
function getSupplyChainExposure(iso) {
  if (iso === "US") return [
    { name: "Semiconductors", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "Neon Supply",    eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "SaaS Compliance",eventId: 4, eventTitle: "AI Regulatory Framework Draft Leaked" },
    { name: "Crude Energy",   eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" },
  ];
  if (["CN","TW","JP","KR"].includes(iso)) return [
    { name: "Wafer Shipping", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "Rare Earths",    eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "Lithium Cells",  eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" },
    { name: "AI Regulations", eventId: 4, eventTitle: "AI Regulatory Framework Draft Leaked" },
  ];
  if (["DE","FR","NL","GB"].includes(iso)) return [
    { name: "Liquidity Buffers", eventId: 3, eventTitle: "ECB Emergency Liquidity Injection" },
    { name: "ASML Gas Imports",  eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "AI Copilots",       eventId: 4, eventTitle: "AI Regulatory Framework Draft Leaked" },
    { name: "Jet Fuel Spot",     eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" },
  ];
  return [
    { name: "Energy Inputs",      eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" },
    { name: "Technology Hardware",eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "Sovereign Bonds",    eventId: 3, eventTitle: "ECB Emergency Liquidity Injection" },
  ];
}

// ── Style tokens ──────────────────────────────────────────────
const MONO    = "'JetBrains Mono', monospace";
const SERIF   = "'Fraunces', Georgia, serif";
const BRASS   = "#d4af37";
const HAIRLINE = "rgba(212,175,55,0.14)";

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

// ── Main component ────────────────────────────────────────────
export function CountryRightPanel({ country, timeframe = "1D" }) {
  const setCausalChainEvent = useTerminalStore((s) => s.setCausalChainEvent);
  const addAnnotation       = useTerminalStore((s) => s.addAnnotation);
  const [noteText, setNoteText] = useState("");

  if (!country) return null;

  const iso           = country.properties?.ISO_A2 || country.code || "XX";
  const stats         = getCountryStats(iso);
  const localOutlets  = getLocalNewsOutlets(iso);
  const localHeadlines= getLocalHeadlines(iso);
  const geoSummary    = generateGeopoliticalSummary(iso, stats.sentiment || "neutral");
  const supplyChain   = getSupplyChainExposure(iso);

  const handlePinNote = () => {
    if (!noteText.trim()) return;
    let lat = (iso.charCodeAt(0) % 60) - 20;
    let lng = (iso.charCodeAt(1) % 180) - 90;
    if (iso === "US") { lat = 40; lng = -97; }
    else if (iso === "CN") { lat = 35; lng = 105; }
    else if (iso === "JP") { lat = 36; lng = 138; }
    else if (iso === "DE") { lat = 51; lng = 9; }
    addAnnotation({ id: "a_" + Date.now(), lat, lng, text: noteText.trim(), author: "Trader #1" });
    setNoteText("");
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(5,7,13,0.98)",
        borderLeft: `1px solid ${HAIRLINE}`,
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: BRASS }} />
          <span style={{
            fontFamily: MONO, fontSize: "9px", fontWeight: 700,
            letterSpacing: "0.18em", color: "#a89c84",
          }}>
            REGIONAL ANALYSIS
          </span>
        </div>
        <span
          className="flex items-center gap-1 rounded-sm px-2 py-0.5"
          style={{
            fontFamily: MONO, fontSize: "8px", fontWeight: 700,
            letterSpacing: "0.1em", color: "#4fd1a5",
            background: "rgba(79,209,165,0.08)",
            border: "1px solid rgba(79,209,165,0.2)",
          }}
        >
          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#4fd1a5" }} />
          SECURE
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

        {/* ── AI Geopolitical synthesis ── */}
        <div>
          <SectionLabel>AI Geopolitical Synthesis</SectionLabel>
          <div
            className="relative overflow-hidden p-4 rounded-sm"
            style={{
              background: "rgba(10,14,26,0.8)",
              border: `1px solid rgba(212,175,55,0.25)`,
            }}
          >
            {/* Left brass bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.8), rgba(212,175,55,0.1))" }} />
            <div className="flex items-center gap-2 mb-3 pl-2">
              <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: BRASS }} />
              <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#a89c84" }}>
                SYNTHESIZING REGIONAL SIGNALS
              </span>
            </div>
            <div className="pl-2">
              <TypewriterSummary text={geoSummary || stats.aiAnalysis} speed={10} />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Supply chain / Flow Trajectory ── */}
        <div>
          <SectionLabel>Flow Trajectory & Supply Chain</SectionLabel>
          <p style={{ fontSize: "10px", color: "#5c5546", fontFamily: MONO, marginBottom: "10px", lineHeight: 1.5 }}>
            Click any node to trace its causal propagation chain →
          </p>
          <div className="flex flex-wrap gap-2">
            {supplyChain.map((item, i) => (
              <button
                key={i}
                onClick={() => setCausalChainEvent(item.eventId, item.eventTitle)}
                className="flex items-center gap-1.5 cursor-pointer transition-all rounded-sm"
                style={{
                  fontFamily: MONO, fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "5px 10px",
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.22)",
                  color: "#a89c84",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(212,175,55,0.14)";
                  e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)";
                  e.currentTarget.style.color = "#f0e6d2";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(212,175,55,0.06)";
                  e.currentTarget.style.borderColor = "rgba(212,175,55,0.22)";
                  e.currentTarget.style.color = "#a89c84";
                }}
              >
                {item.name}
                <span style={{ color: BRASS, fontSize: "10px" }}>↗</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Connected channels ── */}
        <div>
          <SectionLabel>Connected Channels</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {localOutlets.slice(0, 6).map((outlet, i) => (
              <div
                key={i}
                className="flex flex-col justify-center p-2.5 rounded-sm"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${HAIRLINE}`,
                  minHeight: "44px",
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, color: BRASS, letterSpacing: "0.04em" }}>
                  {outlet.name}
                </span>
                <span style={{ fontSize: "9px", color: "#5c5546", fontFamily: MONO, marginTop: "2px", lineHeight: 1.3 }}>
                  {outlet.focus}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Local news feed ── */}
        <div>
          <SectionLabel>Local News Feed</SectionLabel>
          <div className="flex flex-col gap-2">
            {localHeadlines.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-sm flex flex-col gap-1 transition-all"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${HAIRLINE}`,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = HAIRLINE}
              >
                <span style={{ fontSize: "12px", color: "#c9bea3", lineHeight: "1.5", fontWeight: 500 }}>
                  {item.title}
                </span>
                <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-end" }}>
                  {item.source}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: HAIRLINE }} />

        {/* ── Pin geopolitical note ── */}
        <div>
          <SectionLabel>Pin Geopolitical Note</SectionLabel>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-sm px-3 py-2 transition-all"
              style={{
                fontFamily: MONO, fontSize: "11px",
                color: "#f0e6d2",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${HAIRLINE}`,
                outline: "none",
              }}
              placeholder="Add a collaborative note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handlePinNote(); }}
              onFocus={e => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; e.target.style.boxShadow = "0 0 0 2px rgba(212,175,55,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = HAIRLINE; e.target.style.boxShadow = "none"; }}
            />
            <button
              onClick={handlePinNote}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm cursor-pointer transition-all shrink-0"
              style={{
                fontFamily: MONO, fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.35)",
                color: BRASS,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = BRASS; e.currentTarget.style.color = "#05070d"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.12)"; e.currentTarget.style.color = BRASS; }}
            >
              <Pin className="w-3 h-3" />
              PIN
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CountryRightPanel;
