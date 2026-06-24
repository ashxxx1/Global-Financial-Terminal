import { useState, useEffect, useRef } from "react";
import useTerminalStore from "../../store/terminalStore";

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

  return (
    <div className="alert-panel">
      <div className="alert-panel__header">
        <span className="alert-panel__title">🔔 Alert Center</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="alert-panel__new-btn" onClick={() => setAddMode((v) => !v)}>+ New</button>
          <button className="alert-panel__close" onClick={() => setAlertPanelOpen(false)}>✕</button>
        </div>
      </div>

      {addMode && (
        <form className="alert-panel__add-form" onSubmit={handleAdd}>
          <div className="alert-panel__form-row">
            <input
              className="alert-panel__input"
              placeholder="Symbol (e.g. AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
            />
            <select className="alert-panel__select" value={newDir} onChange={(e) => setNewDir(e.target.value)}>
              <option value="above">Above ↑</option>
              <option value="below">Below ↓</option>
            </select>
          </div>
          <div className="alert-panel__form-row">
            <input
              className="alert-panel__input"
              placeholder="Price target"
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <button className="alert-panel__submit" type="submit">Set Alert</button>
          </div>
          {addMsg && <div className="alert-panel__msg">{addMsg}</div>}
        </form>
      )}

      <div className="alert-panel__section-label">Active Alerts ({alerts.length})</div>
      {alerts.length === 0 ? (
        <div className="alert-panel__empty">No active alerts. Click + New to add one.</div>
      ) : (
        alerts.map((a) => (
          <div key={a.id} className="alert-panel__alert-row">
            <div className="alert-panel__alert-info">
              <span className="alert-panel__alert-sym">{a.symbol}</span>
              <span className="alert-panel__alert-dir">
                {a.direction === "above" ? "↑ above" : "↓ below"} ${a.price.toLocaleString()}
              </span>
            </div>
            <button className="alert-panel__remove" onClick={() => removeAlert(a.id)}>✕</button>
          </div>
        ))
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
      // Simulate price movement for each alerted symbol
      alerts.forEach((alert) => {
        const prev = prevPricesRef.current[alert.symbol];
        if (prev === undefined) {
          // Init with some base price
          const baseStock = watchlist.find((s) => s.symbol === alert.symbol);
          prevPricesRef.current[alert.symbol] = baseStock?.price || alert.price * 0.98;
          return;
        }
        const drift = (Math.random() - 0.48) * 0.004 * prev;
        const newPrice = Math.max(0.01, prev + drift);
        prevPricesRef.current[alert.symbol] = newPrice;

        const hit =
          (alert.direction === "above" && prev < alert.price && newPrice >= alert.price) ||
          (alert.direction === "below" && prev > alert.price && newPrice <= alert.price);

        if (hit) {
          fireAlert(alert, newPrice);
          // Browser notification
          if (Notification.permission === "granted") {
            new Notification(`🔔 ${alert.symbol} Alert Triggered`, {
              body: `${alert.symbol} hit $${newPrice.toFixed(2)} (target: $${alert.price} ${alert.direction})`,
              icon: "/favicon.png",
            });
          }
        }
      });
    }, 4000);
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
