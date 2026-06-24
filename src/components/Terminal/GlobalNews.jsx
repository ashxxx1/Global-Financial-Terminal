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
    <div className="absolute inset-0 bg-transparent flex flex-col pt-3 px-5 pb-2 z-10 shrink-0 border-[#1e293b]">
      <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-4">
            <h2 className="text-[12px] font-bold tracking-widest text-slate-300">ORDER FLOW & INTEL STRIP</h2>
            
            {!isCollapsed && (
              <div className="flex items-center gap-2 ml-6">
                {['All', 'Financial', 'Geopolitics', 'Technology', 'Energy'].map(f => {
                  const Icon = filterIcons[f] || Filter;
                  return (
                    <button 
                      key={f} 
                      onClick={() => { setFilter(f); setPage(1); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        filter === f ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                      }`}
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
            <div key={news.id} className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-colors group">
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
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">{news.type}</span>
                        <span className="text-[11px] font-mono text-slate-500">{news.time} • {news.source}</span>
                     </div>
                     <h3 className="text-[13px] font-bold text-slate-200 group-hover:text-white transition-colors">{news.title}</h3>
                  </div>
               </div>
               <button 
                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-widest px-4 py-2 border border-[#1e293b]/50 rounded transition-colors bg-[#0c1220]/60 group-hover:bg-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
                  onClick={() => alert(`Details for: ${news.title}`)}
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
    </div>
  );
}
export default GlobalNews;
