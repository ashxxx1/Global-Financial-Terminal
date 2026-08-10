import { useMemo, useState } from "react";
import { useSeo } from "../../lib/seo";
import { SIGNAL_ASSETS } from "../../lib/signals/assets";
import { runBacktest, type BacktestResult } from "../../lib/signals/backtest";
import { computeCumulativeSeries } from "../../lib/signals/performance";
import { fmtPct } from "../../lib/signals/format";
import { MODEL_CORE } from "../../lib/signals/types";
import PerformanceChart from "../../components/signals/PerformanceChart";
import { SignalsDisclaimer, SignalsSubnav } from "../../components/signals/SignalStatusBadge";
import { MetricStrip } from "../../components/signals/SignalsHomeWidget";

export default function SignalBacktestPage() {
  useSeo({
    title: "Signal Backtest",
    description: "Run walk-forward-aware GFT CORE backtests without look-ahead bias.",
    path: "/terminal/signals/backtest",
  });

  const [assetId, setAssetId] = useState(SIGNAL_ASSETS[0].assetId);
  const [from, setFrom] = useState(() => new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);

  const series = useMemo(
    () => (result ? computeCumulativeSeries(result.signals) : []),
    [result],
  );

  function run() {
    setRunning(true);
    // Defer so UI can paint
    setTimeout(() => {
      const trainUntil = Date.parse(from) + (Date.parse(to) - Date.parse(from)) * 0.6;
      const validateUntil = Date.parse(from) + (Date.parse(to) - Date.parse(from)) * 0.8;
      const r = runBacktest({
        assetId,
        from: Date.parse(from),
        to: Date.parse(to),
        modelName: MODEL_CORE.name,
        modelVersion: MODEL_CORE.version,
        trainUntil,
        validateUntil,
      });
      setResult(r);
      setRunning(false);
    }, 30);
  }

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>BACKTEST</h1>
      <p style={{ margin: 0, color: "var(--muted)" }}>In-sample / out-of-sample aware. No look-ahead bias.</p>
      <SignalsSubnav active="backtest" />

      <div className="panel" style={{ padding: 16, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
        <Field label="ASSET">
          <select className="sig-input" value={assetId} onChange={(e) => setAssetId(e.target.value)} style={{ width: "100%" }}>
            {SIGNAL_ASSETS.map((a) => <option key={a.assetId} value={a.assetId}>{a.symbol}</option>)}
          </select>
        </Field>
        <Field label="FROM">
          <input className="sig-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="TO">
          <input className="sig-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="MODEL">
          <input className="sig-input" disabled value={`${MODEL_CORE.name} ${MODEL_CORE.version}`} style={{ width: "100%" }} />
        </Field>
        <button type="button" className="chip active" onClick={run} disabled={running} style={{ height: 36 }}>
          {running ? "RUNNING…" : "RUN BACKTEST"}
        </button>
      </div>

      {result && (
        <>
          <MetricStrip
            items={[
              { label: "SIGNALS", value: String(result.stats.totalSignals) },
              { label: "WIN RATE", value: result.stats.winRate == null ? "—" : `${(result.stats.winRate * 100).toFixed(1)}%` },
              { label: "AVG RETURN", value: fmtPct(result.stats.medianReturn) },
              { label: "PROFIT FACTOR", value: result.stats.profitFactor?.toFixed(2) ?? "—" },
              { label: "MAX DRAWDOWN", value: fmtPct(result.stats.maxDrawdown), tone: "var(--down)" },
              { label: "SHARPE", value: result.sharpe == null ? "—" : result.sharpe.toFixed(2) },
            ]}
          />
          <MetricStrip
            items={[
              { label: "EXPECTANCY", value: fmtPct(result.stats.expectancy), tone: "var(--gold)" },
              { label: "TARGET HIT RATE", value: result.stats.targetHitRate == null ? "—" : `${(result.stats.targetHitRate * 100).toFixed(1)}%`, tone: "var(--up)" },
              { label: "STOP HIT RATE", value: result.stats.stopHitRate == null ? "—" : `${(result.stats.stopHitRate * 100).toFixed(1)}%`, tone: "var(--down)" },
              { label: "OOS WIN RATE", value: result.outOfSampleStats?.winRate == null ? "Insufficient validated history." : `${(result.outOfSampleStats.winRate * 100).toFixed(1)}%` },
            ]}
          />
          <PerformanceChart series={series} />
          <div className="panel" style={{ padding: 14, marginTop: 12, color: "var(--muted)", fontSize: 13 }}>{result.note}</div>
        </>
      )}
      <SignalsDisclaimer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
