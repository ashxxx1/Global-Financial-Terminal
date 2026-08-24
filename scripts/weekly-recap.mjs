/**
 * The weekly market recap — growth-plan items 101, 102 and 104.
 *
 * The plan calls a weekly market post "your unfair advantage", and the reason
 * is worth being precise about: most market recaps are written from memory and
 * a glance at a chart. Ours is computed from the same feeds the terminal runs
 * on, so every figure in it is one someone can check against the live product.
 *
 * That also sets the constraint. This generator states what the data shows and
 * stops. It does not explain why anything moved, because attributing a move
 * needs evidence this script does not have — and a recap that guesses at causes
 * is the thin, wrong content item 100 exists to keep off the site.
 *
 *   node scripts/weekly-recap.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";

const SITE = process.env.SITE || "https://global-financial-terminal-eight.vercel.app";
const OUT_DIR = path.join(process.cwd(), "public", "blog");
const DRY = process.argv.includes("--dry");

/** Index-tracking ETFs, so a market's week is a real traded return. */
const MARKETS = [
  ["S&P 500", "SPY", "United States"], ["Nasdaq 100", "QQQ", "United States"],
  ["FTSE 100", "EWU", "United Kingdom"], ["DAX", "EWG", "Germany"],
  ["Nikkei 225", "EWJ", "Japan"], ["Hang Seng", "EWH", "Hong Kong"],
  ["CAC 40", "EWQ", "France"], ["ASX 200", "EWA", "Australia"],
  ["Nifty 50", "INDA", "India"], ["Bovespa", "EWZ", "Brazil"],
];
const COMMODITIES = [["Gold", "GLD"], ["Oil", "USO"], ["Silver", "SLV"], ["Copper", "CPER"]];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Weekly return from real daily closes. Null when history is short. */
async function weekReturn(ticker) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 20 * 86400;
  try {
    const r = await fetch(`${SITE}/api/candles?symbol=${ticker}&resolution=D&from=${from}&to=${to}`);
    if (!r.ok) return null;
    const { candles } = await r.json();
    if (!Array.isArray(candles) || candles.length < 6) return null;
    const last = candles[candles.length - 1];
    const prior = candles[candles.length - 6];   // five sessions back
    if (!(prior.c > 0)) return null;
    return { pct: ((last.c - prior.c) / prior.c) * 100, close: last.c, at: last.t };
  } catch { return null; }
}

async function collect(list) {
  const out = [];
  for (const [name, ticker, country] of list) {
    const r = await weekReturn(ticker);
    if (r) out.push({ name, ticker, country, ...r });
    await sleep(250);
  }
  return out;
}

const markets = await collect(MARKETS);
const commodities = await collect(COMMODITIES.map(([n, t]) => [n, t, ""]));

if (markets.length < 3) {
  console.error(`only ${markets.length} markets resolved — refusing to publish a recap this thin`);
  process.exit(1);
}

const byPct = [...markets].sort((a, b) => b.pct - a.pct);
const best = byPct[0], worst = byPct[byPct.length - 1];
const advancing = markets.filter((m) => m.pct > 0).length;
const spread = best.pct - worst.pct;

const now = new Date();
const iso = now.toISOString().slice(0, 10);
const week = `${now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;
const fmt = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

/** The one paragraph of interpretation, and it stays descriptive. */
const dispersion = spread > 6
  ? `A ${spread.toFixed(1)} point spread between the strongest and weakest market is wide: where you were invested mattered more than whether you were invested.`
  : `The spread between strongest and weakest was ${spread.toFixed(1)} points, which is narrow — markets moved largely together rather than on local news.`;

const post = {
  slug: `market-week-${iso}`,
  title: `What the world's markets did — week to ${week}`,
  date: iso,
  kind: "weekly-recap",
  summary: `${advancing} of ${markets.length} major markets rose over the week. ${best.name} led at ${fmt(best.pct)}; ${worst.name} lagged at ${fmt(worst.pct)}.`,
  sections: [
    {
      heading: "Markets",
      note: "Five-session returns, measured from the closing prices of each market's index-tracking fund.",
      rows: markets.map((m) => ({ label: m.name, meta: m.country, value: fmt(m.pct), raw: m.pct })),
    },
    ...(commodities.length ? [{
      heading: "Commodities",
      note: "Priced through the same tracking funds the terminal uses; the change is real, the level is the fund's.",
      rows: commodities.map((c) => ({ label: c.name, meta: "", value: fmt(c.pct), raw: c.pct })),
    }] : []),
  ],
  takeaways: [
    `${advancing} of ${markets.length} markets advanced.`,
    `${best.name} was strongest at ${fmt(best.pct)}; ${worst.name} weakest at ${fmt(worst.pct)}.`,
    dispersion,
  ],
  method:
    "Every figure here is computed from daily closing prices through the same feeds the terminal runs on, so you can check any of it against the live product. Returns are five-session, not calendar-week. This post reports what moved and deliberately does not explain why: attributing a market move needs evidence this generator does not have, and a guess dressed as analysis is worse than none.",
  generatedAt: now.toISOString(),
};

const indexPath = path.join(OUT_DIR, "index.json");
let index = [];
try { index = JSON.parse(fs.readFileSync(indexPath, "utf8")); } catch { index = []; }

console.log(`${post.title}\n  ${post.summary}`);
for (const t of post.takeaways) console.log(`  - ${t}`);

if (DRY) { console.log("\n--dry: not writing"); process.exit(0); }

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, `${post.slug}.json`), JSON.stringify(post, null, 1));
index = [{ slug: post.slug, title: post.title, date: post.date, summary: post.summary, kind: post.kind },
         ...index.filter((p) => p.slug !== post.slug)].slice(0, 200);
fs.writeFileSync(indexPath, JSON.stringify(index, null, 1));
console.log(`\nwrote ${post.slug}.json — ${index.length} posts in index`);
