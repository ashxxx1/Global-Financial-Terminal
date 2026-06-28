import { useState, useMemo, useEffect } from "react";
import { Info, Sliders, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import useTerminalStore from "../../store/terminalStore";
import { getCountrySignalMetrics, getCountryData } from "../../lib/quantFeed";
import { compositeZ, DEFAULT_WEIGHTS } from "../../lib/quantEngine";

// Polar conversions for SVG arcs
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getArcPath(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

export function SignalDesk({ country }) {
  if (!country) return null;
  return <SignalDeskInner country={country} />;
}

function SignalDeskInner({ country }) {
  const { whatIfScenario, setWhatIfScenario, clearWhatIfScenario } = useTerminalStore();
  const [expanded, setExpanded] = useState(true);
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  const iso = country.properties?.ISO_A2 || country.code || "XX";
  const name = country.properties?.ADMIN || country.name || "Unknown Region";

  // Get baseline parameters
  const { baseFactors } = useMemo(() => getCountryData(iso), [iso]);

  // Compute live signals using the quant engine
  const metrics = useMemo(() => {
    return getCountrySignalMetrics(iso, whatIfScenario || {});
  }, [iso, whatIfScenario]);

  // Model alignment (arcs positioning)
  const arcAngles = useMemo(() => {
    const { quant, sentiment, macro } = metrics.ensemble;
    const allAgree = quant === sentiment && sentiment === macro;
    const twoAgree = quant === sentiment || sentiment === macro || quant === macro;

    if (allAgree) {
      return { a1: 30, a2: 34, a3: 38 }; // aligned
    } else if (twoAgree) {
      return { a1: 15, a2: 25, a3: 75 }; // semi-splayed
    } else {
      return { a1: 10, a2: 90, a3: 170 }; // completely splayed (disagreement)
    }
  }, [metrics.ensemble]);

  // Factor breakdown weights and terms
  const terms = useMemo(() => {
    return {
      macro: 0.20 * metrics.factors.macro,
      momentum: 0.25 * metrics.factors.momentum,
      valuation: 0.20 * metrics.factors.valuation,
      sentiment: 0.15 * metrics.factors.sentiment,
      volatility: -0.10 * metrics.factors.volatility
    };
  }, [metrics.factors]);

  // Reasoning trace with citation markers
  const reasoning = useMemo(() => {
    if (iso === "US") {
      return [
        "Sticky core indices signal high rates will remain anchored `[C.B. RATE]`.",
        "Tech valuation expansions are heavily front-loaded in semiconductor dependencies `[Strategic Equities]`.",
        "Systemic liquidity buffers cushion sovereign stress spikes `[FX VALUE]`."
      ];
    }
    if (iso === "CN") {
      return [
        "Persistent retail deflation drags on industrial production indexes `[INFLATION]`.",
        "Real-estate refinancing bottlenecks dampen corporate credit momentum `[Strategic Equities]`.",
        "Accommodative central bank actions support base equity valuations `[C.B. RATE]`."
      ];
    }
    if (iso === "JP") {
      return [
        "Sustained domestic yield curve control changes end the zero-rate policy regime `[C.B. RATE]`.",
        "Extreme currency depreciation tailwinds continue supporting export revenues `[FX VALUE]`.",
        "Corporate return margins show structural elevation trends `[Strategic Equities]`."
      ];
    }
    return [
      "Regional trade flow parameters indicate stable supply chain paths `[Flow Trajectory & Supply Chain]`.",
      "Equity index valuations trade at a historical discount vs sovereign yields `[Strategic Equities]`.",
      "Aggregated regional headlines reflect cautious short-term macro sentiment `[Sentiment Pulse]`."
    ];
  }, [iso]);

  // Log FactorVector and compositeZ to the browser console for validation
  useEffect(() => {
    const activeFactors = {
      momentum: whatIfScenario?.momentum !== undefined ? whatIfScenario.momentum : baseFactors.momentum,
      valuation: whatIfScenario?.valuation !== undefined ? whatIfScenario.valuation : baseFactors.valuation,
      macro: whatIfScenario?.macro !== undefined ? whatIfScenario.macro : baseFactors.macro,
      volatility: whatIfScenario?.volatility !== undefined ? whatIfScenario.volatility : baseFactors.volatility,
      sentiment: whatIfScenario?.sentiment !== undefined ? whatIfScenario.sentiment : baseFactors.sentiment
    };
    const zVal = compositeZ(activeFactors, DEFAULT_WEIGHTS);
    console.log(`%c[QuantEngine Math Verification - ${iso}]`, 'color: #818cf8; font-weight: bold; font-family: monospace;');
    console.log("  Active FactorVector:", activeFactors);
    console.log("  Calculated compositeZ():", zVal.toFixed(4));
    console.log("  Calculated compositeScore() squashed:", (100 / (1 + Math.exp(-zVal))).toFixed(4));
  }, [iso, whatIfScenario, baseFactors]);

  const handleToggleFactor = (factorKey) => {
    const current = whatIfScenario ? { ...whatIfScenario } : {};
    if (current[factorKey] !== undefined) {
      delete current[factorKey];
      const keysLeft = Object.keys(current);
      if (keysLeft.length === 0) {
        clearWhatIfScenario();
      } else {
        setWhatIfScenario(current);
      }
    } else {
      current[factorKey] = parseFloat(baseFactors[factorKey].toFixed(2));
      setWhatIfScenario(current);
    }
  };

  const handleSliderChange = (factorKey, val) => {
    const current = whatIfScenario ? { ...whatIfScenario } : {};
    current[factorKey] = val;
    setWhatIfScenario(current);
  };

  const getModelColor = (val) => {
    if (val === "BULLISH") return "#10b981";
    if (val === "BEARISH") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div className="flex gap-4 items-start pointer-events-auto">
      {/* Main Signal Desk */}
      <div 
        className="bg-[#040815]/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-slate-200 w-80 select-none flex flex-col gap-3 font-sans relative"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {/* Decorative corner lines - copper style */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-indigo-400/50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-indigo-400/50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-indigo-400/50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-indigo-400/50" />

        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">AI SIGNAL DESK</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setWhatIfOpen(!whatIfOpen)}
              title="Configure Scenario Simulator"
              className={`p-1 rounded border transition-colors cursor-pointer ${
                whatIfScenario 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                  : 'bg-white/5 border-white/10 hover:border-indigo-500/50 text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Big Score and Quick Summary */}
        <div className="flex justify-between items-center gap-4 py-1.5">
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">COMPOSITE BUY SIGNAL</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold tracking-tight text-white">{metrics.score}</span>
              <span className="text-xs text-slate-500 font-mono">/100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">ALLOCATION RANGE</span>
            <span className="text-sm font-mono font-bold text-indigo-300 block mt-0.5">
              {metrics.sizing.low.toFixed(1)}% - {metrics.sizing.high.toFixed(1)}%
            </span>
          </div>
        </div>

        {expanded && (
          <>
            {/* Factor Breakdown (Expandable Details) */}
            <div className="bg-[#080d19] border border-white/5 p-2 rounded flex flex-col gap-1.5">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">FACTOR COMPOSITION BREAKDOWN</span>
              <div className="flex flex-col gap-2 text-[10px] font-mono">
                
                {/* Macro */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-slate-400">Macro Vector (w: 0.20)</span>
                    <span className="text-slate-300 font-mono">z: {metrics.factors.macro.toFixed(2)} | term: {terms.macro.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden flex justify-center relative">
                    <div className="absolute w-[1px] h-full bg-slate-700/50 left-1/2" />
                    <div 
                      className={`h-full absolute ${metrics.factors.macro >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-rose-500 right-1/2'}`}
                      style={{ width: `${Math.min(50, (Math.abs(terms.macro) / 0.6) * 50)}%` }}
                    />
                  </div>
                </div>

                {/* Momentum */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-slate-400">Momentum (w: 0.25)</span>
                    <span className="text-slate-300 font-mono">z: {metrics.factors.momentum.toFixed(2)} | term: {terms.momentum.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden flex justify-center relative">
                    <div className="absolute w-[1px] h-full bg-slate-700/50 left-1/2" />
                    <div 
                      className={`h-full absolute ${metrics.factors.momentum >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-rose-500 right-1/2'}`}
                      style={{ width: `${Math.min(50, (Math.abs(terms.momentum) / 0.75) * 50)}%` }}
                    />
                  </div>
                </div>

                {/* Valuation */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-slate-400">Valuation (w: 0.20)</span>
                    <span className="text-slate-300 font-mono">z: {metrics.factors.valuation.toFixed(2)} | term: {terms.valuation.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden flex justify-center relative">
                    <div className="absolute w-[1px] h-full bg-slate-700/50 left-1/2" />
                    <div 
                      className={`h-full absolute ${metrics.factors.valuation >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-rose-500 right-1/2'}`}
                      style={{ width: `${Math.min(50, (Math.abs(terms.valuation) / 0.6) * 50)}%` }}
                    />
                  </div>
                </div>

                {/* Sentiment */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-slate-400">Sentiment (w: 0.15)</span>
                    <span className="text-slate-300 font-mono">z: {metrics.factors.sentiment.toFixed(2)} | term: {terms.sentiment.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden flex justify-center relative">
                    <div className="absolute w-[1px] h-full bg-slate-700/50 left-1/2" />
                    <div 
                      className={`h-full absolute ${metrics.factors.sentiment >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-rose-500 right-1/2'}`}
                      style={{ width: `${Math.min(50, (Math.abs(terms.sentiment) / 0.45) * 50)}%` }}
                    />
                  </div>
                </div>

                {/* Volatility */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-slate-400">Volatility (w: -0.10)</span>
                    <span className="text-slate-300 font-mono">z: {metrics.factors.volatility.toFixed(2)} | term: {terms.volatility.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden flex justify-center relative">
                    <div className="absolute w-[1px] h-full bg-slate-700/50 left-1/2" />
                    <div 
                      className={`h-full absolute ${terms.volatility >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-rose-500 right-1/2'}`}
                      style={{ width: `${Math.min(50, (Math.abs(terms.volatility) / 0.3) * 50)}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* AI Reasoning Trace with Citations */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-wider">AI ANALYSIS REASONING TRACE</span>
              <div className="text-[11px] text-slate-300 leading-normal font-sans bg-black/20 p-2 border border-white/5 rounded flex flex-col gap-1.5">
                {reasoning.map((sentence, idx) => {
                  const parts = sentence.split(/(`\[.*?\]`)/);
                  return (
                    <p key={idx} className="leading-relaxed">
                      {parts.map((p, pidx) => {
                        if (p.startsWith("`[") && p.endsWith("]`")) {
                          const label = p.slice(2, -2);
                          return (
                            <span 
                              key={pidx} 
                              title={`Citation source: ${label}`}
                              className="inline-block px-1 py-px bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-mono text-[8.5px] rounded mx-0.5 uppercase cursor-pointer hover:bg-indigo-500 hover:text-white transition-all font-bold"
                              onClick={() => alert(`Locating citation source: ${label}`)}
                            >
                              {label}
                            </span>
                          );
                        }
                        return p;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Precedents distribution histogram + Ensemble */}
            <div className="grid grid-cols-2 gap-3">
              {/* Precedent setups */}
              <div className="bg-[#080d19] border border-white/5 p-2 rounded flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">HISTORICAL PRECEDENTS</span>
                  <span className="text-[10px] text-slate-300 block font-sans mt-0.5">
                    <strong>5</strong> analogous setups:
                  </span>
                  <span className="text-[10.5px] font-mono text-emerald-400 font-bold block mt-1">
                    Median 30d: {metrics.precedents.median}
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500 block">
                    Range: {metrics.precedents.min} to {metrics.precedents.max}
                  </span>
                </div>
                
                {/* Micro Histogram */}
                <div className="flex items-end justify-between gap-1.5 h-6 mt-1.5 px-1 bg-black/20 rounded">
                  {metrics.precedents.values.map((v, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-indigo-500/50 hover:bg-indigo-400 transition-all rounded-t"
                      style={{ height: `${Math.max(10, Math.min(100, v))}%` }}
                      title={`Setup distribution cluster ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Model ensemble arcs */}
              <div className="bg-[#080d19] border border-white/5 p-2 rounded flex flex-col items-center justify-center relative">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block self-start absolute top-2 left-2">
                  MODEL ENSEMBLE
                </span>

                {/* Three SVG concentric arcs showing alignment */}
                <div className="w-12 h-12 mt-3 relative flex items-center justify-center">
                  <svg className="w-12 h-12 overflow-visible transform rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
                    
                    {/* Arc 1: Quant */}
                    <path 
                      d={getArcPath(50, 50, 38, arcAngles.a1, arcAngles.a1 + 45)} 
                      fill="none" 
                      stroke={getModelColor(metrics.ensemble.quant)} 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                      className="transition-all duration-500" 
                    />
                    {/* Arc 2: Sentiment */}
                    <path 
                      d={getArcPath(50, 50, 28, arcAngles.a2, arcAngles.a2 + 45)} 
                      fill="none" 
                      stroke={getModelColor(metrics.ensemble.sentiment)} 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                      className="transition-all duration-500" 
                    />
                    {/* Arc 3: Macro */}
                    <path 
                      d={getArcPath(50, 50, 18, arcAngles.a3, arcAngles.a3 + 45)} 
                      fill="none" 
                      stroke={getModelColor(metrics.ensemble.macro)} 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                      className="transition-all duration-500" 
                    />
                  </svg>
                  
                  <div className="absolute text-[8.5px] font-mono font-bold text-slate-400">
                    {metrics.ensemble.quant === metrics.ensemble.sentiment && metrics.ensemble.sentiment === metrics.ensemble.macro ? "AGREE" : "SPLAY"}
                  </div>
                </div>

                <div className="flex gap-1.5 justify-center mt-2.5 text-[6.5px] font-mono tracking-widest text-slate-500 font-bold uppercase">
                  <span style={{ color: getModelColor(metrics.ensemble.quant) }}>QNT</span>
                  <span>·</span>
                  <span style={{ color: getModelColor(metrics.ensemble.sentiment) }}>SNT</span>
                  <span>·</span>
                  <span style={{ color: getModelColor(metrics.ensemble.macro) }}>MCR</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Persistent Disclaimer */}
        <div className="flex gap-1.5 items-start bg-black/40 border border-white/5 p-2 rounded text-[8.5px] text-slate-500 font-sans leading-tight">
          <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block font-mono">⚠️ SIGNAL RISK DISCLAIMER</span>
            Signal is purely informational, not financial advice. {metrics.ensemble.confidence}% confidence computed from {whatIfScenario ? 8 : 5} variables.
          </div>
        </div>
      </div>

      {/* Scenario Simulator Side-car Drawer */}
      {whatIfOpen && (
        <div 
          className="bg-[#040815]/95 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-slate-200 w-72 select-none flex flex-col gap-3 font-sans relative"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-500/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/50" />

          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">SCENARIO SHOCK SIMULATOR</span>
            <button 
              onClick={() => {
                clearWhatIfScenario();
              }}
              className="text-slate-400 hover:text-amber-400 text-[10px] font-mono font-bold tracking-wider uppercase border border-white/5 bg-white/5 px-2 py-0.5 rounded cursor-pointer"
            >
              RESET
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {/* 5 sliders */}
            {Object.keys(baseFactors).map((k) => {
              const label = k === "macro" ? "Macro Regime" 
                          : k === "volatility" ? "Volatility Risk"
                          : k === "valuation" ? "Relative Valuation"
                          : k === "momentum" ? "Momentum Dynamics"
                          : "Social Sentiment";
              const isOverridden = whatIfScenario && whatIfScenario[k] !== undefined;
              const val = isOverridden ? whatIfScenario[k] : baseFactors[k];

              return (
                <div key={k} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10.5px] font-mono">
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isOverridden}
                        onChange={() => handleToggleFactor(k)}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={isOverridden ? "text-amber-400 font-bold" : "text-slate-400"}>
                        {label} {isOverridden ? "⚡" : ""}
                      </span>
                    </label>
                    <span className={`font-mono text-[9.5px] ${isOverridden ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                      Z: {val.toFixed(2)}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={val}
                    disabled={!isOverridden}
                    onChange={(e) => handleSliderChange(k, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </div>
              );
            })}
          </div>

          {/* Monte Carlo Simulated score band */}
          <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-1.5">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">MONTE CARLO PROJECTIONS (500 PATHS)</span>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
              <span>p5: <strong className="text-rose-400">{metrics.monteCarlo.p5}</strong></span>
              <span>p50 (Med): <strong className="text-indigo-300">{metrics.monteCarlo.p50}</strong></span>
              <span>p95: <strong className="text-emerald-400">{metrics.monteCarlo.p95}</strong></span>
            </div>
            
            {/* Visual Band */}
            <div className="relative w-full h-2.5 bg-black/40 rounded border border-white/5 overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-amber-500/10 via-amber-500/40 to-amber-500/10 border-l border-r border-amber-500/50"
                style={{ 
                  left: `${metrics.monteCarlo.p5}%`,
                  width: `${metrics.monteCarlo.p95 - metrics.monteCarlo.p5}%`
                }}
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,1)]"
                style={{ left: `${metrics.monteCarlo.p50}%` }}
              />
            </div>
            <span className="text-[7.5px] text-slate-500 font-mono leading-snug">
              Outcomes computed using Cholesky decomposition of historical covariance. Shifting sliders applies conditional overrides.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignalDesk;
