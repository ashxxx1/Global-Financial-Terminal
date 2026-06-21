import { useMemo } from "react";

function generateCandlestickData(sparkline, count = 30) {
  const candles = [];
  let price = sparkline[0] || 100;
  const trend = (sparkline[sparkline.length - 1] - sparkline[0]) / count;

  for (let i = 0; i < count; i++) {
    const open = price;
    const move = (Math.random() - 0.48) * price * 0.018 + trend;
    const close = open + move;
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    candles.push({ open, close, high, low, index: i });
    price = close;
  }
  return candles;
}

export default function CandlestickChart({ sparkline = [], width = 600, height = 200, color = "#00ff88" }) {
  const candles = useMemo(() => generateCandlestickData(sparkline, 30), [sparkline.join(",")]);

  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;

  const pad = { t: 10, b: 20, l: 8, r: 8 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const candleW = Math.max(2, (innerW / candles.length) * 0.6);
  const gap = innerW / candles.length;

  const toY = (v) => pad.t + innerH - ((v - minP) / range) * innerH;
  const toX = (i) => pad.l + i * gap + gap / 2;

  const isUp = (c) => c.close >= c.open;

  // Area path (using close prices)
  const pts = candles.map((c, i) => `${toX(i)},${toY(c.close)}`);
  const areaPath = `M${pts.join("L")}L${toX(candles.length - 1)},${pad.t + innerH}L${toX(0)},${pad.t + innerH}Z`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`cc-area-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill={`url(#cc-area-${color.replace("#","")})`} />
      {/* Candles */}
      {candles.map((c, i) => {
        const up = isUp(c);
        const col = up ? "#00ff88" : "#ff2244";
        const x = toX(i);
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        return (
          <g key={i}>
            {/* Wick */}
            <line x1={x} x2={x} y1={toY(c.high)} y2={toY(c.low)} stroke={col} strokeWidth={0.8} strokeOpacity={0.7} />
            {/* Body */}
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={bodyH}
              fill={up ? "rgba(0,255,136,0.55)" : "rgba(255,34,68,0.55)"}
              stroke={col}
              strokeWidth={0.5}
              rx={0.5}
            />
          </g>
        );
      })}
      {/* Price labels */}
      <text x={pad.l} y={pad.t + 8} fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
        {maxP.toFixed(2)}
      </text>
      <text x={pad.l} y={pad.t + innerH} fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
        {minP.toFixed(2)}
      </text>
    </svg>
  );
}
