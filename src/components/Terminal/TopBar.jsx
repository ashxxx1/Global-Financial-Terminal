import { useState, useEffect } from "react";
import { Activity, Bell, Terminal, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function TopBar({ currentView, onSetView }) {
  const { userProfileData, logout } = useAuth();
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [marketSession, setMarketSession] = useState("CLOSED");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour12: false }));
      setDateStr(
        d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }).toUpperCase()
      );
      // Determine market session by UTC hour
      const utcH = d.getUTCHours();
      if (utcH >= 13 && utcH < 21) setMarketSession("US OPEN");
      else if (utcH >= 8 && utcH < 16) setMarketSession("EU OPEN");
      else if (utcH >= 0 && utcH < 9) setMarketSession("ASIA OPEN");
      else setMarketSession("OFF-HOURS");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = (e) => {
    if (e.key === "Enter") {
      const val = e.target.value.trim().toUpperCase();
      if (val) {
        window.dispatchEvent(new CustomEvent("search-ticker", { detail: val }));
        e.target.value = "";
      }
    }
  };

  const topTicks = [
    { name: "BTC",  value: "$67,234", change: "+2.4%", isPositive: true  },
    { name: "GOLD", value: "$2,387",  change: "+0.8%", isPositive: true  },
    { name: "VIX",  value: "14.32",   change: "-3.2%", isPositive: false },
  ];

  const sessionColor =
    marketSession === "US OPEN" ? "#4fd1a5"
    : marketSession === "EU OPEN" ? "#d4af37"
    : marketSession === "ASIA OPEN" ? "#c97b4a"
    : "#6b6354";

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 text-sm font-medium z-50 shrink-0"
      style={{
        background: "linear-gradient(180deg, #0a0e1a 0%, #05070d 100%)",
        borderColor: "rgba(212,175,55,0.2)",
        boxShadow: "0 1px 0 rgba(212,175,55,0.06), 0 4px 24px rgba(0,0,0,0.6)",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Brass icon glyph */}
          <div
            className="rounded-[3px] p-1.5 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #f0c84a 0%, #8a7228 100%)",
              boxShadow: "0 0 14px rgba(212,175,55,0.3), 0 0 4px rgba(212,175,55,0.15)",
            }}
          >
            <Activity className="h-4 w-4" style={{ color: "#05070d", strokeWidth: 2.5 }} />
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "15px",
                  letterSpacing: "0.02em",
                  color: "#f0e6d2",
                  fontWeight: 500,
                }}
              >
                GlobalFin
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: "#a89c84",
                }}
              >
                TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span
                className="px-1.5 py-[1px] rounded-sm border"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#d4af37",
                  borderColor: "rgba(212,175,55,0.35)",
                  background: "rgba(212,175,55,0.08)",
                }}
              >
                v0.6.0
              </span>
              <span
                className="flex items-center gap-1 px-1.5 py-[1px] rounded-sm"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "7px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: sessionColor,
                  background: `${sessionColor}14`,
                }}
              >
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: sessionColor, boxShadow: `0 0 4px ${sessionColor}` }} />
                {marketSession}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Command / Ticker search input ── */}
      <div className="flex-1 flex max-w-xl px-6 mx-auto">
        <div className="relative w-full flex items-center">
          <span
            className="absolute left-3 font-bold select-none"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#d4af37" }}
          >
            &gt;_
          </span>
          <input
            type="text"
            onKeyDown={handleCommandSubmit}
            placeholder="ENTER TICKER · REGION · EVENT…"
            className="w-full py-1.5 pl-10 pr-10 transition-all"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#f0e6d2",
              background: "#05070d",
              border: "1px solid rgba(212,175,55,0.18)",
              borderRadius: "2px",
              outline: "none",
            }}
            onFocus={e => {
              e.target.style.borderColor = "rgba(212,175,55,0.7)";
              e.target.style.boxShadow = "0 0 0 2px rgba(212,175,55,0.12), 0 0 16px rgba(212,175,55,0.08)";
              e.target.style.background = "#0a0e1a";
            }}
            onBlur={e => {
              e.target.style.borderColor = "rgba(212,175,55,0.18)";
              e.target.style.boxShadow = "none";
              e.target.style.background = "#05070d";
            }}
          />
          <Terminal className="absolute right-3 h-3.5 w-3.5" style={{ color: "#5c5546" }} />
        </div>
      </div>

      {/* ── Right cluster ── */}
      <div className="flex items-center gap-4 ml-auto shrink-0">

        {/* Mini ticks — BTC, GOLD, VIX */}
        <div
          className="hidden xl:flex items-center gap-4 rounded-sm px-3 py-1.5"
          style={{
            background: "#05070d",
            border: "1px solid rgba(212,175,55,0.14)",
          }}
        >
          {topTicks.map((tick) => (
            <div
              key={tick.name}
              className="flex items-center gap-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}
            >
              <span style={{ color: "#a89c84", fontWeight: 700 }}>{tick.name}</span>
              <span style={{ color: "#f0e6d2", fontWeight: 700 }}>{tick.value}</span>
              <span style={{ color: tick.isPositive ? "#4fd1a5" : "#e8635a", fontWeight: 700 }}>
                {tick.change}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-8 w-px" style={{ background: "rgba(212,175,55,0.14)" }} />

        {/* Time display */}
        <div className="hidden sm:flex flex-col text-right leading-tight">
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              color: "#4fd1a5",
              letterSpacing: "0.08em",
            }}
          >
            {timeStr}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px",
              color: "#6b6354",
              letterSpacing: "0.06em",
            }}
          >
            {dateStr} UTC
          </span>
        </div>

        {/* Bell / Social */}
        <button
          onClick={() => onSetView("social")}
          className="relative flex items-center justify-center transition-all p-1.5 rounded-sm"
          style={{
            background: currentView === "social" ? "rgba(212,175,55,0.12)" : "#05070d",
            border: currentView === "social" ? "1px solid #d4af37" : "1px solid rgba(212,175,55,0.2)",
            color: currentView === "social" ? "#d4af37" : "#a89c84",
          }}
          aria-label="Alerts & Social"
          onMouseEnter={e => { if (currentView !== "social") { e.currentTarget.style.color = "#f0e6d2"; } }}
          onMouseLeave={e => { if (currentView !== "social") { e.currentTarget.style.color = "#a89c84"; } }}
        >
          <Bell className="h-3.5 w-3.5" />
          <span
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "#e8635a", boxShadow: "0 0 6px #e8635a", outline: "2px solid #0a0e1a" }}
          />
        </button>

        {/* User avatar + name + logout */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              border: "1px solid rgba(212,175,55,0.35)",
              background: "#0f1525",
              boxShadow: "0 0 8px rgba(212,175,55,0.12)",
            }}
          >
            {userProfileData?.photoURL ? (
              <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#d4af37",
                }}
              >
                {(userProfileData?.displayName || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden md:flex flex-col leading-none text-left">
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                fontWeight: 700,
                color: "rgba(240,230,210,0.8)",
                maxWidth: "80px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userProfileData?.displayName || "Trader"}
            </span>
            {userProfileData?.idNum && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  color: "#d4af37",
                  marginTop: "2px",
                }}
              >
                #{userProfileData.idNum}
              </span>
            )}
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-sm transition-all cursor-pointer"
            style={{ color: "#6b6354" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#e8635a"; e.currentTarget.style.background = "rgba(232,99,90,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6b6354"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
