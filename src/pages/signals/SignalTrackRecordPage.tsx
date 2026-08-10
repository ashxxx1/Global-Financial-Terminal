import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, isDemoMode } from "../../lib/signals/api";
import { computeCumulativeSeries, computePerformance } from "../../lib/signals/performance";
import { fmtConfidence, fmtDate, fmtPct, statusLabel } from "../../lib/signals/format";
import type { Signal } from "../../lib/signals/types";
import { DISCLAIMER } from "../../lib/signals/types";
import PerformanceChart from "../../components/signals/PerformanceChart";
import { DemoBanner, SignalsDisclaimer } from "../../components/signals/SignalStatusBadge";
import { MetricStrip } from "../../components/signals/SignalsHomeWidget";

/** Public track-record page — no auth required to inspect. */
export default function SignalTrackRecordPage() {
  useSeo({
    title: "Our Calls. Publicly Tracked. — GFT Signals",
    description: "Every GFT forecast remains on the record. Inspect the full public track record.",
    path: "/signals/track-record",
  });

  const [signals, setSignals] = useState<Signal[]>([]);
  useEffect(() => { setSignals(bootstrapSignals()); }, []);
  const stats = useMemo(() => computePerformance(signals), [signals]);
  const series = useMemo(() => computeCumulativeSeries(signals), [signals]);

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ color: "var(--gold)" }}>GFT SIGNALS</div>
        <h1 style={{ margin: "8px 0 6px", fontSize: 34, fontWeight: 900, letterSpacing: "0.03em", lineHeight: 1.1 }}>
          OUR CALLS.<br />PUBLICLY TRACKED.
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", maxWidth: 520 }}>Every GFT forecast remains on the record.</p>
        <div style={{ marginTop: 12 }}><DemoBanner demo={isDemoMode()} /></div>
      </div>

      <MetricStrip
        items={[
          { label: "TOTAL SIGNALS", value: String(stats.totalSignals) },
          { label: "TARGET HIT RATE", value: stats.targetHitRate == null ? "—" : `${(stats.targetHitRate * 100).toFixed(1)}%`, tone: "var(--up)" },
          { label: "CUMULATIVE HYPOTHETICAL RETURN", value: fmtPct(stats.cumulativeReturn), tone: "var(--gold)" },
          { label: "PROFIT FACTOR", value: stats.profitFactor?.toFixed(2) ?? "—" },
        ]}
      />

      <PerformanceChart series={series} />

      <div className="panel" style={{ marginTop: 14, overflow: "auto" }}>
        <div className="panel-head"><span className="panel-title">HISTORICAL SIGNALS</span></div>
        <table className="tbl">
          <thead>
            <tr><th>DATE</th><th>ASSET</th><th>SIGNAL</th><th>RESULT</th><th className="num">RETURN</th><th className="num">CONF</th></tr>
          </thead>
          <tbody>
            {signals.slice(0, 80).map((s) => (
              <tr key={s.id}>
                <td><Link to={`/signals/${s.id}`} style={{ color: "inherit" }}>{fmtDate(s.createdAt)}</Link></td>
                <td>{s.symbol}</td>
                <td>{s.direction}</td>
                <td>{statusLabel(s.status)}</td>
                <td className="num" style={{ color: (s.realizedReturn ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
                  {s.realizedReturn == null ? "—" : fmtPct(s.realizedReturn)}
                </td>
                <td className="num">{fmtConfidence(s.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        <Link to="/terminal/signals/methodology" className="chip" style={{ textDecoration: "none" }}>METHODOLOGY</Link>
        <Link to="/terminal/signals" className="chip active" style={{ textDecoration: "none" }}>TODAY&apos;S SIGNALS</Link>
        <Link to="/terminal/signals/performance" className="chip" style={{ textDecoration: "none" }}>FULL DASHBOARD</Link>
      </div>

      <SignalsDisclaimer />
      <p style={{ fontSize: 12, color: "var(--faint)" }}>{DISCLAIMER}</p>
    </div>
  );
}
