import { useState, useEffect } from "react";
import { GLOBAL_INDICES } from "../../data/mockData";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toUTCString().slice(17, 25);
  const dateStr = now.toUTCString().slice(0, 16);
  const hour = now.getUTCHours();
  const isMarketOpen = hour >= 14 && hour < 21; // rough NYSE hours in UTC

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span className="header__clock">{timeStr} UTC</span>
      <span className="header__date">{dateStr}</span>
    </div>
  );
}

function MarketStatus() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const h = new Date().getUTCHours();
    setIsOpen(h >= 13 && h < 21);
  }, []);
  return (
    <div className="header__market-status">
      <div className={`header__status-dot ${isOpen ? "" : "closed"}`} />
      <span style={{ color: isOpen ? "var(--accent-green)" : "var(--accent-red)", fontFamily: "var(--text-mono)", fontSize: 11 }}>
        NYSE {isOpen ? "OPEN" : "CLOSED"}
      </span>
    </div>
  );
}

export default function Header() {
  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__logo-icon">🌐</div>
        <div>
          <div className="header__logo-text">
            GLOBAL<span>FIN</span> TERMINAL
          </div>
          <div style={{ fontFamily: "var(--text-mono)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            v0.1.0 · MARKET INTELLIGENCE
          </div>
        </div>
      </div>

      <div className="header__divider" />
      <MarketStatus />

      {[
        { label: "BTC", val: "$67,234", up: true },
        { label: "GOLD", val: "$2,387", up: true },
        { label: "WTI", val: "$78.43", up: false },
        { label: "EUR/USD", val: "1.0876", up: false },
        { label: "VIX", val: "14.32", up: false },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--text-mono)",
              fontSize: 9,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontFamily: "var(--text-mono)",
              fontSize: 12,
              color: item.up ? "var(--accent-green)" : "var(--accent-red)",
              fontWeight: 600,
            }}
          >
            {item.val}
          </span>
        </div>
      ))}

      <div className="header__divider" />
      <LiveClock />
    </header>
  );
}
