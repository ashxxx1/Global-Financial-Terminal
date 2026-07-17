import { useState } from 'react';
import { Filter, ChevronLeft, ChevronRight, Globe, TrendingUp, ShieldAlert, Cpu } from 'lucide-react';

const newsSources = [
  'Market Wire', 'Global Macro Desk', 'Macro Wire', 'Capital Feed',
  'Trade Flow Intel', 'FX Monitor', 'Commodity Desk', 'Credit Monitor'
];

const mockNews = Array.from({ length: 50 }, (_, i) => {
  const types = ['Financial', 'Geopolitics', 'Technology', 'Energy'];
  const type = types[i % 4];
  let priority = i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW';
  const title = type === 'Financial' ? `Global Markets React to New Interest Rate Policies in Region ${i+1}`
    : type === 'Geopolitics' ? `Diplomatic Tensions Rise Over Trade Tariffs Announcement ${i+1}`
    : type === 'Technology' ? `New Autonomous AI Framework Disclosures Impact Semiconductor Stocks ${i+1}`
    : `OPEC+ Consortium Discusses Output Adjustments for Next Quarter ${i+1}`;

  return {
    id: i,
    title,
    type,
    priority,
    time: `${Math.floor(i * 0.5 + 1)}h ago`,
    source: newsSources[i % newsSources.length]
  };
});

