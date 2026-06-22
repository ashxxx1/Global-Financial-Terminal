import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import useTerminalStore from "../../store/terminalStore";
import { searchStocks } from "../../data/stocksData";
import { COUNTRIES_DATA } from "../../data/mockData";
import { AlertBell } from "../Alerts/AlertSystem";
import { getNextHighImpactEvent } from "../EconomicCalendar/calendarData";

const EXCHANGES = [
  { label: "NYSE", open: [13, 21] },
  { label: "LSE", open: [8, 16] },
  { label: "TSE", open: [0, 6] },
  { label: "NSE", open: [3, 10] },
];

const VIEW_BUTTONS = [
  { id: "globe", icon: "🌐", label: "Globe" },
  { id: "heatmap", icon: "🌡️", label: "Heat" },
  { id: "calendar", icon: "🗓️", label: "Cal" },
  { id: "portfolio", icon: "📊", label: "Port" },
  { id: "fx", icon: "💱", label: "FX" },
  { id: "correlation", icon: "🔍", label: "Corr" },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeStr = now.toUTCString().slice(17, 25);
  const dateStr = now.toUTCString().slice(5, 16);
  return (
    <div className="header__clock-block">
      <span className="header__clock">{timeStr}</span>
      <span className="header__date">{dateStr} UTC</span>
    </div>
  );
}

