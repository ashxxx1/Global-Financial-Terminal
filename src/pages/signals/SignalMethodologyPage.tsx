import { useSeo } from "../../lib/seo";
import { DISCLAIMER, MIN_CONFIDENCE, MIN_RISK_REWARD } from "../../lib/signals/types";
import { SignalsSubnav } from "../../components/signals/SignalStatusBadge";

export default function SignalMethodologyPage() {
  useSeo({
    title: "GFT Signals Methodology",
    description: "How GFT signals are generated, scored, resolved, and measured — including anti-hindsight rules.",
    path: "/terminal/signals/methodology",
  });

  return (
    <div style={{ padding: 18, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>METHODOLOGY</h1>
      <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>How forecasts are made, tracked, and scored — in plain language.</p>
      <SignalsSubnav active="methodology" />

      <Article title="How signals are generated">
        Each trading session, GFT CORE reads the latest market snapshot for a fixed universe (indices, FX, crypto, commodities across India, US, UK, Europe, and Japan). Modular models score trend, momentum, volatility, volume, market regime, support/resistance, and event-risk proxies. Candidates are scored, ranked, and capped (about 5–15 high-quality signals per day). If confidence is below the threshold ({MIN_CONFIDENCE}), the model outputs <strong>NO SIGNAL</strong> rather than forcing a call.
      </Article>

      <Article title="Confidence">
        Confidence is a 0–100 agreement score across model factors (trend, momentum, volatility setup, volume, regime, and a historical-setup placeholder). It is <em>not</em> a claim of statistical predictive power until calibrated out-of-sample.
      </Article>

      <Article title="Targets & stops">
        Entry is published as a range around the reference price. Targets and stops are derived from ATR and recent swing levels with a minimum risk/reward of {MIN_RISK_REWARD}. If no sensible target exists, no signal is published. Bullish targets are always above entry; bearish targets always below.
      </Article>

      <Article title="How signals are resolved">
        Active signals are checked against post-publication prices only. Bullish: target if price ≥ target, stop if price ≤ stop. Bearish: the inverse. When the timeframe ends without either, the signal is <strong>EXPIRED</strong>. Same-candle cases where both target and stop appear inside one OHLC bar are marked <strong>AMBIGUOUS</strong> — we never assume the favorable path.
      </Article>

      <Article title="Performance">
        <strong>WIN</strong> = TARGET HIT. <strong>LOSS</strong> = STOP HIT. Expired and ambiguous stay visible as separate categories. Win rate ignores active signals. Cumulative charts use equal-notional hypothetical returns and are labeled as model performance, not client returns. Expectancy = (win% × average win) − (loss% × |average loss|).
      </Article>

      <Article title="Backtests & look-ahead bias">
        At simulated time T the model may only use data with timestamps ≤ T. No future prices, news, revisions, or indicators. Walk-forward splits (train / validate / out-of-sample) are supported; if validated history is insufficient we show that explicitly.
      </Article>

      <Article title="Immutability">
        Once published, entry, target, stop, confidence, direction, timestamp, and model version never change. If the model changes its mind, a <em>new</em> signal is created. Historical predictions are never edited, deleted, hidden, or rewritten.
      </Article>

      <Article title="Model versioning">
        Every signal stores modelName + modelVersion (e.g. GFT CORE v1.0). Logic changes bump the version; old signals remain attributed to the version that produced them.
      </Article>

      <div className="panel" style={{ padding: 16, marginTop: 8 }}>
        <div className="label" style={{ marginBottom: 6 }}>DISCLAIMER</div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{DISCLAIMER}</p>
      </div>
    </div>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel" style={{ marginBottom: 12 }}>
      <div className="panel-head"><span className="panel-title">{title.toUpperCase()}</span></div>
      <div className="panel-body" style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)" }}>{children}</div>
    </section>
  );
}
