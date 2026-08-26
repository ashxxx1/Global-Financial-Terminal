/**
 * The page catalogue — one description of every public URL.
 *
 * Both the sitemap (item 30) and the prerenderer (items 85–88) read this, so a
 * route cannot be in the index without having content, and cannot have content
 * without entering the index. The previous sitemap generator scraped the data
 * modules with regular expressions; this imports them, which is why a ticker
 * with an unusual field order can no longer silently vanish from the index.
 *
 * ── The rule that governs what may appear here ──────────────────────────────
 * Prerendered HTML is written at build time and served for hours or days. A
 * price written into it is a lie the moment the market moves, and this product
 * exists to not do that. So every field below is a DURABLE fact — a name, a
 * listing venue, a sector, a definition — and never a quote, a change, a level
 * or a return. `scripts/prerender-tests.mjs` enforces this by scanning the
 * output for anything shaped like a price. Live figures arrive when the app
 * boots, from the same feeds as everywhere else.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STOCKS_BY_COUNTRY } from "../../src/data/stocksData.js";
import { COUNTRIES_DATA, GLOBAL_INDICES } from "../../src/data/mockData.js";
import { GLOSSARY } from "../../src/data/glossary.ts";
import { SECTORS } from "../../src/lib/sectors.ts";
import { availabilityOf, unavailableReason } from "../../src/lib/priceAvailability.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Share-card URL for a page.
 *
 * Prerendered HTML may not contain a price, but it may point at an endpoint
 * that resolves one per request — which is where a live figure belongs. The
 * symbol and country forms let /api/og look the instrument up itself; nothing
 * here passes it a number.
 */
const og = (params) => `/api/og?${new URLSearchParams(params).toString()}`;

const slugify = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ── shared lookups ──────────────────────────────────────────────────────── */

const CAPS = JSON.parse(await readFile(path.join(ROOT, "src/data/marketCaps.json"), "utf8"));

const CAP_WORD = {
  mega: "one of the largest listed companies in the world",
  large: "a large-cap company",
  mid: "a mid-cap company",
  small: "a small-cap company",
  micro: "a micro-cap company",
};

/** Every tracked equity, flattened, with its market attached. */
const EQUITIES = [];
for (const [country, list] of Object.entries(STOCKS_BY_COUNTRY)) {
  for (const s of list) {
    if (EQUITIES.some((e) => e.ticker === s.ticker)) continue;  // registry is first-wins
    EQUITIES.push({ ...s, country });
  }
}

const countryName = (code) => COUNTRIES_DATA[code]?.name || code;

/** Countries whose names take a definite article, so the prose reads as English
 *  rather than as a template ("trades in United States"). */
const ARTICLE = new Set(["US", "GB", "NL", "PH", "AE", "CZ"]);
const theName = (code, capitalise = false) =>
  ARTICLE.has(code) ? `${capitalise ? "The" : "the"} ${countryName(code)}` : countryName(code);
const sectorSlug = (name) => SECTORS.find((s) => s.match.includes(name))?.slug || slugify(name);

/**
 * Comparison pairs worth publishing: same sector, same market, adjacent in the
 * source order (which runs largest-first), capped per sector.
 *
 * Computed once and shared, because company pages link to comparisons and the
 * two lists drifting apart is how a site ends up linking to pages that are not
 * in its own sitemap.
 */
const COMPARE_PAIRS = [];
for (const [country, list] of Object.entries(STOCKS_BY_COUNTRY)) {
  const bySector = new Map();
  for (const s of list) {
    if (!bySector.has(s.sector)) bySector.set(s.sector, []);
    bySector.get(s.sector).push(s);
  }
  for (const [sector, members] of bySector) {
    // Ranked by market cap where we know it, because the pair people actually
    // search for is the two biggest names in a sector. Source order put Apple
    // outside the top five US technology names, so it had no comparison page
    // at all — the most-searched company on the site.
    const ranked = [...members].sort(
      (x, y) => (CAPS[`${country}:${y.ticker}`]?.usdM ?? 0) - (CAPS[`${country}:${x.ticker}`]?.usdM ?? 0),
    );
    for (let k = 0; k + 1 < Math.min(ranked.length, 5); k++) {
      COMPARE_PAIRS.push({ a: ranked[k], b: ranked[k + 1], sector, country });
    }
  }
}
const comparisonsFor = (ticker) =>
  COMPARE_PAIRS.filter((p) => p.a.ticker === ticker || p.b.ticker === ticker);

