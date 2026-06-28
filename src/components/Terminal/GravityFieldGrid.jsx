import { useMemo } from "react";
import useTerminalStore from "../../store/terminalStore";

export function GravityFieldGrid() {
  const { whatIfScenario, selectedCountry, scrubStep } = useTerminalStore();

  const isWarped = !!whatIfScenario;

  // Warp offset calculation
  const warpOffset = useMemo(() => {
    if (!whatIfScenario) return { x: 0, y: 0, intensity: 0 };
    const x = (whatIfScenario.macro || 0) * 15; 
    const y = (whatIfScenario.volatility || 0) * 12;
    const intensity = Math.min(1, Math.max(0, (Math.abs(whatIfScenario.macro || 0) + Math.abs(whatIfScenario.volatility || 0)) / 6));
    return { x, y, intensity };
  }, [whatIfScenario]);

  // Center coordinate of the grid overlay
  const cx = 50; 
  const cy = 50; 

  const circles = [15, 28, 40, 52];
  const rays = useMemo(() => {
    // Add dynamic rotation based on time scrubStep progress
    const angleOffset = ((scrubStep || 0) * 0.36 * Math.PI) / 180; 
    return Array.from({ length: 12 }, (_, i) => (i * 30 * Math.PI) / 180 + angleOffset);
  }, [scrubStep]);

  return (
    <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden flex items-center justify-center">
      {/* 
        This SVG overlays the center workspace.
        It uses percentages to stay responsive and center-aligned.
      */}
      <svg className="w-[85%] h-[85%] max-w-[800px] max-h-[800px] opacity-40 overflow-visible" viewBox="0 0 100 100">
        
        {/* ─── GHOST BASE GRID (Faint Indigo, prior state, always visible under warp) ─── */}
        <g stroke="rgba(99, 102, 241, 0.15)" fill="none" strokeWidth="0.25">
          {/* Base Rings */}
          {circles.map((r, idx) => (
            <circle 
              key={`base-r-${idx}`} 
              cx={cx} 
              cy={cy} 
              r={r} 
              strokeDasharray="1, 2"
            />
          ))}
          {/* Base Rays */}
          {rays.map((angle, idx) => {
            const rx1 = cx + 8 * Math.cos(angle);
            const ry1 = cy + 8 * Math.sin(angle);
            const rx2 = cx + 55 * Math.cos(angle);
            const ry2 = cy + 55 * Math.sin(angle);
            return (
              <line 
                key={`base-ray-${idx}`} 
                x1={rx1} 
                y1={ry1} 
                x2={rx2} 
                y2={ry2} 
                strokeDasharray="1, 3"
              />
            );
          })}
        </g>

        {/* ─── LIVE WARPED GRID (Copper/Gold when warped, Deep Indigo when flat) ─── */}
        <g fill="none" className="transition-all duration-700 ease-out">
          {(() => {
            const strokeColor = isWarped ? "#d97706" : "rgba(99, 102, 241, 0.35)";
            const strokeW = isWarped ? 0.45 : 0.3;
            const targetCx = cx + warpOffset.x;
            const targetCy = cy + warpOffset.y;

            return (
              <g stroke={strokeColor} strokeWidth={strokeW}>
                {/* Warped Rings */}
                {circles.map((r, idx) => {
                  // Morph ring paths based on intensity
                  if (isWarped) {
                    const rX = r + (warpOffset.intensity * 2);
                    const rY = r - (warpOffset.intensity * 2);
                    return (
                      <ellipse
                        key={`warp-r-${idx}`}
                        cx={targetCx}
                        cy={targetCy}
                        rx={rX}
                        ry={rY}
                        className="transition-all duration-700 ease-out"
                        style={{ filter: "drop-shadow(0 0 2px rgba(217, 119, 6, 0.2))" }}
                      />
                    );
                  }
                  return (
                    <circle
                      key={`flat-r-${idx}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}

                {/* Warped Rays */}
                {rays.map((angle, idx) => {
                  // Connect center core to outer boundary, bending towards warped hub
                  if (isWarped) {
                    const rx1 = cx + 8 * Math.cos(angle);
                    const ry1 = cy + 8 * Math.sin(angle);
                    const rx2 = cx + 55 * Math.cos(angle);
                    const ry2 = cy + 55 * Math.sin(angle);
                    const controlX = targetCx + (30 * 0.4) * Math.cos(angle);
                    const controlY = targetCy + (30 * 0.4) * Math.sin(angle);

                    return (
                      <path
                        key={`warp-ray-${idx}`}
                        d={`M ${rx1} ${ry1} Q ${controlX} ${controlY} ${rx2} ${ry2}`}
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  }

                  const rx1 = cx + 8 * Math.cos(angle);
                  const ry1 = cy + 8 * Math.sin(angle);
                  const rx2 = cx + 55 * Math.cos(angle);
                  const ry2 = cy + 55 * Math.sin(angle);
                  return (
                    <line
                      key={`flat-ray-${idx}`}
                      x1={rx1}
                      y1={ry1}
                      x2={rx2}
                      y2={ry2}
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
              </g>
            );
          })()}
        </g>
      </svg>
      
      {/* Visual legend label inside map */}
      {isWarped && (
        <div className="absolute bottom-16 right-16 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-mono text-amber-500 uppercase tracking-widest animate-pulse">
          ⚠️ Gravity Warp Active: {Math.round(warpOffset.intensity * 100)}% Distortion
        </div>
      )}
    </div>
  );
}

export default GravityFieldGrid;
