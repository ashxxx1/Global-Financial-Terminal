import { useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TradingChart from "../components/charts/TradingChart";
import SymbolSuggest from "../components/charts/SymbolSuggest";
import { COMPARE_COLORS, POPULAR_COMPARE_PAIRS } from "../lib/charts/compareColors";
import { metaFor } from "../lib/market";
import { useQuote } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { track } from "../lib/analytics";
import "../styles/charts.css";

function normalizeSym(raw?: string): string {
  return (raw || "").trim().toUpperCase();
}

export default function Compare() {
  const { a, b } = useParams();
  const navigate = useNavigate();
  const left = normalizeSym(a);
  const right = normalizeSym(b);
  const leftMeta = left ? metaFor(left) : null;
  const rightMeta = right ? metaFor(right) : null;
  const leftQuote = useQuote(leftMeta ? left : null);
  const rightQuote = useQuote(rightMeta ? right : null);

  const bothValid = Boolean(leftMeta && rightMeta && left !== right);

  useSeo({
    title: bothValid
      ? `${left} vs ${right} — Compare Charts`
      : "Compare Stock Charts",
    description: bothValid
      ? `Normalized performance chart comparing ${leftMeta!.name} (${left}) and ${rightMeta!.name} (${right}).`
      : "Compare two stocks on one chart — normalized percentage performance over a shared timeframe.",
    path: bothValid ? `/compare/${left}/${right}` : "/compare",
  });

  useEffect(() => {
    if (bothValid) track("compare_opened", { left, right });
  }, [bothValid, left, right]);

  const setPair = useCallback((nextLeft: string, nextRight: string) => {
    const L = normalizeSym(nextLeft);
    const R = normalizeSym(nextRight);
    if (L && R && L !== R && metaFor(L) && metaFor(R)) {
      navigate(`/compare/${L}/${R}`, { replace: false });
    } else if (L && metaFor(L)) {
      navigate(`/compare/${L}`, { replace: true });
    } else {
      navigate("/compare", { replace: true });
    }
  }, [navigate]);

  const swap = () => {
    if (left && right) setPair(right, left);
  };

  const spread = useMemo(() => {
    if (!bothValid || leftQuote == null || rightQuote == null) return null;
    return leftQuote.changePct - rightQuote.changePct;
  }, [bothValid, leftQuote, rightQuote]);

  return (
    <div className="compare-page">
      <div className="compare-head">
        <div>
          <div className="label" style={{ color: "var(--gold)" }}>CHART COMPARE</div>
          <h1 className="compare-title">
            {bothValid ? (
              <>
                <span style={{ color: COMPARE_COLORS[0] }}>{left}</span>
                <span className="compare-vs">vs</span>
                <span style={{ color: COMPARE_COLORS[1] }}>{right}</span>
              </>
            ) : (
              "Compare two stocks"
            )}
          </h1>
          <p className="compare-sub">
            Overlay normalized % performance from a shared start. Not absolute prices — each series rebased to 0% at the window open.
          </p>
        </div>
        <Link to={leftMeta ? `/stock/${left}` : "/markets"} className="chip" style={{ textDecoration: "none" }}>
          {leftMeta ? `← ${left} page` : "← Markets"}
        </Link>
      </div>

      <div className="compare-picker panel">
        <div className="compare-picker-row">
          <SymbolSuggest
            label="Stock A"
            value={left}
            exclude={right || undefined}
            onChange={(sym) => setPair(sym, right)}
            autoFocus={!left}
          />
          <button
            type="button"
            className="chip compare-swap"
            onClick={swap}
            disabled={!bothValid}
            aria-label="Swap stocks"
            title="Swap"
          >
            ⇄
          </button>
          <SymbolSuggest
            label="Stock B"
            value={right}
            exclude={left || undefined}
            onChange={(sym) => setPair(left, sym)}
          />
        </div>

        <div className="compare-pairs" aria-label="Popular pairs">
          <span className="label">Quick pairs</span>
          {POPULAR_COMPARE_PAIRS.map(([x, y]) => {
            const active = left === x && right === y;
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                className={`chip ${active ? "active" : ""}`}
                onClick={() => setPair(x, y)}
              >
                {x} · {y}
              </button>
            );
          })}
        </div>
      </div>

      {bothValid && (
        <div className="compare-stats" aria-label="Session snapshot">
          <Stat
            color={COMPARE_COLORS[0]}
            symbol={left}
            name={leftMeta!.name}
            changePct={leftQuote?.changePct}
            href={`/stock/${left}`}
          />
          <div className="compare-spread panel">
            <div className="label">1D SPREAD (A − B)</div>
            <div
              className="mono"
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: spread == null ? "var(--muted)" : spread >= 0 ? "var(--up)" : "var(--down)",
              }}
            >
              {spread == null ? "—" : `${spread >= 0 ? "+" : ""}${spread.toFixed(2)} pt`}
            </div>
            <div className="label">Session % change differential</div>
          </div>
          <Stat
            color={COMPARE_COLORS[1]}
            symbol={right}
            name={rightMeta!.name}
            changePct={rightQuote?.changePct}
            href={`/stock/${right}`}
          />
        </div>
      )}

      {bothValid ? (
        <TradingChart
          symbol={left}
          name={leftMeta!.name}
          currency={leftMeta!.currency}
          price={leftQuote?.price}
          changePct={leftQuote?.changePct}
          country={leftMeta!.country}
          source={leftQuote?.source ?? "sim"}
          initialCompare={[right]}
          compareLocked
          onCompareChange={(syms) => {
            const peer = syms[0];
            if (peer && peer !== left && peer !== right) setPair(left, peer);
          }}
        />
      ) : (
        <div className="panel compare-empty">
          <div className="panel-title">Pick two tickers</div>
          <p className="label" style={{ margin: "8px 0 0", lineHeight: 1.5 }}>
            Choose Stock A and Stock B above — or tap a quick pair — to overlay relative performance on one chart.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  color, symbol, name, changePct, href,
}: {
  color: string;
  symbol: string;
  name: string;
  changePct?: number | null;
  href: string;
}) {
  const up = (changePct ?? 0) >= 0;
  return (
    <Link to={href} className="panel compare-stat" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="compare-stat-top">
        <span className="tc-swatch" style={{ background: color }} aria-hidden />
        <span className="mono" style={{ fontWeight: 800 }}>{symbol}</span>
      </div>
      <div className="label" style={{ marginTop: 4 }}>{name}</div>
      <div
        className="mono"
        style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: changePct == null ? "var(--muted)" : up ? "var(--up)" : "var(--down)" }}
      >
        {changePct == null ? "—" : `${up ? "+" : ""}${changePct.toFixed(2)}%`}
        <span className="label" style={{ marginLeft: 6 }}>1D</span>
      </div>
    </Link>
  );
}
