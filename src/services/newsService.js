/**
 * newsService.js — fetches real-time business news per country.
 *
 * Uses the free GNews API when VITE_GNEWS_API_KEY is set (100 req/day free tier);
 * otherwise returns realistic mock headlines so the feature runs with no key.
 * Results are shaped uniformly for the signal engine (newsSignals.js).
 *
 * Item shape: { title, description, source, publishedAt, url }
 */

const GNEWS_KEY = import.meta.env.VITE_GNEWS_API_KEY || "";

// Phase 1 — 5 countries. Add more codes here to expand coverage.
export const SUPPORTED_COUNTRIES = ["US", "IN", "GB", "JP", "CN"];

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

// ── Mock fallback (runs with no API key) ─────────────────────────────────────
// Small seed of realistic business headlines per country, spread across sectors
// and sentiment so the signal engine produces varied output immediately.
const MOCK = {
  US: [
    { title: "Tech rally lifts markets as chip demand surges on AI boom", description: "Semiconductor and software stocks jump on strong cloud spending." },
    { title: "Fed signals it may hold interest rates, banks rally", description: "Lending outlook improves as rate fears ease for major banks." },
    { title: "Oil prices drop on rising inventories, energy shares slip", description: "Crude falls as supply builds, pressuring energy majors." },
    { title: "Automaker beats delivery estimates as EV demand grows", description: "Electric vehicle sales strength boosts the auto sector." },
    { title: "Retail sales miss forecasts, consumer spending weakens", description: "Shoppers pull back, weighing on consumer stocks." },
  ],
  IN: [
    { title: "Indian IT firms surge on record export orders and AI deals", description: "Technology sector rallies on strong global demand." },
    { title: "RBI holds rates steady, banking stocks gain on credit growth", description: "Lending momentum lifts major Indian banks." },
    { title: "Crude imports weigh on rupee, energy refiners under pressure", description: "Rising oil costs pressure energy and fuel companies." },
    { title: "Auto sales hit festive-season record as demand booms", description: "Vehicle makers report strong growth." },
    { title: "Pharma exports jump on new drug approvals abroad", description: "Healthcare sector strengthens on export wins." },
  ],
  GB: [
    { title: "FTSE banks rally as Bank of England signals rate cuts", description: "Lower rates brighten the outlook for UK lenders." },
    { title: "North Sea oil output falls, energy shares decline", description: "Crude production drop hits UK energy majors." },
    { title: "UK retailers warn of weak consumer spending amid inflation", description: "Cost pressures weigh on the consumer sector." },
    { title: "London tech startups attract record investment", description: "Technology funding surges in the capital." },
    { title: "Housing market rebounds as mortgage rates ease", description: "Property and homebuilders gain on recovery." },
  ],
  JP: [
    { title: "Nikkei climbs as automakers post record export profits", description: "Vehicle exporters lead gains on a weak yen." },
    { title: "Japan chipmakers surge on global semiconductor demand", description: "Technology sector rallies on AI-driven orders." },
    { title: "Bank of Japan holds policy, financial stocks steady", description: "Lenders hold firm as rate policy stays unchanged." },
    { title: "Energy importers hit by rising crude and gas costs", description: "Fuel costs pressure Japanese utilities." },
    { title: "Retail spending slumps as households cut back", description: "Weak demand weighs on consumer names." },
  ],
  CN: [
    { title: "China tech giants rally on new AI and cloud push", description: "Technology shares surge on policy support." },
    { title: "Property sector slumps as developer default fears grow", description: "Real estate weakness deepens amid a debt crisis." },
    { title: "Beijing unveils stimulus, banks and industrials gain", description: "Lending and manufacturing get a boost." },
    { title: "EV makers report record sales as battery demand booms", description: "Automotive sector strengthens on export growth." },
    { title: "Steel and mining output falls on weak construction demand", description: "Metals producers under pressure." },
  ],
};

function mockNews(code) {
  const seeds = MOCK[code] || MOCK.US;
  const now = Date.now();
  return seeds.map((s, i) => ({
    ...s,
    source: "Sample Feed",
    // stagger timestamps over the last few hours
    publishedAt: new Date(now - i * 45 * 60 * 1000).toISOString(),
    url: "#",
  }));
}

/**
 * Fetch news for a country. Real when a key is set, mock otherwise.
 * @returns {{ items, live, error }}
 */
export async function fetchCountryNews(code) {
  const cc = (code || "").toUpperCase();
  if (GNEWS_KEY) {
    try {
      const items = await fetchFromGNews(cc);
      if (items.length) return { items, live: true, error: null };
      return { items: mockNews(cc), live: false, error: "No live articles returned" };
    } catch (e) {
      return { items: mockNews(cc), live: false, error: e.message };
    }
  }
  return { items: mockNews(cc), live: false, error: null };
}
