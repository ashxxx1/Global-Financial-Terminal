import { useState } from "react";
import {
  Sparkles, ChevronDown, ChevronUp, RefreshCw,
  TrendingUp, TrendingDown, Minus, X,
} from "lucide-react";

const BRIEF_ITEMS = [
  { region: "N. America", flag: "🇺🇸", move: "+0.9%", direction: "up",
    summary: "S&P 500 extends gains after softer-than-expected jobs data reduces near-term rate hike probability.",
    drivers: ["Jobs miss", "Fed pause"] },
  { region: "Europe", flag: "🇪🇺", move: "-0.3%", direction: "down",
    summary: "European equities retreated after ECB officials signalled rates may remain restrictive through Q1 2025.",
    drivers: ["ECB hawkish", "German PMI"] },
  { region: "Asia Pac", flag: "🌏", move: "+0.5%", direction: "up",
    summary: "Nikkei and KOSPI gained on AI memory chip demand surge and continued yen weakness.",
    drivers: ["AI memory", "JPY weak"] },
  { region: "Oil", flag: "🛢️", move: "+2.1%", direction: "up",
    summary: "Crude rose on supply disruption concerns following Red Sea shipping lane activity.",
    drivers: ["Red Sea", "OPEC+"] },
  { region: "Dollar", flag: "💱", move: "-0.4%", direction: "down",
    summary: "DXY softened as September rate cut probability rose to 68% on labour market data.",
    drivers: ["Cut pricing", "Risk-on"] },
  { region: "Credit", flag: "📊", move: "flat", direction: "neutral",
    summary: "IG spreads unchanged. High yield tightened 8bps on improved risk appetite.",
    drivers: ["HY flows", "Risk on"] },
];

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const dirColor = (d) =>
  d === "up" ? "var(--nx-mint)" : d === "down" ? "var(--nx-rose)" : "rgba(255,255,255,0.4)";

export function MarketBrief() {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setRefreshKey(k => k + 1); }, 900);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all"
        style={{
          background: "rgba(2,5,12,0.9)",
          border: "1px solid var(--nx-border-strong)",
          borderRadius: "2px",
          fontFamily: "var(--nx-font-mono)",
        }}
      >
        <Sparkles size={12} style={{ color: "var(--nx-violet)" }} />
        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", color: "var(--nx-cyan)" }}>
          SIGNAL BRIEF
        </span>
        <ChevronDown size={10} style={{ color: "rgba(255,255,255,0.35)" }} />
      </button>
    );
  }

  return (
    <div key={refreshKey} className="nx-brief" style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <div className="nx-brief__header">
        <div className="flex items-center gap-2">
          <Sparkles size={12} style={{ color: "var(--nx-violet)" }} />
          <span className="nx-brief__title">Signal Brief</span>
          <span className="nx-brief__ai-badge">AI SYNTH</span>
          <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>
            {TODAY}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={refresh} className="p-1 cursor-pointer transition-colors hover:text-[var(--nx-cyan)]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <RefreshCw size={10} className={spinning ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 cursor-pointer" style={{ color: "rgba(255,255,255,0.35)" }}>
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 cursor-pointer hover:text-[var(--nx-rose)]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <X size={10} />
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--nx-border)" }}>
        <p style={{ fontFamily: "var(--nx-font-mono)", fontSize: "10px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
          <span style={{ color: "var(--nx-gold)", fontWeight: 700 }}>60s · </span>
          US up on cooling jobs. Europe lower post-ECB. Oil +2% Red Sea. Dollar softens.
        </p>
      </div>

      <div className="px-3 py-2 flex flex-wrap gap-1.5">
        {BRIEF_ITEMS.map((item) => (
          <div
            key={item.region}
            className="flex items-center gap-1 px-2 py-1"
            style={{
              background: "rgba(0,229,255,0.04)",
              border: "1px solid var(--nx-border)",
              borderRadius: "2px",
            }}
          >
            <span style={{ fontSize: "9px" }}>{item.flag}</span>
            <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
              {item.region.toUpperCase()}
            </span>
            <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "9px", fontWeight: 700, color: dirColor(item.direction) }}>
              {item.direction === "up" && "▲"}
              {item.direction === "down" && "▼"}
              {item.direction === "neutral" && "–"} {item.move}
            </span>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 pt-2" style={{ borderTop: "1px solid var(--nx-border)" }}>
          {BRIEF_ITEMS.map((item) => (
            <div
              key={item.region}
              className="p-2.5"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--nx-border)", borderRadius: "2px" }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: "11px" }}>{item.flag}</span>
                  <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
                    {item.region.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "10px", fontWeight: 700, color: dirColor(item.direction) }}>
                  {item.direction === "up" ? <TrendingUp size={9} className="inline" /> :
                   item.direction === "down" ? <TrendingDown size={9} className="inline" /> :
                   <Minus size={9} className="inline" />} {item.move}
                </span>
              </div>
              <p style={{ fontFamily: "var(--nx-font-mono)", fontSize: "9px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: "6px" }}>
                {item.summary}
              </p>
              <div className="flex gap-1">
                {item.drivers.map((d) => (
                  <span
                    key={d}
                    style={{
                      fontFamily: "var(--nx-font-mono)",
                      fontSize: "7px",
                      padding: "2px 6px",
                      border: "1px solid var(--nx-border)",
                      borderRadius: "2px",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p style={{ fontFamily: "var(--nx-font-mono)", fontSize: "7px", color: "rgba(255,255,255,0.25)", paddingTop: "4px", borderTop: "1px solid var(--nx-border)" }}>
            ✦ AI-generated simulation. Not sourced from any publisher. Not financial advice.
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
