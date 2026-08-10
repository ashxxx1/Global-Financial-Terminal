import { INDICATOR_DEFS, type IndicatorId } from "../../types/chart";
import { useChartMenu } from "../../hooks/useChartMenu";

interface Props {
  open: boolean;
  onClose: () => void;
  enabled: Set<IndicatorId>;
  onToggle: (id: IndicatorId) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export default function IndicatorMenu({ open, onClose, enabled, onToggle, triggerRef }: Props) {
  const { panelRef, titleId } = useChartMenu({ open, onClose, triggerRef });
  if (!open) return null;

  const groups = [
    { key: "ma", title: "Moving averages" },
    { key: "bands", title: "Bands" },
    { key: "oscillator", title: "Oscillators" },
    { key: "volume", title: "Volume" },
  ] as const;

  return (
    <div
      ref={panelRef}
      className="tc-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="tc-menu-head">
        <span className="panel-title" id={titleId}>Indicators</span>
        <button type="button" className="chip" onClick={onClose} aria-label="Close indicators">✕</button>
      </div>
      <div className="tc-menu-body">
        <p className="label" style={{ margin: 0 }}>
          Toggle overlays on the chart. Press Escape to close.
        </p>
        {groups.map((g) => (
          <fieldset key={g.key} className="tc-menu-group">
            <legend className="label">{g.title}</legend>
            {INDICATOR_DEFS.filter((d) => d.group === g.key).map((d) => {
              const on = enabled.has(d.id);
              return (
                <label key={d.id} className="tc-check">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggle(d.id)}
                  />
                  <span>{d.label}</span>
                </label>
              );
            })}
          </fieldset>
        ))}
        <p className="label" style={{ marginTop: 8 }}>
          Defaults stay lean — enable only what you need.
        </p>
      </div>
    </div>
  );
}
