/**
 * newsFeed.ts — Zero-config live news fetcher.
 *
 * Pulls real headlines from multiple free RSS-to-JSON proxy sources that
 * require NO API keys. Automatically dedupes, enriches with sentiment/entity
 * linking, and caches with configurable TTL. Falls back gracefully to the
 * deterministic SIM engine when offline or rate-limited.
 *
 * Sources:
 *  1. rss2json.com — converts any RSS feed to JSON (10k req/day free)
 *  2. Direct RSS parsing from Google News, Reuters, etc.
 */

import { STOCKS_BY_COUNTRY } from "../data/stocksData";
import { COUNTRIES } from "./market";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface LiveArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt: string;
  minutesAgo: number;
  country: string;
  countryName: string;
  category: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  sentimentScore: number;
  confidence: number;
  impact: "High" | "Medium" | "Low";
  relatedStocks: string[];
  industries: string[];
}

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const RSS2JSON = "https://api.rss2json.com/v1/api.json";

// Google News RSS feeds per country/category
const GOOGLE_NEWS_FEEDS: Record<string, string> = {
  WORLD: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
  BUSINESS: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
  TECHNOLOGY: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
  MARKETS: "https://news.google.com/rss/search?q=stock+market+finance&hl=en-US&gl=US&ceid=US:en",
  ECONOMY: "https://news.google.com/rss/search?q=economy+GDP+inflation+central+bank&hl=en-US&gl=US&ceid=US:en",
  ENERGY: "https://news.google.com/rss/search?q=oil+energy+OPEC+renewable&hl=en-US&gl=US&ceid=US:en",
};

// Country-specific Google News feeds
const COUNTRY_FEEDS: Record<string, string> = {
  US: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
  GB: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pIUWlnQVAB?hl=en-GB&gl=GB&ceid=GB:en",
  IN: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en",
  JP: "https://news.google.com/rss/search?q=Japan+economy+markets&hl=en&gl=JP&ceid=JP:en",
  DE: "https://news.google.com/rss/search?q=Germany+economy+markets+DAX&hl=en&gl=DE&ceid=DE:en",
  FR: "https://news.google.com/rss/search?q=France+economy+markets+CAC&hl=en&gl=FR&ceid=FR:en",
  CN: "https://news.google.com/rss/search?q=China+economy+markets&hl=en&gl=US&ceid=US:en",
  AU: "https://news.google.com/rss/search?q=Australia+economy+markets+ASX&hl=en&gl=AU&ceid=AU:en",
  BR: "https://news.google.com/rss/search?q=Brazil+economy+markets+Bovespa&hl=en&gl=BR&ceid=BR:en",
  CA: "https://news.google.com/rss/search?q=Canada+economy+markets+TSX&hl=en&gl=CA&ceid=CA:en",
};

/* ═══════════════════════════════════════════════════════════════
   Sentiment & Entity Linking (reused from news.ts logic)
   ═══════════════════════════════════════════════════════════════ */

const POS = ["surge","rally","beat","beats","record","growth","gain","gains","boost","strong","upgrade","expands","profit","soar","recovery","deal","wins","approval","bullish","up","rise","rises","higher","positive","outperform"];
const NEG = ["fall","falls","drop","crash","slump","cuts","cut","loss","losses","weak","downgrade","recession","default","strike","sanction","war","attack","fraud","lawsuit","bankruptcy","layoff","bearish","down","decline","lower","negative","selloff","dump"];
const HIGH_IMPACT = ["war","sanction","rate decision","central bank","crash","default","earthquake","election","opec","tariff","emergency","invasion","collapse","fed","ecb","boj","rbi","pandemic","crisis"];

const CATEGORIES_MAP: Record<string, string[]> = {
  Markets: ["stock","market","index","wall street","nasdaq","s&p","dow","ftse","nikkei","dax","bse","nse","sensex","trading","investor","equity"],
  Economy: ["gdp","inflation","unemployment","rate","interest","fiscal","monetary","central bank","fed","ecb","imf","economic","economy","trade","deficit","surplus"],
  Technology: ["ai","artificial intelligence","tech","software","silicon","chip","semiconductor","cloud","cyber","digital","startup","ipo"],
  Energy: ["oil","opec","crude","energy","gas","renewable","solar","wind","pipeline","refinery","battery","ev","electric vehicle"],
  Business: ["merger","acquisition","ceo","revenue","earnings","profit","company","corporate","deal","partnership"],
  Government: ["regulation","policy","bill","congress","parliament","sanction","tariff","election","vote","tax"],
};

