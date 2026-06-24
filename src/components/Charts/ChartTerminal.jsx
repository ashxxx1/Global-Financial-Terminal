import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Search, X, ChevronDown, TrendingUp, BarChart2, Activity,
  Minus, Square, GitBranch, Type, MousePointer,
  Settings, EyeOff, Trash2, LayoutPanelTop, Eraser
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
const CandlestickBar = (props) => {
  const { x, width, payload, pMin, index } = props;
  const bar = payload || props;
  if (!bar || bar.high == null || pMin == null) return null;

  const yHigh = props.y;
  const yHeight = props.height;
  const highVal = bar.high;

  const cy = (v) => {
    const diff = highVal - pMin;
    if (diff <= 0) return yHigh;
    return yHigh + ((highVal - v) * yHeight) / diff;
  };

  const isUp = bar.close >= bar.open;
  const color = isUp ? "#22c55e" : "#ef4444";
  const wickX = x + width / 2;
  const bw = Math.max(width - 2, 1);
  const bx = x + 1;

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
  { id: "cursor",    label: "Cursor / Select", icon: MousePointer },
  { id: "trendline", label: "Trend Line",       icon: TrendingUp },
  { id: "hline",     label: "Horizontal Line",  icon: Minus },
  { id: "vline",     label: "Vertical Line",    icon: Activity },
  { id: "rect",      label: "Rectangle",        icon: Square },
  { id: "fib",       label: "Fibonacci",        icon: GitBranch },
  { id: "text",      label: "Text Label",       icon: Type },
];

// ─── Indicator Config ─────────────────────────────────────────────────────────
const INDICATOR_DEFS = [
  { id: "sma20",  label: "SMA (20)",       group: "overlay", enabled: false },
  { id: "sma50",  label: "SMA (50)",       group: "overlay", enabled: false },
  { id: "sma200", label: "SMA (200)",      group: "overlay", enabled: false },
  { id: "ema12",  label: "EMA (12)",       group: "overlay", enabled: false },
  { id: "ema26",  label: "EMA (26)",       group: "overlay", enabled: false },
  { id: "bb",     label: "Bollinger Bands",group: "overlay", enabled: false },
  { id: "vwap",   label: "VWAP",           group: "overlay", enabled: false },
  { id: "volume", label: "Volume",         group: "sub",     enabled: true },
  { id: "rsi",    label: "RSI (14)",       group: "sub",     enabled: false },
  { id: "macd",   label: "MACD (12,26,9)", group: "sub",     enabled: false },
];

