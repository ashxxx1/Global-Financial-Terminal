import { useState, useEffect, useRef, useCallback } from "react";
import useTerminalStore from "../../store/terminalStore";
import Sparkline from "../Sparkline/Sparkline";

/* ── Geopolitical risk definitions ────────────────────────────────────────── */
const GEO_RISK = {
  // HIGH RISK (red)
  UA: "high", RU: "high", IL: "high", IR: "high", IQ: "high",
  SY: "high", YE: "high", LY: "high", AF: "high", SD: "high",
  // MEDIUM RISK (yellow)
  TR: "medium", PK: "medium", BD: "medium", NG: "medium", EG: "medium",
  KZ: "medium", CO: "medium", VE: "medium", TH: "medium", MM: "medium",
  ML: "medium", SO: "medium", ET: "medium", KE: "medium", ZW: "medium",
  GH: "medium", CI: "medium",
  // LOW RISK (green) — everything else
};
function getGeoRisk(code) {
  return GEO_RISK[code] || "low";
}

/* ── Simulated live news feed ─────────────────────────────────────────────── */
function generateLiveNews(country, tick) {
  const templates = [
    { title: `${country.name} central bank signals next policy move amid ${country.sentiment === "bullish" ? "growth" : "inflation"} concerns`, source: "Reuters", category: "Monetary Policy", impact: country.sentiment === "bullish" ? "+0.4%" : "-0.3%" },
    { title: `${country.marketIndex} ${country.indexChangePct > 0 ? "extends gains" : "pulls back"} as global risk appetite ${country.sentiment === "bullish" ? "improves" : "fades"}`, source: "Bloomberg", category: "Markets", impact: country.indexChangePct > 0 ? "+0.2%" : "-0.2%" },
    { title: `Institutional inflows ${country.sentiment === "bullish" ? "surge" : "retreat"} from ${country.name} equities this session`, source: "FT", category: "Flows", impact: country.sentiment === "bullish" ? "+0.5%" : "-0.4%" },
    { title: `${country.currency} ${country.indexChangePct > 0 ? "strengthens" : "weakens"} against USD on trade balance data`, source: "CNBC", category: "Forex", impact: country.indexChangePct > 0 ? "+0.3%" : "-0.5%" },
    { title: `Analysts upgrade ${country.name} market outlook citing ${country.sentiment === "bullish" ? "strong fundamentals" : "valuation support"}`, source: "Barclays", category: "Analysis", impact: "+0.6%" },
    { title: `${country.name} GDP tracker revised ${country.sentiment === "bullish" ? "higher" : "lower"} for Q3 2026 — nowcast model signals`, source: "Goldman", category: "Economy", impact: country.sentiment === "bullish" ? "+0.8%" : "-0.6%" },
    { title: `Options activity surges in ${country.name} large-caps ahead of earnings season`, source: "WSJ", category: "Derivatives", impact: "0.0%" },
    { title: `${country.name} sovereign bond yields ${country.sentiment === "bearish" ? "spike" : "ease"} amid fiscal outlook revision`, source: "Moody's", category: "Bonds", impact: country.sentiment === "bearish" ? "-0.7%" : "+0.4%" },
  ];
  const geo = getGeoRisk(country.code);
  if (geo === "high") {
    templates.push({ title: `Geopolitical risk premium drives ${country.name} risk assets lower — hedge funds increase shorts`, source: "Reuters", category: "Geopolitics", impact: "-1.2%" });
    templates.push({ title: `${country.name} conflict situation monitored by G7 — emergency session called`, source: "AP", category: "Geopolitics", impact: "-2.1%" });
  } else if (geo === "medium") {
    templates.push({ title: `${country.name} political tensions create short-term market uncertainty — analysts say buyable`, source: "Bloomberg", category: "Geopolitics", impact: "-0.5%" });
  }
  const now = new Date();
  const minutes = now.getMinutes();
  const secs = now.getSeconds();
  const timeStr = `${minutes}m ${secs}s ago`;
  const idx = (tick + Math.floor(Math.random() * 3)) % templates.length;
  return { ...templates[idx], id: `live-${tick}`, time: timeStr, sentiment: templates[idx].impact?.startsWith("+") ? "bullish" : templates[idx].impact === "0.0%" ? "neutral" : "bearish", isLive: true };
}

