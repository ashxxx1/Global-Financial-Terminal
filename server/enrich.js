/**
 * enrich.js — server-side enrichment shared by the ingest workers.
 *
 * Entity linking (companies/stocks/industries), sentiment and impact scoring
 * run against the same equity dataset the frontend uses (single source of
 * truth: ../src/data). This is the heuristic pipeline; the production target is
 * an LLM enrichment queue (SPEC-PIPELINE.md) that implements the same function
 * signatures so callers never change.
 */
import { STOCKS_BY_COUNTRY } from "../src/data/stocksData.js";
import { COUNTRIES_DATA } from "../src/data/mockData.js";

const POS = ["surge", "rally", "beat", "beats", "record", "growth", "gain", "gains", "boost", "strong", "upgrade", "expands", "profit", "soar", "recovery", "deal", "wins", "approval"];
const NEG = ["fall", "falls", "drop", "crash", "slump", "cuts", "cut", "loss", "losses", "weak", "downgrade", "recession", "default", "strike", "sanction", "war", "attack", "fraud", "lawsuit", "bankruptcy", "layoff"];
const HIGH_IMPACT = ["war", "sanction", "rate decision", "central bank", "crash", "default", "earthquake", "election", "opec", "tariff", "emergency", "invasion", "collapse"];

export function sentimentScore(text) {
  const t = text.toLowerCase();
  let s = 50;
  for (const w of POS) if (t.includes(w)) s += 8;
  for (const w of NEG) if (t.includes(w)) s -= 8;
  return Math.max(5, Math.min(95, s));
}

export function linkEntities(text, country) {
  const t = text.toLowerCase();
  const stocks = [];
  const industries = new Set();
  const pools = [
    ...(STOCKS_BY_COUNTRY[country] || []),
    ...(STOCKS_BY_COUNTRY.US || []).slice(0, 20), // global mega-caps
  ];
  for (const s of pools) {
    const core = String(s.name).replace(/\b(inc|corp|corporation|ltd|plc|group|co|sa|ag|nv)\.?\b/gi, "").trim().toLowerCase();
    if (core.length >= 4 && t.includes(core) && !stocks.includes(s.ticker)) {
      stocks.push(s.ticker);
      industries.add(s.sector);
    }
  }
  return { stocks: stocks.slice(0, 4), industries: [...industries].slice(0, 3) };
}

export function isHighImpact(text) {
  const t = text.toLowerCase();
  return HIGH_IMPACT.some((w) => t.includes(w));
}

export function countryName(iso) {
  return COUNTRIES_DATA[iso]?.name || iso;
}

/** Full enrichment for one raw article into the platform's Article shape. */
export function enrichArticle(raw, iso) {
  const text = `${raw.title} ${raw.description || ""}`;
  const { stocks, industries } = linkEntities(text, iso);
  const s = sentimentScore(text);
  const high = isHighImpact(text);
  const sentiment = s >= 58 ? "Bullish" : s <= 42 ? "Bearish" : "Neutral";
  const name = countryName(iso);
  return {
    id: "news-" + hashId(raw.title),
    country: iso,
    countryName: name,
    category: "Business",
    headline: raw.title,
    summary: raw.description || "",
    source: raw.source?.name || raw.source || "Wire",
    url: raw.url,
    publishedAt: raw.publishedAt || new Date().toISOString(),
    minutesAgo: Math.max(1, Math.round((Date.now() - new Date(raw.publishedAt || Date.now()).getTime()) / 60000)),
    sentiment,
    sentimentScore: s,
    confidence: Math.min(90, 55 + stocks.length * 8 + (high ? 10 : 0)),
    impact: high ? "High" : stocks.length > 0 ? "Medium" : "Low",
    industries: industries.length ? industries : ["Markets"],
    relatedStocks: stocks,
    whyItMatters: sentiment === "Bullish"
      ? `Positive read-through for ${industries[0] || "local"} names${stocks.length ? ` — mentions ${stocks.join(", ")}` : ""}; supports near-term ${name} sentiment.`
      : sentiment === "Bearish"
        ? `Headwind for ${industries[0] || "local"} exposure${stocks.length ? ` — watch ${stocks.join(", ")}` : ""}; may pressure ${name} risk appetite.`
        : `Mixed implications; monitor follow-through in ${name} ${(industries[0] || "markets").toLowerCase()}.`,
    whatNext: high
      ? "High-impact keywords detected — expect fast repricing and headline risk; confirm with official sources."
      : "Watch volume and whether related names react at the next session open.",
  };
}

function hashId(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
