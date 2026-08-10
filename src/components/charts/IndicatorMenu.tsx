import { INDICATOR_DEFS, type IndicatorId } from "../../types/chart";

interface Props {
  open: boolean;
  onClose: () => void;
  enabled: Set<IndicatorId>;
  onToggle: (id: IndicatorId) => void;
}

export default function IndicatorMenu({ open, onClose, enabled, onToggle }: Props) {
  if (!open) return null;
  const groups = [
    { key: "ma", title: "Moving averages" },
    { key: "bands", title: "Bands" },
    { key: "oscillator", title: "Oscillators" },
    { key: "volume", title: "Volume" },
  ] as const;

  return (
    <div className="tc-menu" role="dialog" aria-label="Indicators">
      <div className="tc-menu-head">
        <span className="panel-title">Indicators</span>
        <button type="button" className="chip" onClick={onClose} aria-label="Close indicators">✕</button>
      </div>
      <div className="tc-menu-body">
        {groups.map((g) => (
          <div key={g.key} className="tc-menu-group">
            <div className="label">{g.title}</div>
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
          </div>
        ))}
        <p className="label" style={{ marginTop: 8 }}>
          Defaults stay lean — enable only what you need.
        </p>
      </div>
    </div>
  );
}
