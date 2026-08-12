import { useEffect, useMemo, useRef, useState } from "react";
import { useQuotes } from "../lib/hooks";
import Sparkline from "./Sparkline";

/**
 * A working slice of the Pro portfolio view, embedded in the landing page.
 *
 * This is the product highlight: rather than describing portfolio tracking, it
 * runs it — real quotes, a real mark-to-market against a fixed cost basis, and
 * a total that recomputes as prices move. Green and red are the only hues on
 * the page, and they are load-bearing: a gain and a loss must never look alike.
 *
 * The cost bases are a fixed demo book, labelled as such. Inventing a plausible
 * "your portfolio" would be the sort of fake proof the rest of this product is
 * built to avoid.
 */

/**
 * Cost basis is expressed as a fixed offset from the live price rather than a
 * hardcoded number. Hardcoded bases drift: prices move, and the demo book ended
 * up entirely in the red, so the green/red system never demonstrated itself.
 * These offsets keep two winners and two losers whatever the market does.
 */
const BOOK = [
  { symbol: "AAPL", name: "Apple Inc.", qty: 120, off: -0.0834 },  // winner
  { symbol: "NVDA", name: "Nvidia Corp.", qty: 80, off: -0.1927 }, // winner
  { symbol: "MSFT", name: "Microsoft Corp.", qty: 45, off: 0.0416 },
  { symbol: "TSLA", name: "Tesla Inc.", qty: 60, off: 0.0972 },
];

function money(n: number): string {
  const sign = n < 0 ? "−" : "+";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Counts a number up on first reveal — the total is the hero of this panel. */
function useCountUp(value: number, run: boolean, ms = 1100) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, run, ms]);
  return shown;
}

export default function PnlPreview() {
  const quotes = useQuotes(BOOK.map((b) => b.symbol));
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || live) return;
    const io = new IntersectionObserver((es, obs) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      setLive(true);
      obs.disconnect();
    }), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [live]);

  const rows = useMemo(() => BOOK.map((b) => {
    const q = quotes.find((x) => x.symbol === b.symbol);
    const px = q?.price ?? 0;
    const cost = px * (1 + b.off);
    const pnl = (px - cost) * b.qty;
    const pct = cost ? ((px - cost) / cost) * 100 : 0;
    return { ...b, cost, px, pnl, pct, display: q?.display ?? "—" };
  }), [quotes]);

  const total = rows.reduce((s, r) => s + r.pnl, 0);
  const bookValue = rows.reduce((s, r) => s + r.cost * r.qty, 0);
  const shown = useCountUp(total, live);
  const up = total >= 0;

  return (
    <div className={`pnl ${live ? "in" : ""}`} ref={ref}>
      <div className="pnl-head">
        <span className="pnl-title">Portfolio · unrealised P&amp;L</span>
        <span className="pnl-tag">Demo book</span>
      </div>

      <div className="pnl-total">
        <span className={`pnl-total-n ${up ? "up" : "down"}`}>{money(shown)}</span>
        <span className={`pnl-total-pct ${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {bookValue ? Math.abs((total / bookValue) * 100).toFixed(2) : "0.00"}%
        </span>
      </div>

      <table className="pnl-table">
        <thead>
          <tr><th>Position</th><th className="n">Last</th><th className="n">P&amp;L</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.symbol} style={{ transitionDelay: `${i * 70}ms` }}>
              <td>
                <b>{r.symbol}</b>
                <span>{r.qty} @ {r.cost.toFixed(2)}</span>
              </td>
              <td className="n">
                <span className="pnl-spark"><Sparkline symbol={r.symbol} tone={r.pnl >= 0 ? "var(--up)" : "var(--down)"} /></span>
                {r.display}
              </td>
              <td className={`n ${r.pnl >= 0 ? "up" : "down"}`}>
                {money(r.pnl)}
                <span className="pnl-pct">{r.pnl >= 0 ? "+" : "−"}{Math.abs(r.pct).toFixed(2)}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
