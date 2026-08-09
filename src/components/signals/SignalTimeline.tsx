import type { Signal } from "../../lib/signals/types";
import { fmtDateTime, fmtPct } from "../../lib/signals/format";

export default function SignalTimeline({ signal }: { signal: Signal }) {
  const events: Array<{ at: number; label: string; detail?: string }> = [
    { at: signal.createdAt, label: "Signal published", detail: `${signal.direction} · ${signal.confidence}%` },
  ];
  if (signal.entryPriceActual != null && signal.resolvedAt) {
    events.push({ at: signal.createdAt + Math.max(0, ((signal.resolvedAt - signal.createdAt) * 0.15)), label: "Entry zone referenced", detail: undefined });
  }
  if (signal.resolvedAt && signal.realizedReturn != null && signal.status === "TARGET_HIT") {
    events.push({ at: signal.createdAt + (signal.resolvedAt - signal.createdAt) * 0.55, label: "Move in progress", detail: fmtPct(signal.realizedReturn * 0.5) });
  }
  if (signal.resolvedAt) {
    events.push({
      at: signal.resolvedAt,
      label: signal.status === "TARGET_HIT" ? "Target reached" : signal.status === "STOP_HIT" ? "Stop reached" : signal.status.replace("_", " "),
      detail: signal.realizedReturn != null ? fmtPct(signal.realizedReturn) : undefined,
    });
    events.push({ at: signal.resolvedAt, label: "Signal resolved" });
  }

  return (
    <div className="panel">
      <div className="panel-head"><span className="panel-title">HOW IT PLAYED OUT</span></div>
      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        {events.map((e, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, alignItems: "start" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDateTime(e.at).split(" ·").pop()}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{e.label}</div>
              {e.detail && <div className="mono" style={{ fontSize: 12, color: "var(--gold)", marginTop: 2 }}>{e.detail}</div>}
            </div>
          </div>
        ))}
        {!signal.resolvedAt && (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Still active — resolution updates as price reaches target, stop, or expiry.</div>
        )}
      </div>
    </div>
  );
}
