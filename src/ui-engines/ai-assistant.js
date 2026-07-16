// AI Global Intelligence Assistant — lightweight intent-matching + ranking
// engine over the SAME simulated country/market/risk datasets already used
// throughout this prototype. Not a real LLM: no external calls, no live data.
// Every answer is clearly labeled as generated from the simulated dataset.
import { getCountryMarket } from "./market-engine.js";
import { getCountryRisk } from "./risk-engine.js";

function scoreCountry(country) {
  const market = getCountryMarket(country);
  const risk = getCountryRisk(country);
  return { country, market, risk };
}

function topByLowRisk(countries, n = 5) {
  return countries.map(scoreCountry).sort((a, b) => a.risk.overall - b.risk.overall).slice(0, n);
}
function topByBullish(countries, n = 5) {
  return countries.map(scoreCountry).sort((a, b) => b.market.change - a.market.change).slice(0, n);
}
function findCountry(countries, name) {
  const n = name.toLowerCase();
  return countries.find(c => c.name.toLowerCase() === n) || countries.find(c => c.name.toLowerCase().includes(n));
}

const INTENTS = [
  {
    match: /lowest geopolitical risk|safest countr|low.risk countr/i,
    handle: (countries) => {
      const ranked = topByLowRisk(countries);
      return {
        title: "Lowest Geopolitical & Overall Risk",
        summary: "Ranked by the simulated composite risk score (lower = safer) across all tracked categories.",
        rows: ranked.map(r => ({ label: r.country.name, value: `${r.risk.overall}/100`, tag: r.risk.tier, tagColor: r.risk.color })),
      };
    },
  },
  {
    match: /outperform|best.perform|attracting.*(fdi|investment)|which markets/i,
    handle: (countries) => {
      const ranked = topByBullish(countries);
      return {
        title: "Markets Poised to Outperform (session momentum)",
        summary: "Ranked by simulated index momentum and sentiment — a proxy signal, not a forecast.",
        rows: ranked.map(r => ({ label: r.country.name, value: (r.market.change >= 0 ? "+" : "") + r.market.change.toFixed(1) + "%", tag: r.market.change >= 0 ? "Bullish" : "Bearish", tagColor: r.market.change >= 0 ? "#39d6a3" : "#ff5b68" })),
      };
    },
  },
  {
    match: /semiconductor|chip manufactur/i,
    handle: (countries) => {
      const names = ["Taiwan", "South Korea", "Japan", "United States", "Singapore"];
      const rows = names.map(n => findCountry(countries, n)).filter(Boolean).map(scoreCountry);
      return {
        title: "Semiconductor Manufacturing Hubs",
        summary: "Established fabrication ecosystems, ranked here by simulated risk profile (lower is more stable for long-horizon capex).",
        rows: rows.map(r => ({ label: r.country.name, value: `Risk ${r.risk.overall}/100`, tag: r.risk.tier, tagColor: r.risk.color })),
      };
    },
  },
  {
    match: /ev batter|battery manufactur/i,
    handle: (countries) => {
      const names = ["China", "South Korea", "Indonesia", "Mexico", "Germany"];
      const rows = names.map(n => findCountry(countries, n)).filter(Boolean).map(scoreCountry);
      return {
        title: "EV Battery Manufacturing Candidates",
        summary: "Countries with relevant raw-material or assembly ecosystems in the simulated dataset, ranked by risk.",
        rows: rows.map(r => ({ label: r.country.name, value: `Risk ${r.risk.overall}/100`, tag: r.risk.tier, tagColor: r.risk.color })),
      };
    },
  },
  {
    match: /ai startup/i,
    handle: (countries) => {
      const names = ["United States", "United Kingdom", "Singapore", "India", "Israel"];
      const rows = names.map(n => findCountry(countries, n)).filter(Boolean).map(scoreCountry);
      return {
        title: "AI Startup Ecosystems",
        summary: "Countries with deep capital markets and tech talent pools in the simulated dataset.",
        rows: rows.map(r => ({ label: r.country.name, value: `Risk ${r.risk.overall}/100 · ${(r.market.change>=0?'+':'')+r.market.change.toFixed(1)}%`, tag: r.risk.tier, tagColor: r.risk.color })),
      };
    },
  },
  {
    match: /strongest manufacturing/i,
    handle: (countries) => {
      const names = ["China", "Germany", "Japan", "South Korea", "Mexico"];
      const rows = names.map(n => findCountry(countries, n)).filter(Boolean).map(scoreCountry);
      return {
        title: "Strongest Manufacturing Ecosystems",
        summary: "Established industrial bases in the simulated dataset, ranked by risk profile.",
        rows: rows.map(r => ({ label: r.country.name, value: `Risk ${r.risk.overall}/100`, tag: r.risk.tier, tagColor: r.risk.color })),
      };
    },
  },
];

// "Compare X and Y[, Z]" — generic comparison across any two/three named countries.
function tryCompare(countries, question) {
  const names = countries.map(c => c.name);
  const found = names.filter(n => question.toLowerCase().includes(n.toLowerCase()));
  if (found.length < 2) return null;
  const picked = found.slice(0, 3).map(n => findCountry(countries, n)).filter(Boolean).map(scoreCountry);
  return {
    title: `Comparison: ${picked.map(p => p.country.name).join(" vs ")}`,
    summary: "Side-by-side simulated market and risk snapshot.",
    rows: picked.map(r => ({
      label: r.country.name,
      value: `${(r.market.change >= 0 ? "+" : "") + r.market.change.toFixed(1)}% · Risk ${r.risk.overall}/100 · Rate ${r.market.rate.toFixed(1)}%`,
      tag: r.risk.tier, tagColor: r.risk.color,
    })),
  };
}

export function askIntelligence(question, countries) {
  const cmp = tryCompare(countries, question);
  if (cmp) return { ...cmp, sources: ["Simulated intelligence engine — not live data"] };

  for (const intent of INTENTS) {
    if (intent.match.test(question)) {
      const res = intent.handle(countries);
      return { ...res, sources: ["Simulated intelligence engine — not live data"] };
    }
  }

  // Fallback: generic ranking by lowest risk, framed around the question.
  const ranked = topByLowRisk(countries, 5);
  return {
    title: "General Intelligence Summary",
    summary: `No exact match for "${question}" — showing the lowest-risk countries in the simulated dataset as a general reference.`,
    rows: ranked.map(r => ({ label: r.country.name, value: `${r.risk.overall}/100`, tag: r.risk.tier, tagColor: r.risk.color })),
    sources: ["Simulated intelligence engine — not live data"],
  };
}

export const SAMPLE_PROMPTS = [
  "Which countries have the lowest geopolitical risk?",
  "Which markets are expected to outperform this session?",
  "Which countries are best for semiconductor manufacturing?",
  "Compare India and Vietnam's investment climate.",
  "Where should a company manufacture EV batteries?",
  "Which countries are best for AI startups?",
];