/* ── Stock row component ──────────────────────────────────────────────────── */
function StockRow({ stock }) {
  const up = stock.changePct >= 0;
  return (
    <div className="stock-row">
      <div className="stock-row__left">
        <span className="stock-row__ticker">{stock.ticker}</span>
        <span className="stock-row__name">{stock.name}</span>
      </div>
      <div className="stock-row__right">
        <span className="stock-row__price">{stock.currency || ""}{typeof stock.price === "number" ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : stock.price}</span>
        <span className={`stock-row__change ${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {Math.abs(stock.changePct).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

/* ── News card component ──────────────────────────────────────────────────── */
function NewsCard({ article, showImpact = true }) {
  const isUp = article.impact?.startsWith("+");
  const isNeutral = article.impact === "0.0%";
  const sentCol = article.sentiment === "bullish" ? "var(--accent-green)" : article.sentiment === "bearish" ? "var(--accent-red)" : "var(--accent-amber)";
  return (
    <div className={`news-card ${article.sentiment}${article.isLive ? " news-card--live" : ""}`}>
      {article.isLive && <div className="news-card__live-badge">LIVE</div>}
      <div className="news-card__meta">
        <span className="news-card__category">{article.category}</span>
        <span className="news-card__source">{article.source}</span>
        <span className="news-card__time">{article.time}</span>
      </div>
      <div className="news-card__title">{article.title}</div>
      {showImpact && (
        <div className="news-card__impact-row">
          <span className="news-card__sentiment-dot" style={{ background: sentCol }} />
          <span className="news-card__sentiment-text" style={{ color: sentCol }}>
            {article.sentiment === "bullish" ? "BULLISH" : article.sentiment === "bearish" ? "BEARISH" : "NEUTRAL"}
          </span>
          {article.impact && (
            <span className={`news-card__impact ${isNeutral ? "neutral" : isUp ? "up" : "down"}`}>
              {isUp ? "▲" : isNeutral ? "◆" : "▼"} Market Impact {article.impact}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Geo risk badge ───────────────────────────────────────────────────────── */
function GeoRiskBadge({ code }) {
  const risk = getGeoRisk(code);
  const configs = {
    high:   { label: "HIGH RISK", color: "#ff2244", bg: "rgba(255,34,68,0.12)",   icon: "🔴", desc: "Active conflict / severe sanctions" },
    medium: { label: "ELEVATED",  color: "#f5a623", bg: "rgba(245,166,35,0.12)", icon: "🟡", desc: "Political tensions / instability" },
    low:    { label: "STABLE",    color: "#00e87a", bg: "rgba(0,232,122,0.12)",  icon: "🟢", desc: "Low geopolitical risk" },
  };
  const c = configs[risk];
  return (
    <div className="geo-risk-badge" style={{ background: c.bg, borderColor: c.color + "40" }}>
      <div className="geo-risk-badge__left">
        <span className="geo-risk-badge__icon">{c.icon}</span>
        <div>
          <div className="geo-risk-badge__label" style={{ color: c.color }}>GEOPOLITICAL: {c.label}</div>
          <div className="geo-risk-badge__desc">{c.desc}</div>
        </div>
      </div>
      <div className="geo-risk-badge__bar">
        <div className="geo-risk-badge__fill" style={{ width: risk === "high" ? "85%" : risk === "medium" ? "50%" : "18%", background: c.color }} />
      </div>
    </div>
  );
}

/* ── Sentiment score banner ───────────────────────────────────────────────── */
function SentimentBanner({ country }) {
  const score = Math.round(country.newsIntensity * 100);
  const s = country.sentiment;
  const col = s === "bullish" ? "var(--accent-green)" : s === "bearish" ? "var(--accent-red)" : "var(--accent-amber)";
  return (
    <div className={`sentiment-banner ${s}`}>
      <div className="sentiment-banner__title">⚡ AI SENTIMENT SCORE</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <div className="sentiment-banner__score" style={{ color: col }}>{score}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>/100</div>
        <div className="sentiment-banner__bars">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="sentiment-banner__bar" style={{ background: i < Math.round(score / 10) ? col : "rgba(255,255,255,0.07)" }} />
          ))}
        </div>
      </div>
      <div className="sentiment-banner__label">
        {s === "bullish" ? "Bullish momentum — strong institutional buying" : s === "bearish" ? "Downward pressure — caution advised" : "Mixed signals — neutral market stance"}
      </div>
    </div>
  );
}

/* ── Tab bar ──────────────────────────────────────────────────────────────── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="panel-tabs">
      {tabs.map(t => (
        <button key={t.id} className={`panel-tab${active === t.id ? " active" : ""}`} onClick={() => onChange(t.id)}>
          <span className="panel-tab__icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Main NewsPanel ───────────────────────────────────────────────────────── */
export default function NewsPanel() {
  const { selectedCountry, isNewsPanelOpen, closeNewsPanel } = useTerminalStore();
  const [tab, setTab] = useState("news");
  const [liveNews, setLiveNews] = useState([]);
  const [tick, setTick] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(60);
  const tickRef = useRef(0);

  const isUp = selectedCountry?.indexChangePct != null && selectedCountry.indexChangePct >= 0;

  // Reset on country change
  useEffect(() => {
    if (!selectedCountry) return;
    setTab("news");
    setLiveNews([]);
    setTick(0);
    tickRef.current = 0;
    setLastUpdate(new Date());
    setCountdown(60);
  }, [selectedCountry?.code]);

  // Live news every 60 seconds
  useEffect(() => {
    if (!selectedCountry) return;
    const inject = () => {
      tickRef.current += 1;
      const newItem = generateLiveNews(selectedCountry, tickRef.current);
      setLiveNews(prev => [newItem, ...prev].slice(0, 8));
      setTick(tickRef.current);
      setLastUpdate(new Date());
      setCountdown(60);
    };
    inject(); // immediate first inject
    const interval = setInterval(inject, 60000);
    return () => clearInterval(interval);
  }, [selectedCountry?.code]);

  // Countdown timer
  useEffect(() => {
    if (!isNewsPanelOpen) return;
    const timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [isNewsPanelOpen, lastUpdate]);

  const allNews = selectedCountry ? [...liveNews, ...(selectedCountry.news || [])] : [];
  const stocks = selectedCountry?.stocks || [];
  const geoRisk = selectedCountry ? getGeoRisk(selectedCountry.code) : "low";

  const tabs = [
    { id: "news",     label: "News",    icon: "📡" },
    { id: "stocks",   label: "Stocks",  icon: "📊" },
    { id: "analysis", label: "Analysis",icon: "🧠" },
  ];

  return (
    <div className={`news-panel ${isNewsPanelOpen ? "open" : ""}`}>
      {selectedCountry && (
        <>
          {/* ── Header ── */}
          <div className="news-panel__header">
            <div className="news-panel__country-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className={`news-panel__geo-dot geo-${geoRisk}`} title={`Geopolitical risk: ${geoRisk}`} />
                <div className="news-panel__country-name">{selectedCountry.name}</div>
              </div>
              <button className="news-panel__close" onClick={closeNewsPanel} aria-label="Close">✕</button>
            </div>

            <div className="news-panel__index-row">
              <div>
                <div className="news-panel__index-name">{selectedCountry.marketIndex} · {selectedCountry.currency}</div>
                <div className="news-panel__index-value">{selectedCountry.indexValue.toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span className={`news-panel__index-change ${isUp ? "up" : "down"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(selectedCountry.indexChangePct).toFixed(2)}%
                </span>
                <span style={{ fontFamily: "var(--text-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                  {isUp ? "+" : ""}{selectedCountry.indexChange?.toFixed(2)} pts
                </span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="sparkline-wrapper" style={{ padding: "10px 0 0", border: "none" }}>
              <Sparkline data={selectedCountry.sparkline} color={isUp ? "#00e87a" : "#ff2244"} width={374} height={52} />
            </div>

            {/* Live update bar */}
            <div className="news-panel__live-bar">
              <span className="news-panel__live-dot" />
              <span>LIVE FEED</span>
              <span className="news-panel__update-time">Updates in {countdown}s</span>
              <span className="news-panel__update-clock">{lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          {/* ── Tab: News ── */}
          {tab === "news" && (
            <div className="news-panel__list">
              {allNews.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--text-mono)", fontSize: 11 }}>
                  Fetching live news feed...
                </div>
              )}
              {allNews.map((article, i) => (
                <NewsCard key={article.id || i} article={article} />
              ))}
            </div>
          )}

          {/* ── Tab: Stocks ── */}
          {tab === "stocks" && (
            <div className="news-panel__list">
              <div className="stocks-header">
                <span>TICKER · COMPANY</span>
                <span>PRICE · CHANGE</span>
              </div>
              {stocks.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--text-mono)", fontSize: 11 }}>
                  No stock data available
                </div>
              ) : (
                stocks.map((s, i) => <StockRow key={i} stock={s} />)
              )}
            </div>
          )}

          {/* ── Tab: Analysis ── */}
          {tab === "analysis" && (
            <div className="news-panel__list">
              <SentimentBanner country={selectedCountry} />
              <GeoRiskBadge code={selectedCountry.code} />

              <div className="analysis-section">
                <div className="analysis-section__title">📈 MARKET IMPACT MATRIX</div>
                {allNews.filter(n => n.impact && n.impact !== "0.0%").slice(0, 5).map((n, i) => {
                  const up = n.impact?.startsWith("+");
                  return (
                    <div key={i} className="impact-row">
                      <div className="impact-row__bar-wrap">
                        <div className="impact-row__bar" style={{
                          width: `${Math.min(100, Math.abs(parseFloat(n.impact)) * 20)}%`,
                          background: up ? "var(--accent-green)" : "var(--accent-red)",
                          opacity: 0.7,
                          marginLeft: up ? "50%" : "auto",
                          marginRight: up ? "auto" : "50%",
                        }} />
                      </div>
                      <div className="impact-row__meta">
                        <span className="impact-row__cat">{n.category}</span>
                        <span className={`impact-row__val ${up ? "up" : "down"}`}>{n.impact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="analysis-section">
                <div className="analysis-section__title">🌐 MACRO INDICATORS</div>
                <div className="macro-grid">
                  {[
                    { label: "Market Index", val: selectedCountry.marketIndex },
                    { label: "Currency", val: selectedCountry.currency },
                    { label: "Today's Move", val: `${isUp ? "+" : ""}${selectedCountry.indexChangePct?.toFixed(2)}%` },
                    { label: "News Intensity", val: `${Math.round(selectedCountry.newsIntensity * 100)}/100` },
                    { label: "Geo Risk", val: geoRisk.toUpperCase() },
                    { label: "Sentiment", val: selectedCountry.sentiment?.toUpperCase() },
                  ].map((item, i) => (
                    <div key={i} className="macro-cell">
                      <div className="macro-cell__label">{item.label}</div>
                      <div className="macro-cell__val">{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
