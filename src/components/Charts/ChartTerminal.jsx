import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush
} from "recharts";
import {
  Search, X, ChevronDown, TrendingUp, BarChart2, Activity,
  Minus, Square, Triangle, GitBranch, Type, MousePointer,
  Settings, Eye, EyeOff, Plus, Trash2, Maximize2, LayoutPanelTop
} from "lucide-react";
import {
  ASSET_CATALOG, TIMEFRAMES, generateOHLCV,
  calcSMA, calcEMA, calcBollingerBands, calcRSI, calcMACD, calcVWAP
} from "./chartData.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 2) => n == null ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtTime = (ts, tf) => {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  if (["1D","1W","1M"].includes(tf)) return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  return d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});
};
const pct = (a, b) => b ? (((a - b) / b) * 100).toFixed(2) : "0.00";

// ─── Candlestick Shape ────────────────────────────────────────────────────────
// ─── Candlestick Shape ────────────────────────────────────────────────────────
const CandlestickBar = (props) => {
  const { x, width, payload, yAxis, index } = props;
  const bar = payload || props;
  if (!bar || bar.high == null) return null;
  
  const cy = (v) => {
    if (yAxis?.scale) return yAxis.scale(v);
    const domain = yAxis?.domain;
    const height = yAxis?.height;
    const y = yAxis?.y;
    if (domain && height && y != null) {
      const [min, max] = domain;
      return y + height - ((v - min) / (max - min)) * height;
    }
    return props.y || 0;
  };

  const isUp = bar.close >= bar.open;
  const color = isUp ? "#22c55e" : "#ef4444";
  const wickX = x + width / 2;
  const bw = Math.max(width - 2, 1);
  const bx = x + 1;

  const yHigh = cy(bar.high);
  const yLow = cy(bar.low);
  const yOpen = cy(bar.open);
  const yClose = cy(bar.close);

  return (
    <g key={index}>
      <line x1={wickX} y1={yHigh} x2={wickX} y2={yLow} stroke={color} strokeWidth={1} />
      <rect
        x={bx} y={Math.min(yOpen, yClose)}
        width={bw} height={Math.max(Math.abs(yOpen - yClose), 1)}
        fill={color}
      />
    </g>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, timeframe }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-[#080f1e]/98 border border-[#1e293b] rounded-lg p-3 text-[10px] font-mono shadow-2xl min-w-[160px]">
      <div className="text-slate-400 mb-2 font-sans text-[9px] uppercase tracking-wider">{fmtTime(d.time, timeframe)}</div>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4"><span className="text-slate-500">O</span><span className="text-white">{fmt(d.open,4)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-500">H</span><span className="text-emerald-400">{fmt(d.high,4)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-500">L</span><span className="text-rose-400">{fmt(d.low,4)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-500">C</span><span className={d.close >= d.open ? "text-emerald-400":"text-rose-400"}>{fmt(d.close,4)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-500">V</span><span className="text-slate-300">{d.volume?.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

// ─── Drawing Tools Config ─────────────────────────────────────────────────────
const DRAWING_TOOLS = [
  { id: "cursor",    label: "Cursor",          icon: MousePointer },
  { id: "trendline", label: "Trend Line",       icon: TrendingUp },
  { id: "hline",     label: "Horizontal Line",  icon: Minus },
  { id: "vline",     label: "Vertical Line",    icon: Activity },
  { id: "rect",      label: "Rectangle",        icon: Square },
  { id: "fib",       label: "Fibonacci",        icon: GitBranch },
  { id: "text",      label: "Text Label",       icon: Type },
];

// ─── Indicator Config ─────────────────────────────────────────────────────────
const INDICATOR_DEFS = [
  { id: "sma20",  label: "SMA (20)",       group: "overlay", color: "#f59e0b", enabled: false },
  { id: "sma50",  label: "SMA (50)",       group: "overlay", color: "#a78bfa", enabled: false },
  { id: "sma200", label: "SMA (200)",      group: "overlay", color: "#38bdf8", enabled: false },
  { id: "ema12",  label: "EMA (12)",       group: "overlay", color: "#fb923c", enabled: false },
  { id: "ema26",  label: "EMA (26)",       group: "overlay", color: "#34d399", enabled: false },
  { id: "bb",     label: "Bollinger Bands",group: "overlay", color: "#e879f9", enabled: false },
  { id: "vwap",   label: "VWAP",           group: "overlay", color: "#67e8f9", enabled: false },
  { id: "volume", label: "Volume",         group: "sub",     color: "#6366f1", enabled: true },
  { id: "rsi",    label: "RSI (14)",       group: "sub",     color: "#f472b6", enabled: false },
  { id: "macd",   label: "MACD (12,26,9)", group: "sub",     color: "#22d3ee", enabled: false },
];

// ─── Main Chart Terminal ──────────────────────────────────────────────────────
export function ChartTerminal() {
  const [symbol, setSymbol]       = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("candle");
  const [search, setSearch]       = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [indicators, setIndicators] = useState(INDICATOR_DEFS);
  const [indicatorOpen, setIndicatorOpen] = useState(false);
  const [drawTool, setDrawTool]   = useState("cursor");
  const [drawings, setDrawings]   = useState([]);
  const [drawing, setDrawing]     = useState(null); // in-progress
  const [hoveredBar, setHoveredBar] = useState(null);
  const canvasRef = useRef(null);
  const chartAreaRef = useRef(null);
  const searchRef = useRef(null);

  const [selectedDrawingId, setSelectedDrawingId] = useState(null);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [indicatorSettings, setIndicatorSettings] = useState({
    sma20: { period: 20, color: "#f59e0b" },
    sma50: { period: 50, color: "#a78bfa" },
    sma200: { period: 200, color: "#38bdf8" },
    ema12: { period: 12, color: "#fb923c" },
    ema26: { period: 26, color: "#34d399" },
    bb: { period: 20, stdDev: 2, color: "#e879f9" },
    vwap: { color: "#67e8f9" },
    volume: { color: "#6366f1" },
    rsi: { period: 14, color: "#f472b6" },
    macd: { fast: 12, slow: 26, signal: 9, color: "#22d3ee" },
  });

  const asset = ASSET_CATALOG.find(a => a.symbol === symbol) || ASSET_CATALOG[0];
  const rawData = useMemo(() => generateOHLCV(symbol, timeframe), [symbol, timeframe]);

  // Merge indicator data into bars
  const sma20Data  = useMemo(() => calcSMA(rawData, indicatorSettings.sma20.period), [rawData, indicatorSettings.sma20.period]);
  const sma50Data  = useMemo(() => calcSMA(rawData, indicatorSettings.sma50.period), [rawData, indicatorSettings.sma50.period]);
  const sma200Data = useMemo(() => calcSMA(rawData, indicatorSettings.sma200.period), [rawData, indicatorSettings.sma200.period]);
  const ema12Data  = useMemo(() => calcEMA(rawData, indicatorSettings.ema12.period), [rawData, indicatorSettings.ema12.period]);
  const ema26Data  = useMemo(() => calcEMA(rawData, indicatorSettings.ema26.period), [rawData, indicatorSettings.ema26.period]);
  const bbData     = useMemo(() => calcBollingerBands(rawData, indicatorSettings.bb.period, indicatorSettings.bb.stdDev), [rawData, indicatorSettings.bb.period, indicatorSettings.bb.stdDev]);
  const rsiData    = useMemo(() => calcRSI(rawData, indicatorSettings.rsi.period), [rawData, indicatorSettings.rsi.period]);
  const macdResult = useMemo(() => calcMACD(rawData, indicatorSettings.macd.fast, indicatorSettings.macd.slow, indicatorSettings.macd.signal), [rawData, indicatorSettings.macd.fast, indicatorSettings.macd.slow, indicatorSettings.macd.signal]);
  const vwapData   = useMemo(() => calcVWAP(rawData), [rawData]);

  const isEnabled = (id) => indicators.find(i => i.id === id)?.enabled;
  const getColor  = (id) => indicatorSettings[id]?.color || "#fff";

  // Merge all overlay indicators into bar data
  const chartData = useMemo(() => {
    const byTime = {};
    rawData.forEach(b => { byTime[b.time] = { ...b }; });
    if (isEnabled("sma20"))  sma20Data.forEach(p => { if (byTime[p.time]) byTime[p.time].sma20 = p.value; });
    if (isEnabled("sma50"))  sma50Data.forEach(p => { if (byTime[p.time]) byTime[p.time].sma50 = p.value; });
    if (isEnabled("sma200")) sma200Data.forEach(p => { if (byTime[p.time]) byTime[p.time].sma200 = p.value; });
    if (isEnabled("ema12"))  ema12Data.forEach(p => { if (byTime[p.time]) byTime[p.time].ema12 = p.value; });
    if (isEnabled("ema26"))  ema26Data.forEach(p => { if (byTime[p.time]) byTime[p.time].ema26 = p.value; });
    if (isEnabled("vwap"))   vwapData.forEach(p => { if (byTime[p.time]) byTime[p.time].vwap = p.value; });
    if (isEnabled("bb")) {
      bbData.upper.forEach(p => { if (byTime[p.time]) byTime[p.time].bbUpper = p.value; });
      bbData.middle.forEach(p => { if (byTime[p.time]) byTime[p.time].bbMiddle = p.value; });
      bbData.lower.forEach(p => { if (byTime[p.time]) byTime[p.time].bbLower = p.value; });
    }
    return Object.values(byTime);
  }, [rawData, indicators, sma20Data, sma50Data, sma200Data, ema12Data, ema26Data, bbData, vwapData]);

  // RSI chart data
  const rsiChartData = useMemo(() => {
    const byTime = {};
    rawData.forEach(b => { byTime[b.time] = { time: b.time }; });
    rsiData.forEach(p => { if (byTime[p.time]) byTime[p.time].rsi = p.value; });
    return Object.values(byTime);
  }, [rawData, rsiData]);

  // MACD chart data
  const macdChartData = useMemo(() => {
    const byTime = {};
    rawData.forEach(b => { byTime[b.time] = { time: b.time }; });
    macdResult.macdLine.forEach(p  => { if (byTime[p.time]) byTime[p.time].macd = p.value; });
    macdResult.signalLine.forEach(p => { if (byTime[p.time]) byTime[p.time].signal = p.value; });
    macdResult.histogram.forEach(p  => { if (byTime[p.time]) byTime[p.time].hist = p.value; });
    return Object.values(byTime);
  }, [rawData, macdResult]);

  // Price stats
  const last   = rawData[rawData.length - 1];
  const first  = rawData[0];
  const change = last && first ? last.close - first.close : 0;
  const changePct = first ? pct(last?.close, first.close) : "0.00";
  const isUp   = change >= 0;

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!search) return ASSET_CATALOG.slice(0, 20);
    const q = search.toLowerCase();
    return ASSET_CATALOG.filter(a =>
      a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [search]);

  // Watchlist (pinned quick-access)
  const watchlist = ["AAPL","MSFT","NVDA","BTC","ETH","SPX","EURUSD","GOLD","OIL","TSLA"];

  // Toggle indicator
  const toggleIndicator = useCallback((id) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, enabled: !ind.enabled } : ind));
  }, []);

  // ── Canvas drawing overlay ──────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawings.forEach(d => renderDrawing(ctx, d, canvas, d.id === selectedDrawingId));
    if (drawing) renderDrawing(ctx, drawing, canvas, true);
  }, [drawings, drawing, selectedDrawingId]);

  function renderDrawing(ctx, d, canvas, isActive = false) {
    ctx.strokeStyle = isActive ? "#22d3ee" : "#6366f1";
    ctx.fillStyle = isActive ? "#22d3ee44" : "#6366f122";
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.setLineDash(isActive ? [4, 2] : []);
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#a5b4fc";

    // Draw grab handle circles on active selection
    if (isActive) {
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath(); ctx.arc(d.x1, d.y1, 4, 0, Math.PI * 2); ctx.fill();
      if (d.x2 != null) {
        ctx.beginPath(); ctx.arc(d.x2, d.y2, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (d.type === "trendline" && d.x2 != null) {
      ctx.setLineDash([]);
      ctx.strokeStyle = isActive ? "#818cf8" : "#6366f1";
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      // Arrow
      ctx.beginPath(); ctx.arc(d.x2, d.y2, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#6366f1"; ctx.fill();
    } else if (d.type === "hline") {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#f59e0b";
      ctx.beginPath(); ctx.moveTo(0, d.y1); ctx.lineTo(canvas.width, d.y1); ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.fillText(fmt(d.price, 4), 4, d.y1 - 4);
    } else if (d.type === "vline") {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#22d3ee";
      ctx.beginPath(); ctx.moveTo(d.x1, 0); ctx.lineTo(d.x1, canvas.height); ctx.stroke();
    } else if (d.type === "rect" && d.x2 != null) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "#a78bfa";
      ctx.fillStyle = "#6366f122";
      const rx = Math.min(d.x1, d.x2), ry = Math.min(d.y1, d.y2);
      const rw = Math.abs(d.x2 - d.x1), rh = Math.abs(d.y2 - d.y1);
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (d.type === "fib" && d.x2 != null) {
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const totalY = d.y2 - d.y1;
      levels.forEach((lvl, i) => {
        const y = d.y1 + totalY * lvl;
        const colors = ["#22d3ee","#a78bfa","#f59e0b","#f472b6","#4ade80","#fb923c","#22d3ee"];
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = colors[i] + "bb";
        ctx.beginPath(); ctx.moveTo(Math.min(d.x1,d.x2), y); ctx.lineTo(Math.max(d.x1,d.x2), y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors[i];
        ctx.fillText(`${(lvl * 100).toFixed(1)}%`, Math.max(d.x1,d.x2) + 4, y + 4);
      });
    } else if (d.type === "text" && d.label) {
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(d.label, d.x1, d.y1);
    }
    ctx.setLineDash([]);
  }

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  const handleCanvasResize = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = chartAreaRef.current;
    if (!canvas || !parent) return;
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    handleCanvasResize();
    window.addEventListener("resize", handleCanvasResize);
    return () => window.removeEventListener("resize", handleCanvasResize);
  }, [handleCanvasResize]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0 });

  const handleCanvasMouseDown = useCallback((e) => {
    const pos = getCanvasPos(e);
    if (drawTool === "cursor") {
      let foundId = null;
      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i];
        let hit = false;
        if (d.type === "hline") {
          hit = Math.abs(pos.y - d.y1) < 8;
        } else if (d.type === "vline") {
          hit = Math.abs(pos.x - d.x1) < 8;
        } else if (d.type === "trendline" && d.x2 != null) {
          const A = pos.x - d.x1;
          const B = pos.y - d.y1;
          const C = d.x2 - d.x1;
          const D = d.y2 - d.y1;
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;
          if (lenSq !== 0) param = dot / lenSq;
          let xx, yy;
          if (param < 0) {
            xx = d.x1; yy = d.y1;
          } else if (param > 1) {
            xx = d.x2; yy = d.y2;
          } else {
            xx = d.x1 + param * C;
            yy = d.y1 + param * D;
          }
          const dist = Math.sqrt((pos.x - xx) ** 2 + (pos.y - yy) ** 2);
          hit = dist < 8;
        } else if (d.type === "rect" && d.x2 != null) {
          const minX = Math.min(d.x1, d.x2);
          const maxX = Math.max(d.x1, d.x2);
          const minY = Math.min(d.y1, d.y2);
          const maxY = Math.max(d.y1, d.y2);
          const nearLeft = Math.abs(pos.x - minX) < 8 && pos.y >= minY && pos.y <= maxY;
          const nearRight = Math.abs(pos.x - maxX) < 8 && pos.y >= minY && pos.y <= maxY;
          const nearTop = Math.abs(pos.y - minY) < 8 && pos.x >= minX && pos.x <= maxX;
          const nearBottom = Math.abs(pos.y - maxY) < 8 && pos.x >= minX && pos.x <= maxX;
          hit = nearLeft || nearRight || nearTop || nearBottom;
        } else if (d.type === "fib" && d.x2 != null) {
          const minX = Math.min(d.x1, d.x2);
          const maxX = Math.max(d.x1, d.x2);
          if (pos.x >= minX - 8 && pos.x <= maxX + 8) {
            const totalY = d.y2 - d.y1;
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            hit = levels.some(lvl => Math.abs(pos.y - (d.y1 + totalY * lvl)) < 8);
          }
        } else if (d.type === "text") {
          hit = Math.sqrt((pos.x - d.x1) ** 2 + (pos.y - d.y1) ** 2) < 15;
        }
        if (hit) { foundId = d.id; break; }
      }
      setSelectedDrawingId(foundId);
      return;
    }
    
    if (drawTool === "hline") {
      setDrawings(prev => [...prev, { id: Date.now(), type: "hline", y1: pos.y, price: last?.close || 0 }]);
    } else if (drawTool === "vline") {
      setDrawings(prev => [...prev, { id: Date.now(), type: "vline", x1: pos.x }]);
    } else if (drawTool === "text") {
      setTextInput({ visible: true, x: pos.x, y: pos.y });
    } else {
      setDrawing({ id: Date.now(), type: drawTool, x1: pos.x, y1: pos.y });
    }
  }, [drawTool, drawings, last]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!drawing) return;
    const pos = getCanvasPos(e);
    setDrawing(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null);
  }, [drawing]);

  const handleCanvasMouseUp = useCallback(() => {
    if (drawing) {
      setDrawings(prev => [...prev, drawing]);
      setDrawing(null);
    }
  }, [drawing]);

  const clearDrawings = () => setDrawings([]);

  // Keyboard shortcut to delete selected drawing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedDrawingId && (e.key === "Delete" || e.key === "Backspace")) {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
          return;
        }
        setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDrawingId]);

  // ── Price domain ────────────────────────────────────────────────────────────
  const prices = chartData.flatMap(b => [b.high, b.low].filter(Boolean));
  const pMin = Math.min(...prices) * 0.998;
  const pMax = Math.max(...prices) * 1.002;

  // ── Sub-panel height calc ───────────────────────────────────────────────────
  const subPanels = [
    isEnabled("volume") ? "volume" : null,
    isEnabled("rsi")    ? "rsi"    : null,
    isEnabled("macd")   ? "macd"   : null,
  ].filter(Boolean);

  const mainHeightPct = subPanels.length === 0 ? 100
    : subPanels.length === 1 ? 68
    : subPanels.length === 2 ? 54 : 44;

  // Asset type badge color
  const typeColor = {
    Stock: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    Crypto: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Index: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    Forex: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    Commodity: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  }[asset.type] || "text-slate-400";

  return (
    <div className="flex flex-col h-full bg-[#040912] text-white overflow-hidden">

      {/* ── Top Bar ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e293b] bg-[#06091a] flex-shrink-0 flex-wrap">

        {/* Asset Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.querySelector("input")?.focus(), 50); }}
            className="flex items-center gap-2 bg-[#0c1220] border border-[#1e293b] hover:border-indigo-500/50 rounded-lg px-3 py-1.5 cursor-pointer transition-all min-w-[220px]"
          >
            <Search size={13} className="text-slate-500" />
            <span className="text-[13px] font-bold text-white">{asset.symbol}</span>
            <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{asset.name}</span>
            <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${typeColor}`}>{asset.type}</span>
            <ChevronDown size={11} className="text-slate-500 ml-1" />
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 mt-1 w-[340px] bg-[#080f1e] border border-[#1e293b] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <Search size={13} className="text-slate-500" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search symbol or name..."
                  className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-600 outline-none"
                />
                {search && <button onClick={() => setSearch("")}><X size={12} className="text-slate-500" /></button>}
              </div>
              <div className="flex gap-1 px-3 py-1.5 border-b border-white/5 flex-wrap">
                {["Stock","Crypto","Index","Forex","Commodity"].map(t => (
                  <button key={t} onClick={() => setSearch(t.toLowerCase())}
                    className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border border-white/10 text-slate-500 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer">
                    {t}
                  </button>
                ))}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map(a => (
                  <button key={a.symbol}
                    onClick={() => { setSymbol(a.symbol); setSearchOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer ${a.symbol === symbol ? "bg-indigo-500/10" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0c1220] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-slate-300">{a.symbol.slice(0,3)}</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-white">{a.symbol}</div>
                      <div className="text-[10px] text-slate-500 truncate">{a.name}</div>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${typeColor}`}>{a.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {searchOpen && <div className="fixed inset-0 z-40" onClick={() => { setSearchOpen(false); setSearch(""); }} />}

        {/* Price display */}
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-bold font-mono text-white">{fmt(last?.close, asset.basePrice < 10 ? 4 : 2)}</span>
          <span className={`text-[13px] font-bold font-mono ${isUp ? "text-emerald-400":"text-rose-400"}`}>
            {isUp ? "+" : ""}{fmt(change, asset.basePrice < 10 ? 4 : 2)} ({isUp ? "+" : ""}{changePct}%)
          </span>
        </div>

        {/* OHLCV strip */}
        {last && (
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono border-l border-white/5 pl-3">
            {[["O", last.open], ["H", last.high], ["L", last.low], ["C", last.close]].map(([k,v]) => (
              <span key={k} className="text-slate-500">{k} <span className={k==="H"?"text-emerald-400":k==="L"?"text-rose-400":"text-slate-300"}>{fmt(v, asset.basePrice < 10 ? 4 : 2)}</span></span>
            ))}
            <span className="text-slate-500">Vol <span className="text-slate-300">{last.volume?.toLocaleString()}</span></span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          {/* Chart type */}
          <div className="flex items-center bg-[#0c1220] border border-[#1e293b] rounded-lg overflow-hidden">
            {[["candle","Candles",BarChart2],["line","Line",TrendingUp],["area","Area",Activity]].map(([t,lbl,Icon]) => (
              <button key={t} onClick={() => setChartType(t)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${chartType===t ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-white"}`}>
                <Icon size={11} />{lbl}
              </button>
            ))}
          </div>

          {/* Timeframe */}
          <div className="flex items-center bg-[#0c1220] border border-[#1e293b] rounded-lg overflow-hidden">
            {TIMEFRAMES.map(tf => (
              <button key={tf.label} onClick={() => setTimeframe(tf.label)}
                className={`px-2.5 py-1.5 text-[10px] font-bold font-mono transition-all cursor-pointer ${timeframe===tf.label ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-white"}`}>
                {tf.label}
              </button>
            ))}
          </div>

          {/* Indicators button */}
          <div className="relative">
            <button onClick={() => setIndicatorOpen(!indicatorOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1220] border border-[#1e293b] hover:border-indigo-500/50 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer">
              <Activity size={12} />Indicators
              {indicators.filter(i=>i.enabled).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[8px] font-bold">
                  {indicators.filter(i=>i.enabled).length}
                </span>
              )}
            </button>
            {indicatorOpen && (
              <div className="absolute right-0 top-full mt-1 w-[240px] bg-[#080f1e] border border-[#1e293b] rounded-xl shadow-2xl z-50 p-2">
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1">Overlay Indicators</div>
                {indicators.filter(i=>i.group==="overlay").map(ind => (
                  <button key={ind.id} onClick={() => toggleIndicator(ind.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors ${ind.enabled ? "border-indigo-500 bg-indigo-500" : "border-slate-600"}`}>
                      {ind.enabled && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <div className="w-3 h-0.5 rounded" style={{background: ind.color}} />
                    <span className="text-[11px] text-slate-300">{ind.label}</span>
                  </button>
                ))}
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1 mt-1 border-t border-white/5">Sub-Panel Indicators</div>
                {indicators.filter(i=>i.group==="sub").map(ind => (
                  <button key={ind.id} onClick={() => toggleIndicator(ind.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors ${ind.enabled ? "border-indigo-500 bg-indigo-500" : "border-slate-600"}`}>
                      {ind.enabled && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <div className="w-3 h-0.5 rounded" style={{background: ind.color}} />
                    <span className="text-[11px] text-slate-300">{ind.label}</span>
                  </button>
                ))}
              </div>
            )}
            {indicatorOpen && <div className="fixed inset-0 z-40" onClick={() => setIndicatorOpen(false)} />}
          </div>
        </div>
      </div>

      {/* ── Watchlist quick-switch ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-[#1e293b] bg-[#040912] overflow-x-auto flex-shrink-0">
        <span className="text-[8px] text-slate-700 uppercase tracking-widest font-bold mr-1 shrink-0">WATCHLIST</span>
        {watchlist.map(sym => {
          const a = ASSET_CATALOG.find(x => x.symbol === sym);
          if (!a) return null;
          const d = generateOHLCV(sym, "1D");
          const chg = d.length > 1 ? pct(d[d.length-1].close, d[0].close) : "0.00";
          const up = parseFloat(chg) >= 0;
          return (
            <button key={sym} onClick={() => setSymbol(sym)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 border ${sym === symbol ? "bg-indigo-500/15 border-indigo-500/40 text-white" : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"}`}>
              <span className="font-mono">{sym}</span>
              <span className={`font-mono ${up ? "text-emerald-400":"text-rose-400"}`}>{up?"+":""}{chg}%</span>
            </button>
          );
        })}
      </div>

      {/* ── Body: Drawing Toolbar + Chart ────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Drawing Tools Sidebar */}
        <div className="w-10 bg-[#06091a] border-r border-[#1e293b] flex flex-col items-center py-3 gap-1.5 flex-shrink-0">
          {DRAWING_TOOLS.map(tool => (
            <button key={tool.id} onClick={() => setDrawTool(tool.id)}
              title={tool.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${drawTool===tool.id ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "text-slate-600 hover:text-slate-300 hover:bg-white/5"}`}>
              <tool.icon size={14} />
            </button>
          ))}
          <div className="h-px w-6 bg-white/10 my-1" />
          {selectedDrawingId && (
            <button onClick={() => {
              setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
              setSelectedDrawingId(null);
            }} title="Delete selected"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer">
              <X size={13} />
            </button>
          )}
          {drawings.length > 0 && (
            <button onClick={clearDrawings} title="Clear all drawings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Charts Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative" ref={chartAreaRef}>

          {/* Active Indicators Overlay List (TradingView style) */}
          <div className="absolute top-3 left-12 z-20 flex flex-col gap-1 pointer-events-auto select-none">
            {indicators.filter(ind => ind.enabled).map(ind => {
              const settings = indicatorSettings[ind.id];
              let desc = ind.label;
              if (settings?.period) desc += ` (${settings.period})`;
              else if (settings?.fast) desc += ` (${settings.fast}, ${settings.slow}, ${settings.signal})`;
              
              return (
                <div key={ind.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#080f1e]/85 backdrop-blur-sm border border-[#1e293b]/50 text-[10px] font-mono text-slate-300 shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: settings?.color || '#fff' }} />
                  <span className="font-bold">{desc}</span>
                  <button onClick={() => toggleIndicator(ind.id)} title="Remove" className="hover:text-rose-400 cursor-pointer pl-1"><X size={10} /></button>
                  {ind.id !== 'volume' && (
                    <button onClick={() => setEditingIndicator(ind.id)} title="Settings" className="hover:text-indigo-400 cursor-pointer"><Settings size={10} /></button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Text input for drawing labels */}
          {textInput.visible && (
            <input
              autoFocus
              className="absolute z-50 bg-[#0c1220] border border-indigo-500 rounded px-2 py-1 text-[12px] text-white outline-none"
              style={{ left: textInput.x, top: textInput.y - 20 }}
              placeholder="Label..."
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setDrawings(prev => [...prev, { id: Date.now(), type: "text", x1: textInput.x, y1: textInput.y, label: e.target.value }]);
                  setTextInput({ visible: false, x: 0, y: 0 });
                } else if (e.key === "Escape") {
                  setTextInput({ visible: false, x: 0, y: 0 });
                }
              }}
            />
          )}

          {/* Drawing overlay canvas */}
          <canvas ref={canvasRef}
            className="absolute inset-0 z-10 pointer-events-auto"
            style={{ cursor: drawTool === "cursor" ? "default" : "crosshair" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />

          {/* ── Main price chart ─────────────────────────────────────────────── */}
          <div style={{ height: `${mainHeightPct}%`, minHeight: 200 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" tickFormatter={t => fmtTime(t, timeframe)}
                  tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false}
                  interval="preserveStartEnd" minTickGap={60} />
                <YAxis domain={[pMin, pMax]} orientation="right" width={60}
                  tickFormatter={v => fmt(v, asset.basePrice < 10 ? 4 : 1)}
                  tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip timeframe={timeframe} />} />

                {/* Bollinger Bands — background fill */}
                {isEnabled("bb") && <>
                  <Area dataKey="bbUpper" fill="transparent" stroke={getColor("bb")} strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                  <Area dataKey="bbLower" fill={getColor("bb")+"18"} stroke={getColor("bb")} strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                </>}

                {/* Overlay indicators */}
                {isEnabled("sma20")  && <Line type="monotone" dataKey="sma20"   stroke={getColor("sma20")}  strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                {isEnabled("sma50")  && <Line type="monotone" dataKey="sma50"   stroke={getColor("sma50")}  strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                {isEnabled("sma200") && <Line type="monotone" dataKey="sma200"  stroke={getColor("sma200")} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                {isEnabled("ema12")  && <Line type="monotone" dataKey="ema12"   stroke={getColor("ema12")}  strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                {isEnabled("ema26")  && <Line type="monotone" dataKey="ema26"   stroke={getColor("ema26")}  strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                {isEnabled("vwap")   && <Line type="monotone" dataKey="vwap"    stroke={getColor("vwap")}   strokeWidth={1.5} strokeDasharray="4 2" dot={false} isAnimationActive={false} />}
                {isEnabled("bb")     && <Line type="monotone" dataKey="bbMiddle" stroke={getColor("bb")}    strokeWidth={1} dot={false} isAnimationActive={false} />}

                {/* Price series */}
                {chartType === "line" && (
                  <Line type="monotone" dataKey="close" stroke={asset.color || "#6366f1"}
                    strokeWidth={2} dot={false} isAnimationActive={false} />
                )}
                {chartType === "area" && (
                  <Area type="monotone" dataKey="close" stroke={asset.color || "#6366f1"}
                    fill={`${asset.color || "#6366f1"}22`} strokeWidth={2} dot={false} isAnimationActive={false} />
                )}
                {chartType === "candle" && chartData.map((bar, i) => {
                  const isBarUp = bar.close >= bar.open;
                  const color = isBarUp ? "#22c55e" : "#ef4444";
                  return null; // Rendered via Bar below
                })}
                {chartType === "candle" && (
                  <Bar dataKey="high" fill="transparent" isAnimationActive={false}
                    shape={<CandlestickBar />}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ── Volume Sub-panel ─────────────────────────────────────────────── */}
          {isEnabled("volume") && (
            <div className="border-t border-[#1e293b]" style={{ height: `${subPanels.length === 1 ? 32 : 22}%` }}>
              <div className="h-5 flex items-center px-3 border-b border-white/5">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Volume</span>
              </div>
              <ResponsiveContainer width="100%" height="calc(100% - 20px)">
                <ComposedChart data={chartData} margin={{ top: 2, right: 60, left: 0, bottom: 0 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis orientation="right" width={60} tickFormatter={v => (v/1000).toFixed(0)+"K"} tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="volume" isAnimationActive={false}
                    shape={(props) => {
                      const { x, y, width, height, index } = props;
                      const bar = chartData[index];
                      if (!bar) return null;
                      const color = bar.close >= bar.open ? "#22c55e44" : "#ef444444";
                      const stroke = bar.close >= bar.open ? "#22c55e" : "#ef4444";
                      return <rect x={x} y={y} width={Math.max(width-1,1)} height={height} fill={color} stroke={stroke} strokeWidth={0.5} />;
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── RSI Sub-panel ────────────────────────────────────────────────── */}
          {isEnabled("rsi") && (
            <div className="border-t border-[#1e293b]" style={{ height: "22%" }}>
              <div className="h-5 flex items-center px-3 border-b border-white/5">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">RSI (14)</span>
                {rsiChartData.length > 0 && (
                  <span className={`ml-2 text-[9px] font-bold font-mono ${
                    (rsiChartData[rsiChartData.length-1]?.rsi || 50) > 70 ? "text-rose-400" :
                    (rsiChartData[rsiChartData.length-1]?.rsi || 50) < 30 ? "text-emerald-400" : "text-slate-400"
                  }`}>{(rsiChartData[rsiChartData.length-1]?.rsi || 0).toFixed(2)}</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height="calc(100% - 20px)">
                <ComposedChart data={rsiChartData} margin={{ top: 2, right: 60, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} orientation="right" width={60}
                    ticks={[30, 50, 70]} tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={50} stroke="#475569" strokeDasharray="1 3" strokeWidth={1} />
                  <Line type="monotone" dataKey="rsi" stroke={getColor("rsi")} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── MACD Sub-panel ───────────────────────────────────────────────── */}
          {isEnabled("macd") && (
            <div className="border-t border-[#1e293b]" style={{ height: "22%" }}>
              <div className="h-5 flex items-center px-3 border-b border-white/5">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">MACD (12,26,9)</span>
              </div>
              <ResponsiveContainer width="100%" height="calc(100% - 20px)">
                <ComposedChart data={macdChartData} margin={{ top: 2, right: 60, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis orientation="right" width={60} tickFormatter={v => v.toFixed(2)} tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                  <Bar dataKey="hist" isAnimationActive={false}
                    shape={(props) => {
                      const { x, y, width, height, index } = props;
                      const bar = macdChartData[index];
                      if (!bar) return null;
                      const pos = (bar.hist || 0) >= 0;
                      return <rect x={x} y={y} width={Math.max(width-1,1)} height={Math.max(height,1)} fill={pos ? "#22c55e55" : "#ef444455"} stroke={pos ? "#22c55e" : "#ef4444"} strokeWidth={0.5} />;
                    }}
                  />
                  <Line type="monotone" dataKey="macd"   stroke={getColor("macd")} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="signal" stroke="#f472b6" strokeWidth={1} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1 border-t border-[#1e293b] bg-[#06091a] text-[9px] text-slate-600 flex-shrink-0">
        <span>{asset.name} · {timeframe} · {chartData.length} bars</span>
        <span className="ml-auto">Simulated data · Not real market prices · For demonstration only</span>
        <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase ${drawTool !== "cursor" ? "bg-indigo-500/20 text-indigo-400" : ""}`}>
          {drawTool !== "cursor" ? `✏ ${DRAWING_TOOLS.find(t=>t.id===drawTool)?.label}` : ""}
        </span>
      </div>
      {/* Indicator Settings Modal */}
      {editingIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#080f1e] border border-[#1e293b] rounded-xl p-5 w-80 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">
              Edit Settings: {indicators.find(i => i.id === editingIndicator)?.label}
            </h3>
            
            <div className="space-y-4">
              {indicatorSettings[editingIndicator]?.period !== undefined && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">Period</label>
                  <input
                    type="number"
                    value={indicatorSettings[editingIndicator].period}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setIndicatorSettings(prev => ({
                        ...prev,
                        [editingIndicator]: { ...prev[editingIndicator], period: val }
                      }));
                    }}
                    className="bg-[#0c1220] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              
              {editingIndicator === 'bb' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">StdDev</label>
                  <input
                    type="number"
                    step="0.1"
                    value={indicatorSettings.bb.stdDev}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0.1;
                      setIndicatorSettings(prev => ({
                        ...prev,
                        bb: { ...prev.bb, stdDev: val }
                      }));
                    }}
                    className="bg-[#0c1220] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              
              {editingIndicator === 'macd' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400">Fast</label>
                    <input
                      type="number"
                      value={indicatorSettings.macd.fast}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setIndicatorSettings(prev => ({
                          ...prev,
                          macd: { ...prev.macd, fast: val }
                        }));
                      }}
                      className="bg-[#0c1220] border border-[#1e293b] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400">Slow</label>
                    <input
                      type="number"
                      value={indicatorSettings.macd.slow}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setIndicatorSettings(prev => ({
                          ...prev,
                          macd: { ...prev.macd, slow: val }
                        }));
                      }}
                      className="bg-[#0c1220] border border-[#1e293b] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400">Signal</label>
                    <input
                      type="number"
                      value={indicatorSettings.macd.signal}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setIndicatorSettings(prev => ({
                          ...prev,
                          macd: { ...prev.macd, signal: val }
                        }));
                      }}
                      className="bg-[#0c1220] border border-[#1e293b] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
              
              {indicatorSettings[editingIndicator]?.color !== undefined && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={indicatorSettings[editingIndicator].color}
                      onChange={e => {
                        const val = e.target.value;
                        setIndicatorSettings(prev => ({
                          ...prev,
                          [editingIndicator]: { ...prev[editingIndicator], color: val }
                        }));
                      }}
                      className="w-8 h-8 rounded border border-[#1e293b] bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">{indicatorSettings[editingIndicator].color}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingIndicator(null)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChartTerminal;
