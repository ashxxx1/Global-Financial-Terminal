import { X, Building2, ShieldAlert } from "lucide-react";
import { getCountryStats } from "./data";
import MarketTable from "../MarketTable/MarketTable";

export function CountryLeftPanel({ country, onClose, timeframe = "1D" }) {
  if (!country) return null;

  const name = country.properties?.ADMIN || country.name || "Unknown Region";
  const iso = country.properties?.ISO_A2 || country.code || "XX";
  
  const stats = getCountryStats(iso);
  const riskColor = stats.riskScore > 75 ? 'text-rose-500' : stats.riskScore > 40 ? 'text-amber-500' : 'text-emerald-400';
  const riskBorder = stats.riskScore > 75 ? 'border-rose-500' : stats.riskScore > 40 ? 'border-amber-500' : 'border-emerald-500';

  return (
    <div className="flex flex-col h-full bg-[#020617]/95 border-r border-[#1e293b]/50 text-slate-200">
      {/* Header with Return Button */}
      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/30 rounded flex items-center justify-center font-mono font-bold text-sm text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {iso}
          </div>
          <div>
            <h2 className="text-[14px] font-bold tracking-wider text-slate-100 uppercase truncate max-w-[150px]">{name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
               <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-widest px-2 py-1.5 border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 rounded cursor-pointer flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          EXIT
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* Box 1: Economic indicators */}
        <div className="flex flex-col gap-2">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">📊 Economic indicators</span>
          <div className="grid grid-cols-2 gap-2.5">
             <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center shadow-md">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">GDP</span>
                <span className="font-mono text-slate-200 text-base font-bold">${stats.gdp}T</span>
             </div>
             <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center shadow-md">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">INFLATION</span>
                <span className={`font-mono text-base font-bold ${parseFloat(stats.inflation) > 4 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.inflation}%</span>
             </div>
             <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center shadow-md">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">C.B. RATE</span>
                <span className="font-mono text-amber-400 text-base font-bold">{stats.rate}%</span>
             </div>
             <div className="bg-[#0c1220]/80 border border-[#1e293b] p-3 rounded flex flex-col justify-center shadow-md">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">FX VALUE</span>
                <span className="font-mono text-indigo-400 text-base font-bold">{stats.currency}</span>
             </div>
          </div>
        </div>

        {/* Box 2: Political Risk */}
        <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col items-center justify-center shadow-md">
          <div className="flex items-center gap-2 mb-3 self-start">
             <ShieldAlert className={`w-4 h-4 ${riskColor}`} />
             <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase font-mono">Political Risk</span>
          </div>
          <div className="flex items-center justify-center my-1.5">
             <div className="relative w-20 h-20 shrink-0 flex items-center justify-center rounded-full border-[3px] border-slate-800">
                <div className={`absolute inset-0 rounded-full border-[3px] ${riskBorder} border-t-transparent border-l-transparent rotate-12`} />
                <span className={`text-2xl font-mono font-bold ${riskColor}`}>{stats.riskScore}</span>
             </div>
          </div>
        </div>

        {/* Box 3: Strategic Equities */}
        <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col overflow-x-auto shadow-md">
          <div className="flex items-center justify-between mb-3.5">
             <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase font-mono">Strategic Equities</span>
             </div>
             <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-800/50 px-1 rounded">{timeframe}</span>
          </div>
          <MarketTable countryCode={iso} />
        </div>

      </div>
    </div>
  );
}

export default CountryLeftPanel;
