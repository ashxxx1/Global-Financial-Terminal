import { useState, useEffect } from "react";
import { Bell, LogOut, Radio, Terminal } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function TopBar({ currentView, onSetView }) {
  const { userProfileData, logout } = useAuth();
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour12: false }));
      setDateStr(
        d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }).toUpperCase()
      );
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
    { name: "BTC", value: "$67,234", change: "+2.4%", up: true },
    { name: "GOLD", value: "$2,387", change: "+0.8%", up: true },
    { name: "VIX", value: "14.32", change: "-3.2%", up: false },
  ];

  return (
    <header className="nx-header">
      <div className="nx-logo">
        <div className="nx-logo__glyph">
          <div className="nx-logo__hex" />
          <Radio className="nx-logo__core h-4 w-4" strokeWidth={2.5} />
        </div>
        <div>
          <div className="nx-logo__text">
            SIGNAL<em>NEXUS</em>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="nx-logo__tag">GFT · v0.6</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 shrink-0">
        {topTicks.map((tick) => (
          <div
            key={tick.name}
            className="flex items-center gap-1.5 px-2 py-1 border border-[rgba(0,229,255,0.08)] rounded-sm bg-black/30"
            style={{ fontFamily: "var(--nx-font-mono)", fontSize: "9px" }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)" }}>{tick.name}</span>
            <span style={{ color: "#e8edf5", fontWeight: 600 }}>{tick.value}</span>
            <span style={{ color: tick.up ? "var(--nx-mint)" : "var(--nx-rose)", fontWeight: 700 }}>
              {tick.change}
            </span>
          </div>
        ))}
      </div>

      <div className="nx-cmd">
        <span className="nx-cmd__prompt">&gt;</span>
        <input
          type="text"
          onKeyDown={handleCommandSubmit}
          placeholder="QUERY TICKER · REGION · EVENT..."
          className="nx-cmd__input"
        />
        <Terminal className="nx-cmd__icon h-3.5 w-3.5" />
      </div>

      <div className="flex items-center gap-4 ml-auto shrink-0">
        <div className="nx-session hidden md:flex">
          <div className="nx-session__ring">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle className="nx-session__ring-bg" cx="14" cy="14" r="10" />
              <circle className="nx-session__ring-fill" cx="14" cy="14" r="10" />
            </svg>
          </div>
          <div>
            <div className="nx-session__label">Session</div>
            <div className="nx-session__value">US OPEN</div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col text-right leading-tight" style={{ fontFamily: "var(--nx-font-mono)" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--nx-cyan)", letterSpacing: "0.08em" }}>
            {timeStr}
          </span>
          <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
            {dateStr} UTC
          </span>
        </div>

        <button
          onClick={() => onSetView("social")}
          className="relative p-2 border transition-all cursor-pointer"
          style={{
            borderColor: currentView === "social" ? "var(--nx-cyan)" : "var(--nx-border)",
            background: currentView === "social" ? "rgba(0,229,255,0.08)" : "rgba(0,0,0,0.3)",
            color: currentView === "social" ? "var(--nx-cyan)" : "rgba(255,255,255,0.45)",
            borderRadius: "2px",
          }}
          aria-label="Alerts & Social"
        >
          <Bell className="h-3.5 w-3.5" />
          <span
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "var(--nx-rose)", boxShadow: "0 0 6px var(--nx-rose)" }}
          />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: "var(--nx-border)" }}>
          <div
            className="w-7 h-7 rounded-sm overflow-hidden flex items-center justify-center"
            style={{ border: "1px solid var(--nx-border-strong)", background: "rgba(0,229,255,0.05)" }}
          >
            {userProfileData?.photoURL ? (
              <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "9px", color: "var(--nx-cyan)" }}>
                {(userProfileData?.displayName || "OP")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden md:flex flex-col leading-none text-left" style={{ fontFamily: "var(--nx-font-mono)" }}>
            <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              {userProfileData?.displayName || "Operator"}
            </span>
            {userProfileData?.idNum && (
              <span style={{ fontSize: "8px", color: "var(--nx-gold)", marginTop: "2px" }}>
                #{userProfileData.idNum}
              </span>
            )}
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 transition-colors cursor-pointer hover:text-[var(--nx-rose)]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
