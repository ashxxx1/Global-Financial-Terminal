import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { globalNews } from "../lib/news";
import SourceBadge from "../components/SourceBadge";

const FILTERS = ["ALL", "BULLISH", "BEARISH", "HIGH IMPACT"] as const;

export default function News() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const all = useMemo(() => globalNews(2), []);

  const rows = all.filter((a) =>
    filter === "ALL" ? true
    : filter === "BULLISH" ? a.sentiment === "Bullish"
    : filter === "BEARISH" ? a.sentiment === "Bearish"
    : a.impact === "High"
  );

  return (
    <div style={{ padding: 18, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Global News</h1>
        <SourceBadge source="sim" />
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
              <span className="label">{a.category} · {a.source} · {a.minutesAgo}m</span>
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
              <span className="label" style={{ marginLeft: "auto" }}>conf {a.confidence}%</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
