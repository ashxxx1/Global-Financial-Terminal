import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import TradingChart from "../components/charts/TradingChart";
import SymbolSuggest from "../components/charts/SymbolSuggest";
import { COMPARE_COLORS, POPULAR_COMPARE_PAIRS } from "../lib/charts/compareColors";
import { metaFor } from "../lib/market";
import { useQuote } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { track } from "../lib/analytics";
import { useTerminal } from "../store";
import { SITE_URL } from "../lib/site";
import "../styles/charts.css";

function normalizeSym(raw?: string): string {
  return (raw || "").trim().toUpperCase();
}

type CompareMode = "normalized" | "absolute";

export default function Compare() {
  const { a, b } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const left = normalizeSym(a);
  const right = normalizeSym(b);
  const leftMeta = left ? metaFor(left) : null;
  const rightMeta = right ? metaFor(right) : null;
  const leftQuote = useQuote(leftMeta ? left : null);
  const rightQuote = useQuote(rightMeta ? right : null);
  const savedCompare = useTerminal((s) => s.savedCompare);
  const saveComparePair = useTerminal((s) => s.saveComparePair);
  const removeComparePair = useTerminal((s) => s.removeComparePair);
  const [shareMsg, setShareMsg] = useState("");

  const mode: CompareMode = searchParams.get("mode") === "absolute" ? "absolute" : "normalized";
  const setMode = (m: CompareMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (m === "absolute") next.set("mode", "absolute");
      else next.delete("mode");
      return next;
    }, { replace: true });
  };

  const bothValid = Boolean(leftMeta && rightMeta && left !== right);
  const pairSaved = bothValid && savedCompare.some(
    (p) => (p.a === left && p.b === right) || (p.a === right && p.b === left),
  );

  const comparePath = bothValid
    ? `/compare/${left}/${right}${mode === "absolute" ? "?mode=absolute" : ""}`
    : "/compare";
  const ogImage = bothValid
    ? `${SITE_URL}/api/og-compare?a=${encodeURIComponent(left)}&b=${encodeURIComponent(right)}`
    : undefined;

  useSeo({
    title: bothValid
      ? `${left} vs ${right} — Compare Charts`
      : "Compare Stock Charts",
    description: bothValid
      ? `Compare ${leftMeta!.name} (${left}) and ${rightMeta!.name} (${right}) — normalized % or side-by-side absolute prices.`
      : "Compare two stocks on one chart — normalized percentage or side-by-side absolute prices.",
    path: bothValid ? `/compare/${left}/${right}` : "/compare",
    image: ogImage,
  });

  useEffect(() => {
    if (bothValid) track("compare_opened", { left, right, mode });
  }, [bothValid, left, right, mode]);

  const setPair = useCallback((nextLeft: string, nextRight: string) => {
    const L = normalizeSym(nextLeft);
    const R = normalizeSym(nextRight);
    const q = mode === "absolute" ? "?mode=absolute" : "";
    if (L && R && L !== R && metaFor(L) && metaFor(R)) {
      navigate(`/compare/${L}/${R}${q}`, { replace: false });
    } else if (L && metaFor(L)) {
      navigate(`/compare/${L}${q}`, { replace: true });
    } else {
      navigate("/compare", { replace: true });
    }
  }, [navigate, mode]);

  const swap = () => {
    if (left && right) setPair(right, left);
  };

  const spread = useMemo(() => {
    if (!bothValid || leftQuote == null || rightQuote == null) return null;
    return leftQuote.changePct - rightQuote.changePct;
  }, [bothValid, leftQuote, rightQuote]);

  const sharePair = async () => {
    if (!bothValid) return;
    const url = `${SITE_URL}${comparePath}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${left} vs ${right} · GFT`,
          text: `Compare ${left} and ${right} on GFT Terminal`,
          url,
        });
        track("shared", { method: "native", surface: "compare" });
      } else {
        await navigator.clipboard.writeText(url);
        track("shared", { method: "clipboard", surface: "compare" });
        setShareMsg("Link copied");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied");
        setTimeout(() => setShareMsg(""), 2000);
      } catch { /* ignore */ }
    }
  };

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
            {mode === "normalized"
              ? "Overlay normalized % performance from a shared start — each series rebased to 0% at the window open."
              : "Side-by-side absolute price charts — same tickers, dollar scales, for level context."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to={leftMeta ? `/stock/${left}` : "/markets"} className="chip" style={{ textDecoration: "none" }}>
            {leftMeta ? `← ${left}` : "← Markets"}
          </Link>
          {bothValid && (
            <>
              <button type="button" className="chip" onClick={sharePair}>
                {shareMsg || "Share"}
              </button>
              <button
                type="button"
                className={`chip ${pairSaved ? "active" : ""}`}
                onClick={() => (pairSaved ? removeComparePair(left, right) : saveComparePair(left, right))}
                aria-pressed={pairSaved}
              >
                {pairSaved ? "Saved" : "Save pair"}
              </button>
            </>
          )}
        </div>
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

        <div className="compare-mode" role="group" aria-label="Compare mode">
          <button
            type="button"
            className={`compare-mode-btn ${mode === "normalized" ? "active" : ""}`}
            onClick={() => setMode("normalized")}
            aria-pressed={mode === "normalized"}
          >
            %
          </button>
          <button
            type="button"
            className={`compare-mode-btn ${mode === "absolute" ? "active" : ""}`}
            onClick={() => setMode("absolute")}
            aria-pressed={mode === "absolute"}
          >
            $
          </button>
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

        {savedCompare.length > 0 && (
          <div className="compare-pairs" aria-label="Saved pairs">
            <span className="label">Saved</span>
            {savedCompare.map((p) => (
              <button
                key={`${p.a}-${p.b}`}
                type="button"
                className={`chip ${(left === p.a && right === p.b) || (left === p.b && right === p.a) ? "active" : ""}`}
                onClick={() => setPair(p.a, p.b)}
              >
                {p.a} · {p.b}
              </button>
            ))}
          </div>
        )}
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
        mode === "normalized" ? (
          <TradingChart
            symbol={left}
            name={leftMeta!.name}
            currency={leftMeta!.currency}
            price={leftQuote?.price}
            changePct={leftQuote?.changePct}
            country={leftMeta!.country}
            source={leftQuote?.source ?? "pending"}
            initialCompare={[right]}
            compareLocked
            onCompareChange={(syms) => {
              const peer = syms[0];
              if (peer && peer !== left && peer !== right) setPair(left, peer);
            }}
          />
        ) : (
          <div className="compare-absolute">
            <TradingChart
              symbol={left}
              name={leftMeta!.name}
              currency={leftMeta!.currency}
              price={leftQuote?.price}
              changePct={leftQuote?.changePct}
              country={leftMeta!.country}
              source={leftQuote?.source ?? "pending"}
              maxCompare={1}
            />
            <TradingChart
              symbol={right}
              name={rightMeta!.name}
              currency={rightMeta!.currency}
              price={rightQuote?.price}
              changePct={rightQuote?.changePct}
              country={rightMeta!.country}
              source={rightQuote?.source ?? "pending"}
              maxCompare={1}
            />
          </div>
        )
      ) : (
        <div className="panel compare-empty">
          <div className="panel-title">Pick two tickers</div>
          <p className="label" style={{ margin: "8px 0 0", lineHeight: 1.5 }}>
            Choose Stock A and Stock B above — or tap a quick pair — to compare performance.
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
