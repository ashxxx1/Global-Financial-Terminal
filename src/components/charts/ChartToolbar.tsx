import type { DrawingTool, ChartType } from "../../types/chart";

interface Props {
  chartType: ChartType;
  onChartType: (t: ChartType) => void;
  drawing: DrawingTool;
  onDrawing: (t: DrawingTool) => void;
  onIndicators: () => void;
  onCompare: () => void;
  compareActive?: boolean;
  onFullscreen: () => void;
  onReset: () => void;
  fullscreen: boolean;
}

const DRAWINGS: { id: DrawingTool; label: string; title: string }[] = [
  { id: "none", label: "↖", title: "Select" },
  { id: "trendline", label: "╱", title: "Trendline" },
  { id: "horizontal", label: "―", title: "Horizontal line" },
  { id: "vertical", label: "│", title: "Vertical line" },
  { id: "sr", label: "S/R", title: "Support / resistance" },
];

export default function ChartToolbar({
  chartType, onChartType, drawing, onDrawing,
  onIndicators, onCompare, compareActive = false, onFullscreen, onReset, fullscreen,
}: Props) {
  return (
    <div className="tc-toolbar">
      <div className="tc-toolbar-group" role="group" aria-label="Chart type">
        {(["candlestick", "line", "area"] as ChartType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`chip ${chartType === t ? "active" : ""}`}
            aria-pressed={chartType === t}
            onClick={() => onChartType(t)}
          >
            {t === "candlestick" ? "Candles" : t === "line" ? "Line" : "Area"}
          </button>
        ))}
      </div>

      <div className="tc-toolbar-group tc-draw" role="group" aria-label="Drawing tools">
        {DRAWINGS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip ${drawing === d.id ? "active" : ""}`}
            title={d.title}
            aria-label={d.title}
            aria-pressed={drawing === d.id}
            onClick={() => onDrawing(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="tc-toolbar-group tc-toolbar-actions">
        <button type="button" className="chip" onClick={onIndicators}>Indicators</button>
        <button
          type="button"
          className={`chip ${compareActive ? "active" : ""}`}
          onClick={onCompare}
          aria-pressed={compareActive}
        >
          Compare
        </button>
        <button type="button" className="chip" onClick={onReset} aria-label="Reset zoom">Reset</button>
        <button type="button" className="chip" onClick={onFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {fullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
}
