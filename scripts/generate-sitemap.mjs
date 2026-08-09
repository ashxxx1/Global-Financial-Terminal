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
const SITE = process.env.SITE_URL || "https://global-financial-news.vercel.app";

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

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const codes = await countryCodes();
  const syms = await tickers();

  const entries = [
    url("/", { changefreq: "hourly", priority: "1.0", lastmod: today }),
    url("/markets", { changefreq: "hourly", priority: "0.9", lastmod: today }),
    url("/terminal/signals", { changefreq: "hourly", priority: "0.95", lastmod: today }),
    url("/signals/track-record", { changefreq: "daily", priority: "0.9", lastmod: today }),
    url("/terminal/signals/history", { changefreq: "daily", priority: "0.8", lastmod: today }),
    url("/terminal/signals/performance", { changefreq: "daily", priority: "0.8", lastmod: today }),
    url("/terminal/signals/methodology", { changefreq: "monthly", priority: "0.6", lastmod: today }),
    url("/news", { changefreq: "hourly", priority: "0.9", lastmod: today }),
    url("/changelog", { changefreq: "weekly", priority: "0.5", lastmod: today }),
    url("/data-sources", { changefreq: "monthly", priority: "0.4", lastmod: today }),
    ...codes.map((c) => url(`/country/${c}`, { priority: "0.8", lastmod: today })),
    ...syms.map((s) => url(`/stock/${s}`, { priority: "0.6", lastmod: today })),
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
