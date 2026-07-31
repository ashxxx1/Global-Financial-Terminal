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
