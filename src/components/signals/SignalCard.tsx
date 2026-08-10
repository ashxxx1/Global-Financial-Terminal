import { Link } from "react-router-dom";
import type { Signal } from "../../lib/signals/types";
import { fmtConfidence, fmtDateTime, fmtPct, fmtPx, riskRewardLabel } from "../../lib/signals/format";
import { quoteFor } from "../../lib/market";
import { SIGNAL_ASSETS } from "../../lib/signals/assets";
import SignalStatusBadge, { SignalDirectionBadge } from "./SignalStatusBadge";

export default function SignalCard({ signal }: { signal: Signal }) {
  const asset = SIGNAL_ASSETS.find((a) => a.assetId === signal.assetId);
  const q = quoteFor(asset?.quoteSymbol ?? `IDX:${signal.symbol}`);
  const live = q?.price ?? signal.signalPrice;

  return (
    <article className="sig-card panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: 15, letterSpacing: "0.04em" }}>{signal.symbol}</div>
          <div className="label" style={{ marginTop: 4 }}>{signal.exchange} · {signal.assetType}</div>
        </div>
        <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
          <SignalDirectionBadge direction={signal.direction} />
          <SignalStatusBadge status={signal.status} />
        </div>
      </div>

      <div style={{ padding: "0 16px 12px", fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700 }}>
        {fmtPx(live, signal.signalPrice)}
      </div>

      <div className="sig-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
        background: "var(--line)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
      }}>
        <Cell label="ENTRY" value={`${fmtPx(signal.entryLow, signal.signalPrice)} – ${fmtPx(signal.entryHigh, signal.signalPrice)}`} />
        <Cell label="TARGET" value={fmtPx(signal.targetPrice, signal.signalPrice)} tone="up" />
        <Cell label="STOP" value={fmtPx(signal.stopPrice, signal.signalPrice)} tone="down" />
        <Cell label="EXPECTED RETURN" value={fmtPct(Math.abs(signal.expectedMove))} tone={signal.direction === "BEARISH" ? "down" : "up"} />
        <Cell label="RISK" value={fmtPct(signal.risk)} tone="down" />
        <Cell label="RISK / REWARD" value={riskRewardLabel(signal.riskReward)} />
        <Cell label="CONFIDENCE" value={fmtConfidence(signal.confidence)} tone="purple" />
        <Cell label="HORIZON" value={signal.timeframe.replace("1D", "1 DAY")} />
        <Cell label="MODEL" value={`${signal.modelName} ${signal.modelVersion}`} />
      </div>

      <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="label">ISSUED {fmtDateTime(signal.createdAt)}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`/terminal/signals/${signal.id}`} className="chip active" style={{ textDecoration: "none" }}>VIEW SIGNAL</Link>
          <Link to={`/terminal/signals/${signal.id}#analysis`} className="chip" style={{ textDecoration: "none" }}>VIEW ANALYSIS</Link>
        </div>
      </div>
    </article>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "purple" }) {
  const color = tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : tone === "purple" ? "var(--purple)" : "var(--text)";
  return (
    <div style={{ background: "var(--navy)", padding: "10px 12px" }}>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
