import type { DrawingTool, ChartType } from "../../types/chart";

interface Props {
  chartType: ChartType;
  onChartType: (t: ChartType) => void;
  drawing: DrawingTool;
  onDrawing: (t: DrawingTool) => void;
  onIndicators: () => void;
  onCompare: () => void;
  compareActive?: boolean;
  indicatorsOpen?: boolean;
  compareOpen?: boolean;
  onFullscreen: () => void;
  onReset: () => void;
  fullscreen: boolean;
  indicatorsBtnRef?: React.RefObject<HTMLButtonElement | null>;
  compareBtnRef?: React.RefObject<HTMLButtonElement | null>;
  indicatorsMenuId?: string;
  compareMenuId?: string;
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
  onIndicators, onCompare, compareActive = false,
  indicatorsOpen = false, compareOpen = false,
  onFullscreen, onReset, fullscreen,
  indicatorsBtnRef, compareBtnRef,
  indicatorsMenuId, compareMenuId,
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
            <span aria-hidden="true">{d.label}</span>
          </button>
        ))}
      </div>

      <div className="tc-toolbar-group tc-toolbar-actions">
        <button
          ref={indicatorsBtnRef}
          type="button"
          className={`chip ${indicatorsOpen ? "active" : ""}`}
          onClick={onIndicators}
          aria-expanded={indicatorsOpen}
          aria-controls={indicatorsMenuId}
          aria-haspopup="dialog"
        >
          Indicators
        </button>
        <button
          ref={compareBtnRef}
          type="button"
          className={`chip ${compareActive || compareOpen ? "active" : ""}`}
          onClick={onCompare}
          aria-pressed={compareActive}
          aria-expanded={compareOpen}
          aria-controls={compareMenuId}
          aria-haspopup="dialog"
        >
          Compare
        </button>
        <button type="button" className="chip" onClick={onReset} aria-label="Reset zoom to fit">Reset</button>
        <button
          type="button"
          className="chip"
          onClick={onFullscreen}
          aria-pressed={fullscreen}
          aria-label={fullscreen ? "Exit fullscreen chart" : "Enter fullscreen chart"}
        >
          {fullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
}
