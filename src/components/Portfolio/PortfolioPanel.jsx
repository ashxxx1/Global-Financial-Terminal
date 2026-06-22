import { useState, useEffect, useMemo } from "react";
import useTerminalStore from "../../store/terminalStore";

const STARTING_CAPITAL = 100000;

function PieChart({ slices }) {
  let cumulativeAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 65, inner = 40;
  const paths = slices.map((s) => {
    if (s.pct <= 0) return null;
    const angle = (s.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumulativeAngle);
    const y1 = cy + r * Math.sin(cumulativeAngle);
    const x2 = cx + r * Math.cos(cumulativeAngle + angle);
    const y2 = cy + r * Math.sin(cumulativeAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const xi1 = cx + inner * Math.cos(cumulativeAngle);
    const yi1 = cy + inner * Math.sin(cumulativeAngle);
    const xi2 = cx + inner * Math.cos(cumulativeAngle + angle);
    const yi2 = cy + inner * Math.sin(cumulativeAngle + angle);
    const d = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
    cumulativeAngle += angle;
    return { d, color: s.color, symbol: s.symbol };
  });

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {paths.filter(Boolean).map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      ))}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text-secondary)" fontSize={9} fontFamily="JetBrains Mono, monospace">PORTFOLIO</text>
    </svg>
  );
}

const COLORS = ["#00ff88", "#00aaff", "#aa55ff", "#ffaa00", "#ff6b35", "#ff2244", "#00d4ff", "#ffd700", "#4dff9e", "#ff88cc"];