/** Same classification the market registry uses, so instrument links resolve. */
function classifyIndex(name) {
  if (/^(BTC|ETH|SOL|XRP|ADA|DOGE|LTC|DOT)\b/i.test(name)) return "crypto";
  if (/USD|EUR|GBP|JPY|DXY/.test(name)) return "fx";
  return "index";
}

/* ── page builders ───────────────────────────────────────────────────────── */

function landing() {
  const nCountries = Object.keys(COUNTRIES_DATA).length;
  return {
    path: "/",
    priority: "1.0", changefreq: "hourly",
    title: "Global Financial Terminal — The World's Economy, Live",
    description:
      `A living map of ${nCountries} markets: equities, currencies, crypto and the news that moves them, ` +
      "each labelled with where the number came from.",
    kicker: "GLOBAL FINANCIAL TERMINAL",
    h1: "The world's economy, on one screen",
    intro:
      `A live terminal covering ${nCountries} markets and ${EQUITIES.length} listed companies, built on one rule: ` +
      "every number says where it came from and how far to trust it. Prices are labelled live, cached or " +
      "unavailable — and where no feed reaches a market, the page says so instead of showing an invented figure.",
    body: [
      {
        h: "What is here",
        p: "Company research with every claim carrying its source and tier, a browsable market tree by country, " +
           "sector and size, live currency and crypto pages, comparison pages, and a weekly market note computed " +
           "from the same feeds the terminal runs on.",
      },
    ],
    links: [
      { href: "/markets/browse", text: "Browse markets by country and sector" },
      { href: "/glossary", text: "Glossary of market terms" },
      { href: "/blog", text: "Weekly market notes" },
      { href: "/data-sources", text: "Every data source we use" },
    ],
  };
}

