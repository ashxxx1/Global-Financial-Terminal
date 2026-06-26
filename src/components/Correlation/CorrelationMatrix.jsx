import { useState, useMemo } from "react";
import { getContagionMatrix } from "../../lib/quantFeed";

const COUNTRY_INFO = {
  US: { name: "United States", flag: "🇺🇸" },
  DE: { name: "Germany", flag: "🇩🇪" },
  JP: { name: "Japan", flag: "🇯🇵" },
  CN: { name: "China", flag: "🇨🇳" },
  IN: { name: "India", flag: "🇮🇳" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  FR: { name: "France", flag: "🇫🇷" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  ZA: { name: "South Africa", flag: "🇿🇦" },
  CA: { name: "Canada", flag: "🇨🇦" }
};

function corrColor(v) {
  if (v >= 0.7) return "rgba(16, 185, 129, 0.9)"; // Strong Positive Green
  if (v >= 0.4) return "rgba(16, 185, 129, 0.5)"; // Moderate Positive
  if (v >= 0.1) return "rgba(16, 185, 129, 0.2)"; // Weak Positive
  if (v >= -0.1) return "rgba(148, 163, 184, 0.1)"; // Neutral grey
  if (v >= -0.4) return "rgba(239, 68, 68, 0.2)"; // Weak Negative
  if (v >= -0.7) return "rgba(239, 68, 68, 0.5)"; // Moderate Negative
  return "rgba(239, 68, 68, 0.9)"; // Strong Negative Red
}

function corrTextColor(v) {
  return Math.abs(v) > 0.4 ? "#fff" : "#cbd5e1";
}

export default function CorrelationMatrix({ onClose }) {
  const [countries, setCountries] = useState(["US", "DE", "JP", "CN", "IN", "GB", "FR", "BR", "ZA", "CA"]);
  const [hoveredCell, setHoveredCell] = useState(null);

  const { matrix, betas } = useMemo(() => {
    return getContagionMatrix(countries);
  }, [countries]);

  const removeCountry = (iso) => setCountries((list) => list.filter((x) => x !== iso));

  return (
    <div className="correlation-matrix bg-[#020617]/95 border border-[#1e293b] rounded-xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-full overflow-hidden select-none">
      <div className="correlation-matrix__header flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <div className="correlation-matrix__title text-slate-100 text-sm font-bold tracking-widest font-mono">🔍 Cross-Country Contagion Matrix</div>
          <div className="correlation-matrix__subtitle text-xs text-slate-500 font-sans mt-0.5">Pearson correlation across synthetic country return series · Beta vs US benchmark</div>
        </div>
        <button className="correlation-matrix__close text-slate-400 hover:text-white text-xs font-mono font-bold tracking-wider uppercase border border-white/5 bg-white/5 px-2 py-0.5 rounded cursor-pointer" onClick={onClose}>✕</button>
      </div>

      <div className="correlation-matrix__legend mt-3.5 flex justify-between items-center">
        <div className="correlation-matrix__legend-scale flex gap-1">
          {[-1, -0.7, -0.4, 0, 0.4, 0.7, 1].map((v) => (
            <div key={v} className="correlation-matrix__legend-item w-10 py-1 text-center rounded text-[9px] font-bold font-mono" style={{ background: corrColor(v), color: corrTextColor(v) }}>
              {v.toFixed(1)}
            </div>
          ))}
        </div>
        <span className="correlation-matrix__legend-label text-[10px] font-mono text-slate-500 uppercase tracking-widest">Pearson Correlation</span>
      </div>

      <div className="correlation-matrix__table-wrap mt-4 overflow-x-auto rounded-lg border border-white/5 bg-black/20">
        <table className="correlation-matrix__table w-full border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="correlation-matrix__corner text-left p-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Country</th>
              {countries.map((iso) => (
                <th key={iso} className="correlation-matrix__col-header p-3 text-center min-w-[70px] text-[10.5px] font-bold font-mono text-slate-300 relative group">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{COUNTRY_INFO[iso]?.flag || "🏳️"}</span>
                    <span>{iso}</span>
                  </div>
                  <button className="correlation-matrix__remove-col absolute top-1.5 right-1.5 hidden group-hover:block text-slate-500 hover:text-rose-400 cursor-pointer font-bold text-xs" onClick={() => removeCountry(iso)} title="Remove">×</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((iso, ri) => {
              const info = COUNTRY_INFO[iso];
              const betaVal = betas[ri] ?? 1.0;
              return (
                <tr key={iso} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="correlation-matrix__row-header p-3 text-left min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{info?.flag || "🏳️"}</span>
                      <div>
                        <div className="correlation-matrix__row-sym text-[11px] font-mono font-bold text-slate-200">{info?.name || iso}</div>
                        <div className="correlation-matrix__row-name text-[8.5px] font-mono font-bold text-indigo-400">Beta vs US: {betaVal.toFixed(2)}</div>
                      </div>
                    </div>
                  </td>
                  {matrix[ri].map((val, ci) => {
                    const isHovered = hoveredCell && (hoveredCell.r === ri || hoveredCell.c === ci);
                    const isSelf = ri === ci;
                    return (
                      <td
                        key={ci}
                        className={`correlation-matrix__cell p-3 text-center transition-all ${isSelf ? "self font-bold" : ""} ${isHovered ? "bg-white/10" : ""}`}
                        style={{ background: corrColor(val) }}
                        onMouseEnter={() => setHoveredCell({ r: ri, c: ci, val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${info?.name} vs ${COUNTRY_INFO[countries[ci]]?.name}: r = ${val.toFixed(3)}`}
                      >
                        <span className="text-[11px] font-mono font-bold" style={{ color: corrTextColor(val) }}>
                          {val.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hoveredCell && hoveredCell.r !== hoveredCell.c && (
        <div className="correlation-matrix__info-bar mt-3.5 bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center gap-3 text-xs font-mono">
          <span className="correlation-matrix__info-pair text-slate-200 font-bold">
            {COUNTRY_INFO[countries[hoveredCell.r]]?.name} ({countries[hoveredCell.r]}) × {COUNTRY_INFO[countries[hoveredCell.c]]?.name} ({countries[hoveredCell.c]})
          </span>
          <span className="correlation-matrix__info-val font-bold" style={{ color: corrColor(hoveredCell.val) }}>
            r = {hoveredCell.val.toFixed(3)}
          </span>
          <span className="correlation-matrix__info-desc text-slate-500">
            {hoveredCell.val >= 0.7 ? "Strong positive correlation"
              : hoveredCell.val >= 0.4 ? "Moderate positive correlation"
              : hoveredCell.val >= -0.1 ? "No significant correlation"
              : hoveredCell.val >= -0.4 ? "Moderate negative correlation"
              : "Strong negative correlation"}
          </span>
        </div>
      )}

      <div className="correlation-matrix__note mt-3.5 text-[9px] font-sans text-slate-500">
        📌Pearson correlation calculated using 500-day log returns generated per country with unique seeds and drift/volatility parameters.
      </div>
    </div>
  );
}
