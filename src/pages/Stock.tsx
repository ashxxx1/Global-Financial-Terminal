import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuote } from "../lib/hooks";
import { metaFor, COUNTRIES } from "../lib/market";
import ProvenanceBadge from "../components/ProvenanceBadge";
import Connections from "../components/Connections";
import TradingChart from "../components/charts/TradingChart";
import { connectionsForStock } from "../lib/graph";
import { useTerminal } from "../store";
import { useSeo } from "../lib/seo";
import { track } from "../lib/analytics";
import { freshness } from "../lib/marketStatus";
import { setPrioritySymbol } from "../lib/feeds/stocks";
import { sectorSlugForName } from "../lib/sectors";
import { generateFundamentals } from "../lib/fundamentals";
import OptionsChain from "../components/OptionsChain";
import SmartAlertModal from "../components/SmartAlertModal";
import "../styles/charts.css";

export default function Stock() {
  const { symbol = "" } = useParams();
  const sym = symbol.toUpperCase();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const vsParam = (searchParams.get("vs") || "").toUpperCase();
  const vs = vsParam && vsParam !== sym && metaFor(vsParam) ? vsParam : "";
  const meta = metaFor(sym);
  const quote = useQuote(meta ? sym : null);
  useSeo({
    title: meta ? `${sym} — ${meta.name} Share Price & Chart` : "Stock",
    description: meta
      ? `${meta.name} (${sym}) live share price, interactive trading chart, sector context and related market connections.`
      : "Live share price and chart.",
    path: `/stock/${sym}`,
  });
  const { addWatch, removeWatch, inWatchlist } = useTerminal();
  const [showOptions, setShowOptions] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const pushRecent = useTerminal((s) => s.pushRecent);
  useEffect(() => {
    if (!sym || !meta) return;
    track("stock_opened", { symbol: sym });
    pushRecent(sym);
  }, [sym, meta, pushRecent]);

  // Poll the symbol being viewed far more often than the background sweep.
  useEffect(() => {
    setPrioritySymbol(sym || null);
    return () => setPrioritySymbol(null);
  }, [sym]);

  const onCompareChange = useCallback((symbols: string[]) => {
    const peer = symbols[0]?.toUpperCase();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (peer && peer !== sym && metaFor(peer)) next.set("vs", peer);
      else next.delete("vs");
      return next;
    }, { replace: true });
  }, [setSearchParams, sym]);

  const ai = useMemo(() => {
    if (!meta || !quote) return null;
    const mom = quote.changePct;
    const seedChar = sym.charCodeAt(0) + sym.length * 7;
    const valuation = 40 + (seedChar % 45);            // deterministic pseudo-P/E
    const risk = 25 + ((seedChar * 13) % 55);
    const rating = mom > 1.2 ? "Bullish" : mom < -1.2 ? "Bearish" : "Neutral";
    return {
      rating,
      confidence: 55 + ((seedChar * 7) % 35),
      risk,
      bull: `Momentum is ${mom >= 0 ? "positive" : "recovering"}; ${meta.sector} demand and ${COUNTRIES[meta.country || ""]?.name || "domestic"} policy tailwinds support multiple expansion. Institutional flows into ${meta.sector.toLowerCase()} favor liquid leaders like ${meta.name}.`,
      bear: `Valuation near ${valuation}× earnings leaves little cushion if ${meta.sector.toLowerCase()} growth slows; FX and rate volatility in ${COUNTRIES[meta.country || ""]?.name || "the region"} could compress margins. Watch for crowded positioning unwinds.`,
      catalysts: ["Next earnings print", "Sector rotation flows", "Central-bank guidance"],
      thesis: `${meta.name} is a ${meta.sector} ${mom >= 0 ? "leader with constructive momentum" : "name in a drawdown testing support"}. Balanced stance: size positions to the ${risk > 55 ? "elevated" : "moderate"} risk score rather than the headline trend.`,
    };
  }, [meta, quote, sym]);

  if (!meta) {
    return (
      <div style={{ padding: 24 }}>
        <button className="chip" onClick={() => navigate(-1)}>← BACK</button>
        <p style={{ color: "var(--faint)" }}>Unknown symbol “{sym}”.</p>
      </div>
    );
  }

  const up = (quote?.changePct ?? 0) >= 0;
  const watched = inWatchlist(sym);
  const countryName = COUNTRIES[meta.country || ""]?.name || meta.country;
  const comparePeer = vs || (sym === "MSFT" ? "AAPL" : "MSFT");
  return (
    <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      {/* Compact page chrome — detailed quote lives in the chart header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" className="chip" onClick={() => navigate(-1)} aria-label="Back to previous page">← Back</button>
        <span className="label">{meta.sector} · {countryName}</span>
        {sectorSlugForName(meta.sector) && (
          <Link
            to={`/sector/${sectorSlugForName(meta.sector)}`}
            className="chip"
            style={{ textDecoration: "none" }}
          >
            Sector
          </Link>
        )}
        <button
          type="button"
          className="chip"
          style={{ color: watched ? "var(--gold)" : undefined }}
          aria-pressed={watched}
          onClick={() => watched ? removeWatch(sym) : addWatch({ symbol: sym, name: meta.name, country: meta.country })}
        >
          {watched ? "★ Watching" : "☆ Watch"}
        </button>
        <a className="chip" href="#trading-chart" style={{ textDecoration: "none" }}>Trading chart</a>
        <Link
          to={`/compare/${sym}/${comparePeer}`}
          className="chip"
          style={{ textDecoration: "none" }}
        >
          Compare
        </Link>
        <span style={{ marginLeft: "auto" }}>
          <ProvenanceBadge kind={meta.kind} source={quote?.source ?? "sim"} country={meta.country} />
        </span>
      </div>

      <TradingChart
        symbol={sym}
        name={meta.name}
        currency={meta.currency}
        price={quote?.price}
        changePct={quote?.changePct}
        country={meta.country}
        source={quote?.source ?? "sim"}
        initialCompare={vs ? [vs] : []}
        maxCompare={1}
        onCompareChange={onCompareChange}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <button className={`chip ${showOptions ? "active blue" : ""}`} onClick={() => setShowOptions(!showOptions)}>Options Chain</button>
        <button className="chip" onClick={() => setShowAlertModal(true)}>Set Smart Alert</button>
        {(() => {
          const f = freshness(quote?.source ?? "sim", meta.country);
          return (
            <span className={`fresh fresh-${f.tone}`} title={f.detail} style={{ marginLeft: "auto" }}>
              <span className="fresh-dot" />{f.label}
            </span>
          );
        })()}
        <span className={`chg ${up ? "up" : "down"}`} style={{ fontSize: 12 }}>
          {up ? "▲" : "▼"} {Math.abs(quote?.changePct ?? 0).toFixed(2)}% session
        </span>
      </div>

      {/* Fundamentals Panel */}
      {quote && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <span className="panel-title">Key Fundamentals <span className="demo-tag">SIM</span></span>
            <span className="label nerd-only">simulated values</span>
          </div>
          <div className="panel-body">
            {(() => {
              const f = generateFundamentals(sym, quote.price);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
                  <div><div className="label">Market Cap</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.marketCap}</div></div>
                  <div><div className="label">P/E Ratio</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.peRatio}</div></div>
                  <div><div className="label">EPS (TTM)</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.eps}</div></div>
                  <div><div className="label">Div Yield</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.divYield}</div></div>
                  <div><div className="label">Beta</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.beta}</div></div>
                  <div><div className="label">Avg Volume</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.avgVolume}</div></div>
                  <div><div className="label">52W High</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.high52w}</div></div>
                  <div><div className="label">52W Low</div><div className="mono" style={{ fontSize: 16, marginTop: 4 }}>{f.low52w}</div></div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showOptions && quote && (
        <OptionsChain symbol={sym} currentPrice={quote.price} />
      )}

      {/* AI analysis */}
      {ai && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">AI investment intelligence <span className="demo-tag">DEMO</span></span>
            <span className="label nerd-only">confidence {ai.confidence}% · risk {ai.risk}/100 — illustrative</span>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="chg" style={{
                fontSize: 12,
                color: ai.rating === "Bullish" ? "var(--up)" : ai.rating === "Bearish" ? "var(--down)" : "var(--gold)",
                background: ai.rating === "Bullish" ? "var(--up-dim)" : ai.rating === "Bearish" ? "var(--down-dim)" : "var(--gold-dim)",
              }}>{ai.rating.toUpperCase()}</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Balanced view — reasoning over recommendation.</span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65 }}>{ai.thesis}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              <div>
                <div className="label" style={{ color: "var(--up)", marginBottom: 4 }}>Bull case</div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text)", lineHeight: 1.6 }}>{ai.bull}</p>
              </div>
              <div>
                <div className="label" style={{ color: "var(--down)", marginBottom: 4 }}>Bear case</div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text)", lineHeight: 1.6 }}>{ai.bear}</p>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>Catalysts to watch</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ai.catalysts.map((c) => <span key={c} className="chip" style={{ cursor: "default" }}>{c}</span>)}
              </div>
            </div>
            <p className="label" style={{ margin: 0 }}>
              Generated text and scores, produced from the symbol and its price move — not
              research, not a model output, and not financial advice. See <a href="/data-sources">data sources</a>.
            </p>
          </div>
        </div>
      )}

      {showAlertModal && quote && (
        <SmartAlertModal symbol={sym} currentPrice={quote.price} onClose={() => setShowAlertModal(false)} />
      )}

      <Connections nodes={connectionsForStock(sym)} />
    </div>
  );
}