function staticPages() {
  return [
    {
      path: "/markets", priority: "0.9", changefreq: "hourly",
      title: "Live Markets — Equities, Currencies, Crypto & Indices",
      description: "Live quotes across global equities, 18 currency pairs, 12 crypto pairs and index proxies, each with its true source and delay.",
      kicker: "MARKETS", h1: "Live markets",
      intro: `Quotes for ${EQUITIES.length} listed companies across ${Object.keys(STOCKS_BY_COUNTRY).length} markets, ` +
        "plus currencies, crypto and index proxies. Each row carries the feed it came from and how delayed it is.",
      links: [{ href: "/markets/browse", text: "Browse by country, sector and size" }, { href: "/compare", text: "Compare two companies" }],
    },
    {
      path: "/markets/browse", priority: "0.85", changefreq: "daily",
      title: "Browse Markets by Country, Sector and Company Size",
      description: "Every tracked market, broken down by country, then by sector, then by market-cap band — mega, large, mid, small and micro.",
      kicker: "BROWSE", h1: "Browse markets by country, sector and size",
      intro: "Start with a country, narrow to a sector, then to a size band. Companies we cannot price are still listed, " +
        "with the reason their market has no feed we can reach.",
      links: SECTORS.slice(0, 8).map((s) => ({ href: `/sector/${s.slug}`, text: `${s.name} companies` })),
    },
    {
      path: "/compare", priority: "0.85", changefreq: "daily",
      title: "Compare Two Companies Side by Side",
      description: "Put two companies next to each other on valuation, margins, returns and earnings history — with the source of every figure shown.",
      kicker: "COMPARE", h1: "Compare two companies",
      intro: "Comparison pages are built for same-sector, same-market pairs, because those are the comparisons someone " +
        "actually makes. Each metric shows the provider's own field name so the trail can be checked.",
    },
    {
      path: "/news", priority: "0.9", changefreq: "hourly",
      title: "Market News by Country and Sector",
      description: "Published market headlines grouped by the country and sector they hit, with sentiment derived from the articles themselves.",
      kicker: "NEWS", h1: "Market news, mapped to where it lands",
      intro: "Headlines as published, grouped by market. Sentiment is the classified average of real articles and returns " +
        "nothing below three of them, rather than colouring a whole country from one story.",
    },
    {
      path: "/impact", priority: "0.9", changefreq: "hourly",
      title: "Event Impact — Which Sectors and Companies an Event Reaches",
      description: "Maps an event to its transmission mechanism, then to the sectors and companies exposed to it, with historical precedent and confidence.",
      kicker: "IMPACT", h1: "Event impact analysis",
      intro: "Ask what an event does — an oil shock, a rate cut, a tariff — and get the chain: event, mechanism, sectors, " +
        "then the companies in our universe with exposure. Every link in the chain is labelled with how well the evidence supports it.",
    },
    {
      path: "/glossary", priority: "0.7", changefreq: "monthly",
      title: "Glossary of Market and Investing Terms",
      description: `Plain definitions of ${GLOSSARY.length} market terms, each with a worked example and the mistake people usually make with it.`,
      kicker: "GLOSSARY", h1: "Glossary of market terms",
      intro: `${GLOSSARY.length} terms, each written to actually answer the question: a plain definition, a worked example ` +
        "with real numbers, and where it matters, the misunderstanding that sends people wrong.",
      links: GLOSSARY.map((t) => ({ href: `/glossary/${t.slug}`, text: t.term })),
    },
    {
      path: "/data-sources", priority: "0.5", changefreq: "monthly",
      title: "Data Sources — Every Provider Behind Every Number",
      description: "The full list of providers behind the terminal, what each one serves, how delayed it is, and what we deliberately do not have.",
      kicker: "SOURCES", h1: "Where every number comes from",
      intro: "Each feed is listed with what it covers, its delay and its licence position. The page also names what we " +
        "cannot see, because a terminal that hides its gaps is harder to trust than one that lists them.",
    },
    {
      path: "/changelog", priority: "0.5", changefreq: "weekly",
      title: "Changelog — What Shipped and When",
      description: "A dated record of what changed in the terminal, including the corrections.",
      kicker: "CHANGELOG", h1: "Changelog",
      intro: "What shipped, when, and what it replaced — corrections included, since a changelog that only lists wins is marketing.",
    },
    {
      path: "/terms", priority: "0.3", changefreq: "yearly",
      title: "Terms of Service",
      description: "The terms covering use of the Global Financial Terminal, including the limits of what the data is for.",
      kicker: "LEGAL", h1: "Terms of Service",
      intro: "Nothing in the terminal is investment advice, and the data carries no warranty of accuracy or fitness for trading.",
    },
    {
      path: "/privacy", priority: "0.3", changefreq: "yearly",
      title: "Privacy Policy",
      description: "What data we hold, why, how long for, and how to export or erase it.",
      kicker: "LEGAL", h1: "Privacy Policy",
      intro: "Written against the controls that actually exist in the product: a consent gate, a full data export, and " +
        "account erasure — not against a template.",
    },
  ];
}

