/**
 * CountryIntel.jsx — live news → stock-signal panel for a selected country.
 *
 * Fetches real-time business news (newsService), runs the sentiment→sector→stock
 * engine (newsSignals), and renders informational signals + the driving news.
 * Auto-refreshes while mounted. INFORMATIONAL ONLY — not financial advice.
 */
import { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchCountryNews, isCountrySupported, SUPPORTED_COUNTRIES } from "../../services/newsService";
import { analyzeCountryNews } from "../../lib/newsSignals";
import { STOCKS_BY_COUNTRY } from "../../data/stocksData";

const MONO = "'JetBrains Mono', monospace";

const LABEL_COLOR = { Bullish: "#4fd1a5", Bearish: "#e06c6c", Neutral: "#c9bea3" };
const LabelIcon = ({ label }) =>
  label === "Bullish" ? <TrendingUp className="w-3 h-3" /> :
  label === "Bearish" ? <TrendingDown className="w-3 h-3" /> :
  <Minus className="w-3 h-3" />;

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em",
      color: "#5c5546", textTransform: "uppercase", marginBottom: "10px" }}>
      {children}
    </div>
  );
}

export default function CountryIntel({ iso }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const supported = isCountrySupported(iso);

  useEffect(() => {
    if (!supported) return;
    let active = true;

    async function run(showLoading) {
      if (showLoading) setLoading(true);
      const { items, live: isLive } = await fetchCountryNews(iso);
      if (!active) return;
      const stocks = STOCKS_BY_COUNTRY[iso] || [];
      setData({ analysis: analyzeCountryNews(items, stocks), news: items.slice(0, 4) });
      setLive(isLive);
      setLoading(false);
    }
    run(true);
    const t = setInterval(() => run(false), 60000); // self-refresh every 60s
    return () => { active = false; clearInterval(t); };
  }, [iso, supported]);

  if (!supported) {
    return (
      <div>
        <SectionLabel>Live News → Signals</SectionLabel>
        <div style={{ fontFamily: MONO, fontSize: "11px", color: "#7a7360", lineHeight: 1.6 }}>
          Phase 1 covers {SUPPORTED_COUNTRIES.join(", ")}. Live signals for this country
          are coming soon.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: "10px" }}>
        <SectionLabel>Live News → Signals</SectionLabel>
        <span style={{ fontFamily: MONO, fontSize: "8px", letterSpacing: "0.1em",
          color: live ? "#4fd1a5" : "#7a7360", display: "flex", alignItems: "center", gap: 4 }}>
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
          {live ? "● LIVE" : "○ SAMPLE"}
        </span>
      </div>

      {loading && !data ? (
        <div style={{ fontFamily: MONO, fontSize: "11px", color: "#7a7360" }}>Analyzing news…</div>
      ) : data ? (
        <>
          {/* Overall */}
          <div className="flex items-center gap-2" style={{ marginBottom: "12px" }}>
            <span style={{ fontFamily: MONO, fontSize: "9px", color: "#7a7360", letterSpacing: "0.1em" }}>
              OVERALL
            </span>
            <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: "12px",
              fontWeight: 700, color: LABEL_COLOR[data.analysis.overall.label] }}>
              <LabelIcon label={data.analysis.overall.label} />
              {data.analysis.overall.label}
            </span>
          </div>

          {/* Sector signals */}
          <div className="flex flex-col gap-2" style={{ marginBottom: "14px" }}>
            {data.analysis.sectorSignals.slice(0, 5).map((s) => (
              <div key={s.sector} style={{ border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: "4px", padding: "8px 10px" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: MONO, fontSize: "11px", color: "#c9bea3" }}>{s.sector}</span>
                  <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: "10px",
                    fontWeight: 700, color: LABEL_COLOR[s.label] }}>
                    <LabelIcon label={s.label} /> {s.label}
                  </span>
                </div>
                {/* confidence bar */}
                <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px",
                  margin: "6px 0", overflow: "hidden" }}>
                  <div style={{ width: `${s.confidence}%`, height: "100%",
                    background: LABEL_COLOR[s.label] }} />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: MONO, fontSize: "9px", color: "#7a7360" }}>
                    {s.affected.map((a) => a.ticker).join(" · ")}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: "9px", color: "#7a7360" }}>
                    {s.confidence}% conf
                  </span>
                </div>
                {s.drivers[0] && (
                  <div style={{ fontFamily: MONO, fontSize: "9px", color: "#5c5546",
                    marginTop: "4px", lineHeight: 1.4 }}>
                    ▸ {s.drivers[0].title}
                  </div>
                )}
              </div>
            ))}
            {data.analysis.sectorSignals.length === 0 && (
              <div style={{ fontFamily: MONO, fontSize: "10px", color: "#7a7360" }}>
                No strong sector signals from current headlines.
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{ fontFamily: MONO, fontSize: "8px", color: "#5c5546", lineHeight: 1.5,
            borderTop: "1px solid rgba(212,175,55,0.1)", paddingTop: "8px" }}>
            ⚠ {data.analysis.disclaimer}
          </div>
        </>
      ) : null}
    </div>
  );
}
