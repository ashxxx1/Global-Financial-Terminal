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
      <div className="tc-ohlc tc-ohlc-empty" aria-hidden>
        <span className="label">Hover a candle for OHLC</span>
      </div>
    );
  }
  const up = hover.close >= hover.open;
  return (
    <div className="tc-ohlc" role="status" aria-live="polite">
      <span className="tc-ohlc-date mono">
        {new Date(hover.time).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: false,
        }).toUpperCase()}
      </span>
      <span><em>O</em> {fmt(hover.open, currency)}</span>
      <span><em>H</em> {fmt(hover.high, currency)}</span>
      <span><em>L</em> {fmt(hover.low, currency)}</span>
      <span className={up ? "up" : "down"}><em>C</em> {fmt(hover.close, currency)}</span>
      <span><em>V</em> {formatVolume(hover.volume)}</span>
    </div>
  );
}