function signalsPages() {
  const base = {
    kicker: "SIGNALS", changefreq: "daily",
    intro: "One track record, published by CI against real market bars and committed to the repository — so the git " +
      "history is the audit trail proving nothing was back-filled after the fact.",
  };
  return [
    { ...base, path: "/terminal/signals", priority: "0.9", changefreq: "hourly",
      title: "Market Signals — Published, Resolved and Scored",
      description: "Signals generated on a schedule against real bars, resolved daily, with the full record public.",
      h1: "Market signals" },
    { ...base, path: "/signals/track-record", priority: "0.85",
      title: "Signal Track Record — Every Call, Won and Lost",
      description: "The complete published record: every signal, its outcome, and the hit rate — losses included.",
      h1: "Signal track record" },
    { ...base, path: "/terminal/signals/history", priority: "0.7",
      title: "Signal History — Every Signal We Have Published",
      description: "Every signal ever published, in the order it was issued, with the outcome that followed it — the losses as well as the wins.",
      h1: "Signal history" },
    { ...base, path: "/terminal/signals/performance", priority: "0.7",
      title: "Signal Performance — Hit Rate and Distribution",
      description: "Hit rate, average move and the full distribution of outcomes across the published record, computed from resolved signals rather than selected ones.",
      h1: "Signal performance" },
    { ...base, path: "/terminal/signals/methodology", priority: "0.6", changefreq: "monthly",
      title: "Signal Methodology — How Each Call Is Made",
      description: "The rules behind every signal, written down before the results, so the record can be judged against them.",
      h1: "Signal methodology" },
  ];
}

function countryPages() {
  return Object.entries(COUNTRIES_DATA).map(([code, c]) => {
    const list = STOCKS_BY_COUNTRY[code] || [];
    const sectors = [...new Set(list.map((s) => s.sector))].filter(Boolean);
    const priced = list.filter((s) => availabilityOf(s.ticker, "stock", code, s.name) === "coverable").length;
    const reason = list.length && priced === 0
      ? unavailableReason(list[0].ticker, "stock", code, list[0].name)
      : "";

    const facts = [
      ["Benchmark index", c.marketIndex],
      ["Exchange", c.exchange],
      ["Trading hours", `${c.tradingHours}`],
      ["Currency", c.currency],
      ["Companies tracked", String(list.length)],
      ["Sectors represented", String(sectors.length)],
    ];

    const body = [{
      h: `Companies we track in ${c.name}`,
      p: list.length
        ? `${list.length} listed companies in ${theName(code)} across ${sectors.length} sectors: ${sectors.join(", ")}. ` +
          (priced === list.length
            ? "All of them are on a live feed."
            : priced === 0
              ? `None of them carries a live price. ${reason}`
              : `${priced} of ${list.length} carry a live price; the rest are listed with the reason their line has no feed.`)
        : `We do not yet track individual listings in ${theName(code)}.`,
    }];

    return {
      path: `/country/${code}`,
      priority: "0.8", changefreq: "daily",
      title: `${c.name} Stock Market Today — Live Index, Currency & News`,
      description:
        `${c.name} markets: the ${c.marketIndex} benchmark, ${c.currency}, and ${list.length} listed companies on ` +
        `${c.exchange}, each labelled with its true price source.`,
      ogImage: og({ country: code }),
      kicker: "COUNTRY",
      h1: `${c.name} stock market`,
      intro:
        `${theName(code, true)} trades on ${c.exchange}, ${c.tradingHours}, in ${c.currency}. The benchmark on this page is the ` +
        `${c.marketIndex}, priced through a tracking fund rather than the index itself — we say which one on the page ` +
        "rather than rescaling it into a level we are not licensed to publish.",
      facts, body,
      links: [
        ...list.slice(0, 12).map((s) => ({ href: `/stock/${s.ticker}`, text: `${s.name} (${s.ticker})` })),
        ...sectors.slice(0, 4).map((s) => ({ href: `/sector/${sectorSlug(s)}`, text: `${s} companies worldwide` })),
      ],
    };
  });
}

