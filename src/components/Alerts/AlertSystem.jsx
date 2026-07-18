import { useState, useEffect, useRef } from "react";
import useTerminalStore from "../../store/terminalStore";
import { quoteFor } from "../../services/marketData";

export function AlertBell() {
  const { unreadAlertCount, setAlertPanelOpen, alertPanelOpen } = useTerminalStore();
  
  return (
    <button
      id="alert-bell-btn"
      className="header__alert-bell"
      onClick={() => setAlertPanelOpen(!alertPanelOpen)}
      title="Alert Center"
    >
      🔔
      {unreadAlertCount > 0 && (
        <span className="header__alert-count">{unreadAlertCount > 9 ? "9+" : unreadAlertCount}</span>
      )}
    </button>
  );
}

function parseNaturalLanguageAlert(text) {
  const t = text.toLowerCase();
  let target = "GLOBAL";
  let conditionText = "";

  if (t.includes("china")) target = "CN";
  else if (t.includes("us") || t.includes("america")) target = "US";
  else if (t.includes("japan")) target = "JP";
  else if (t.includes("germany")) target = "DE";
  else {
    const symbolMatch = text.match(/[A-Z]{3,5}/);
    if (symbolMatch) target = symbolMatch[0];
  }

  const numberMatches = t.match(/\d+(\.\d+)?/g);
  const val = numberMatches ? parseFloat(numberMatches[0]) : 50;

  let direction = "above";
  if (t.includes("below") || t.includes("<") || t.includes("drops") || t.includes("crosses below")) {
    direction = "below";
  }

  if (t.includes("risk") || t.includes("gravity")) {
    conditionText = `${target} Risk Gravity ${direction === "above" ? ">" : "<"} ${val}`;
  } else if (t.includes("inflation")) {
    conditionText = `${target} Inflation ${direction === "above" ? ">" : "<"} ${val}%`;
  } else if (t.includes("rate") || t.includes("interest")) {
    conditionText = `${target} C.B. Rate ${direction === "above" ? ">" : "<"} ${val}%`;
  } else {
    conditionText = `${target} Price ${direction === "above" ? ">" : "<"} $${val}`;
  }

  if (t.includes("and")) {
    const parts = t.split("and");
    if (parts[1]) {
      const andNumMatch = parts[1].match(/\d+(\.\d+)?/g);
      const andVal = andNumMatch ? andNumMatch[0] : "1";
      if (parts[1].includes("yuan") || parts[1].includes("cny")) {
        conditionText += ` & CNY moves >${andVal}%`;
      } else {
        conditionText += ` & secondary target >${andVal}%`;
      }
    }
  }

  return {
    symbol: target,
    price: val,
    direction: direction,
    text: conditionText,
    isSmart: true,
    status: "Active monitoring"
  };
}

