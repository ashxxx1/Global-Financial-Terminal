import useTerminalStore from "../../store/terminalStore";
import Sparkline from "../Sparkline/Sparkline";
import MarketTable from "../MarketTable/MarketTable";

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

export default function NewsPanel() {
  const { selectedCountry, isNewsPanelOpen, closeNewsPanel } = useTerminalStore();
  const isUp = selectedCountry?.indexChangePct != null && selectedCountry.indexChangePct >= 0;

  return (
    <div className={`news-panel ${isNewsPanelOpen ? "open" : ""}`}>
      {selectedCountry && (
        <>
          {/* ── Header ── */}
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
          </div>

          {/* ── Sparkline ── */}
          <div className="sparkline-wrapper">
            <div className="sparkline-label">7-Day Index Performance</div>
            <Sparkline
              data={selectedCountry.sparkline}
              color={isUp ? "#00ff88" : "#ff2244"}
              width={500}
              height={56}
            />
          </div>

          {/* ── Market Meta ── */}
          <MarketMeta country={selectedCountry} />

          {/* ── AI Sentiment Banner ── */}
          <AIScoreBanner country={selectedCountry} />

          {/* ── Listed Stocks ── */}
          <div className="news-panel__section-title">📊 Listed Stocks · {selectedCountry.name}</div>
          <MarketTable countryCode={selectedCountry.code} />

          {/* ── News ── */}
          <div className="news-panel__section-title">📰 Market Intelligence · {selectedCountry.name}</div>
          <div className="news-panel__list">
            {(selectedCountry.news || []).map((article, i) => (
              <NewsCard key={article.id ?? i} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