function stockPages() {
  return EQUITIES.map((s) => {
    const c = COUNTRIES_DATA[s.country] || {};
    const cap = CAPS[`${s.country}:${s.ticker}`];
    const coverable = availabilityOf(s.ticker, "stock", s.country, s.name) === "coverable";
    const reason = coverable ? "" : unavailableReason(s.ticker, "stock", s.country, s.name);
    const peers = EQUITIES
      .filter((p) => p.sector === s.sector && p.country === s.country && p.ticker !== s.ticker)
      .slice(0, 5);

    const facts = [
      ["Ticker", s.ticker],
      ["Company", s.name],
      ["Country", countryName(s.country)],
      ["Exchange", c.exchange || "—"],
      ["Sector", s.sector],
      ["Trading currency", s.currency],
      ...(cap ? [["Size band", `${cap.band} cap`]] : []),
      ["Price feed", coverable ? "Live" : "Not available"],
    ];

    const body = [
      {
        h: `About ${s.name}`,
        p: `${s.name} trades as ${s.ticker} on ${c.exchange || "its home exchange"} in ${theName(s.country)}, ` +
           `in the ${s.sector.toLowerCase()} sector` +
           (cap ? `, and is ${CAP_WORD[cap.band] || "a listed company"}` : "") + ". " +
           (coverable
             ? "Its price on this page is fetched live when the page opens — it is deliberately not written into this " +
               "HTML, because a price baked into a cached page is wrong the moment the market moves."
             : reason + " We show no figure at all rather than a substitute."),
      },
      ...(peers.length ? [{
        h: "Comparable companies",
        p: `Same sector and same market: ${peers.map((p) => `${p.name} (${p.ticker})`).join(", ")}.`,
      }] : []),
    ];

    return {
      path: `/stock/${s.ticker}`,
      priority: "0.6", changefreq: "daily",
      title: `${s.name} (${s.ticker}) — Share Price, Research & Evidence`,
      description:
        `${s.name} (${s.ticker}), ${s.sector} on ${c.exchange || countryName(s.country)}. ` +
        (coverable
          ? "Live price, fundamentals and evidence-backed research where every claim shows its source."
          : `${reason} We publish the reason instead of a price.`),
      ogImage: og({ symbol: s.ticker }),
      kicker: "COMPANY",
      h1: `${s.name} (${s.ticker})`,
      intro: `${s.sector} · ${countryName(s.country)} · quoted in ${s.currency}` + (cap ? ` · ${cap.band} cap` : ""),
      facts, body,
      links: [
        { href: `/research/${s.ticker}`, text: `Research workspace for ${s.ticker}` },
        { href: `/country/${s.country}`, text: `${countryName(s.country)} market overview` },
        { href: `/sector/${sectorSlug(s.sector)}`, text: `All ${s.sector.toLowerCase()} companies` },
        ...comparisonsFor(s.ticker).slice(0, 3)
          .map((c) => ({ href: `/compare/${c.a.ticker}/${c.b.ticker}`, text: `${c.a.ticker} vs ${c.b.ticker}` })),
      ],
    };
  });
}

function sectorPages() {
  return SECTORS.map((sec) => {
    const members = EQUITIES.filter((e) => sec.match.includes(e.sector));
    const markets = [...new Set(members.map((m) => m.country))];
    return {
      path: `/sector/${sec.slug}`,
      priority: "0.75", changefreq: "daily",
      title: `${sec.name} Stocks — ${members.length} Companies Across ${markets.length} Markets`,
      description: `${sec.blurb} ${members.length} ${sec.name.toLowerCase()} companies across ${markets.length} markets, each with its own price source.`,
      ogImage: og({ title: `${sec.name} stocks`, subtitle: `${members.length} companies across ${markets.length} markets`, kind: "sector" }),
      kicker: "SECTOR",
      h1: `${sec.name} stocks`,
      intro: sec.blurb,
      facts: [
        ["Companies tracked", String(members.length)],
        ["Markets represented", String(markets.length)],
      ],
      body: [{
        h: `Where ${sec.name.toLowerCase()} companies are listed`,
        p: markets.length
          ? `Across ${markets.map(countryName).slice(0, 12).join(", ")}` +
            (markets.length > 12 ? ` and ${markets.length - 12} more markets.` : ".")
          : "No listings tracked yet.",
      }],
      links: members.slice(0, 20).map((m) => ({ href: `/stock/${m.ticker}`, text: `${m.name} (${m.ticker})` })),
    };
  });
}

