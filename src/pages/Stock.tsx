import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuote, useHistory } from "../lib/hooks";
import { metaFor, COUNTRIES, type Candle } from "../lib/market";
import SourceBadge from "../components/SourceBadge";
import Connections from "../components/Connections";
import { connectionsForStock } from "../lib/graph";
import { useTerminal } from "../store";
import { useSeo } from "../lib/seo";

const RANGES = ["1W", "1M", "3M", "6M", "1Y"] as const;

export default function Stock() {
  const { symbol = "" } = useParams();
  const sym = symbol.toUpperCase();
  const navigate = useNavigate();
  const meta = metaFor(sym);
  const quote = useQuote(meta ? sym : null);
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M");
  useSeo({
    title: meta ? `${sym} — ${meta.name} Share Price & Chart` : "Stock",
    description: meta
      ? `${meta.name} (${sym}) live share price, interactive chart, sector context and related market connections.`
      : "Live share price and chart.",
    path: `/stock/${sym}`,
  });
  const { candles } = useHistory(meta ? sym : null, range);
  const { addWatch, removeWatch, inWatchlist, addAlert } = useTerminal();
  const [alertMsg, setAlertMsg] = useState("");

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

  const setPriceAlert = (direction: "above" | "below") => {
    if (!quote) return;
    const target = +(quote.price * (direction === "above" ? 1.02 : 0.98)).toFixed(2);
    addAlert({ symbol: sym, price: target, direction });
    setAlertMsg(`Alert armed: ${sym} ${direction} ${target}`);
    setTimeout(() => setAlertMsg(""), 2500);
  };

  return (
    <div style={{ padding: 18, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <button className="chip" onClick={() => navigate(-1)}>←</button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)" }}>{sym}</h1>
        <span style={{ color: "var(--muted)" }}>{meta.name}</span>
        <button className="chip" style={{ color: watched ? "var(--gold)" : undefined }}
          onClick={() => watched ? removeWatch(sym) : addWatch({ symbol: sym, name: meta.name, country: meta.country })}>
          {watched ? "★ WATCHING" : "☆ WATCH"}
        </button>
        <span style={{ marginLeft: "auto" }}><SourceBadge source={quote?.source ?? "sim"} /></span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 30, fontWeight: 800 }}>{meta.currency}{quote?.display ?? "—"}</span>
        <span className={`chg ${up ? "up" : "down"}`} style={{ fontSize: 13 }}>
          {up ? "▲" : "▼"} {Math.abs(quote?.changePct ?? 0).toFixed(2)}% today
        </span>
        <span className="label">{meta.sector} · {countryName}</span>
      </div>

      {/* Chart */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-head">
          <span className="panel-title">Price history</span>
          <div style={{ display: "flex", gap: 5 }}>
            {RANGES.map((r) => (
              <button key={r} className={`chip ${range === r ? "active" : ""}`} style={{ padding: "3px 9px", fontSize: 10 }} onClick={() => setRange(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="panel-body" style={{ overflowX: "auto" }}>
          <CandleChart candles={candles} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <button className="chip" onClick={() => setPriceAlert("above")}>🔔 ALERT +2%</button>
        <button className="chip" onClick={() => setPriceAlert("below")}>🔔 ALERT −2%</button>
        {alertMsg && <span className="mono" style={{ fontSize: 11, color: "var(--up)" }}>✓ {alertMsg}</span>}
      </div>

      {/* AI analysis */}
      {ai && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">AI investment intelligence</span>
            <span className="label">confidence {ai.confidence}% · risk {ai.risk}/100</span>
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
            <p className="label" style={{ margin: 0 }}>Synthetic analysis for demonstration — not financial advice.</p>
          </div>
        </div>
      )}

      <Connections nodes={connectionsForStock(sym)} />
    </div>
  );
}

/* Lightweight dependency-free candlestick renderer */
function CandleChart({ candles }: { candles: Candle[] }) {
  const W = 900, H = 260, PAD = 10;
  if (candles.length === 0) return <div className="skeleton" style={{ width: "100%", height: H }} />;
  const lo = Math.min(...candles.map((c) => c.l));
  const hi = Math.max(...candles.map((c) => c.h));
  const x = (i: number) => PAD + (i / (candles.length - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD * 2);
  const bw = Math.max(2, ((W - PAD * 2) / candles.length) * 0.6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 560, height: "auto", display: "block" }}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)}
          stroke="rgba(148,170,210,0.08)" strokeWidth="1" />
      ))}
      {candles.map((c, i) => {
        const upC = c.c >= c.o;
        const color = upC ? "var(--up)" : "var(--down)";
        return (
          <g key={c.t}>
            <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x(i) - bw / 2} width={bw}
              y={y(Math.max(c.o, c.c))} height={Math.max(1, Math.abs(y(c.o) - y(c.c)))}
              fill={color} rx="1" />
          </g>
        );
      })}
      <text x={W - PAD} y={y(hi) + 10} textAnchor="end" fill="var(--faint)" fontSize="10" fontFamily="var(--mono)">{hi.toFixed(2)}</text>
      <text x={W - PAD} y={y(lo) - 4} textAnchor="end" fill="var(--faint)" fontSize="10" fontFamily="var(--mono)">{lo.toFixed(2)}</text>
    </svg>
  );
}
