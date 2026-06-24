import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown, Minus, X } from "lucide-react";

// Simulated daily brief — clearly labeled AI-generated, not attributed to any publisher
const BRIEF_ITEMS = [
  { region: "N. America", flag: "🇺🇸", move: "+0.9%", direction: "up",
    summary: "S&P 500 extends gains after softer-than-expected jobs data reduces near-term rate hike probability.",
    drivers: ["Jobs miss", "Fed pause"] },
  { region: "Europe", flag: "🇪🇺", move: "-0.3%", direction: "down",
    summary: "European equities retreated after ECB officials signalled rates may remain restrictive through Q1 2025.",
    drivers: ["ECB hawkish", "German PMI"] },
  { region: "Asia Pac", flag: "🌏", move: "+0.5%", direction: "up",
    summary: "Nikkei and KOSPI gained on AI memory chip demand surge and continued yen weakness.",
    drivers: ["AI memory", "JPY weak"] },
  { region: "Oil", flag: "🛢️", move: "+2.1%", direction: "up",
    summary: "Crude rose on supply disruption concerns following Red Sea shipping lane activity.",
    drivers: ["Red Sea", "OPEC+"] },
  { region: "Dollar", flag: "💱", move: "-0.4%", direction: "down",
    summary: "DXY softened as September rate cut probability rose to 68% on labour market data.",
    drivers: ["Cut pricing", "Risk-on"] },
  { region: "Credit", flag: "📊", move: "flat", direction: "neutral",
    summary: "IG spreads unchanged. High yield tightened 8bps on improved risk appetite.",
    drivers: ["HY flows", "Risk on"] },
];

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export function MarketBrief() {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setRefreshKey(k => k + 1); }, 900);
  };

  // Collapsed to just a header badge
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#080f1e]/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:border-indigo-400 transition-all cursor-pointer"
      >
        <Sparkles size={12} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-indigo-300 tracking-widest uppercase">AI Market Brief</span>
        <ChevronDown size={10} className="text-slate-500" />
      </button>
    );
  }

  return (
    <div
      key={refreshKey}
      className="rounded-xl overflow-hidden bg-[#06091a]/95 backdrop-blur-xl border border-indigo-500/25 shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.1)]"
      style={{ animation: "fadeSlideIn 0.3s ease" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-indigo-900/40 via-transparent to-transparent border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/30 border border-indigo-500/50 flex items-center justify-center">
            <Sparkles size={10} className="text-indigo-400" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wider">AI MARKET BRIEF</span>
          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-widest">
            AI
          </span>
          <span className="text-[9px] text-slate-600 ml-0.5">{TODAY}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={refresh} className="p-1 rounded text-slate-600 hover:text-indigo-400 transition-colors cursor-pointer">
            <RefreshCw size={10} className={spinning ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors cursor-pointer">
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors cursor-pointer">
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Headline */}
      <div className="px-3 py-2.5 border-b border-white/5">
        <p className="text-[10px] text-slate-300 leading-relaxed">
          <span className="text-indigo-400 font-bold">60s · </span>
          US up on cooling jobs data. Europe lower after ECB signals. Oil +2% on Red Sea tensions. Dollar softens.
        </p>
      </div>

      {/* Compact ticker row — always visible */}
      <div className="px-3 py-2 flex flex-wrap gap-1.5">
        {BRIEF_ITEMS.map(item => (
          <div key={item.region}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5"
          >
            <span className="text-[9px]">{item.flag}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase">{item.region}</span>
            <span className={`text-[9px] font-bold font-mono ${
              item.direction === "up" ? "text-emerald-400" :
              item.direction === "down" ? "text-rose-400" : "text-slate-400"
            }`}>
              {item.direction === "up" && "▲"}
              {item.direction === "down" && "▼"}
              {item.direction === "neutral" && "–"}
              {" "}{item.move}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded detail cards */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          {BRIEF_ITEMS.map(item => (
            <div key={item.region}
              className="p-2.5 rounded-lg bg-white/3 border border-white/5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">{item.flag}</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{item.region}</span>
                </div>
                <span className={`text-[10px] font-bold font-mono ${
                  item.direction === "up" ? "text-emerald-400" :
                  item.direction === "down" ? "text-rose-400" : "text-slate-400"
                }`}>
                  {item.direction === "up" ? <TrendingUp size={9} className="inline" /> :
                   item.direction === "down" ? <TrendingDown size={9} className="inline" /> :
                   <Minus size={9} className="inline" />} {item.move}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed mb-1.5">{item.summary}</p>
              <div className="flex gap-1">
                {item.drivers.map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-slate-800/60 text-[7px] text-slate-600 font-medium border border-white/5">{d}</span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[8px] text-slate-700 leading-relaxed pt-1 border-t border-white/5">
            ✦ AI-generated simulation. Not sourced from any publisher. Not financial advice.
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
