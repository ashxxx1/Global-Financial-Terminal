import { formatVolume } from "../../lib/charts/indicators";
import type { ChartOhlcHover } from "../../types/chart";

interface Props {
  hover: ChartOhlcHover | null;
  currency?: string;
}

function fmt(n: number, currency = ""): string {
  if (!Number.isFinite(n)) return "—";
  return `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ChartCrosshair({ hover, currency = "" }: Props) {
  if (!hover) {
    return (
      <div className="tc-ohlc tc-ohlc-empty" id="tc-ohlc-readout">
        <span className="label">Move across the chart for OHLC · last bar also summarized for screen readers below</span>
      </div>
    );
  }
  const up = hover.close >= hover.open;
  return (
    <div className="tc-ohlc" id="tc-ohlc-readout" role="status" aria-live="polite">
      <span className="tc-ohlc-date mono">
        {new Date(hover.time).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: false,
        }).toUpperCase()}
      </span>
      <span><em aria-hidden="true">O</em><span className="sr-only">Open </span>{fmt(hover.open, currency)}</span>
      <span><em aria-hidden="true">H</em><span className="sr-only">High </span>{fmt(hover.high, currency)}</span>
      <span><em aria-hidden="true">L</em><span className="sr-only">Low </span>{fmt(hover.low, currency)}</span>
      <span className={up ? "up" : "down"}>
        <em aria-hidden="true">C</em><span className="sr-only">Close </span>{fmt(hover.close, currency)}
        <span className="sr-only">{up ? ", up on the session" : ", down on the session"}</span>
      </span>
      <span><em aria-hidden="true">V</em><span className="sr-only">Volume </span>{formatVolume(hover.volume)}</span>
    </div>
  );
}
