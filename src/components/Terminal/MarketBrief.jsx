import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Simulated daily brief items ─────────────────────────────────────────────
// In production these would come from a real data aggregation / LLM summary API.
// Clearly labeled as AI-generated summary, not attributed to any news outlet.
const BRIEF_ITEMS = [
  {
    region: "North America",
    flag: "🇺🇸",
    move: "+0.9%",
    direction: "up",
    summary: "S&P 500 extends gains after softer-than-expected jobs data reduces near-term rate hike probability.",
    drivers: ["Jobs data miss", "Fed pause expectations"],
  },
  {
    region: "Europe",
    flag: "🇪🇺",
    move: "-0.3%",
    direction: "down",
    summary: "European equities retreated after ECB officials signalled rates may remain restrictive through Q1 2025.",
    drivers: ["ECB hawkish tone", "German PMI contraction"],
  },
  {
    region: "Asia Pacific",
    flag: "🌏",
    move: "+0.5%",
    direction: "up",
    summary: "Nikkei and KOSPI gained on AI memory chip demand surge from South Korea and continued yen weakness.",
    drivers: ["AI memory demand", "JPY weakness"],
  },
  {
    region: "Commodities",
    flag: "🛢️",
    move: "+2.1%",
    direction: "up",
    summary: "Crude oil rose on supply disruption concerns following drone activity near key Red Sea shipping lanes.",
    drivers: ["Red Sea disruption", "OPEC+ compliance"],
  },
  {
    region: "Currencies",
    flag: "💱",
    move: "-0.4%",
    direction: "down",
    summary: "DXY softened as US rate cut probability for September rose to 68% following labour market data.",
    drivers: ["Rate cut pricing", "Safe haven flows"],
  },
  {
    region: "Credit Markets",
    flag: "📊",
    move: "flat",
    direction: "neutral",
    summary: "Investment grade spreads unchanged. High yield tightened 8bps on improved risk appetite.",
    drivers: ["Risk appetite", "HY inflows"],
  },
];

const TIMESTAMP = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

export function MarketBrief() {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="border border-[#1e293b] rounded-xl overflow-hidden bg-[#080f1e]/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-gradient-to-r from-indigo-900/30 via-transparent to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles size={13} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-white tracking-wider">AI MARKET BRIEF</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-widest">
                AI GENERATED
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={9} className="text-slate-500" />
              <span className="text-[9px] text-slate-500">{TIMESTAMP} · Simulated summary — not sourced from external publications</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
            title="Regenerate brief"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            {expanded ? "Collapse" : "Full Brief"}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Headline strip — always visible */}
      <div className="px-4 py-3">
        <p className="text-[12px] text-slate-300 leading-relaxed">
          <span className="text-indigo-400 font-bold">60-second summary · </span>
          Global equities mixed — US markets up on cooling labour data, Europe lower after ECB signals. 
          Oil rises 2% on Red Sea tensions. Dollar softens as September rate cut probability climbs.
        </p>
      </div>

      {/* Collapsed: compact ticker row */}
      {!expanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {BRIEF_ITEMS.map((item) => (
            <div
              key={item.region}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5"
            >
              <span className="text-[11px]">{item.flag}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.region}</span>
              <span className={`text-[10px] font-bold font-mono ml-1 ${
                item.direction === "up" ? "text-emerald-400" :
                item.direction === "down" ? "text-rose-400" :
                "text-slate-400"
              }`}>
                {item.direction === "up" && <TrendingUp size={9} className="inline mr-0.5" />}
                {item.direction === "down" && <TrendingDown size={9} className="inline mr-0.5" />}
                {item.direction === "neutral" && <Minus size={9} className="inline mr-0.5" />}
                {item.move}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: full breakdown */}
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {BRIEF_ITEMS.map((item) => (
            <div
              key={item.region}
              className="p-3 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px]">{item.flag}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{item.region}</span>
                </div>
                <span className={`text-[11px] font-bold font-mono flex items-center gap-1 ${
                  item.direction === "up" ? "text-emerald-400" :
                  item.direction === "down" ? "text-rose-400" :
                  "text-slate-400"
                }`}>
                  {item.direction === "up" && <TrendingUp size={10} />}
                  {item.direction === "down" && <TrendingDown size={10} />}
                  {item.direction === "neutral" && <Minus size={10} />}
                  {item.move}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{item.summary}</p>
              <div className="flex flex-wrap gap-1">
                {item.drivers.map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-white/5 text-[8px] text-slate-500 font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {/* Disclaimer */}
          <div className="col-span-full text-[9px] text-slate-600 mt-1 flex items-center gap-1.5 border-t border-white/5 pt-3">
            <Sparkles size={9} className="text-indigo-600" />
            AI-generated summary based on simulated market data. Not sourced from or affiliated with any external news publication. 
            For illustrative purposes only — not financial advice.
          </div>
        </div>
      )}
    </div>
  );
}
