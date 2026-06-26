import { X, Building2, ShieldAlert } from "lucide-react";
import { getCountryStats } from "./data";
import MarketTable from "../MarketTable/MarketTable";
import { getCountryData, getCountrySignalMetrics } from "../../lib/quantFeed";
import { kNearestAnalogs } from "../../lib/quantEngine";
import { CALENDAR_EVENTS } from "../EconomicCalendar/calendarData";

function getUpcomingEvents(iso) {
  // Filter for matching country or EU for European countries
  const isEuro = ["DE", "FR", "IT", "NL", "SE"].includes(iso);
  const events = CALENDAR_EVENTS.filter(e => e.country === iso || (isEuro && e.country === "EU"));
  
  if (events.length > 0) {
    return events.slice(0, 3).map(e => ({
      title: e.event,
      type: e.category,
      countdown: `${e.time} on ${e.date}`
    }));
  }
  
  // Deterministic fallback countdowns based on ISO code
  const seed = (iso.charCodeAt(0) || 65) + (iso.charCodeAt(1) || 66);
  return [
    { title: "Central Bank Rate Decision", type: "Monetary Policy", countdown: `In ${(seed % 4) + 1} Days` },
    { title: "CPI Inflation Report", type: "Macro Inflation", countdown: `In ${(seed % 5) + 3} Days` }
  ];
}

function getSentimentData(iso) {
  try {
    const { baseFactors } = getCountryData(iso);
    const metrics = getCountrySignalMetrics(iso);
    
    const score = Math.round(Math.max(0, Math.min(100, 50 + metrics.factors.sentiment * 15)));
    const seed = (iso.charCodeAt(0) || 65) * 100 + (iso.charCodeAt(1) || 66);
    const history = Array.from({ length: 10 }, (_, i) => 
      Math.round(Math.max(0, Math.min(100, 50 + Math.sin(i + seed) * 15 + (metrics.factors.sentiment * 5))))
    );

    const label = score > 58 ? "BULLISH" : score < 42 ? "BEARISH" : "NEUTRAL";
    const color = score > 58 ? "text-emerald-400" : score < 42 ? "text-rose-400" : "text-amber-500";

    return { score, label, color, history };
  } catch (err) {
    return { score: 50, label: "NEUTRAL", color: "text-amber-500", history: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50] };
  }
}

