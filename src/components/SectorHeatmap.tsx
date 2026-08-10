import { useMemo, useState } from "react";
import { allStockSymbols, quoteFor, type Quote } from "../lib/market";

/**
 * Sector heat map — the "where is the money moving" view.
 *
 * Tiles are sized by how many names the sector holds and coloured by average
 * move. Per accessibility guidance the colour never carries the meaning alone:
 * every tile prints its signed percentage, and there is a legend with real
 * scale ticks rather than a vague gradient bar.
 */

interface Cell {
  sector: string;
  avg: number;
  count: number;
  best: Quote | null;
  worst: Quote | null;
}

/** Map a percentage move onto the up/down ramp. ±3% saturates. */
function heatColor(pct: number): string {
  const t = Math.max(-1, Math.min(1, pct / 3));
  const a = 0.10 + Math.abs(t) * 0.62;
  return t >= 0 ? `rgba(38, 208, 124, ${a.toFixed(3)})` : `rgba(255, 77, 94, ${a.toFixed(3)})`;
}

export default function SectorHeatmap({ onOpen }: { onOpen?: (s: string) => void }) {
  const [hover, setHover] = useState<Cell | null>(null);

  const cells = useMemo<Cell[]>(() => {
    const bySector = new Map<string, Quote[]>();
    for (const s of allStockSymbols()) {
      const q = quoteFor(s);
      if (!q?.sector) continue;
      const list = bySector.get(q.sector) || [];
      list.push(q);
      bySector.set(q.sector, list);
    }
    return [...bySector.entries()]
      .map(([sector, qs]) => {
        const sorted = [...qs].sort((a, b) => b.changePct - a.changePct);
        return {
          sector,
          avg: qs.reduce((n, q) => n + q.changePct, 0) / qs.length,
          count: qs.length,
          best: sorted[0] ?? null,
          worst: sorted[sorted.length - 1] ?? null,
        };
      })
      .filter((c) => c.count >= 2)
      .sort((a, b) => b.avg - a.avg);
  }, []);

  if (!cells.length) return null;

  const maxCount = Math.max(...cells.map((c) => c.count));

  return (
    <div className="panel heatmap-panel">
      <div className="panel-head">
        <span className="panel-title">Sector heat map</span>
        <span className="label">{cells.length} SECTORS · AVG 1D %</span>
      </div>

      <div className="heat-grid">
        {cells.map((c, i) => (
          <button
            key={c.sector}
            className="heat-cell fade-in"
            style={{
              background: heatColor(c.avg),
              gridColumn: `span ${c.count > maxCount * 0.6 ? 2 : 1}`,
              animationDelay: `${Math.min(i * 22, 400)}ms`,
            }}
            onMouseEnter={() => setHover(c)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(c)}
            onBlur={() => setHover(null)}
            onClick={() => c.best && onOpen?.(c.best.symbol)}
            aria-label={`${c.sector}, ${c.count} names, average ${c.avg >= 0 ? "up" : "down"} ${Math.abs(c.avg).toFixed(2)} percent`}
          >
            <span className="heat-name">{c.sector}</span>
            <span className="heat-val mono">
              {c.avg >= 0 ? "+" : "−"}{Math.abs(c.avg).toFixed(2)}%
            </span>
            <span className="heat-count mono">{c.count}</span>
          </button>
        ))}
      </div>

      {/* Legend with real ticks — a bare gradient tells you nothing. */}
      <div className="heat-legend">
        <span className="label">COOLER</span>
        <div className="heat-ramp">
          {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
            <span key={v} style={{ background: heatColor(v) }} title={`${v > 0 ? "+" : ""}${v}%`} />
          ))}
        </div>
        <span className="label">HOTTER</span>
        <span className="heat-ticks mono">−3% · 0 · +3%</span>
      </div>

      <div className="heat-readout" aria-live="polite">
        {hover ? (
          <>
            <b>{hover.sector}</b>
            <span className="mono" style={{ color: hover.avg >= 0 ? "var(--up)" : "var(--down)" }}>
              {hover.avg >= 0 ? "+" : ""}{hover.avg.toFixed(2)}%
            </span>
            <span className="label">{hover.count} NAMES</span>
            {hover.best && (
              <span className="label">
                BEST <span className="up">{hover.best.symbol} {hover.best.changePct >= 0 ? "+" : ""}{hover.best.changePct.toFixed(2)}%</span>
              </span>
            )}
            {hover.worst && (
              <span className="label">
                WORST <span className="down">{hover.worst.symbol} {hover.worst.changePct.toFixed(2)}%</span>
              </span>
            )}
          </>
        ) : (
          <span className="label">HOVER A SECTOR FOR DETAIL · CLICK TO OPEN ITS LEADER</span>
        )}
      </div>
    </div>
  );
}
