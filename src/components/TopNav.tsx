import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUtcClock } from "../lib/hooks";
import { liveSymbolCount } from "../lib/market";
import { useTerminal } from "../store";
import SourceBadge from "./SourceBadge";
import ShareButton from "./ShareButton";
import SavedViews from "./SavedViews";
import AccountModal from "./AccountModal";
import { useAuth } from "../lib/auth";

/** Four destinations cover what almost everyone came for. Eight top-level
 *  links is a menu, not navigation — the rest live behind MORE. */
const PRIMARY_LINKS = [
  { to: "/", label: "WORLD", end: true },
  { to: "/markets", label: "MARKETS" },
  { to: "/news", label: "NEWS" },
  { to: "/impact", label: "IMPACT" },
  { to: "/terminal/signals", label: "SIGNALS" },
  { to: "/forum", label: "FORUM" },
];

const OVERFLOW_LINKS = [
  { to: "/portfolio", label: "PORTFOLIO" },
  { to: "/watchlist", label: "WATCHLIST" },
  { to: "/calendar", label: "CALENDAR" },
  { to: "/macro", label: "MACRO" },
  { to: "/compare", label: "COMPARE" },
  { to: "/glossary", label: "GLOSSARY" },
];

export default function TopNav() {
  const clock = useUtcClock();
  const navigate = useNavigate();
  const location = useLocation();
  const setSearchOpen = useTerminal((s) => s.setSearchOpen);
  const notices = useTerminal((s) => s.notices);
  const nerdMode = useTerminal((s) => s.nerdMode);
  const setNerdMode = useTerminal((s) => s.setNerdMode);
  const chatOpen = useTerminal((s) => s.chatOpen);
  const setChatOpen = useTerminal((s) => s.setChatOpen);
  const [liveN, setLiveN] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const i = setInterval(() => setLiveN(liveSymbolCount()), 3000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // ⌘J / Ctrl+J toggles research, alongside ⌘K for search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setChatOpen(!chatOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, setChatOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const linkStyle = (on: boolean) => ({
    fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
    padding: "6px 12px", borderRadius: 5,
    color: on ? "var(--gold)" : "var(--muted)",
    background: on ? "var(--gold-dim)" : "transparent",
    border: `1px solid ${on ? "var(--gold)" : "transparent"}`,
  });

  const compareActive = location.pathname.startsWith("/compare");
  const moreActive = OVERFLOW_LINKS.some((l) =>
    l.label === "COMPARE" ? compareActive : location.pathname.startsWith(l.to),
  );

  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap: 18, padding: "0 16px",
        borderBottom: "1px solid var(--line)", background: "rgba(0,0,0,0.82)",
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
          className="nerd-only"
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

      {/* Nav — COMPARE collapses into More under 900px */}
      <nav className="topnav-links" aria-label="Primary">
        {PRIMARY_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end as boolean | undefined}
            style={({ isActive }) => {
              const signalsActive = l.label === "SIGNALS" && (location.pathname.startsWith("/terminal/signals") || location.pathname.startsWith("/signals"));
              const forumActive = l.label === "FORUM" && (location.pathname.startsWith("/forum") || location.pathname.startsWith("/user/"));
              const impactActive = l.label === "IMPACT" && location.pathname.startsWith("/impact");
              return linkStyle(isActive || signalsActive || forumActive || impactActive);
            }}
          >
            {l.label}
          </NavLink>
        ))}

        <div className="topnav-more" ref={moreRef}>
          <button
            type="button"
            className="chip"
            style={linkStyle(moreActive || moreOpen)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => setMoreOpen((v) => !v)}
          >
            MORE
          </button>
          {moreOpen && (
            <div className="topnav-more-menu" role="menu">
              {OVERFLOW_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  role="menuitem"
                  className={({ isActive }) => (isActive || (l.label === "COMPARE" && compareActive) ? "active" : "")}
                  onClick={() => setMoreOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Search trigger */}
      <button
        data-tour="search"
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
        <span className="nerd-only"><SourceBadge
          source={liveN > 0 ? "live" : "sim"}
          title={liveN > 0 ? `${liveN} instruments on real feeds (Binance WS · ECB) — rest simulated` : undefined}
        /></span>
        {/* The research engine is the flagship feature; a bare glyph tooltipped
            with a deleted feature's name was not going to get found. */}
        <button
          className={`nav-research ${chatOpen ? "on" : ""}`}
          title="Research — ask about any company, with sources (⌘J)"
          aria-pressed={chatOpen}
          onClick={() => setChatOpen(!chatOpen)}
        >

          <span className="nav-research-label">RESEARCH</span>
        </button>
        <button className={`nav-tour ${nerdMode ? "on" : ""}`} title={nerdMode ? "Nerd mode on — hide technical detail" : "Nerd mode off — show technical detail"} aria-pressed={nerdMode} onClick={() => setNerdMode(!nerdMode)}>{"{ }"}</button>
        <button className="nav-tour" title="Take the tour" aria-label="Take the tour" onClick={() => window.dispatchEvent(new CustomEvent("gft:start-tour"))}>?</button>
        <SavedViews />
        <ShareButton />
        <span className="mono nerd-only" style={{ fontSize: 12, color: "var(--up)" }}>{clock} UTC</span>
        <AccountChip />
      </div>
    </header>
  );
}

/** Signed-in identity + sign out. Renders nothing when auth is off. */
function AccountChip() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const initials = (user.displayName || user.email || "?")
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <div className="acct">
      <button className="acct-avatar-btn" onClick={() => setOpen(true)}
        title="Account & privacy" aria-label="Account and privacy">
        {user.photoURL
          ? <img className="acct-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          : <span className="acct-avatar">{initials}</span>}
      </button>
      <button className="chip" style={{ padding: "3px 9px", fontSize: 9.5 }}
        onClick={() => void signOut()} title={user.email || undefined}>
        SIGN OUT
      </button>
      {open && <AccountModal onClose={() => setOpen(false)} />}
    </div>
  );
}
