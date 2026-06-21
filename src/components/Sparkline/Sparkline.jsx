// Inline SVG sparkline — no extra deps needed
export default function Sparkline({ data, color = "#00ff88", width = 340, height = 60 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padX = 4;
  const padY = 6;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * w;
    const y = padY + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const pointsStr = points.join(" ");

  // Area fill
  const first = points[0].split(",");
  const last = points[points.length - 1].split(",");
  const areaPoints = `${first[0]},${padY + h} ${pointsStr} ${last[0]},${padY + h}`;

  const isUp = data[data.length - 1] >= data[0];
  const fillColor = isUp ? "#00ff88" : "#ff2244";
  const strokeColor = isUp ? "#00ff88" : "#ff2244";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={pointsStr}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      {(() => {
        const [lx, ly] = last;
        return (
          <circle
            cx={lx}
            cy={ly}
            r={3}
            fill={strokeColor}
            style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
          />
        );
      })()}
    </svg>
  );
}
