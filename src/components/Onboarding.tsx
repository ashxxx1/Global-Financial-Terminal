import { useEffect, useMemo, useState } from "react";
import { useTerminal } from "../store";
import { quoteFor, metaFor } from "../lib/market";
import { track } from "../lib/analytics";
import Sparkline from "./Sparkline";

/**
 * First-run onboarding — growth-plan items 38 and 39.
 *
 * The activation hypothesis in docs/METRICS.md is that adding a watchlist
 * symbol is the moment a user "gets it": an empty terminal is a demo, a
 * terminal with your names on it is yours. So the entire first run does one
 * job — get the user to pick something — rather than touring features.
 *
 * Deliberately skippable. A forced wizard on a product people are still
 * evaluating costs more signups than the activation it buys.
 */

/** Curated starters spanning regions, because the ICP is global-first. */
const SUGGESTED: { symbol: string; blurb: string }[] = [
  { symbol: "AAPL",  blurb: "US · Technology" },
  { symbol: "MSFT",  blurb: "US · Technology" },
  { symbol: "NVDA",  blurb: "US · Semiconductors" },
  { symbol: "TSLA",  blurb: "US · Automotive" },
  { symbol: "ASML",  blurb: "Netherlands · Semis" },
  { symbol: "SAP",   blurb: "Germany · Software" },
  { symbol: "7203",  blurb: "Japan · Toyota" },
  { symbol: "005930", blurb: "Korea · Samsung" },
  { symbol: "RELIANCE", blurb: "India · Conglomerate" },
  { symbol: "BABA",  blurb: "China · E-commerce" },
  { symbol: "BTC",   blurb: "Crypto · Bitcoin" },
  { symbol: "ETH",   blurb: "Crypto · Ethereum" },
];

export default function Onboarding() {
  const addWatch = useTerminal((s) => s.addWatch);
  const setOnboarded = useTerminal((s) => s.setOnboarded);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => { track("onboarding_shown"); }, []);

  // Only offer symbols the registry actually knows, so a data change can never
  // render a dead tile.
  const options = useMemo(
    () =>
      SUGGESTED.map((s) => ({ ...s, meta: metaFor(s.symbol), quote: quoteFor(s.symbol) }))
        .filter((s) => s.meta && s.quote)
        .slice(0, 9),
    [],
  );

  const toggle = (symbol: string) =>
    setPicked((cur) =>
      cur.includes(symbol) ? cur.filter((s) => s !== symbol) : [...cur, symbol],
    );

  const finish = () => {
    for (const symbol of picked) {
      const meta = metaFor(symbol);
      if (meta) addWatch({ symbol, name: meta.name, country: meta.country });
    }
    track("onboarding_completed", { picked: picked.length });
    setOnboarded(true);
  };

  const skip = () => {
    track("onboarding_skipped");
    setOnboarded(true);
  };

  return (
    <div className="ob-wrap" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <div className="auth-aurora" aria-hidden />
      <div className="ob-card">
        <div className="ob-step label">STEP 1 OF 1 · TAKES 10 SECONDS</div>
        <h2 id="ob-title" className="ob-title">
          Which markets do you actually care about?
        </h2>
        <p className="ob-sub">
          Pick a few and your terminal opens on them every time — with alerts and
          a daily brief built around what you chose. You can change this later.
        </p>

        <div className="ob-grid">
          {options.map((o) => {
            const on = picked.includes(o.symbol);
            // `?? 0` does not catch NaN, and an unpriced instrument now carries
            // exactly that — which rendered "▼ NaN%" on the first screen a new
            // visitor ever sees.
            const change = o.quote?.changePct;
            const priced = typeof change === "number" && Number.isFinite(change);
            const up = priced && change >= 0;
            const tone = !priced ? "var(--faint)" : up ? "var(--up)" : "var(--down)";
            return (
              <button
                key={o.symbol}
                className={`ob-tile ${on ? "on" : ""}`}
                onClick={() => toggle(o.symbol)}
                aria-pressed={on}
              >
                <span className="ob-tile-head">
                  <span className="ob-sym">{o.symbol}</span>
                  <span className={`ob-check ${on ? "on" : ""}`} aria-hidden>{on ? "✓" : "+"}</span>
                </span>
                <span className="ob-name">{o.meta?.name}</span>
                <span className="ob-blurb">{o.blurb}</span>
                <span className="ob-foot">
                  {/* Tone follows the day change shown beside it — an
                      independently-coloured line next to a green number reads
                      as a contradiction. */}
                  <Sparkline
                    symbol={o.symbol}
                    width={54}
                    height={18}
                    animate={false}
                    tone={tone}
                  />
                  <span className="mono" style={{ color: tone }}>
                    {priced ? `${up ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}%` : "—"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="ob-actions">
          <button className="btn-primary" onClick={finish} disabled={picked.length === 0}>
            {picked.length === 0
              ? "Pick at least one"
              : `Add ${picked.length} and open my terminal →`}
          </button>
          <button className="auth-link" onClick={skip}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}
