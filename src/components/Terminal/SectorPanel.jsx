import { useState, useEffect, useRef } from "react";
import { X, Cpu, TrendingUp, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import useTerminalStore from "../../store/terminalStore";

// Typewriter summary for Sector AI synthesis
function TypewriterSummary({ text, speed = 8 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  
  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span style={{ fontSize: "11px", color: "#c9bea3", lineHeight: "1.6", fontFamily: "'JetBrains Mono', monospace" }}>
      {displayed}
      {displayed.length < (text?.length || 0) && (
        <span style={{ display: "inline-block", width: "6px", height: "12px", background: "#d4af37", marginLeft: "2px", verticalAlign: "text-bottom" }}
          className="animate-pulse">▋</span>
      )}
    </span>
  );
}

// ─── Sector Constants ──────────────────────────────────────────
const SECTOR_METRICS = {
  Technology: {
    desc: "Advanced computational systems, artificial intelligence models, cloud services, and semiconductor foundry operations.",
    performance: "+3.45%", isUp: true, indexVal: "4,821.43", vol: "18.2%",
    stocks: [
      { ticker: "AAPL", name: "Apple Inc.", price: "$212.49", change: "+2.34%", isUp: true },
      { ticker: "MSFT", name: "Microsoft Corp.", price: "$431.87", change: "+1.12%", isUp: true },
      { ticker: "NVDA", name: "Nvidia Corp.", price: "$134.25", change: "+4.67%", isUp: true },
      { ticker: "TSM", name: "TSMC", price: "$172.50", change: "+3.85%", isUp: true },
      { ticker: "ASML", name: "ASML Holding", price: "$924.10", change: "+1.95%", isUp: true }
    ],
    aiSummary: "AI training infrastructure spend remains robust, offsetting consumer device sales consolidation. Regulatory scrutiny on antitrust/agent liability represents a medium-term multiple compression risk."
  },
  Energy: {
    desc: "Global hydrocarbon exploration, drilling, production, refining, and renewable transmission channels.",
    performance: "-0.78%", isUp: false, indexVal: "2,143.55", vol: "24.5%",
    stocks: [
      { ticker: "XOM", name: "ExxonMobil Corp.", price: "$114.50", change: "+0.45%", isUp: true },
      { ticker: "CVX", name: "Chevron Corp.", price: "$152.12", change: "-0.92%", isUp: false },
      { ticker: "SHEL", name: "Shell plc", price: "$72.40", change: "-1.10%", isUp: false },
      { ticker: "TTE", name: "TotalEnergies SE", price: "$68.20", change: "-0.35%", isUp: false }
    ],
    aiSummary: "Output restrictions from OPEC+ are providing a structural floor for crude futures, though slowing industrial demand in Germany and China poses downstream margin compression risk."
  },
  Financials: {
    desc: "Tier 1 investment banks, commercial banking institutions, asset management, and payment processing nodes.",
    performance: "+1.12%", isUp: true, indexVal: "3,489.20", vol: "14.8%",
    stocks: [
      { ticker: "JPM", name: "JPMorgan Chase & Co.", price: "$198.45", change: "+1.40%", isUp: true },
      { ticker: "BAC", name: "Bank of America Corp.", price: "$39.20", change: "+0.85%", isUp: true },
      { ticker: "GS", name: "Goldman Sachs Group", price: "$462.10", change: "+1.85%", isUp: true },
      { ticker: "HSBA", name: "HSBC Holdings", price: "$680.50", change: "-0.22%", isUp: false }
    ],
    aiSummary: "Net interest margins are stabilizing near cyclical peaks. Institutional credit exposure remains clean, though real estate LTV ratios are being monitored closely."
  },
  Healthcare: {
    desc: "Pharmaceutical research, molecular biology, clinical pipelines, and medical provider equipment.",
    performance: "+0.42%", isUp: true, indexVal: "1,894.12", vol: "12.4%",
    stocks: [
      { ticker: "LLY", name: "Eli Lilly & Co.", price: "$892.40", change: "+1.50%", isUp: true },
      { ticker: "NVO", name: "Novo Nordisk A/S", price: "$138.10", change: "+0.85%", isUp: true },
      { ticker: "JNJ", name: "Johnson & Johnson", price: "$156.45", change: "-0.32%", isUp: false },
      { ticker: "PFE", name: "Pfizer Inc.", price: "$28.15", change: "-0.95%", isUp: false }
    ],
    aiSummary: "Global peptide/GLP-1 manufacturing capacity buildout is acting as a major capital efficiency catalyst. Pipeline drug trial approvals are meeting timelines."
  },
  Consumer: {
    desc: "Discretionary retail channels, automotive manufacturers, travel operators, and household goods consumption.",
    performance: "-1.24%", isUp: false, indexVal: "2,842.11", vol: "16.5%",
    stocks: [
      { ticker: "AMZN", name: "Amazon.com Inc.", price: "$182.10", change: "+1.15%", isUp: true },
      { ticker: "TSLA", name: "Tesla Inc.", price: "$177.46", change: "-2.84%", isUp: false },
      { ticker: "WMT", name: "Walmart Inc.", price: "$68.45", change: "+0.45%", isUp: true },
      { ticker: "TM", name: "Toyota Motor Corp.", price: "$224.50", change: "-1.85%", isUp: false }
    ],
    aiSummary: "Real disposable income contraction is leading to household spending adjustments. High tariff structures on EV imports are introducing supply margin variances."
  },
  Industrials: {
    desc: "Factory automation engineering, precision machining, transport logistics, and aerospace defense hardware.",
    performance: "+0.89%", isUp: true, indexVal: "4,124.55", vol: "13.9%",
    stocks: [
      { ticker: "GE", name: "General Electric Co.", price: "$158.45", change: "+1.20%", isUp: true },
      { ticker: "CAT", name: "Caterpillar Inc.", price: "$342.10", change: "+0.95%", isUp: true },
      { ticker: "HON", name: "Honeywell Intl.", price: "$202.15", change: "-0.42%", isUp: false },
      { ticker: "LMT", name: "Lockheed Martin Corp.", price: "$465.80", change: "+2.10%", isUp: true }
    ],
    aiSummary: "Defense allocations are providing long-term structural backlogs. Capital expenditure on automated factory infrastructure offsets soft global logistics demand."
  },
  Materials: {
    desc: "Industrial metallurgy, lithium extraction, mining, chemical fertilizers, and paper/packaging materials.",
    performance: "-0.45%", isUp: false, indexVal: "1,432.10", vol: "20.8%",
    stocks: [
      { ticker: "BHP", name: "BHP Group Ltd.", price: "$58.20", change: "-0.85%", isUp: false },
      { ticker: "FCX", name: "Freeport-McMoRan", price: "$48.15", change: "+1.10%", isUp: true },
      { ticker: "RIO", name: "Rio Tinto Group", price: "$64.50", change: "-1.25%", isUp: false },
      { ticker: "VALE", name: "Vale SA", price: "$12.10", change: "-0.95%", isUp: false }
    ],
    aiSummary: "Weakness in Chinese residential real estate demand is putting pressure on iron ore contracts, though structural copper deficits are maintaining strong pricing margins."
  },
  "Real Estate": {
    desc: "Commercial office trusts, residential housing portfolios, and logistics/data center property REITs.",
    performance: "-2.10%", isUp: false, indexVal: "894.22", vol: "26.4%",
    stocks: [
      { ticker: "PLD", name: "Prologis Inc.", price: "$112.45", change: "-1.85%", isUp: false },
      { ticker: "AMT", name: "American Tower Corp.", price: "$188.10", change: "-2.10%", isUp: false },
      { ticker: "EQIX", name: "Equinix Inc.", price: "$742.50", change: "+0.45%", isUp: true },
      { ticker: "O", name: "Realty Income Corp.", price: "$52.40", change: "-0.85%", isUp: false }
    ],
    aiSummary: "High baseline central bank interest rates continue to suppress valuations. Refinancing obligations over the next 18 months present minor balance sheet risks."
  }
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Fraunces', Georgia, serif";
const BRASS = "#d4af37";
const HAIRLINE = "rgba(212,175,55,0.14)";

function SectionLabel({ children }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: "8px", fontWeight: 700,
      letterSpacing: "0.2em", color: "#5c5546",
      textTransform: "uppercase", display: "block", marginBottom: "8px",
    }}>
      {children}
    </span>
  );
}

