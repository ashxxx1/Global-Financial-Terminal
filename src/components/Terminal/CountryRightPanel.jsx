import { useState, useEffect, useRef } from "react";
import { Cpu, Globe, Activity } from "lucide-react";
import { getCountryStats } from "./data";
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
    <p className="text-[12px] text-indigo-100/90 leading-relaxed font-mono relative z-10 min-h-[60px]">
      {displayed}
      {displayed.length < (text?.length || 0) && <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse ml-0.5">▋</span>}
    </p>
  );
}

export function CountryRightPanel({ country, timeframe = "1D" }) {
  if (!country) return null;

  const iso = country.properties?.ISO_A2 || country.code || "XX";
  
  const stats = getCountryStats(iso);
  const localOutlets = getLocalNewsOutlets(iso);
  const localHeadlines = getLocalHeadlines(iso);
  const geoSummary = generateGeopoliticalSummary(iso, stats.sentiment || "neutral");

  return (
    <div className="flex flex-col h-full bg-[#020617]/95 border-l border-[#1e293b]/50 text-slate-200">
      
      {/* Top Header Switch */}
      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          <h2 className="text-[13px] font-bold tracking-widest text-[#94a3b8] font-mono">REGIONAL ANALYSIS</h2>
        </div>
        <div className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
          SECURE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* Box 4: Geopolitical AI Summary */}
        <div className="bg-[#0c1220]/80 border border-indigo-500/30 p-4 rounded relative overflow-hidden group shadow-md">
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
             <Cpu className="w-4 h-4 text-indigo-400" />
             <span className="text-[11px] font-bold text-indigo-300 tracking-wider uppercase font-mono">AI Geopolitical Synthesis</span>
          </div>
          <TypewriterSummary text={geoSummary || stats.aiAnalysis} speed={10} />
        </div>

        {/* Box 5: Connected Channels */}
        <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col shadow-md">
           <div className="text-[11px] font-bold text-slate-300 tracking-wider uppercase mb-3 flex items-center gap-2 font-mono">
              <Globe className="w-4 h-4 text-slate-400" />
              📡 Connected Channels
           </div>
           <div className="grid grid-cols-2 gap-2">
              {localOutlets.slice(0, 6).map((outlet, i) => (
                <div key={i} className="bg-slate-900/60 border border-white/5 p-2 rounded flex flex-col items-center text-center justify-center min-h-[50px] transition-colors hover:border-indigo-500/20">
                  <span className="text-[10px] font-bold text-indigo-400 truncate w-full">{outlet.name}</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5 leading-tight">{outlet.focus}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Box 6: Local Press News Feed */}
        <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col shadow-md font-sans">
           <div className="text-[11px] font-bold text-slate-300 tracking-wider uppercase mb-3 flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-slate-400" />
              📰 Local News Feed
           </div>
           <div className="flex flex-col gap-2">
              {localHeadlines.map((headline, i) => (
                <div key={i} className="p-2.5 rounded bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-colors flex flex-col gap-1">
                  <span className="text-[11.5px] text-slate-200 leading-normal">{headline.title}</span>
                  <span className="text-[8px] font-bold font-mono text-indigo-400 uppercase tracking-widest self-end">{headline.source}</span>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}

export default CountryRightPanel;
