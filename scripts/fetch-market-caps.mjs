/**
 * Market-cap tiers, fetched once and committed.
 *
 * Growth-plan support for the Markets hierarchy: country -> sector -> cap band.
 *
 * Finnhub's profile endpoint returns 403 for non-US listings, so caps are only
 * reachable for US-listed companies and for foreign companies that HAVE a US
 * listing (Toyota via TM). That is roughly 200 of 596 names. The rest are
 * recorded as unclassified rather than estimated — a guessed market cap would
 * silently reorder the entire page.
 *
 * Caps arrive in the company's own reporting currency, so they are converted to
 * USD with ECB rates before banding. Comparing a yen cap against a dollar one
 * would put Toyota in a tier of its own for no reason but arithmetic.
 *
 *   node scripts/fetch-market-caps.mjs
 */
import fs from "node:fs";

const KEY = process.env.FINNHUB_API_KEY
  || (fs.readFileSync(".env.local", "utf8").match(/VITE_FINNHUB_API_KEY=(.+)/) || [])[1]?.trim();
if (!KEY) { console.error("no Finnhub key"); process.exit(1); }

/** USD-base ECB rates: rates[X] = X per 1 USD. */
const rates = (await (await fetch("https://api.frankfurter.dev/v1/latest?base=USD")).json()).rates;
/** Hard USD pegs the ECB does not publish. */
const PEG = { SAR: 3.75, AED: 3.6725, QAR: 3.64, HKD: 7.8 };
const toUsd = (v, cur) => {
  if (cur === "USD") return v;
  const r = rates[cur] ?? PEG[cur];
  return typeof r === "number" && r > 0 ? v / r : null;
};

/** Tier boundaries in USD millions. Conventional US definitions. */
function band(usdMillions) {
  if (usdMillions >= 200_000) return "mega";
  if (usdMillions >= 10_000) return "large";
  if (usdMillions >= 2_000) return "mid";
  if (usdMillions >= 300) return "small";
  return "micro";
}

// Which symbol to ask about: the US ticker where one exists, else the symbol.
const adrs = fs.readFileSync("src/lib/feeds/adrs.ts", "utf8");
const ADR = Object.fromEntries([...adrs.matchAll(/"([A-Z]{2}):([^"]+)":\s*"([^"]+)"/g)].map((m) => [`${m[1]}:${m[2]}`, m[3]]));

const src = fs.readFileSync("src/data/stocksData.js", "utf8");
const blocks = [...src.matchAll(/^\s*([A-Z]{2}):\s*\[/gm)];
const targets = [];
for (let i = 0; i < blocks.length; i++) {
  const c = blocks[i][1];
  const chunk = src.slice(blocks[i].index, i + 1 < blocks.length ? blocks[i + 1].index : src.length);
  for (const m of chunk.matchAll(/ticker:\s*"([^"]+)"/g)) {
    const t = m[1];
    const us = c === "US" ? t : ADR[`${c}:${t}`];
    if (us) targets.push({ key: `${c}:${t}`, us });
  }
}
console.log(`${targets.length} symbols have a US listing to query`);

const out = {};
let ok = 0, fail = 0;
for (const { key, us } of targets) {
  try {
    const r = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(us)}&token=${KEY}`);
    if (r.status === 429) { await new Promise((x) => setTimeout(x, 20000)); continue; }
    if (r.ok) {
      const j = await r.json();
      const cap = j.marketCapitalization, cur = j.currency;
      const usd = typeof cap === "number" && cap > 0 && cur ? toUsd(cap, cur) : null;
      if (usd !== null) { out[key] = { usdM: Math.round(usd), band: band(usd) }; ok++; }
      else fail++;
    } else fail++;
  } catch { fail++; }
  await new Promise((x) => setTimeout(x, 1150));
}

const counts = {};
for (const v of Object.values(out)) counts[v.band] = (counts[v.band] ?? 0) + 1;
console.log(`\nresolved ${ok}, failed ${fail}`);
console.log("bands:", JSON.stringify(counts));

fs.writeFileSync("src/data/marketCaps.json", JSON.stringify(out, null, 0));
console.log("wrote src/data/marketCaps.json");