export default function PortfolioPanel({ onClose }) {
  const { watchlist } = useTerminalStore();
  const [positions, setPositions] = useState({});
  const [inputVals, setInputVals] = useState({});

  // Simulate live price movements
  const [livePrices, setLivePrices] = useState(() => {
    const m = {};
    watchlist.forEach((s) => { m[s.symbol + "_" + s.country] = s.price; });
    return m;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const drift = (Math.random() - 0.5) * 0.003 * next[key];
          next[key] = Math.max(0.01, next[key] + drift);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [watchlist]);

  const totalAllocated = Object.values(positions).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const cash = STARTING_CAPITAL - totalAllocated;
  const cashPct = Math.max(0, (cash / STARTING_CAPITAL) * 100);

  const positionList = useMemo(() => {
    return watchlist.map((s, idx) => {
      const key = s.symbol + "_" + s.country;
      const allocated = parseFloat(positions[key] || 0);
      const buyPrice = s.price;
      const currentPrice = livePrices[key] || buyPrice;
      const pct = allocated > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;
      const pnl = allocated > 0 ? (pct / 100) * allocated : 0;
      const shares = buyPrice > 0 && allocated > 0 ? allocated / buyPrice : 0;
      const pctOfPortfolio = (allocated / STARTING_CAPITAL) * 100;
      return { ...s, key, allocated, currentPrice, pct, pnl, shares, pctOfPortfolio, color: COLORS[idx % COLORS.length] };
    }).filter((p) => p.allocated > 0);
  }, [watchlist, positions, livePrices]);

  const totalPnL = positionList.reduce((s, p) => s + p.pnl, 0);
  const currentValue = STARTING_CAPITAL + totalPnL;

  function setAllocation(key, val) {
    const num = parseFloat(val) || 0;
    const existing = parseFloat(positions[key] || 0);
    const otherAllocated = totalAllocated - existing;
    const capped = Math.min(num, STARTING_CAPITAL - otherAllocated);
    setPositions((prev) => ({ ...prev, [key]: capped }));
  }

  const pieSlices = [
    ...positionList.map((p) => ({ symbol: p.symbol, pct: p.pctOfPortfolio, color: p.color })),
    { symbol: "CASH", pct: cashPct, color: "rgba(100,100,130,0.5)" },
  ];

  return (
    <div className="portfolio-panel">
      <div className="portfolio-panel__header">
        <div className="portfolio-panel__title">📊 Portfolio Simulator</div>
        <div className="portfolio-panel__capital">Starting Capital: <strong>${STARTING_CAPITAL.toLocaleString()}</strong></div>
        <button className="portfolio-panel__close" onClick={onClose}>✕</button>
      </div>

      <div className="portfolio-panel__summary">
        <div className="portfolio-panel__summary-card">
          <div className="portfolio-panel__summary-label">Portfolio Value</div>
          <div className="portfolio-panel__summary-val">${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="portfolio-panel__summary-card">
          <div className="portfolio-panel__summary-label">Total P&L</div>
          <div className={`portfolio-panel__summary-val ${totalPnL >= 0 ? "up" : "down"}`}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span style={{ fontSize: 11, marginLeft: 6 }}>
              ({totalPnL >= 0 ? "+" : ""}{((totalPnL / STARTING_CAPITAL) * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="portfolio-panel__summary-card">
          <div className="portfolio-panel__summary-label">Cash Available</div>
          <div className="portfolio-panel__summary-val">${Math.max(0, cash).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="portfolio-panel__summary-card">
          <div className="portfolio-panel__summary-label">Positions</div>
          <div className="portfolio-panel__summary-val">{positionList.length}</div>
        </div>
      </div>

      <div className="portfolio-panel__body">
        <div className="portfolio-panel__chart-section">
          <PieChart slices={pieSlices} />
          <div className="portfolio-panel__legend">
            {positionList.map((p) => (
              <div key={p.key} className="portfolio-panel__legend-item">
                <span className="portfolio-panel__legend-dot" style={{ background: p.color }} />
                <span>{p.symbol}</span>
                <span className="portfolio-panel__legend-pct">{p.pctOfPortfolio.toFixed(1)}%</span>
              </div>
            ))}
            <div className="portfolio-panel__legend-item">
              <span className="portfolio-panel__legend-dot" style={{ background: "rgba(100,100,130,0.5)" }} />
              <span>Cash</span>
              <span className="portfolio-panel__legend-pct">{cashPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="portfolio-panel__positions">
          <div className="portfolio-panel__positions-header">Allocate Watchlist Positions</div>
          {watchlist.length === 0 ? (
            <div className="portfolio-panel__empty">Add stocks to your watchlist first, then allocate capital here.</div>
          ) : (
            watchlist.map((s, idx) => {
              const key = s.symbol + "_" + s.country;
              const pos = positionList.find((p) => p.key === key);
              return (
                <div key={key} className="portfolio-panel__position-row">
                  <div className="portfolio-panel__pos-info">
                    <div className="portfolio-panel__pos-sym" style={{ color: COLORS[idx % COLORS.length] }}>{s.symbol}</div>
                    <div className="portfolio-panel__pos-name">{s.name.slice(0, 18)}</div>
                  </div>
                  <div className="portfolio-panel__pos-price">${(livePrices[key] || s.price).toFixed(2)}</div>
                  <div className="portfolio-panel__pos-alloc">
                    <span className="portfolio-panel__pos-alloc-prefix">$</span>
                    <input
                      className="portfolio-panel__pos-input"
                      type="number"
                      min="0"
                      step="100"
                      max={STARTING_CAPITAL}
                      value={inputVals[key] !== undefined ? inputVals[key] : (positions[key] || "")}
                      onChange={(e) => setInputVals((v) => ({ ...v, [key]: e.target.value }))}
                      onBlur={(e) => { setAllocation(key, e.target.value); setInputVals((v) => ({ ...v, [key]: undefined })); }}
                      placeholder="0"
                    />
                  </div>
                  {pos && (
                    <div className={`portfolio-panel__pos-pnl ${pos.pnl >= 0 ? "up" : "down"}`}>
                      {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                      <span> ({pos.pct >= 0 ? "+" : ""}{pos.pct.toFixed(2)}%)</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="portfolio-panel__disclaimer">
        ⚠️ Simulated portfolio only — no real trades are executed. P&L is based on live simulated price movements from your watchlist base prices.
      </div>
    </div>
  );
}
