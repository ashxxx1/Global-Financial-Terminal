import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { globalNews, fetchCountryNews, agoLabel, type Article } from "../lib/news";
import SourceBadge from "../components/SourceBadge";

const FILTERS = ["ALL", "BULLISH", "BEARISH", "HIGH IMPACT"] as const;

// A spread of major markets to aggregate for the global wire. When a news feed
// is configured (backend or GNews key) these return real, linked articles;
// otherwise each falls back to the deterministic SIM engine.
const WIRE_COUNTRIES = ["US", "GB", "IN", "JP", "DE", "FR"];

export default function News() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const simAll = useMemo(() => globalNews(2), []);
  const [articles, setArticles] = useState<Article[]>(simAll);
  const [live, setLive] = useState(false);

  // Pull real linked news for the major markets when a feed is available.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(WIRE_COUNTRIES.map((c) => fetchCountryNews(c, 6).catch(() => null)));
      if (cancelled) return;
      const merged = results.flatMap((r) => (r?.articles ?? []));
      const anyLive = results.some((r) => r?.live);
      if (merged.length) {
        setArticles(merged.sort((a, b) => a.minutesAgo - b.minutesAgo));
        setLive(anyLive);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = articles.filter((a) =>
    filter === "ALL" ? true
    : filter === "BULLISH" ? a.sentiment === "Bullish"
    : filter === "BEARISH" ? a.sentiment === "Bearish"
    : a.impact === "High"
  );

  return (
    <div style={{ padding: 18, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Global News</h1>
        <SourceBadge source={live ? "live" : "sim"} />
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((a) => (
          <article key={a.id} className="panel fade-in" style={{ padding: "13px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
              <button className="chip" style={{ fontSize: 10, padding: "2px 9px", color: "var(--gold)" }}
                onClick={() => navigate(`/country/${a.country}`)}>{a.countryName}</button>
              <span className="label">{a.category} · {a.source} · {agoLabel(a.minutesAgo)}</span>
              <span className="chg" style={{
                marginLeft: "auto", fontSize: 10,
                color: a.sentiment === "Bullish" ? "var(--up)" : a.sentiment === "Bearish" ? "var(--down)" : "var(--gold)",
                background: a.sentiment === "Bullish" ? "var(--up-dim)" : a.sentiment === "Bearish" ? "var(--down-dim)" : "var(--gold-dim)",
              }}>{a.sentiment}</span>
              {a.impact === "High" && <span className="chg down" style={{ fontSize: 10 }}>HIGH IMPACT</span>}
            </div>
            <h3 style={{ margin: "0 0 5px", fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{a.headline}</h3>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{a.whyItMatters}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              {a.relatedStocks.slice(0, 3).map((s) => (
                <button key={s} className="chip" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => navigate(`/stock/${s}`)}>{s}</button>
              ))}
              {/* Proof-of-source: real wire items link to the original article;
                  synthetic items are honestly marked SIM (no fabricated source). */}
              {a.url ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="label" style={{ marginLeft: "auto", color: "var(--blue)" }}
                  onClick={(e) => e.stopPropagation()}>
                  Read original ↗
                </a>
              ) : (
                <span className="label" style={{ marginLeft: "auto", color: "var(--faint)" }}
                  title="Synthetic headline derived from live market state — not a real article.">
                  SIM · no source
                </span>
              )}
              <span className="label">conf {a.confidence}%</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
