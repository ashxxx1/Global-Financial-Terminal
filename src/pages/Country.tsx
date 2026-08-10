import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { COUNTRIES, stocksOf } from "../lib/market";
import { useQuotes } from "../lib/hooks";
import { getCountryStats } from "../data/countryStats";
import { fetchCountryNews, agoLabel, type Article } from "../lib/news";
import { ratePick, RATING_COLOR } from "../lib/analysis";
import SourceBadge from "../components/SourceBadge";
import ProvenanceBadge from "../components/ProvenanceBadge";
import Connections from "../components/Connections";
import { connectionsForCountry } from "../lib/graph";
import { useTerminal } from "../store";
import { useSeo } from "../lib/seo";
import { track } from "../lib/analytics";

const TABS = ["OVERVIEW", "AI PICKS", "MARKETS", "NEWS", "AI SUMMARY"] as const;

export default function Country() {
  const { code = "" } = useParams();
  const iso = code.toUpperCase();
  const navigate = useNavigate();
  const meta = COUNTRIES[iso];
  const stats = useMemo(() => { try { return getCountryStats(iso); } catch { return null; } }, [iso]);
  const symbols = useMemo(() => stocksOf(iso), [iso]);
  const quotes = useQuotes(symbols);
  // Keyword-shaped title: this is the template the programmatic country pages
  // in plan items 89–94 will rank on.
  useSeo({
    title: meta
      ? `${meta.name} Stock Market Today — Index, Currency & News`
      : "Country Markets",
    description: meta
      ? `Live ${meta.name} market data: benchmark index, currency, top stocks, economic indicators and the latest financial news.`
      : "Live country market data, indices, currencies and financial news.",
    path: `/country/${iso}`,
  });
  const [tab, setTab] = useState<(typeof TABS)[number]>("OVERVIEW");

  // Value action: opening a country is the core "orientation" job.
  useEffect(() => { if (iso) track("country_opened", { code: iso }); }, [iso]);

  // Country news engine: auto-fetch on selection, auto-refresh every 3 min.
  const [articles, setArticles] = useState<Article[]>([]);
  const [newsLive, setNewsLive] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => fetchCountryNews(iso, 12).then((r) => {
      if (!alive) return;
      setArticles(r.articles);
      setNewsLive(r.live);
    });
    load();
    const iv = setInterval(load, 180000);
    return () => { alive = false; clearInterval(iv); };
  }, [iso]);
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
        {/* Item 2: the headline number here is the country index, which is
            simulated — say so explicitly rather than with an opaque "SIM". */}
        <span style={{ marginLeft: "auto" }}><ProvenanceBadge kind="index" source="sim" country={iso} /></span>
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
          <Connections nodes={connectionsForCountry(iso)} />
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
                      <td onClick={(e) => { e.stopPropagation(); if (watched) removeWatch(q.symbol); else addWatch({ symbol: q.symbol, name: q.name, country: iso }); }}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SourceBadge source={newsLive ? "live" : "sim"} />
            <span className="label">
              {newsLive ? "GNews wire · auto-refresh 3 min · deduped · entity-linked" : "Deterministic engine — add VITE_GNEWS_API_KEY for the live wire"}
            </span>
          </div>
          {articles.map((a) => (
            <article key={a.id} className="panel fade-in" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <span className="label" style={{ color: "var(--blue)" }}>{a.category}</span>
                <span className="label">{a.source} · {agoLabel(a.minutesAgo)}</span>
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
              <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap", alignItems: "center" }}>
                {a.relatedStocks.map((s) => (
                  <button key={s} className="chip" style={{ fontSize: 10, padding: "3px 9px" }} onClick={() => navigate(`/stock/${s}`)}>{s}</button>
                ))}
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip"
                    style={{ fontSize: 10, padding: "3px 10px", color: "var(--blue)", borderColor: "var(--blue)", textDecoration: "none" }}
                  >
                    Read original ↗
                  </a>
                ) : (
                  <span className="label" title="Synthetic headline derived from live market state — not a real article.">
                    SIM · no source
                  </span>
                )}
                <span className="label" style={{ marginLeft: "auto" }}>confidence {a.confidence}%</span>
              </div>
            </article>
          ))}
          {articles.length === 0 && <div className="panel panel-body" style={{ color: "var(--faint)" }}>Loading the latest headlines…</div>}
        </div>
      )}

      {tab === "AI PICKS" && (
        <AiPicks symbols={symbols} quotes={quotes} onOpen={(s) => navigate(`/stock/${s}`)} countryName={name} />
      )}

      {tab === "AI SUMMARY" && stats && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">AI country synthesis <span className="demo-tag">DEMO</span></span>
            <SourceBadge source="sim" />
          </div>
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

/** AI Stock Predictor — a ranked Buy/Hold/Sell verdict for every listed name,
 *  blending live momentum with a seeded valuation/quality/risk profile. */
function AiPicks({ symbols, quotes, onOpen, countryName }: {
  symbols: string[];
  quotes: ReturnType<typeof useQuotes>;
  onOpen: (s: string) => void;
  countryName: string;
}) {
  const byQuote = new Map(quotes.map((q) => [q.symbol, q]));
  const picks = symbols
    .map((s) => ratePick(s, byQuote.get(s)?.changePct ?? 0))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => b.score - a.score);

  if (picks.length === 0) {
    return <div className="panel panel-body" style={{ color: "var(--faint)" }}>No listed equities to rate for {countryName} yet.</div>;
  }
  const buys = picks.filter((p) => p.action === "Buy").length;
  const sells = picks.filter((p) => p.action === "Sell").length;

  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-head">
        <span className="panel-title">AI Stock Predictor</span>
        <span className="label">{buys} buy · {picks.length - buys - sells} hold · {sells} sell · live-momentum blend</span>
      </div>
      <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
        <table className="tbl">
          <thead>
            <tr><th>Verdict</th><th>Symbol</th><th>Company</th><th className="num">Price</th><th className="num">1D</th><th className="num">Conf.</th><th className="num">Risk</th></tr>
          </thead>
          <tbody>
            {picks.map((p) => {
              const q = byQuote.get(p.symbol);
              const up = (q?.changePct ?? 0) >= 0;
              return (
                <tr key={p.symbol} onClick={() => onOpen(p.symbol)} title={p.note}>
                  <td>
                    <span className="chg" style={{ fontSize: 10, color: RATING_COLOR[p.rating], background: "transparent", border: `1px solid ${RATING_COLOR[p.rating]}`, whiteSpace: "nowrap" }}>
                      {p.rating}
                    </span>
                  </td>
                  <td className="mono" style={{ fontWeight: 700 }}>{p.symbol}</td>
                  <td style={{ fontSize: 12.5, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                  <td className="num">{q ? q.currency + q.display : "—"}</td>
                  <td className="num" style={{ color: up ? "var(--up)" : "var(--down)" }}>{q ? `${up ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}</td>
                  <td className="num">{p.confidence}%</td>
                  <td className="num" style={{ color: p.risk > 60 ? "var(--down)" : p.risk > 40 ? "var(--gold)" : "var(--up)" }}>{p.risk}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="panel-body" style={{ paddingTop: 10 }}>
        <p className="label" style={{ margin: 0 }}>Verdicts blend live price momentum with a deterministic valuation/quality/risk model. Informational — not financial advice.</p>
      </div>
    </div>
  );
}
