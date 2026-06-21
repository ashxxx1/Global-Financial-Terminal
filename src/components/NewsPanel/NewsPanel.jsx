import useTerminalStore from "../../store/terminalStore";
import Sparkline from "../Sparkline/Sparkline";
import MarketTable from "../MarketTable/MarketTable";

const SENTIMENT_EMOJI = { bullish: "📈", bearish: "📉", neutral: "⚖" };
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
  const score = Math.round(country.newsIntensity * 100);
  const sentiment = country.sentiment;
  return (
    <div className={`sentiment-banner ${sentiment}`}>
      <div className="sentiment-banner__title">⚡ AI Market Sentiment Score</div>
      <div className="sentiment-banner__score">{score}/100</div>
      <div className="sentiment-banner__label">
        {sentiment === "bullish"
          ? "Overall bullish momentum — market confidence high"
          : sentiment === "bearish"
            ? "Downward pressure — caution advised"
            : "Mixed signals — neutral outlook"}
      </div>
    </div>
  );
}

function MarketMeta({ country }) {
  return (
    <div className="news-panel__market-meta">
      {country.exchange && (
        <div className="news-panel__meta-item">
          <span className="news-panel__meta-label">Exchange</span>
          <span className="news-panel__meta-val">{country.exchange}</span>
        </div>
      )}
      {country.tradingHours && (
        <div className="news-panel__meta-item">
          <span className="news-panel__meta-label">Hours</span>
          <span className="news-panel__meta-val">{country.tradingHours}</span>
        </div>
      )}
      <div className="news-panel__meta-item">
        <span className="news-panel__meta-label">Currency</span>
        <span className="news-panel__meta-val">{country.currency}</span>
      </div>
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
                <div className="news-panel__index-name">
                  {selectedCountry.marketIndex} · {selectedCountry.currency}
                </div>
                <div className="news-panel__index-value">
                  {selectedCountry.indexValue.toLocaleString()}
                </div>
              </div>
              <span className={`news-panel__index-change ${isUp ? "up" : "down"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(selectedCountry.indexChangePct).toFixed(2)}%
                &nbsp;({isUp ? "+" : ""}{selectedCountry.indexChange.toFixed(2)})
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
              height={60}
            />
          </div>

          {/* ── Market Meta ── */}
          <MarketMeta country={selectedCountry} />

          {/* ── AI Sentiment ── */}
          <AIScoreBanner country={selectedCountry} />

          {/* ── Stocks Table ── */}
          <div className="news-panel__section-title">Listed Stocks · {selectedCountry.name}</div>
          <MarketTable countryCode={selectedCountry.code} />

          {/* ── News ── */}
          <div className="news-panel__section-title">Market Intelligence · {selectedCountry.name}</div>
          <div className="news-panel__list">
            {selectedCountry.news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
