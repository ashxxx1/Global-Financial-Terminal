/** Thin helpers — GFT signal markers/levels applied to lightweight-charts series. */
import {
  createSeriesMarkers,
  type ISeriesApi,
  type IPriceLine,
  type SeriesMarker,
  type Time,
  LineStyle,
} from "lightweight-charts";
import type { ChartSignalView } from "../../lib/charts/signalOverlay";
import { kindColor, kindMarkerShape } from "../../lib/charts/signalOverlay";

export function buildSignalMarkers(
  signals: ChartSignalView[],
  timeLookup: (ms: number) => Time | null,
): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];
  for (const s of signals) {
    const time = timeLookup(s.time);
    if (time == null) continue;
    const color = kindColor(s.kind);
    markers.push({
      time,
      position: s.kind === "BUY" ? "belowBar" : "aboveBar",
      color,
      shape: kindMarkerShape(s.kind),
      text: s.kind,
      size: 1.2,
    });
  }
  return markers;
}

export function applySignalMarkers(
  series: ISeriesApi<"Candlestick" | "Line" | "Area">,
  signals: ChartSignalView[],
  timeLookup: (ms: number) => Time | null,
) {
  const markers = buildSignalMarkers(signals, timeLookup);
  return createSeriesMarkers(series, markers);
}

export interface SignalLevelLines {
  entry?: IPriceLine;
  target?: IPriceLine;
  stop?: IPriceLine;
}

export function applySignalLevels(
  series: ISeriesApi<"Candlestick" | "Line" | "Area">,
  signal: ChartSignalView | null,
  existing?: SignalLevelLines,
): SignalLevelLines {
  if (existing?.entry) series.removePriceLine(existing.entry);
  if (existing?.target) series.removePriceLine(existing.target);
  if (existing?.stop) series.removePriceLine(existing.stop);
  if (!signal) return {};

  return {
    entry: series.createPriceLine({
      price: signal.entry,
      color: "#4F8DFF",
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: "ENTRY",
    }),
    target: series.createPriceLine({
      price: signal.target,
      color: "#26D07C",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "TARGET",
    }),
    stop: series.createPriceLine({
      price: signal.stop,
      color: "#FF4D5E",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "STOP",
    }),
  };
}
