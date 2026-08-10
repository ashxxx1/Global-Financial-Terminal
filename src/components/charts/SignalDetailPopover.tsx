import type { ChartSignalView } from "../../lib/charts/signalOverlay";
import { kindColor } from "../../lib/charts/signalOverlay";
import { fmtDate, fmtPct, fmtPx } from "../../lib/signals/format";
import { statusLabel } from "../../lib/signals/format";

interface Props {
  signal: ChartSignalView | null;
  onClose: () => void;
}

export default function SignalDetailPopover({ signal, onClose }: Props) {
  if (!signal) return null;
  const s = signal.signal;
  return (
    <div className="tc-signal-pop" role="dialog" aria-label="GFT signal detail">
      <div className="tc-menu-head">
        <div>
          <div className="panel-title" style={{ color: kindColor(signal.kind) }}>
            GFT SIGNAL · {signal.kind}
          </div>
          <div className="label">{fmtDate(signal.time)} · {statusLabel(signal.status)}{signal.demo ? " · DEMO" : ""}</div>
        </div>
        <button type="button" className="chip" onClick={onClose} aria-label="Close signal detail">✕</button>
      </div>
      <div className="tc-signal-grid">
        <div><span className="label">Entry</span><div className="mono">{fmtPx(signal.entry, signal.price)}</div></div>
        <div><span className="label">Target</span><div className="mono" style={{ color: "var(--up)" }}>{fmtPx(signal.target, signal.price)}</div></div>
        <div><span className="label">Stop</span><div className="mono" style={{ color: "var(--down)" }}>{fmtPx(signal.stop, signal.price)}</div></div>
        <div><span className="label">Result</span><div className="mono">{fmtPct(signal.realizedReturn)}</div></div>
      </div>
      <p className="tc-signal-reason">{s.reasoning}</p>
      <p className="label" style={{ margin: 0 }}>
        Analytical GFT signal — not a brokerage order or trade execution.
      </p>
    </div>
  );
}
