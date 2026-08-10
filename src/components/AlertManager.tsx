import { useNavigate } from "react-router-dom";
import { useTerminal } from "../store";
import { metaFor } from "../lib/market";

/**
 * Alert management — growth-plan item 72.
 *
 * Alerts could be armed from a stock page but never listed, edited or removed:
 * once set, they were invisible until they fired. An alert you cannot see is an
 * alert you cannot trust, which is fatal for the one feature most likely to
 * bring somebody back to the product.
 */
export default function AlertManager() {
  const alerts = useTerminal((s) => s.alerts);
  const removeAlert = useTerminal((s) => s.removeAlert);
  const navigate = useNavigate();

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Price alerts</span>
        <span className="label">{alerts.length} armed</span>
      </div>
      <div className="panel-body">
        {alerts.length === 0 ? (
          // Item 41: every empty state offers the next action.
          <p className="alert-empty">
            No alerts yet. Open any stock and use <b>ALERT +2%</b> to be told when it moves.
          </p>
        ) : (
          <ul className="alert-list">
            {alerts.map((a) => {
              const name = metaFor(a.symbol)?.name;
              const above = a.direction === "above";
              return (
                <li key={a.id} className="alert-row">
                  <button className="alert-sym" onClick={() => navigate(`/stock/${a.symbol}`)}>
                    <b>{a.symbol}</b>
                    {name && <span>{name}</span>}
                  </button>
                  <span className={`alert-dir ${above ? "up" : "down"}`}>
                    {above ? "▲ above" : "▼ below"} <span className="mono">{a.price}</span>
                  </span>
                  <button
                    className="alert-del"
                    onClick={() => removeAlert(a.id)}
                    aria-label={`Delete ${a.symbol} alert`}
                    title="Delete alert"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Recently viewed symbols — growth-plan item 78. */
export function RecentlyViewed() {
  const recent = useTerminal((s) => s.recent);
  const navigate = useNavigate();
  if (recent.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-head"><span className="panel-title">Jump back in</span></div>
      <div className="panel-body">
        <div className="recent-row">
          {recent.map((s) => (
            <button key={s} className="chip" onClick={() => navigate(`/stock/${s}`)} title={metaFor(s)?.name || s}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
