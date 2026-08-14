/**
 * ingest/quakes.js — LIVE global-event detection via USGS (keyless).
 * Polls the M2.5+ day feed every 2 min, tags each quake to nearby tracked
 * countries, scores market impact, and ingests M4.5+ events as Envelopes.
 */
import { ingest } from "../store.js";
import { COUNTRIES_DATA } from "../../src/data/mockData.js";

const COUNTRIES = Object.values(COUNTRIES_DATA).map((c) => ({ code: c.code, lat: c.lat, lng: c.lng }));

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function nearestCountries(lat, lng, maxKm = 1200, n = 3) {
  return COUNTRIES
    .map((c) => ({ code: c.code, d: haversineKm(lat, lng, c.lat, c.lng) }))
    .filter((x) => x.d <= maxKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.code);
}

async function poll() {
  try {
    const r = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson");
    if (!r.ok) return;
    const j = await r.json();
    for (const f of j.features || []) {
      const mag = f.properties.mag;
      if (mag < 4.5) continue;
      const [lng, lat, depth] = f.geometry.coordinates;
      const countries = nearestCountries(lat, lng);
      ingest({
        id: `usgs-${f.id}`,
        kind: "event",
        timestamp: f.properties.time,
        received: Date.now(),
        source: "USGS",
        confidence: 97,
        countryTags: countries,
        marketTags: mag >= 6 ? ["supply-chain", "insurance", "commodities"] : [],
        industryTags: mag >= 6 ? ["Industrial", "Real Estate", "Utilities"] : [],
        summary: `M${mag.toFixed(1)} earthquake — ${f.properties.place}`,
        impact: mag >= 6.5 ? "High" : mag >= 5.5 ? "Medium" : "Low",
        payload: { mag, place: f.properties.place, lat, lng, depthKm: depth, url: f.properties.url },
      });
    }
  } catch (e) {
    console.warn("[quakes] poll failed:", e.message);
  }
}

export function startQuakeIngest() {
  poll();
  setInterval(poll, 120000);
  console.log("[quakes] ingest started (USGS, 2-min poll)");
}
