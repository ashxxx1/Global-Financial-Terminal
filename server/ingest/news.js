/**
 * ingest/news.js — country news, fetched server-side so the API key never ships
 * to the browser. Fetch → dedupe → enrich (entity link + sentiment + impact) →
 * cache (2-min TTL). High-impact articles are also ingested as `news` Envelopes
 * so they surface on the live global feed. Falls back to empty (frontend then
 * uses its deterministic engine) when no key or the upstream fails.
 */
import { ingest, getCachedNews, setCachedNews } from "../store.js";
import { enrichArticle } from "../enrich.js";

const KEY = process.env.GNEWS_API_KEY || process.env.VITE_GNEWS_API_KEY || "";
const TTL = 120000;
const SUPPORTED = new Set([
  "AU", "BR", "CA", "CN", "EG", "FR", "DE", "GR", "HK", "IN", "IE", "IL", "IT",
  "JP", "NL", "NO", "PK", "PE", "PH", "PT", "RO", "RU", "SG", "ES", "SE", "CH",
  "TW", "UA", "GB", "US",
]);
const seenTitles = new Set();
const norm = (t) => (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);

export function newsEnabled() { return Boolean(KEY); }

export async function getCountryNews(iso, max = 12) {
  iso = iso.toUpperCase();
  if (!KEY || !SUPPORTED.has(iso)) return { articles: [], live: false };

  const cached = getCachedNews(iso, TTL);
  if (cached) return { articles: cached, live: true };

  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=business&lang=en&max=${max}&country=${iso.toLowerCase()}&apikey=${KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const out = [];
    for (const a of j.articles || []) {
      const k = norm(a.title);
      if (!k) continue;
      const article = enrichArticle(a, iso);
      out.push(article);
      // Surface high-impact items on the live stream once.
      if (article.impact === "High" && !seenTitles.has(k)) {
        seenTitles.add(k);
        ingest({
          id: "news-evt-" + article.id,
          kind: "news",
          timestamp: new Date(a.publishedAt || Date.now()).getTime(),
          received: Date.now(),
          source: article.source,
          confidence: article.confidence,
          countryTags: [iso],
          marketTags: article.relatedStocks,
          industryTags: article.industries,
          summary: article.headline,
          impact: "High",
          payload: article,
        });
      }
    }
    setCachedNews(iso, out);
    return { articles: out, live: true };
  } catch (e) {
    console.warn(`[news] ${iso} fetch failed:`, e.message);
    return { articles: [], live: false };
  }
}