function classifyCategory(text: string): string {
  const t = text.toLowerCase();
  let best = "Markets";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORIES_MAP)) {
    let score = 0;
    for (const kw of keywords) if (t.includes(kw)) score++;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function scoreSentiment(text: string): number {
  const t = text.toLowerCase();
  let score = 50;
  for (const w of POS) if (t.includes(w)) score += 6;
  for (const w of NEG) if (t.includes(w)) score -= 6;
  return Math.max(5, Math.min(95, score));
}

function detectImpact(text: string): "High" | "Medium" | "Low" {
  const t = text.toLowerCase();
  if (HIGH_IMPACT.some((w) => t.includes(w))) return "High";
  if (POS.some((w) => t.includes(w)) || NEG.some((w) => t.includes(w))) return "Medium";
  return "Low";
}

function linkEntities(text: string, country: string): { stocks: string[]; industries: string[] } {
  const t = text.toLowerCase();
  const stocks: string[] = [];
  const industries = new Set<string>();
  const pools = [
    ...((STOCKS_BY_COUNTRY as Record<string, any[]>)[country] || []),
    ...((STOCKS_BY_COUNTRY as Record<string, any[]>)["US"] || []).slice(0, 30),
  ];
  for (const s of pools) {
    const nameCore = String(s.name).replace(/\b(inc|corp|corporation|ltd|plc|group|co|sa|ag|nv)\.?\b/gi, "").trim().toLowerCase();
    if (nameCore.length >= 4 && t.includes(nameCore)) {
      if (!stocks.includes(s.ticker)) { stocks.push(s.ticker); industries.add(s.sector); }
    }
  }
  return { stocks: stocks.slice(0, 4), industries: [...industries].slice(0, 3) };
}

/* ═══════════════════════════════════════════════════════════════
   Cache
   ═══════════════════════════════════════════════════════════════ */

interface CacheEntry {
  articles: LiveArticle[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/* ═══════════════════════════════════════════════════════════════
   Fetch helpers
   ═══════════════════════════════════════════════════════════════ */

const seenTitles = new Set<string>();
const titleKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);

interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  description: string;
  thumbnail?: string;
  enclosure?: { link?: string };
  author?: string;
  content?: string;
}

/**
 * Fetch a feed, preferring our own /api/rss edge function.
 *
 * The public rss2json proxy is a single point of failure and has been
 * returning 500 for Google News URLs, which left every news panel empty. Our
 * own origin has no CORS problem and no third-party dependency; rss2json stays
 * as a fallback for local `vite dev`, where /api is not running.
 */
async function fetchRssFeed(feedUrl: string): Promise<Rss2JsonItem[]> {
  // 1. Own origin.
  try {
    const r = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}&count=20`);
    if (r.ok) {
      const j = await r.json();
      if (j.status === "ok" && Array.isArray(j.items) && j.items.length) return j.items;
    }
  } catch {
    /* fall through */
  }

  // 2. Public proxy fallback.
  try {
    const url = `${RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}&count=20`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    return j.items || [];
  } catch {
    return [];
  }
}

function extractSourceFromTitle(title: string): { cleanTitle: string; source: string } {
  // Google News appends " - Source Name" at the end
  const match = title.match(/^(.+)\s+-\s+(.+)$/);
  if (match) return { cleanTitle: match[1].trim(), source: match[2].trim() };
  return { cleanTitle: title, source: "Wire" };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim().slice(0, 300);
}

function parseArticle(item: Rss2JsonItem, country: string): LiveArticle | null {
  const key = titleKey(item.title || "");
  if (!key || seenTitles.has(key)) return null;
  seenTitles.add(key);

  const { cleanTitle, source } = extractSourceFromTitle(item.title || "");
  const desc = stripHtml(item.description || item.content || "");
  const fullText = `${cleanTitle} ${desc}`;
  const sentimentScore = scoreSentiment(fullText);
  const category = classifyCategory(fullText);
  const impact = detectImpact(fullText);
  const { stocks, industries } = linkEntities(fullText, country);
  const pubTime = new Date(item.pubDate).getTime();
  const minutesAgo = Math.max(1, Math.round((Date.now() - pubTime) / 60000));
  const meta = COUNTRIES[country];

  const imageUrl = item.thumbnail || item.enclosure?.link || undefined;

  return {
    id: `live-${key.slice(0, 24)}-${Date.now().toString(36)}`,
    title: cleanTitle,
    description: desc,
    url: item.link,
    source,
    imageUrl,
    publishedAt: item.pubDate,
    minutesAgo,
    country,
    countryName: meta?.name || country,
    category,
    sentiment: sentimentScore >= 58 ? "Bullish" : sentimentScore <= 42 ? "Bearish" : "Neutral",
    sentimentScore,
    confidence: Math.min(90, 55 + stocks.length * 8 + (impact === "High" ? 10 : 0)),
    impact,
    relatedStocks: stocks,
    industries: industries.length ? industries : [category],
  };
}

/* ═══════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════ */

/** Fetch the latest global news across all categories */
export async function fetchGlobalNews(maxPerCategory = 10): Promise<LiveArticle[]> {
  const cacheKey = `global-${maxPerCategory}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.articles;

  const feeds = Object.entries(GOOGLE_NEWS_FEEDS);
  const results = await Promise.allSettled(
    feeds.map(([, feedUrl]) => fetchRssFeed(feedUrl))
  );

  const articles: LiveArticle[] = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const cat = feeds[i][0];
    for (const item of r.value.slice(0, maxPerCategory)) {
      const parsed = parseArticle(item, "US");
      if (parsed) {
        // Override category from feed name
        parsed.category = cat.charAt(0) + cat.slice(1).toLowerCase();
        articles.push(parsed);
      }
    }
  });

  articles.sort((a, b) => a.minutesAgo - b.minutesAgo);
  cache.set(cacheKey, { articles, fetchedAt: Date.now() });
  return articles;
}

