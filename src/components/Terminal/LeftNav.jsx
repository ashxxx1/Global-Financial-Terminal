import { useState } from "react";
import {
  Globe2, Activity, Calendar, Zap, RefreshCw, Hash, Newspaper,
  Coins, BarChart2, Grid, Cpu,
} from "lucide-react";

export function LeftNav({ currentView, onSetView }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const navItems = [
    { icon: Globe2, label: "Nexus", val: "globe" },
    { icon: Newspaper, label: "Wire", val: "news" },
    { icon: Hash, label: "Pulse", val: "social" },
    { icon: Zap, label: "Book", val: "portfolio" },
    { icon: Coins, label: "FX", val: "fx" },
    { icon: Calendar, label: "Cal", val: "calendar" },
    { icon: BarChart2, label: "Chart", val: "charts" },
    { icon: Activity, label: "Macro", val: "heatmap" },
    { icon: Grid, label: "Link", val: "correlation" },
  ];

  return (
    <nav className="nx-rail" aria-label="Terminal modules">
      <div className="flex flex-col gap-1 w-full items-center">
        {navItems.map((item) => {
          const active = currentView === item.val || (item.val === "globe" && currentView === "home");
          return (
            <button
              key={item.val}
              onClick={() => onSetView(item.val)}
              className={`nx-rail__item ${active ? "active" : ""}`}
              title={item.label}
            >
              <item.icon className="nx-rail__icon h-4 w-4" strokeWidth={active ? 2.5 : 2} />
              <span className="nx-rail__label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 w-full items-center">
        <button
          disabled
          className="nx-rail__item"
          title="System Ops — Coming Soon"
        >
          <Cpu className="nx-rail__icon h-4 w-4 opacity-40" />
          <span className="nx-rail__label opacity-40">Ops</span>
        </button>

        <button
          onClick={() => {
            setIsSyncing(true);
            setTimeout(() => setIsSyncing(false), 1200);
          }}
          className="nx-rail__item"
          style={{ color: "var(--nx-gold)" }}
          aria-label="Synchronize data feeds"
        >
          <RefreshCw className={`nx-rail__icon h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span className="nx-rail__label" style={{ color: "var(--nx-gold)" }}>Sync</span>
        </button>
      </div>
    </nav>
  );
}

export default LeftNav;
