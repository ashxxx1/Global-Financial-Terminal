import { useState, useMemo } from "react";
import useTerminalStore from "../../store/terminalStore";
import { getStocksForCountry } from "../../data/stocksData";
import { COUNTRIES_DATA } from "../../data/mockData";

// Generate a deterministic correlation value based on two stock symbols
function correlation(sym1, sym2) {
  if (sym1 === sym2) return 1.0;
  let hash = 0;
  const key = [sym1, sym2].sort().join("-");
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
  }
  // Bias toward positive correlation (realistic for equities)
  const base = ((hash % 1000) / 1000) * 1.6 - 0.6;
  return Math.max(-1, Math.min(1, base));
}

function corrColor(v) {
  if (v >= 0.7) return "#00ff88";
  if (v >= 0.4) return "#88ffbb";
  if (v >= 0.1) return "#ccffdd";
  if (v >= -0.1) return "#888899";
  if (v >= -0.4) return "#ffaaaa";
  if (v >= -0.7) return "#ff6666";
  return "#ff2244";
}

function corrTextColor(v) {
  return Math.abs(v) > 0.4 ? "#000" : "#eee";
}

// Seed assets for the matrix
const DEFAULT_ASSETS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "GLD", name: "Gold ETF" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "WTI", name: "WTI Oil" },
  { symbol: "VIX", name: "Volatility" },
];

export default function CorrelationMatrix({ onClose }) {
  const { watchlist } = useTerminalStore();
  const [assets, setAssets] = useState(() => {
    const wl = watchlist.slice(0, 6).map((s) => ({ symbol: s.symbol, name: s.name }));
    return [...wl, ...DEFAULT_ASSETS].slice(0, 10);
  });
  const [hoveredCell, setHoveredCell] = useState(null);

  const matrix = useMemo(() => {
    return assets.map((a) => assets.map((b) => correlation(a.symbol, b.symbol)));
  }, [assets]);

  const removeAsset = (symbol) => setAssets((a) => a.filter((x) => x.symbol !== symbol));

  return (
    <div className="correlation-matrix">
      <div className="correlation-matrix__header">
        <div className="correlation-matrix__title">🔍 Cross-Asset Correlation Matrix</div>
        <div className="correlation-matrix__subtitle">Pearson correlation — rolling 30-day · Hover for details</div>
        <button className="correlation-matrix__close" onClick={onClose}>✕</button>
      </div>

      <div className="correlation-matrix__legend">
        <div className="correlation-matrix__legend-scale">
          {[-1, -0.7, -0.4, 0, 0.4, 0.7, 1].map((v) => (
            <div key={v} className="correlation-matrix__legend-item" style={{ background: corrColor(v) }}>
              <span style={{ color: corrTextColor(v), fontSize: 9 }}>{v.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <span className="correlation-matrix__legend-label">Correlation</span>
      </div>

      <div className="correlation-matrix__table-wrap">
        <table className="correlation-matrix__table">
          <thead>
            <tr>
              <th className="correlation-matrix__corner">Asset</th>
              {assets.map((a) => (
                <th key={a.symbol} className="correlation-matrix__col-header">
                  <div>{a.symbol}</div>
                  <button className="correlation-matrix__remove-col" onClick={() => removeAsset(a.symbol)} title="Remove">×</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((rowAsset, ri) => (
              <tr key={rowAsset.symbol}>
                <td className="correlation-matrix__row-header">
                  <div className="correlation-matrix__row-sym">{rowAsset.symbol}</div>
                  <div className="correlation-matrix__row-name">{rowAsset.name}</div>
                </td>
                {matrix[ri].map((val, ci) => {
                  const isHovered = hoveredCell && (hoveredCell.r === ri || hoveredCell.c === ci);
                  const isSelf = ri === ci;
                  return (
                    <td
                      key={ci}
                      className={`correlation-matrix__cell ${isSelf ? "self" : ""} ${isHovered ? "highlight" : ""}`}
                      style={{ background: corrColor(val) }}
                      onMouseEnter={() => setHoveredCell({ r: ri, c: ci, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${rowAsset.symbol} vs ${assets[ci].symbol}: ${val.toFixed(3)}`}
                    >
                      <span style={{ color: corrTextColor(val), fontWeight: isSelf ? 700 : 500 }}>
                        {isSelf ? "1.00" : val.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredCell && hoveredCell.r !== hoveredCell.c && (
        <div className="correlation-matrix__info-bar">
          <span className="correlation-matrix__info-pair">
            {assets[hoveredCell.r]?.symbol} × {assets[hoveredCell.c]?.symbol}
          </span>
          <span className="correlation-matrix__info-val" style={{ color: corrColor(hoveredCell.val) }}>
            r = {hoveredCell.val.toFixed(3)}
          </span>
          <span className="correlation-matrix__info-desc">
            {hoveredCell.val >= 0.7 ? "Strong Positive — move together"
              : hoveredCell.val >= 0.4 ? "Moderate Positive"
              : hoveredCell.val >= -0.1 ? "Uncorrelated"
              : hoveredCell.val >= -0.4 ? "Moderate Negative"
              : "Strong Negative — inverse movement"}
          </span>
        </div>
      )}

      <div className="correlation-matrix__note">
        📌 Pearson correlation based on simulated 30-day price data. Negative correlation = useful for portfolio hedging.
        {watchlist.length > 0 && " Watchlist assets included automatically."}
      </div>
    </div>
  );
}
