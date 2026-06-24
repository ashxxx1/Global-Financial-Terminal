import { useState } from "react";
import { 
  AlertTriangle, 
  Target, 
  Cpu, 
  Zap,
  Globe2,
  LineChart
} from "lucide-react";

const events = [
  {
    id: 1,
    title: "Unscheduled OPEC+ Output Reduction",
    time: "2m ago",
    category: "MACRO",
    type: "GEOPOLITICAL",
    impact: 94,
    sentiment: 21,
    confidence: 88,
    assets: ["$USO", "$XOM", "$CVX", "$BRENT"],
    source: "Automated Satellite ML / Refinery Heat Signatures",
    summary: "Anomalous heat signatures dropping across 4 primary Saudi facilities matching patterns historically preceding major output cuts. Likelihood of formal announcement within 48 hours exceeds 80%.",
    isAlert: true
  },
  {
    id: 2,
    title: "Semiconductor Supply Chain Disruption",
    time: "14m ago",
    category: "SUPPLY CHAIN",
    type: "SUPPLY CHAIN",
    impact: 76,
    sentiment: 42,
    confidence: 94,
    assets: ["$TSM", "$NVDA", "$ASML"],
    source: "Global Port Logistics Network Tracker",
    summary: "Seismic event off Taiwan coast has paused operations at two major deepwater ports. Neon gas routing delays detected. AI supply chain disruption probability spiking.",
    isAlert: false
  },
  {
    id: 3,
    title: "ECB Emergency Liquidity Injection",
    time: "1h 2m ago",
    category: "MACRO",
    type: "MACROECONOMIC",
    impact: 89,
    sentiment: 66,
    confidence: 100,
    assets: ["$EURUSD", "$DE0001102309"],
    source: "ECB SWIFT Wire Feed",
    summary: "Unprecedented intra-meeting repo operations observed targeting specific Tier 1 European banks to preempt liquidity crunch. Suggests hidden balance sheet vulnerabilities.",
    isAlert: true
  },
  {
    id: 4,
    title: "AI Regulatory Framework Draft Leaked",
    time: "3h 45m ago",
    category: "GEOPOLITICAL",
    type: "REGULATORY",
    impact: 65,
    sentiment: 45,
    confidence: 72,
    assets: ["$MSFT", "$GOOGL", "$META"],
    source: "Deep Web Policy Scraping",
    summary: "Draft EU directive implies strict liability for autonomous agents making financial decisions. Compliance costs modeled to impact MSFT operating margins by 1.2%.",
    isAlert: false
  }
];

const ScoreGauge = ({ val, label, invert = false }) => {
  const isHigh = val > 75;
  const isLow = val < 40;
  
  let color = isHigh ? "bg-emerald-500" : isLow ? "bg-rose-500" : "bg-amber-500";
  let textColor = isHigh ? "text-emerald-400" : isLow ? "text-rose-400" : "text-amber-400";
  
  if (invert) {
     color = isHigh ? "bg-rose-500" : isLow ? "bg-emerald-500" : "bg-amber-500";
     textColor = isHigh ? "text-rose-400" : isLow ? "text-emerald-400" : "text-amber-400";
  }

  return (
    <div className="flex flex-col items-center gap-0.5 w-full relative">
       <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
       <div className={`text-[14px] font-bold font-mono ${textColor}`}>{val}</div>
       <div className="w-full h-1 bg-[#0f172a] rounded overflow-hidden">
         <div className={`h-full ${color}`} style={{ width: `${val}%` }} />
       </div>
    </div>
  );
};

export function IntelligenceFeed() {
  const [activeTab, setActiveTab] = useState('ALL EVENTS');
  
  const filteredEvents = activeTab === 'ALL EVENTS' 
    ? events 
    : events.filter(e => e.category === activeTab);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-indigo-500" />
          <h2 className="text-[13px] font-bold tracking-widest text-[#94a3b8]">GLOBAL EVENT STREAM</h2>
        </div>
        <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 motion-safe:animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          LIVE
        </div>
      </div>

      <div className="flex gap-2 p-3 border-b border-white/5 bg-black/10 overflow-x-auto scrollbar-none snap-x">
        {['ALL EVENTS', 'MACRO', 'GEOPOLITICAL', 'HFT ALERTS', 'SUPPLY CHAIN'].map((tab) => (
          <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`shrink-0 snap-start px-3 py-1.5 text-[11px] font-bold tracking-wider rounded transition-colors ${
                activeTab === tab 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10'
             }`}
          >
             {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredEvents.map(event => (
          <div key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors p-3.5 group relative cursor-pointer">
            {event.isAlert && (
               <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
                  <div className="absolute top-[-16px] right-[-16px] w-8 h-8 bg-rose-500/80 rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
               </div>
            )}
            
            <div className="flex items-center justify-between mb-1.5 pr-6">
               <div className="flex items-center gap-2">
                  {event.type === 'GEOPOLITICAL' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  {event.type === 'SUPPLY CHAIN' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                  {event.type === 'MACROECONOMIC' && <LineChart className="w-3.5 h-3.5 text-indigo-500" />}
                  {event.type === 'REGULATORY' && <Cpu className="w-3.5 h-3.5 text-sky-500" />}
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${
                     event.type === 'GEOPOLITICAL' ? 'text-rose-500' :
                     event.type === 'SUPPLY CHAIN' ? 'text-amber-500' :
                     event.type === 'MACROECONOMIC' ? 'text-indigo-500' : 'text-sky-500'
                  }`}>
                    {event.type}
                  </span>
               </div>
               <span className="text-[10px] text-slate-500 font-mono tracking-wider">{event.time}</span>
            </div>

            <h3 className="text-[13px] font-bold text-slate-100 mb-1.5 leading-snug group-hover:text-white transition-colors">
              {event.title}
            </h3>

            <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed mb-3 line-clamp-2">
              {event.summary}
            </p>

            <div className="flex gap-3 mb-3 p-2 bg-black/40 rounded border border-white/5">
               <ScoreGauge val={event.impact} label="IMPACT" invert />
               <ScoreGauge val={event.sentiment} label="SENTIMENT" />
               <ScoreGauge val={event.confidence} label="CONFID." />
            </div>

            <div className="flex items-center justify-between">
               <div className="flex flex-wrap gap-1.5">
                 {event.assets.map(asset => (
                   <span key={asset} className="px-1.5 py-0.5 bg-sky-900/40 border border-sky-800 text-sky-400 text-[10px] font-bold font-mono tracking-wider uppercase rounded">
                     {asset}
                   </span>
                 ))}
               </div>
               <button 
                 className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                 onClick={(e) => {
                   e.stopPropagation();
                   alert(`Analysis for: ${event.title}\nGeopolitical risk impact models indicate moderate correlation shifts.`);
                 }}
               >
                 <Target className="w-3 h-3" />
                 ANALYZE
               </button>
            </div>
            
            <div className="mt-2.5 text-[9px] text-slate-500 font-mono tracking-wider uppercase whitespace-nowrap overflow-hidden text-ellipsis">
               SRC: {event.source}
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-mono text-[12px] tracking-wider">
             NO EVENTS DETECTED FOR CURRENT FILTER
          </div>
        )}
      </div>
    </div>
  );
}
