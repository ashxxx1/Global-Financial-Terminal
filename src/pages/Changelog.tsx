import { useSeo } from "../lib/seo";

/**
 * Public changelog — growth-plan item 50.
 *
 * Shipping visibly is a trust signal for an early product: it tells a visitor
 * this is maintained rather than abandoned, and it gives the build-in-public
 * posts (item 54) something concrete to link to. Also an SEO surface that
 * updates on its own cadence.
 *
 * Entries are hand-written on purpose — a generated commit dump is noise to
 * anyone who is not us.
 */

interface Entry {
  date: string;
  version?: string;
  title: string;
  items: { kind: "new" | "improved" | "fixed"; text: string }[];
}

const ENTRIES: Entry[] = [
  {
    date: "2026-08-23",
    version: "1.7",
    title: "GFT Anomaly Detector on Markets",
    items: [
      { kind: "new", text: "Markets now surfaces the top five statistical anomalies — extreme price and volume prints, news-versus-price splits, sector residuals, broken pair correlations, and macro pattern breaks — ranked by a 0–100 score." },
      { kind: "new", text: "Investigate opens an evidence drawer: summary, interpretation, factor table (normal vs current), possible explanations, and jumps to Chart, News, or Impact. Framing is evidence, not a trade call." },
    ],
  },
  {
    date: "2026-08-19",
    version: "1.6",
    title: "Your portfolio, and your broker's own file",
    items: [
      { kind: "new", text: "Portfolio tracking. Add holdings by hand, paste rows, or drop in your broker's export. Value, cost basis, total P&L, today's P&L, and allocation by country and sector." },
      { kind: "new", text: "Broker exports are detected automatically — Schwab, Fidelity, Vanguard, Robinhood, E*TRADE, Interactive Brokers, Zerodha, Groww, Trading 212, Hargreaves Lansdown, DEGIRO, Trade Republic, Wealthsimple and Coinbase. We never ask for a brokerage login; there is nothing to connect." },
      { kind: "new", text: "Totals convert to USD using ECB reference rates across 26 currencies. Holdings in a currency we cannot convert are left out of the total and named on screen rather than dropped silently." },
      { kind: "fixed", text: "A broker column giving the cost of a whole position rather than a per-share price used to be read as the per-share price — turning a 72% gain into a reported 93% loss. It is now detected from the column name and divided down, and the adjustment is shown." },
      { kind: "fixed", text: "European exports that write 1.549,80 rather than 1,549.80 were being read as 154980. Both conventions now parse." },
      { kind: "improved", text: "Import tells you what it skipped and why — cash rows, subtotals, tickers we do not track, and any ticker it had to adjust to match." },
    ],
  },
  {
    date: "2026-08-19",
    version: "1.5",
    title: "400 more companies priced on their own exchanges",
    items: [
      { kind: "new", text: "Non-US shares are now priced on their home exchange in their own currency — Tokyo, Mumbai, Seoul, Shanghai, Riyadh, Johannesburg, São Paulo and more. 443 of 593 companies are on live prices, up from 178." },
      { kind: "improved", text: "This replaces the old approach of pricing foreign companies through their US listing, which quoted them in dollars and mixed a currency move into the daily change." },
      { kind: "fixed", text: "London quotes in pence and Johannesburg in cents. Those are now converted, so Shell reads £33.99 rather than £3,399." },
      { kind: "fixed", text: "The source badge on a stock page could describe a different feed than the price beside it. It now names the actual exchange the quote came from." },
    ],
  },
  {
    date: "2026-08-15",
    version: "1.4",
    title: "Research that shows its working",
    items: [
      { kind: "new", text: "A research panel that answers questions about any company from real data: why a stock is moving, what changed last quarter, whether the valuation is expensive against its own history, earnings momentum, and key risks." },
      { kind: "new", text: "Every statement is labelled FACT, CALCULATION, INFERENCE or OPINION, and every calculation shows its inputs and formula so you can recompute it yourself." },
      { kind: "new", text: "When you ask for something we do not have — price targets, earnings-call transcripts, analyst estimates — it says so by name and offers the closest thing it can answer, instead of quietly answering a different question." },
      { kind: "fixed", text: "Replaced the old 'Terminal AI' panel, which invented figures it had never looked up." },
      { kind: "fixed", text: "Margin and return trends were being reported at a hundredth of their true size, so a 16-point move in profitability read as 0.16. Now correct, with a test that fails if it ever regresses." },
      { kind: "improved", text: "Uptime monitoring and crash reporting, so an outage or a blank page reaches us without anyone having to report it." },
    ],
  },
  {
    date: "2026-08-10",
    version: "1.3",
    title: "Say where every number comes from",
    items: [
      { kind: "new", text: "Every instrument now states its real source and delay: crypto is LIVE from Binance, FX is the ECB's daily fix, US shares are delayed quotes, and simulated series say SIMULATED." },
      { kind: "fixed", text: "The markets and country pages used to show a blanket 'SIM' badge even when the data behind it was live. They no longer misreport their own source." },
      { kind: "fixed", text: "An open stock page now refreshes its own price every couple of seconds instead of waiting for a full sweep of every ticker." },
      { kind: "fixed", text: "If the quote service is briefly unconfigured the app keeps re-checking, so prices go live on their own instead of staying frozen until a reload." },
      { kind: "new", text: "Terms of Service and Privacy Policy, plus one-click data export and account deletion." },
      { kind: "improved", text: "Generated commentary and its confidence scores are now clearly marked DEMO, so they can't be mistaken for research." },
    ],
  },
  {
    date: "2026-08-08",
    version: "1.2",
    title: "Real prices, and a guided first run",
    items: [
      { kind: "new", text: "Live US share prices, fetched server-side so no key is ever exposed in the browser." },
      { kind: "new", text: "A short guided tour of the globe — drag, zoom, and click a country — replayable any time from the '?' in the nav." },
      { kind: "new", text: "Prices now say when they're from: 'At Fri close' on a weekend beats a number that looks stuck." },
      { kind: "new", text: "A public data-sources page listing every provider and exactly what's live, delayed or simulated." },
    ],
  },
  {
    date: "2026-07-31",
    version: "1.1",
    title: "Know your markets from the first screen",
    items: [
      { kind: "new", text: "First-run setup: pick the markets you care about and the terminal opens on them." },
      { kind: "new", text: "Feedback button — tell us what's broken or missing without leaving the app." },
      { kind: "improved", text: "Empty states now offer a next step instead of just stating a fact." },
      { kind: "fixed", text: "Sparklines no longer show a colour that disagrees with the percentage beside them." },
    ],
  },
  {
    date: "2026-07-29",
    title: "Faster, and findable",
    items: [
      { kind: "improved", text: "Cut the initial download by 93% — the app starts far faster, especially on mobile data." },
      { kind: "new", text: "Every country and ticker page now has its own title and description for search." },
      { kind: "new", text: "A persistent 'not investment advice' note on every data screen." },
    ],
  },
  {
    date: "2026-07-28",
    title: "Accounts, and a front door",
    items: [
      { kind: "new", text: "Sign in with Google or email; your watchlist follows your account across devices." },
      { kind: "new", text: "A proper landing page — see what this is before signing up." },
      { kind: "new", text: "Sector heat map and market-pulse gauge on the Markets page." },
      { kind: "fixed", text: "Live news headlines are working again after an upstream provider failure." },
    ],
  },
  {
    date: "2026-07-27",
    title: "A terminal that reads at a glance",
    items: [
      { kind: "new", text: "Global exchange sessions — see which markets are open right now, with local clocks." },
      { kind: "new", text: "Market breadth: whether a move is broad or a few large names carrying it." },
      { kind: "new", text: "Sparklines on every mover, so you see the trend, not just today's number." },
    ],
  },
];

