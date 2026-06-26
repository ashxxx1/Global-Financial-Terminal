import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, Target, Cpu, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { getCausalChain } from "./causalChainData";

export function CausalChainMap({ eventId, eventTitle, onClose }) {
  const containerRef = useRef(null);
  const [data, setData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connections, setConnections] = useState([]);
  const [resizeKey, setResizeKey] = useState(0);

  // Load the causal chain data
  useEffect(() => {
    const chain = getCausalChain(eventId || eventTitle);
    setData(chain);
    setSelectedNode(chain.event); // Default select the event node itself
  }, [eventId, eventTitle]);

  // Handle resizing to redraw connections
  useEffect(() => {
    const handleResize = () => {
      setResizeKey(prev => prev + 1);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute connections coordinates
  useLayoutEffect(() => {
    if (!data || !containerRef.current) return;

    // Small delay to ensure browser layout is painted
    const timer = setTimeout(() => {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newConnections = [];

      // 1. Connect Event to all Sectors
      const eventEl = containerRef.current.querySelector(`[data-node-id="node-event"]`);
      if (eventEl) {
        const eventRect = eventEl.getBoundingClientRect();
        const startX = eventRect.right - containerRect.left;
        const startY = eventRect.top - containerRect.top + eventRect.height / 2;

        data.sectors.forEach(sector => {
          const sectorEl = containerRef.current.querySelector(`[data-node-id="node-${sector.id}"]`);
          if (sectorEl) {
            const sectorRect = sectorEl.getBoundingClientRect();
            const endX = sectorRect.left - containerRect.left;
            const endY = sectorRect.top - containerRect.top + sectorRect.height / 2;
            newConnections.push({
              id: `edge-event-${sector.id}`,
              startX,
              startY,
              endX,
              endY,
              impact: sector.impact,
              delta: sector.delta
            });
          }
        });
      }

      // 2. Connect Sectors to their child Companies
      data.sectors.forEach(sector => {
        const sectorEl = containerRef.current.querySelector(`[data-node-id="node-${sector.id}"]`);
        if (sectorEl) {
          const sectorRect = sectorEl.getBoundingClientRect();
          const startX = sectorRect.right - containerRect.left;
          const startY = sectorRect.top - containerRect.top + sectorRect.height / 2;

          // Find companies that list this sector as parent
          const childCompanies = data.companies.filter(c => c.parent === sector.id);
          childCompanies.forEach(company => {
            const companyEl = containerRef.current.querySelector(`[data-node-id="node-${company.id}"]`);
            if (companyEl) {
              const companyRect = companyEl.getBoundingClientRect();
              const endX = companyRect.left - containerRect.left;
              const endY = companyRect.top - containerRect.top + companyRect.height / 2;
              newConnections.push({
                id: `edge-${sector.id}-${company.id}`,
                startX,
                startY,
                endX,
                endY,
                impact: company.impact,
                delta: company.delta
              });
            }
          });
        }
      });

      // 3. Connect Companies to Indices
      // In this horizontal flow, we connect all companies to the indices
      data.companies.forEach(company => {
        const companyEl = containerRef.current.querySelector(`[data-node-id="node-${company.id}"]`);
        if (companyEl) {
          const companyRect = companyEl.getBoundingClientRect();
          const startX = companyRect.right - containerRect.left;
          const startY = companyRect.top - containerRect.top + companyRect.height / 2;

          data.indices.forEach(idx => {
            const idxEl = containerRef.current.querySelector(`[data-node-id="node-${idx.id}"]`);
            if (idxEl) {
              const idxRect = idxEl.getBoundingClientRect();
              const endX = idxRect.left - containerRect.left;
              const endY = idxRect.top - containerRect.top + idxRect.height / 2;

              // We only draw link if there is a loose correlation (e.g. index and company share delta sign or are in same macro direction)
              const sameDirection = (company.delta >= 0 && idx.delta >= 0) || (company.delta < 0 && idx.delta < 0);
              if (sameDirection) {
                newConnections.push({
                  id: `edge-${company.id}-${idx.id}`,
                  startX,
                  startY,
                  endX,
                  endY,
                  impact: idx.impact,
                  delta: idx.delta
                });
              }
            }
          });
        }
      });

      setConnections(newConnections);
    }, 100);

    return () => clearTimeout(timer);
  }, [data, resizeKey]);

  if (!data) return null;

  // Make an SVG curved path (bent connector S-curve)
  const drawLink = (startX, startY, endX, endY) => {
    const controlX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endY === startY ? endX - 0.1 : endX} ${endY}`;
  };

  return (
    <div 
      className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-45 flex flex-col border border-[#1e293b] rounded-lg p-6 overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Header bar */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Causal Chain Map</span>
            <h2 className="text-[15px] font-bold text-slate-100 uppercase tracking-wider">{data.event.name}</h2>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-3 py-1.5 border border-[#1e293b] bg-[#0c1220] hover:bg-rose-500/10 hover:border-rose-500/30 text-[10px] font-bold tracking-widest uppercase rounded cursor-pointer transition-colors text-slate-400 hover:text-rose-400 flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          COLLAPSE
        </button>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 min-h-0 relative flex gap-6" ref={containerRef}>
        
        {/* SVG background layer for tethers and pulses */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {connections.map(conn => {
            const isPositive = conn.delta >= 0;
            const strokeColor = isPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
            const pulseColor = isPositive ? "#10b981" : "#ef4444";
            const pathData = drawLink(conn.startX, conn.startY, conn.endX, conn.endY);

            return (
              <g key={conn.id}>
                {/* Curved Connector Line */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke={strokeColor} 
                  strokeWidth="1.5"
                  className="transition-all duration-300"
                />
                {/* Animated Pulse traveling left to right */}
                <circle r="2.5" fill={pulseColor}>
                  <animateMotion 
                    dur="4s" 
                    repeatCount="indefinite" 
                    path={pathData} 
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Nodes columns (4 horizontal layers) */}
        <div className="flex w-full h-full justify-between items-center z-10 relative">
          
          {/* Column 1: Event Node */}
          <div className="flex flex-col items-center w-1/4 shrink-0">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4">Event Trigger</div>
            <div 
              data-node-id="node-event"
              onClick={() => setSelectedNode(data.event)}
              className={`p-4 bg-[#0a0f1d] border-2 rounded-xl text-center cursor-pointer transition-all w-52 shadow-[0_0_20px_rgba(0,0,0,0.6)] ${
                selectedNode === data.event 
                  ? 'border-indigo-500 scale-105 shadow-[0_0_25px_rgba(99,102,241,0.3)]' 
                  : 'border-[#1e293b] hover:border-indigo-400'
              }`}
            >
              <div className="text-[10px] font-bold text-indigo-400 mb-1 font-mono tracking-widest">IMPACT {data.event.impact}</div>
              <h3 className="text-[13px] font-bold text-slate-100">{data.event.name}</h3>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1.5 font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 inline-block">Event</div>
            </div>
          </div>

          {/* Column 2: Affected Sectors */}
          <div className="flex flex-col gap-6 items-center w-1/4 shrink-0">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Affected Sectors</div>
            {data.sectors.map(sector => {
              const active = selectedNode === sector;
              const isPositive = sector.delta >= 0;
              const accentColor = isPositive ? 'border-emerald-500/30' : 'border-rose-500/30';
              const activeBorder = isPositive ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';

              return (
                <div 
                  key={sector.id}
                  data-node-id={`node-${sector.id}`}
                  onClick={() => setSelectedNode(sector)}
                  className={`p-3 bg-[#0a0f1d] border rounded-lg text-center cursor-pointer transition-all w-48 shadow-lg ${
                    active 
                      ? `${activeBorder} scale-105` 
                      : `border-[#1e293b] hover:${accentColor} hover:border-[#1e293b]`
                  }`}
                >
                  <h4 className="text-[12px] font-bold text-slate-200">{sector.name}</h4>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] font-mono font-bold">
                    <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                      {isPositive ? '+' : ''}{sector.delta}%
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">M: {sector.impact}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column 3: Affected Companies */}
          <div className="flex flex-col gap-4 items-center w-1/4 shrink-0">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Affected Companies</div>
            {data.companies.map(company => {
              const active = selectedNode === company;
              const isPositive = company.delta >= 0;
              const accentColor = isPositive ? 'border-emerald-500/30' : 'border-rose-500/30';
              const activeBorder = isPositive ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';

              return (
                <div 
                  key={company.id}
                  data-node-id={`node-${company.id}`}
                  onClick={() => setSelectedNode(company)}
                  className={`p-2 bg-[#0a0f1d] border rounded-lg text-center cursor-pointer transition-all w-44 shadow-md ${
                    active 
                      ? `${activeBorder} scale-105` 
                      : `border-[#1e293b] hover:${accentColor}`
                  }`}
                >
                  <h4 className="text-[11.5px] font-bold text-slate-200 truncate">{company.name}</h4>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-[9px] font-mono font-bold">
                    <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                      {isPositive ? '▲' : '▼'} {Math.abs(company.delta)}%
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">M: {company.impact}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column 4: Affected Indices */}
          <div className="flex flex-col gap-5 items-center w-1/4 shrink-0">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Affected Indices</div>
            {data.indices.map(idx => {
              const active = selectedNode === idx;
              const isPositive = idx.delta >= 0;
              const accentColor = isPositive ? 'border-emerald-500/30' : 'border-rose-500/30';
              const activeBorder = isPositive ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';

              return (
                <div 
                  key={idx.id}
                  data-node-id={`node-${idx.id}`}
                  onClick={() => setSelectedNode(idx)}
                  className={`p-2.5 bg-[#0a0f1d] border rounded-lg text-center cursor-pointer transition-all w-44 shadow-lg ${
                    active 
                      ? `${activeBorder} scale-105` 
                      : `border-[#1e293b] hover:${accentColor}`
                  }`}
                >
                  <h4 className="text-[11.5px] font-bold text-slate-200 truncate">{idx.name}</h4>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[9px] font-mono font-bold">
                    <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                      {isPositive ? '+' : ''}{idx.delta}%
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">M: {idx.impact}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Selected Node Detail Card Overlay (At bottom) */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-[#0a0f1d] border border-[#1e293b] rounded-xl flex gap-4 items-center shadow-[0_0_30px_rgba(0,0,0,0.8)] z-20 shrink-0">
          <div className="flex flex-col shrink-0 min-w-[120px] text-center border-r border-white/5 pr-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selectedNode.type || "Event"}</span>
            <h4 className="text-slate-100 font-bold text-sm mt-1 truncate max-w-[150px]">{selectedNode.name}</h4>
            <div className="mt-2 flex items-center justify-center gap-1.5">
               {selectedNode.delta !== undefined ? (
                 <span className={`flex items-center font-mono font-bold text-[13px] ${selectedNode.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {selectedNode.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
                   {selectedNode.delta >= 0 ? '+' : ''}{selectedNode.delta}%
                 </span>
               ) : (
                 <span className="text-amber-400 font-mono font-bold text-[13px]">ELEVATED</span>
               )}
            </div>
          </div>
          <div className="flex-1 text-[12px] text-slate-300 leading-relaxed font-mono">
            {selectedNode.details || `Geopolitical correlation and risk transmission matrices modeling show an impact magnitude score of ${selectedNode.impact} on related instruments.`}
          </div>
          <button 
            className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-all text-[9px] font-bold tracking-widest rounded-lg flex items-center gap-1.5 cursor-pointer uppercase shrink-0"
            onClick={() => alert(`Opening advanced terminal feed for: ${selectedNode.name}`)}
          >
            <Target className="w-3 h-3" />
            Terminal Feed
          </button>
        </div>
      )}
    </div>
  );
}

export default CausalChainMap;
