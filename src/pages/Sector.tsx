import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuote, useQuotes } from "../lib/hooks";
import { allStockSymbols, metaFor } from "../lib/market";
import { sectorBySlug, SECTORS } from "../lib/sectors";
import { useSeo } from "../lib/seo";
import ProvenanceBadge from "../components/ProvenanceBadge";
import TradingChart from "../components/charts/TradingChart";
import "../styles/charts.css";

export default function Sector() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const sector = sectorBySlug(slug);

  const rows = useMemo(() => {
    if (!sector) return [];
    return allStockSymbols()
      .map((symbol) => {
        const m = metaFor(symbol);
        return m ? { symbol, ...m } : null;
      })
      .filter((m): m is NonNullable<typeof m> => Boolean(m && sector.match.includes(m.sector)))
      .slice(0, 48);
  }, [sector]);

  const lead = rows[0];
  const leadQuote = useQuote(lead?.symbol || null);
  const heatSymbols = useMemo(() => rows.slice(0, 16).map((r) => r.symbol), [rows]);
  const heatQuotes = useQuotes(heatSymbols);

  useSeo({
    title: sector ? `${sector.name} Stocks — Sector Heat & Charts` : "Sector",
    description: sector
      ? `${sector.blurb} Browse ${sector.name.toLowerCase()} equities with live quotes and trading charts.`
      : "Sector overview",
    path: `/sector/${slug}`,
  });

  if (!sector) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "var(--faint)" }}>Unknown sector.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {SECTORS.map((s) => (
            <Link key={s.slug} to={`/sector/${s.slug}`} className="chip" style={{ textDecoration: "none" }}>{s.name}</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <button type="button" className="chip" onClick={() => navigate("/markets")}>← Markets</button>
        <div>
          <div className="label" style={{ color: "var(--gold)" }}>SECTOR</div>
          <h1 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800 }}>{sector.name}</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13, maxWidth: "56ch" }}>{sector.blurb}</p>
        </div>
        <span style={{ marginLeft: "auto" }}>
          <ProvenanceBadge kind="stock" source="live" />
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {SECTORS.map((s) => (
          <Link
            key={s.slug}
            to={`/sector/${s.slug}`}
            className={`chip ${s.slug === sector.slug ? "active" : ""}`}
            style={{ textDecoration: "none" }}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {heatQuotes.length > 0 && (
        <div className="sector-heat" aria-label="Sector 1D percent heat">
          {heatQuotes.map((q) => {
            const up = q.changePct >= 0;
            const intensity = Math.min(Math.abs(q.changePct) / 4, 1);
            const bg = up
              ? `rgba(34, 197, 94, ${0.08 + intensity * 0.35})`
              : `rgba(239, 68, 68, ${0.08 + intensity * 0.35})`;
            return (
              <button
                key={q.symbol}
                type="button"
                className="sector-heat-cell"
                style={{ background: bg, borderColor: up ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)" }}
                onClick={() => navigate(`/stock/${q.symbol}`)}
                aria-label={`${q.symbol} ${up ? "+" : ""}${q.changePct.toFixed(2)} percent, open chart`}
              >
                <div className="mono">{q.symbol}</div>
                <div className="sector-heat-pct" style={{ color: up ? "var(--up)" : "var(--down)" }}>
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </div>
              </button>
            );
          })}
        </div>
      )}

      {lead && (
        <TradingChart
          symbol={lead.symbol}
          name={lead.name}
          currency={lead.currency}
          price={leadQuote?.price}
          changePct={leadQuote?.changePct}
          country={lead.country}
          source={leadQuote?.source ?? "sim"}
          maxCompare={1}
        />
      )}

      <div className="panel" style={{ overflow: "hidden", marginTop: 14 }}>
        <div className="panel-head">
          <span className="panel-title">{rows.length} names · {sector.name}</span>
        </div>
        <div style={{ maxHeight: "52vh", overflowY: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Name</th>
                <th>Country</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.symbol} style={{ cursor: "pointer" }} onClick={() => navigate(`/stock/${m.symbol}`)}>
                  <td className="mono" style={{ fontWeight: 700 }}>{m.symbol}</td>
                  <td>{m.name}</td>
                  <td className="label">{m.country}</td>
                  <td>
                    <Link
                      to={`/stock/${m.symbol}`}
                      className="chip"
                      style={{ textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Chart
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
