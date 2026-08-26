#!/usr/bin/env node
/**
 * Gate on the prerendered output — growth-plan item 87.
 *
 * The check that matters most is the third one. Prerendered HTML is written at
 * build time and served from a CDN for the life of the deployment, so a market
 * figure written into it is stale the moment the market moves. This suite fails
 * the build if anything price-shaped reaches a prerendered page, which makes the
 * rule structural rather than a habit someone has to remember.
 *
 * A page is exempt only if the catalogue declares `staticFigures` on it, which
 * today means dated market notes and glossary worked examples: "Bovespa led at
 * +3.52% in the week to 24 August 2026" is a historical fact that does not
 * decay, and "$6 of earnings" in a P/E example is invented for the example. A
 * price on a company page is neither. The exemption is a declaration on the
 * page rather than a URL prefix, so a new template has to opt in deliberately.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPages } from "./lib/pages.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

let failures = 0;
const fail = (msg) => { failures++; console.error(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

/** Anything that reads as a live market figure. */
const PRICE_SHAPES = [
  { re: /[+-]\d+(\.\d+)?%/, what: "a signed percentage change" },
  { re: /[$£€¥₹]\s?\d/, what: "a currency amount" },
  { re: /\b\d{1,3}(,\d{3})+(\.\d+)?\b/, what: "a comma-grouped number (an index level)" },
];

const fileFor = (p) =>
  path.join(DIST, ...(p === "/" ? [] : p.split("/").filter(Boolean)), "index.html");

const shellOf = (html) => {
  const m = html.match(/<div id="seo-shell">([\s\S]*?)<div id="root">/);
  return m ? m[1] : "";
};
/**
 * Tags become a visible separator, not whitespace. Collapsing them to a space
 * glued a currency symbol in one cell to the ticker in the next — "¥" + "8316"
 * read as a price the page never claimed.
 */
const textOf = (html) => shellOf(html).replace(/<[^>]+>/g, " ¦ ").replace(/\s+/g, " ").trim();

async function main() {
  const pages = await allPages();
  console.log(`prerender gate — ${pages.length} pages\n`);

  /* 1. every advertised URL has a document */
  const missing = pages.filter((p) => !existsSync(fileFor(p.path)));
  missing.length
    ? fail(`${missing.length} pages have no HTML file (first: ${missing[0].path})`)
    : ok(`every one of the ${pages.length} catalogue URLs has a prerendered document`);

  /* 2. titles and descriptions are unique and usable */
  const titles = new Map();
  const descs = new Map();
  for (const p of pages) {
    titles.set(p.title, (titles.get(p.title) || 0) + 1);
    descs.set(p.description, (descs.get(p.description) || 0) + 1);
  }
  const dupT = [...titles].filter(([, n]) => n > 1);
  const dupD = [...descs].filter(([, n]) => n > 1);
  dupT.length ? fail(`${dupT.length} duplicate titles (first: ${dupT[0][0]})`) : ok("every title is unique");
  dupD.length ? fail(`${dupD.length} duplicate descriptions (first: ${dupD[0][0]})`) : ok("every description is unique");

  const shortDesc = pages.filter((p) => p.description.length < 60);
  shortDesc.length
    ? fail(`${shortDesc.length} descriptions under 60 chars (first: ${shortDesc[0].path})`)
    : ok("every description is at least 60 characters");

  /* 3. THE RULE: no live market figures in build-time HTML */
  let scanned = 0, offenders = [];
  for (const p of pages) {
    if (p.staticFigures) continue;   // declared in the catalogue, see the header
    const f = fileFor(p.path);
    if (!existsSync(f)) continue;
    const text = textOf(await readFile(f, "utf8"));
    scanned++;
    for (const s of PRICE_SHAPES) {
      const m = text.match(s.re);
      if (m) { offenders.push(`${p.path}: ${s.what} — "${m[0]}"`); break; }
    }
  }
  offenders.length
    ? fail(`${offenders.length} pages carry a market figure in static HTML:\n      ${offenders.slice(0, 5).join("\n      ")}`)
    : ok(`no market figures in ${scanned} prerendered pages`);

  /* 4. the shell actually says something */
  const thin = [];
  for (const p of pages) {
    const f = fileFor(p.path);
    if (!existsSync(f)) continue;
    const text = textOf(await readFile(f, "utf8"));
    if (text.length < 220) thin.push(`${p.path} (${text.length} chars)`);
  }
  thin.length
    ? fail(`${thin.length} pages have under 220 characters of body text (first: ${thin[0]})`)
    : ok("every page carries a real body, not an empty mount point");

  /* 5. head tags are per-page, not the template's defaults */
  const sample = ["/", "/stock/AAPL", "/country/JP", "/glossary/market-breadth", "/compare/AAPL/GOOGL"];
  for (const s of sample) {
    if (!existsSync(fileFor(s))) { fail(`sample page ${s} not built`); continue; }
    const html = await readFile(fileFor(s), "utf8");
    const page = pages.find((p) => p.path === s);
    if (!html.includes(`<title>`) || !html.includes(page.title.replace(/&/g, "&amp;"))) fail(`${s}: title not applied`);
    if (!new RegExp(`<link rel="canonical" href="[^"]*${s === "/" ? "" : s}"`).test(html)) fail(`${s}: canonical missing or wrong`);
    if ((html.match(/<h1/g) || []).length !== 1) fail(`${s}: expected exactly one <h1>`);
    if (!html.includes('"@type":"WebPage"')) fail(`${s}: no JSON-LD WebPage node`);
  }
  ok(`head tags, canonicals, single H1 and JSON-LD verified on ${sample.length} sample routes`);

  /* 6. no internal link points at a page we do not publish */
  const known = new Set(pages.map((p) => p.path));
  const dangling = [];
  for (const p of pages) {
    for (const l of p.links || []) {
      if (!known.has(l.href) && !l.href.startsWith("/research/")) dangling.push(`${p.path} -> ${l.href}`);
    }
  }
  dangling.length
    ? fail(`${dangling.length} internal links point at unpublished pages (first: ${dangling[0]})`)
    : ok("every internal link resolves to a published page");

  console.log();
  if (failures) { console.error(`${failures} check(s) failed.`); process.exit(1); }
  console.log("All prerender checks passed.");
}

main().catch((e) => { console.error("prerender tests failed:", e); process.exit(1); });
