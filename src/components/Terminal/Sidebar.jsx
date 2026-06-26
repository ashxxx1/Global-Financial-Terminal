import { useState, useMemo } from "react";
import { RefreshCcw, Radar, Gauge, Droplets, LineChart, BookOpen } from "lucide-react";
import { indicesData } from "./data";
import useTerminalStore from "../../store/terminalStore";

export function Sidebar() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { watchlist } = useTerminalStore();

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  // Auto-generated morning briefing with citations
  const briefText = useMemo(() => {
    if (!watchlist || watchlist.length === 0) {
      return "S&P 500 index margins expand on tech capital injection `[S&P 500]`. High-yield sovereign spreads indicate stabilizing credit conditions across European banking nodes `[DAX 40]`. Yield dynamics signal delayed Fed policy adjustments `[NASDAQ]`.";
    }
    const names = watchlist.slice(0, 3).map(s => s.symbol || s.name);
    return `Watchlist highlights: ${names.join(", ")} show sticky pricing parameters. Momentum support remains resilient for holdings \`[${names[0]}]\`. Risk exposures are elevated across regional channels \`[${names[1] || 'Markets'}]\`.`;
  }, [watchlist]);

  return (
    <aside className="flex w-full h-full flex-col bg-transparent shrink-0 z-10 transition-all duration-300">
      
      {/* Top Status */}
      <div className="flex flex-col p-3 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] motion-safe:animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Node: Online</span>
          </div>
          <button 
             onClick={handleSync}
             className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
          >
            <RefreshCcw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            Auto Sync
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* Morning Briefing Daily Digest */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent relative">
           <div className="flex items-center gap-2 mb-2.5">
             <BookOpen className="w-4 h-4 text-amber-400" />
             <h3 className="text-[12px] font-bold tracking-widest text-[#94a3b8] font-mono">MORNING BRIEFING</h3>
             <span className="text-[8px] font-mono text-slate-500 bg-slate-800 px-1 rounded ml-auto">DAILY DIGEST</span>
           </div>
           
           <div className="text-[11.5px] text-slate-300 font-sans leading-relaxed bg-[#060a16] border border-[#1e293b] p-3 rounded-lg relative overflow-hidden">
             {/* Glowing side accent */}
             <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500/40" />
             
             {(() => {
               const parts = briefText.split(/(`\[.*?\]`)/);
               return (
                 <p className="m-0 leading-relaxed">
                   {parts.map((p, pidx) => {
                     if (p.startsWith("`[") && p.endsWith("]`")) {
                       const label = p.slice(2, -2);
                       return (
                         <span 
                           key={pidx} 
                           className="inline-block px-1 py-px bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-mono text-[8px] rounded mx-0.5 uppercase cursor-pointer hover:bg-indigo-500 hover:text-white transition-all font-bold"
                           onClick={() => alert(`Navigating to citation: ${label}`)}
                         >
                           {label}
                         </span>
                       );
                     }
                     return p;
                   })}
                 </p>
               );
             })()}
           </div>
        </div>
        
        {/* Market Overview Module */}
        <div className="p-4 border-b border-white/5 bg-black/10">
           <div className="flex items-center gap-2 mb-4">
             <LineChart className="w-4 h-4 text-slate-400" />
             <h3 className="text-[12px] font-bold tracking-widest text-[#94a3b8]">MARKET OVERVIEW</h3>
           </div>
           <div className="flex flex-col gap-2">
             {indicesData.slice(0, 6).map((index) => (
               <div key={index.name} className="group flex cursor-pointer items-center justify-between hover:bg-white/5 p-1.5 rounded transition-colors -mx-1.5">
                 <span className="text-[12px] font-bold text-slate-300 transition-colors group-hover:text-white px-1.5">
                   {index.name}
                 </span>
                 <div className="flex items-center gap-3 font-mono px-1.5">
                   <span className="text-[12px] text-slate-200">{index.value}</span>
                   <span className={`w-14 text-right text-[12px] font-bold ${index.isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                     {index.change}
                   </span>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Global Risk Radar */}
        <div className="p-4 border-b border-white/5 bg-black/10">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-rose-500" />
                <h3 className="text-[12px] font-bold tracking-widest text-[#94a3b8]">RISK RADAR</h3>
             </div>
             <span className="text-[11px] font-mono text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
               ELEVATED
             </span>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <div className="bg-black/20 border border-white/5 rounded p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Geopolitical</span>
                <span className="text-[16px] font-mono font-bold text-rose-500">84/100</span>
             </div>
             <div className="bg-black/20 border border-white/5 rounded p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Systemic</span>
                <span className="text-[16px] font-mono font-bold text-amber-500">62/100</span>
             </div>
             <div className="bg-black/20 border border-white/5 rounded p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credit</span>
                <span className="text-[16px] font-mono font-bold text-emerald-400">38/100</span>
             </div>
             <div className="bg-black/20 border border-white/5 rounded p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volatility</span>
                <span className="text-[16px] font-mono font-bold text-amber-500">55/100</span>
             </div>
           </div>
        </div>

        {/* Fear & Greed Index */}
        <div className="p-4 border-b border-white/5 bg-black/10">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-500" />
                <h3 className="text-[12px] font-bold tracking-widest text-[#94a3b8]">SENTIMENT</h3>
             </div>
           </div>
           <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center rounded-full border-[5px] border-amber-500/50">
                 <div className="absolute inset-0 rounded-full border-[5px] border-amber-500 border-t-transparent border-r-transparent rotate-45" />
                 <span className="text-2xl font-mono font-bold text-amber-400">41</span>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                 <span className="text-[12px] font-bold text-slate-300">FEAR</span>
                 <div className="w-full h-2 flex gap-1">
                   <div className="h-full flex-1 bg-rose-500/20 rounded-l" />
                   <div className="h-full flex-[0.5] w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                   <div className="h-full flex-1 bg-emerald-500/20 rounded-r" />
                 </div>
                 <span className="text-[10px] text-slate-500 font-mono flex justify-between mt-1">
                   <span>EXTR FEAR</span>
                   <span>EXTR GREED</span>
                 </span>
              </div>
           </div>
        </div>

        {/* Liquidity Monitor */}
        <div className="p-4 bg-black/10">
           <div className="flex items-center gap-2 mb-4">
             <Droplets className="w-4 h-4 text-sky-500" />
             <h3 className="text-[12px] font-bold tracking-widest text-[#94a3b8]">LIQUIDITY MONITOR</h3>
           </div>
           <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                    <span className="text-slate-400">USD ONR (O/N Repo)</span>
                    <span className="font-mono text-sky-400 text-[12px]">5.32%</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-sky-500" />
                  </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                 <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                    <span className="text-slate-400">EUR SOFR</span>
                    <span className="font-mono text-indigo-400 text-[12px]">3.90%</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[60%] h-full bg-indigo-500" />
                 </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                 <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                    <span className="text-slate-400">Dark Pool Index</span>
                    <span className="font-mono text-purple-400 text-[12px]">42.1%</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[42%] h-full bg-purple-500" />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </aside>
  );
}
