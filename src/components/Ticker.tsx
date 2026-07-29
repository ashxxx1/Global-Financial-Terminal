import { useIndices } from "../lib/hooks";
import SourceBadge from "./SourceBadge";

export default function Ticker() {
  const quotes = useIndices();
  const items = [...quotes, ...quotes]; // seamless marquee loop

  return (
    <footer
      style={{
        display: "flex", alignItems: "stretch",
        borderTop: "1px solid var(--line)", background: "var(--navy)",
        position: "relative", zIndex: 40, overflow: "hidden",
      }}
    >
      {/* Persistent disclaimer. Growth-plan item 12: this must be visible on
          every data surface, not only the marketing page — the ticker is the
          one element present on all of them. */}
      <span className="ticker-disclaimer" title="Market data is informational only and may be delayed or simulated. Nothing here is investment advice.">
        NOT INVESTMENT ADVICE
      </span>

      <div className="marquee" style={{ flex: 1 }}>
        <div className="marquee-track" style={{ alignItems: "center" }}>
          {items.map((q, i) => {
            const up = q.changePct >= 0;
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--mono)", fontSize: 11 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: up ? "var(--up)" : "var(--down)" }} />
                <span style={{ color: "var(--faint)", fontSize: 10, letterSpacing: "0.06em" }}>{q.name}</span>
                <span style={{ color: "var(--text)", fontWeight: 700 }}>{q.display}</span>
                <span className={`chg ${up ? "up" : "down"}`} style={{ fontSize: 9.5 }}>
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderLeft: "1px solid var(--line)" }}>
        {(() => {
          const liveN = quotes.filter((q) => q.source === "live").length;
          return liveN > 0 ? (
            <>
              <SourceBadge source="live" title={`${liveN} instruments on real feeds (Binance · ECB)`} />
              <span className="label" style={{ fontSize: 8 }}>{liveN}</span>
              <SourceBadge source="sim" title="Remaining instruments simulated" />
            </>
          ) : (
            <SourceBadge source={quotes[0]?.source ?? "sim"} />
          );
        })()}
      </div>
    </footer>
  );
}
