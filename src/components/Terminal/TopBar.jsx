import { useState, useEffect } from "react";
import { Activity, Bell, Terminal, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function TopBar({ currentView, onSetView }) {
  const { userProfileData, logout } = useAuth();
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Running clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour12: false }));
      setDateStr(d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = (e) => {
    if (e.key === "Enter") {
      const val = e.target.value.trim().toUpperCase();
      if (val) {
        // Broadcast custom event or toggle stock panel if matches a ticker
        window.dispatchEvent(new CustomEvent("search-ticker", { detail: val }));
        e.target.value = "";
      }
    }
  };

  const topTicks = [
    { name: "BTC", value: "$67,234", change: "+2.4%", isPositive: true },
    { name: "GOLD", value: "$2,387", change: "+0.8%", isPositive: true },
    { name: "VIX", value: "14.32", change: "-3.2%", isPositive: false },
  ];

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#1e293b] bg-[#070b14] px-4 text-sm font-medium z-50 shadow-sm shrink-0">
      {/* Left Section: Logo */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 rounded-sm p-1">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-[0.2em] text-slate-100 text-sm">GLOBALFIN</span>
          <span className="text-[10px] text-indigo-400 font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 ml-2">v0.5.1</span>
        </div>
      </div>

      {/* Center Section: Command Line */}
      <div className="flex-1 flex max-w-2xl px-6 mx-auto">
        <div className="relative w-full flex items-center">
          <div className="absolute left-3 text-indigo-500 font-mono font-bold text-[12px]">&gt;</div>
          <input
            type="text"
            onKeyDown={handleCommandSubmit}
            placeholder="ENTER TICKER (e.g. AAPL, NVDA)..."
            className="w-full rounded bg-[#020617] border border-[#1e293b] py-1.5 pl-8 pr-10 text-[11px] uppercase font-mono font-bold tracking-widest text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-[#0c1220] focus:ring-1 focus:ring-indigo-500/50"
          />
          <Terminal className="absolute right-3 h-3.5 w-3.5 text-slate-600" />
        </div>
      </div>

      {/* Right Section: Tickers & Status */}
      <div className="flex items-center gap-5 ml-auto">
        <div className="hidden items-center gap-4 xl:flex bg-[#020617] p-1.5 px-3 rounded border border-[#1e293b]">
          {topTicks.map((tick) => (
            <div key={tick.name} className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-slate-500 font-bold">{tick.name}</span>
              <span className="text-slate-200 font-bold">{tick.value}</span>
              <span className={`font-bold ${tick.isPositive ? "text-emerald-400" : "text-rose-500"}`}>
                {tick.change}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 pl-4 border-l border-[#1e293b]">
          <div className="hidden sm:flex flex-col text-right font-mono text-[10px] leading-tight">
            <span className="text-emerald-400 font-bold tracking-wider">{timeStr}</span>
            <span className="text-slate-500 tracking-wider">{dateStr} UTC</span>
          </div>
          
          <button 
            onClick={() => onSetView('social')}
            className={`relative flex items-center justify-center transition-colors bg-[#020617] p-1.5 rounded border ${currentView === 'social' ? 'border-indigo-500 text-indigo-400' : 'border-[#1e293b] text-slate-400 hover:text-slate-200'}`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-[#0c1220] animate-pulse"></span>
          </button>

          {/* User Profile Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {userProfileData?.photoURL ? (
                  <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-300">U</span>
                )}
              </div>
              <div className="hidden md:flex flex-col font-mono text-[9px] leading-none text-left">
                <span className="text-slate-300 font-bold truncate max-w-[80px]">{userProfileData?.displayName || "Trader"}</span>
                {userProfileData?.idNum && (
                  <span className="text-indigo-400 font-bold mt-0.5">#{userProfileData.idNum}</span>
                )}
              </div>
            </div>
            
            <button 
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors hover:bg-white/5 rounded"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
