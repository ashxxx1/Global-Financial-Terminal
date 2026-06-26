import { X, TrendingUp, TrendingDown, ShieldAlert, Cpu } from "lucide-react";
import { getCountryStats } from "./data";
import useTerminalStore from "../../store/terminalStore";
import { getCountrySignalMetrics } from "../../lib/quantFeed";

export function ComparePanel() {
  const { selectedCountry, compareCountry, closeCompareMode } = useTerminalStore();

  if (!selectedCountry || !compareCountry) return null;

  const name1 = selectedCountry.properties?.ADMIN || selectedCountry.name || "Country A";
  const iso1 = selectedCountry.properties?.ISO_A2 || selectedCountry.code || "XX";
  const stats1 = getCountryStats(iso1);

  const name2 = compareCountry.properties?.ADMIN || compareCountry.name || "Country B";
  const iso2 = compareCountry.properties?.ISO_A2 || compareCountry.code || "YY";
  const stats2 = getCountryStats(iso2);

  // Helper to parse values
  const parseNum = (str) => parseFloat(str?.replace(/[^0-9.-]/g, "")) || 0;

  // Calculators
  const gdp1 = parseNum(stats1.gdp);
  const gdp2 = parseNum(stats2.gdp);
  const gdpDelta = gdp1 - gdp2;

  const inf1 = parseNum(stats1.inflation);
  const inf2 = parseNum(stats2.inflation);
  const infDelta = inf1 - inf2;

  const rate1 = parseNum(stats1.rate);
  const rate2 = parseNum(stats2.rate);
  const rateDelta = rate1 - rate2;

  const risk1 = stats1.riskScore;
  const risk2 = stats2.riskScore;
  const riskDelta = risk1 - risk2;

  // AI Signal buy scores
  const signal1 = getCountrySignalMetrics(iso1).score;
  const signal2 = getCountrySignalMetrics(iso2).score;
  const signalDelta = signal1 - signal2;

  return (
    <div 
      className="absolute inset-0 bg-[#020617]/98 backdrop-blur-md z-45 flex flex-col border border-[#1e293b] rounded-lg p-6 overflow-hidden select-none"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-500/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-500/30" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-500/30" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-500/30" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
            VS
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Compare Mode Split View</span>
            <h2 className="text-[15px] font-bold text-slate-100 uppercase tracking-wider">
              {name1} ({iso1}) vs {name2} ({iso2})
            </h2>
          </div>
        </div>
        <button 
          onClick={closeCompareMode}
          className="px-3 py-1.5 border border-[#1e293b] bg-[#0c1220] hover:bg-rose-500/10 hover:border-rose-500/30 text-[10px] font-bold tracking-widest uppercase rounded cursor-pointer transition-colors text-slate-400 hover:text-rose-400 flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          CLOSE COMPARE
        </button>
      </div>

      {/* Split Body */}
      <div className="flex-1 min-h-0 flex gap-6 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* Country 1 column */}
        <div className="w-5/12 flex flex-col gap-4">
          <div className="p-3 bg-[#0a0f1d] border border-indigo-500/20 rounded-xl relative">
            <span className="absolute top-3 right-3 text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">PRIMARY</span>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">COUNTRY Alpha</span>
            <h3 className="text-[16px] font-bold text-slate-100 mt-0.5">{name1}</h3>
          </div>

          {/* Metrics list */}
          <div className="flex flex-col gap-2.5 bg-[#0a0f1d] border border-white/5 p-4 rounded-xl">
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">GDP Indicator</span>
               <span className="text-sm font-mono font-bold text-slate-200">${stats1.gdp}T</span>
             </div>
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">Inflation Rate</span>
               <span className="text-sm font-mono font-bold text-slate-200">{stats1.inflation}%</span>
             </div>
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">Central Bank Rate</span>
               <span className="text-sm font-mono font-bold text-slate-200">{stats1.rate}%</span>
             </div>
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">Risk Gravity Score</span>
               <span className="text-sm font-mono font-bold text-slate-200">{stats1.riskScore}</span>
             </div>
             <div className="flex justify-between items-center py-1.5">
               <span className="text-[11px] text-slate-400">AI Buy Signal</span>
               <span className="text-sm font-mono font-bold text-indigo-400">{signal1}/100</span>
             </div>
          </div>

          {/* AI synthesis card */}
          <div className="p-4 bg-[#0a0f1d] border border-white/5 rounded-xl flex flex-col gap-2 relative">
            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Alpha Geo-Synthesis
            </span>
            <p className="text-[11.5px] text-slate-300 leading-relaxed font-mono">
              {stats1.aiAnalysis}
            </p>
          </div>
        </div>

        {/* DELTA COLUMN (Center) */}
        <div className="w-2/12 flex flex-col items-center gap-4 border-l border-r border-white/5 px-2">
          <div className="p-3 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">DELTA METRICS</span>
            <span className="text-[11px] font-bold text-indigo-400 font-mono block mt-0.5">VARIANCE</span>
          </div>

          {/* Deltas matching metrics */}
          <div className="flex-1 flex flex-col gap-2.5 w-full justify-start py-4 font-mono font-bold text-[11px] text-center">
             
             {/* GDP Delta */}
             <div className="flex flex-col items-center py-1.5 border-b border-white/5 min-h-[46px] justify-center">
               <span className={gdpDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>
                 {gdpDelta >= 0 ? "+" : ""}{gdpDelta.toFixed(2)}T
               </span>
               <span className="text-[7.5px] text-slate-500 uppercase">GDP DIFF</span>
             </div>

             {/* Inflation Delta */}
             <div className="flex flex-col items-center py-1.5 border-b border-white/5 min-h-[46px] justify-center">
               <span className={infDelta >= 0 ? "text-rose-400" : "text-emerald-400"}>
                 {infDelta >= 0 ? "+" : ""}{infDelta.toFixed(1)}%
               </span>
               <span className="text-[7.5px] text-slate-500 uppercase">INFL DIFF</span>
             </div>

             {/* Rate Delta */}
             <div className="flex flex-col items-center py-1.5 border-b border-white/5 min-h-[46px] justify-center">
               <span className={rateDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>
                 {rateDelta >= 0 ? "+" : ""}{rateDelta.toFixed(2)}%
               </span>
               <span className="text-[7.5px] text-slate-500 uppercase">RATE DIFF</span>
             </div>

             {/* Risk Delta */}
             <div className="flex flex-col items-center py-1.5 border-b border-white/5 min-h-[46px] justify-center">
               <span className={riskDelta <= 0 ? "text-emerald-400" : "text-rose-400"}>
                 {riskDelta >= 0 ? "+" : ""}{riskDelta}
               </span>
               <span className="text-[7.5px] text-slate-500 uppercase">RISK DIFF</span>
             </div>

             {/* Buy Signal Delta */}
             <div className="flex flex-col items-center py-1.5 min-h-[46px] justify-center">
               <span className={signalDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>
                 {signalDelta >= 0 ? "+" : ""}{signalDelta}
               </span>
               <span className="text-[7.5px] text-slate-500 uppercase">SIG DIFF</span>
             </div>
          </div>
          
          <div className="h-28" />
        </div>

        {/* Country 2 column */}
        <div className="w-5/12 flex flex-col gap-4">
          <div className="p-3 bg-[#0a0f1d] border border-indigo-500/20 rounded-xl relative">
            <span className="absolute top-3 right-3 text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">COMPARATIVE</span>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">COUNTRY Beta</span>
            <h3 className="text-[16px] font-bold text-slate-100 mt-0.5">{name2}</h3>
          </div>

          {/* Metrics list */}
          <div className="flex flex-col gap-2.5 bg-[#0a0f1d] border border-white/5 p-4 rounded-xl">
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">GDP Indicator</span>
               <span className="text-sm font-mono font-bold text-slate-200">${stats2.gdp}T</span>
             </div>
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">Inflation Rate</span>
               <span className="text-sm font-mono font-bold text-slate-200">{stats2.inflation}%</span>
             </div>
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">Central Bank Rate</span>
               <span className="text-sm font-mono font-bold text-slate-200">{stats2.rate}%</span>
             </div>
             <div className="flex justify-between items-center py-1.5 border-b border-white/5">
               <span className="text-[11px] text-slate-400">Risk Gravity Score</span>
               <span className="text-sm font-mono font-bold text-slate-200">{stats2.riskScore}</span>
             </div>
             <div className="flex justify-between items-center py-1.5">
               <span className="text-[11px] text-slate-400">AI Buy Signal</span>
               <span className="text-sm font-mono font-bold text-indigo-400">{signal2}/100</span>
             </div>
          </div>

          {/* AI synthesis card */}
          <div className="p-4 bg-[#0a0f1d] border border-white/5 rounded-xl flex flex-col gap-2 relative">
            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Beta Geo-Synthesis
            </span>
            <p className="text-[11.5px] text-slate-300 leading-relaxed font-mono">
              {stats2.aiAnalysis}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ComparePanel;
