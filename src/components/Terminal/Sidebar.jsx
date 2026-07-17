import { useState, useMemo } from "react";
import { RefreshCcw, Radar, Gauge, Droplets, LineChart, BookOpen } from "lucide-react";
import { indicesData } from "./data";
import useTerminalStore from "../../store/terminalStore";

export function Sidebar() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { watchlist } = useTerminalStore();

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  // Auto-generated morning briefing with clickable citations
  const briefText = useMemo(() => {
    if (!watchlist || watchlist.length === 0) {
      return "S&P 500 index margins expand on tech capital injection `[S&P 500]`. High-yield sovereign spreads indicate stabilizing credit conditions across European banking nodes `[DAX 40]`. Yield dynamics signal delayed Fed policy adjustments `[NASDAQ]`.";
    }
    const names = watchlist.slice(0, 3).map(s => s.symbol || s.name);
    return `Watchlist highlights: ${names.join(", ")} show sticky pricing parameters. Momentum support remains resilient for holdings \`[${names[0]}]\`. Risk exposures are elevated across regional channels \`[${names[1] || "Markets"}]\`.`;
  }, [watchlist]);

  const riskMetrics = [
    { label: "Geopolitical", val: "84/100", color: "#e8635a" },
    { label: "Systemic",     val: "62/100", color: "#f5b13d" },
    { label: "Credit",       val: "38/100", color: "#46d38a" },
    { label: "Volatility",   val: "55/100", color: "#f5b13d" },
  ];

  const liquidityItems = [
    { label: "USD ONR (O/N Repo)", val: "5.32%", pct: 85, color: "#46d38a" },
    { label: "EUR SOFR",           val: "3.90%", pct: 60, color: "#f5b13d" },
    { label: "Dark Pool Index",    val: "42.1%", pct: 42, color: "#c97b4a" },
  ];

  const sectionHead = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    color: "#a89c84",
  };

  return (
    <aside className="flex w-full h-full flex-col shrink-0 z-10 transition-all duration-300"
      style={{ background: "transparent" }}
    >
      {/* ── Status bar ── */}
      <div
        className="flex flex-col p-3 shrink-0"
        style={{
          borderBottom: "1px solid rgba(245, 177, 61,0.14)",
          background: "rgba(5,7,13,0.7)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
              style={{ background: "#46d38a", boxShadow: "0 0 8px rgba(70, 211, 138,0.8)" }}
            />
            <span style={{ ...sectionHead, letterSpacing: "0.14em" }}>
              Global Node · Online
            </span>
          </div>
          <button
            onClick={handleSync}
            className="flex items-center gap-1 transition-colors cursor-pointer"
            style={{ ...sectionHead, color: "#f5b13d" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f0c84a"}
            onMouseLeave={e => e.currentTarget.style.color = "#f5b13d"}
          >
            <RefreshCcw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Morning Briefing ── */}
        <div
          className="p-4 relative"
          style={{
            borderBottom: "1px solid rgba(245, 177, 61,0.12)",
            background: "linear-gradient(180deg, rgba(22,49,79,0.15) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <BookOpen className="w-4 h-4" style={{ color: "#c97b4a" }} />
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: "italic",
                fontSize: "13px",
                letterSpacing: "0.02em",
                color: "#f0e6d2",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Morning Briefing
            </h3>
            <span
              className="ml-auto px-1.5 py-px rounded-sm"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7px",
                fontWeight: 700,
                color: "#6b6354",
                background: "#0f1525",
                border: "1px solid rgba(245, 177, 61,0.14)",
                letterSpacing: "0.1em",
              }}
            >
              DAILY DIGEST
            </span>
          </div>

          <div
            className="relative overflow-hidden"
            style={{
              fontSize: "11.5px",
              color: "#c9bea3",
              lineHeight: "1.65",
              background: "#05070d",
              border: "1px solid rgba(245, 177, 61,0.14)",
              borderRadius: "2px",
              padding: "12px 12px 12px 16px",
            }}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: "rgba(245, 177, 61,0.55)" }}
            />
            {(() => {
              const parts = briefText.split(/(`\[.*?\]`)/);
              return (
                <p style={{ margin: 0, lineHeight: "1.65" }}>
                  {parts.map((p, pidx) => {
                    if (p.startsWith("`[") && p.endsWith("]`")) {
                      const label = p.slice(2, -2);
                      return (
                        <span
                          key={pidx}
                          className="inline-block mx-0.5 cursor-pointer transition-all"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "8px",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "1px 5px",
                            borderRadius: "2px",
                            background: "rgba(245, 177, 61,0.12)",
                            border: "1px solid rgba(245, 177, 61,0.35)",
                            color: "#f5b13d",
                            textTransform: "uppercase",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#f5b13d";
                            e.currentTarget.style.color = "#05070d";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(245, 177, 61,0.12)";
                            e.currentTarget.style.color = "#f5b13d";
                          }}
                          onClick={() => alert(`Navigating to citation: ${label}`)}
                        >
                          {label}
                        </span>
                      );
                    }
                    return p;
                  })}
                </p>
              );
            })()}
          </div>
        </div>

        {/* ── Market Overview ── */}
        <div className="p-4" style={{ borderBottom: "1px solid rgba(245, 177, 61,0.10)" }}>
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-4 h-4" style={{ color: "#a89c84" }} />
            <h3 style={sectionHead}>MARKET OVERVIEW</h3>
          </div>
          <div className="flex flex-col gap-0.5">
            {indicesData.slice(0, 6).map((index) => (
              <div
                key={index.name}
                className="group flex cursor-pointer items-center justify-between p-1.5 -mx-1.5 rounded-sm transition-all"
                style={{ background: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245, 177, 61,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span
                  className="px-1.5 transition-colors"
                  style={{ fontSize: "12px", fontWeight: 500, color: "#c9bea3" }}
                >
                  {index.name}
                </span>
                <div className="flex items-center gap-3 px-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ fontSize: "12px", color: "#f0e6d2", fontWeight: 600 }}>
                    {index.value}
                  </span>
                  <span
                    style={{
                      width: "56px",
                      textAlign: "right",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: index.isPositive ? "#46d38a" : "#e8635a",
                    }}
                  >
                    {index.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Risk Radar ── */}
        <div className="p-4" style={{ borderBottom: "1px solid rgba(245, 177, 61,0.10)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4" style={{ color: "#e8635a" }} />
              <h3 style={sectionHead}>RISK RADAR</h3>
            </div>
            <span
              className="font-bold rounded-sm px-2 py-0.5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: "#e8635a",
                background: "rgba(232,99,90,0.1)",
                border: "1px solid rgba(232,99,90,0.25)",
              }}
            >
              ELEVATED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {riskMetrics.map(item => (
              <div
                key={item.label}
                className="flex flex-col gap-1 p-3 rounded-sm"
                style={{
                  background: "#05070d",
                  border: "1px solid rgba(245, 177, 61,0.12)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#6b6354",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sentiment / Fear & Greed ── */}
        <div className="p-4" style={{ borderBottom: "1px solid rgba(245, 177, 61,0.10)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4" style={{ color: "#f5b13d" }} />
            <h3 style={sectionHead}>SENTIMENT</h3>
          </div>
          <div className="flex items-center gap-5">
            {/* Ring gauge */}
            <div
              className="relative shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: "76px",
                height: "76px",
                border: "5px solid rgba(245, 177, 61,0.22)",
              }}
            >
              <div
                className="absolute inset-0 rounded-full rotate-45"
                style={{
                  border: "5px solid #f5b13d",
                  borderTopColor: "transparent",
                  borderRightColor: "transparent",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#f0c84a",
                }}
              >
                41
              </span>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#c9bea3",
                }}
              >
                FEAR
              </span>
              <div className="w-full flex gap-1" style={{ height: "6px" }}>
                <div className="h-full flex-1 rounded-l-sm" style={{ background: "rgba(232,99,90,0.18)" }} />
                <div
                  className="h-full"
                  style={{
                    width: "8px",
                    flexShrink: 0,
                    background: "#f5b13d",
                    boxShadow: "0 0 8px rgba(245, 177, 61,0.7)",
                  }}
                />
                <div className="h-full flex-1 rounded-r-sm" style={{ background: "rgba(70, 211, 138,0.12)" }} />
              </div>
              <div
                className="flex justify-between mt-1"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  letterSpacing: "0.06em",
                  color: "#6b6354",
                }}
              >
                <span>EXTR FEAR</span>
                <span>EXTR GREED</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Liquidity Monitor ── */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4" style={{ color: "#16314f" }} />
            <h3 style={sectionHead}>LIQUIDITY MONITOR</h3>
          </div>
          <div className="flex flex-col gap-3.5">
            {liquidityItems.map(item => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "#a89c84",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.val}
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: "4px", background: "#0f1525" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.pct}%`,
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}60`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}
