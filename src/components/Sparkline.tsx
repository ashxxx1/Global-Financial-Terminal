import { useMemo, useId } from "react";
import { historyFor } from "../lib/market";

/**
 * Inline price sparkline.
 *
 * Every serious market UI puts a shape next to a number — a row that reads
 * "NVDA 133.87 ▲4.37%" tells you where a stock *is*; the sparkline tells you
 * how it got there, which is the part people actually scan for.
 *
 * Renders as pure SVG from the same candle data the charts use, so there is no
 * extra fetch and no charting dependency.
 */
export default function Sparkline({
  symbol,
  width = 62,
  height = 22,
  range = "1M",
  tone,
  animate = true,
}: {
  symbol: string;
  width?: number;
  height?: number;
  range?: string;
  /** Force a colour; defaults to up/down inferred from first→last. */
  tone?: string;
  animate?: boolean;
}) {
  const uid = useId().replace(/:/g, "");

  const shape = useMemo(() => {
    const { candles } = historyFor(symbol, range);
    if (!candles || candles.length < 2) return null;

    // Downsample to keep the path light — a 62px sparkline cannot show 200 points.
    const MAX = 40;
    const step = Math.max(1, Math.floor(candles.length / MAX));
    const pts = candles.filter((_, i) => i % step === 0).map((c) => c.c);
    if (pts.length < 2) return null;

    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const pad = 2;
    const h = height - pad * 2;

    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * width;
      const y = pad + h - ((v - min) / span) * h;
      return [x, y] as const;
    });

    const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const area = `${line} L${width} ${height} L0 ${height} Z`;
    const rising = pts[pts.length - 1] >= pts[0];
    const last = coords[coords.length - 1];

    return { line, area, rising, last };
  }, [symbol, range, width, height]);

  if (!shape) return <div style={{ width, height }} aria-hidden />;

  const color = tone || (shape.rising ? "var(--up)" : "var(--down)");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={animate ? "spark" : undefined}
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={shape.area} fill={`url(#sg-${uid})`} />
      <path
        d={shape.line}
        fill="none"
        stroke={color}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "spark-line" : undefined}
      />
      {/* live head dot */}
      <circle cx={shape.last[0]} cy={shape.last[1]} r="1.9" fill={color} />
      <circle cx={shape.last[0]} cy={shape.last[1]} r="1.9" fill={color} className="spark-ping" />
    </svg>
  );
}
