import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuote } from "../lib/hooks";
import { metaFor, COUNTRIES, reasonFor, hasPrice } from "../lib/market";
import ProvenanceBadge from "../components/ProvenanceBadge";
import Connections from "../components/Connections";
import TradingChart from "../components/charts/TradingChart";
import { connectionsForStock } from "../lib/graph";
import { useTerminal } from "../store";
import { useSeo, ogImageFor } from "../lib/seo";
import { track } from "../lib/analytics";
import { freshness } from "../lib/marketStatus";
import { setPrioritySymbol } from "../lib/feeds/stocks";
import { setIndexPriority } from "../lib/feeds/indices";
import { setIntlPriority } from "../lib/feeds/intlLive";
import { sectorSlugForName } from "../lib/sectors";
import { useFundamentals } from "../lib/liveFundamentals";
import { useStockThesis } from "../lib/useStockThesis";
import OptionsChain from "../components/OptionsChain";
import SmartAlertModal from "../components/SmartAlertModal";
import "../styles/charts.css";

export default function Stock() {
  const { symbol = "" } = useParams();
  const sym = decodeURIComponent(symbol).toUpperCase();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const vsParam = (searchParams.get("vs") || "").toUpperCase();
  // Try raw first, then with IDX: prefix for index/commodity/fx/crypto symbols
  const meta = metaFor(sym) || metaFor(`IDX:${sym}`);
  const effectiveSym = metaFor(sym) ? sym : `IDX:${sym}`;
  const vs = vsParam && vsParam !== sym && metaFor(vsParam) ? vsParam : "";
  const quote = useQuote(meta ? effectiveSym : null);
  useSeo({
    title: meta ? `${sym} — ${meta.name} Share Price & Chart` : "Stock",
    description: meta
      ? `${meta.name} (${sym}) live share price, interactive trading chart, sector context and related market connections.`
      : "Live share price and chart.",
    path: `/stock/${sym}`,
    image: meta
      ? ogImageFor({
          title: meta.name, subtitle: `${sym} · ${meta.sector}`,
          value: quote?.display, change: quote?.changePct, kind: "stock",
        })
      : undefined,
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
    // US symbols are polled by the equity feed, non-US ones through their US
    // listing by the index feed. Tell both; each ignores what isn't its own.
    setPrioritySymbol(sym || null);
    setIndexPriority(sym || null);
    setIntlPriority(sym || null);
    return () => { setPrioritySymbol(null); setIndexPriority(null); setIntlPriority(null); };
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

  /**
   * Evidence-backed bull and bear case, replacing a block that produced both
   * from a hash of the ticker and the day's move. The engine behind this is the
   * one the research workspace uses, so the two cannot disagree, and every point
   * carries the metric it rests on.
   */
  const thesis = useStockThesis(meta ? sym : null);
  const fundamentals = useFundamentals(meta ? sym : null, meta?.currency ?? "", meta?.country ?? null);

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
          <ProvenanceBadge kind={meta.kind} source={quote?.source ?? "pending"} country={meta.country} name={sym} />
          <button
            className="chip"
            onClick={() => navigate(`/research/${sym}`)}
            title="Open the full research workspace for this company"
          >
            ✦ RESEARCH
          </button>
        </span>
      </div>

      {/* No price: say which kind of absence this is, and why. A blank cell
          invites the reader to assume a bug; a stated reason does not. */}
      {!hasPrice(quote) && (
        <div className={`no-price ${quote?.source === "unavailable" ? "hard" : "soft"}`}>
          <span className="no-price-tag">
            {quote?.source === "unavailable" ? "NO PRICE FEED" : "AWAITING FEED"}
          </span>
          <span>
            {quote?.source === "unavailable"
              ? reasonFor(sym)
              : "A feed covers this listing and has not answered yet. We show no number rather than a placeholder."}
          </span>
        </div>
      )}

      <TradingChart
        symbol={sym}
        name={meta.name}
        currency={meta.currency}
        price={quote?.price}
        changePct={quote?.changePct}
        country={meta.country}
        source={quote?.source ?? "pending"}
        initialCompare={vs ? [vs] : []}
        maxCompare={1}
        onCompareChange={onCompareChange}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <button className={`chip ${showOptions ? "active blue" : ""}`} onClick={() => setShowOptions(!showOptions)}>Options Chain</button>
        <button className="chip" onClick={() => setShowAlertModal(true)}>Set Smart Alert</button>
        {(() => {
          const f = freshness(quote?.source ?? "pending", meta.country);
          return (
            <span className={`fresh fresh-${f.tone}`} title={f.detail} style={{ marginLeft: "auto" }}>
              <span className="fresh-dot" />{f.label}
            </span>
          );
        })()}
        {hasPrice(quote) && Number.isFinite(quote?.changePct) && (
          <span className={`chg ${up ? "up" : "down"}`} style={{ fontSize: 12 }}>
            {up ? "▲" : "▼"} {Math.abs(quote!.changePct).toFixed(2)}% session
          </span>
        )}
      </div>

      {/* Key fundamentals — from the provider, or a stated absence. */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <span className="panel-title">Key fundamentals</span>
          {fundamentals.state === "ok" && (
            <span className="label">
              Finnhub · as at {new Date(fundamentals.asOf).toISOString().slice(0, 16).replace("T", " ")} UTC
            </span>
          )}
        </div>
        <div className="panel-body">
          {fundamentals.state === "loading" && <p className="label" style={{ margin: 0 }}>Loading fundamentals…</p>}
          {fundamentals.state === "unavailable" && (
            <div className="no-price hard" style={{ marginBottom: 0 }}>
              <span className="no-price-tag">NO FUNDAMENTALS</span>
              <span>{fundamentals.reason}</span>
            </div>
          )}
          {fundamentals.state === "ok" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
              {fundamentals.rows.map((r) => (
                <div key={r.metricKey}>
                  <div className="label" title={`provider field: ${r.metricKey}`}>{r.label}</div>
                  <div className="mono" style={{ fontSize: 16, marginTop: 4, color: r.value ? undefined : "var(--faint)" }}>
                    {r.value ?? "—"}
                  </div>
                  {r.note && <div className="label" style={{ marginTop: 2, color: "var(--faint)" }}>{r.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showOptions && quote && (
        <OptionsChain symbol={sym} currentPrice={quote.price} />
      )}

      {/* Bull and bear case, from evidence rather than from the ticker string. */}
      {thesis.state !== "idle" && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Bull case · bear case</span>
            <button className="chip" onClick={() => navigate(`/research/${sym}`)}>
              FULL RESEARCH WORKSPACE →
            </button>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 12 }}>
            {thesis.state === "loading" && <p className="label" style={{ margin: 0 }}>Building the case from the evidence…</p>}
            {thesis.state === "unavailable" && (
              <div className="no-price hard" style={{ marginBottom: 0 }}>
                <span className="no-price-tag">NOT ENOUGH EVIDENCE</span>
                <span>{thesis.reason}</span>
              </div>
            )}
            {thesis.state === "ok" && (
              <>
                {thesis.note && <p className="label" style={{ margin: 0 }}>{thesis.note}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                  <div>
                    <div className="label" style={{ color: "var(--up)", marginBottom: 6 }}>
                      Bull case ({thesis.bull.length})
                    </div>
                    {thesis.bull.length === 0
                      ? <p className="label" style={{ margin: 0 }}>Nothing in the measured evidence supports a positive case right now.</p>
                      : thesis.bull.map((pt) => (
                        <p key={pt.dimension} style={{ margin: "0 0 8px", fontSize: 12.5, lineHeight: 1.6 }}>
                          <span className="label" style={{ marginRight: 6 }}>{pt.dimension}</span>{pt.text}
                        </p>
                      ))}
                  </div>
                  <div>
                    <div className="label" style={{ color: "var(--down)", marginBottom: 6 }}>
                      Bear case ({thesis.bear.length})
                    </div>
                    {thesis.bear.length === 0
                      ? <p className="label" style={{ margin: 0 }}>Nothing in the measured evidence supports a negative case right now.</p>
                      : thesis.bear.map((pt) => (
                        <p key={pt.dimension} style={{ margin: "0 0 8px", fontSize: 12.5, lineHeight: 1.6 }}>
                          <span className="label" style={{ marginRight: 6 }}>{pt.dimension}</span>{pt.text}
                        </p>
                      ))}
                  </div>
                </div>
                {thesis.falsifiers.length > 0 && (
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>What would change this</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {thesis.falsifiers.map((f) => (
                        <li key={f.target + f.test} style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 4 }}>
                          {f.test} <span className="label">— {f.basis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="label" style={{ margin: 0 }}>
                  Each point is a measured dimension of this company against its own history and its peers,
                  not a recommendation. Open the workspace for the figure behind every line. Not financial advice.
                </p>
              </>
            )}
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
