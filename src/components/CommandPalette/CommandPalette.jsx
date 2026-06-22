import { useState, useEffect, useRef, useCallback } from "react";
import useTerminalStore from "../../store/terminalStore";
import { searchStocks } from "../../data/stocksData";
import { COUNTRIES_DATA } from "../../data/mockData";
import { FORUM_THREADS, FORUM_CATEGORIES } from "../../data/forumData";
import { useNavigate } from "react-router-dom";

const QUICK_COMMANDS = [
  { id: "forum", icon: "💬", label: "Open Forum", desc: "Community discussions", action: "nav:/forum" },
  { id: "heatmap", icon: "🌡️", label: "Global Heatmap", desc: "Market performance treemap", action: "view:heatmap" },
  { id: "calendar", icon: "🗓️", label: "Economic Calendar", desc: "Upcoming macro events", action: "view:calendar" },
  { id: "portfolio", icon: "📊", label: "Portfolio Simulator", desc: "Virtual trading portfolio", action: "view:portfolio" },
  { id: "fx", icon: "🌐", label: "FX Dashboard", desc: "Currency cross-rates", action: "view:fx" },
  { id: "correlation", icon: "🔍", label: "Correlation Matrix", desc: "Cross-asset correlations", action: "view:correlation" },
  { id: "alerts", icon: "🔔", label: "Alert Center", desc: "Price alerts & notifications", action: "view:alerts" },
];

function fuzzyMatch(str, query) {
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  if (s.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const { commandPaletteOpen, setCommandPaletteOpen, setSelectedStock, setSelectedCountry, setActiveView } = useTerminalStore();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Global keyboard shortcut
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(QUICK_COMMANDS.map((c) => ({ ...c, type: "command" })));
      setActiveIdx(0);
      return;
    }

    const q = query.trim();
    const items = [];

    // Commands
    QUICK_COMMANDS.filter((c) => fuzzyMatch(c.label + " " + c.desc, q))
      .forEach((c) => items.push({ ...c, type: "command" }));

    // Countries
    Object.values(COUNTRIES_DATA)
      .filter((c) => fuzzyMatch(c.name + " " + c.code, q))
      .slice(0, 4)
      .forEach((c) => items.push({ id: "c_" + c.code, icon: "🌍", label: c.name, desc: `${c.marketIndex} · ${c.currency}`, type: "country", data: c }));

    // Stocks
    searchStocks(q).slice(0, 5).forEach((s) => {
      const up = s.changePct >= 0;
      items.push({
        id: "s_" + s.symbol,
        icon: "📈",
        label: s.symbol,
        desc: `${s.name} · ${s.sector}`,
        type: "stock",
        data: s,
        badge: `${up ? "+" : ""}${s.changePct.toFixed(2)}%`,
        badgeClass: up ? "up" : "down",
      });
    });

    // Forum threads
    FORUM_THREADS
      .filter((t) => fuzzyMatch(t.title + " " + t.tags.join(" "), q))
      .slice(0, 3)
      .forEach((t) => items.push({ id: "f_" + t.id, icon: "💬", label: t.title.slice(0, 55) + (t.title.length > 55 ? "…" : ""), desc: `Forum · ${t.upvotes} upvotes`, type: "forum", data: t }));

    // Categories
    FORUM_CATEGORIES
      .filter((c) => fuzzyMatch(c.label, q))
      .forEach((c) => items.push({ id: "fc_" + c.id, icon: c.icon, label: c.label, desc: "Forum category", type: "forum-cat", data: c }));

    setResults(items);
    setActiveIdx(0);
  }, [query]);

  const handleSelect = useCallback((item) => {
    setCommandPaletteOpen(false);
    if (item.type === "command") {
      if (item.action.startsWith("nav:")) navigate(item.action.slice(4));
      else if (item.action.startsWith("view:")) setActiveView(item.action.slice(5));
    } else if (item.type === "country") {
      setSelectedCountry(item.data);
    } else if (item.type === "stock") {
      setSelectedStock(item.data);
    } else if (item.type === "forum") {
      navigate(`/forum/thread/${item.data.id}`);
    } else if (item.type === "forum-cat") {
      navigate(`/forum/${item.data.id}`);
    }
  }, [navigate, setCommandPaletteOpen, setSelectedCountry, setSelectedStock, setActiveView]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[activeIdx]) handleSelect(results[activeIdx]);
  };

  if (!commandPaletteOpen) return null;

  return (
    <>
      <div className="cmd-overlay" onClick={() => setCommandPaletteOpen(false)} />
      <div className="cmd-palette">
        <div className="cmd-palette__header">
          <span className="cmd-palette__search-icon">⌕</span>
          <input
            ref={inputRef}
            className="cmd-palette__input"
            placeholder="Search stocks, markets, forum, commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-palette__esc" onClick={() => setCommandPaletteOpen(false)}>ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="cmd-palette__results">
            {!query && <div className="cmd-palette__section-label">Quick Actions</div>}
            {results.map((item, i) => (
              <div
                key={item.id}
                className={`cmd-palette__item ${i === activeIdx ? "active" : ""} cmd-palette__item--${item.type}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => handleSelect(item)}
              >
                <span className="cmd-palette__item-icon">{item.icon}</span>
                <div className="cmd-palette__item-body">
                  <div className="cmd-palette__item-label">{item.label}</div>
                  <div className="cmd-palette__item-desc">{item.desc}</div>
                </div>
                {item.badge && (
                  <span className={`cmd-palette__item-badge ${item.badgeClass}`}>{item.badge}</span>
                )}
                {item.type === "command" && <span className="cmd-palette__item-arrow">↵</span>}
              </div>
            ))}
          </div>
        )}

        <div className="cmd-palette__footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>ESC</kbd> close</span>
          <span><kbd>⌘K</kbd> toggle</span>
        </div>
      </div>
    </>
  );
}
