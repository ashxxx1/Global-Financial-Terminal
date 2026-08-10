import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, isDemoMode } from "../../lib/signals/api";
import { computeCumulativeSeries, computePerformance } from "../../lib/signals/performance";
import { fmtPct } from "../../lib/signals/format";
import type { Signal } from "../../lib/signals/types";
import PerformanceChart from "../../components/signals/PerformanceChart";
import { DemoBanner, SignalsDisclaimer, SignalsSubnav } from "../../components/signals/SignalStatusBadge";
import { MetricStrip } from "../../components/signals/SignalsHomeWidget";
import { signalStore } from "../../lib/signals/store";

export default function SignalPerformancePage() {
  useSeo({
    title: "GFT Track Record — Open Signal Performance",
    description: "An open record of every published GFT signal with calculated performance metrics.",
    path: "/terminal/signals/performance",
  });

  const [signals, setSignals] = useState<Signal[]>([]);
  useEffect(() => { setSignals(bootstrapSignals()); }, []);

  const stats = useMemo(() => computePerformance(signals), [signals]);
  const series = useMemo(() => computeCumulativeSeries(signals), [signals]);
  const models = signalStore.getModels();

  return (
    <div style={{ padding: 18, maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>GFT TRACK RECORD</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>An open record of every published signal.</p>
        </div>
        <DemoBanner demo={isDemoMode()} />
      </div>
      <SignalsSubnav active="performance" />

      <MetricStrip
        items={[
          { label: "ALL-TIME SIGNALS", value: String(stats.totalSignals) },
          { label: "TARGET HIT RATE", value: pct(stats.targetHitRate), tone: "var(--up)" },
          { label: "WIN RATE", value: pct(stats.winRate), tone: "var(--purple)" },
          { label: "AVERAGE WIN", value: fmtPct(stats.averageWin), tone: "var(--up)" },
          { label: "AVERAGE LOSS", value: fmtPct(stats.averageLoss), tone: "var(--down)" },
          { label: "PROFIT FACTOR", value: stats.profitFactor == null ? "—" : stats.profitFactor.toFixed(2) },
        ]}
      />
      <MetricStrip
        items={[
          { label: "MAX DRAWDOWN", value: fmtPct(stats.maxDrawdown), tone: "var(--down)" },
          { label: "CURRENT STREAK", value: String(stats.currentStreak) },
          { label: "EXPECTANCY", value: fmtPct(stats.expectancy), tone: "var(--gold)" },
          { label: "CUMULATIVE*", value: fmtPct(stats.cumulativeReturn) },
          { label: "EXPIRED", value: String(stats.expired) },
          { label: "AMBIGUOUS", value: String(stats.ambiguous), tone: "var(--blue)" },
        ]}
      />

      <PerformanceChart series={series} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }} className="sig-split">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">RESULT DEFINITIONS</span></div>
          <div className="panel-body" style={{ fontSize: 13, color: "var(--muted)", display: "grid", gap: 8 }}>
            <div><strong style={{ color: "var(--up)" }}>WIN</strong> = TARGET HIT</div>
            <div><strong style={{ color: "var(--down)" }}>LOSS</strong> = STOP HIT</div>
            <div><strong>EXPIRED</strong> and <strong style={{ color: "var(--blue)" }}>AMBIGUOUS</strong> are separate categories — never hidden.</div>
            <div>Win rate uses only TARGET HIT vs STOP HIT. Active signals are excluded.</div>
            <div>Expectancy = (win% × avg win) − (loss% × |avg loss|).</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">MODEL LEADERBOARD</span></div>
          <div className="panel-body">
            <table className="tbl">
              <thead><tr><th>MODEL</th><th className="num">SIGNALS</th><th className="num">WIN RATE</th><th className="num">AVG RET</th><th className="num">PF</th><th className="num">DD</th></tr></thead>
              <tbody>
                {models.map((m) => {
                  const subset = signals.filter((s) => s.modelName === m.name && s.modelVersion === m.version);
                  const st = computePerformance(subset);
                  return (
                    <tr key={`${m.name}-${m.version}`}>
                      <td>{m.name} {m.version}</td>
                      <td className="num">{st.totalSignals}</td>
                      <td className="num">{pct(st.winRate)}</td>
                      <td className="num">{fmtPct(st.medianReturn)}</td>
                      <td className="num">{st.profitFactor?.toFixed(2) ?? "—"}</td>
                      <td className="num">{fmtPct(st.maxDrawdown)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }} className="sig-split">
        <Board title="BEST SIGNALS" items={stats.bestSignal ? [stats.bestSignal] : []} tone="up" />
        <Board title="WORST SIGNALS" items={stats.worstSignal ? [stats.worstSignal] : []} tone="down" />
      </div>

      <SignalsDisclaimer />
    </div>
  );
}

function pct(x: number | null) {
  return x == null ? "—" : `${(x * 100).toFixed(1)}%`;
}

function Board({ title, items, tone }: { title: string; items: Signal[]; tone: "up" | "down" }) {
  return (
    <div className="panel">
      <div className="panel-head"><span className="panel-title">{title}</span></div>
      <div className="panel-body">
        {items.map((s) => (
          <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{ display: "flex", justifyContent: "space-between", color: "inherit", textDecoration: "none" }}>
            <span>{s.symbol}</span>
            <span className="mono" style={{ color: tone === "up" ? "var(--up)" : "var(--down)" }}>{fmtPct(s.realizedReturn)}</span>
          </Link>
        ))}
        {!items.length && <div style={{ color: "var(--muted)" }}>Insufficient resolved history.</div>}
      </div>
    </div>
  );
}
