import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTerminal } from "../store";

export default function ContextMenu() {
  const contextMenu = useTerminal((s) => s.contextMenu);
  const setContextMenu = useTerminal((s) => s.setContextMenu);
  const inWatchlist = useTerminal((s) => s.inWatchlist);
  const addWatch = useTerminal((s) => s.addWatch);
  const removeWatch = useTerminal((s) => s.removeWatch);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const { x, y, symbol, type } = contextMenu;
  const isWatched = symbol ? inWatchlist(symbol) : false;

  // Keep menu within viewport
  const displayX = Math.min(x, window.innerWidth - 180);
  const displayY = Math.min(y, window.innerHeight - 200);

  const handleAction = (action: () => void) => {
    action();
    setContextMenu(null);
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: displayY,
        left: displayX,
        zIndex: 9999,
        background: "var(--bg)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        padding: "4px 0",
        minWidth: 160,
        fontFamily: "var(--sans)",
        fontSize: 13,
      }}
    >
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", color: "var(--faint)", fontSize: 11, fontWeight: 600 }}>
        {symbol ? symbol.toUpperCase() : "Menu"}
      </div>
      
      {symbol && type === "stock" && (
        <button
          onClick={() => handleAction(() => isWatched ? removeWatch(symbol) : addWatch({ symbol, name: symbol, country: null }))}
          style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--blue-dim)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          {isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
      )}

      {symbol && (
        <button
          onClick={() => handleAction(() => navigate(type === "stock" ? `/stock/${symbol}` : `/country/${symbol}`))}
          style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--blue-dim)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          View {type === "stock" ? "Chart" : "Dashboard"}
        </button>
      )}

      {symbol && type === "stock" && (
        <button
          onClick={() => handleAction(() => navigate(`/compare/${symbol}`))}
          style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--blue-dim)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          Compare Performance
        </button>
      )}
    </div>
  );
}