// ─── Main Chart Terminal ──────────────────────────────────────────────────────
export function ChartTerminal() {
  // Chart 1 state
  const [symbol, setSymbol]       = useState("GOLD");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("candle");
  const [drawings, setDrawings]   = useState([]);
  const [search, setSearch]       = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Chart 2 state (comparable)
  const [symbol2, setSymbol2]       = useState("BTC");
  const [timeframe2, setTimeframe2] = useState("1D");
  const [chartType2, setChartType2] = useState("candle");
  const [drawings2, setDrawings2]   = useState([]);
  const [search2, setSearch2]       = useState("");
  const [searchOpen2, setSearchOpen2] = useState(false);

  const [layout, setLayout]       = useState("single"); // "single" or "split"
  const [drawTool, setDrawTool]   = useState("cursor");
  const [drawing, setDrawing]     = useState(null); // in-progress
  
  const [indicators, setIndicators] = useState(INDICATOR_DEFS);
  const [indicatorOpen, setIndicatorOpen] = useState(false);

  const [selectedDrawingId, setSelectedDrawingId] = useState(null);
  const [selectedDrawingPane, setSelectedDrawingPane] = useState(null); // 1 or 2
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

  const [compareSymbol1, setCompareSymbol1] = useState(null);
  const [compareSymbol2, setCompareSymbol2] = useState(null);
  const [compareSearchOpen1, setCompareSearchOpen1] = useState(false);
  const [compareSearchOpen2, setCompareSearchOpen2] = useState(false);
  const [compareSearch1, setCompareSearch1] = useState("");
  const [compareSearch2, setCompareSearch2] = useState("");

  const [formState, setFormState] = useState(null);

  useEffect(() => {
    if (editingIndicator) {
      setFormState({ ...indicatorSettings[editingIndicator] });
    } else {
      setFormState(null);
    }
  }, [editingIndicator, indicatorSettings]);

  const saveIndicatorSettings = () => {
    if (editingIndicator && formState) {
      const updated = { ...formState };
      if (updated.period === "") updated.period = 20;
      if (updated.stdDev === "") updated.stdDev = 2;
      if (updated.fast === "") updated.fast = 12;
      if (updated.slow === "") updated.slow = 26;
      if (updated.signal === "") updated.signal = 9;

      setIndicatorSettings(prev => ({
        ...prev,
        [editingIndicator]: updated
      }));
    }
    setEditingIndicator(null);
  };

  const canvasRef = useRef(null);
  const canvasRef2 = useRef(null);
  const chartAreaRef = useRef(null);
  const chartAreaRef2 = useRef(null);
  const searchRef = useRef(null);
  const searchRef2 = useRef(null);

  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, paneId: null });
  const [showHelp, setShowHelp] = useState(true);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);
  const [searchTab, setSearchTab] = useState("All");
  const [searchTab2, setSearchTab2] = useState("All");

  const isEnabled = (id) => indicators.find(i => i.id === id)?.enabled;
  const getColor  = (id) => indicatorSettings[id]?.color || "#fff";

  // Watchlist (pinned quick-access)
  const watchlist = ["NIFTY", "RELIANCE", "TCS", "HDFCBANK", "AAPL", "BTC", "GOLD", "EURUSD"];

  // Toggle indicator
  const toggleIndicator = useCallback((id) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, enabled: !ind.enabled } : ind));
  }, []);

  const deleteSelectedDrawing = useCallback(() => {
    if (!selectedDrawingId || !selectedDrawingPane) return;
    if (selectedDrawingPane === 1) {
      setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
    } else {
      setDrawings2(prev => prev.filter(d => d.id !== selectedDrawingId));
    }
    setSelectedDrawingId(null);
    setSelectedDrawingPane(null);
  }, [selectedDrawingId, selectedDrawingPane]);

  // Keyboard shortcut to delete selected drawing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedDrawingId && (e.key === "Delete" || e.key === "Backspace")) {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
          return;
        }
        deleteSelectedDrawing();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDrawingId, deleteSelectedDrawing]);

  // ── Canvas Drawing Overlay ──────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas1 = canvasRef.current;
    if (canvas1) {
      const ctx1 = canvas1.getContext("2d");
      ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
      drawings.forEach(d => renderDrawing(ctx1, d, canvas1, d.id === selectedDrawingId && selectedDrawingPane === 1));
      if (drawing && drawing.paneId === 1) renderDrawing(ctx1, drawing, canvas1, true);
    }
    
    const canvas2 = canvasRef2.current;
    if (canvas2 && layout === "split") {
      const ctx2 = canvas2.getContext("2d");
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
      drawings2.forEach(d => renderDrawing(ctx2, d, canvas2, d.id === selectedDrawingId && selectedDrawingPane === 2));
      if (drawing && drawing.paneId === 2) renderDrawing(ctx2, drawing, canvas2, true);
    }
  }, [drawings, drawings2, drawing, selectedDrawingId, selectedDrawingPane, layout]);

  function renderDrawing(ctx, d, canvas, isActive = false) {
    ctx.strokeStyle = isActive ? "#22d3ee" : "#6366f1";
    ctx.fillStyle = isActive ? "#22d3ee44" : "#6366f122";
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.setLineDash(isActive ? [4, 2] : []);
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#a5b4fc";

    // Draw grab handles
    if (isActive) {
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath(); ctx.arc(d.x1, d.y1, 4, 0, Math.PI * 2); ctx.fill();
      if (d.x2 != null) {
        ctx.beginPath(); ctx.arc(d.x2, d.y2, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (d.type === "trendline" && d.x2 != null) {
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
    } else if (d.type === "hline") {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = isActive ? "#22d3ee" : "#f59e0b";
      ctx.beginPath(); ctx.moveTo(0, d.y1); ctx.lineTo(canvas.width, d.y1); ctx.stroke();
      ctx.fillStyle = isActive ? "#22d3ee" : "#f59e0b";
      ctx.fillText(fmt(d.price, 4), 10, d.y1 - 4);
    } else if (d.type === "vline") {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = isActive ? "#22d3ee" : "#22d3ee";
      ctx.beginPath(); ctx.moveTo(d.x1, 0); ctx.lineTo(d.x1, canvas.height); ctx.stroke();
    } else if (d.type === "rect" && d.x2 != null) {
      ctx.setLineDash([]);
      ctx.strokeStyle = isActive ? "#22d3ee" : "#a78bfa";
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
    const canvas1 = canvasRef.current;
    const parent1 = chartAreaRef.current;
    if (canvas1 && parent1) {
      canvas1.width  = parent1.offsetWidth;
      canvas1.height = parent1.offsetHeight;
    }
    const canvas2 = canvasRef2.current;
    const parent2 = chartAreaRef2.current;
    if (canvas2 && parent2 && layout === "split") {
      canvas2.width  = parent2.offsetWidth;
      canvas2.height = parent2.offsetHeight;
    }
    redrawCanvas();
  }, [redrawCanvas, layout]);

  useEffect(() => {
    handleCanvasResize();
    window.addEventListener("resize", handleCanvasResize);
    return () => window.removeEventListener("resize", handleCanvasResize);
  }, [handleCanvasResize, layout]);

  // Click & Touch Coordinate conversions
  const getCanvasPos = (e, canvas) => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchPos = (e, canvas) => {
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  // Mouse & Touch events
  const handleCanvasMouseDown = (e, chartNum) => {
    const isChart1 = chartNum === 1;
    const canvas = isChart1 ? canvasRef.current : canvasRef2.current;
    const drawingsList = isChart1 ? drawings : drawings2;
    const setDrawingsList = isChart1 ? setDrawings : setDrawings2;
    const activeSymbol = isChart1 ? symbol : symbol2;
    const activeTimeframe = isChart1 ? timeframe : timeframe2;

    const pos = getCanvasPos(e, canvas);

    // 1. Detect click on existing drawing to select it
    let clickedDrawingId = null;
    for (let i = drawingsList.length - 1; i >= 0; i--) {
      const d = drawingsList[i];
      let hit = false;
      if (d.type === "hline") {
        hit = Math.abs(pos.y - d.y1) < 10;
      } else if (d.type === "vline") {
        hit = Math.abs(pos.x - d.x1) < 10;
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
        hit = dist < 10;
      } else if (d.type === "rect" && d.x2 != null) {
        const minX = Math.min(d.x1, d.x2);
        const maxX = Math.max(d.x1, d.x2);
        const minY = Math.min(d.y1, d.y2);
        const maxY = Math.max(d.y1, d.y2);
        const nearLeft = Math.abs(pos.x - minX) < 10 && pos.y >= minY && pos.y <= maxY;
        const nearRight = Math.abs(pos.x - maxX) < 10 && pos.y >= minY && pos.y <= maxY;
        const nearTop = Math.abs(pos.y - minY) < 10 && pos.x >= minX && pos.x <= maxX;
        const nearBottom = Math.abs(pos.y - maxY) < 10 && pos.x >= minX && pos.x <= maxX;
        hit = nearLeft || nearRight || nearTop || nearBottom;
      } else if (d.type === "fib" && d.x2 != null) {
        const minX = Math.min(d.x1, d.x2);
        const maxX = Math.max(d.x1, d.x2);
        if (pos.x >= minX - 10 && pos.x <= maxX + 10) {
          const totalY = d.y2 - d.y1;
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          hit = levels.some(lvl => Math.abs(pos.y - (d.y1 + totalY * lvl)) < 10);
        }
      } else if (d.type === "text") {
        hit = Math.sqrt((pos.x - d.x1) ** 2 + (pos.y - d.y1) ** 2) < 20;
      }
      if (hit) {
        clickedDrawingId = d.id;
        break;
      }
    }

    if (clickedDrawingId) {
      setSelectedDrawingId(clickedDrawingId);
      setSelectedDrawingPane(chartNum);
      return;
    }

    if (drawTool === "cursor") {
      setSelectedDrawingId(null);
      setSelectedDrawingPane(null);
      return;
    }

    // 2. Start Drawing new line
    const activeData = generateOHLCV(activeSymbol, activeTimeframe);
    const lastBar = activeData[activeData.length - 1];
    if (drawTool === "hline") {
      setDrawingsList(prev => [...prev, { id: Date.now(), type: "hline", y1: pos.y, price: lastBar?.close || 0 }]);
      setDrawTool("cursor");
    } else if (drawTool === "vline") {
      setDrawingsList(prev => [...prev, { id: Date.now(), type: "vline", x1: pos.x }]);
      setDrawTool("cursor");
    } else if (drawTool === "text") {
      setTextInput({ visible: true, x: pos.x, y: pos.y, paneId: chartNum });
    } else {
      setDrawing({ id: Date.now(), type: drawTool, x1: pos.x, y1: pos.y, paneId: chartNum });
    }
  };

  const handleCanvasMouseMove = (e, chartNum) => {
    const isChart1 = chartNum === 1;
    const canvas = isChart1 ? canvasRef.current : canvasRef2.current;
    if (!canvas) return;
    const pos = getCanvasPos(e, canvas);

    if (drawing && drawing.paneId === chartNum) {
      setDrawing(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null);
      return;
    }

    // Hover check
    const drawingsList = isChart1 ? drawings : drawings2;
    let hover = false;
    for (let d of drawingsList) {
      if (d.type === "hline") {
        hover = Math.abs(pos.y - d.y1) < 10;
      } else if (d.type === "vline") {
        hover = Math.abs(pos.x - d.x1) < 10;
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
        hover = dist < 10;
      } else if (d.type === "rect" && d.x2 != null) {
        const minX = Math.min(d.x1, d.x2);
        const maxX = Math.max(d.x1, d.x2);
        const minY = Math.min(d.y1, d.y2);
        const maxY = Math.max(d.y1, d.y2);
        const nearLeft = Math.abs(pos.x - minX) < 10 && pos.y >= minY && pos.y <= maxY;
        const nearRight = Math.abs(pos.x - maxX) < 10 && pos.y >= minY && pos.y <= maxY;
        const nearTop = Math.abs(pos.y - minY) < 10 && pos.x >= minX && pos.x <= maxX;
        const nearBottom = Math.abs(pos.y - maxY) < 10 && pos.x >= minX && pos.x <= maxX;
        hover = nearLeft || nearRight || nearTop || nearBottom;
      } else if (d.type === "fib" && d.x2 != null) {
        const minX = Math.min(d.x1, d.x2);
        const maxX = Math.max(d.x1, d.x2);
        if (pos.x >= minX - 10 && pos.x <= maxX + 10) {
          const totalY = d.y2 - d.y1;
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          hover = levels.some(lvl => Math.abs(pos.y - (d.y1 + totalY * lvl)) < 10);
        }
      } else if (d.type === "text") {
        hover = Math.sqrt((pos.x - d.x1) ** 2 + (pos.y - d.y1) ** 2) < 20;
      }
      if (hover) break;
    }
    canvas.style.cursor = hover ? "pointer" : (drawTool === "cursor" ? "default" : "crosshair");
  };

  const handleCanvasMouseUp = () => {
    if (drawing) {
      if (drawing.paneId === 1) {
        setDrawings(prev => [...prev, drawing]);
      } else {
        setDrawings2(prev => [...prev, drawing]);
      }
      setDrawing(null);
      setDrawTool("cursor");
    }
  };

  const handleCanvasTouchStart = (e, chartNum) => {
    if (drawTool !== "cursor") e.preventDefault();
    if (e.touches[0]) {
      handleCanvasMouseDown({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      }, chartNum);
    }
  };

  const handleCanvasTouchMove = (e, chartNum) => {
    if (drawTool !== "cursor") e.preventDefault();
    if (!drawing || drawing.paneId !== chartNum) return;
    const canvas = chartNum === 1 ? canvasRef.current : canvasRef2.current;
    if (!canvas) return;
    const pos = getTouchPos(e, canvas);
    setDrawing(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null);
  };

  const handleCanvasTouchEnd = (e, chartNum) => {
    if (drawing && drawing.paneId === chartNum) {
      if (chartNum === 1) {
        setDrawings(prev => [...prev, drawing]);
      } else {
        setDrawings2(prev => [...prev, drawing]);
      }
      setDrawing(null);
      setDrawTool("cursor");
    }
  };

  const clearAllDrawings = () => {
    setDrawings([]);
    setDrawings2([]);
    setSelectedDrawingId(null);
    setSelectedDrawingPane(null);
  };

  // ─── Render Sub-pane ────────────────────────────────────────────────────────
  const renderChartPane = (paneId) => {
    const isChart1 = paneId === 1;
    const currentSymbol = isChart1 ? symbol : symbol2;
    const setCurrentSymbol = isChart1 ? setSymbol : setSymbol2;
    const currentTimeframe = isChart1 ? timeframe : timeframe2;
    const setCurrentTimeframe = isChart1 ? setTimeframe : setTimeframe2;
    const currentChartType = isChart1 ? chartType : chartType2;
    const setCurrentChartType = isChart1 ? setChartType : setChartType2;
    const activeDrawings = isChart1 ? drawings : drawings2;
    const activeCanvasRef = isChart1 ? canvasRef : canvasRef2;
    const activeChartAreaRef = isChart1 ? chartAreaRef : chartAreaRef2;
    const activeSearchRef = isChart1 ? searchRef : searchRef2;
    const activeSearch = isChart1 ? search : search2;
    const setActiveSearch = isChart1 ? setSearch : setSearch2;
    const activeSearchOpen = isChart1 ? searchOpen : searchOpen2;
    const setActiveSearchOpen = isChart1 ? setSearchOpen : setSearchOpen2;

    const compareSymbol = isChart1 ? compareSymbol1 : compareSymbol2;
    const setCompareSymbol = isChart1 ? setCompareSymbol1 : setCompareSymbol2;
    const compareSearchOpen = isChart1 ? compareSearchOpen1 : compareSearchOpen2;
    const setCompareSearchOpen = isChart1 ? setCompareSearchOpen1 : setCompareSearchOpen2;
    const compareSearch = isChart1 ? compareSearch1 : compareSearch2;
    const setCompareSearch = isChart1 ? setCompareSearch1 : setCompareSearch2;

    const activeAsset = ASSET_CATALOG.find(a => a.symbol === currentSymbol) || ASSET_CATALOG[0];
    const activeRawData = generateOHLCV(currentSymbol, currentTimeframe);

    // Indicator calculations
    const sma20Data  = calcSMA(activeRawData, indicatorSettings.sma20.period);
    const sma50Data  = calcSMA(activeRawData, indicatorSettings.sma50.period);
    const sma200Data = calcSMA(activeRawData, indicatorSettings.sma200.period);
    const ema12Data  = calcEMA(activeRawData, indicatorSettings.ema12.period);
    const ema26Data  = calcEMA(activeRawData, indicatorSettings.ema26.period);
    const bbData     = calcBollingerBands(activeRawData, indicatorSettings.bb.period, indicatorSettings.bb.stdDev);
    const rsiData    = calcRSI(activeRawData, indicatorSettings.rsi.period);
    const macdResult = calcMACD(activeRawData, indicatorSettings.macd.fast, indicatorSettings.macd.slow, indicatorSettings.macd.signal);
    const vwapData   = calcVWAP(activeRawData);

    const byTime = {};
    activeRawData.forEach(b => { byTime[b.time] = { ...b }; });
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

    // Generate comparison data if active
    const compareRawData = compareSymbol ? generateOHLCV(compareSymbol, currentTimeframe) : [];
    const compareMap = {};
    compareRawData.forEach(b => {
      compareMap[b.time] = b.close;
    });

    const mergedChartData = Object.values(byTime).map(bar => {
      const newBar = { ...bar };
      if (compareSymbol) {
        newBar.compareClose = compareMap[bar.time] || null;
      }
      return newBar;
    });

    const byTimeRsi = {};
    activeRawData.forEach(b => { byTimeRsi[b.time] = { time: b.time }; });
    rsiData.forEach(p => { if (byTimeRsi[p.time]) byTimeRsi[p.time].rsi = p.value; });
    const mergedRsiChartData = Object.values(byTimeRsi);

    const byTimeMacd = {};
    activeRawData.forEach(b => { byTimeMacd[b.time] = { time: b.time }; });
    macdResult.macdLine.forEach(p  => { if (byTimeMacd[p.time]) byTimeMacd[p.time].macd = p.value; });
    macdResult.signalLine.forEach(p => { if (byTimeMacd[p.time]) byTimeMacd[p.time].signal = p.value; });
    macdResult.histogram.forEach(p  => { if (byTimeMacd[p.time]) byTimeMacd[p.time].hist = p.value; });
    const mergedMacdChartData = Object.values(byTimeMacd);

    const last = activeRawData[activeRawData.length - 1];
    const first = activeRawData[0];
    const change = last && first ? last.close - first.close : 0;
    const changePct = first ? pct(last?.close, first.close) : "0.00";
    const isUp = change >= 0;

    const prices = mergedChartData.flatMap(b => [b.high, b.low].filter(Boolean));
    const pMin = Math.min(...prices) * 0.998;
    const pMax = Math.max(...prices) * 1.002;

    const selectedDrawing = activeDrawings.find(d => d.id === selectedDrawingId);

    // Height calculations
    const subPanels = [
      isEnabled("volume") ? "volume" : null,
      isEnabled("rsi")    ? "rsi"    : null,
      isEnabled("macd")   ? "macd"   : null,
    ].filter(Boolean);
    const mainHeightPct = subPanels.length === 0 ? 100
      : subPanels.length === 1 ? 68
      : subPanels.length === 2 ? 54 : 44;

    // Upgraded Search tab and group filtering
    const activeSearchTab = isChart1 ? searchTab : searchTab2;
    const setActiveSearchTab = isChart1 ? setSearchTab : setSearchTab2;

    const filteredAssets = ASSET_CATALOG.filter(a => {
      // Tab filter
      if (activeSearchTab === "India" && a.type !== "Indian Stock") return false;
      if (activeSearchTab === "USA" && a.type !== "Stock") return false;
      if (activeSearchTab === "Crypto" && a.type !== "Crypto") return false;
      if (activeSearchTab === "Indices" && a.type !== "Index") return false;
      if (activeSearchTab === "Commodities" && a.type !== "Commodity") return false;
      if (activeSearchTab === "Forex" && a.type !== "Forex") return false;

      // Search text filter
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      }
      return true;
    });

    // Group assets for rendering
    const searchGroups = {};
    filteredAssets.forEach(a => {
      let gName = "";
      if (a.type === "Indian Stock") {
        gName = `🇮🇳 Indian - ${a.sector}`;
      } else if (a.type === "Stock") {
        gName = "🇺🇸 US Stocks";
      } else if (a.type === "Crypto") {
        gName = "🪙 Cryptocurrencies";
      } else if (a.type === "Index") {
        if (["NIFTY", "SENSEX", "BANKNIFTY", "CNXIT"].includes(a.symbol)) {
          gName = "🇮🇳 Indian Indices";
        } else {
          gName = "📈 Global Indices";
        }
      } else if (a.type === "Forex") {
        gName = "💱 Forex Pairs";
      } else if (a.type === "Commodity") {
        gName = "🌻 Commodities";
      } else {
        gName = "Other";
      }

      if (!searchGroups[gName]) {
        searchGroups[gName] = [];
      }
      searchGroups[gName].push(a);
    });

    const typeColor = {
      Stock: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
      "Indian Stock": "text-teal-400 bg-teal-500/10 border-teal-500/30",
      Crypto: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      Index: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      Forex: "text-violet-400 bg-violet-500/10 border-violet-500/30",
      Commodity: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    }[activeAsset.type] || "text-slate-400";

    return (
      <div className="flex-1 flex flex-col min-w-0 min-h-[300px] overflow-hidden relative" ref={activeChartAreaRef}>
        {/* Pane Sub-header */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e293b] bg-[#06091a] flex-shrink-0 flex-wrap z-20">
          
          {/* Asset Search Button */}
          <div className="relative" ref={activeSearchRef}>
            <button
              onClick={() => { setActiveSearchOpen(true); }}
              className="flex items-center gap-2 bg-[#0c1220] border border-[#1e293b] hover:border-indigo-500/50 rounded px-2.5 py-1.5 cursor-pointer transition-all min-w-[160px] md:min-w-[190px]"
            >
              <Search size={14} className="text-slate-400 shrink-0" />
              <span className="text-[12px] font-bold text-white">{activeAsset.symbol}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[90px] hidden sm:inline">{activeAsset.name}</span>
              <span className={`ml-auto text-[8px] px-1 py-0.2 rounded border font-bold uppercase tracking-wider hidden sm:inline ${typeColor}`}>{activeAsset.type}</span>
              <ChevronDown size={13} className="text-slate-500 ml-0.5 shrink-0" />
            </button>

            {activeSearchOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setActiveSearchOpen(false); setActiveSearch(""); } }}>
                <div className="bg-[#080f1e] border border-slate-800 rounded-2xl w-full max-w-3xl h-[600px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a1020]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🌐</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Asset</span>
                    </div>
                    <button 
                      onClick={() => { setActiveSearchOpen(false); setActiveSearch(""); }}
                      className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Search Input Bar */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#0a1020] border-b border-white/5">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                      autoFocus
                      value={activeSearch}
                      onChange={e => setActiveSearch(e.target.value)}
                      placeholder="Search asset symbol, name, or sector (e.g. Reliance, HDFC, IT, Banking)..."
                      className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none"
                    />
                    {activeSearch && (
                      <button onClick={() => setActiveSearch("")} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Modal Body */}
                  <div className="flex flex-col md:flex-row flex-1 min-h-0">
                    {/* Left Sidebar Navigation (only shown when not searching) */}
                    {!activeSearch && (
                      <div className="w-full md:w-48 bg-[#050a14] border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col p-1.5 gap-1 shrink-0 overflow-x-auto md:overflow-y-auto scrollbar-none">
                        {[
                          { id: "All",         label: "All Markets",     icon: "🌐" },
                          { id: "India",       label: "Indian Equities", icon: "🇮🇳" },
                          { id: "USA",         label: "US Equities",     icon: "🇺🇸" },
                          { id: "Crypto",      label: "Crypto Assets",   icon: "🪙" },
                          { id: "Indices",     label: "Stock Indices",   icon: "📈" },
                          { id: "Commodities", label: "Commodities",     icon: "🌻" },
                          { id: "Forex",       label: "Forex Pairs",     icon: "💱" },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveSearchTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10.5px] font-bold text-left cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                              activeSearchTab === tab.id
                                ? "bg-indigo-500 text-white shadow-lg"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            }`}
                          >
                            <span className="text-sm shrink-0">{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Right Scrolling Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#080f1e]">
                      {Object.keys(searchGroups).length === 0 ? (
                        <div className="text-[11px] text-slate-500 text-center py-10 select-none">No matching assets found</div>
                      ) : (
                        Object.entries(searchGroups).map(([groupName, assets]) => (
                          <div key={groupName} className="mb-5">
                            <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest px-1 py-1 mb-2 border-b border-white/5 select-none">
                              {groupName}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {assets.map(a => {
                                const isIndian = a.type === "Indian Stock" || ["NIFTY", "SENSEX", "BANKNIFTY", "CNXIT"].includes(a.symbol);
                                const currency = isIndian ? "₹" : "$";
                                return (
                                  <button
                                    key={a.symbol}
                                    onClick={() => { setCurrentSymbol(a.symbol); setActiveSearchOpen(false); setActiveSearch(""); }}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left bg-[#0c1220]/40 border-white/5 hover:border-indigo-500/50 hover:bg-[#0c1220]/80 group ${
                                      a.symbol === currentSymbol ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400" : "text-slate-300"
                                    }`}
                                  >
                                    <div className="flex flex-col min-w-0 pr-2">
                                      <span className="text-[12px] font-mono font-bold text-white group-hover:text-indigo-400 transition-colors">{a.symbol}</span>
                                      <span className="text-[10px] text-slate-500 truncate max-w-[170px]">{a.name}</span>
                                    </div>
                                    <span className="text-[11px] font-mono font-bold text-indigo-300 text-right shrink-0">
                                      {currency}{fmt(a.basePrice, a.basePrice < 10 ? 4 : 2)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Comparison Presets */}
          <div className="hidden sm:flex items-center gap-1 ml-1 select-none">
            {["NIFTY", "SENSEX", "SPX", "BTC"].map(sym => {
              if (sym === currentSymbol) return null;
              const isComparing = compareSymbol === sym;
              return (
                <button
                  key={sym}
                  onClick={() => {
                    if (isComparing) setCompareSymbol(null);
                    else setCompareSymbol(sym);
                  }}
                  className={`px-1.5 py-0.8 rounded text-[9px] font-bold font-mono transition-all border cursor-pointer ${
                    isComparing
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                      : "border-white/5 bg-[#0c1220] text-slate-500 hover:text-white hover:border-[#1e293b]"
                  }`}
                  title={`Toggle overlay comparison with ${sym}`}
                >
                  {isComparing ? `✓ ${sym}` : `+ ${sym}`}
                </button>
              );
            })}
          </div>

          {/* Comparison Search Selector */}
          <div className="relative">
            {compareSymbol ? (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1 text-[10px] font-mono text-amber-400">
                <span className="font-bold">vs {compareSymbol}</span>
                <button onClick={() => setCompareSymbol(null)} className="hover:text-rose-400 cursor-pointer ml-1">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCompareSearchOpen(true)}
                className="flex items-center gap-1 bg-[#0c1220] border border-[#1e293b] hover:border-indigo-500/50 rounded px-2 py-1 cursor-pointer transition-all text-[11px] font-bold text-slate-400 hover:text-white"
              >
                <span>+ Compare</span>
              </button>
            )}

            {compareSearchOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setCompareSearchOpen(false); setCompareSearch(""); } }}>
                <div className="bg-[#080f1e] border border-slate-800 rounded-2xl w-full max-w-3xl h-[600px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a1020]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">⚖️</span>
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Compare Benchmark Overlay</span>
                    </div>
                    <button 
                      onClick={() => { setCompareSearchOpen(false); setCompareSearch(""); }}
                      className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Search Input Bar */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#0a1020] border-b border-white/5">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                      autoFocus
                      value={compareSearch}
                      onChange={e => setCompareSearch(e.target.value)}
                      placeholder="Type symbol or name to overlay..."
                      className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none"
                    />
                    {compareSearch && (
                      <button onClick={() => setCompareSearch("")} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-4 bg-[#080f1e]">
                    {(() => {
                      const compareFiltered = ASSET_CATALOG.filter(a => a.symbol !== currentSymbol)
                        .filter(a => !compareSearch || a.symbol.toLowerCase().includes(compareSearch.toLowerCase()) || a.name.toLowerCase().includes(compareSearch.toLowerCase()));

                      const compareGroups = {};
                      compareFiltered.forEach(a => {
                        let gName = "";
                        if (a.type === "Indian Stock") {
                          gName = `🇮🇳 Indian - ${a.sector}`;
                        } else if (a.type === "Stock") {
                          gName = "🇺🇸 US Stocks";
                        } else if (a.type === "Crypto") {
                          gName = "🪙 Cryptocurrencies";
                        } else if (a.type === "Index") {
                          if (["NIFTY", "SENSEX", "BANKNIFTY", "CNXIT"].includes(a.symbol)) {
                            gName = "🇮🇳 Indian Indices";
                          } else {
                            gName = "📈 Global Indices";
                          }
                        } else if (a.type === "Forex") {
                          gName = "💱 Forex Pairs";
                        } else if (a.type === "Commodity") {
                          gName = "🌻 Commodities";
                        } else {
                          gName = "Other";
                        }

                        if (!compareGroups[gName]) {
                          compareGroups[gName] = [];
                        }
                        compareGroups[gName].push(a);
                      });

                      if (Object.keys(compareGroups).length === 0) {
                        return <div className="text-[11px] text-slate-500 text-center py-10 select-none">No matching assets found</div>;
                      }

                      return Object.entries(compareGroups).map(([groupName, assets]) => (
                        <div key={groupName} className="mb-5">
                          <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest px-1 py-1 mb-2 border-b border-white/5 select-none">
                            {groupName}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {assets.map(a => {
                              const isIndian = a.type === "Indian Stock" || ["NIFTY", "SENSEX", "BANKNIFTY", "CNXIT"].includes(a.symbol);
                              const currency = isIndian ? "₹" : "$";
                              return (
                                <button
                                  key={a.symbol}
                                  onClick={() => { setCompareSymbol(a.symbol); setCompareSearchOpen(false); setCompareSearch(""); }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left bg-[#0c1220]/40 border-white/5 hover:border-amber-500/50 hover:bg-[#0c1220]/80 group ${
                                    a.symbol === compareSymbol ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "text-slate-300"
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-[12px] font-mono font-bold text-white group-hover:text-amber-400 transition-colors">{a.symbol}</span>
                                    <span className="text-[10px] text-slate-500 truncate max-w-[170px]">{a.name}</span>
                                  </div>
                                  <span className="text-[11px] font-mono font-bold text-amber-300 text-right shrink-0">
                                    {currency}{fmt(a.basePrice, a.basePrice < 10 ? 4 : 2)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price details */}
          <div className="flex items-baseline gap-1.5">
            {(() => {
              const isIndian = activeAsset.type === "Indian Stock" || ["NIFTY", "SENSEX", "BANKNIFTY", "CNXIT"].includes(activeAsset.symbol);
              const currency = isIndian ? "₹" : "$";
              return (
                <>
                  <span className="text-[15px] font-bold font-mono text-white">
                    {currency}{fmt(last?.close, activeAsset.basePrice < 10 ? 4 : 2)}
                  </span>
                  <span className={`text-[10.5px] font-bold font-mono ${isUp ? "text-emerald-400":"text-rose-400"}`}>
                    {isUp ? "+" : "-"}{currency}{fmt(Math.abs(change), activeAsset.basePrice < 10 ? 4 : 2)} ({isUp ? "+" : ""}{changePct}%)
                  </span>
                </>
              );
            })()}
          </div>

          {/* Simple Indicators Checklist (Only in Simple Mode) */}
          {simpleMode && (
            <div className="flex items-center gap-3.5 ml-4 border-l border-white/10 pl-4 select-none">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={!!indicators.find(i => i.id === "volume")?.enabled}
                  onChange={() => toggleIndicator("volume")}
                  className="w-3 h-3 rounded border border-slate-700 bg-[#0c1220] text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>📊 Volume Bar</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={!!indicators.find(i => i.id === "sma20")?.enabled}
                  onChange={() => toggleIndicator("sma20")}
                  className="w-3 h-3 rounded border border-slate-700 bg-[#0c1220] text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>📈 MA Trend Line</span>
              </label>
            </div>
          )}

          {/* Timeframe selector */}
          <div className="flex items-center bg-[#0c1220] border border-[#1e293b] rounded overflow-hidden ml-auto">
            {TIMEFRAMES.map(tfObj => (
              <button key={tfObj.label} onClick={() => setCurrentTimeframe(tfObj.label)}
                className={`px-1.5 py-0.8 text-[8.5px] font-bold font-mono transition-all cursor-pointer ${currentTimeframe===tfObj.label ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-white"}`}>
                {tfObj.label}
              </button>
            ))}
          </div>

          {/* Chart Type selector */}
          <div className="flex items-center bg-[#0c1220] border border-[#1e293b] rounded overflow-hidden">
            {(simpleMode ? ["area", "line"] : ["candle", "line", "area"]).map(type => (
              <button key={type} onClick={() => setCurrentChartType(type)}
                className={`px-1.5 py-0.8 text-[8.5px] font-bold uppercase transition-all cursor-pointer ${currentChartType===type ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-white"}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Text input for labels */}
        {textInput.visible && textInput.paneId === paneId && (
          <input
            autoFocus
            className="absolute z-50 bg-[#0c1220] border border-indigo-500 rounded px-2 py-1 text-[11px] text-white outline-none"
            style={{ left: textInput.x, top: textInput.y - 20 }}
            placeholder="Label..."
            onKeyDown={e => {
              if (e.key === "Enter") {
                setDrawingsList(prev => [...prev, { id: Date.now(), type: "text", x1: textInput.x, y1: textInput.y, label: e.target.value }]);
                setTextInput({ visible: false, x: 0, y: 0, paneId: null });
                setDrawTool("cursor");
              } else if (e.key === "Escape") {
                setTextInput({ visible: false, x: 0, y: 0, paneId: null });
                setDrawTool("cursor");
              }
            }}
          />
        )}

        {/* Floating selected drawing delete button */}
        {!simpleMode && selectedDrawing && selectedDrawingPane === paneId && (() => {
          const activeCanvas = activeCanvasRef.current;
          const canvasWidth = activeCanvas ? activeCanvas.width : 500;
          const canvasHeight = activeCanvas ? activeCanvas.height : 300;
          let btnLeft = 10;
          let btnTop = 10;
          
          if (selectedDrawing.type === 'hline') {
            btnLeft = 80;
            btnTop = selectedDrawing.y1 - 25;
          } else if (selectedDrawing.type === 'vline') {
            btnLeft = selectedDrawing.x1 - 40;
            btnTop = 50;
          } else {
            btnLeft = selectedDrawing.x1;
            btnTop = selectedDrawing.y1 - 25;
          }
          
          btnLeft = Math.max(10, Math.min(btnLeft, canvasWidth - 100));
          btnTop = Math.max(10, Math.min(btnTop, canvasHeight - 40));
          
          return (
            <button
              onClick={deleteSelectedDrawing}
              className="absolute z-30 bg-rose-600 hover:bg-rose-500 text-white rounded px-2 py-1 text-[9px] font-bold shadow-lg flex items-center gap-1 cursor-pointer transition-colors"
              style={{
                left: btnLeft,
                top: btnTop,
              }}
            >
              <Trash2 size={9} /> Delete Line
            </button>
          );
        })()}

        {/* Active Indicators Overlay List (TradingView style) */}
        {!simpleMode && (
          <div className="absolute top-12 left-3 z-20 flex flex-col gap-1 pointer-events-auto select-none">
            {indicators.filter(ind => ind.enabled).map(ind => {
              const settings = indicatorSettings[ind.id];
              let desc = ind.label;
              if (settings?.period) desc += ` (${settings.period})`;
              else if (settings?.fast) desc += ` (${settings.fast}, ${settings.slow}, ${settings.signal})`;
              
              return (
                <div key={ind.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#080f1e]/85 backdrop-blur-sm border border-[#1e293b]/50 text-[9px] font-mono text-slate-300 shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: settings?.color || '#fff' }} />
                  <span className="font-bold">{desc}</span>
                  <button onClick={() => toggleIndicator(ind.id)} title="Remove" className="hover:text-rose-400 cursor-pointer pl-0.5"><X size={8} /></button>
                  {ind.id !== 'volume' && (
                    <button onClick={() => setEditingIndicator(ind.id)} title="Settings" className="hover:text-indigo-400 cursor-pointer"><Settings size={8} /></button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Overlay Canvas */}
        {!simpleMode && (
          <canvas ref={activeCanvasRef}
            className="absolute inset-0 z-10 pointer-events-auto"
            style={{ cursor: drawTool === "cursor" ? "default" : "crosshair" }}
            onMouseDown={e => handleCanvasMouseDown(e, paneId)}
            onMouseMove={e => handleCanvasMouseMove(e, paneId)}
            onMouseUp={handleCanvasMouseUp}
            onTouchStart={e => handleCanvasTouchStart(e, paneId)}
            onTouchMove={e => handleCanvasTouchMove(e, paneId)}
            onTouchEnd={e => handleCanvasTouchEnd(e, paneId)}
          />
        )}

        {/* Recharts Pane */}
        <div className="flex-1 flex flex-col min-h-0 select-none bg-[#03070e]">
          <div style={{ height: `${mainHeightPct}%`, minHeight: 150 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart syncId="shared-terminal-charts" data={mergedChartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" tickFormatter={t => fmtTime(t, currentTimeframe)}
                  tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false}
                  interval="preserveStartEnd" minTickGap={50} />
                <YAxis domain={[pMin, pMax]} orientation="right" width={40}
                  tickFormatter={v => fmt(v, activeAsset.basePrice < 10 ? 4 : 1)}
                  tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                {compareSymbol && (
                  <YAxis yAxisId="compare" domain={['auto', 'auto']} orientation="left" width={45}
                    tickFormatter={v => fmt(v, ASSET_CATALOG.find(a => a.symbol === compareSymbol)?.basePrice < 10 ? 4 : 1)}
                    tick={{ fill: "#fbbf24", fontSize: 8 }} axisLine={false} tickLine={false} />
                )}
                <Tooltip content={<ChartTooltip timeframe={currentTimeframe} />} />

                {/* Bollinger Bands */}
                {isEnabled("bb") && <>
                  <Area dataKey="bbUpper" fill="transparent" stroke={getColor("bb")} strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                  <Area dataKey="bbLower" fill={getColor("bb")+"0e"} stroke={getColor("bb")} strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                </>}

                {/* Overlays */}
                {isEnabled("sma20")  && <Line type="monotone" dataKey="sma20"   stroke={getColor("sma20")}  strokeWidth={1.2} dot={false} isAnimationActive={false} />}
                {isEnabled("sma50")  && <Line type="monotone" dataKey="sma50"   stroke={getColor("sma50")}  strokeWidth={1.2} dot={false} isAnimationActive={false} />}
                {isEnabled("sma200") && <Line type="monotone" dataKey="sma200"  stroke={getColor("sma200")} strokeWidth={1.2} dot={false} isAnimationActive={false} />}
                {isEnabled("ema12")  && <Line type="monotone" dataKey="ema12"   stroke={getColor("ema12")}  strokeWidth={1.2} dot={false} isAnimationActive={false} />}
                {isEnabled("ema26")  && <Line type="monotone" dataKey="ema26"   stroke={getColor("ema26")}  strokeWidth={1.2} dot={false} isAnimationActive={false} />}
                {isEnabled("vwap")   && <Line type="monotone" dataKey="vwap"    stroke={getColor("vwap")}   strokeWidth={1.2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />}
                {isEnabled("bb")     && <Line type="monotone" dataKey="bbMiddle" stroke={getColor("bb")}    strokeWidth={0.8} dot={false} isAnimationActive={false} />}

                {/* Series */}
                {currentChartType === "line" && (
                  <Line type="monotone" dataKey="close" stroke={activeAsset.color || "#6366f1"}
                    strokeWidth={1.8} dot={false} isAnimationActive={false} />
                )}
                {currentChartType === "area" && (
                  <Area type="monotone" dataKey="close" stroke={activeAsset.color || "#6366f1"}
                    fill={`${activeAsset.color || "#6366f1"}12`} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                )}
                {currentChartType === "candle" && (
                  <Bar dataKey="high" fill="transparent" isAnimationActive={false}
                    shape={<CandlestickBar pMin={pMin} />}
                  />
                )}

                {/* Comparison Asset Overlay */}
                {compareSymbol && (
                  <Line yAxisId="compare" type="monotone" dataKey="compareClose" stroke="#fbbf24"
                    strokeWidth={1.5} dot={false} isAnimationActive={false} name={compareSymbol} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume */}
          {isEnabled("volume") && (
            <div className="border-t border-[#1e293b]" style={{ height: `${subPanels.length === 1 ? 32 : 22}%` }}>
              <div className="h-4 flex items-center px-3 border-b border-white/5 bg-black/10 select-none">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Volume</span>
              </div>
              <ResponsiveContainer width="100%" height="calc(100% - 16px)">
                <ComposedChart data={mergedChartData} margin={{ top: 2, right: 40, left: 0, bottom: 0 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis orientation="right" width={40} tickFormatter={v => (v/1000).toFixed(0)+"K"} tick={{ fill: "#475569", fontSize: 7 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="volume" isAnimationActive={false}
                    shape={(props) => {
                      const { x, y, width, height, index } = props;
                      const bar = mergedChartData[index];
                      if (!bar) return null;
                      const color = bar.close >= bar.open ? "#22c55e33" : "#ef444433";
                      const stroke = bar.close >= bar.open ? "#22c55e" : "#ef4444";
                      return <rect x={x} y={y} width={Math.max(width-1,1)} height={height} fill={color} stroke={stroke} strokeWidth={0.5} />;
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Alignment grids for indicators */}
          {isEnabled("rsi") && (
            <div className="border-t border-[#1e293b]" style={{ height: "22%" }}>
              <div className="h-4 flex items-center px-3 border-b border-white/5 bg-black/10 select-none">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">RSI (14)</span>
              </div>
              <ResponsiveContainer width="100%" height="calc(100% - 16px)">
                <ComposedChart data={mergedRsiChartData} margin={{ top: 2, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} orientation="right" width={40}
                    ticks={[30, 50, 70]} tick={{ fill: "#475569", fontSize: 7 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={0.8} />
                  <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={0.8} />
                  <ReferenceLine y={50} stroke="#475569" strokeDasharray="1 3" strokeWidth={0.8} />
                  <Line type="monotone" dataKey="rsi" stroke={getColor("rsi")} strokeWidth={1.2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* MACD */}
          {isEnabled("macd") && (
            <div className="border-t border-[#1e293b]" style={{ height: "22%" }}>
              <div className="h-4 flex items-center px-3 border-b border-white/5 bg-black/10 select-none">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">MACD</span>
              </div>
              <ResponsiveContainer width="100%" height="calc(100% - 16px)">
                <ComposedChart data={mergedMacdChartData} margin={{ top: 2, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis orientation="right" width={40} tickFormatter={v => v.toFixed(1)} tick={{ fill: "#475569", fontSize: 7 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={0.8} />
                  <Bar dataKey="hist" isAnimationActive={false}
                    shape={(props) => {
                      const { x, y, width, height, index } = props;
                      const bar = mergedMacdChartData[index];
                      if (!bar) return null;
                      const pos = (bar.hist || 0) >= 0;
                      return <rect x={x} y={y} width={Math.max(width-1,1)} height={Math.max(height,1)} fill={pos ? "#22c55e33" : "#ef444433"} stroke={pos ? "#22c55e" : "#ef4444"} strokeWidth={0.5} />;
                    }}
                  />
                  <Line type="monotone" dataKey="macd"   stroke={getColor("macd")} strokeWidth={1.2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="signal" stroke="#f472b6" strokeWidth={0.8} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full md:h-full bg-[#040912] text-white pb-[56px] md:pb-0 overflow-y-auto md:overflow-hidden select-none">

      {/* ── Top Control Bar (Responsive) ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1e293b] bg-[#06091a] flex-shrink-0 flex-wrap">
        
        {/* Title & Help */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[11px] tracking-widest text-[#94a3b8] hidden md:inline uppercase">Chart Terminal</span>
          <button 
            onClick={() => setShowHelp(prev => !prev)}
            className="w-4 h-4 rounded-full border border-slate-700 hover:border-indigo-400 flex items-center justify-center text-[9px] font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Toggle Quick Guide"
          >
            ?
          </button>
          
          {/* Simple Mode / Advanced Pro Toggle */}
          <button
            onClick={() => {
              setSimpleMode(prev => {
                const next = !prev;
                if (next) {
                  // Reset to simple defaults when entering simple mode
                  setLayout("single");
                  setChartType("area");
                  setChartType2("area");
                  setDrawTool("cursor");
                } else {
                  setChartType("candle");
                  setChartType2("candle");
                }
                return next;
              });
            }}
            className={`flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
              simpleMode 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
            }`}
          >
            {simpleMode ? "🔰 Simple Mode" : "⚙️ Pro Terminal"}
          </button>
        </div>

        {/* Watchlist Quick Switch */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full md:max-w-none scrollbar-none shrink-0 py-0.5">
          {watchlist.slice(0, 8).map(sym => {
            const isSelected = symbol === sym || (layout === 'split' && symbol2 === sym);
            return (
              <button
                key={sym}
                onClick={() => {
                  if (layout === 'split') {
                    if (selectedDrawingPane === 2) setSymbol2(sym);
                    else setSymbol(sym);
                  } else {
                    setSymbol(sym);
                  }
                }}
                className={`px-2 py-0.8 rounded text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                  isSelected ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300' : 'border-transparent text-slate-500 hover:text-white hover:border-slate-800'
                }`}
              >
                {sym}
              </button>
            );
          })}
        </div>

        {!simpleMode && (
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Layout switch button */}
            <button onClick={() => {
              setLayout(l => {
                const next = l === 'single' ? 'split' : 'single';
                setSelectedDrawingId(null);
                setSelectedDrawingPane(null);
                return next;
              });
            }}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1220] border border-[#1e293b] hover:border-indigo-500/50 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer`}>
              <LayoutPanelTop size={15} className={layout === 'split' ? "text-indigo-400" : ""} />
              <span>{layout === 'split' ? 'Single View' : 'Split View'}</span>
            </button>

            {/* Indicators dropdown */}
            <div className="relative">
              <button onClick={() => setIndicatorOpen(!indicatorOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1220] border border-[#1e293b] hover:border-indigo-500/50 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer">
                <Activity size={15} />Indicators
                {indicators.filter(i=>i.enabled).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[8px] font-bold">
                    {indicators.filter(i=>i.enabled).length}
                  </span>
                )}
              </button>
              {indicatorOpen && (
                <div className="absolute right-0 top-full mt-1 w-[240px] bg-[#080f1e] border border-[#1e293b] rounded-xl shadow-2xl z-50 p-2">
                  <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1 select-none">Overlay Indicators</div>
                  {indicators.filter(i=>i.group==="overlay").map(ind => (
                    <div key={ind.id} className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                      <button onClick={() => toggleIndicator(ind.id)}
                        className="flex-1 flex items-center gap-2 text-left cursor-pointer">
                        <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors ${ind.enabled ? "border-indigo-500 bg-indigo-500" : "border-slate-600"}`}>
                          {ind.enabled && <span className="text-white text-[8px]">✓</span>}
                        </div>
                        <div className="w-3 h-0.5 rounded" style={{background: getColor(ind.id)}} />
                        <span className="text-[11px] text-slate-300 font-mono">{ind.label}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingIndicator(ind.id); }}
                        className="text-slate-500 hover:text-white p-1 cursor-pointer">
                        <Settings size={11} />
                      </button>
                    </div>
                  ))}
                  <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1 mt-1 border-t border-white/5 select-none">Sub-Panel Indicators</div>
                  {indicators.filter(i=>i.group==="sub").map(ind => (
                    <div key={ind.id} className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                      <button onClick={() => toggleIndicator(ind.id)}
                        className="flex-1 flex items-center gap-2 text-left cursor-pointer">
                        <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors ${ind.enabled ? "border-indigo-500 bg-indigo-500" : "border-slate-600"}`}>
                          {ind.enabled && <span className="text-white text-[8px]">✓</span>}
                        </div>
                        <div className="w-3 h-0.5 rounded" style={{background: getColor(ind.id)}} />
                        <span className="text-[11px] text-slate-300 font-mono">{ind.label}</span>
                      </button>
                      {ind.id !== 'volume' && (
                        <button onClick={(e) => { e.stopPropagation(); setEditingIndicator(ind.id); }}
                          className="text-slate-500 hover:text-white p-1 cursor-pointer">
                          <Settings size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {indicatorOpen && <div className="fixed inset-0 z-40" onClick={() => setIndicatorOpen(false)} />}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Help & Onboarding panel (Collapsible) ─────────────────────────── */}
      {showHelp && (
        <div className="bg-indigo-950/20 border-b border-[#1e293b] px-4 py-2 flex items-center justify-between gap-4 z-20 flex-wrap relative backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">💡</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Quick Guide:</span>
          </div>
          <div className="flex gap-5 text-[10px] text-slate-400 font-medium flex-wrap">
            <span className="flex items-center gap-1">🔍 <strong className="text-white">Change Ticker</strong> via Search dropdown</span>
            <span className="flex items-center gap-1">⚖️ <strong className="text-white">Compare charts</strong> by clicking quick benchmarks (SPX, BTC, etc.) or +Compare</span>
            <span className="flex items-center gap-1">✏️ <strong className="text-white">Draw lines</strong> using left sidebar tools, then click/drag on chart</span>
            <span className="flex items-center gap-1">🗑️ <strong className="text-white">Delete drawings</strong> by clicking any line (cyan selection) and pressing Backspace or clicking Delete</span>
          </div>
          <button 
            onClick={() => setShowHelp(false)} 
            className="text-[9px] font-bold font-mono text-slate-500 hover:text-white px-2 py-0.5 rounded border border-white/5 hover:border-slate-700 cursor-pointer ml-auto transition-colors"
          >
            Hide Guide
          </button>
        </div>
      )}

      {/* ── Body (Sidebar + Chart Panels) ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        
        {/* Drawings Toolbar Sidebar (Expandable on hover) */}
        {!simpleMode && (
          <div 
            onMouseEnter={() => setSidebarHover(true)}
            onMouseLeave={() => setSidebarHover(false)}
            className={`bg-[#06091a] border-r border-[#1e293b] flex flex-col items-center py-3 gap-1.5 flex-shrink-0 z-20 transition-all duration-300 select-none ${
              sidebarHover ? "w-36 px-2 items-stretch" : "w-10 px-0"
            }`}
          >
            {DRAWING_TOOLS.map(tool => (
              <button key={tool.id} onClick={() => setDrawTool(tool.id)}
                title={tool.label}
                className={`h-9 rounded-lg flex items-center transition-all cursor-pointer ${
                  sidebarHover ? "w-full justify-start px-2.5 gap-2.5" : "w-8 justify-center"
                } ${drawTool===tool.id ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "text-slate-600 hover:text-slate-300 hover:bg-white/5"}`}>
                <tool.icon size={17} className="shrink-0" />
                {sidebarHover && <span className="text-[10.5px] font-bold tracking-wide truncate">{tool.label}</span>}
              </button>
            ))}
            <div className="h-px w-6 bg-white/10 my-1 self-center" />
            {selectedDrawingId && (
              <button onClick={deleteSelectedDrawing} title="Delete selected drawing"
                className={`h-9 rounded-lg flex items-center text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer animate-pulse border border-rose-500/20 ${
                  sidebarHover ? "w-full justify-start px-2.5 gap-2.5" : "w-8 justify-center"
                }`}>
                <Trash2 size={17} className="shrink-0" />
                {sidebarHover && <span className="text-[10px] font-bold uppercase tracking-wider">Delete Line</span>}
              </button>
            )}
            {(drawings.length > 0 || drawings2.length > 0) && (
              <button onClick={clearAllDrawings} title="Clear all drawings"
                className={`h-9 rounded-lg flex items-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer ${
                  sidebarHover ? "w-full justify-start px-2.5 gap-2.5" : "w-8 justify-center"
                }`}>
                <Eraser size={17} className="shrink-0" />
                {sidebarHover && <span className="text-[10px] font-bold uppercase tracking-wider">Clear All</span>}
              </button>
            )}
          </div>
        )}

        {/* Chart View Panel columns (Responsive: stacks vertically on mobile, side-by-side on desktop) */}
        <div className={`flex-1 flex min-h-0 min-w-0 ${layout === 'split' ? 'flex-col md:flex-row' : 'flex-col'}`}>
          {renderChartPane(1)}
          {layout === 'split' && renderChartPane(2)}
        </div>
      </div>

      {/* ── Status Bar ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1 border-t border-[#1e293b] bg-[#06091a] text-[9px] text-slate-600 flex-shrink-0 select-none z-20">
        <span>Active Mode: {simpleMode ? 'Simple' : 'Advanced Pro'}</span>
        {!simpleMode && <span>Active Layout: {layout === 'split' ? 'Split comparative' : 'Single'}</span>}
        <span className="ml-auto hidden sm:inline">Simulated data · For demonstration only</span>
        {!simpleMode && (
          <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase ${drawTool !== "cursor" ? "bg-indigo-500/20 text-indigo-400" : ""}`}>
            {drawTool !== "cursor" ? `✏ ${DRAWING_TOOLS.find(t=>t.id===drawTool)?.label}` : ""}
          </span>
        )}
      </div>

      {/* Indicator Settings Modal */}
      {editingIndicator && formState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#080f1e] border border-[#1e293b] rounded-xl p-5 w-80 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">
              Edit Settings: {indicators.find(i => i.id === editingIndicator)?.label}
            </h3>
            
            <div className="space-y-4">
              {formState.period !== undefined && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">Period</label>
                  <input
                    type="number"
                    value={formState.period}
                    onChange={e => {
                      const val = e.target.value === "" ? "" : parseInt(e.target.value);
                      setFormState(prev => ({ ...prev, period: val }));
                    }}
                    className="bg-[#0c1220] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              
              {editingIndicator === 'bb' && formState.stdDev !== undefined && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">StdDev</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.stdDev}
                    onChange={e => {
                      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setFormState(prev => ({ ...prev, stdDev: val }));
                    }}
                    className="bg-[#0c1220] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              
              {editingIndicator === 'macd' && formState.fast !== undefined && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400">Fast</label>
                    <input
                      type="number"
                      value={formState.fast}
                      onChange={e => {
                        const val = e.target.value === "" ? "" : parseInt(e.target.value);
                        setFormState(prev => ({ ...prev, fast: val }));
                      }}
                      className="bg-[#0c1220] border border-[#1e293b] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400">Slow</label>
                    <input
                      type="number"
                      value={formState.slow}
                      onChange={e => {
                        const val = e.target.value === "" ? "" : parseInt(e.target.value);
                        setFormState(prev => ({ ...prev, slow: val }));
                      }}
                      className="bg-[#0c1220] border border-[#1e293b] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400">Signal</label>
                    <input
                      type="number"
                      value={formState.signal}
                      onChange={e => {
                        const val = e.target.value === "" ? "" : parseInt(e.target.value);
                        setFormState(prev => ({ ...prev, signal: val }));
                      }}
                      className="bg-[#0c1220] border border-[#1e293b] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
              
              {formState.color !== undefined && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formState.color}
                      onChange={e => {
                        const val = e.target.value;
                        setFormState(prev => ({ ...prev, color: val }));
                      }}
                      className="w-8 h-8 rounded border border-[#1e293b] bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">{formState.color}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingIndicator(null)}
                className="flex-1 py-2 bg-[#0c1220] hover:bg-[#1e293b] text-slate-400 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors border border-[#1e293b]"
              >
                Cancel
              </button>
              <button
                onClick={saveIndicatorSettings}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChartTerminal;
