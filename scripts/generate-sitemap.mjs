#!/usr/bin/env node
/**
 * Sitemap and robots.txt — growth-plan item 30.
 *
 * Reads the same catalogue the prerenderer does (scripts/lib/pages.mjs), so a
 * URL cannot be advertised to Google without having a document behind it, and
 * a document cannot be built without entering the index.
 *
 * This used to scrape the data modules with regular expressions. It now imports
 * them: the catalogue is built from the real registries, which is why a company
 * whose fields are written in an unexpected order can no longer quietly drop
 * out of the index.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPages, COUNTS } from "./lib/pages.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE_URL || "https://global-financial-terminal-eight.vercel.app").replace(/\/+$/, "");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  const pages = await allPages();

  const entries = pages.map((p) =>
    `  <url>\n    <loc>${esc(SITE + (p.path === "/" ? "/" : p.path))}</loc>\n` +
    `    <lastmod>${p.lastmod}</lastmod>\n` +
    `    <changefreq>${p.changefreq}</changefreq>\n` +
    `    <priority>${p.priority}</priority>\n  </url>`,
  );

  await writeFile(
    path.join(ROOT, "public/sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`,
  );

  await writeFile(path.join(ROOT, "public/robots.txt"), [
    "User-agent: *",
    "Allow: /",
    "",
    "# Auth screens carry no crawlable value",
    "Disallow: /login",
    "",
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ].join("\n"));

  const c = COUNTS();
  console.log(
    `  sitemap: ${entries.length} urls (${c.countries} countries, ${c.equities} companies, ` +
    `${c.sectors} sectors, ${c.terms} terms) -> public/sitemap.xml`,
  );
}

main().catch((e) => {
  console.error("sitemap generation failed:", e.message);
  process.exit(1);
});
