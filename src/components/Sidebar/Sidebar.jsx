import { GLOBAL_INDICES } from "../../data/mockData";

const EQUITY_INDICES = GLOBAL_INDICES.slice(0, 13);
const FX_INDICES     = GLOBAL_INDICES.slice(13);

function IndexItem({ item }) {
  return (
    <div className="sidebar__index-item">
      <div className="sidebar__index-row">
        <span className="sidebar__index-name">{item.name}</span>
        <span className={`sidebar__index-change ${item.up ? "up" : "down"}`}>
          {item.change}
        </span>
      </div>
      <div className="sidebar__index-row">
        <span className="sidebar__index-value">{item.value}</span>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }) {
  return (
    <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
      {/* Mobile close strip — tap title to dismiss */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 16px 0",
        }}
      >
        <span
          style={{
            fontFamily: "var(--text-mono)",
            fontSize: 9,
            color: "var(--text-muted)",
            letterSpacing: "0.14em",
          }}
        >
          GLOBAL MARKETS
        </span>
        {/* Only rendered visually on mobile via CSS, harmless on desktop */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 16,
            padding: "4px 6px",
          }}
          aria-label="Close markets"
        >
          ✕
        </button>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__section-title">Equity Indices</div>
        {EQUITY_INDICES.map((item) => (
          <IndexItem key={item.name} item={item} />
        ))}
      </div>
      <div className="sidebar__section">
        <div className="sidebar__section-title">FX · Commodities · Crypto</div>
        {FX_INDICES.map((item) => (
          <IndexItem key={item.name} item={item} />
        ))}
      </div>
    </aside>
  );
}
