#!/usr/bin/env node
/**
 * Static prerendering — growth-plan items 85–88.
 *
 * The problem this solves, measured before it was written: every one of our
 * ~1,000 URLs served byte-identical HTML with an empty <div id="root"> and zero
 * characters of body text. Googlebot renders JavaScript and could eventually
 * see the app; the crawlers that now matter most for a research product —
 * GPTBot, PerplexityBot, ClaudeBot, Bingbot's non-render tier, and every social
 * scraper — do not execute JavaScript at all. To all of them the entire site
 * was one untitled page.
 *
 * So each route gets a real HTML document: its own <title>, description,
 * canonical, Open Graph tags, JSON-LD, and a content shell with a heading, a
 * factual summary and internal links. The SPA boots over it and removes the
 * shell on mount, so a human sees exactly what they saw before.
 *
 * WHAT MUST NEVER BE IN HERE: a price, a change, an index level, a return. This
 * file is written at build time and served from a CDN for as long as the
 * deployment lives, so any market figure in it is stale on arrival — which is
 * the single thing this product refuses to do. The shell carries the durable
 * facts (what a company is, where it lists, what a term means) and the live
 * numbers arrive when the app connects to the feeds, exactly as before.
 * scripts/prerender-tests.mjs fails the build if a price-shaped string appears.
 *
 * Why this and not Next.js: see docs/SSR-DECISION.md.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPages, COUNTS } from "./lib/pages.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = (process.env.SITE_URL || "https://global-financial-terminal-eight.vercel.app").replace(/\/+$/, "");

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** JSON-LD is script content, not markup: only "<" needs neutralising. */
const escJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/* ── the shell's own stylesheet ──────────────────────────────────────────────
 * Fixed to the viewport and painted in the app's own black, for two reasons:
 * a reader on a slow connection gets a real page instead of a blank one, and
 * because it is out of flow, removing it on mount moves nothing — a shell in
 * normal flow would register as layout shift against the CLS budget in item 27.
 */
const SHELL_CSS = `
#seo-shell{position:fixed;inset:0;overflow-y:auto;z-index:1;background:#0A0A0A;color:#E8E8E8;
 font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:28px 20px 60px}
#seo-shell .wrap{max-width:760px;margin:0 auto}
#seo-shell a{color:#C9A227;text-decoration:none}
#seo-shell a:hover{text-decoration:underline}
#seo-shell .kicker{font-size:11px;letter-spacing:.14em;color:#C9A227;margin:0 0 6px;text-transform:uppercase}
#seo-shell h1{font-size:28px;line-height:1.2;margin:0 0 10px;font-weight:700}
#seo-shell h2{font-size:15px;margin:26px 0 6px;font-weight:600;color:#FFF}
#seo-shell .lede{color:#B4B4B4;margin:0 0 18px}
#seo-shell p{margin:0 0 12px;color:#B4B4B4}
#seo-shell dl{display:grid;grid-template-columns:auto 1fr;gap:6px 18px;margin:18px 0;font-size:14px}
#seo-shell dt{color:#8A8A8A}
#seo-shell dd{margin:0;color:#E8E8E8}
#seo-shell ul{margin:8px 0 0;padding-left:18px}
#seo-shell li{margin:3px 0}
#seo-shell .brand{font-size:12px;letter-spacing:.1em;color:#8A8A8A;margin:0 0 22px}
#seo-shell .foot{margin-top:34px;padding-top:14px;border-top:1px solid #262626;font-size:12px;color:#6E6E6E}
`.trim();

function shellHtml(p) {
  const facts = (p.facts || []).length
    ? `<dl>${p.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`
    : "";
  const body = (p.body || [])
    .map((s) => `<section><h2>${esc(s.h)}</h2><p>${esc(s.p)}</p></section>`).join("");
  const links = (p.links || []).length
    ? `<nav aria-label="Related pages"><h2>Related</h2><ul>${
        p.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`).join("")
      }</ul></nav>`
    : "";

  return `<div id="seo-shell"><div class="wrap">` +
    `<p class="brand"><a href="/">GLOBAL FINANCIAL TERMINAL</a></p>` +
    (p.kicker ? `<p class="kicker">${esc(p.kicker)}</p>` : "") +
    `<h1>${esc(p.h1 || p.title)}</h1>` +
    (p.intro ? `<p class="lede">${esc(p.intro)}</p>` : "") +
    facts + body + links +
    `<p class="foot">Live figures load with the terminal and are not written into this page, ` +
    `so nothing here can go stale. Not investment advice.</p>` +
    `</div></div>`;
}

/** Site-wide graph, matching what useSeo emits at runtime. */
const siteGraph = (url, title, description) => ({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE}/#org`, name: "Global Financial Terminal", url: SITE, logo: `${SITE}/icon.svg` },
    {
      "@type": "WebSite", "@id": `${SITE}/#site`, url: SITE, name: "Global Financial Terminal",
      publisher: { "@id": `${SITE}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/markets?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    { "@type": "WebPage", "@id": `${url}#page`, url, name: title, description, isPartOf: { "@id": `${SITE}/#site` } },
  ],
});

/** Replace a tag if the template has it, append into <head> if it does not. */
function setTag(html, pattern, replacement) {
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace("</head>", `    ${replacement}\n  </head>`);
}

function render(template, p) {
  const url = `${SITE}${p.path === "/" ? "" : p.path}`;
  const ogImage = `${SITE}/og.png`;
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(p.description)}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(p.title)}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(p.description)}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(p.title)}" />`);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(p.description)}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(ogImage)}" />`);

  const ld = [siteGraph(url, p.title, p.description), ...(p.jsonLd ? [p.jsonLd] : [])]
    .map((o) => `<script type="application/ld+json">${escJson(o)}</script>`).join("\n    ");

  html = html.replace("</head>", `    <style id="seo-shell-css">${SHELL_CSS}</style>\n    ${ld}\n  </head>`);
  html = html.replace('<div id="root">', `${shellHtml(p)}\n    <div id="root">`);
  return html;
}

/**
 * The template is dist/index.html, which is also one of the pages we overwrite
 * (the landing route). Running the prerenderer twice without stripping what a
 * previous run injected stacks a second shell on top of the first, so the page
 * ends up with two <h1>s — invalid, and exactly the kind of thing that only
 * shows up on the second build. Strip first, then inject.
 */
function pristine(html) {
  return html
    .replace(/<div id="seo-shell">[\s\S]*<div id="root">/, '<div id="root">')
    .replace(/\s*<style id="seo-shell-css">[\s\S]*?<\/style>/g, "")
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
}

async function main() {
  const template = pristine(await readFile(path.join(DIST, "index.html"), "utf8"));
  if (!template.includes('<div id="root">')) {
    throw new Error("dist/index.html has no #root mount point — did vite build run first?");
  }
  if (template.includes("seo-shell")) throw new Error("template still carries a previous shell");

  const pages = await allPages();
  for (const p of pages) {
    const dir = p.path === "/" ? DIST : path.join(DIST, ...p.path.split("/").filter(Boolean));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), render(template, p));
  }

  const c = COUNTS();
  console.log(
    `  prerender: ${pages.length} pages (${c.countries} countries, ${c.equities} companies, ` +
    `${c.sectors} sectors, ${c.terms} terms) -> dist/**/index.html`,
  );
}

main().catch((e) => {
  console.error("prerender failed:", e.message);
  process.exit(1);
});
