import { useEffect, useRef, useState } from "react";
import { useHistory } from "../lib/hooks";

/**
 * A real price series, drawn in monochrome, that draws itself in on reveal.
 *
 * Not a decorative squiggle: the candles come from the same history engine the
 * stock pages use, so the shape on the landing page is the shape in the product.
 * The line strokes on via stroke-dasharray (GPU-cheap, no per-frame JS), the
 * area fades up behind it, and the last point keeps a slow pulse so the chart
 * reads as live rather than as a screenshot.
 */
export default function MonoChart({
  symbol = "AAPL",
  range = "3M",
  height = 220,
  label,
}: { symbol?: string; range?: string; height?: number; label?: string }) {
  const { candles } = useHistory(symbol, range);
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || drawn || candles.length === 0) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDrawn(true); return; }
    const io = new IntersectionObserver(
      (entries, obs) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        setDrawn(true);
        obs.disconnect();
      }),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [drawn, candles.length]);

  if (candles.length === 0) {
    return <div className="mc-skeleton" style={{ height }} aria-hidden />;
  }

  const W = 1000;
  const H = height;
  const PAD = 6;
  const closes = candles.map((c) => c.c);
  const lo = Math.min(...closes);
  const hi = Math.max(...closes);
  const x = (i: number) => (i / (closes.length - 1)) * W;
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD * 2);

  const line = closes.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const lastX = x(closes.length - 1);
  const lastY = y(closes[closes.length - 1]);
  const up = closes[closes.length - 1] >= closes[0];
  const pct = (((closes[closes.length - 1] - closes[0]) / (closes[0] || 1)) * 100).toFixed(2);

  return (
    <figure className="mc">
      <figcaption className="mc-head">
        <span className="mc-sym">{label ?? symbol}</span>
        <span className="mc-meta">
          {range} · <span className={up ? "mc-up" : "mc-down"}>{up ? "+" : ""}{pct}%</span>
        </span>
      </figcaption>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className={`mc-svg ${up ? "up" : "down"} ${drawn ? "drawn" : ""}`}
        preserveAspectRatio="none"
        style={{ height }}
        role="img"
        aria-label={`${label ?? symbol} price history, ${range}, ${up ? "up" : "down"} ${pct} percent`}
      >
        <defs>
          <linearGradient id={`mcf-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* hairline rules — the Swiss grid, not a chart junk gridline */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)}
            className="mc-rule" />
        ))}
        <path d={area} fill={`url(#mcf-${symbol})`} className="mc-area" />
        <path d={line} className="mc-line" vectorEffect="non-scaling-stroke" />
        <circle cx={lastX} cy={lastY} r="3.5" className="mc-dot" vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
