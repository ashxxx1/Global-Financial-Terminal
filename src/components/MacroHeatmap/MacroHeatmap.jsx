import { useState, useMemo } from "react";
import useTerminalStore from "../../store/terminalStore";
import { COUNTRIES_DATA } from "../../data/mockData";

const COUNTRIES = Object.values(COUNTRIES_DATA);

function getColor(pct) {
  if (pct > 2) return "#00ff88";
  if (pct > 0.5) return "#4dff9e";
  if (pct > 0) return "#a0ffcc";
  if (pct > -0.5) return "#ffa0a0";
  if (pct > -2) return "#ff6060";
  return "#ff2244";
}

function darken(hex, amount = 0.3) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

// Simple treemap layout algorithm
function computeTreemap(items, width, height) {
  function slice(items, x, y, w, h) {
    const totalW = items.reduce((s, i) => s + i.weight, 0);
    let result = [];
    if (w > h) {
      // Horizontal slice
      let cx = x;
      items.forEach((item) => {
        const iw = (item.weight / totalW) * w;
        result.push({ ...item, x: cx, y, w: iw, h });
        cx += iw;
      });
    } else {
      // Vertical slice
      let cy = y;
      items.forEach((item) => {
        const ih = (item.weight / totalW) * h;
        result.push({ ...item, x, y: cy, w, h: ih });
        cy += ih;
      });
    }
    return result;
  }
  // Group into approximate "rows" for squarified layout
  return slice(items, 0, 0, width, height);
}

const MODES = [
  { id: "performance", label: "Performance %" },
  { id: "volume", label: "Volatility" },
  { id: "gdp", label: "GDP Weight" },
];

const GDP_WEIGHTS = {
  US: 25.4, CN: 17.9, JP: 4.2, DE: 4.0, GB: 3.1, IN: 3.6, FR: 2.8, IT: 2.1, CA: 2.0, KR: 1.8,
  AU: 1.7, BR: 2.2, RU: 1.8, MX: 1.4, ES: 1.4, NL: 1.0, CH: 0.8, AR: 0.6, SE: 0.6, NO: 0.5,
  DK: 0.4, PL: 0.7, CL: 0.4, CO: 0.4, NZ: 0.3,
};

export default function MacroHeatmap({ onClose }) {
  const [mode, setMode] = useState("performance");
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
  const { setSelectedCountry } = useTerminalStore();

  const W = 900, H = 520;

  const items = useMemo(() => {
    return COUNTRIES.map((c) => {
      let weight;
      if (mode === "performance") weight = 2 + Math.abs(c.indexChangePct) * 3;
      else if (mode === "volume") weight = 1 + (c.newsIntensity || 0.5) * 8;
      else weight = GDP_WEIGHTS[c.code] || 0.5;
      return {
        ...c,
        weight: Math.max(weight, 0.5),
        displayPct: c.indexChangePct,
        color: getColor(c.indexChangePct),
      };
    }).sort((a, b) => b.weight - a.weight);
  }, [mode]);

  const cells = useMemo(() => computeTreemap(items, W, H), [items, W, H]);

  return (
    <div className="macro-heatmap">
      <div className="macro-heatmap__header">
        <div className="macro-heatmap__title">
          <span>🌡️</span>
          <span>Global Macro Heatmap</span>
        </div>
        <div className="macro-heatmap__controls">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`macro-heatmap__mode-btn ${mode === m.id ? "active" : ""}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
          <button className="macro-heatmap__close" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      <div className="macro-heatmap__legend">
        <span style={{ color: "#ff2244" }}>▼ &lt;-2%</span>
        <span style={{ color: "#ff6060" }}>▼ -2% to -0.5%</span>
        <span style={{ color: "#888" }}>◆ Flat</span>
        <span style={{ color: "#4dff9e" }}>▲ 0.5% to 2%</span>
        <span style={{ color: "#00ff88" }}>▲ &gt;2%</span>
      </div>

      <div
        className="macro-heatmap__canvas-wrap"
        style={{ position: "relative", width: W, height: H, margin: "0 auto" }}
      >
        <svg width={W} height={H} style={{ display: "block" }}>
          {cells.map((cell) => {
            const pad = 2;
            const fx = cell.x + pad, fy = cell.y + pad;
            const fw = cell.w - pad * 2, fh = cell.h - pad * 2;
            if (fw < 2 || fh < 2) return null;
            const textVisible = fw > 36 && fh > 28;
            const pct = cell.displayPct;
            const isHovered = hoveredCountry?.code === cell.code;
            return (
              <g
                key={cell.code}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedCountry(cell)}
                onMouseEnter={(e) => {
                  setHoveredCountry(cell);
                  setTooltip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
                }}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                <rect
                  x={fx} y={fy} width={fw} height={fh}
                  rx={4}
                  fill={cell.color}
                  opacity={isHovered ? 1 : 0.82}
                  stroke={isHovered ? "#fff" : darken(cell.color)}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ transition: "opacity 0.15s, stroke 0.15s" }}
                />
                {textVisible && (
                  <>
                    <text
                      x={fx + fw / 2}
                      y={fy + fh / 2 - (fh > 48 ? 8 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={Math.abs(pct) > 0.5 ? "#000" : "#eee"}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize={Math.min(14, fw / 4)}
                      fontWeight="700"
                    >
                      {cell.code}
                    </text>
                    {fh > 48 && (
                      <text
                        x={fx + fw / 2}
                        y={fy + fh / 2 + 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={Math.abs(pct) > 0.5 ? "#000" : "#ccc"}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={Math.min(11, fw / 5)}
                      >
                        {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredCountry && (
          <div
            className="macro-heatmap__tooltip"
            style={{
              left: Math.min(tooltip.x + 12, W - 220),
              top: Math.max(tooltip.y - 80, 0),
            }}
          >
            <div className="macro-heatmap__tooltip-name">{hoveredCountry.name}</div>
            <div className="macro-heatmap__tooltip-index">{hoveredCountry.marketIndex}</div>
            <div className="macro-heatmap__tooltip-row">
              <span>Index</span>
              <span>{hoveredCountry.indexValue?.toLocaleString()}</span>
            </div>
            <div className="macro-heatmap__tooltip-row">
              <span>Change</span>
              <span className={hoveredCountry.indexChangePct >= 0 ? "up" : "down"}>
                {hoveredCountry.indexChangePct >= 0 ? "+" : ""}{hoveredCountry.indexChangePct?.toFixed(2)}%
              </span>
            </div>
            <div className="macro-heatmap__tooltip-row">
              <span>Currency</span>
              <span>{hoveredCountry.currency}</span>
            </div>
            <div className="macro-heatmap__tooltip-hint">Click to open market panel</div>
          </div>
        )}
      </div>
    </div>
  );
}