function glossaryPages() {
  return GLOSSARY.map((t) => ({
    path: `/glossary/${t.slug}`,
    priority: "0.6", changefreq: "monthly",
    title: `${t.term} — Definition, Example and the Common Mistake`,
    description:
      `${t.short} With a worked example` +
      (t.pitfall ? ", the mistake people usually make," : "") +
      ` and how it relates to ${t.related.map((r) => (GLOSSARY.find((g) => g.slug === r)?.term || r).toLowerCase()).join(" and ")}.`,
    /** The numbers in a worked example are invented for the example. See the
     *  price rule at the top of this file and scripts/prerender-tests.mjs. */
    staticFigures: true,
    ogImage: og({ title: t.term, subtitle: t.short, kind: `glossary · ${t.category}` }),
    kicker: `GLOSSARY · ${t.category.toUpperCase()}`,
    h1: t.term,
    intro: t.short,
    body: [
      { h: "What it means", p: t.body },
      { h: "Worked example", p: t.example },
      ...(t.pitfall ? [{ h: "The common mistake", p: t.pitfall }] : []),
    ],
    links: t.related.map((r) => ({ href: `/glossary/${r}`, text: GLOSSARY.find((g) => g.slug === r)?.term || r })),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: t.term,
      description: t.short,
      inDefinedTermSet: { "@type": "DefinedTermSet", name: "GFT Market Glossary" },
    },
  }));
}

async function blogPages() {
  let index = [];
  try {
    index = JSON.parse(await readFile(path.join(ROOT, "public/blog/index.json"), "utf8"));
  } catch { return []; }
  if (!Array.isArray(index)) return [];

  const pages = [{
    path: "/blog", priority: "0.8", changefreq: "weekly",
    title: "Market Notes — Weekly Data Stories from Our Own Feeds",
    description: "Weekly market notes where every figure is computed from the same feeds the terminal runs on, and can be checked against the live product.",
    kicker: "NOTES", h1: "Market notes",
    intro: "Most market recaps are written from memory and a glance at a chart. Every figure in these is computed from " +
      "the feeds behind the terminal, so any of it can be checked against the live product. They report what moved and " +
      "deliberately do not explain why.",
    links: index.map((p) => ({ href: `/blog/${p.slug}`, text: p.title })),
  }];

  for (const meta of index) {
    let post = null;
    try {
      post = JSON.parse(await readFile(path.join(ROOT, "public/blog", `${meta.slug}.json`), "utf8"));
    } catch { /* index entry without a body: publish the summary only */ }

    const body = [];
    if (post?.takeaways?.length) {
      body.push({ h: "In short", p: post.takeaways.join(" ") });
    }
    for (const sec of post?.sections || []) {
      if (sec.note) body.push({ h: sec.title, p: sec.note });
    }
    if (post?.method) body.push({ h: "How this was made", p: post.method });

    pages.push({
      path: `/blog/${meta.slug}`,
      priority: "0.7", changefreq: "monthly", lastmod: meta.date,
      title: `${meta.title} — GFT Market Notes`,
      description: meta.summary,
      ogImage: og({ title: "Market note", subtitle: meta.summary, kind: `market note · ${meta.date}` }),
      kicker: `MARKET NOTE · ${meta.date}`,
      /** A move that happened in a named past week does not go stale. */
      staticFigures: true,
      h1: meta.title,
      intro: meta.summary,
      body,
      links: [{ href: "/blog", text: "All market notes" }],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: meta.title,
        description: meta.summary,
        datePublished: meta.date,
        author: { "@type": "Organization", name: "Global Financial Terminal" },
      },
    });
  }
  return pages;
}

