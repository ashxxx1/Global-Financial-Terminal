import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { COUNTRIES, stocksOf } from "../lib/market";
import { useQuotes } from "../lib/hooks";
import { getCountryStats } from "../data/countryStats";
import { newsFor } from "../lib/news";
import SourceBadge from "../components/SourceBadge";
import { useTerminal } from "../store";

const TABS = ["OVERVIEW", "MARKETS", "NEWS", "AI SUMMARY"] as const;

export default function Country() {
  const { code = "" } = useParams();
  const iso = code.toUpperCase();
  const navigate = useNavigate();
  const meta = COUNTRIES[iso];
  const stats = useMemo(() => { try { return getCountryStats(iso); } catch { return null; } }, [iso]);
  const symbols = useMemo(() => stocksOf(iso), [iso]);
  const quotes = useQuotes(symbols);
  const articles = useMemo(() => newsFor(iso, 12), [iso]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("OVERVIEW");
  const { addWatch, removeWatch, inWatchlist } = useTerminal();

  const name = meta?.name || iso;
  const up = (stats?.marketReturns?.["1D"] ?? 0) >= 0;

  const aiSummary = useMemo(() => {
    if (!stats) return "";
    const ret = stats.marketReturns?.["1D"] ?? 0;
    const tone = ret >= 0.5 ? "constructive" : ret <= -0.5 ? "defensive" : "balanced";
    return `${name} trades ${tone} today: the ${meta?.marketIndex || "benchmark"} is ${ret >= 0 ? "up" : "down"} ${Math.abs(ret).toFixed(2)}% with policy rate at ${stats.rate}% and inflation near ${stats.inflation}%. Risk gravity reads ${stats.riskScore}/100 — ${stats.riskScore > 60 ? "elevated geopolitical/transmission risk argues for hedged exposure" : stats.riskScore > 40 ? "moderate risk supports selective positioning" : "benign conditions favor broader participation"}. Watch ${(stats.companies || []).slice(0, 2).map((c: any) => c.name).join(" and ")} as bellwethers.`;
  }, [stats, name, meta]);

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <button className="chip" onClick={() => navigate("/")}>← WORLD</button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{name}</h1>
        <span className="label">{iso}</span>
        {stats && (
          <span className={`chg ${up ? "up" : "down"}`}>
            {meta?.marketIndex || "Index"} {up ? "+" : ""}{(stats.marketReturns?.["1D"] ?? 0).toFixed(2)}% 1D
          </span>
        )}
        <span style={{ marginLeft: "auto" }}><SourceBadge source="sim" /></span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} className={`chip blue ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "OVERVIEW" && stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
            <Metric label="GDP" value={`$${stats.gdp}T`} />
            <Metric label="Inflation" value={`${stats.inflation}%`} />
            <Metric label="Policy rate" value={`${stats.rate}%`} />
            <Metric label="FX" value={stats.currency} small />
            <Metric label="Risk gravity" value={`${stats.riskScore}/100`}
              tone={stats.riskScore > 60 ? "var(--down)" : stats.riskScore > 40 ? "var(--gold)" : "var(--up)"} />
          </div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-head"><span className="panel-title">Benchmark returns</span><span className="label">{meta?.marketIndex}</span></div>
            <div className="panel-body" style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {(["1D", "1W", "1M", "YTD"] as const).map((tf) => {
                const v = stats.marketReturns?.[tf] ?? 0;
                return (
                  <div key={tf}>
                    <div className="label">{tf}</div>
                    <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: v >= 0 ? "var(--up)" : "var(--down)" }}>
                      {v >= 0 ? "+" : ""}{v.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><span className="panel-title">AI briefing</span><span className="label">auto-generated</span></div>
            <div className="panel-body" style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.65 }}>{aiSummary}</div>
          </div>
        </>
      )}

      {tab === "MARKETS" && (
        <div className="panel" style={{ overflow: "hidden" }}>
          <div className="panel-head">
            <span className="panel-title">Listed equities</span><span className="label">{quotes.length} names · live SIM quotes</span>
          </div>
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="tbl">
              <thead><tr><th></th><th>Symbol</th><th>Company</th><th>Sector</th><th className="num">Price</th><th className="num">1D %</th></tr></thead>
              <tbody>
                {quotes.map((q) => {
                  const upq = q.changePct >= 0;
                  const watched = inWatchlist(q.symbol);
                  return (
                    <tr key={q.symbol} onClick={() => navigate(`/stock/${q.symbol}`)}>
                      <td onClick={(e) => { e.stopPropagation(); watched ? removeWatch(q.symbol) : addWatch({ symbol: q.symbol, name: q.name, country: iso }); }}
                        style={{ color: watched ? "var(--gold)" : "var(--faint)", width: 28, cursor: "pointer" }}>
                        {watched ? "★" : "☆"}
                      </td>
                      <td className="mono" style={{ fontWeight: 700 }}>{q.symbol}</td>
                      <td>{q.name}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{q.sector}</td>
                      <td className="num">{q.currency}{q.display}</td>
                      <td className="num" style={{ color: upq ? "var(--up)" : "var(--down)" }}>{upq ? "+" : ""}{q.changePct.toFixed(2)}%</td>
                    </tr>
                  );
                })}
                {quotes.length === 0 && <tr><td colSpan={6} style={{ color: "var(--faint)" }}>No listed coverage for {name} yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "NEWS" && (
        <div style={{ display: "grid", gap: 12 }}>
          {articles.map((a) => (
            <article key={a.id} className="panel fade-in" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <span className="label" style={{ color: "var(--blue)" }}>{a.category}</span>
                <span className="label">{a.source} · {a.minutesAgo}m ago</span>
                <span className="chg" style={{
                  marginLeft: "auto", fontSize: 10,
                  color: a.sentiment === "Bullish" ? "var(--up)" : a.sentiment === "Bearish" ? "var(--down)" : "var(--gold)",
                  background: a.sentiment === "Bullish" ? "var(--up-dim)" : a.sentiment === "Bearish" ? "var(--down-dim)" : "var(--gold-dim)",
                }}>{a.sentiment} {a.sentimentScore}</span>
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{a.headline}</h3>
              <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--muted)" }}>{a.summary}</p>
              <div style={{ fontSize: 12, color: "var(--text)" }}><b style={{ color: "var(--gold)" }}>Why it matters:</b> {a.whyItMatters}</div>
              <div style={{ fontSize: 12, color: "var(--text)", marginTop: 4 }}><b style={{ color: "var(--blue)" }}>What next:</b> {a.whatNext}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                {a.relatedStocks.map((s) => (
                  <button key={s} className="chip" style={{ fontSize: 10, padding: "3px 9px" }} onClick={() => navigate(`/stock/${s}`)}>{s}</button>
                ))}
                <span className="label" style={{ marginLeft: "auto" }}>confidence {a.confidence}%</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "AI SUMMARY" && stats && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">AI country synthesis</span><SourceBadge source="sim" /></div>
          <div className="panel-body" style={{ display: "grid", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{aiSummary}</p>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Bellwethers</div>
              <div style={{ display: "grid", gap: 6 }}>
                {(stats.companies || []).map((c: any) => (
                  <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{c.name}</span>
                    <span className="mono" style={{ color: (c.returns?.["1D"] ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
                      {(c.returns?.["1D"] ?? 0) >= 0 ? "+" : ""}{(c.returns?.["1D"] ?? 0).toFixed(2)}% 1D
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="label" style={{ margin: 0 }}>Informational only — not financial advice.</p>
          </div>
        </div>
      )}

      {!stats && <div className="panel panel-body">No data coverage for “{iso}” yet.</div>}
    </div>
  );
}

function Metric({ label, value, tone, small }: { label: string; value: string; tone?: string; small?: boolean }) {
  return (
    <div className="panel" style={{ padding: "12px 14px" }}>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: small ? 13 : 19, fontWeight: 800, color: tone || "var(--text)" }}>{value}</div>
    </div>
  );
}
