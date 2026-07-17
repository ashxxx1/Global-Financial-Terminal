import { useIndices } from "../../hooks/useMarketData";
import SourceBadge from "../common/SourceBadge";

export default function Ticker() {
  const quotes = useIndices();
  // Duplicate the run so the marquee scrolls seamlessly.
  const items = [...quotes, ...quotes];
  const source = quotes[0]?.source || "sim";

  return (
    <div className="nx-ticker">
      <div className="nx-ticker__lane-label">SIGNAL</div>
      <div className="nx-ticker__track-wrap">
        <div className="nx-ticker__track">
          {items.map((q, i) => {
            const up = q.changePct >= 0;
            return (
              <div key={i} className="nx-ticker__item">
                <span className="nx-ticker__dot" />
                <span className="nx-ticker__name">{q.name}</span>
                <span className="nx-ticker__value">{q.display}</span>
                <span className={`nx-ticker__change ${up ? "up" : "down"}`}>
                  {up ? "+" : ""}
                  {q.changePct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="nx-ticker__pulse" style={{ gap: 8 }}>
        <SourceBadge source={source} />
      </div>
    </div>
  );
}