export function SectorPanel() {
  const { selectedSector, setSelectedSector, intelligenceEvents, setSelectedStock } = useTerminalStore();

  if (!selectedSector) return null;

  const sectorData = SECTOR_METRICS[selectedSector] || {
    desc: `${selectedSector} global operations and financial trackers.`,
    performance: "0.00%", isUp: true, indexVal: "1,000.00", vol: "15.0%",
    stocks: [],
    aiSummary: "No recent sector adjustments reported. Broad indices trading within normal distributions."
  };

  // Filter intelligence events matching this sector
  const relatedEvents = (intelligenceEvents || []).filter(e => {
    const combined = `${e.title} ${e.summary} ${e.category}`.toLowerCase();
    return combined.includes(selectedSector.toLowerCase());
  });

  return (
    <div 
      className="absolute inset-0 bg-[#020617]/98 backdrop-blur-md z-45 flex flex-col border border-[#1e293b] rounded-lg p-6 overflow-hidden select-none"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]/35" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#d4af37]/35" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#d4af37]/35" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#d4af37]/35" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-[#d4af37]/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] font-mono text-xs font-bold">
            SEC
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase font-bold">Sector Intelligence Hub</span>
            <h2 className="text-[15px] font-bold text-slate-100 uppercase tracking-wider">
              {selectedSector} Global Sector View
            </h2>
          </div>
        </div>
        <button 
          onClick={() => setSelectedSector(null)}
          className="px-3 py-1.5 border border-[#1e293b] bg-[#0c1220] hover:bg-rose-500/10 hover:border-rose-500/30 text-[10px] font-bold tracking-widest uppercase rounded cursor-pointer transition-colors text-slate-400 hover:text-rose-400 flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          CLOSE PANEL
        </button>
      </div>

      {/* Split Body */}
      <div className="flex-1 min-h-0 flex gap-6 overflow-y-auto pr-1">
        
        {/* Left Column: Overview, Metrics & Equities */}
        <div className="w-5/12 flex flex-col gap-5">
          {/* Description */}
          <div className="p-4 bg-[#0a0f1d] border border-white/5 rounded relative">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">SECTOR SCOPE</span>
            <p className="text-[12px] text-slate-300 mt-1 leading-relaxed">{sectorData.desc}</p>
          </div>

          {/* Indicators Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5 p-3 rounded bg-white/[0.015]" style={{ border: `1px solid ${HAIRLINE}` }}>
              <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546" }}>SECTOR INDEX</span>
              <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, color: "#cbd5e1" }}>{sectorData.indexVal}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-3 rounded bg-white/[0.015]" style={{ border: `1px solid ${HAIRLINE}` }}>
              <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546" }}>PERFORMANCE</span>
              <span className="flex items-center gap-1 font-mono text-xs font-bold" style={{ color: sectorData.isUp ? "#4fd1a5" : "#e8635a" }}>
                {sectorData.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {sectorData.performance}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-3 rounded bg-white/[0.015]" style={{ border: `1px solid ${HAIRLINE}` }}>
              <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: "#5c5546" }}>VOLATILITY (VIX)</span>
              <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, color: BRASS }}>{sectorData.vol}</span>
            </div>
          </div>

          {/* Key Public Equities */}
          <div>
            <SectionLabel>Global Sector Equities</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {sectorData.stocks.map((stock, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedStock({
                      symbol: stock.ticker,
                      name: stock.name,
                      price: parseFloat(stock.price.replace("$", "")),
                      changePct: parseFloat(stock.change.replace("%", "")),
                      sector: selectedSector,
                      country: "US"
                    });
                    setSelectedSector(null);
                  }}
                  className="flex justify-between items-center p-2.5 rounded bg-[#0a0f1d] hover:bg-[#d4af37]/4 border border-white/5 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: stock.isUp ? "#4fd1a5" : "#e8635a" }} />
                    <span className="font-mono text-[11px] font-bold text-slate-200">{stock.ticker}</span>
                    <span className="text-[10px] text-slate-400 font-medium ml-1">{stock.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-300">{stock.price}</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: stock.isUp ? "#4fd1a5" : "#e8635a" }}>
                      {stock.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Synthesis & Sector News */}
        <div className="w-7/12 flex flex-col gap-5 border-l border-white/5 pl-5">
          {/* AI Synthesis */}
          <div>
            <SectionLabel>AI Sector Synthesis</SectionLabel>
            <div className="relative overflow-hidden p-4 rounded bg-[#0a0f1d] border border-[#d4af37]/25 flex flex-col gap-2">
              <div className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: `linear-gradient(180deg, ${BRASS}, transparent)` }} />
              
              <div className="flex items-center gap-2 mb-1 pl-1">
                <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: BRASS }} />
                <span style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#a89c84" }}>
                  EXTRACTING SECTOR REGIME SHIFTS
                </span>
              </div>

              <div className="pl-1">
                <TypewriterSummary text={sectorData.aiSummary} />
              </div>
            </div>
          </div>

          {/* Sector News */}
          <div className="flex-1 min-h-0 flex flex-col">
            <SectionLabel>Related Sector News Feed</SectionLabel>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {relatedEvents.length === 0 ? (
                <div className="text-[10px] text-[#6b6354] font-mono py-12 text-center border border-dashed border-[#1e293b] rounded">
                  No active macro news triggers tag this sector.
                </div>
              ) : (
                relatedEvents.map(evt => {
                  const sentColor = evt.sentimentLabel === "Bullish" ? "#4fd1a5" : evt.sentimentLabel === "Bearish" ? "#e8635a" : "#d4af37";
                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded flex flex-col gap-1.5 bg-[#0a0f1d] border border-white/5 hover:border-[#d4af37]/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider"
                          style={{ background: `${sentColor}18`, color: sentColor, border: `1px solid ${sentColor}35` }}>
                          {evt.category} · {evt.sentimentLabel.toUpperCase()}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: "8px", color: "#5c5546" }}>
                          {evt.time}
                        </span>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "#c9bea3", lineHeight: "1.45", fontWeight: 600 }}>
                        {evt.title}
                      </span>
                      <p style={{ fontSize: "10px", color: "#6b6354", lineHeight: "1.4" }}>
                        {evt.summary}
                      </p>
                      <div className="flex items-center justify-between mt-0.5 text-[8px] font-mono text-[#5c5546]">
                        <span>SOURCE: {evt.source}</span>
                        <span>CONFIDENCE {evt.confidence}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SectorPanel;
