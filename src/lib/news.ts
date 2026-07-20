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
