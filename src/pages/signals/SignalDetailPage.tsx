import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, quoteSymbolFor } from "../../lib/signals/api";
import { fmtConfidence, fmtDateTime, fmtPct, fmtPx, riskRewardLabel, statusLabel } from "../../lib/signals/format";
import type { Signal } from "../../lib/signals/types";
import { quoteFor } from "../../lib/market";
import SignalChart from "../../components/signals/SignalChart";
import SignalTimeline from "../../components/signals/SignalTimeline";
import SignalStatusBadge, { DemoBanner, SignalDirectionBadge, SignalsDisclaimer, SignalsSubnav } from "../../components/signals/SignalStatusBadge";
import { isDemoMode } from "../../lib/signals/generate";
import ShareButton from "../../components/ShareButton";

export default function SignalDetailPage() {
  const { id } = useParams();
  const [signal, setSignal] = useState<Signal | null>(null);

  useEffect(() => {
    bootstrapSignals();
    const list = bootstrapSignals();
    setSignal(list.find((s) => s.id === id) ?? null);
  }, [id]);

  useSeo({
    title: signal ? `GFT Signal · ${signal.symbol} ${signal.direction}` : "GFT Signal",
    description: signal
      ? `${signal.symbol} ${signal.direction} · ${signal.confidence}% confidence. Target ${signal.targetPrice}, stop ${signal.stopPrice}.`
      : "GFT market forecast detail",
    path: `/terminal/signals/${id || ""}`,
  });

  const live = useMemo(() => {
    if (!signal) return null;
    return quoteFor(quoteSymbolFor(signal))?.price ?? signal.signalPrice;
  }, [signal]);

  if (!signal) {
    return (
      <div style={{ padding: 24 }}>
        <SignalsSubnav active="today" />
        <div className="panel" style={{ padding: 24 }}>Signal not found.</div>
        <Link to="/terminal/signals" className="chip" style={{ marginTop: 12, display: "inline-block", textDecoration: "none" }}>BACK TO SIGNALS</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <SignalsSubnav active="today" />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div className="label" style={{ color: "var(--purple)" }}>GFT SIGNAL</div>
          <h1 style={{ margin: "4px 0 8px", fontSize: 28, fontWeight: 800 }}>{signal.symbol}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <SignalDirectionBadge direction={signal.direction} />
            <SignalStatusBadge status={signal.status} />
            <DemoBanner demo={signal.demo || isDemoMode()} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="label">PUBLISHED</div>
          <div className="mono" style={{ fontSize: 13 }}>{fmtDateTime(signal.createdAt)}</div>
          <div style={{ marginTop: 8 }}><ShareButton /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
        <Stat label="MODEL" value={`${signal.modelName} ${signal.modelVersion}`} />
        <Stat label="CONFIDENCE" value={fmtConfidence(signal.confidence)} color="var(--purple)" />
        <Stat label="ENTRY" value={`${fmtPx(signal.entryLow, signal.signalPrice)} – ${fmtPx(signal.entryHigh, signal.signalPrice)}`} />
        <Stat label="TARGET" value={fmtPx(signal.targetPrice, signal.signalPrice)} color="var(--up)" />
        <Stat label="STOP" value={fmtPx(signal.stopPrice, signal.signalPrice)} color="var(--down)" />
        <Stat label="LAST" value={fmtPx(live ?? signal.signalPrice, signal.signalPrice)} />
        <Stat label="R:R" value={riskRewardLabel(signal.riskReward)} />
        <Stat label="HORIZON" value={signal.timeframe} />
      </div>

      {signal.resolvedAt && (
        <div className="panel" style={{ padding: 16, marginBottom: 14, borderColor: signal.status === "TARGET_HIT" ? "var(--up)" : signal.status === "STOP_HIT" ? "var(--down)" : "var(--line)" }}>
          <div className="label">RESULT</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{statusLabel(signal.status)}</div>
          <div className="mono" style={{ fontSize: 18, color: (signal.realizedReturn ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
            REALIZED {fmtPct(signal.realizedReturn)}
          </div>
          {signal.resolutionNote && <div style={{ color: "var(--muted)", marginTop: 6, fontSize: 13 }}>{signal.resolutionNote}</div>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(280px,0.8fr)", gap: 14 }} className="sig-split">
        <SignalChart signal={signal} />
        <div style={{ display: "grid", gap: 14 }}>
          <div className="panel" id="analysis">
            <div className="panel-head"><span className="panel-title">WHY THIS SIGNAL?</span></div>
            <div className="panel-body" style={{ display: "grid", gap: 8 }}>
              {signal.factors.filter((f) => f.key !== "historical").map((f) => (
                <div key={f.key} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 8 }}>
                  <span style={{ color: f.polarity === "positive" ? "var(--up)" : f.polarity === "negative" ? "var(--down)" : "var(--muted)", fontWeight: 800 }}>
                    {f.polarity === "positive" ? "+" : f.polarity === "negative" ? "−" : "·"}
                  </span>
                  <span style={{ fontSize: 13 }}>{f.detail}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <div className="label">MODEL VIEW</div>
                <div style={{ fontWeight: 800 }}>{signal.direction}</div>
                <div className="mono" style={{ color: "var(--purple)" }}>{signal.confidence} / 100 confidence</div>
              </div>
            </div>
          </div>
          <SignalTimeline signal={signal} />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head"><span className="panel-title">AUDIT · PREDICTION TRANSPARENCY</span></div>
        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontSize: 12.5 }}>
          <Row k="Timestamp" v={fmtDateTime(signal.createdAt)} />
          <Row k="Price at publication" v={fmtPx(signal.signalPrice)} />
          <Row k="Model" v={`${signal.modelName} ${signal.modelVersion}`} />
          <Row k="Confidence" v={fmtConfidence(signal.confidence)} />
          <Row k="Entry" v={`${fmtPx(signal.entryLow)} – ${fmtPx(signal.entryHigh)}`} />
          <Row k="Target" v={fmtPx(signal.targetPrice)} />
          <Row k="Stop" v={fmtPx(signal.stopPrice)} />
          <Row k="Resolution" v={statusLabel(signal.status)} />
          <Row k="Exit price" v={signal.exitPriceActual == null ? "—" : fmtPx(signal.exitPriceActual)} />
          <Row k="Realized return" v={fmtPct(signal.realizedReturn)} />
          <Row k="RSI" v={signal.sourceSnapshot.rsi.toFixed(1)} />
          <Row k="ATR" v={fmtPx(signal.sourceSnapshot.atr, signal.signalPrice)} />
          <Row k="SMA20" v={fmtPx(signal.sourceSnapshot.sma20, signal.signalPrice)} />
          <Row k="SMA50" v={fmtPx(signal.sourceSnapshot.sma50, signal.signalPrice)} />
          <Row k="Volume ratio" v={signal.sourceSnapshot.volumeRatio.toFixed(2)} />
          <Row k="Regime" v={signal.sourceSnapshot.regime} />
        </div>
      </div>

      <SignalsDisclaimer />
      <div style={{ marginTop: 10 }}>
        <Link to={`/signals/${signal.id}`} className="label" style={{ color: "var(--gold)" }}>Public share URL · /signals/{signal.id}</Link>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="panel" style={{ padding: "12px 14px" }}>
      <div className="label">{label}</div>
      <div className="mono" style={{ fontWeight: 700, marginTop: 4, color: color || "var(--text)", fontSize: 13 }}>{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="label">{k}</div>
      <div className="mono" style={{ marginTop: 2 }}>{v}</div>
    </div>
  );
}
