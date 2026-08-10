import { useState } from "react";
import { Link } from "react-router-dom";
import { allStockSymbols, metaFor } from "../../lib/market";
import { COMPARE_COLORS } from "../../lib/charts/compareColors";

interface Props {
  open: boolean;
  onClose: () => void;
  primary: string;
  selected: string[];
  onChange: (symbols: string[]) => void;
  perf?: Array<{ symbol: string; perfPct: number }>;
  /** When true, only one peer (two-stock compare). */
  lockSingle?: boolean;
}

export default function CompareMenu({
  open, onClose, primary, selected, onChange, perf, lockSingle = false,
}: Props) {
  const [q, setQ] = useState("");
  if (!open) return null;

  const maxPeers = lockSingle ? 1 : 4;

  const pool = allStockSymbols()
    .filter((s) => s !== primary)
    .filter((s) => {
      if (!q.trim()) {
        return ["AMD", "SOXX", "AAPL", "MSFT", "GOOGL", "META", "AMZN", "TSLA", "NVDA", "SPY", "QQQ"].includes(s)
          || selected.includes(s);
      }
      const m = metaFor(s);
      const qq = q.trim().toUpperCase();
      return s.includes(qq) || (m?.name || "").toUpperCase().includes(qq);
    })
    .slice(0, 24);

  const setPeer = (sym: string) => {
    if (selected.includes(sym)) {
      onChange(selected.filter((s) => s !== sym));
      return;
    }
    if (lockSingle) {
      onChange([sym]);
      return;
    }
    if (selected.length < maxPeers) onChange([...selected, sym]);
  };

  const peer = selected[0];
  const fullCompareTo = peer
    ? `/compare/${primary}/${peer}`
    : `/compare/${primary}`;

  return (
    <div className="tc-menu tc-menu-wide" role="dialog" aria-label="Compare stocks">
      <div className="tc-menu-head">
        <span className="panel-title">Compare · normalized %</span>
        <button type="button" className="chip" onClick={onClose} aria-label="Close compare">✕</button>
      </div>
      <div className="tc-menu-body">
        <p className="label" style={{ margin: 0, lineHeight: 1.45 }}>
          Overlay peers against <span className="mono">{primary}</span>. Series rebase to 0% at the window start.
        </p>

        <input
          className="tc-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticker to compare…"
          aria-label="Search compare ticker"
        />

        {perf && perf.length > 0 && (
          <div className="tc-compare-perf">
            {perf.map((p, i) => (
              <div key={p.symbol} className="tc-compare-row">
                <span className="tc-compare-row-sym">
                  <span className="tc-swatch" style={{ background: COMPARE_COLORS[i % COMPARE_COLORS.length] }} aria-hidden />
                  <span className="mono">{p.symbol}</span>
                </span>
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
                onClick={() => setPeer(s)}
                aria-pressed={on}
              >
                {s}
                <span className="label" style={{ marginLeft: 6 }}>{metaFor(s)?.name?.split(" ").slice(0, 2).join(" ")}</span>
              </button>
            );
          })}
        </div>

        <div className="tc-compare-foot">
          <p className="label" style={{ margin: 0 }}>
            {lockSingle ? "One peer on this chart" : `Up to ${maxPeers} peers`} · relative performance
          </p>
          <Link
            to={fullCompareTo}
            className="chip active"
            style={{ textDecoration: "none" }}
            onClick={onClose}
          >
            Open full compare →
          </Link>
        </div>
      </div>
    </div>
  );
}
