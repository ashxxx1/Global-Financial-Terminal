import { useState, useEffect, useRef } from "react";
import { Cpu, Globe, Activity } from "lucide-react";
import { getCountryStats } from "./data";
import { getLocalNewsOutlets, getLocalHeadlines, generateGeopoliticalSummary } from "../NewsPanel/localNewsData";

import useTerminalStore from "../../store/terminalStore";

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

function getSupplyChainExposure(iso) {
  if (iso === "US") {
    return [
      { name: "Semiconductors", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
      { name: "Neon Supply", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
      { name: "SaaS Compliance", eventId: 4, eventTitle: "AI Regulatory Framework Draft Leaked" },
      { name: "Crude Energy", eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" }
    ];
  }
  if (iso === "CN" || iso === "TW" || iso === "JP" || iso === "KR") {
    return [
      { name: "Wafer Shipping", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
      { name: "Rare Earths", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
      { name: "Lithium Cells", eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" },
      { name: "AI Regulations", eventId: 4, eventTitle: "AI Regulatory Framework Draft Leaked" }
    ];
  }
  if (iso === "DE" || iso === "FR" || iso === "NL" || iso === "GB") {
    return [
      { name: "Liquidity Buffers", eventId: 3, eventTitle: "ECB Emergency Liquidity Injection" },
      { name: "ASML Gas Imports", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
      { name: "AI Copilots", eventId: 4, eventTitle: "AI Regulatory Framework Draft Leaked" },
      { name: "Jet Fuel Spot", eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" }
    ];
  }
  return [
    { name: "Energy Inputs", eventId: 1, eventTitle: "Unscheduled OPEC+ Output Reduction" },
    { name: "Technology Hardware", eventId: 2, eventTitle: "Semiconductor Supply Chain Disruption" },
    { name: "Sovereign Bonds", eventId: 3, eventTitle: "ECB Emergency Liquidity Injection" }
  ];
}

export function CountryRightPanel({ country, timeframe = "1D" }) {
  const setCausalChainEvent = useTerminalStore(state => state.setCausalChainEvent);
  const addAnnotation = useTerminalStore(state => state.addAnnotation);
  const [noteText, setNoteText] = useState("");

  if (!country) return null;

  const iso = country.properties?.ISO_A2 || country.code || "XX";
  
  const stats = getCountryStats(iso);
  const localOutlets = getLocalNewsOutlets(iso);
  const localHeadlines = getLocalHeadlines(iso);
  const geoSummary = generateGeopoliticalSummary(iso, stats.sentiment || "neutral");

  const handlePinNote = () => {
    if (!noteText.trim()) return;
    let lat, lng;
    if (iso === "US") { lat = 40; lng = -97; }
    else if (iso === "CN") { lat = 35; lng = 105; }
    else if (iso === "JP") { lat = 36; lng = 138; }
    else if (iso === "DE") { lat = 51; lng = 9; }
    else {
      lat = (iso.charCodeAt(0) % 60) - 20;
      lng = (iso.charCodeAt(1) % 180) - 90;
    }

    addAnnotation({
      id: "a_" + Date.now(),
      lat,
      lng,
      text: noteText.trim(),
      author: "Trader #1"
    });
    setNoteText("");
  };

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

        {/* Box 4b: Flow Trajectory / Supply Chain Exposure Map */}
        <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col shadow-md">
           <div className="text-[11px] font-bold text-slate-300 tracking-wider uppercase mb-2.5 flex items-center gap-2 font-mono">
              <span className="text-indigo-400">🌊</span>
              Flow Trajectory & Supply Chain
           </div>
           <span className="text-[9px] text-slate-500 font-mono mb-2 block">
             Click any dependency node below to trace its causal propagation chain.
           </span>
           <div className="flex flex-wrap gap-2">
              {getSupplyChainExposure(iso).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCausalChainEvent(item.eventId, item.eventTitle)}
                  className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-all text-[10px] font-mono tracking-wider rounded-lg cursor-pointer uppercase font-bold"
                >
                  {item.name} ↗
                </button>
              ))}
           </div>
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

        {/* Box 7: Collaborative Annotations Pinning */}
        <div className="bg-[#0c1220]/80 border border-white/5 p-4 rounded flex flex-col gap-3 shadow-md">
           <div className="text-[11.5px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2 font-mono">
              <span>📌</span> Pin Geopolitical Note
           </div>
           <div className="flex gap-2">
             <input
               className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded font-sans text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
               placeholder="Add collaborative note..."
               value={noteText}
               onChange={(e) => setNoteText(e.target.value)}
             />
             <button 
               onClick={handlePinNote}
               className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-mono font-bold text-[10px] uppercase cursor-pointer"
             >
               PIN
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}

export default CountryRightPanel;
