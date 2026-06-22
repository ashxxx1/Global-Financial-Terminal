import { useState, useMemo } from "react";
import useTerminalStore from "../../store/terminalStore";
import CandlestickChart from "../Charts/CandlestickChart";
import AIInsights from "../AIInsights/AIInsights";
import "./StockPanel.css";

function getSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateExtendedSparkline(base, n, seedVal) {
  let arr = [...base];
  if (arr.length === 0) {
    arr = [100];
  }
  let currentSeed = seedVal;
  while (arr.length < n) {
    const last = arr[arr.length - 1];
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    const r = currentSeed / 4294967296;
    arr.push(last * (1 + (r - 0.48) * 0.015));
  }
  return arr.slice(-n);
}

const TIME_RANGES = ["1D", "1W", "1M", "3M", "1Y"];
const RANGE_MULTI = { "1D": 7, "1W": 12, "1M": 20, "3M": 40, "1Y": 80 };

function RSIBar({ value = 50 }) {
  const zone = value < 30 ? "oversold" : value > 70 ? "overbought" : "neutral";
  return (
    <div className="sp-rsi">
      <div className="sp-rsi__track">
        <div className="sp-rsi__fill" style={{ width: `${value}%` }} />
        <div className="sp-rsi__needle" style={{ left: `${value}%` }} />
      </div>
      <div className="sp-rsi__labels">
        <span>Oversold</span>
        <span className={`sp-rsi__val sp-rsi__val--${zone}`}>{value.toFixed(0)}</span>
        <span>Overbought</span>
      </div>
    </div>
  );
}

function FinancialBar({ label, value, maxValue }) {
  const pct = Math.min(100, (parseFloat(value) / parseFloat(maxValue)) * 100);
  return (
    <div className="sp-fin-bar">
      <div className="sp-fin-bar__label">{label}</div>
      <div className="sp-fin-bar__track">
        <div className="sp-fin-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="sp-fin-bar__val">{value}</div>
    </div>
  );
}

export default function StockPanel() {
  const { selectedStock, isStockPanelOpen, closeStockPanel, addToWatchlist, removeFromWatchlist, isInWatchlist } =
    useTerminalStore();
  const [activeRange, setActiveRange] = useState("1M");

  const s = selectedStock;
  const extendedSparkline = useMemo(() => {
    if (!s) return [];
    const base = s.sparkline || [];
    const n = RANGE_MULTI[activeRange] || 20;
    const seedVal = getSeed(s.symbol + activeRange);
    return generateExtendedSparkline(base, n, seedVal);
  }, [s, activeRange]);

  if (!selectedStock) return null;

  const up = s.changePct >= 0;
  const color = up ? "#00ff88" : "#ff2244";
  const inWatchlist = isInWatchlist(s.symbol, s.country);

  // Simulated technicals
  const rsi = 45 + (s.changePct || 0) * 4;
  const macdBullish = s.changePct >= 0;
  const ma50 = s.price * 0.96;
  const ma200 = s.price * 0.88;
  const priceAboveMA50 = s.price > ma50;
  const priceAboveMA200 = s.price > ma200;

  return (
    <div className={`stock-panel ${isStockPanelOpen ? "open" : ""}`}>
      {/* ── Header ── */}
      <div className="sp-header">
        <div className="sp-header__left">
          <button className="sp-back" onClick={closeStockPanel} aria-label="Close stock panel">
            ← Back
          </button>
          <div className="sp-header__info">
            <div className="sp-header__symbol">{s.symbol}</div>
            <div className="sp-header__name">{s.name}</div>
          </div>
        </div>
        <div className="sp-header__right">
          <div className="sp-header__price">{s.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <span className={`sp-header__badge ${up ? "up" : "down"}`}>
            {up ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
          </span>
          <span className="sp-header__exchange">{s.sector}</span>
        </div>
      </div>

      <div className="sp-body">
        {/* ── Chart ── */}
        <div className="sp-chart-section">
          <div className="sp-range-tabs">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                className={`sp-range-tab ${activeRange === r ? "active" : ""}`}
                onClick={() => setActiveRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="sp-chart-wrap">
            <CandlestickChart
              sparkline={extendedSparkline}
              width={660}
              height={200}
              color={color}
            />
          </div>
        </div>

        {/* ── Key Metrics ── */}
        <div className="sp-section-title">Key Metrics</div>
        <div className="sp-metrics">
          {[
            { label: "Market Cap", val: s.marketCap || "—" },
            { label: "P/E Ratio", val: s.pe ? s.pe.toFixed(1) : "N/A" },
            { label: "EPS", val: s.eps ? s.eps.toFixed(2) : "—" },
            { label: "Volume", val: s.volume || "—" },
            { label: "52W High", val: s.week52High?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—" },
            { label: "52W Low", val: s.week52Low?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—" },
          ].map((m) => (
            <div key={m.label} className="sp-metric-card">
              <div className="sp-metric-card__label">{m.label}</div>
              <div className="sp-metric-card__val">{m.val}</div>
            </div>
          ))}
        </div>

        {/* ── Technicals ── */}
        <div className="sp-section-title">Technical Analysis</div>
        <div className="sp-technicals">
          <div className="sp-tech-row">
            <span className="sp-tech-label">RSI (14)</span>
            <RSIBar value={Math.min(80, Math.max(20, rsi))} />
          </div>
          <div className="sp-tech-row sp-tech-row--signals">
            <div className={`sp-signal ${macdBullish ? "bull" : "bear"}`}>
              <span className="sp-signal__dot" />
              MACD: {macdBullish ? "Bullish Crossover" : "Bearish Crossover"}
            </div>
            <div className={`sp-signal ${priceAboveMA50 ? "bull" : "bear"}`}>
              <span className="sp-signal__dot" />
              MA50: {priceAboveMA50 ? "Price Above ↑" : "Price Below ↓"}
            </div>
            <div className={`sp-signal ${priceAboveMA200 ? "bull" : "bear"}`}>
              <span className="sp-signal__dot" />
              MA200: {priceAboveMA200 ? "Price Above ↑" : "Price Below ↓"}
            </div>
          </div>
        </div>

        {/* ── Financials ── */}
        <div className="sp-section-title">Financial Highlights</div>
        <div className="sp-financials">
          <FinancialBar label="Revenue (simulated)" value={s.marketCap || "—"} maxValue={s.marketCap || "1"} />
          <FinancialBar label="P/E vs Sector Avg" value={(s.pe || 15).toFixed(1)} maxValue={50} />
          <FinancialBar label="EPS Growth (YoY)" value={`${(s.changePct * 3 || 5).toFixed(1)}%`} maxValue={30} />
        </div>

        {/* ── AI Narrative Insights ── */}
        <AIInsights stock={s} />

        {/* ── Description ── */}
        <div className="sp-section-title">About</div>
        <div className="sp-description">{s.description}</div>

        {/* ── Watchlist button ── */}
        <div className="sp-actions">
          <button
            className={`sp-watchlist-btn ${inWatchlist ? "active" : ""}`}
            onClick={() =>
              inWatchlist ? removeFromWatchlist(s.symbol, s.country) : addToWatchlist(s)
            }
          >
            {inWatchlist ? "★ In Watchlist" : "☆ Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