/** Fetch news for a specific country */
export async function fetchLiveCountryNews(country: string, max = 10): Promise<LiveArticle[]> {
  const iso = country.toUpperCase();
  const cacheKey = `country-${iso}-${max}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.articles;

  const feedUrl = COUNTRY_FEEDS[iso] || `https://news.google.com/rss/search?q=${encodeURIComponent(COUNTRIES[iso]?.name || iso)}+economy+markets&hl=en&gl=US&ceid=US:en`;

  const items = await fetchRssFeed(feedUrl);
  const articles: LiveArticle[] = [];

  for (const item of items.slice(0, max * 2)) {
    const parsed = parseArticle(item, iso);
    if (parsed) articles.push(parsed);
    if (articles.length >= max) break;
  }

  articles.sort((a, b) => a.minutesAgo - b.minutesAgo);
  cache.set(cacheKey, { articles, fetchedAt: Date.now() });
  return articles;
}

/** Fetch breaking / high-impact news across all sources */
export async function fetchBreakingNews(count = 5): Promise<LiveArticle[]> {
  const all = await fetchGlobalNews(8);
  const breaking = all
    .filter((a) => a.impact === "High" || a.minutesAgo <= 60)
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, count);

  // If not enough high-impact items, fill with the freshest headlines
  if (breaking.length < count) {
    const fill = all
      .filter((a) => !breaking.some((b) => b.id === a.id))
      .slice(0, count - breaking.length);
    breaking.push(...fill);
  }

  return breaking;
}

/** Compact time label */
export function timeAgo(minutesAgo: number): string {
  if (minutesAgo < 1) return "JUST NOW";
  if (minutesAgo < 60) return `${minutesAgo}M AGO`;
  const h = Math.round(minutesAgo / 60);
  if (h < 24) return `${h}H AGO`;
  return `${Math.round(h / 24)}D AGO`;
}

/** Clear dedup cache (useful on hard refresh) */
export function clearNewsCache(): void {
  seenTitles.clear();
  cache.clear();
}