export function AlertPanel() {
  const {
    alerts, notifications, alertPanelOpen, setAlertPanelOpen,
    removeAlert, clearNotifications, addAlert,
  } = useTerminalStore();
  
  const [newSymbol, setNewSymbol] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDir, setNewDir] = useState("above");
  const [addMode, setAddMode] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  
  const [activeTab, setActiveTab] = useState("standard"); // "standard" | "smart"
  const [naturalText, setNaturalText] = useState("");

  if (!alertPanelOpen) return null;

  function handleAdd(e) {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    const price = parseFloat(newPrice);
    if (!sym || isNaN(price) || price <= 0) {
      setAddMsg("Enter a valid symbol and price.");
      return;
    }
    addAlert({ symbol: sym, price, direction: newDir });
    setNewSymbol(""); setNewPrice(""); setAddMsg("Alert set!");
    setTimeout(() => { setAddMsg(""); setAddMode(false); }, 1200);
  }

  function handleAddSmart(e) {
    e.preventDefault();
    if (!naturalText.trim()) return;
    const parsed = parseNaturalLanguageAlert(naturalText);
    addAlert(parsed);
    setNaturalText("");
    setAddMsg("Smart Rule parsed & active!");
    setTimeout(() => { setAddMsg(""); setAddMode(false); }, 1500);
  }

  return (
    <div className="alert-panel" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="alert-panel__header">
        <span className="alert-panel__title">🔔 Alert Center</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="alert-panel__new-btn" onClick={() => setAddMode((v) => !v)}>+ New</button>
          <button className="alert-panel__close" onClick={() => setAlertPanelOpen(false)}>✕</button>
        </div>
      </div>

      {addMode && (
        <div className="bg-[#0a0f1d] border border-white/5 p-3 rounded-lg mb-3 flex flex-col gap-2.5">
          <div className="flex gap-2 border-b border-white/5 pb-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("standard")}
              className={`text-[9px] font-mono font-bold tracking-wider px-2 py-1 rounded transition-colors ${activeTab === 'standard' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              STANDARD price
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("smart")}
              className={`text-[9px] font-mono font-bold tracking-wider px-2 py-1 rounded transition-colors ${activeTab === 'smart' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              🎙️ SMART NLP
            </button>
          </div>

          {activeTab === "standard" ? (
            <form className="alert-panel__add-form" onSubmit={handleAdd} style={{ margin: 0, padding: 0 }}>
              <div className="alert-panel__form-row" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  className="alert-panel__input"
                  placeholder="Symbol (e.g. AAPL)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select className="alert-panel__select" value={newDir} onChange={(e) => setNewDir(e.target.value)}>
                  <option value="above">Above ↑</option>
                  <option value="below">Below ↓</option>
                </select>
              </div>
              <div className="alert-panel__form-row" style={{ display: "flex", gap: 8 }}>
                <input
                  className="alert-panel__input"
                  placeholder="Price target"
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="alert-panel__submit font-mono font-bold text-[10px] uppercase" type="submit">Set Alert</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddSmart} className="flex flex-col gap-2" style={{ margin: 0, padding: 0 }}>
              <input
                className="alert-panel__input w-full font-mono text-[10px]"
                placeholder="E.g. alert me if China's Risk Gravity crosses 60 AND yuan moves >1%"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
              />
              <button 
                type="submit"
                className="w-full py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white rounded text-[10px] font-bold font-mono tracking-widest transition-all cursor-pointer"
              >
                PARSE & ACTIVATE RULE
              </button>
            </form>
          )}
          {addMsg && <div className="text-[10px] text-center text-emerald-400 font-mono mt-1">{addMsg}</div>}
        </div>
      )}

      <div className="alert-panel__section-label">Active Alerts ({alerts.length})</div>
      {alerts.length === 0 ? (
        <div className="alert-panel__empty">No active alerts. Click + New to add one.</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
          {alerts.map((a) => (
            <div key={a.id} className="alert-panel__alert-row flex justify-between items-center p-2.5 rounded bg-[#070b16] border border-white/5 hover:border-indigo-500/20 transition-colors">
              {a.isSmart ? (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[8px] text-amber-400 font-bold font-mono tracking-widest uppercase">🎙️ Smart Rule</span>
                  <span className="text-[11.5px] text-slate-300 font-mono leading-tight truncate max-w-[200px]" title={a.text}>{a.text}</span>
                  <div className="flex gap-1.5 items-center mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-400 font-bold tracking-widest uppercase">{a.status}</span>
                  </div>
                </div>
              ) : (
                <div className="alert-panel__alert-info">
                  <span className="alert-panel__alert-sym">{a.symbol}</span>
                  <span className="alert-panel__alert-dir">
                    {a.direction === "above" ? "↑ above" : "↓ below"} ${a.price.toLocaleString()}
                  </span>
                </div>
              )}
              <button className="alert-panel__remove text-slate-500 hover:text-rose-400 cursor-pointer" onClick={() => removeAlert(a.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="alert-panel__section-label" style={{ marginTop: 12 }}>
        Notifications
        {notifications.length > 0 && (
          <button className="alert-panel__clear" onClick={clearNotifications}>Clear all</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="alert-panel__empty">No notifications yet.</div>
      ) : (
        [...notifications].reverse().map((n) => (
          <div key={n.id} className={`alert-panel__notif ${n.read ? "" : "unread"}`}>
            <span className="alert-panel__notif-icon">{n.icon || "🔔"}</span>
            <div className="alert-panel__notif-body">
              <div className="alert-panel__notif-text">{n.text}</div>
              <div className="alert-panel__notif-time">{n.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Background service that watches prices and fires alerts
export function AlertSystem() {
  const { alerts, fireAlert, watchlist } = useTerminalStore();
  const prevPricesRef = useRef({});

  useEffect(() => {
    if (alerts.length === 0) return;
    const interval = setInterval(() => {
      const t = Date.now();
      alerts.forEach((alert) => {
        // Prefer the shared market-data provider so alerts evaluate against the
        // exact prices shown in the ticker and panels. Symbols the provider
        // doesn't track (e.g. country-code alerts) fall back to a gentle sim.
        const q = quoteFor(alert.symbol, t);
        const prev = prevPricesRef.current[alert.symbol];
        let newPrice;
        if (q) {
          newPrice = q.price;
        } else if (prev === undefined) {
          const baseStock = watchlist.find((s) => s.symbol === alert.symbol);
          prevPricesRef.current[alert.symbol] = baseStock?.price || alert.price * 0.98;
          return;
        } else {
          newPrice = Math.max(0.01, prev + (Math.random() - 0.48) * 0.004 * prev);
        }
        prevPricesRef.current[alert.symbol] = newPrice;
        if (prev === undefined) return; // need a baseline before detecting a crossing

        const hit =
          (alert.direction === "above" && prev < alert.price && newPrice >= alert.price) ||
          (alert.direction === "below" && prev > alert.price && newPrice <= alert.price);

        if (hit) {
          fireAlert(alert, newPrice);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(`🔔 ${alert.symbol} Alert Triggered`, {
              body: `${alert.symbol} hit $${newPrice.toFixed(2)} (target: $${alert.price} ${alert.direction})`,
              icon: "/favicon.png",
            });
          }
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [alerts, watchlist, fireAlert]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
}
