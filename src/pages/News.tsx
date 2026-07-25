/**
 * News.tsx — Global News Wire
 *
 * Bloomberg-terminal aesthetic with auto-refreshing live news.
 * Features: hero breaking story, category filters, sentiment badges,
 * article source links, auto-refresh countdown, smooth stagger animations.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchGlobalNews,
  fetchBreakingNews,
  clearNewsCache,
  timeAgo,
  type LiveArticle,
} from "../lib/newsFeed";
import { globalNews, type Article } from "../lib/news";
import SourceBadge from "../components/SourceBadge";

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = ["ALL", "MARKETS", "ECONOMY", "BUSINESS", "TECHNOLOGY", "ENERGY", "GOVERNMENT"] as const;
type Category = (typeof CATEGORIES)[number];

const SENTIMENTS = ["ALL", "BULLISH", "BEARISH", "HIGH IMPACT"] as const;
type SentimentFilter = (typeof SENTIMENTS)[number];

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */

export default function News() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<LiveArticle[]>([]);
  const [breaking, setBreaking] = useState<LiveArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [category, setCategory] = useState<Category>("ALL");
  const [sentiment, setSentiment] = useState<SentimentFilter>("ALL");
  const [countdown, setCountdown] = useState(300); // seconds
  const [heroIdx, setHeroIdx] = useState(0);
  const lastFetch = useRef(0);

  // Merge SIM fallback articles into LiveArticle shape for unified rendering
  const simFallback = useMemo(() => {
    const sim = globalNews(3);
    return sim.map((a): LiveArticle => ({
      id: a.id,
      title: a.headline,
      description: a.whyItMatters,
      url: a.url || "",
      source: a.source,
      publishedAt: new Date(Date.now() - a.minutesAgo * 60000).toISOString(),
      minutesAgo: a.minutesAgo,
      country: a.country,
      countryName: a.countryName,
      category: a.category,
      sentiment: a.sentiment,
      sentimentScore: a.sentimentScore,
      confidence: a.confidence,
      impact: a.impact,
      relatedStocks: a.relatedStocks,
      industries: a.industries,
    }));
  }, []);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const [globalArticles, breakingArticles] = await Promise.all([
        fetchGlobalNews(10),
        fetchBreakingNews(5),
      ]);

      if (globalArticles.length > 0) {
        setArticles(globalArticles);
        setBreaking(breakingArticles);
        setIsLive(true);
      } else {
        // Fallback to SIM
        setArticles(simFallback);
        setBreaking(simFallback.filter((a) => a.impact === "High").slice(0, 5));
        setIsLive(false);
      }
      lastFetch.current = Date.now();
      setCountdown(300);
    } catch {
      setArticles(simFallback);
      setBreaking(simFallback.filter((a) => a.impact === "High").slice(0, 5));
      setIsLive(false);
    }
    setLoading(false);
  }, [simFallback]);

  // Initial load + auto-refresh
  useEffect(() => {
    loadNews();
    const iv = setInterval(loadNews, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [loadNews]);

  // Countdown timer
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetch.current) / 1000);
      setCountdown(Math.max(0, 300 - elapsed));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Hero rotation
  useEffect(() => {
    if (breaking.length <= 1) return;
    const iv = setInterval(() => setHeroIdx((i) => (i + 1) % breaking.length), 8000);
    return () => clearInterval(iv);
  }, [breaking.length]);

  // Filters
  const filtered = useMemo(() => {
    let rows = articles;
    if (category !== "ALL") {
      rows = rows.filter((a) => a.category.toUpperCase() === category);
    }
    if (sentiment === "BULLISH") rows = rows.filter((a) => a.sentiment === "Bullish");
    else if (sentiment === "BEARISH") rows = rows.filter((a) => a.sentiment === "Bearish");
    else if (sentiment === "HIGH IMPACT") rows = rows.filter((a) => a.impact === "High");
    return rows;
  }, [articles, category, sentiment]);

  const heroArticle = breaking[heroIdx % Math.max(1, breaking.length)];

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ padding: "18px 18px 80px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ─── Header ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
            <span className="hero-shine">Global News Wire</span>
          </h1>
          <SourceBadge source={isLive ? "live" : "sim"} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)",
              border: "1px solid var(--line)", borderRadius: 5, padding: "4px 10px",
            }}
          >
            <span className="pulse-dot" style={{ background: isLive ? "var(--up)" : "var(--gold)", boxShadow: `0 0 5px ${isLive ? "var(--up)" : "var(--gold)"}` }} />
            REFRESH {formatCountdown(countdown)}
          </div>
          <button
            className="chip"
            onClick={() => { clearNewsCache(); loadNews(); }}
            style={{ fontSize: 10, padding: "4px 10px" }}
          >
            ↻ NOW
          </button>
        </div>
      </div>

      {/* ─── Breaking News Hero ─── */}
      {heroArticle && (
        <div
          className="panel glow-edge fade-in"
          style={{
            marginBottom: 20, padding: 0, overflow: "hidden",
            background: "linear-gradient(135deg, rgba(24,34,54,0.8), rgba(10,16,27,0.95))",
          }}
        >
          <div style={{ display: "flex", gap: 0, minHeight: 160 }}>
            {/* Image area */}
            {heroArticle.imageUrl && (
              <div
                style={{
                  width: 280, minHeight: "100%", flexShrink: 0,
                  background: `url(${heroArticle.imageUrl}) center/cover no-repeat`,
                  borderRight: "1px solid var(--line)",
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 60%, var(--bg) 100%)",
                }} />
              </div>
            )}
            {/* Content */}
            <div style={{ flex: 1, padding: "18px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--mono)", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em",
                    padding: "3px 10px", borderRadius: 3,
                    background: "var(--down)", color: "#fff",
                  }}
                >
                  ● BREAKING
                </span>
                <span className="label" style={{ color: "var(--gold)" }}>{heroArticle.source}</span>
                <span className="label">{timeAgo(heroArticle.minutesAgo)}</span>
                {breaking.length > 1 && (
                  <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                    {breaking.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroIdx(i)}
                        style={{
                          width: 6, height: 6, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: i === heroIdx % breaking.length ? "var(--gold)" : "var(--faint)",
                          transition: "background .2s",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 700, lineHeight: 1.35, color: "var(--text)" }}>
                {heroArticle.title}
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                {heroArticle.description}
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <SentimentBadge sentiment={heroArticle.sentiment} />
                {heroArticle.impact === "High" && (
                  <span className="chg down" style={{ fontSize: 10 }}>HIGH IMPACT</span>
                )}
                {heroArticle.relatedStocks.slice(0, 3).map((s) => (
                  <button key={s} className="chip" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => navigate(`/stock/${s}`)}>
                    {s}
                  </button>
                ))}
                {heroArticle.url && (
                  <a
                    href={heroArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
                      color: "var(--blue)", display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 12px", border: "1px solid var(--blue-dim)", borderRadius: 5,
                      background: "var(--blue-dim)", transition: "all .15s",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    READ ARTICLE ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Category + Sentiment Filters ─── */}
      <div style={{ display: "flex", gap: 18, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Categories */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? "active" : ""}`}
              onClick={() => setCategory(c)}
              style={{ fontSize: 10, padding: "4px 10px" }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: "var(--line)", flexShrink: 0 }} />

        {/* Sentiment */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              className={`chip ${sentiment === s ? "blue active" : ""}`}
              onClick={() => setSentiment(s)}
              style={{ fontSize: 10, padding: "4px 10px" }}
            >
              {s === "BULLISH" && "▲ "}{s === "BEARISH" && "▼ "}{s}
            </button>
          ))}
        </div>

        <span className="label" style={{ marginLeft: "auto" }}>
          {filtered.length} ARTICLE{filtered.length !== 1 ? "S" : ""}
        </span>
      </div>

      {/* ─── Loading State ─── */}
      {loading && articles.length === 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--r)" }} />
          ))}
        </div>
      )}

      {/* ─── Article Grid ─── */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((a, idx) => (
          <ArticleCard key={a.id} article={a} index={idx} navigate={navigate} />
        ))}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div
          className="panel"
          style={{
            padding: "40px 24px", textAlign: "center",
            color: "var(--faint)", fontSize: 14,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
          No articles match your filters. Try broadening your selection.
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function ArticleCard({
  article: a,
  index,
  navigate,
}: {
  article: LiveArticle;
  index: number;
  navigate: (path: string) => void;
}) {
  return (
    <article
      className="panel card-int fade-in"
      style={{
        padding: 0, overflow: "hidden",
        animationDelay: `${Math.min(index * 0.03, 0.24)}s`,
      }}
    >
      <div style={{ display: "flex" }}>
        {/* Accent stripe */}
        <div
          style={{
            width: 3, flexShrink: 0,
            background:
              a.sentiment === "Bullish" ? "var(--up)"
              : a.sentiment === "Bearish" ? "var(--down)"
              : "var(--blue)",
          }}
        />

        <div style={{ flex: 1, padding: "14px 18px" }}>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
            <span
              className="label"
              style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 3,
                background: "var(--navy-2)", border: "1px solid var(--line)",
              }}
            >
              {a.category}
            </span>
            <span className="label" style={{ color: "var(--gold)" }}>{a.source}</span>
            <span className="label">{timeAgo(a.minutesAgo)}</span>

            <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
              <SentimentBadge sentiment={a.sentiment} />
              {a.impact === "High" && (
                <span
                  className="chg down"
                  style={{ fontSize: 9, padding: "1px 6px" }}
                >
                  HIGH IMPACT
                </span>
              )}
            </div>
          </div>

          {/* Headline */}
          <h3 style={{
            margin: "0 0 6px", fontSize: 15, fontWeight: 700, lineHeight: 1.4,
            color: "var(--text)",
          }}>
            {a.title}
          </h3>

          {/* Description */}
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
            {a.description}
          </p>

          {/* Footer: stocks + link */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {a.relatedStocks.slice(0, 3).map((s) => (
              <button
                key={s}
                className="chip"
                style={{ fontSize: 10, padding: "2px 8px" }}
                onClick={(e) => { e.stopPropagation(); navigate(`/stock/${s}`); }}
              >
                {s}
              </button>
            ))}
            {a.country && a.countryName && (
              <button
                className="chip"
                style={{ fontSize: 10, padding: "2px 8px", color: "var(--gold)" }}
                onClick={(e) => { e.stopPropagation(); navigate(`/country/${a.country}`); }}
              >
                {a.countryName}
              </button>
            )}

            <span className="label" style={{ marginLeft: "auto" }}>conf {a.confidence}%</span>

            {a.url ? (
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700,
                  color: "var(--blue)", display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 10px", border: "1px solid var(--blue-dim)", borderRadius: 4,
                  background: "var(--blue-dim)", transition: "all .15s",
                  textDecoration: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                READ ↗
              </a>
            ) : (
              <span
                className="label"
                style={{ color: "var(--faint)" }}
                title="Synthetic headline — not a real article."
              >
                SIM
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function SentimentBadge({ sentiment }: { sentiment: "Bullish" | "Bearish" | "Neutral" }) {
  const color = sentiment === "Bullish" ? "var(--up)" : sentiment === "Bearish" ? "var(--down)" : "var(--gold)";
  const bg = sentiment === "Bullish" ? "var(--up-dim)" : sentiment === "Bearish" ? "var(--down-dim)" : "var(--gold-dim)";
  return (
    <span
      className="chg"
      style={{ fontSize: 10, padding: "1px 7px", color, background: bg, borderColor: color }}
    >
      {sentiment === "Bullish" && "▲ "}{sentiment === "Bearish" && "▼ "}{sentiment}
    </span>
  );
}
