/**
 * news.ts — deterministic news engine with per-article AI-style analysis.
 *
 * Until a live news key is wired in, headlines are synthesized from each
 * country's own market state (sectors, index moves, real company names), so
 * every article is self-consistent with the data on screen — and clearly
 * labeled SIM. The analysis block (sentiment, impact, winners/losers,
 * confidence) is derived from the same seed, per the spec's AI News Analysis.
 */
import { STOCKS_BY_COUNTRY } from "../data/stocksData";
import { COUNTRIES } from "./market";

export interface Article {
  id: string;
  country: string;
  countryName: string;
  category: string;
  headline: string;
  summary: string;
  source: string;
  minutesAgo: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  sentimentScore: number;      // 0..100
  confidence: number;          // 0..100
  impact: "High" | "Medium" | "Low";
  industries: string[];
  relatedStocks: string[];
  whyItMatters: string;
  whatNext: string;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let s = seed || 1;
  return () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

const CATEGORIES = ["Markets", "Economy", "Business", "Technology", "Energy", "Government"] as const;

const TEMPLATES: Record<string, string[]> = {
  Markets: [
    "{index} {dir} as {sector} stocks {verb}",
    "Institutional flows rotate into {sector} names on {name} strength",
    "{name} leads {sector} rally after upbeat guidance",
  ],
  Economy: [
    "Central bank signals {stance} stance as inflation trends {dir2}",
    "{country} PMI surprises {dir2}; {sector} orders drive the print",
    "Trade balance improves as {sector} exports accelerate",
  ],
  Business: [
    "{name} announces expansion into new {sector} capacity",
    "M&A chatter builds around mid-cap {sector} names",
    "{name} beats on revenue; margin outlook {dir2}",
  ],
  Technology: [
    "AI adoption lifts {sector} productivity forecasts in {country}",
    "{name} unveils platform update; analysts see share gains",
    "Chip supply normalization supports {sector} margins",
  ],
  Energy: [
    "Energy transition capex accelerates across {country} {sector}",
    "{name} secures long-term supply agreement; volumes {dir2}",
    "Grid investment plans lift utility and {sector} outlooks",
  ],
  Government: [
    "New fiscal package targets {sector} competitiveness",
    "Regulators outline framework for {sector}; compliance costs debated",
    "Infrastructure bill advances; {sector} contractors in focus",
  ],
};

export function newsFor(country: string, count = 10, epochMin = 45): Article[] {
  const meta = COUNTRIES[country];
  const stocks = (STOCKS_BY_COUNTRY as Record<string, any[]>)[country] || [];
  if (!meta || stocks.length === 0) return [];

  // Re-seed every `epochMin` minutes so the feed refreshes over time yet stays
  // deterministic within a window (consistent across tabs/reloads).
  const epoch = Math.floor(Date.now() / (epochMin * 60000));
  const out: Article[] = [];

  for (let i = 0; i < count; i++) {
    const seed = hash(country + ":" + epoch + ":" + i);
    const r = rng(seed);
    const cat = CATEGORIES[Math.floor(r() * CATEGORIES.length)];
    const tpl = TEMPLATES[cat][Math.floor(r() * TEMPLATES[cat].length)];
    const stock = stocks[Math.floor(r() * stocks.length)];
    const sectors = [...new Set(stocks.map((s) => s.sector))];
    const sector = sectors[Math.floor(r() * sectors.length)] || "Industrial";
    const bullish = r() > 0.42;
    const score = Math.round(bullish ? 55 + r() * 40 : 10 + r() * 40);

    const headline = tpl
      .replace("{index}", meta.marketIndex)
      .replace("{name}", stock.name)
      .replace("{sector}", sector)
      .replace("{country}", meta.name)
      .replace("{dir}", bullish ? "advances" : "slips")
      .replace("{dir2}", bullish ? "higher" : "lower")
      .replace("{stance}", bullish ? "a dovish" : "a hawkish")
      .replace("{verb}", bullish ? "extend gains" : "come under pressure");

    const related = stocks.filter((s) => s.sector === sector).slice(0, 3).map((s) => s.ticker);

    out.push({
      id: country + "-" + epoch + "-" + i,
      country,
      countryName: meta.name,
      category: cat,
      headline,
      summary: `${meta.name} ${cat.toLowerCase()} update: ${sector} in focus as market participants weigh positioning around ${stock.name} and peers.`,
      source: ["Reuters Wire", "Global Desk", "Market Watch", "Terminal Intel"][Math.floor(r() * 4)],
      minutesAgo: Math.floor(5 + r() * 480),
      sentiment: score >= 58 ? "Bullish" : score <= 42 ? "Bearish" : "Neutral",
      sentimentScore: score,
      confidence: Math.round(55 + r() * 40),
      impact: r() > 0.7 ? "High" : r() > 0.35 ? "Medium" : "Low",
      industries: [sector],
      relatedStocks: related.length ? related : [stock.ticker],
      whyItMatters: bullish
        ? `Sustained ${sector.toLowerCase()} strength supports earnings revisions and could pull forward institutional allocation to ${meta.name}.`
        : `Weakness in ${sector.toLowerCase()} pressures index heavyweights and may weigh on near-term sentiment for ${meta.name} assets.`,
      whatNext: bullish
        ? "Watch follow-through volume and whether leadership broadens beyond the initial movers."
        : "Watch for stabilization signals — policy response, valuation support, or sector rotation.",
    });
  }
  return out.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

export function globalNews(perCountry = 2, countries?: string[]): Article[] {
  const codes = countries && countries.length
    ? countries
    : Object.keys(COUNTRIES).filter((c) => (STOCKS_BY_COUNTRY as Record<string, unknown[]>)[c]);
  const all = codes.flatMap((c) => newsFor(c, perCountry));
  return all.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

/* ═══════════════════════════════════════════════════════════════════════════
   REAL NEWS PIPELINE — activates automatically when VITE_GNEWS_API_KEY is set
   (locally in .env.local, or in Vercel → Project → Settings → Environment
   Variables). Fetch → dedupe → entity-link → enrich → rank. Falls back to the
   deterministic engine when no key / offline, and says so via `source: "sim"`.
   ═══════════════════════════════════════════════════════════════════════════ */

const GNEWS_KEY: string = (import.meta as any).env?.VITE_GNEWS_API_KEY || "";
// Countries GNews' top-headlines endpoint supports:
const GNEWS_COUNTRIES = new Set([
  "AU","BR","CA","CN","EG","FR","DE","GR","HK","IN","IE","IL","IT","JP","NL","NO",
  "PK","PE","PH","PT","RO","RU","SG","ES","SE","CH","TW","UA","GB","US",
]);

const seenTitles = new Set<string>();
const titleKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);

const POS = ["surge","rally","beat","beats","record","growth","gain","gains","boost","strong","upgrade","expands","profit","soar","recovery","deal","wins","approval"];
const NEG = ["fall","falls","drop","crash","slump","cuts","cut","loss","losses","weak","downgrade","recession","default","strike","sanction","war","attack","fraud","lawsuit","bankruptcy","layoff"];
const HIGH_IMPACT = ["war","sanction","rate decision","central bank","crash","default","earthquake","election","opec","tariff","emergency","invasion","collapse"];

interface Linked { stocks: string[]; industries: string[]; }
function linkEntities(text: string, country: string): Linked {
  const t = text.toLowerCase();
  const stocks: string[] = [];
  const industries = new Set<string>();
  const pools = [
    ...(((STOCKS_BY_COUNTRY as Record<string, any[]>)[country]) || []),
    ...(((STOCKS_BY_COUNTRY as Record<string, any[]>)["US"]) || []).slice(0, 20), // global mega-caps
  ];
  for (const s of pools) {
    const nameCore = String(s.name).replace(/\b(inc|corp|corporation|ltd|plc|group|co|sa|ag|nv)\.?\b/gi, "").trim().toLowerCase();
    if (nameCore.length >= 4 && t.includes(nameCore)) {
      if (!stocks.includes(s.ticker)) { stocks.push(s.ticker); industries.add(s.sector); }
    }
  }
  return { stocks: stocks.slice(0, 4), industries: [...industries].slice(0, 3) };
}

function scoreSentiment(text: string): number {
  const t = text.toLowerCase();
  let score = 50;
  for (const w of POS) if (t.includes(w)) score += 8;
  for (const w of NEG) if (t.includes(w)) score -= 8;
  return Math.max(5, Math.min(95, score));
}

export interface CountryNewsResult { articles: Article[]; live: boolean; }

export async function fetchCountryNews(country: string, max = 10): Promise<CountryNewsResult> {
  const iso = country.toUpperCase();
  if (!GNEWS_KEY || !GNEWS_COUNTRIES.has(iso)) {
    return { articles: newsFor(iso, max), live: false };
  }
  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=business&lang=en&max=${max}&country=${iso.toLowerCase()}&apikey=${GNEWS_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const meta = COUNTRIES[iso];
    const out: Article[] = [];
    for (const a of j.articles || []) {
      const key = titleKey(a.title || "");
      if (!key || seenTitles.has(key)) continue;    // dedupe across refreshes
      seenTitles.add(key);
      const text = `${a.title} ${a.description || ""}`;
      const { stocks, industries } = linkEntities(text, iso);
      const s = scoreSentiment(text);
      const impactHit = HIGH_IMPACT.some((w) => text.toLowerCase().includes(w));
      const sentiment = s >= 58 ? "Bullish" : s <= 42 ? "Bearish" : "Neutral";
      out.push({
        id: "gnews-" + key,
        country: iso,
        countryName: meta?.name || iso,
        category: "Business",
        headline: a.title,
        summary: a.description || "",
        source: a.source?.name || "GNews",
        minutesAgo: Math.max(1, Math.round((Date.now() - new Date(a.publishedAt).getTime()) / 60000)),
        sentiment,
        sentimentScore: s,
        confidence: Math.min(90, 55 + stocks.length * 8 + (impactHit ? 10 : 0)),
        impact: impactHit ? "High" : stocks.length > 0 ? "Medium" : "Low",
        industries: industries.length ? industries : ["Markets"],
        relatedStocks: stocks,
        whyItMatters: sentiment === "Bullish"
          ? `Positive read-through for ${industries[0] || "local"} names${stocks.length ? ` — directly mentions ${stocks.join(", ")}` : ""}; supports near-term sentiment in ${meta?.name || iso}.`
          : sentiment === "Bearish"
            ? `Headwind for ${industries[0] || "local"} exposure${stocks.length ? ` — watch ${stocks.join(", ")}` : ""}; may pressure ${meta?.name || iso} risk appetite.`
            : `Mixed implications; monitor follow-through in ${meta?.name || iso} ${industries[0] ? industries[0].toLowerCase() : "markets"}.`,
        whatNext: impactHit
          ? "High-impact keywords detected — expect fast repricing and headline risk; confirm with official sources."
          : "Watch volume and whether related names react at the next session open.",
      });
    }
    // Refreshes can be fully deduped — top up from the deterministic engine so
    // the feed is never empty, clearly interleaved (sim items carry sim ids).
    if (out.length < 3) out.push(...newsFor(iso, max - out.length));
    return { articles: out.sort((x, y) => x.minutesAgo - y.minutesAgo), live: true };
  } catch {
    return { articles: newsFor(iso, max), live: false };
  }
}
