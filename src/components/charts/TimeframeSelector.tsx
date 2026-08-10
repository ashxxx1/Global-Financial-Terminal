import type { ChartRange, IntradayResolution } from "../../types/chart";
import { CHART_RANGES, INTRADAY_RESOLUTIONS, isIntradayRange } from "../../lib/charts/timeframes";

interface Props {
  range: ChartRange;
  onRange: (r: ChartRange) => void;
  intraday: IntradayResolution | null;
  onIntraday: (r: IntradayResolution | null) => void;
  compact?: boolean;
}

export default function TimeframeSelector({ range, onRange, intraday, onIntraday, compact }: Props) {
  const showIntra = isIntradayRange(range);
  return (
    <div className="tc-tf" role="group" aria-label="Chart timeframe">
      <div className="tc-tf-row">
        {CHART_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            className={`chip tc-tf-btn ${range === r ? "active" : ""}`}
            aria-pressed={range === r}
            onClick={() => {
              onRange(r);
              if (!isIntradayRange(r)) onIntraday(null);
            }}
          >
            {r}
          </button>
        ))}
      </div>
      {showIntra && !compact && (
        <div className="tc-tf-row tc-tf-intra" role="group" aria-label="Intraday resolution">
          {INTRADAY_RESOLUTIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip tc-tf-btn ${intraday === r || (!intraday && r === (range === "1D" ? "5m" : "15m")) ? "active" : ""}`}
              aria-pressed={intraday === r}
              onClick={() => onIntraday(r)}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
