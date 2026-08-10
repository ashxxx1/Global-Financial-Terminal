import { useMemo, useState } from "react";
import { useTerminal } from "../store";

export default function OptionsChain({ currentPrice }: { symbol: string; currentPrice: number }) {
  const nerdMode = useTerminal((s) => s.nerdMode);
  const [expiry, setExpiry] = useState(0);

  // Generate deterministic options data around the current price
  const strikes = useMemo(() => {
    const base = Math.round(currentPrice);
    const step = base > 100 ? 5 : base > 20 ? 1 : 0.5;
    const arr = [];
    for (let i = -10; i <= 10; i++) {
      arr.push(base + i * step);
    }
    return arr;
  }, [currentPrice]);

  const dates = ["Nov 15, 2026", "Nov 22, 2026", "Dec 20, 2026", "Jan 15, 2027"];

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-head">
        <span className="panel-title">Options Chain <span className="demo-tag">SIM</span></span>
        <div style={{ display: "flex", gap: 8 }}>
          {dates.map((d, i) => (
            <button
              key={d}
              className={`chip ${i === expiry ? "active blue" : ""}`}
              onClick={() => setExpiry(i)}
              style={{ fontSize: 9.5, padding: "3px 8px" }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0, overflowX: "auto" }}>
        <table className="tbl" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th colSpan={nerdMode ? 2 : 4} style={{ textAlign: "center", borderRight: "1px solid var(--line-strong)" }}>CALLS</th>
              <th style={{ textAlign: "center", width: 80 }}>STRIKE</th>
              <th colSpan={nerdMode ? 2 : 4} style={{ textAlign: "center", borderLeft: "1px solid var(--line-strong)" }}>PUTS</th>
            </tr>
            <tr>
              <th className="num">Bid</th>
              <th className="num">Ask</th>
              {!nerdMode && <th className="num">Vol</th>}
              {!nerdMode && <th className="num" style={{ borderRight: "1px solid var(--line-strong)" }}>IV</th>}
              <th style={{ textAlign: "center" }}></th>
              {!nerdMode && <th className="num" style={{ borderLeft: "1px solid var(--line-strong)" }}>IV</th>}
              {!nerdMode && <th className="num">Vol</th>}
              <th className="num">Bid</th>
              <th className="num">Ask</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((strike) => {
              // Deterministic pricing logic
              const dist = strike - currentPrice;
              const callIntrinsic = Math.max(0, -dist);
              const putIntrinsic = Math.max(0, dist);
              
              const timeValue = Math.max(0.1, (20 - Math.abs(dist)) * 0.1 * (expiry + 1));
              const callPrice = callIntrinsic + timeValue;
              const putPrice = putIntrinsic + timeValue;

              const iv = (25 + (Math.abs(dist) / currentPrice) * 100 + expiry * 2).toFixed(1);
              const volC = Math.floor(Math.max(0, 5000 - Math.abs(dist) * 100));
              const volP = Math.floor(Math.max(0, 4500 - Math.abs(dist) * 100));

              return (
                <tr key={strike}>
                  <td className="num" style={{ color: callIntrinsic > 0 ? "var(--up)" : "var(--text)" }}>{(callPrice * 0.98).toFixed(2)}</td>
                  <td className="num" style={{ color: callIntrinsic > 0 ? "var(--up)" : "var(--text)" }}>{(callPrice * 1.02).toFixed(2)}</td>
                  {!nerdMode && <td className="num" style={{ color: "var(--faint)" }}>{volC}</td>}
                  {!nerdMode && <td className="num" style={{ color: "var(--faint)", borderRight: "1px solid var(--line)" }}>{iv}%</td>}
                  
                  <td className="num" style={{ textAlign: "center", fontWeight: 700, background: "rgba(10, 16, 27, 0.4)" }}>
                    {strike.toFixed(2)}
                  </td>
                  
                  {!nerdMode && <td className="num" style={{ color: "var(--faint)", borderLeft: "1px solid var(--line)" }}>{iv}%</td>}
                  {!nerdMode && <td className="num" style={{ color: "var(--faint)" }}>{volP}</td>}
                  <td className="num" style={{ color: putIntrinsic > 0 ? "var(--down)" : "var(--text)" }}>{(putPrice * 0.98).toFixed(2)}</td>
                  <td className="num" style={{ color: putIntrinsic > 0 ? "var(--down)" : "var(--text)" }}>{(putPrice * 1.02).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
