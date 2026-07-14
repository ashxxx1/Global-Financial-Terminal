/**
 * MeridianLayout.jsx — premium MERIDIAN terminal wrapper with HUD chrome,
 * orbit lens selector, breaking ticker, global wire, and command palette.
 *
 * This is the new primary layout. Wraps GlobeVis and provides:
 * - HUD corner brackets (idle-fade)
 * - Wordmark + clock (idle-fade)
 * - Breaking ticker (idle-fade)
 * - Orbit lens selector (MARKETS, FX, MACRO, RISK, NEWS)
 * - Global Wire expandable pill
 * - Command palette dock
 */
import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import MeridianPanel from "./MeridianPanel";
import { intelApi } from "../../services/intelApi";

const HUD_CYAN = "#3ec6ff";
const GREEN_UP = "#39d6a3";
const RED_DOWN = "#ff5b68";
const NEUTRAL = "#8793a5";
const DARK_BG = "#050608";
const GLASS_BG = "rgba(9,11,16,0.86)";
const BORDER_SUBTLE = "rgba(255,255,255,0.08)";

/**
 * HUD Corner Brackets — idle-fade with chrome
 */
function HUDCorners({ chromeOpacity }) {
  const cornerStyle = {
    position: "absolute",
    width: "30px",
    height: "30px",
    borderColor: HUD_CYAN,
    zIndex: 50,
    opacity: chromeOpacity,
    transition: "opacity 0.7s ease",
    pointerEvents: "none",
  };
  return (
    <>
      <div style={{ ...cornerStyle, top: "18px", left: "18px", borderTop: "2px solid", borderLeft: "2px solid" }} />
      <div style={{ ...cornerStyle, top: "18px", right: "18px", borderTop: "2px solid", borderRight: "2px solid" }} />
      <div style={{ ...cornerStyle, bottom: "18px", left: "18px", borderBottom: "2px solid", borderLeft: "2px solid" }} />
      <div style={{ ...cornerStyle, bottom: "18px", right: "18px", borderBottom: "2px solid", borderRight: "2px solid" }} />
    </>
  );
}

/**
 * Wordmark + Clock
 */
