/**
 * TradingChart — professional OHLCV chart for GFT Terminal.
 * Built on TradingView lightweight-charts; GFT signal overlays are analytical,
 * not brokerage order tickets.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type Time,
  type MouseEventParams,
} from "lightweight-charts";
import TimeframeSelector from "./TimeframeSelector";
import ChartToolbar from "./ChartToolbar";
import ChartCrosshair from "./ChartCrosshair";
import IndicatorMenu from "./IndicatorMenu";
import CompareMenu from "./CompareMenu";
import SignalDetailPopover from "./SignalDetailPopover";
import ChartFullscreen from "./ChartFullscreen";
import { applySignalMarkers, applySignalLevels, type SignalLevelLines } from "./SignalMarker";
import { useChartData } from "../../hooks/useChartData";
import {
  computeSma, computeEma, computeRsi, computeMacd, computeBollinger, formatVolume,
} from "../../lib/charts/indicators";
import { getSignalsForChart, type ChartSignalView } from "../../lib/charts/signalOverlay";
import { freshness } from "../../lib/marketStatus";
import type { ChartRange, ChartType, ChartOhlcHover, DrawingTool, IndicatorId, IntradayResolution, ChartDrawing } from "../../types/chart";
import type { OhlcvBar } from "../../types/market";
import { INDICATOR_DEFS } from "../../types/chart";

export interface TradingChartProps {
  symbol: string;
  name: string;
  currency?: string;
  price?: number | null;
  changePct?: number | null;
  country?: string | null;
  source?: "live" | "cached" | "sim";
  className?: string;
}

const COMPARE_COLORS = ["#2DE2E6", "#E7B429", "#9B7BFF", "#FF8A5B", "#4F8DFF"];

function toChartTime(ms: number): Time {
  // Daily+ → business day string; intraday → unix sec
  if (ms % 86400000 === 0 || looksDaily(ms)) {
    const d = new Date(ms);
    // Prefer UTC date string for daily bars to avoid TZ shifts
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    // If bar is clearly intraday (has time component in local session), use unix
    const hours = d.getUTCHours();
    const mins = d.getUTCMinutes();
    if (hours !== 0 || mins !== 0) return Math.floor(ms / 1000) as Time;
    return `${y}-${m}-${day}` as Time;
  }
  return Math.floor(ms / 1000) as Time;
}

function looksDaily(ms: number): boolean {
  const d = new Date(ms);
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
}

function nearestBarTime(bars: OhlcvBar[], ms: number): Time | null {
  if (!bars.length) return null;
  let best = bars[0];
  let bestDist = Math.abs(bars[0].t - ms);
  for (const b of bars) {
    const d = Math.abs(b.t - ms);
    if (d < bestDist) { best = b; bestDist = d; }
  }
  // Only attach if within ~2 days for daily / ~2 bars for intraday
  const span = bars.length > 1 ? Math.abs(bars[bars.length - 1].t - bars[0].t) / bars.length : 86400000;
  if (bestDist > Math.max(span * 2.5, 86400000 * 2)) return null;
  return toChartTime(best.t);
}

function defaultIndicators(): Set<IndicatorId> {
  return new Set(INDICATOR_DEFS.filter((d) => d.defaultOn).map((d) => d.id));
}

export default function TradingChart({
  symbol, name, currency = "", price, changePct, country, source = "sim", className,
}: TradingChartProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const chartHostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlayRefs = useRef<ISeriesApi<"Line">[]>([]);
  const compareRefs = useRef<ISeriesApi<"Line">[]>([]);
  const rsiRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdRefs = useRef<{ macd?: ISeriesApi<"Line">; signal?: ISeriesApi<"Line">; hist?: ISeriesApi<"Histogram"> }>({});
  const markersApiRef = useRef<{ detach: () => void } | null>(null);
  const levelsRef = useRef<SignalLevelLines>({});
  const drawLinesRef = useRef<IPriceLine[]>([]);
  const barsRef = useRef<OhlcvBar[]>([]);
  const drawPointsRef = useRef<{ time: Time; price: number }[]>([]);

  const [range, setRange] = useState<ChartRange>("3M");
  const [intraday, setIntraday] = useState<IntradayResolution | null>(null);
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [enabled, setEnabled] = useState<Set<IndicatorId>>(defaultIndicators);
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [hover, setHover] = useState<ChartOhlcHover | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [drawing, setDrawing] = useState<DrawingTool>("none");
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [signals, setSignals] = useState<ChartSignalView[]>([]);
  const [activeSignal, setActiveSignal] = useState<ChartSignalView | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<ChartSignalView | null>(null);

  const { data, compare, loading, error, reload } = useChartData({
    symbol,
    range,
    intraday,
    compareSymbols,
  });

  const up = (changePct ?? 0) >= 0;
  const fresh = freshness(source, country ?? null);
  const compareMode = compareSymbols.length > 0 && compare.length > 1;

  // Load GFT signals for this symbol
  useEffect(() => {
    let cancelled = false;
    getSignalsForChart(symbol).then((list) => {
      if (cancelled) return;
      setSignals(list);
      const active = [...list].reverse().find((s) => s.status === "ACTIVE") || list[list.length - 1] || null;
      setActiveSignal(active);
    }).catch(() => {
      if (!cancelled) setSignals([]);
    });
    return () => { cancelled = true; };
  }, [symbol]);

  const toggleIndicator = useCallback((id: IndicatorId) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Create chart once
  useEffect(() => {
    const host = chartHostRef.current;
    if (!host) return;

    const chart = createChart(host, {
      layout: {
        background: { color: "transparent" },
        textColor: "#939DB1",
        fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(150,174,216,0.06)" },
        horzLines: { color: "rgba(150,174,216,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(45,226,230,0.45)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#111B2C" },
        horzLine: { color: "rgba(45,226,230,0.45)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#111B2C" },
      },
      rightPriceScale: {
        borderColor: "rgba(150,174,216,0.12)",
        scaleMargins: { top: 0.08, bottom: 0.18 },
      },
      timeScale: {
        borderColor: "rgba(150,174,216,0.12)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (!chartHostRef.current) return;
      chart.applyOptions({
        width: chartHostRef.current.clientWidth,
        height: chartHostRef.current.clientHeight,
      });
    });
    ro.observe(host);

    return () => {
      ro.disconnect();
      markersApiRef.current?.detach();
      markersApiRef.current = null;
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // Crosshair OHLC readout
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const handler = (param: MouseEventParams<Time>) => {
      if (!param.time || !param.seriesData || !mainSeriesRef.current) {
        setHover(null);
        return;
      }
      const bars = barsRef.current;
      const t = param.time;
      let bar: OhlcvBar | undefined;
      if (typeof t === "string") {
        bar = bars.find((b) => toChartTime(b.t) === t);
      } else if (typeof t === "number") {
        bar = bars.find((b) => Math.floor(b.t / 1000) === t);
      }
      const sd = param.seriesData.get(mainSeriesRef.current) as
        | { open?: number; high?: number; low?: number; close?: number; value?: number }
        | undefined;
      if (bar) {
        setHover({
          time: bar.t,
          open: bar.o,
          high: bar.h,
          low: bar.l,
          close: bar.c,
          volume: bar.v,
        });
      } else if (sd) {
        const c = sd.close ?? sd.value ?? 0;
        setHover({
          time: typeof t === "number" ? t * 1000 : Date.now(),
          open: sd.open ?? c,
          high: sd.high ?? c,
          low: sd.low ?? c,
          close: c,
          volume: 0,
        });
      }
    };
    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, [data, chartType]);

  // Click: select historical signal OR place drawing
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const onClick = (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point) return;

      if (drawing !== "none" && mainSeriesRef.current) {
        const price = mainSeriesRef.current.coordinateToPrice(param.point.y);
        if (price == null) return;
        const pt = { time: param.time, price };
        if (drawing === "horizontal" || drawing === "sr") {
          const line = mainSeriesRef.current.createPriceLine({
            price,
            color: drawing === "sr" ? "#E7B429" : "#939DB1",
            lineWidth: 1,
            lineStyle: drawing === "sr" ? LineStyle.Dashed : LineStyle.Solid,
            axisLabelVisible: true,
            title: drawing === "sr" ? "S/R" : "",
          });
          drawLinesRef.current.push(line);
          setDrawings((d) => [...d, { id: `d_${Date.now()}`, tool: drawing, price }]);
          return;
        }
        if (drawing === "vertical") {
          // Approximate vertical with a zero-span trend via markers — store only
          setDrawings((d) => [...d, { id: `d_${Date.now()}`, tool: "vertical", time: typeof param.time === "number" ? param.time : undefined }]);
          return;
        }
        if (drawing === "trendline") {
          drawPointsRef.current.push(pt);
          if (drawPointsRef.current.length >= 2) {
            const [a, b] = drawPointsRef.current;
            const series = chartRef.current?.addSeries(LineSeries, {
              color: "#4F8DFF",
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            series?.setData([
              { time: a.time, value: a.price },
              { time: b.time, value: b.price },
            ]);
            setDrawings((d) => [...d, {
              id: `d_${Date.now()}`, tool: "trendline",
              price: a.price, price2: b.price,
            }]);
            drawPointsRef.current = [];
          }
          return;
        }
      }

      // Hit-test nearest signal
      if (!param.time) return;
      const bars = barsRef.current;
      let clickMs: number | null = null;
      if (typeof param.time === "string") {
        clickMs = Date.parse(param.time + "T00:00:00Z");
      } else if (typeof param.time === "number") {
        clickMs = param.time * 1000;
      }
      if (clickMs == null) return;
      let best: ChartSignalView | null = null;
      let bestDist = Infinity;
      for (const s of signals) {
        const dist = Math.abs(s.time - clickMs);
        if (dist < bestDist) { best = s; bestDist = dist; }
      }
      const span = bars.length > 1 ? Math.abs(bars[bars.length - 1].t - bars[0].t) / bars.length : 86400000;
      if (best && bestDist < Math.max(span * 3, 3 * 86400000)) {
        setSelectedSignal(best);
        setActiveSignal(best);
      }
    };
    chart.subscribeClick(onClick);
    return () => chart.unsubscribeClick(onClick);
  }, [drawing, signals]);

  // Render / update series when data or options change
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data) return;

    // Clear previous series
    markersApiRef.current?.detach();
    markersApiRef.current = null;
    levelsRef.current = {};
    for (const s of overlayRefs.current) {
      try { chart.removeSeries(s); } catch { /* gone */ }
    }
    overlayRefs.current = [];
    for (const s of compareRefs.current) {
      try { chart.removeSeries(s); } catch { /* gone */ }
    }
    compareRefs.current = [];
    if (rsiRef.current) {
      try { chart.removeSeries(rsiRef.current); } catch { /* */ }
      rsiRef.current = null;
    }
    for (const s of Object.values(macdRefs.current)) {
      if (s) try { chart.removeSeries(s); } catch { /* */ }
    }
    macdRefs.current = {};
    if (volumeRef.current) {
      try { chart.removeSeries(volumeRef.current); } catch { /* */ }
      volumeRef.current = null;
    }
    if (mainSeriesRef.current) {
      try { chart.removeSeries(mainSeriesRef.current); } catch { /* */ }
      mainSeriesRef.current = null;
    }
    // Drop leftover indicator panes from the previous render
    try {
      const panes = chart.panes();
      for (let i = panes.length - 1; i >= 1; i--) {
        chart.removePane(i);
      }
    } catch { /* older runtime */ }

    const bars = data.candles;
    barsRef.current = bars;
    if (!bars.length) return;

    const showVolume = enabled.has("volume") && !compareMode;

    if (compareMode) {
      chart.applyOptions({
        rightPriceScale: { scaleMargins: { top: 0.08, bottom: 0.08 } },
      });
      compare.forEach((series, i) => {
        const first = series.candles.find((c) => c.c > 0)?.c ?? 1;
        const line = chart.addSeries(LineSeries, {
          color: COMPARE_COLORS[i % COMPARE_COLORS.length],
          lineWidth: i === 0 ? 2 : 1,
          priceLineVisible: false,
          lastValueVisible: true,
          title: series.symbol,
        });
        line.setData(series.candles.map((c) => ({
          time: toChartTime(c.t),
          value: ((c.c - first) / first) * 100,
        })));
        compareRefs.current.push(line);
      });
      chart.timeScale().fitContent();
      return;
    }

    // Main price series
    let main: ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area">;
    if (chartType === "line") {
      main = chart.addSeries(LineSeries, {
        color: "#2DE2E6",
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      main.setData(bars.map((b) => ({ time: toChartTime(b.t), value: b.c })));
    } else if (chartType === "area") {
      main = chart.addSeries(AreaSeries, {
        lineColor: "#2DE2E6",
        topColor: "rgba(45,226,230,0.28)",
        bottomColor: "rgba(45,226,230,0.02)",
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      main.setData(bars.map((b) => ({ time: toChartTime(b.t), value: b.c })));
    } else {
      main = chart.addSeries(CandlestickSeries, {
        upColor: "#26D07C",
        downColor: "#FF4D5E",
        borderUpColor: "#26D07C",
        borderDownColor: "#FF4D5E",
        wickUpColor: "#26D07C",
        wickDownColor: "#FF4D5E",
      });
      main.setData(bars.map((b) => ({
        time: toChartTime(b.t),
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
      })));
    }
    mainSeriesRef.current = main;

    chart.applyOptions({
      rightPriceScale: { scaleMargins: { top: 0.06, bottom: 0.06 } },
    });

    // Extra panes: volume → RSI → MACD (pane indices 1+)
    let nextPane = 1;

    if (showVolume) {
      const volPane = nextPane++;
      const vol = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        lastValueVisible: false,
        priceLineVisible: false,
      }, volPane);
      vol.setData(bars.map((b) => ({
        time: toChartTime(b.t),
        value: b.v,
        color: b.c >= b.o ? "rgba(38,208,124,0.45)" : "rgba(255,77,94,0.45)",
      })));
      volumeRef.current = vol;
      try {
        chart.panes()[volPane]?.setHeight(72);
      } catch { /* pane height optional */ }
    }

    // Moving averages / BB on price pane (0)
    const maColor: Record<string, string> = {
      sma20: "#E7B429",
      sma50: "#4F8DFF",
      sma200: "#9B7BFF",
      ema20: "#FF8A5B",
      ema50: "#2DE2E6",
    };
    const addLine = (pts: { t: number; v: number }[], color: string, title: string) => {
      if (!pts.length) return;
      const s = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title,
      });
      s.setData(pts.map((p) => ({ time: toChartTime(p.t), value: p.v })));
      overlayRefs.current.push(s);
    };
    if (enabled.has("sma20")) addLine(computeSma(bars, 20), maColor.sma20, "SMA20");
    if (enabled.has("sma50")) addLine(computeSma(bars, 50), maColor.sma50, "SMA50");
    if (enabled.has("sma200")) addLine(computeSma(bars, 200), maColor.sma200, "SMA200");
    if (enabled.has("ema20")) addLine(computeEma(bars, 20), maColor.ema20, "EMA20");
    if (enabled.has("ema50")) addLine(computeEma(bars, 50), maColor.ema50, "EMA50");
    if (enabled.has("bb")) {
      const bb = computeBollinger(bars, 20, 2);
      addLine(bb.upper, "rgba(150,174,216,0.55)", "BB U");
      addLine(bb.mid, "rgba(150,174,216,0.35)", "BB M");
      addLine(bb.lower, "rgba(150,174,216,0.55)", "BB L");
    }

    if (enabled.has("rsi")) {
      const rsiPane = nextPane++;
      const rsi = computeRsi(bars, 14);
      const s = chart.addSeries(LineSeries, {
        color: "#9B7BFF",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "RSI",
      }, rsiPane);
      s.setData(rsi.map((p) => ({ time: toChartTime(p.t), value: p.v })));
      // Reference bands via price lines on RSI series
      s.createPriceLine({ price: 70, color: "rgba(255,77,94,0.35)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
      s.createPriceLine({ price: 30, color: "rgba(38,208,124,0.35)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
      rsiRef.current = s;
      try { chart.panes()[rsiPane]?.setHeight(88); } catch { /* */ }
    }

    if (enabled.has("macd")) {
      const macdPane = nextPane;
      const m = computeMacd(bars);
      const hist = chart.addSeries(HistogramSeries, {
        lastValueVisible: false,
        priceLineVisible: false,
      }, macdPane);
      hist.setData(m.hist.map((p) => ({
        time: toChartTime(p.t),
        value: p.v,
        color: p.v >= 0 ? "rgba(38,208,124,0.5)" : "rgba(255,77,94,0.5)",
      })));
      const macdLine = chart.addSeries(LineSeries, {
        color: "#4F8DFF",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "MACD",
      }, macdPane);
      macdLine.setData(m.macd.map((p) => ({ time: toChartTime(p.t), value: p.v })));
      const sigLine = chart.addSeries(LineSeries, {
        color: "#E7B429",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "Signal",
      }, macdPane);
      sigLine.setData(m.signal.map((p) => ({ time: toChartTime(p.t), value: p.v })));
      macdRefs.current = { macd: macdLine, signal: sigLine, hist };
      try { chart.panes()[macdPane]?.setHeight(96); } catch { /* */ }
    }

    // Signal markers + levels
    markersApiRef.current = applySignalMarkers(main, signals, (ms) => nearestBarTime(bars, ms));
    levelsRef.current = applySignalLevels(main, activeSignal, undefined);

    // Re-apply user drawings (horizontals)
    drawLinesRef.current = [];
    for (const d of drawings) {
      if ((d.tool === "horizontal" || d.tool === "sr") && d.price != null) {
        drawLinesRef.current.push(main.createPriceLine({
          price: d.price,
          color: d.tool === "sr" ? "#E7B429" : "#939DB1",
          lineWidth: 1,
          lineStyle: d.tool === "sr" ? LineStyle.Dashed : LineStyle.Solid,
          axisLabelVisible: true,
          title: d.tool === "sr" ? "S/R" : "",
        }));
      }
    }

    chart.timeScale().fitContent();
  }, [data, chartType, enabled, compareMode, compare, signals, activeSignal, drawings]);

  const resetZoom = () => {
    chartRef.current?.timeScale().fitContent();
  };

  const sessionLabel = useMemo(() => {
    if (source === "sim") return "Simulated series";
    return fresh.label;
  }, [source, fresh.label]);

  const lastBar = data?.candles[data.candles.length - 1];

  return (
    <div
      ref={shellRef}
      className={`tc-shell panel ${fullscreen ? "tc-fullscreen" : ""} ${className || ""}`}
    >
      <ChartFullscreen active={fullscreen} containerRef={shellRef} onChange={setFullscreen} />

      {/* Header */}
      <div className="tc-header">
        <div className="tc-header-main">
          <div className="tc-title-block">
            <h2 className="tc-symbol mono">{symbol}</h2>
            <div className="tc-name">{name}</div>
          </div>
          <div className="tc-price-block">
            <div className="tc-price mono">
              {currency}{(price ?? lastBar?.c)?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"}
            </div>
            <div className={`tc-chg mono ${up ? "up" : "down"}`}>
              {(() => {
                if (changePct == null || price == null) return "—";
                const abs = price - price / (1 + changePct / 100);
                const sign = changePct >= 0 ? "+" : "";
                return `${sign}${abs.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
              })()}
            </div>
            <div className="tc-session">
              <span className={`fresh fresh-${fresh.tone}`}>
                <span className="fresh-dot" />
                {sessionLabel}
              </span>
              {data?.source === "live" && (
                <span className="label" style={{ marginLeft: 8 }}>LIVE OHLCV · delayed free-tier</span>
              )}
              {data?.source === "sim" && (
                <span className="label" style={{ marginLeft: 8 }}>SIM candles — not live market history</span>
              )}
            </div>
          </div>
        </div>

        <div className="tc-header-controls">
          <TimeframeSelector
            range={range}
            onRange={setRange}
            intraday={intraday}
            onIntraday={setIntraday}
          />
          <ChartToolbar
            chartType={chartType}
            onChartType={setChartType}
            drawing={drawing}
            onDrawing={setDrawing}
            onIndicators={() => { setIndicatorsOpen((v) => !v); setCompareOpen(false); }}
            onCompare={() => { setCompareOpen((v) => !v); setIndicatorsOpen(false); }}
            onFullscreen={() => setFullscreen((v) => !v)}
            onReset={resetZoom}
            fullscreen={fullscreen}
          />
        </div>
      </div>

      <ChartCrosshair hover={hover} currency={currency} />

      {/* Active GFT signal strip */}
      {activeSignal && !compareMode && (
        <div className="tc-signal-strip">
          <span className="tc-signal-badge" style={{ color: activeSignal.kind === "BUY" ? "var(--up)" : activeSignal.kind === "SELL" ? "var(--down)" : "var(--gold)" }}>
            GFT {activeSignal.kind}
          </span>
          <span className="mono">Entry {formatPx(activeSignal.entry)}</span>
          <span className="mono" style={{ color: "var(--up)" }}>Target {formatPx(activeSignal.target)}</span>
          <span className="mono" style={{ color: "var(--down)" }}>Stop {formatPx(activeSignal.stop)}</span>
          <span className="label">Analytical signal — not an order ticket</span>
          {signals.length > 1 && (
            <button type="button" className="chip" style={{ marginLeft: "auto" }} onClick={() => setSelectedSignal(activeSignal)}>
              History ({signals.length})
            </button>
          )}
        </div>
      )}

      <div className="tc-body">
        <div className="tc-chart-host" ref={chartHostRef} role="img" aria-label={`${symbol} trading chart`} />

        {loading && (
          <div className="tc-overlay">
            <div className="skeleton" style={{ width: "40%", height: 10, marginBottom: 10 }} />
            <div className="label">Loading market data…</div>
          </div>
        )}
        {error && !loading && (
          <div className="tc-overlay tc-overlay-error">
            <div className="label" style={{ color: "var(--down)" }}>{error}</div>
            <button type="button" className="chip" onClick={reload}>Retry</button>
          </div>
        )}

        <div className="tc-menus">
          <IndicatorMenu
            open={indicatorsOpen}
            onClose={() => setIndicatorsOpen(false)}
            enabled={enabled}
            onToggle={toggleIndicator}
          />
          <CompareMenu
            open={compareOpen}
            onClose={() => setCompareOpen(false)}
            primary={symbol}
            selected={compareSymbols}
            onChange={setCompareSymbols}
            perf={compare.map((c) => ({ symbol: c.symbol, perfPct: c.perfPct }))}
          />
          <SignalDetailPopover signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
        </div>
      </div>

      {/* Signal history rail */}
      {signals.length > 0 && !compareMode && (
        <div className="tc-signal-history" aria-label="GFT signal history">
          {signals.slice(-12).map((s) => (
            <button
              key={s.id}
              type="button"
              className={`tc-hist-chip ${activeSignal?.id === s.id ? "active" : ""}`}
              onClick={() => { setActiveSignal(s); setSelectedSignal(s); }}
            >
              <span className="label">{new Date(s.time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <span style={{ color: s.kind === "BUY" ? "var(--up)" : s.kind === "SELL" ? "var(--down)" : "var(--gold)" }}>{s.kind}</span>
            </button>
          ))}
        </div>
      )}

      {lastBar && hover == null && (
        <div className="sr-only">
          Last bar O {lastBar.o} H {lastBar.h} L {lastBar.l} C {lastBar.c} V {formatVolume(lastBar.v)}
        </div>
      )}
    </div>
  );
}

function formatPx(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
