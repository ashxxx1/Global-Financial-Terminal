import { useState, useEffect, useRef } from "react";
import useTerminalStore from "../../store/terminalStore";
import Sparkline from "../Sparkline/Sparkline";
import MarketTable from "../MarketTable/MarketTable";
import AIInsights from "../AIInsights/AIInsights";
import { getLocalNewsOutlets, getLocalHeadlines, generateGeopoliticalSummary } from "./localNewsData";

const SENTIMENT_EMOJI = { bullish: "📈", bearish: "📉", neutral: "⚖️" };
const SENTIMENT_LABEL = { bullish: "BULLISH", bearish: "BEARISH", neutral: "NEUTRAL" };

function NewsCard({ article }) {
  const isUp = article.impact?.startsWith("+");
  const isNeutral = article.impact === "0.0%";
  return (
    <div className={`news-card ${article.sentiment}`}>
      <div className="news-card__meta">
        <span className="news-card__category">{article.category}</span>
        <span className="news-card__source">{article.source}</span>
        <span className="news-card__time">{article.time}</span>
      </div>
      <div className="news-card__title">{article.title}</div>
      <div className="news-card__impact-row">
        <span className={`news-card__sentiment ${article.sentiment}`}>
          {SENTIMENT_EMOJI[article.sentiment]} {SENTIMENT_LABEL[article.sentiment]}
        </span>
        {article.impact && (
          <span className={`news-card__impact ${isNeutral ? "neutral" : isUp ? "up" : "down"}`}>
            {isUp ? "▲" : isNeutral ? "◆" : "▼"} {article.impact}
          </span>
        )}
      </div>
    </div>
  );
}

function AIScoreBanner({ country }) {
  const score = Math.round((country.newsIntensity || 0.5) * 100);
  const sentiment = country.sentiment || "neutral";
  const colorMap = {
    bullish: { bg: "rgba(0,255,136,0.06)", border: "rgba(0,255,136,0.22)", text: "var(--accent-green)", label: "BULLISH MOMENTUM", desc: "Overall bullish market confidence" },
    bearish: { bg: "rgba(255,34,68,0.06)", border: "rgba(255,34,68,0.22)", text: "var(--accent-red)", label: "BEARISH PRESSURE", desc: "Downward pressure – caution advised" },
    neutral: { bg: "rgba(255,170,0,0.06)", border: "rgba(255,170,0,0.22)", text: "var(--accent-amber)", label: "NEUTRAL SIGNALS", desc: "Mixed signals – balanced outlook" },
  };
  const c = colorMap[sentiment] || colorMap.neutral;
  return (
    <div className="sentiment-banner" style={{ background: c.bg, borderColor: c.border }}>
      <div className="sentiment-banner__row">
        <div>
          <div className="sentiment-banner__title">⚡ AI SENTIMENT SCORE</div>
          <div className="sentiment-banner__label" style={{ color: c.text }}>{c.label}</div>
          <div className="sentiment-banner__desc">{c.desc}</div>
        </div>
        <div className="sentiment-banner__score" style={{ color: c.text }}>{score}</div>
      </div>
      <div className="sentiment-banner__track">
        <div className="sentiment-banner__fill" style={{ width: `${score}%`, background: c.text }} />
      </div>
    </div>
  );
}

function MarketMeta({ country }) {
  const items = [
    country.exchange && { label: "Exchange", val: country.exchange },
    country.tradingHours && { label: "Hours (Local)", val: country.tradingHours },
    { label: "Currency", val: country.currency },
    country.timezone && { label: "Timezone", val: country.timezone },
  ].filter(Boolean);

  return (
    <div className="news-panel__market-meta">
      {items.map((item) => (
        <div key={item.label} className="news-panel__meta-item">
          <span className="news-panel__meta-label">{item.label}</span>
          <span className="news-panel__meta-val">{item.val}</span>
        </div>
      ))}
    </div>
  );
}

function TypewriterSummary({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className="news-panel__geo-text">
      {displayed}
      {displayed.length < (text?.length || 0) && <span className="ai-cursor">▋</span>}
    </p>
  );
}