function ExchangeClocks() {
  const [h, setH] = useState(new Date().getUTCHours());
  useEffect(() => {
    const id = setInterval(() => setH(new Date().getUTCHours()), 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="header__exchanges">
      {EXCHANGES.map((ex) => {
        const open = h >= ex.open[0] && h < ex.open[1];
        return (
          <div key={ex.label} className="header__exchange-item">
            <span className={`header__ex-dot ${open ? "open" : "closed"}`} />
            <span className="header__ex-label">{ex.label}</span>
            <span className={`header__ex-status ${open ? "open" : "closed"}`}>
              {open ? "OPEN" : "CLSD"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const { setSelectedStock, setSelectedCountry } = useTerminalStore();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);
    if (val.trim().length < 2) { setResults([]); setShow(false); return; }
    const stocks = searchStocks(val).slice(0, 6);
    const countries = Object.values(COUNTRIES_DATA).filter(
      (c) => c.name.toLowerCase().includes(val.toLowerCase()) || c.code.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 3);
    setResults([...countries.map((c) => ({ type: "country", ...c })), ...stocks.map((s) => ({ type: "stock", ...s }))]);
    setShow(true);
  };

  const handleSelect = (item) => {
    if (item.type === "country") { setSelectedCountry(item); }
    else { setSelectedStock(item); }
    setQ(""); setShow(false);
  };

  return (
    <div className="header__search" ref={ref}>
      <span className="header__search-icon">⌕</span>
      <input
        className="header__search-input"
        placeholder="Search stocks, markets…"
        value={q}
        onChange={handleChange}
        onFocus={() => q.length >= 2 && setShow(true)}
      />
      {show && results.length > 0 && (
        <div className="header__search-dropdown">
          {results.map((item, i) => (
            <div key={i} className="header__search-result" onClick={() => handleSelect(item)}>
              <span className={`header__sr-type ${item.type}`}>
                {item.type === "country" ? "🌍" : "📈"}
              </span>
              <div className="header__sr-info">
                <div className="header__sr-name">
                  {item.type === "country" ? item.name : `${item.symbol} — ${item.name}`}
                </div>
                <div className="header__sr-sub">
                  {item.type === "country"
                    ? `${item.marketIndex} · ${item.currency}`
                    : `${item.sector} · ${item.country}`}
                </div>
              </div>
              {item.type === "stock" && (
                <span className={`header__sr-chg ${item.changePct >= 0 ? "up" : "down"}`}>
                  {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { currentUser, userProfileData, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="header__user" ref={ref}>
      {isAdmin && <span className="header__admin-badge">ADMIN</span>}
      <img
        src={userProfileData?.photoURL || currentUser.photoURL}
        alt={userProfileData?.displayName || currentUser.displayName}
        className="header__user-avatar"
        onClick={() => setOpen((o) => !o)}
        title={userProfileData?.displayName || currentUser.displayName}
      />
      {open && (
        <div className="header__user-dropdown">
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
              {userProfileData?.displayName || currentUser.displayName}
              {userProfileData?.username && (
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>
                  @{userProfileData.username}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--text-mono)", marginTop: 2 }}>{currentUser.email}</div>
          </div>
          {isAdmin && (
            <Link to="/admin" className="header__dropdown-item" onClick={() => setOpen(false)}>
              ⚙ Admin Panel
            </Link>
          )}
          <Link to="/forum" className="header__dropdown-item" onClick={() => setOpen(false)}>
            💬 Community Forum
          </Link>
          <div className="header__dropdown-divider" />
          <button className="header__dropdown-item danger" onClick={() => { logout(); setOpen(false); }}>
            ↩ Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarChip() {
  const nextEvent = getNextHighImpactEvent();
  const { setActiveView } = useTerminalStore();
  if (!nextEvent) return null;
  const dt = new Date(`${nextEvent.date}T${nextEvent.time}`);
  const hoursUntil = Math.floor((dt - Date.now()) / 3600000);
  return (
    <button className="header__calendar-chip" onClick={() => setActiveView("calendar")} title="Economic Calendar">
      <span>🗓️</span>
      <span className="header__calendar-chip-text">
        {nextEvent.countryFlag} {nextEvent.event.slice(0, 18)}{nextEvent.event.length > 18 ? "…" : ""}
      </span>
      <span className="header__calendar-chip-countdown">
        {hoursUntil < 1 ? "<1h" : `${hoursUntil}h`}
      </span>
    </button>
  );
}

export default function Header() {
  const { setCommandPaletteOpen, activeView, setActiveView } = useTerminalStore();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__logo-icon">🌐</div>
        <div>
          <div className="header__logo-text">
            GLOBAL<span>FIN</span> TERMINAL
          </div>
          <div style={{ fontFamily: "var(--text-mono)", fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
            REAL-TIME MARKET INTELLIGENCE
          </div>
        </div>
      </div>

      <div className="header__divider" />
      <ExchangeClocks />
      <div className="header__divider" />
      <GlobalSearch />

      {/* View switcher */}
      <div className="header__view-switcher">
        {VIEW_BUTTONS.map((v) => (
          <button
            key={v.id}
            className={`header__view-btn ${activeView === v.id ? "active" : ""}`}
            onClick={() => setActiveView(v.id)}
            title={v.label}
          >
            <span>{v.icon}</span>
            <span className="header__view-btn-label">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="header__divider" />

      {/* Forum link */}
      <button className="header__forum-btn" onClick={() => navigate("/forum")} title="Community Forum">
        💬 <span className="header__forum-btn-label">Forum</span>
      </button>

      {/* Social Hub link */}
      <button className="header__social-btn" onClick={() => navigate("/social")} title="Social Hub">
        👥 <span className="header__social-btn-label">Social</span>
      </button>

      {/* Calendar chip */}
      <CalendarChip />

      {[
        { label: "BTC", val: "$67,234", up: true },
        { label: "GOLD", val: "$2,387", up: true },
        { label: "VIX", val: "14.32", up: false },
      ].map((item) => (
        <div key={item.label} className="header__quick-stat">
          <span className="header__qs-label">{item.label}</span>
          <span className={`header__qs-val ${item.up ? "up" : "down"}`}>{item.val}</span>
        </div>
      ))}

      <div className="header__divider" />
      <LiveClock />

      {/* Alerts bell */}
      <AlertBell />

      {/* Command palette trigger */}
      <button
        className="header__cmd-btn"
        onClick={() => setCommandPaletteOpen(true)}
        title="Command Palette (Ctrl+K)"
      >
        <span>⌘</span><span>K</span>
      </button>

      <UserMenu />
    </header>
  );
}
