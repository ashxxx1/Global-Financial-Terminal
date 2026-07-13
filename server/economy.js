/**
 * economy.js — real macroeconomic data (spec "Economy" panel), FREE, no key.
 *
 * Uses the World Bank Open Data API (most-recent value per indicator).
 * Cached in-memory for 24h since these update infrequently.
 */
const INDICATORS = {
  gdpUsd: "NY.GDP.MKTP.CD",       // GDP (current US$)
  gdpGrowth: "NY.GDP.MKTP.KD.ZG", // GDP growth %
  inflation: "FP.CPI.TOTL.ZG",    // inflation %
  unemployment: "SL.UEM.TOTL.ZS", // unemployment %
  population: "SP.POP.TOTL",
};

const cache = new Map(); // code -> { ts, data }
const DAY = 24 * 3600 * 1000;

async function wb(code, indicator) {
  const url = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&per_page=1&mrv=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const row = Array.isArray(json) && json[1] && json[1][0];
  return row && row.value != null ? { value: row.value, year: row.date, generated: "fact" } : null;
}

export async function fetchEconomy(code) {
  const cc = (code || "").toUpperCase();
  const hit = cache.get(cc);
  if (hit && Date.now() - hit.ts < DAY) return hit.data;

  const entries = await Promise.all(
    Object.entries(INDICATORS).map(async ([key, ind]) => [key, await wb(cc, ind)])
  );
  const data = {
    country: cc,
    source: "World Bank",
    generated: "fact", // verified fact, NOT an AI prediction
    indicators: Object.fromEntries(entries),
    fetchedAt: new Date().toISOString(),
  };
  cache.set(cc, { ts: Date.now(), data });
  return data;
}
