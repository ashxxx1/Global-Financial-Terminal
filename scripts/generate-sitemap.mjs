#!/usr/bin/env node
/**
 * Sitemap generator — growth-plan item 30.
 *
 * Runs at build time so the sitemap always matches the shipped data rather
 * than drifting out of date. Emits every indexable route: the landing page,
 * the static sections, all 68 country pages and every ticker page.
 *
 * This is also the scaffold for the programmatic SEO push (plan items 89–94):
 * when new page templates land, add them here and they enter the index
 * automatically.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = process.env.SITE_URL || "https://global-financial-terminal-eight.vercel.app";

/** Published market notes — growth-plan items 101, 102. */
async function blogPaths() {
  try {
    const raw = await readFile(path.join(ROOT, "public", "blog", "index.json"), "utf8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map((p) => ({ slug: p.slug, date: p.date })) : [];
  } catch {
    return [];   // no posts yet is not an error
  }
}

/**
 * Comparison pairs worth publishing.
 *
 * Same-sector, same-market pairs only. "AAPL vs JPM" is a page nobody searches
 * for and we would be generating it purely to inflate a URL count — which is
 * the thin-content trap item 100 exists to avoid. Pairing within a sector keeps
 * every page a comparison someone might actually make.
 *
 * Capped per sector so the sitemap stays a set of pages we would defend, rather
 * than every combination the maths allows.
 */
async function comparisonPaths() {
  const src = await readFile(path.join(ROOT, "src", "data", "stocksData.js"), "utf8");
  const blocks = [...src.matchAll(/^\s*([A-Z]{2}):\s*\[/gm)];
  const out = [];

  for (let i = 0; i < blocks.length; i++) {
    const chunk = src.slice(blocks[i].index, i + 1 < blocks.length ? blocks[i + 1].index : src.length);
    const rows = [...chunk.matchAll(/ticker:\s*"([^"]+)"[^}]*?sector:\s*"([^"]+)"/g)]
      .map((m) => ({ ticker: m[1], sector: m[2] }));

    const bySector = new Map();
    for (const r of rows) {
      if (!bySector.has(r.sector)) bySector.set(r.sector, []);
      bySector.get(r.sector).push(r.ticker);
    }
    for (const [, tickers] of bySector) {
      // Adjacent pairs within a sector: the largest names sit first in the
      // source data, so this pairs the ones people actually compare.
      for (let k = 0; k + 1 < Math.min(tickers.length, 5); k++) {
        out.push(`/compare/${tickers[k]}/${tickers[k + 1]}`);
      }
    }
  }
  return [...new Set(out)];
}

/**
 * Index, currency-pair and crypto slugs, read from the same data module the app
 * builds its registry from — so the sitemap cannot drift from the routes that
 * actually resolve.
 */
async function instrumentPaths() {
  const src = await readFile(path.join(ROOT, "src", "data", "mockData.js"), "utf8");
  const names = [...src.matchAll(/name:\s*"([^"]+)",\s*value:/g)].map((m) => m[1]);
  const slug = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const out = [];
  for (const n of names) {
    // Same classification the registry uses: crypto first, then FX, else index.
    const seg = /^(BTC|ETH|SOL|XRP|ADA|DOGE|LTC|DOT)\b/i.test(n) ? "crypto"
      : /\//.test(n) ? "fx" : "index";
    out.push(`/${seg}/${slug(n)}`);
  }
  return [...new Set(out)];
}

/** Pull the country codes out of the data module without importing JSX/TS. */
async function countryCodes() {
  const src = await readFile(path.join(ROOT, "src/data/countryStats.js"), "utf8");
  return [...src.matchAll(/^\s{2}([A-Z]{2}):\s*\{/gm)].map((m) => m[1]);
}

/** Pull every ticker from the stock registry. */
async function tickers() {
  const src = await readFile(path.join(ROOT, "src/data/stocksData.js"), "utf8");
  const found = [...src.matchAll(/ticker:\s*"([^"]+)"/g)].map((m) => m[1]);
  return [...new Set(found)];
}

const url = (loc, { changefreq = "daily", priority = "0.7", lastmod }) =>
  `  <url>\n    <loc>${SITE}${loc}</loc>\n` +
  (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
  `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

/** Term slugs, read straight from the source so the sitemap cannot drift. */
async function glossary() {
  const src = await readFile(new URL("../src/data/glossary.ts", import.meta.url), "utf8");
  return [...src.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

async function main() {
  const glossarySlugs = await glossary();
  const today = new Date().toISOString().slice(0, 10);
  const codes = await countryCodes();
  const instruments = await instrumentPaths();
  const comparisons = await comparisonPaths();
  const posts = await blogPaths();
  const syms = await tickers();

  const entries = [
    url("/", { changefreq: "hourly", priority: "1.0", lastmod: today }),
    url("/markets", { changefreq: "hourly", priority: "0.9", lastmod: today }),
    url("/compare", { changefreq: "daily", priority: "0.85", lastmod: today }),
    url("/sector/technology", { changefreq: "daily", priority: "0.8", lastmod: today }),
    url("/sector/banking-finance", { changefreq: "daily", priority: "0.75", lastmod: today }),
    url("/sector/energy", { changefreq: "daily", priority: "0.75", lastmod: today }),
    url("/sector/healthcare", { changefreq: "daily", priority: "0.75", lastmod: today }),
    url("/sector/consumer", { changefreq: "daily", priority: "0.75", lastmod: today }),
    url("/terminal/signals", { changefreq: "hourly", priority: "0.95", lastmod: today }),
    url("/signals/track-record", { changefreq: "daily", priority: "0.9", lastmod: today }),
    url("/terminal/signals/history", { changefreq: "daily", priority: "0.8", lastmod: today }),
    url("/terminal/signals/performance", { changefreq: "daily", priority: "0.8", lastmod: today }),
    url("/terminal/signals/methodology", { changefreq: "monthly", priority: "0.6", lastmod: today }),
    url("/news", { changefreq: "hourly", priority: "0.9", lastmod: today }),
    url("/impact", { changefreq: "hourly", priority: "0.95", lastmod: today }),
    url("/blog", { changefreq: "weekly", priority: "0.8", lastmod: today }),
    ...posts.map((p) => url(`/blog/${p.slug}`, { changefreq: "monthly", priority: "0.7", lastmod: p.date })),
    url("/changelog", { changefreq: "weekly", priority: "0.5", lastmod: today }),
    url("/data-sources", { changefreq: "monthly", priority: "0.4", lastmod: today }),
    url("/glossary", { changefreq: "monthly", priority: "0.7", lastmod: today }),
    ...glossarySlugs.map((g) => url(`/glossary/${g}`, { changefreq: "monthly", priority: "0.6", lastmod: today })),
    url("/terms", { changefreq: "yearly", priority: "0.3", lastmod: today }),
    url("/privacy", { changefreq: "yearly", priority: "0.3", lastmod: today }),
    ...codes.map((c) => url(`/country/${c}`, { priority: "0.8", lastmod: today })),
    ...syms.map((s) => url(`/stock/${s}`, { priority: "0.6", lastmod: today })),
    // Index, currency and crypto pages — growth-plan items 92, 93, 94.
    ...instruments.map((pth) => url(pth, { changefreq: "hourly", priority: "0.7", lastmod: today })),
    // Comparison templates — growth-plan item 95. Ranked 2nd in
    // docs/SEO-PRIORITIES.md because the answer is the product here, not the
    // quote, so it is a page the incumbents do not already own.
    ...comparisons.map((pth) => url(pth, { changefreq: "daily", priority: "0.75", lastmod: today })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>\n`;

  await writeFile(path.join(ROOT, "public/sitemap.xml"), xml);

  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Auth screens carry no crawlable value",
    "Disallow: /login",
    "",
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ].join("\n");
  await writeFile(path.join(ROOT, "public/robots.txt"), robots);

  console.log(
    `  sitemap: ${entries.length} urls (${codes.length} countries, ${syms.length} tickers) -> public/sitemap.xml`,
  );
}

main().catch((e) => {
  console.error("sitemap generation failed:", e.message);
  process.exit(1);
});
