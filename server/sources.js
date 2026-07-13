/**
 * sources.js — real-time data collection (spec Step 1).
 *
 * collect() returns a batch of raw news items (each tagged with a country).
 * Real mode: polls GNews (process.env.GNEWS_API_KEY), rotating one country per
 * tick to respect the free-tier rate limit. No key: emits a sample event stream
 * derived from real sectors so the engine has something live to process.
 */
import { STOCKS_BY_COUNTRY } from "../src/data/stocksData.js";

const KEY = process.env.GNEWS_API_KEY || "";
const COUNTRIES = Object.keys(STOCKS_BY_COUNTRY);
const GNEWS_OK = new Set(["AU","BR","CA","CN","FR","DE","IN","IE","IT","JP","NL","NO","RU","SG","ES","SE","CH","TW","GB","US"]);

let rot = 0;

const SAMPLE = [
  { t: "Oil prices surge as OPEC+ announces output cut", d: "Crude jumps on tighter supply." },
  { t: "Central bank signals interest rate cut amid cooling inflation", d: "Policy easing expected." },
  { t: "Chipmakers rally on record AI semiconductor demand", d: "Cloud and AI orders climb." },
  { t: "Automaker beats delivery estimates as EV demand grows", d: "Electric vehicle sales strong." },
  { t: "Banking stocks fall on weak lending and bad-loan fears", d: "Credit conditions tighten." },
  { t: "New sanctions announced, trade restrictions widen", d: "Exporters face fresh headwinds." },
  { t: "Retail sales miss forecasts as consumer spending weakens", d: "Shoppers pull back." },
  { t: "Defence contractors win new military orders amid conflict", d: "Order books expand." },
];

async function fetchGNews(code) {
  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=business&lang=en&max=10&country=${code.toLowerCase()}&apikey=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a) => ({
      title: a.title, description: a.description, source: a.source?.name || "GNews",
      url: a.url, publishedAt: a.publishedAt, country: code,
    }));
  } catch {
    return [];
  }
}

function sampleBatch() {
  const n = 1 + Math.floor(Math.random() * 2);
  const out = [];
  for (let i = 0; i < n; i++) {
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const s = SAMPLE[Math.floor(Math.random() * SAMPLE.length)];
    out.push({
      title: s.t, description: s.d, source: "Sample Feed",
      url: "#", publishedAt: new Date().toISOString(), country,
    });
  }
  return out;
}

export async function collect() {
  if (KEY) {
    // rotate through GNews-supported countries, one per tick
    const supported = COUNTRIES.filter((c) => GNEWS_OK.has(c));
    const code = supported[rot++ % supported.length];
    const items = await fetchGNews(code);
    return { items, live: items.length > 0 };
  }
  return { items: sampleBatch(), live: false };
}
