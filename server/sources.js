/**
 * sources.js — real-time data collection (spec Step 1).
 *
 * Priority of sources (all real except the last):
 *   1. GNews API        — if GNEWS_API_KEY is set (richest, has images/summaries)
 *   2. Google News RSS  — FREE, no key, fetched server-side (no CORS limit)
 *   3. Sample stream    — only if both above fail, so the engine never stalls
 *
 * Rotates one country per tick to stay light. Returns { items, live, source }.
 */
import { STOCKS_BY_COUNTRY } from "../src/data/stocksData.js";

const KEY = process.env.GNEWS_API_KEY || "";
const COUNTRIES = Object.keys(STOCKS_BY_COUNTRY);
const GNEWS_OK = new Set(["AU","BR","CA","CN","FR","DE","IN","IE","IT","JP","NL","NO","RU","SG","ES","SE","CH","TW","GB","US"]);

let rot = 0;

// ── GNews (keyed) ────────────────────────────────────────────────────────────
async function fetchGNews(code) {
  const url = `https://gnews.io/api/v4/top-headlines?category=business&lang=en&max=10&country=${code.toLowerCase()}&apikey=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles || []).map((a) => ({
    title: a.title, description: a.description, source: a.source?.name || "GNews",
    url: a.url, publishedAt: a.publishedAt, image: a.image, country: code,
  }));
}

// ── Google News RSS (free, no key) ───────────────────────────────────────────
const decode = (s = "") =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
   .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
   .replace(/<[^>]+>/g, "").trim();

async function fetchRSS(code) {
  // Business/economy/markets query, localized to the country.
  const q = encodeURIComponent("business OR economy OR stocks OR markets");
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=${code}&ceid=${code}:en`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (intel-engine)" } });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
  return items.map((m) => {
    const block = m[1];
    const pick = (tag) => (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)) || [])[1] || "";
    const rawTitle = decode(pick("title"));           // "Headline - Source"
    const source = decode(pick("source")) || rawTitle.split(" - ").slice(-1)[0] || "Google News";
    const title = rawTitle.replace(new RegExp(`\\s*-\\s*${source}$`), "");
    return {
      title,
      description: decode(pick("description")).slice(0, 300),
      source,
      url: decode(pick("link")),
      publishedAt: new Date(decode(pick("pubDate")) || Date.now()).toISOString(),
      country: code,
    };
  }).filter((x) => x.title);
}

// ── Sample fallback ──────────────────────────────────────────────────────────
const SAMPLE = [
  { t: "Oil prices surge as OPEC+ announces output cut", d: "Crude jumps on tighter supply." },
  { t: "Central bank signals interest rate cut amid cooling inflation", d: "Policy easing expected." },
  { t: "Chipmakers rally on record AI semiconductor demand", d: "Cloud and AI orders climb." },
  { t: "Banking stocks fall on weak lending and bad-loan fears", d: "Credit conditions tighten." },
  { t: "New sanctions announced, trade restrictions widen", d: "Exporters face fresh headwinds." },
];
function sampleBatch() {
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const s = SAMPLE[Math.floor(Math.random() * SAMPLE.length)];
  return [{ title: s.t, description: s.d, source: "Sample Feed", url: "#", publishedAt: new Date().toISOString(), country }];
}

export async function collect() {
  const code = COUNTRIES[rot++ % COUNTRIES.length];
  try {
    if (KEY && GNEWS_OK.has(code)) {
      const items = await fetchGNews(code);
      if (items.length) return { items, live: true, source: "gnews" };
    }
    const rss = await fetchRSS(code);
    if (rss.length) return { items: rss, live: true, source: "rss" };
  } catch (e) {
    console.error("[sources] fetch error:", e.message);
  }
  return { items: sampleBatch(), live: false, source: "sample" };
}
