import { useState, useMemo, useEffect } from "react";
import { Sliders, X, AlertCircle, ChevronRight } from "lucide-react";
import useTerminalStore from "../../store/terminalStore";
import { getCountrySignalMetrics, getCountryData } from "../../lib/quantFeed";
import { compositeZ, DEFAULT_WEIGHTS } from "../../lib/quantEngine";

// ── Helpers ─────────────────────────────────────────────────
function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, r, start, end) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? "0" : "1";
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

const FACTOR_LABELS = {
  macro: "Macro",
  momentum: "Momentum",
  valuation: "Valuation",
  sentiment: "Sentiment",
  volatility: "Volatility",
};

export function SignalDesk({ country }) {
  if (!country) return null;
  return <SignalDeskInner country={country} />;
}

function SignalDeskInner({ country }) {
  const { whatIfScenario, setWhatIfScenario, clearWhatIfScenario, setSelectedCountry } =
    useTerminalStore();
  const [simOpen, setSimOpen] = useState(false);

  const iso  = country.properties?.ISO_A2 || country.code || "XX";
  const name = country.properties?.ADMIN  || country.name  || "Unknown";

  const { baseFactors } = useMemo(() => getCountryData(iso), [iso]);
  const metrics         = useMemo(() => getCountrySignalMetrics(iso, whatIfScenario || {}), [iso, whatIfScenario]);

  // Dev-mode quant validation
  useEffect(() => {
    const af = Object.keys(baseFactors).reduce((acc, k) => {
      acc[k] = whatIfScenario?.[k] !== undefined ? whatIfScenario[k] : baseFactors[k];
      return acc;
    }, {});
    const z = compositeZ(af, DEFAULT_WEIGHTS);
    console.log(`[QuantEngine] ${iso} | compositeZ: ${z.toFixed(4)}`);
  }, [iso, whatIfScenario, baseFactors]);

  const handleToggle = (k) => {
    const cur = whatIfScenario ? { ...whatIfScenario } : {};
    if (cur[k] !== undefined) {
      delete cur[k];
      Object.keys(cur).length === 0 ? clearWhatIfScenario() : setWhatIfScenario(cur);
    } else {
      cur[k] = parseFloat(baseFactors[k].toFixed(2));
      setWhatIfScenario(cur);
    }
  };

  const handleSlide = (k, v) => {
    setWhatIfScenario({ ...(whatIfScenario || {}), [k]: v });
  };

  // Score arc parameters
  const score     = metrics.score;          // 0-100
  const arcDeg    = (score / 100) * 270;    // 270° sweep
  const scoreColor =
    score >= 60 ? "#4fd1a5" :
    score <= 40 ? "#e8635a" : "#d4af37";

  // Reasoning
  const reasoning = useMemo(() => {
    if (iso === "US") return [
      "Sticky core indices signal high rates will remain anchored `[C.B. RATE]`.",
      "Tech valuations front-loaded in semiconductor dependencies `[Strategic Equities]`.",
    ];
    if (iso === "CN") return [
      "Retail deflation drags on industrial production indexes `[INFLATION]`.",
      "Accommodative central bank actions support base equity valuations `[C.B. RATE]`.",
    ];
    if (iso === "JP") return [
      "Yield curve control changes end the zero-rate policy regime `[C.B. RATE]`.",
      "Currency depreciation tailwinds support export revenues `[FX VALUE]`.",
    ];
    return [
      "Regional trade flow parameters indicate stable supply chain paths `[Flow Trajectory]`.",
      "Equity index valuations trade at a historical discount vs sovereign yields `[Strategic Equities]`.",
    ];
  }, [iso]);

  const getModelColor = (v) =>
    v === "BULLISH" ? "#4fd1a5" : v === "BEARISH" ? "#e8635a" : "#d4af37";

  const factors = [
    { key: "macro",      weight: 0.20, maxTerm: 0.6  },
    { key: "momentum",   weight: 0.25, maxTerm: 0.75 },
    { key: "valuation",  weight: 0.20, maxTerm: 0.6  },
    { key: "sentiment",  weight: 0.15, maxTerm: 0.45 },
    { key: "volatility", weight: -0.10, maxTerm: 0.3 },
  ];

  return (
    <div className="relative flex gap-3 items-start pointer-events-auto select-none">

      {/* ══════════════════════════════════
          MAIN SIGNAL CARD
      ══════════════════════════════════ */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "300px",
          background: "rgba(5,7,13,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(212,175,55,0.35)",
          borderRadius: "4px",
          boxShadow: "0 0 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.12)",
        }}
      >
        {/* Corner accents */}
        {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r",
          "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((cls, i) => (
          <div key={i} className={`absolute w-3 h-3 ${cls}`}
            style={{ borderColor: "rgba(212,175,55,0.5)" }} />
        ))}

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.12)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: "#4fd1a5", boxShadow: "0 0 6px rgba(79,209,165,0.8)" }}
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px", fontWeight: 700,
              letterSpacing: "0.2em", color: "#d4af37",
            }}>
              AI SIGNAL DESK
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSimOpen(!simOpen)}
              title="Scenario Simulator"
              className="flex items-center justify-center w-6 h-6 rounded-sm transition-all cursor-pointer"
              style={{
                background: whatIfScenario ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                border: whatIfScenario ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: whatIfScenario ? "#d4af37" : "#6b6354",
              }}
            >
              <Sliders className="w-3 h-3" />
            </button>
            <button
              onClick={() => setSelectedCountry(null)}
              className="flex items-center justify-center w-6 h-6 rounded-sm transition-all cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6b6354",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#e8635a"; e.currentTarget.style.borderColor = "rgba(232,99,90,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6b6354"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Score Ring + Name ── */}
        <div className="flex items-center gap-4 px-4 py-4" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
          {/* Radial arc ring */}
          <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              {/* Track */}
              <path
                d={arcPath(36, 36, 30, -45, 225)}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d={arcPath(36, 36, 30, -45, -45 + arcDeg)}
                fill="none" stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${scoreColor}80)` }}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "20px", fontWeight: 700,
                color: scoreColor, lineHeight: 1,
              }}>
                {score}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7px", color: "#6b6354", letterSpacing: "0.08em",
              }}>
                /100
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <span style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic", fontSize: "16px",
              fontWeight: 500, color: "#f0e6d2",
              letterSpacing: "0.01em",
            }}>
              {name}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px", fontWeight: 700,
              letterSpacing: "0.16em",
              color: scoreColor,
            }}>
              COMPOSITE BUY SIGNAL
            </span>
            {/* Allocation range */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px", fontWeight: 700,
              color: "#a89c84", marginTop: "2px",
            }}>
              Alloc: {metrics.sizing.low.toFixed(1)}% – {metrics.sizing.high.toFixed(1)}%
            </span>
            {/* Model ensemble dots */}
            <div className="flex items-center gap-2 mt-1">
              {[
                { label: "QNT", val: metrics.ensemble.quant },
                { label: "SNT", val: metrics.ensemble.sentiment },
                { label: "MCR", val: metrics.ensemble.macro },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: getModelColor(m.val) }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7px", fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: getModelColor(m.val),
                  }}>
                    {m.label}
                  </span>
                </div>
              ))}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7px", color: "#5c5546", marginLeft: "2px",
              }}>
                {metrics.ensemble.quant === metrics.ensemble.macro &&
                 metrics.ensemble.macro === metrics.ensemble.sentiment ? "ALIGNED" : "SPLIT"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Factor bars ── */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px", fontWeight: 700,
            letterSpacing: "0.18em", color: "#5c5546",
            display: "block", marginBottom: "4px",
          }}>
            FACTOR SIGNALS
          </span>
          {factors.map(({ key, weight, maxTerm }) => {
            const z    = metrics.factors[key];
            const term = Math.abs(weight * z);
            const pct  = Math.min(100, (term / Math.abs(weight * maxTerm)) * 100);
            const pos  = weight < 0 ? z < 0 : z >= 0;
            const barColor = pos ? "#4fd1a5" : "#e8635a";
            return (
              <div key={key} className="flex items-center gap-2">
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px", fontWeight: 600,
                  color: "#a89c84", width: "62px", flexShrink: 0,
                }}>
                  {FACTOR_LABELS[key]}
                </span>
                <div className="flex-1 relative" style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: barColor,
                      boxShadow: `0 0 4px ${barColor}60`,
                    }}
                  />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px", fontWeight: 700,
                  color: barColor, width: "28px",
                  textAlign: "right", flexShrink: 0,
                }}>
                  {z > 0 ? "+" : ""}{z.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── AI Reasoning trace ── */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px", fontWeight: 700,
            letterSpacing: "0.18em", color: "#5c5546",
            display: "block",
          }}>
            AI REASONING
          </span>
          <div className="flex flex-col gap-1.5">
            {reasoning.map((sentence, i) => {
              const parts = sentence.split(/(`\[.*?\]`)/);
              return (
                <p key={i} style={{
                  fontSize: "11px", color: "#c9bea3",
                  lineHeight: "1.6", margin: 0,
                }}>
                  {parts.map((p, pi) => {
                    if (p.startsWith("`[") && p.endsWith("]`")) {
                      const label = p.slice(2, -2);
                      return (
                        <span
                          key={pi}
                          className="inline-block cursor-pointer transition-all mx-0.5"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "7px", fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "1px 5px", borderRadius: "2px",
                            background: "rgba(212,175,55,0.1)",
                            border: "1px solid rgba(212,175,55,0.3)",
                            color: "#d4af37",
                            textTransform: "uppercase",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#d4af37"; e.currentTarget.style.color = "#05070d"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.1)"; e.currentTarget.style.color = "#d4af37"; }}
                          onClick={() => alert(`Citation: ${label}`)}
                        >
                          {label}
                        </span>
                      );
                    }
                    return p;
                  })}
                </p>
              );
            })}
          </div>
        </div>

        {/* ── Monte Carlo band (minimal) ── */}
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-1.5">
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px", fontWeight: 700,
              letterSpacing: "0.14em", color: "#5c5546",
            }}>
              MONTE CARLO · 500 PATHS
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "#6b6354" }}>
              p5 <strong style={{ color: "#e8635a" }}>{metrics.monteCarlo.p5}</strong>
              {" "}·{" "}
              p50 <strong style={{ color: "#d4af37" }}>{metrics.monteCarlo.p50}</strong>
              {" "}·{" "}
              p95 <strong style={{ color: "#4fd1a5" }}>{metrics.monteCarlo.p95}</strong>
            </span>
          </div>
          <div className="relative w-full overflow-hidden" style={{ height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }}>
            <div
              className="absolute h-full"
              style={{
                left: `${metrics.monteCarlo.p5}%`,
                width: `${metrics.monteCarlo.p95 - metrics.monteCarlo.p5}%`,
                background: "linear-gradient(90deg, rgba(212,175,55,0.05), rgba(212,175,55,0.35), rgba(212,175,55,0.05))",
                borderLeft: "1px solid rgba(212,175,55,0.4)",
                borderRight: "1px solid rgba(212,175,55,0.4)",
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${metrics.monteCarlo.p50}%`,
                background: "#f0e6d2",
                boxShadow: "0 0 4px rgba(240,230,210,0.8)",
              }}
            />
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div
          className="flex items-start gap-1.5 mx-4 mb-3 px-2.5 py-2 rounded-sm"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "#6b6354" }} />
          <span style={{
            fontSize: "8px", color: "#5c5546", lineHeight: "1.5",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Informational only · not financial advice · {metrics.ensemble.confidence}% confidence
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════
          SCENARIO SIMULATOR DRAWER
      ══════════════════════════════════ */}
      {simOpen && (
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            width: "260px",
            background: "rgba(5,7,13,0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "4px",
            boxShadow: "0 0 60px rgba(0,0,0,0.95)",
          }}
        >
          {/* Corner accents — copper */}
          {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r",
            "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((cls, i) => (
            <div key={i} className={`absolute w-3 h-3 ${cls}`}
              style={{ borderColor: "rgba(201,123,74,0.5)" }} />
          ))}

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}
          >
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px", fontWeight: 700,
              letterSpacing: "0.16em", color: "#c97b4a",
            }}>
              SHOCK SIMULATOR
            </span>
            {whatIfScenario && (
              <button
                onClick={clearWhatIfScenario}
                className="cursor-pointer transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px", fontWeight: 700,
                  letterSpacing: "0.1em", color: "#6b6354",
                  padding: "2px 8px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "2px",
                  background: "transparent",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#e8635a"}
                onMouseLeave={e => e.currentTarget.style.color = "#6b6354"}
              >
                RESET
              </button>
            )}
          </div>

          {/* Sliders */}
          <div className="px-4 py-3 flex flex-col gap-4">
            {Object.keys(baseFactors).map(k => {
              const label = FACTOR_LABELS[k] || k;
              const isOn  = whatIfScenario?.[k] !== undefined;
              const val   = isOn ? whatIfScenario[k] : baseFactors[k];
              return (
                <div key={k} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className="w-3.5 h-3.5 rounded-sm flex items-center justify-center cursor-pointer transition-all"
                        style={{
                          background: isOn ? "#d4af37" : "transparent",
                          border: isOn ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.15)",
                        }}
                        onClick={() => handleToggle(k)}
                      >
                        {isOn && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px", fontWeight: isOn ? 700 : 500,
                        color: isOn ? "#d4af37" : "#a89c84",
                        letterSpacing: "0.04em",
                      }}>
                        {label}{isOn ? " ⚡" : ""}
                      </span>
                    </label>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px", fontWeight: 700,
                      color: isOn ? "#d4af37" : "#5c5546",
                    }}>
                      {val > 0 ? "+" : ""}{val.toFixed(1)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range" min="-3.0" max="3.0" step="0.1"
                      value={val}
                      disabled={!isOn}
                      onChange={e => handleSlide(k, parseFloat(e.target.value))}
                      className="w-full cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                      style={{
                        height: "3px",
                        appearance: "none",
                        background: isOn
                          ? `linear-gradient(to right, #d4af37 ${((val + 3) / 6) * 100}%, rgba(255,255,255,0.1) ${((val + 3) / 6) * 100}%)`
                          : "rgba(255,255,255,0.08)",
                        borderRadius: "2px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* MC band in sim */}
          <div className="px-4 pb-4 flex flex-col gap-1.5">
            <div
              className="p-3 rounded-sm"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)" }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "8px", fontWeight: 700,
                letterSpacing: "0.14em", color: "#5c5546", display: "block", marginBottom: "6px",
              }}>
                PROJECTED OUTCOME BAND
              </span>
              <div className="relative w-full overflow-hidden" style={{ height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px" }}>
                <div className="absolute h-full" style={{
                  left: `${metrics.monteCarlo.p5}%`,
                  width: `${metrics.monteCarlo.p95 - metrics.monteCarlo.p5}%`,
                  background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
                  borderLeft: "1px solid rgba(212,175,55,0.5)",
                  borderRight: "1px solid rgba(212,175,55,0.5)",
                }} />
                <div className="absolute top-0 bottom-0 w-px" style={{
                  left: `${metrics.monteCarlo.p50}%`,
                  background: "#f0e6d2",
                }} />
              </div>
              <div className="flex justify-between mt-1.5">
                {[
                  { label: "BEAR", val: metrics.monteCarlo.p5,  color: "#e8635a" },
                  { label: "BASE", val: metrics.monteCarlo.p50, color: "#d4af37" },
                  { label: "BULL", val: metrics.monteCarlo.p95, color: "#4fd1a5" },
                ].map(({ label, val: v, color }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "#5c5546", letterSpacing: "0.1em" }}>{label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, color }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "#3d3830", lineHeight: "1.5" }}>
              Cholesky decomposition · 500 paths · conditional overrides applied
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignalDesk;
