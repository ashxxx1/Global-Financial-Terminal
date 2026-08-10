import { useEffect, useMemo, useRef, useState } from "react";
import { allStockSymbols, quoteFor } from "../lib/market";

/**
 * Market pulse — a risk gauge built from breadth and average move.
 *
 * A single number for "how is the market feeling" is the thing people look at
 * first and the thing a table of quotes cannot give them. The needle eases to
 * its new value rather than jumping, so a shift in regime reads as movement.
 */

const BANDS = [
  { max: 20,  label: "Extreme fear",  color: "#FF4D5E" },
  { max: 40,  label: "Fear",          color: "#FF8A4D" },
  { max: 60,  label: "Neutral",       color: "#E7B429" },
  { max: 80,  label: "Greed",         color: "#7FD98A" },
  { max: 101, label: "Extreme greed", color: "#26D07C" },
];

function bandFor(v: number) {
  return BANDS.find((b) => v < b.max) ?? BANDS[BANDS.length - 1];
}

/** Polar → cartesian on a 180° arc (180° = left, 0° = right). */
function pt(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)] as const;
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = pt(cx, cy, r, from);
  const [x2, y2] = pt(cx, cy, r, to);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default function PulseGauge() {
  const target = useMemo(() => {
    let adv = 0, dec = 0, sum = 0, n = 0;
    for (const s of allStockSymbols()) {
      const q = quoteFor(s);
      if (!q) continue;
      n++;
      sum += q.changePct;
      if (q.changePct > 0) adv++; else if (q.changePct < 0) dec++;
    }
    if (!n) return 50;
    // Blend breadth (how many are up) with intensity (how hard they moved).
    const breadth = (adv / (adv + dec || 1)) * 100;
    const intensity = Math.max(0, Math.min(100, 50 + (sum / n) * 22));
    return Math.round(breadth * 0.62 + intensity * 0.38);
  }, []);

  // Ease the needle toward the target instead of snapping.
  const [value, setValue] = useState(target);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    const from = value;
    const t0 = performance.now();
    const dur = 900;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      setValue(from + (target - from) * ease(t));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const W = 240, H = 138, CX = W / 2, CY = 118, R = 92;
  const band = bandFor(value);
  const angle = 180 - (value / 100) * 180;
  const [nx, ny] = pt(CX, CY, R - 34, angle);

  return (
    <div className="panel gauge-panel">
      <div className="panel-head">
        <span className="panel-title">Market pulse</span>
        <span className="label" style={{ color: band.color }}>{band.label.toUpperCase()}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="gauge-svg" role="img"
           aria-label={`Market pulse ${Math.round(value)} out of 100 — ${band.label}`}>
        {/* band track */}
        {BANDS.map((b, i) => {
          const from = 180 - ((i === 0 ? 0 : BANDS[i - 1].max) / 100) * 180;
          const to = 180 - (Math.min(b.max, 100) / 100) * 180;
          return (
            <path key={b.label} d={arc(CX, CY, R, from, to)} stroke={b.color}
                  strokeWidth="11" fill="none" strokeLinecap="butt" opacity="0.34" />
          );
        })}
        {/* active arc up to the value */}
        <path d={arc(CX, CY, R, 180, angle)} stroke={band.color} strokeWidth="11"
              fill="none" strokeLinecap="round" className="gauge-active" />

        {/* ticks */}
        {[0, 25, 50, 75, 100].map((v) => {
          const a = 180 - (v / 100) * 180;
          const [x1, y1] = pt(CX, CY, R + 9, a);
          const [x2, y2] = pt(CX, CY, R + 14, a);
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--faint)" strokeWidth="1.2" />;
        })}

        {/* needle */}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={band.color} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="6" fill="var(--navy-2)" stroke={band.color} strokeWidth="2" />

        <text x={CX} y={CY - 46} textAnchor="middle" className="gauge-num" fill={band.color}>
          {Math.round(value)}
        </text>
        <text x={CX} y={CY - 30} textAnchor="middle" className="gauge-cap">/ 100</text>
      </svg>

      <div className="gauge-scale">
        <span className="label">FEAR</span>
        <span className="label">NEUTRAL</span>
        <span className="label">GREED</span>
      </div>
    </div>
  );
}