function HeaderChrome({ chromeOpacity, clockStr }) {
  return (
    <>
      <div style={{ position: "absolute", top: "32px", left: "56px", zIndex: 50, opacity: chromeOpacity, transition: "opacity 0.7s ease", pointerEvents: "none" }}>
        <div style={{ color: "#f2f4f8", fontWeight: 800, fontSize: "15px", letterSpacing: "0.28em" }}>MERIDIAN</div>
        <div style={{ color: "#5b6472", fontSize: "10px", letterSpacing: "0.14em", marginTop: "2px" }}>GLOBAL INTELLIGENCE TERMINAL</div>
      </div>
      <div style={{ position: "absolute", top: "34px", right: "56px", zIndex: 50, opacity: chromeOpacity, transition: "opacity 0.7s ease", textAlign: "right", pointerEvents: "none" }}>
        <div style={{ color: "#8a93a3", fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px" }}>{clockStr} UTC</div>
        <div style={{ color: GREEN_UP, fontSize: "10.5px", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "3px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: GREEN_UP, animation: "blinkDot 1.4s infinite" }} />
          LIVE
        </div>
      </div>
    </>
  );
}

/**
 * Breaking Ticker — marquee animation
 */
function BreakingTicker({ chromeOpacity, tickerItems }) {
  return (
    <div style={{ position: "absolute", top: "76px", left: "56px", right: "56px", height: "24px", overflow: "hidden", zIndex: 50, opacity: chromeOpacity, transition: "opacity 0.7s ease", pointerEvents: "none" }}>
      <div style={{ position: "absolute", display: "flex", gap: "38px", whiteSpace: "nowrap", animation: "marquee 46s linear infinite", alignItems: "center", height: "100%", fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace" }}>
        {tickerItems.map((ti, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: ti.color, fontWeight: 700, fontSize: "9.5px", letterSpacing: "0.08em" }}>{ti.glyph} {ti.label}</span>
            <span style={{ color: "#7a828f" }}>{ti.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Orbit Lens Selector — 5 rotating lenses around the globe center
 */
function OrbitLensSelector({ chromeOpacity, lenses, selectedLens, onLensChange }) {
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", width: "780px", height: "780px", margin: "-390px 0 0 -390px", zIndex: 30, pointerEvents: "none", animation: "orbitSpin 100s linear infinite" }}>
      {lenses.map((lens, i) => (
        <div
          key={lens.id}
          onClick={() => onLensChange(lens.id)}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "58px",
            height: "58px",
            margin: "-29px 0 0 -29px",
            transform: `rotate(${lens.angleDeg}deg) translate(390px) rotate(${lens.counterDeg}deg)`,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              cursor: "pointer",
              background: lens.bg,
              border: `1px solid ${lens.border}`,
              backdropFilter: "blur(10px)",
              transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
              opacity: chromeOpacity,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.12)";
              e.currentTarget.style.borderColor = HUD_CYAN;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = lens.border;
            }}
          >
            <div style={{ fontSize: "14px", color: lens.iconColor }}>{lens.glyph}</div>
            <div style={{ fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.07em", color: lens.textColor }}>{lens.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Global Wire Widget — expandable headlines pill
 */
function GlobalWireWidget({ chromeOpacity, wireOpen, onToggleWire, headlines }) {
  return (
    <div style={{ position: "absolute", bottom: "38px", right: "44px", zIndex: 50, opacity: chromeOpacity, transition: "opacity 0.7s ease" }}>
      {wireOpen && (
        <div style={{ width: "300px", maxHeight: "220px", overflowY: "auto", background: "rgba(9,11,16,0.94)", backdropFilter: "blur(16px)", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "10px", marginBottom: "8px", boxShadow: "0 20px 50px rgba(0,0,0,0.55)" }}>
          <div style={{ padding: "6px 14px 10px" }}>
            {headlines.map((h, i) => (
              <div key={i} style={{ padding: "7px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER_SUBTLE}`, color: "#a7afbd", fontSize: "11.5px", lineHeight: 1.5 }}>
                {h}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={onToggleWire}
        style={{
          background: "rgba(9,11,16,0.9)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${BORDER_SUBTLE}`,
          color: "#e8ecf3",
          fontWeight: 700,
          fontSize: "11.5px",
          letterSpacing: "0.06em",
          padding: "9px 16px",
          borderRadius: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "border-color 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = HUD_CYAN)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER_SUBTLE)}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: GREEN_UP, animation: "blinkDot 1.6s infinite" }} />
        GLOBAL WIRE {wireOpen ? "▾" : "▸"}
      </button>
    </div>
  );
}

/**
 * Command Palette — search dock
 */
function CommandPalette({ chromeOpacity, commandOpen, onToggleCommand, countries = [], onCountrySelect = () => {} }) {
  const [searchText, setSearchText] = useState("");
  const results = countries.filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase())).slice(0, 6);

  const handleSelect = (country) => {
    onCountrySelect(country);
    setSearchText("");
  };

  return (
    <div style={{ position: "absolute", bottom: "38px", left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", opacity: chromeOpacity, transition: "opacity 0.7s ease" }}>
      {commandOpen && (
        <div style={{ width: "440px", maxHeight: "280px", overflowY: "auto", background: "rgba(9,11,16,0.95)", backdropFilter: "blur(20px)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: "16px", marginBottom: "10px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", animation: "fadeUp 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ padding: "8px" }}>
            {results.map((c, i) => (
              <div key={i} onClick={() => handleSelect(c)} style={{ padding: "10px 12px", borderRadius: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#e8ecf3", fontSize: "13px", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(62,198,255,0.14)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span>{c.name}</span>
                <span style={{ color: "#5b6472", fontSize: "10.5px", fontFamily: "'JetBrains Mono', monospace" }}>{c.region}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={onToggleCommand}
        style={{
          width: commandOpen ? "440px" : "400px",
          background: "rgba(9,11,16,0.9)",
          backdropFilter: "blur(14px)",
          border: `1px solid rgba(255,255,255,0.12)`,
          borderRadius: "26px",
          padding: "13px 22px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          transition: "width 0.3s ease, border-color 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = HUD_CYAN)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
      >
        <span style={{ color: HUD_CYAN, fontSize: "14px" }}>◎</span>
        <input
          type="text"
          placeholder="Search any country, index, or headline…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#8a93a3",
            fontSize: "12.5px",
            outline: "none",
            fontFamily: "inherit",
            caretColor: HUD_CYAN,
          }}
        />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", color: "#5b6472", border: `1px solid rgba(255,255,255,0.14)`, borderRadius: "4px", padding: "2px 6px" }}>⌘K</span>
      </button>
    </div>
  );
}

/**
 * Hover Tooltip
 */
function HoverTooltip({ hovered, hoverX, hoverY, changeColor, changeStr }) {
  if (!hovered) return null;
  return (
    <div style={{ position: "absolute", left: `${hoverX}px`, top: `${hoverY}px`, transform: "translate(16px,-50%)", background: "rgba(13,17,26,0.97)", border: `1px solid #323d4d`, borderRadius: "8px", padding: "10px 14px", pointerEvents: "none", zIndex: 60, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", animation: "fadeUp 0.15s ease" }}>
      <div style={{ color: "#f2f4f8", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap" }}>{hovered.name}</div>
      <div style={{ color: changeColor, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 600 }}>{changeStr}</div>
    </div>
  );
}

/**
 * Main MeridianLayout
 */
export default function MeridianLayout({ children, selectedCountry = null, onCountrySelect = () => {}, countries = [] }) {
  const [chromeOpacity, setChromeOpacity] = useState(1);
  const [wireOpen, setWireOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState("markets");
  const [clockStr, setClockStr] = useState("00:00:00");
  const [hovered, setHovered] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [hoverY, setHoverY] = useState(0);
  const [panelCountry, setPanelCountry] = useState(selectedCountry);
  const [headlines, setHeadlines] = useState([
    "Oil prices surge on OPEC+ output cut announcement",
    "Central bank signals potential rate cut amid cooling inflation",
    "Chipmakers rally on record AI semiconductor demand",
    "Banking stocks under pressure on credit concerns",
  ]);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    setPanelCountry(selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    intelApi.recent().then((data) => {
      if (data?.events) {
        const headlineTexts = data.events
          .slice(0, 4)
          .map((e) => e.title || `${e.country}: ${e.sector} news`)
          .filter(Boolean);
        if (headlineTexts.length > 0) {
          setHeadlines(headlineTexts);
        }
      }
    });
    const interval = setInterval(() => {
      intelApi.recent().then((data) => {
        if (data?.events) {
          const headlineTexts = data.events
            .slice(0, 4)
            .map((e) => e.title || `${e.country}: ${e.sector} news`)
            .filter(Boolean);
          if (headlineTexts.length > 0) {
            setHeadlines(headlineTexts);
          }
        }
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setClockStr(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStageMove = () => {
    setChromeOpacity(1);
    clearTimeout(idleTimerRef.current);
    if (!selectedCountry && !commandOpen) {
      idleTimerRef.current = setTimeout(() => setChromeOpacity(0.2), 3200);
    }
  };

  const LENSES = [
    { id: "markets", glyph: "◆", label: "MARKETS" },
    { id: "fx", glyph: "⇄", label: "FX" },
    { id: "macro", glyph: "▤", label: "MACRO" },
    { id: "risk", glyph: "△", label: "RISK" },
    { id: "news", glyph: "◈", label: "NEWS" },
  ];

  const lensesMapped = LENSES.map((l, i) => {
    const angleDeg = (360 / LENSES.length) * i;
    const active = selectedLens === l.id;
    return {
      ...l,
      angleDeg,
      counterDeg: -angleDeg,
      bg: active ? "rgba(62,198,255,0.18)" : "rgba(10,13,19,0.65)",
      border: active ? HUD_CYAN : "rgba(255,255,255,0.12)",
      iconColor: active ? "#eaf6ff" : "#8a93a3",
      textColor: active ? "#eaf6ff" : "#5b6472",
    };
  });

  const tickerItems = [
    { glyph: "◎", label: "MARKETS", color: GREEN_UP, text: "S&P +0.42% | Nifty -0.3% | Nikkei -1.87%" },
    { glyph: "⚡", label: "MACRO", color: "#e5aa52", text: "USD +0.15% | Inflation +2.9% | Rate 5.20%" },
    { glyph: "△", label: "RISK", color: RED_DOWN, text: "Volatility elevated across markets" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
        overflow: "hidden",
        pointerEvents: "auto",
        cursor: "grab",
      }}
      onMouseMove={handleStageMove}
    >
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes orbitSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Globe canvas container — behind all HUD */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "auto", zIndex: 1 }}>{children}</div>

      {/* HUD chrome */}
      <HUDCorners chromeOpacity={chromeOpacity} />
      <HeaderChrome chromeOpacity={chromeOpacity} clockStr={clockStr} />
      <BreakingTicker chromeOpacity={chromeOpacity} tickerItems={tickerItems} />

      {/* Orbit lens selector */}
      <OrbitLensSelector chromeOpacity={chromeOpacity} lenses={lensesMapped} selectedLens={selectedLens} onLensChange={setSelectedLens} />

      {/* Hover tooltip */}
      <HoverTooltip hovered={hovered} hoverX={hoverX} hoverY={hoverY} changeColor={hovered ? (Math.random() > 0.5 ? GREEN_UP : RED_DOWN) : "#8793a5"} changeStr={hovered ? (Math.random() > 0.5 ? "+2.34%" : "-1.12%") : ""} />

      {/* Global Wire widget */}
      <GlobalWireWidget chromeOpacity={chromeOpacity} wireOpen={wireOpen} onToggleWire={() => setWireOpen(!wireOpen)} headlines={headlines} />

      {/* Command palette */}
      <CommandPalette chromeOpacity={chromeOpacity} commandOpen={commandOpen} onToggleCommand={() => setCommandOpen(!commandOpen)} countries={countries} onCountrySelect={(c) => { setPanelCountry(c); onCountrySelect(c); }} />

      {/* Meridian Panel */}
      {panelCountry && <MeridianPanel country={panelCountry} lens={selectedLens} onClose={() => setPanelCountry(null)} onLensChange={setSelectedLens} />}
    </div>
  );
}
