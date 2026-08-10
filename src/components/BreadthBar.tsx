import { useMemo } from "react";
import { allStockSymbols, quoteFor } from "../lib/market";

/**
 * Market breadth — advancers vs decliners across the whole registry.
 *
 * Index level tells you what the biggest names did. Breadth tells you whether
 * the move was broad or three megacaps dragging everything else, which is the
 * question the index number cannot answer on its own.
 */
export default function BreadthBar() {
  const { adv, dec, flat, advPct, ratio } = useMemo(() => {
    const symbols = allStockSymbols();
    let adv = 0, dec = 0, flat = 0;
    for (const s of symbols) {
      const q = quoteFor(s);
      if (!q) continue;
      if (q.changePct > 0.05) adv++;
      else if (q.changePct < -0.05) dec++;
      else flat++;
    }
    const total = adv + dec + flat || 1;
    return {
      adv, dec, flat,
      advPct: (adv / total) * 100,
      ratio: dec === 0 ? adv : adv / dec,
    };
  }, []);

  const total = adv + dec + flat || 1;
  const decPct = (dec / total) * 100;
  const flatPct = 100 - advPct - decPct;

  const tone = ratio >= 1.5 ? "var(--up)" : ratio <= 0.66 ? "var(--down)" : "var(--gold)";
  const verdict = ratio >= 2 ? "Broad rally" : ratio >= 1.2 ? "Risk-on" : ratio >= 0.83 ? "Mixed" : ratio >= 0.5 ? "Risk-off" : "Broad selloff";

  return (
    <div className="breadth">
      <div className="breadth-head">
        <span className="panel-title">Breadth</span>
        <span className="label" style={{ color: tone }}>{verdict}</span>
      </div>

      <div className="breadth-track" role="img"
           aria-label={`${adv} advancing, ${dec} declining, ${flat} unchanged`}>
        <div className="breadth-seg up"   style={{ width: `${advPct}%` }} />
        <div className="breadth-seg flat" style={{ width: `${flatPct}%` }} />
        <div className="breadth-seg down" style={{ width: `${decPct}%` }} />
      </div>

      <div className="breadth-legend">
        <span className="up mono">▲ {adv}</span>
        <span className="mono" style={{ color: "var(--faint)" }}>{flat} flat</span>
        <span className="down mono">{dec} ▼</span>
      </div>
    </div>
  );
}