export default function NewsPanel() {
  const { selectedCountry, isNewsPanelOpen, closeNewsPanel } = useTerminalStore();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "geopolitical"
  const isUp = selectedCountry?.indexChangePct != null && selectedCountry.indexChangePct >= 0;

  // Reset tab on country switch
  useEffect(() => {
    setActiveTab("overview");
  }, [selectedCountry?.code]);

  if (!isNewsPanelOpen || !selectedCountry) return null;

  const localOutlets = getLocalNewsOutlets(selectedCountry.code);
  const localHeadlines = getLocalHeadlines(selectedCountry.code);
  const geoSummary = generateGeopoliticalSummary(selectedCountry.code, selectedCountry.sentiment);

  const getRiskLabel = (sentiment) => {
    if (sentiment === "bearish") return { label: "HIGH RISK", color: "var(--accent-red)" };
    if (sentiment === "bullish") return { label: "LOW RISK", color: "var(--accent-green)" };
    return { label: "STABLE", color: "var(--accent-amber)" };
  };
  const risk = getRiskLabel(selectedCountry.sentiment);

  return (
    <div className={`news-panel ${isNewsPanelOpen ? "open" : ""}`}>
      {/* Header */}
      <div className="news-panel__header">
        <div className="news-panel__country-row">
          <div>
            <div className="news-panel__country-name">{selectedCountry.name}</div>
            <div className="news-panel__country-code">
              {selectedCountry.code} · {selectedCountry.marketIndex}
            </div>
          </div>
          <button className="news-panel__close" onClick={closeNewsPanel} aria-label="Close panel">✕</button>
        </div>

        {/* Navigation Tabs */}
        <div className="news-panel__navigation">
          <button
            className={`news-panel__nav-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Market Data
          </button>
          <button
            className={`news-panel__nav-tab ${activeTab === "geopolitical" ? "active" : ""}`}
            onClick={() => setActiveTab("geopolitical")}
          >
            🧠 Geopolitical Intelligence
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="news-panel__index-row">
            <div>
              <div className="news-panel__index-name">{selectedCountry.marketIndex} · {selectedCountry.currency}</div>
              <div className="news-panel__index-value">{selectedCountry.indexValue?.toLocaleString?.() ?? selectedCountry.indexValue}</div>
            </div>
            <span className={`news-panel__index-change ${isUp ? "up" : "down"}`}>
              {isUp ? "▲" : "▼"} {Math.abs(selectedCountry.indexChangePct ?? 0).toFixed(2)}%
              &nbsp;({isUp ? "+" : ""}{(selectedCountry.indexChange ?? 0).toFixed(2)})
            </span>
          </div>
        )}
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Sparkline */}
          <div className="sparkline-wrapper">
            <div className="sparkline-label">7-Day Index Performance</div>
            <Sparkline
              data={selectedCountry.sparkline}
              color={isUp ? "#00ff88" : "#ff2244"}
              width={500}
              height={56}
            />
          </div>

          {/* Market Meta */}
          <MarketMeta country={selectedCountry} />

          {/* AI Sentiment Banner */}
          <AIScoreBanner country={selectedCountry} />

          {/* AI Market Narrative */}
          <AIInsights country={selectedCountry} />

          {/* Listed Stocks */}
          <div className="news-panel__section-title">📊 Listed Stocks · {selectedCountry.name}</div>
          <MarketTable countryCode={selectedCountry.code} />

          {/* Global News */}
          <div className="news-panel__section-title">📰 Global Market Intelligence · {selectedCountry.name}</div>
          <div className="news-panel__list">
            {(selectedCountry.news || []).map((article, i) => (
              <NewsCard key={article.id ?? i} article={article} />
            ))}
          </div>
        </>
      )}

      {/* Geopolitical Intelligence Tab Content */}
      {activeTab === "geopolitical" && (
        <div className="news-panel__geopolitical-content">
          {/* AI Geopolitical Summary Card */}
          <div className="news-panel__geo-card">
            <div className="news-panel__geo-header">
              <span className="news-panel__geo-icon">🧠</span>
              <span className="news-panel__geo-title">Local Geopolitical Risk Intelligence</span>
              <span className="news-panel__geo-risk-badge" style={{ color: risk.color, borderColor: risk.color }}>
                {risk.label}
              </span>
            </div>
            <TypewriterSummary text={geoSummary} speed={12} />
          </div>

          {/* 10 Linked Local Channels */}
          <div className="news-panel__section-title">📡 Connected National News Outlets (10 channels)</div>
          <div className="news-panel__geo-outlets-grid">
            {localOutlets.map((outlet, i) => (
              <div key={i} className="news-panel__geo-outlet-chip">
                <span className="news-panel__geo-outlet-avatar">{outlet.name[0]}</span>
                <div className="news-panel__geo-outlet-info">
                  <span className="news-panel__geo-outlet-name">{outlet.name}</span>
                  <span className="news-panel__geo-outlet-focus">{outlet.focus}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Local Press Headlines */}
          <div className="news-panel__section-title">📰 Local Press News Feed ({selectedCountry.code})</div>
          <div className="news-panel__geo-headlines-list">
            {localHeadlines.map((headline, i) => (
              <div key={i} className="news-panel__geo-headline-card">
                <div className="news-panel__geo-headline-meta">
                  <span className="news-panel__geo-headline-channel">{headline.source}</span>
                  <span className="news-panel__geo-headline-time">Recent Update</span>
                </div>
                <div className="news-panel__geo-headline-title">{headline.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