function instrumentPages() {
  const seen = new Set();
  const out = [];
  for (const idx of GLOBAL_INDICES) {
    const kind = classifyIndex(idx.name);
    const slug = slugify(idx.name);
    const p = `/${kind}/${slug}`;
    if (seen.has(p)) continue;
    seen.add(p);

    const coverable = availabilityOf(idx.name, kind, null, idx.name) === "coverable";
    const what =
      kind === "crypto" ? `${idx.name} is a crypto pair, priced live from the Binance public stream.`
      : kind === "fx" ? `${idx.name} is a currency pair. Rates come from the European Central Bank's daily reference set, with cross-rates derived from it.`
      : `${idx.name} is a stock-market index. We are not licensed to publish index levels, so it is priced through a fund that tracks it — named inline on the page — rather than rescaled into a synthetic level.`;

    out.push({
      path: p,
      priority: "0.7", changefreq: "hourly",
      title: `${idx.name} — Live ${kind === "fx" ? "Rate" : kind === "crypto" ? "Price" : "Level"} and Source`,
      description: `${idx.name}: what it is, where the number comes from, and how delayed it is.`,
      ogImage: og({ title: idx.name, subtitle: `Live ${kind} · source and delay stated`, kind }),
      kicker: kind.toUpperCase(),
      h1: idx.name,
      intro: what,
      body: [{
        h: "Where the number comes from",
        p: coverable
          ? what + " The current figure is fetched when the page opens rather than written into this file, so nothing here can go stale."
          : unavailableReason(idx.name, kind, null, idx.name),
      }],
      links: [{ href: "/markets", text: "All live markets" }],
    });
  }
  return out;
}

function comparisonPages() {
  return COMPARE_PAIRS.map(({ a, b, sector, country }) => ({
    path: `/compare/${a.ticker}/${b.ticker}`,
    priority: "0.75", changefreq: "daily",
    title: `${a.ticker} vs ${b.ticker} — ${a.name} or ${b.name}?`,
    description:
      `${a.name} and ${b.name} side by side: both ${sector.toLowerCase()} companies listed in ` +
      `${theName(country)}, compared on valuation, margins and earnings history.`,
    ogImage: og({ title: `${a.ticker} vs ${b.ticker}`, subtitle: `${a.name} and ${b.name} · ${sector} · ${countryName(country)}`, kind: "comparison" }),
    kicker: "COMPARISON",
    h1: `${a.name} vs ${b.name}`,
    intro: `Both are ${sector.toLowerCase()} companies listed in ${theName(country)}, which is what makes the ` +
      "comparison meaningful — the multiples are formed by the same market and the same sector economics.",
    facts: [
      [a.ticker, `${a.name} · ${sector} · ${a.currency}`],
      [b.ticker, `${b.name} · ${sector} · ${b.currency}`],
      ["Market", countryName(country)],
    ],
    body: [{
      h: "How the comparison is built",
      p: "Every metric on the page carries the provider's own field name, so the figure can be looked up again " +
         "rather than taken on trust. Where a metric is missing for one of the two, the row says so instead of " +
         "quietly comparing against a blank.",
    }],
    links: [
      { href: `/stock/${a.ticker}`, text: `${a.name} (${a.ticker})` },
      { href: `/stock/${b.ticker}`, text: `${b.name} (${b.ticker})` },
      { href: `/sector/${sectorSlug(sector)}`, text: `All ${sector.toLowerCase()} companies` },
    ],
  }));
}

/* ── the catalogue ───────────────────────────────────────────────────────── */

export async function allPages() {
  const pages = [
    landing(),
    ...staticPages(),
    ...signalsPages(),
    ...countryPages(),
    ...stockPages(),
    ...sectorPages(),
    ...glossaryPages(),
    ...(await blogPages()),
    ...instrumentPages(),
    ...comparisonPages(),
  ];

  const seen = new Set();
  for (const p of pages) {
    if (seen.has(p.path)) throw new Error(`duplicate page path: ${p.path}`);
    seen.add(p.path);
    p.lastmod ||= TODAY;
    p.priority ||= "0.6";
    p.changefreq ||= "weekly";
    if (!p.title || !p.description) throw new Error(`page missing title/description: ${p.path}`);
  }
  return pages;
}

export const COUNTS = () => ({
  countries: Object.keys(COUNTRIES_DATA).length,
  equities: EQUITIES.length,
  sectors: SECTORS.length,
  terms: GLOSSARY.length,
});
