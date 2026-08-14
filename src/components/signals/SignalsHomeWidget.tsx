import { Link } from "react-router-dom";
import type { Signal } from "../../lib/signals/types";
import { fmtConfidence, fmtPx } from "../../lib/signals/format";
import { SignalDirectionBadge } from "./SignalStatusBadge";

/** Compact homepage / rail widget for today's top signal + yesterday summary. */
export default function SignalsHomeWidget({
  top,
  yesterdayHits,
  yesterdayTotal,
}: {
  top: Signal | null;
  yesterdayHits: number;
  yesterdayTotal: number;
}) {
  return (
    <div className="panel" data-tour="signals-widget" style={{ marginBottom: 12 }}>
      <div className="panel-head">
        <span className="panel-title">TODAY&apos;S GFT SIGNAL</span>
        <Link to="/terminal/signals" className="label" style={{ color: "var(--gold)" }}>VIEW ALL</Link>
      </div>
      <div className="panel-body">
        {top ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: 14 }}>{top.symbol}</div>
              <SignalDirectionBadge direction={top.direction} />
            </div>
            <div className="mono" style={{ color: "var(--purple)", fontWeight: 700, marginBottom: 10 }}>{fmtConfidence(top.confidence)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <Mini label="ENTRY" value={`${fmtPx(top.entryLow, top.signalPrice)}–${fmtPx(top.entryHigh, top.signalPrice)}`} />
              <Mini label="TARGET" value={fmtPx(top.targetPrice, top.signalPrice)} color="var(--up)" />
              <Mini label="STOP" value={fmtPx(top.stopPrice, top.signalPrice)} color="var(--down)" />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link to={`/terminal/signals/${top.id}`} className="chip active" style={{ textDecoration: "none", display: "inline-block" }}>VIEW SIGNAL</Link>
              <Link to={`/stock/${top.symbol}`} className="chip" style={{ textDecoration: "none", display: "inline-block" }}>Open chart</Link>
            </div>
          </>
        ) : (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            NO HIGH-CONVICTION SIGNALS
            <div style={{ marginTop: 6, fontSize: 12 }}>Market conditions do not currently meet GFT&apos;s signal threshold.</div>
          </div>
        )}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div className="label" style={{ marginBottom: 4 }}>YESTERDAY</div>
          <div style={{ fontWeight: 700 }}>{yesterdayHits} / {yesterdayTotal} TARGETS HIT</div>
          <Link to="/signals/track-record" className="label" style={{ color: "var(--gold)", display: "inline-block", marginTop: 6 }}>VIEW TRACK RECORD</Link>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: color || "var(--text)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

export function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: string }>;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(items.length, 6)}, minmax(0, 1fr))`,
      gap: 10,
      marginBottom: 16,
    }}
      className="sig-metrics"
    >
      {items.map((m) => (
        <div key={m.label} className="panel" style={{ padding: "12px 14px" }}>
          <div className="label">{m.label}</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: m.tone || "var(--text)" }}>{m.value}</div>
        </div>
      ))}
    </div>
  );
}

export function SignalFiltersBar({
  market, setMarket, direction, setDirection, sort, setSort,
}: {
  market: string; setMarket: (v: string) => void;
  direction: string; setDirection: (v: string) => void;
  sort: string; setSort: (v: string) => void;
}) {
  const markets = ["ALL", "US", "INDIA", "EUROPE", "ASIA", "FX", "CRYPTO", "COMMODITIES", "INDICES", "EQUITIES"];
  const dirs = ["ALL", "BULLISH", "BEARISH", "NEUTRAL"];
  const sorts = [
    { id: "confidence", label: "CONFIDENCE" },
    { id: "expected", label: "EXPECTED RETURN" },
    { id: "newest", label: "NEWEST" },
    { id: "rr", label: "RISK/REWARD" },
  ];
  return (
    <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {markets.map((m) => (
          <button key={m} type="button" className={`chip ${market === m ? "active" : ""}`} onClick={() => setMarket(m)}>{m}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {dirs.map((d) => (
          <button key={d} type="button" className={`chip blue ${direction === d ? "active" : ""}`} onClick={() => setDirection(d)}>{d}</button>
        ))}
        <span style={{ width: 1, height: 18, background: "var(--line)", margin: "0 4px" }} />
        {sorts.map((s) => (
          <button key={s.id} type="button" className={`chip ${sort === s.id ? "active" : ""}`} onClick={() => setSort(s.id)}>{s.label}</button>
        ))}
      </div>
    </div>
  );
}
