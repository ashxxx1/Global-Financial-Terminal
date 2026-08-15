/**
 * Production uptime probe — growth-plan item 22.
 *
 * Exits non-zero on the first hard failure, which is what trips the alerting
 * step in .github/workflows/uptime.yml.
 *
 * Design note: the checks are ordered cheapest-to-most-specific, and the quote
 * check deliberately asserts on a *price*, not on a 200. Finnhub answers 200
 * with `{}` when a symbol is unknown or the key is missing, so status-only
 * monitoring would have slept through the outage that actually happened.
 */

const SITE = process.env.SITE || "https://global-financial-terminal-eight.vercel.app";
const TIMEOUT_MS = 15000;

/** One fetch with a hard timeout — a hung request must fail, not hang the job. */
async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "gft-uptime-probe" } });
  } finally {
    clearTimeout(t);
  }
}

const failures = [];
const notes = [];

async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    notes.push(`✅ ${name} (${Date.now() - started}ms)${detail ? " — " + detail : ""}`);
  } catch (e) {
    failures.push(`❌ ${name} — ${e.message}`);
  }
}

// 1. The document itself renders and is actually our app, not a Vercel error page.
await check("homepage", async () => {
  const r = await get(SITE);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  if (!/<div id="root">|GFT|Global Financial/i.test(html)) {
    throw new Error("200 but the body does not look like the app");
  }
  return `${(html.length / 1024).toFixed(0)}kB`;
});

// 2. The quote proxy returns a real, positive price. This is the check that
//    would have caught every outage we have actually had.
await check("quote proxy (AAPL)", async () => {
  const r = await get(`${SITE}/api/quote?symbol=AAPL`);
  if (r.status === 429) throw new Error("rate limited (429) — upstream cap hit");
  if (r.status === 501) throw new Error("501 — FINNHUB_API_KEY not configured on the deployment");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (typeof j.c !== "number" || j.c <= 0) {
    throw new Error(`200 but no usable price (c=${JSON.stringify(j.c)})`);
  }
  return `$${j.c.toFixed(2)}`;
});

// 3. An ETF proxy, so a Finnhub plan or entitlement change that only affects
//    non-core symbols does not go unnoticed.
await check("ETF proxy (SPY)", async () => {
  const r = await get(`${SITE}/api/quote?symbol=SPY`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (typeof j.c !== "number" || j.c <= 0) throw new Error("no usable price");
  return `$${j.c.toFixed(2)}`;
});

// 4. Crawlability — a silently broken sitemap costs weeks of SEO before anyone
//    notices, and it is one request to rule out.
await check("sitemap.xml", async () => {
  const r = await get(`${SITE}/sitemap.xml`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const xml = await r.text();
  const urls = (xml.match(/<loc>/g) || []).length;
  if (urls < 100) throw new Error(`only ${urls} urls — sitemap looks truncated`);
  return `${urls} urls`;
});

for (const n of notes) console.log(n);
for (const f of failures) console.error(f);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll checks passed.");