const KIND_LABEL: Record<Entry["items"][number]["kind"], string> = {
  new: "NEW",
  improved: "IMPROVED",
  fixed: "FIXED",
};

export default function Changelog() {
  useSeo({
    title: "Changelog — What's New",
    description:
      "Every improvement to GFT Terminal, in plain language. New features, fixes and performance work, shipped continuously.",
    path: "/changelog",
  });

  return (
    <div className="cl">
      <header className="cl-head">
        <span className="label" style={{ color: "var(--cyan)" }}>CHANGELOG</span>
        <h1>What's new</h1>
        <p>
          We ship continuously. Everything worth telling you about, in plain
          language — no version-number theatre.
        </p>
      </header>

      <ol className="cl-list">
        {ENTRIES.map((e) => (
          <li className="cl-entry" key={e.date}>
            <div className="cl-meta">
              <time dateTime={e.date} className="mono">
                {new Date(e.date + "T00:00:00Z").toLocaleDateString(undefined, {
                  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
                })}
              </time>
              {e.version && <span className="cl-version">v{e.version}</span>}
            </div>
            <div className="cl-body">
              <h2>{e.title}</h2>
              <ul>
                {e.items.map((it) => (
                  <li key={it.text}>
                    <span className={`cl-kind ${it.kind}`}>{KIND_LABEL[it.kind]}</span>
                    {it.text}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <footer className="cl-foot">
        Missing something you need?{" "}
        <b>Use the Feedback button — we read every one.</b>
      </footer>
    </div>
  );
}