export function GlobalNews({ isCollapsed = false, onToggle }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('All');
  const [activeNews, setActiveNews] = useState(null);
  const itemsPerPage = 5;

  const filteredNews = mockNews.filter(n => filter === 'All' || n.type === filter);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const currentNews = filteredNews.slice(startIdx, startIdx + itemsPerPage);

  const filterIcons = {
    'All': Globe,
    'Financial': TrendingUp,
    'Geopolitics': ShieldAlert,
    'Technology': Cpu
  };

  return (
    <div className="absolute inset-0 bg-transparent flex flex-col pt-3 px-5 pb-2 z-10 shrink-0" style={{ borderColor: "var(--nx-border)" }}>
      <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-4">
            <h2 className="nx-section-head">Event Wire</h2>
            
            {!isCollapsed && (
              <div className="flex items-center gap-2 ml-6">
                {['All', 'Financial', 'Geopolitics', 'Technology', 'Energy'].map(f => {
                  const Icon = filterIcons[f] || Filter;
                  return (
                    <button 
                      key={f} 
                      onClick={() => { setFilter(f); setPage(1); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                        filter === f
                          ? "text-[var(--nx-cyan)] border border-[var(--nx-border-strong)] bg-[rgba(63, 211, 232,0.08)]"
                          : "text-[rgba(255,255,255,0.4)] border border-[var(--nx-border)] hover:text-[var(--nx-cyan)]"
                      }`}
                      style={{ fontFamily: "var(--nx-font-mono)", borderRadius: "2px", letterSpacing: "0.08em" }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {f.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            )}
         </div>
         
         <div className="flex items-center gap-4">
            {!isCollapsed && (
              <>
                <span className="text-[11px] font-bold tracking-wider text-slate-400">PAGE {page} OF {totalPages || 1}</span>
                <div className="flex items-center gap-2">
                   <button 
                     disabled={page === 1}
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     className="p-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                     aria-label="Previous Page"
                   >
                     <ChevronLeft className="w-4 h-4" />
                   </button>
                   <button 
                     disabled={page === totalPages || totalPages === 0}
                     onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                     className="p-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                     aria-label="Next Page"
                   >
                     <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </>
            )}

            {onToggle && (
              <button 
                onClick={onToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-[10px] font-bold font-mono transition-all cursor-pointer"
                title={isCollapsed ? "Expand Feed" : "Collapse Feed"}
              >
                {isCollapsed ? "EXPAND ▲" : "COLLAPSE ▼"}
              </button>
            )}
         </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1e293b]">
          {currentNews.map((news) => (
            <div key={news.id} className="flex items-center justify-between p-3 group transition-colors" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--nx-border)", borderRadius: "2px" }}>
               <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded bg-slate-900 border ${
                     news.priority === 'HIGH' ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 
                     news.priority === 'MEDIUM' ? 'border-amber-500/50' : 'border-slate-700'
                  }`}>
                     <span className={`text-[10px] font-bold tracking-wider ${
                        news.priority === 'HIGH' ? 'text-rose-500' : 
                        news.priority === 'MEDIUM' ? 'text-amber-500' : 'text-slate-400'
                     }`}>
                       {news.priority.substring(0,3)}
                     </span>
                  </div>
                  <div className="flex flex-col">
                     <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest" style={{ fontFamily: "var(--nx-font-mono)", color: "var(--nx-cyan)", background: "rgba(63, 211, 232,0.08)", border: "1px solid var(--nx-border)", borderRadius: "2px" }}>{news.type}</span>
                        <span className="text-[11px] font-mono text-slate-500">{news.time} • {news.source}</span>
                     </div>
                     <h3 className="text-[13px] font-bold text-slate-200 group-hover:text-white transition-colors">{news.title}</h3>
                  </div>
               </div>
               <button 
                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-widest px-4 py-2 border border-[#1e293b]/50 rounded transition-colors bg-[#0c1220]/60 group-hover:bg-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setActiveNews(news)}
               >
                 <TrendingUp className="w-3.5 h-3.5" />
                 ANALYZE
               </button>
            </div>
          ))}
          {currentNews.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-mono text-[12px] tracking-wider">
               NO DATA IN FEED FOR SELECTED FILTER
            </div>
          )}
        </div>
      )}
      {activeNews && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setActiveNews(null)}
        >
          <div 
            className="w-full max-w-[480px] overflow-hidden text-left relative" 
            style={{
              background: "rgba(5,7,13,0.99)",
              border: "1px solid rgba(245, 177, 61,0.35)",
              borderRadius: "4px",
              boxShadow: "0 0 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(245, 177, 61,0.08), inset 0 1px 0 rgba(245, 177, 61,0.12)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Corner accents */}
            {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r",
              "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((cls, i) => (
              <div key={i} className={`absolute w-3 h-3 ${cls}`}
                style={{ borderColor: "rgba(245, 177, 61,0.5)" }} />
            ))}

            {/* Header */}
            <div 
              className="flex justify-between items-center px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(245, 177, 61,0.12)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f5b13d", boxShadow: "0 0 6px #f5b13d" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.2em", color: "#f5b13d",
                }}>
                  QUANT RECONNAISSANCE DESK
                </span>
              </div>
              <button 
                onClick={() => setActiveNews(null)}
                className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="font-sans text-xs font-bold text-[#f5b13d]">✕</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 flex flex-col gap-4 font-mono">
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "1px 5px", borderRadius: "2px",
                  background: "rgba(245, 177, 61,0.1)",
                  border: "1px solid rgba(245, 177, 61,0.3)",
                  color: "#f5b13d",
                  textTransform: "uppercase",
                }}>
                  {activeNews.type}
                </span>
                <span className="text-[11px] text-slate-500">{activeNews.time} • {activeNews.source}</span>
              </div>
              
              <h3 
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: "italic", fontSize: "15px",
                  fontWeight: 500, color: "#f0e6d2",
                  lineHeight: "1.4",
                }}
              >
                {activeNews.title}
              </h3>
              
              <div 
                className="p-3 rounded text-[11.5px] leading-relaxed"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: "#c9bea3",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Quantitative tracking analysis reveals a confidence metric of 92% for the reported sector changes. Strategic sentiment models indicate moderate vector shifts across secondary trade routes and domestic consumer groups.
              </div>
              
              {/* Decorative Grid Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div 
                  className="p-2.5 rounded flex flex-col gap-0.5"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#5c5546" }}>TRANSMISSION</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: "#46d38a" }}>ACTIVE</span>
                </div>
                <div 
                  className="p-2.5 rounded flex flex-col gap-0.5"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em", color: "#5c5546" }}>SIGNAL SECURITY</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: "#f5b13d" }}>92% SECURE</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div 
              className="p-4 flex justify-end"
              style={{ borderTop: "1px solid rgba(245, 177, 61,0.08)" }}
            >
              <button 
                onClick={() => setActiveNews(null)}
                className="px-4 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "rgba(245, 177, 61,0.1)",
                  border: "1px solid rgba(245, 177, 61,0.3)",
                  color: "#f5b13d",
                  letterSpacing: "0.08em",
                }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default GlobalNews;
