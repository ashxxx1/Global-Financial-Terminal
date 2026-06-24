import { useState } from 'react';
import { Globe2, Activity, Calendar, Zap, Cpu, RefreshCw, Hash, Newspaper, Coins, BarChart2 } from 'lucide-react';

export function LeftNav({ currentView, onSetView }) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const navItems = [
    { icon: Globe2, label: 'Terminal', val: 'globe', disabled: false },
    { icon: Newspaper, label: 'News', val: 'news', disabled: false },
    { icon: Hash, label: 'Social', val: 'social', disabled: false },
    { icon: Zap, label: 'Portfolio', val: 'portfolio', disabled: false },
    { icon: Coins, label: 'FX Feed', val: 'fx', disabled: false },
    { icon: Calendar, label: 'Calendar', val: 'calendar', disabled: false },
    { icon: BarChart2, label: 'Charts', val: 'charts', disabled: false },
    { icon: Activity, label: 'Macro', val: 'heatmap', disabled: false },
  ];

  return (
    <div className="left-nav flex flex-col w-[72px] border-r border-[#1e293b]/50 bg-black/20 py-3.5 items-center justify-between z-10 shrink-0">
      <div className="flex flex-col gap-4.5 w-full items-center">
        {navItems.map((item, idx) => {
          const active = currentView === item.val || (item.val === 'globe' && currentView === 'home');
          return (
            <button 
              key={idx} 
              disabled={item.disabled}
              onClick={() => !item.disabled && onSetView(item.val)}
              className={`flex flex-col items-center gap-1 w-full py-0.5 transition-colors relative group cursor-pointer ${
                active ? 'text-indigo-400 font-bold' : item.disabled ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={item.label}
            >
              <item.icon className={`h-4.5 w-4.5 ${active ? 'opacity-100' : 'opacity-70'}`} />
              <span className="text-[8.5px] uppercase font-bold tracking-wider">{item.label}</span>
              {active && <div className="absolute left-0 top-[10%] w-1 h-[80%] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] rounded-r-md"></div>}
            </button>
          )
        })}
      </div>
      
      <div className="flex flex-col gap-4 w-full items-center mb-1">
        <button 
          className="flex flex-col items-center gap-1 w-full py-0.5 transition-colors text-slate-700 cursor-not-allowed group relative"
          aria-label="System Operations"
        >
          <Cpu className="h-4.5 w-4.5 opacity-70" />
          <span className="text-[8.5px] uppercase font-bold tracking-wider">Sys Ops</span>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
             COMING SOON
          </div>
        </button>
        
        <button 
          onClick={() => {
            setIsSyncing(true);
            setTimeout(() => setIsSyncing(false), 1000);
          }}
          className="flex flex-col items-center gap-1 w-full py-0.5 transition-colors text-indigo-500 hover:text-indigo-400 mt-1 cursor-pointer"
          aria-label="Synchronize Data"
        >
          <RefreshCw className={`h-4.5 w-4.5 opacity-100 object-contain ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-[8.5px] uppercase font-bold tracking-wider text-indigo-400">SYNC</span>
        </button>
      </div>
    </div>
  );
}
export default LeftNav;