function getHistoricalAnalog(iso) {
  try {
    const { prices, baseFactors } = getCountryData(iso);
    const currentVec = [
      baseFactors.momentum,
      baseFactors.valuation,
      baseFactors.macro,
      baseFactors.volatility,
      baseFactors.sentiment
    ];

    const historicalSamples = [];
    const invCov = [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1]
    ];

    const seed = (iso.charCodeAt(0) || 65) * 100 + (iso.charCodeAt(1) || 66);
    let s = seed + 2000;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    for (let t = 253; t < prices.length - 30; t += 5) {
      historicalSamples.push({
        t,
        vec: [
          baseFactors.momentum + (rnd() - 0.5) * 1.5,
          baseFactors.valuation + (rnd() - 0.5) * 1.5,
          baseFactors.macro + (rnd() - 0.5) * 1.5,
          baseFactors.volatility + (rnd() - 0.5) * 1.0,
          baseFactors.sentiment + (rnd() - 0.5) * 1.0
        ],
        forwardReturn: (prices[t + 30] / prices[t] - 1) * (1.0 + (rnd() - 0.5) * 0.2)
      });
    }

    const analogs = kNearestAnalogs(currentVec, historicalSamples, invCov, 5, 20);
    const bestAnalog = analogs[0];

    let period = `T - ${500 - bestAnalog.t}d Setup`;
    if (iso === "US") {
      period = bestAnalog.t > 380 ? "Mid-2023 Consolidation" : "Late-2022 Valuation Low";
    } else if (iso === "JP") {
      period = bestAnalog.t > 380 ? "Post-YCC Pivot Phase" : "Mid-2023 Export Surge";
    } else if (iso === "DE") {
      period = bestAnalog.t > 380 ? "2023 Energy Crunch" : "2022 Supply Chain Peak";
    } else {
      period = bestAnalog.t > 380 ? "H1 2024 Regime Shift" : "H2 2023 Consolidation";
    }

    const correlationVal = Math.round(Math.max(65, Math.min(98, 98 - bestAnalog.distance * 10)));
    const currentPrices = prices.slice(-10);
    const historicalPrices = prices.slice(bestAnalog.t, bestAnalog.t + 10);

    return {
      period,
      correlation: correlationVal,
      current: currentPrices,
      historical: historicalPrices
    };
  } catch (err) {
    return {
      period: "H1 2024 Regime Shift",
      correlation: 85,
      current: [100, 101, 102, 101, 103, 104, 103, 105, 106, 107],
      historical: [100, 99, 101, 102, 100, 103, 104, 102, 104, 105]
    };
  }
}

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
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">📊 Macro Vector Indicators</span>
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

          {/* Policy & Political Calendar */}
          <div className="mt-1 p-3 bg-[#080d19] border border-white/5 rounded-lg flex flex-col gap-2">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">📅 Policy & Political Calendar</span>
            <div className="flex flex-col gap-2">
              {getUpcomingEvents(iso).map((evt, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#050912] p-2 rounded border border-white/5">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-200 font-medium truncate max-w-[170px]">{evt.title}</span>
                    <span className="text-[7.5px] font-mono font-bold text-indigo-400 uppercase tracking-widest">{evt.type}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                    {evt.countdown}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Box 2: Political Risk */}
        <div className="bg-[#0c1220]/80 border border-[#1e293b] p-4 rounded flex flex-col shadow-md">
          <div className="flex items-center gap-2 mb-3">
             <ShieldAlert className={`w-4 h-4 ${riskColor}`} />
             <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase font-mono">Risk Gravity Details</span>
          </div>
          
          <div className="flex items-center gap-4 justify-between border-b border-white/5 pb-3">
             <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full border-[3px] border-slate-800">
                <div className={`absolute inset-0 rounded-full border-[3px] ${riskBorder} border-t-transparent border-l-transparent rotate-12`} />
                <span className={`text-xl font-mono font-bold ${riskColor}`}>{stats.riskScore}</span>
             </div>
             <div className="flex-1 min-w-0">
               <span className="text-[8.5px] font-mono text-slate-500 uppercase block">POLITICAL RISK SCORE</span>
               <p className="text-[11px] text-slate-400 font-sans leading-snug mt-0.5">
                 Transmission channels indicate {stats.riskScore > 75 ? 'critical' : stats.riskScore > 40 ? 'elevated' : 'stable'} geopolitical exposure.
               </p>
             </div>
          </div>

          {/* Sentiment Pulse */}
          <div className="py-2.5 border-b border-white/5 flex justify-between items-center gap-2">
            <div>
              <span className="text-[8.5px] font-mono text-slate-500 uppercase block">Sentiment Pulse</span>
              <span className={`text-[12px] font-mono font-bold ${getSentimentData(iso).color}`}>
                {getSentimentData(iso).score}/100 · {getSentimentData(iso).label}
              </span>
            </div>
            {/* SVG Trendline */}
            {(() => {
              const sentiment = getSentimentData(iso);
              const maxHistory = Math.max(...sentiment.history);
              const minHistory = Math.min(...sentiment.history);
              const range = maxHistory - minHistory || 1;
              const points = sentiment.history.map((val, idx) => {
                const x = (idx / 9) * 80; 
                const y = 17 - ((val - minHistory) / range) * 14; 
                return `${x},${y}`;
              }).join(" ");
              const pulseColor = sentiment.score > 62 ? "#10b981" : sentiment.score < 48 ? "#ef4444" : "#f59e0b";
              return (
                <svg className="w-[80px] h-[20px] overflow-visible">
                  <defs>
                    <linearGradient id={`sentGrad-${iso}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={pulseColor} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={pulseColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`M ${points}`} fill="none" stroke={pulseColor} strokeWidth="1.2" />
                  <polygon points={`0,20 ${points} 80,20`} fill={`url(#sentGrad-${iso})`} opacity="0.4" />
                  <circle cx="80" cy={17 - ((sentiment.history[9] - minHistory) / range) * 14} r="2.5" fill={pulseColor} className="motion-safe:animate-pulse" />
                </svg>
              );
            })()}
          </div>

          {/* Historical Analog Finder */}
          <div className="pt-2.5 flex justify-between items-center gap-2">
            <div>
              <span className="text-[8.5px] font-mono text-slate-500 uppercase block">Historical Analog</span>
              <span className="text-[11px] font-mono font-bold text-amber-400 block truncate max-w-[150px]">
                {getHistoricalAnalog(iso).period}
              </span>
              <span className="text-[7.5px] text-slate-500 font-mono">Correlation: {getHistoricalAnalog(iso).correlation}%</span>
            </div>
            {/* Sparklines */}
            {(() => {
              const analog = getHistoricalAnalog(iso);
              const curMax = Math.max(...analog.current);
              const curMin = Math.min(...analog.current);
              const curRange = curMax - curMin || 1;
              const curPoints = analog.current.map((v, i) => `${(i/9)*30},${10 - ((v - curMin)/curRange)*8}`).join(" ");

              const histMax = Math.max(...analog.historical);
              const histMin = Math.min(...analog.historical);
              const histRange = histMax - histMin || 1;
              const histPoints = analog.historical.map((v, i) => `${(i/9)*30},${10 - ((v - histMin)/histRange)*8}`).join(" ");

              return (
                <div className="flex gap-2 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[6px] font-mono text-slate-500 uppercase">CUR</span>
                    <svg className="w-[30px] h-[10px] overflow-visible">
                      <path d={`M ${curPoints}`} fill="none" stroke="#6366f1" strokeWidth="1.0" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[6px] font-mono text-slate-500 uppercase">HIST</span>
                    <svg className="w-[30px] h-[10px] overflow-visible">
                      <path d={`M ${histPoints}`} fill="none" stroke="#f59e0b" strokeWidth="1.0" />
                    </svg>
                  </div>
                </div>
              );
            })()}
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
