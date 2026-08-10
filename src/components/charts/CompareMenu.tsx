import { useState } from "react";
import { allStockSymbols, metaFor } from "../../lib/market";

interface Props {
  open: boolean;
  onClose: () => void;
  primary: string;
  selected: string[];
  onChange: (symbols: string[]) => void;
  perf?: Array<{ symbol: string; perfPct: number }>;
}

export default function CompareMenu({ open, onClose, primary, selected, onChange, perf }: Props) {
  const [q, setQ] = useState("");
  if (!open) return null;

  const pool = allStockSymbols()
    .filter((s) => s !== primary)
    .filter((s) => {
      if (!q.trim()) return ["AMD", "SOXX", "AAPL", "MSFT", "GOOGL", "META", "AMZN", "TSLA", "NVDA", "SPY", "QQQ"].includes(s) || selected.includes(s);
      const m = metaFor(s);
      const qq = q.trim().toUpperCase();
      return s.includes(qq) || (m?.name || "").toUpperCase().includes(qq);
    })
    .slice(0, 24);

  const toggle = (sym: string) => {
    if (selected.includes(sym)) onChange(selected.filter((s) => s !== sym));
    else if (selected.length < 4) onChange([...selected, sym]);
  };

  return (
    <div className="tc-menu tc-menu-wide" role="dialog" aria-label="Compare assets">
      <div className="tc-menu-head">
        <span className="panel-title">Compare · normalized %</span>
        <button type="button" className="chip" onClick={onClose} aria-label="Close compare">✕</button>
      </div>
      <div className="tc-menu-body">
        <input
          className="tc-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticker…"
          aria-label="Search compare ticker"
        />
        {perf && perf.length > 0 && (
          <div className="tc-compare-perf">
            {perf.map((p) => (
              <div key={p.symbol} className="tc-compare-row">
                <span className="mono">{p.symbol}</span>
                <span className={`mono ${p.perfPct >= 0 ? "up" : "down"}`}>
                  {p.perfPct >= 0 ? "+" : ""}{p.perfPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="tc-compare-list">
          {pool.map((s) => {
            const on = selected.includes(s);
            return (
              <button
                key={s}
                type="button"
                className={`chip tc-compare-chip ${on ? "active" : ""}`}
                onClick={() => toggle(s)}
                aria-pressed={on}
              >
                {s}
                <span className="label" style={{ marginLeft: 6 }}>{metaFor(s)?.name?.split(" ").slice(0, 2).join(" ")}</span>
              </button>
            );
          })}
        </div>
        <p className="label">Up to 4 peers · performance rebased to 0% at window start</p>
      </div>
    </div>
  );
}
