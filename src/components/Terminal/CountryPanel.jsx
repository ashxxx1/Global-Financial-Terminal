import { useState, useEffect, useRef } from "react";
import { X, Cpu, ShieldAlert, Building2, Globe, Activity } from "lucide-react";
import { getCountryStats } from "./data";
import MarketTable from "../MarketTable/MarketTable";
import { getLocalNewsOutlets, getLocalHeadlines, generateGeopoliticalSummary } from "../NewsPanel/localNewsData";

function TypewriterSummary({ text, speed = 10 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const [prevText, setPrevText] = useState(text);

  if (text !== prevText) {
    setPrevText(text);
    setDisplayed("");
  }

  useEffect(() => {
    idx.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className="text-[13px] text-indigo-100/90 leading-relaxed font-mono relative z-10 min-h-[60px]">
      {displayed}
      {displayed.length < (text?.length || 0) && <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse ml-0.5">▋</span>}
    </p>
  );
}

export function CountryPanel({ country, onClose, timeframe = "1D" }) {
  if (!country) return null;

  const name = country.properties?.ADMIN || country.name || "Unknown Region";
  const iso = country.properties?.ISO_A2 || country.code || "XX";
  
  const stats = getCountryStats(iso);
  const localOutlets = getLocalNewsOutlets(iso);
  const localHeadlines = getLocalHeadlines(iso);
  const geoSummary = generateGeopoliticalSummary(iso, stats.sentiment || "neutral");

  const riskColor = stats.riskScore > 75 ? 'text-rose-500' : stats.riskScore > 40 ? 'text-amber-500' : 'text-emerald-400';
  const riskBorder = stats.riskScore > 75 ? 'border-rose-500' : stats.riskScore > 40 ? 'border-amber-500' : 'border-emerald-500';

  return (
    <div className="flex flex-col h-full bg-[#020617]/95 border border-[#1e293b] p-6 shadow-2xl relative overflow-y-auto max-h-[85vh] rounded-lg text-slate-200">
      {/* Close Button */}
      <button 
        onClick={onClose} 
        aria-label="Close panel"
        className="absolute top-6 right-6 text-slate-500 hover:text-rose-400 transition-colors bg-[#0c1220] p-1.5 rounded border border-[#1e293b] z-50 cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
         <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded flex items-center justify-center font-mono font-bold text-2xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            {iso}
         </div>
         <div className="pr-10">
            <h2 className="text-2xl font-bold tracking-widest text-slate-100 uppercase">{name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
               <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400">MARKET ONLINE</span>
            </div>
         </div>
      </div>

      {/* Economic Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
         <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">GDP</span>
            <span className="font-mono text-slate-200 text-lg font-bold">${stats.gdp}T</span>
         </div>
         <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">INFLATION</span>
            <span className={`font-mono text-lg font-bold ${parseFloat(stats.inflation) > 4 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.inflation}%</span>
         </div>
         <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">C.B. RATE</span>
            <span className="font-mono text-amber-400 text-lg font-bold">{stats.rate}%</span>
         </div>
         <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">FX IDX / VALUE</span>
            <span className="font-mono text-indigo-400 text-lg font-bold">{stats.currency}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
         {/* Strategic Equities Table (via MarketTable) */}
         <div className="md:col-span-2 bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-[12px] font-bold text-slate-300 tracking-wider uppercase">Strategic Equities</span>
               </div>
               <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-800/50 px-1 rounded">{timeframe}</span>
            </div>
            <MarketTable countryCode={iso} />
         </div>
         
         {/* Political Risk Meter */}
         <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-4 self-start">
               <ShieldAlert className={`w-4 h-4 ${riskColor}`} />
               <span className="text-[12px] font-bold text-slate-300 tracking-wider uppercase">Political Risk</span>
            </div>
            <div className="flex items-center justify-center flex-1 my-2">
               <div className={`relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full border-4 border-slate-800`}>
                  <div className={`absolute inset-0 rounded-full border-4 ${riskBorder} border-t-transparent border-l-transparent rotate-12`} />
                  <span className={`text-3xl font-mono font-bold ${riskColor}`}>{stats.riskScore}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Geopolitical AI Summary */}
      <div className="flex flex-col gap-4 mb-5">
         <div className="bg-[#0c1220]/80 border border-indigo-500/30 p-5 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-3 relative z-10">
               <Cpu className="w-4 h-4 text-indigo-400" />
               <span className="text-[12px] font-bold text-indigo-300 tracking-wider uppercase">AI Synthesis Geopolitical Assessment</span>
            </div>
            <TypewriterSummary text={geoSummary || stats.aiAnalysis} speed={10} />
         </div>
      </div>

      {/* 10 Linked National Channels */}
      <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded mb-5 flex flex-col">
         <div className="text-[12px] font-bold text-slate-300 tracking-wider uppercase mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            📡 Connected National News Outlets
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {localOutlets.map((outlet, i) => (
              <div key={i} className="bg-slate-900/60 border border-white/5 p-2 rounded flex flex-col items-center text-center justify-center min-h-[60px]">
                <span className="text-[11px] font-bold text-indigo-400 truncate w-full">{outlet.name}</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 leading-tight">{outlet.focus}</span>
              </div>
            ))}
         </div>
      </div>

      {/* Local Press Headlines */}
      <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col">
         <div className="text-[12px] font-bold text-slate-300 tracking-wider uppercase mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            📰 Local Press News Feed
         </div>
         <div className="flex flex-col gap-2">
            {localHeadlines.map((headline, i) => (
              <div key={i} className="p-2.5 rounded bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[12px] text-slate-200">{headline.title}</span>
                <span className="text-[9px] font-bold font-mono text-indigo-400 uppercase tracking-widest shrink-0">{headline.source}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
export default CountryPanel;
