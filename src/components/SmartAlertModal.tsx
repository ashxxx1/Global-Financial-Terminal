import { useState } from "react";
import { createPortal } from "react-dom";
import { useTerminal } from "../store";

interface Props {
  symbol: string;
  currentPrice: number;
  onClose: () => void;
}

export default function SmartAlertModal({ symbol, currentPrice, onClose }: Props) {
  const { addAlert } = useTerminal();
  const [metric, setMetric] = useState("Price");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [target, setTarget] = useState(currentPrice.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(target);
    if (isNaN(val)) return;

    addAlert({
      symbol,
      metric,
      direction: condition,
      targetValue: val
    });
    onClose();
  };

  // Portalled for the same reason AccountModal is: `.route-fade` animates a
  // transform, which makes it the containing block for `position: fixed`, so a
  // modal rendered from inside a page lands against the route wrapper instead
  // of the viewport.
  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(5, 8, 14, 0.8)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div 
        className="panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: 400, maxWidth: "90vw", padding: 24 }}
      >
        <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontFamily: "var(--mono)" }}>
          Create Smart Alert: {symbol}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label" style={{ display: "block", marginBottom: 6 }}>Metric</label>
              <select 
                value={metric} 
                onChange={(e) => setMetric(e.target.value)}
                style={{ width: "100%", padding: 8, background: "var(--navy)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 4 }}
              >
                <option value="Price">Price</option>
                <option value="Volume">Volume</option>
                <option value="RSI">RSI (14d)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" style={{ display: "block", marginBottom: 6 }}>Condition</label>
              <select 
                value={condition} 
                onChange={(e) => setCondition(e.target.value as "above" | "below")}
                style={{ width: "100%", padding: 8, background: "var(--navy)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 4 }}
              >
                <option value="above">Goes Above</option>
                <option value="below">Drops Below</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" style={{ display: "block", marginBottom: 6 }}>Target Value</label>
            <input 
              type="number"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ width: "100%", padding: 8, background: "var(--navy)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 4 }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" className="chip" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="chip active blue" style={{ flex: 1, justifyContent: "center" }}>Create Alert</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
