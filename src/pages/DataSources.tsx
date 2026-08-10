import { useSeo } from "../lib/seo";
import { liveSymbolCount } from "../lib/market";

/**
 * Data provenance — growth-plan item 5.
 *
 * A public, specific answer to "where does this number come from and how old
 * is it". For a product that intends to charge money while some series are
 * still simulated, this page is the difference between being upfront and being
 * caught. It is linked from the disclaimer and the landing page.
 */

interface Source {
  what: string;
  provider: string;
  status: "live" | "delayed" | "simulated";
  detail: string;
}

const SOURCES: Source[] = [
  {
    what: "Cryptocurrency prices",
    provider: "Binance (public WebSocket)",
    status: "live",
    detail: "Streamed in real time. This is genuine market data.",
  },
  {
    what: "Foreign exchange rates",
    provider: "European Central Bank",
    status: "live",
    detail: "Official ECB reference rates, published once per business day.",
  },
  {
    what: "Earthquake / live events",
    provider: "USGS",
    status: "live",
    detail: "Real seismic events from the US Geological Survey public feed.",
  },
  {
    what: "News headlines",
    provider: "Google News RSS, via our own server",
    status: "live",
    detail: "Real published headlines. Sentiment and sector tagging are our own automated classification, not a wire-service rating.",
  },
  {
    what: "Equity prices",
    provider: "Finnhub (when configured)",
    status: "delayed",
    detail: "Delayed quotes on the free tier. Where no provider key is set, prices are a deterministic simulation for demonstration and are labelled SIM in the interface.",
  },
  {
    what: "Equity OHLCV / trading charts",
    provider: "Finnhub (premium) → Yahoo Finance chart → optional Alpha Vantage via /api/candles",
    status: "delayed",
    detail: "Finnhub free tier blocks /stock/candle (403) while quotes still work. The candle proxy falls back to Yahoo delayed history (labeled DELAYED), then optional ALPHA_VANTAGE_KEY. Without any provider response, charts use deterministic SIM candles — never presented as live history.",
  },
  {
    what: "Economic calendar (WORLD overlay)",
    provider: "Scheduled seed calendar (CPI / Fed / earnings)",
    status: "simulated",
    detail: "Near-term macro and earnings pins on the globe. Seeded schedule until a licensed calendar feed is wired; clearly a habit/overlay feature, not a wire-service feed.",
  },
  {
    what: "Index levels",
    provider: "Simulation",
    status: "simulated",
    detail: "Illustrative only. Do not use these figures for any decision.",
  },
  {
    what: "Country economic statistics",
    provider: "Static reference data",
    status: "simulated",
    detail: "GDP, inflation and policy rates are stored reference values, not a live macro feed. They may be out of date.",
  },
  {
    what: "Risk Index · AI Sentiment",
    provider: "Simulation",
    status: "simulated",
    detail: "Marked DEMO in the interface. These are placeholders for features we are building — they are not analysis and carry no informational value.",
  },
];

const STATUS_COPY: Record<Source["status"], { label: string; cls: string }> = {
  live: { label: "LIVE", cls: "live" },
  delayed: { label: "DELAYED", cls: "delayed" },
  simulated: { label: "SIMULATED", cls: "sim" },
};

export default function DataSources() {
  useSeo({
    title: "Where Our Market Data Comes From",
    description:
      "A plain, complete list of every data source in GFT Terminal — what is live, what is delayed, and what is simulated. No ambiguity.",
    path: "/data-sources",
  });

  const liveN = liveSymbolCount();

  return (
    <div className="cl">
      <header className="cl-head">
        <span className="label" style={{ color: "var(--cyan)" }}>DATA PROVENANCE</span>
        <h1>Where the numbers come from</h1>
        <p>
          Some of what you see here is real market data. Some of it is a
          simulation while we build. We would rather tell you exactly which is
          which than have you find out.
        </p>
      </header>

      <div className="ds-note">
        <b>Right now, {liveN > 0 ? `${liveN} instruments are on live feeds.` : "no equity provider key is configured on this deployment."}</b>{" "}
        Anything not on a live feed is labelled <span className="ds-inline sim">SIM</span> or{" "}
        <span className="ds-inline demo">DEMO</span> in the interface.
      </div>

      <div className="ds-table">
        {SOURCES.map((s) => {
          const st = STATUS_COPY[s.status];
          return (
            <div className="ds-row" key={s.what}>
              <div className="ds-what">
                <b>{s.what}</b>
                <span>{s.provider}</span>
              </div>
              <span className={`ds-status ${st.cls}`}>{st.label}</span>
              <p className="ds-detail">{s.detail}</p>
            </div>
          );
        })}
      </div>

      <footer className="cl-foot">
        <b>Nothing on this site is investment advice.</b> Market data is provided
        for information only, may be delayed, incomplete or simulated, and must
        not be relied on for trading decisions. Verify any figure with your
        broker or the exchange before acting on it.
      </footer>
    </div>
  );
}
