import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUtcClock } from "../lib/hooks";
import { liveSymbolCount } from "../lib/market";
import { useTerminal } from "../store";
import SourceBadge from "./SourceBadge";

const LINKS = [
  { to: "/", label: "WORLD", end: true },
  { to: "/markets", label: "MARKETS" },
  { to: "/news", label: "NEWS" },
];

export default function TopNav() {
  const clock = useUtcClock();
  const navigate = useNavigate();
  const setSearchOpen = useTerminal((s) => s.setSearchOpen);
  const notices = useTerminal((s) => s.notices);
  const [liveN, setLiveN] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setLiveN(liveSymbolCount()), 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap: 18, padding: "0 16px",
        borderBottom: "1px solid var(--line)", background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(16px)", position: "relative", zIndex: 40,
      }}
    >
      {/* Wordmark */}
      <button
        onClick={() => navigate("/")}
        style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <span
          style={{
            width: 26, height: 26, borderRadius: 6, display: "grid", placeItems: "center",
            background: "linear-gradient(135deg, var(--blue-dim), var(--gold-dim))",
            border: "1px solid var(--line-strong)", color: "var(--gold)",
            fontFamily: "var(--mono)", fontSize: 12, fontWeight: 800,
          }}
        >
          ⬡
        </span>
        <span style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", color: "var(--text)" }}>
          GFT<span style={{ color: "var(--gold)" }}>·</span>TERMINAL
        </span>
        <span
          title="Deployed from main via CI"
          style={{
            fontFamily: "var(--mono)", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--gold)", border: "1px solid var(--gold)", background: "var(--gold-dim)",
            borderRadius: 3, padding: "2px 6px",
          }}
        >
          v1.0.1
        </span>
      </button>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 4 }}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end as boolean | undefined}
            style={({ isActive }) => ({
              fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
              padding: "6px 12px", borderRadius: 5,
              color: isActive ? "var(--gold)" : "var(--muted)",
              background: isActive ? "var(--gold-dim)" : "transparent",
              border: `1px solid ${isActive ? "var(--gold)" : "transparent"}`,
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* Search trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        style={{
          flex: "1 1 0%", maxWidth: 420, minWidth: 140, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
          background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 6,
          color: "var(--faint)", cursor: "pointer",
          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em",
        }}
      >
        <span style={{ color: "var(--gold)" }}>⌕</span>
        SEARCH STOCKS · COUNTRIES · NEWS
        <kbd style={{ marginLeft: "auto", fontSize: 9, color: "var(--faint)", border: "1px solid var(--line)", borderRadius: 3, padding: "1px 5px" }}>⌘K</kbd>
      </button>

      {/* Status cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
        {notices.length > 0 && (
          <span title={notices[0].text} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--gold)" }}>
            🔔 {notices.length}
          </span>
        )}
        <SourceBadge
          source={liveN > 0 ? "live" : "sim"}
          title={liveN > 0 ? `${liveN} instruments on real feeds (Binance WS · ECB) — rest simulated` : undefined}
        />
        <span className="mono" style={{ fontSize: 12, color: "var(--up)" }}>{clock} UTC</span>
      </div>
    </header>
  );
}
