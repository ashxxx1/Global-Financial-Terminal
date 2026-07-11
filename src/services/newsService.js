/**
 * newsService.js — fetches real-time business news per country.
 *
 * Uses the free GNews API when VITE_GNEWS_API_KEY is set (100 req/day) for the
 * countries GNews supports; otherwise (or for unsupported countries) generates
 * realistic sample headlines derived from that country's own stocks + sectors,
 * so EVERY country produces sensible, self-consistent signals with no key.
 *
 * Item shape: { title, description, source, publishedAt, url }
 */
import { STOCKS_BY_COUNTRY } from "../data/stocksData";

const GNEWS_KEY = import.meta.env.VITE_GNEWS_API_KEY || "";

// Every country that has stock data is supported.
export const SUPPORTED_COUNTRIES = Object.keys(STOCKS_BY_COUNTRY);

// Countries GNews' /top-headlines endpoint accepts (others fall back to sample).
const GNEWS_COUNTRIES = new Set([
  "AU","BR","CA","CN","EG","FR","DE","GR","HK","IN","IE","IL","IT","JP","NL","NO",
  "PK","PE","PH","PT","RO","RU","SG","ES","SE","CH","TW","UA","GB","US",
]);

export function isCountrySupported(code) {
  return SUPPORTED_COUNTRIES.includes((code || "").toUpperCase());
}

// ── Real fetch (GNews) ───────────────────────────────────────────────────────
async function fetchFromGNews(code) {
  const url =
    `https://gnews.io/api/v4/top-headlines?category=business&lang=en&max=10` +
    `&country=${code.toLowerCase()}&apikey=${GNEWS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GNews ${res.status}`);
  const data = await res.json();
  return (data.articles || []).map((a) => ({
    title: a.title,
    description: a.description,
    source: a.source?.name || "GNews",
    publishedAt: a.publishedAt,
    url: a.url,
  }));
}

// ── Sample-news generation (runs with no key, for every country) ─────────────
// Templates carry sector keywords so the signal engine re-detects the sector.
// { pos, neg } phrasings per sector.
const SECTOR_TEMPLATES = {
  "Energy": {
    pos: "Oil and gas producers rally as crude demand strengthens",
    neg: "Oil prices drop on rising inventories, energy shares slip",
  },
  "Banking & Finance": {
    pos: "Banks gain as the central bank signals interest-rate cuts and credit growth",
    neg: "Financial stocks fall on weak lending and rising bad-loan fears",
  },
  "Technology": {
    pos: "Tech shares surge on strong chip demand and AI software growth",
    neg: "Technology stocks decline as chip demand weakens",
  },
  "Automotive": {
    pos: "Automakers climb as vehicle and EV demand grows",
    neg: "Auto sales miss estimates, carmakers under pressure",
  },
  "Healthcare": {
    pos: "Pharma stocks rise on new drug approvals and export wins",
    neg: "Healthcare shares slip after a clinical-trial setback",
  },
  "Consumer": {
    pos: "Retail stocks gain as consumer spending strengthens",
    neg: "Retail sales miss forecasts as consumer spending weakens",
  },
  "Telecom": {
    pos: "Telecom operators rally on 5G network subscriber growth",
    neg: "Telecom shares fall on price war and weak mobile revenue",
  },
  "Mining & Resources": {
    pos: "Miners surge as metal and commodity prices climb",
    neg: "Mining stocks slump as metal and ore prices decline",
  },
  "Industrial": {
    pos: "Industrials gain on strong manufacturing output and export orders",
    neg: "Factory output falls, industrial stocks under pressure",
  },
  "Real Estate": {
    pos: "Property stocks rebound as mortgage rates ease and housing recovers",
    neg: "Real estate shares slump on weak property demand and default fears",
  },
  "Utilities": {
    pos: "Utilities rise on renewable power expansion and steady demand",
    neg: "Power utilities slip as fuel and energy costs climb",
  },
  "Transportation": {
    pos: "Airlines and shipping gain on strong freight and travel demand",
    neg: "Airline and logistics shares fall on rising fuel costs",
  },
  "Defence": {
    pos: "Defence contractors rally on new military orders",
    neg: "Defence shares slip as arms budgets tighten",
  },
};

/** Average changePct per sector for a country's stocks. */
function sectorSentiment(stocks) {
  const agg = {};
  for (const s of stocks) {
    const a = (agg[s.sector] ||= { sum: 0, n: 0 });
    a.sum += s.changePct || 0;
    a.n += 1;
  }
  return Object.entries(agg)
    .map(([sector, a]) => ({ sector, avg: a.sum / a.n, n: a.n }))
    .sort((x, y) => y.n - x.n); // biggest sectors first
}

/** Generate sample headlines for a country from its own sectors + movement. */
function generateSampleNews(code) {
  const stocks = STOCKS_BY_COUNTRY[code] || [];
  const sectors = sectorSentiment(stocks).slice(0, 6);
  const now = Date.now();
  return sectors
    .map((s, i) => {
      const t = SECTOR_TEMPLATES[s.sector];
      if (!t) return null;
      const title = s.avg >= 0 ? t.pos : t.neg;
      return {
        title,
        description: title,
        source: "Sample Feed",
        publishedAt: new Date(now - i * 40 * 60 * 1000).toISOString(),
        url: "#",
      };
    })
    .filter(Boolean);
}

/**
 * Fetch news for a country. Real when a key is set and GNews supports it,
 * otherwise self-consistent sample headlines.
 * @returns {{ items, live, error }}
 */
export async function fetchCountryNews(code) {
  const cc = (code || "").toUpperCase();
  if (GNEWS_KEY && GNEWS_COUNTRIES.has(cc)) {
    try {
      const items = await fetchFromGNews(cc);
      if (items.length) return { items, live: true, error: null };
      return { items: generateSampleNews(cc), live: false, error: "No live articles" };
    } catch (e) {
      return { items: generateSampleNews(cc), live: false, error: e.message };
    }
  }
  return { items: generateSampleNews(cc), live: false, error: null };
}
