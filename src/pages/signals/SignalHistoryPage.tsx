import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, isDemoMode } from "../../lib/signals/api";
import { fmtConfidence, fmtDate, fmtPct, fmtPx, statusLabel } from "../../lib/signals/format";
import type { Signal, SignalStatus } from "../../lib/signals/types";
import { DemoBanner, SignalsDisclaimer, SignalsSubnav } from "../../components/signals/SignalStatusBadge";

export default function SignalHistoryPage() {
  useSeo({
    title: "Signal History — Every Forecast, Every Result",
    description: "Complete immutable history of GFT market forecasts and realized results.",
    path: "/terminal/signals/history",
  });

  const [signals, setSignals] = useState<Signal[]>([]);
  const [market, setMarket] = useState("ALL");
  const [direction, setDirection] = useState("ALL");
  const [result, setResult] = useState("ALL");
  const [q, setQ] = useState("");

  useEffect(() => { setSignals(bootstrapSignals()); }, []);

  const rows = useMemo(() => {
    return signals.filter((s) => {
      if (market !== "ALL" && s.market !== market && !(market === "EUROPE" && (s.market === "EUROPE" || s.market === "UK"))) return false;
      if (direction !== "ALL" && s.direction !== direction) return false;
      if (result !== "ALL" && s.status !== result) return false;
      if (q && !`${s.symbol} ${s.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [signals, market, direction, result, q]);

  return (
    <div style={{ padding: 18, maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>SIGNAL HISTORY</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Every forecast. Every result.</p>
        </div>
        <DemoBanner demo={isDemoMode()} />
      </div>
      <SignalsSubnav active="history" />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <select className="sig-input" value={market} onChange={(e) => setMarket(e.target.value)}>
          {["ALL", "US", "INDIA", "EUROPE", "UK", "ASIA", "JAPAN", "FX", "CRYPTO", "COMMODITIES"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="sig-input" value={direction} onChange={(e) => setDirection(e.target.value)}>
          {["ALL", "BULLISH", "BEARISH", "NEUTRAL"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="sig-input" value={result} onChange={(e) => setResult(e.target.value)}>
          {["ALL", "TARGET_HIT", "STOP_HIT", "EXPIRED", "AMBIGUOUS", "ACTIVE"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="sig-input" placeholder="Asset" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="panel" style={{ overflow: "auto" }}>
        <table className="tbl sig-history-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>ASSET</th>
              <th>SIGNAL</th>
              <th className="num">ENTRY</th>
              <th className="num">TARGET</th>
              <th className="num">STOP</th>
              <th>RESULT</th>
              <th className="num">RETURN</th>
              <th className="num">CONF</th>
              <th>MODEL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => { window.location.hash = ""; }} style={{ cursor: "pointer" }}>
                <td>
                  <Link to={`/terminal/signals/${s.id}`} style={{ color: "inherit", textDecoration: "none" }}>{fmtDate(s.createdAt)}</Link>
                </td>
                <td style={{ fontWeight: 650 }}>{s.symbol}</td>
                <td style={{ color: s.direction === "BULLISH" ? "var(--up)" : s.direction === "BEARISH" ? "var(--down)" : "var(--blue)" }}>{s.direction}</td>
                <td className="num">{fmtPx((s.entryLow + s.entryHigh) / 2, s.signalPrice)}</td>
                <td className="num">{fmtPx(s.targetPrice, s.signalPrice)}</td>
                <td className="num">{fmtPx(s.stopPrice, s.signalPrice)}</td>
                <td style={{ color: resultColor(s.status) }}>{statusLabel(s.status)}</td>
                <td className="num" style={{ color: (s.realizedReturn ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
                  {s.realizedReturn == null ? "—" : fmtPct(s.realizedReturn)}
                </td>
                <td className="num">{fmtConfidence(s.confidence)}</td>
                <td className="mono" style={{ fontSize: 11 }}>{s.modelVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SignalsDisclaimer />
    </div>
  );
}

function resultColor(s: SignalStatus): string {
  if (s === "TARGET_HIT") return "var(--up)";
  if (s === "STOP_HIT") return "var(--down)";
  if (s === "ACTIVE" || s === "PENDING") return "var(--gold)";
  if (s === "AMBIGUOUS") return "var(--blue)";
  return "var(--muted)";
}
