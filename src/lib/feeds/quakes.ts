/**
 * feeds/quakes.ts — LIVE global event detection, first source: USGS earthquakes
 * (keyless, CORS-open, authoritative). Polls every 2 minutes; each quake is
 * auto-tagged to the nearest tracked countries and scored for market impact —
 * the seed of the spec's Global Event Detection engine.
 */
import { publish } from "./bus";
import { COUNTRIES } from "../market";

export interface QuakeEvent {
  id: string;
  mag: number;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depthKm: number;
  countries: string[];   // nearest tracked ISO2s
  url: string;
}

const quakes: QuakeEvent[] = [];
let started = false;

export function latestQuakes(): QuakeEvent[] { return quakes; }

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestCountries(lat: number, lng: number, maxKm = 1200, n = 3): string[] {
  return Object.values(COUNTRIES)
    .map((c) => ({ code: c.code, d: haversineKm(lat, lng, c.lat, c.lng) }))
    .filter((x) => x.d <= maxKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.code);
}

async function poll(): Promise<void> {
  try {
    const r = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson");
    if (!r.ok) return;
    const j = await r.json();
    const next: QuakeEvent[] = [];
    for (const f of j.features || []) {
      const [lng, lat, depth] = f.geometry.coordinates;
      const q: QuakeEvent = {
        id: f.id, mag: f.properties.mag, place: f.properties.place,
        time: f.properties.time, lat, lng, depthKm: depth,
        countries: nearestCountries(lat, lng), url: f.properties.url,
      };
      next.push(q);
      if (q.mag >= 4.5) {
        publish({
          id: `usgs-${q.id}`,
          kind: "event",
          timestamp: q.time,
          received: Date.now(),
          source: "USGS",
          confidence: 97,
          countryTags: q.countries,
          marketTags: q.mag >= 6 ? ["supply-chain", "insurance", "commodities"] : [],
          industryTags: q.mag >= 6 ? ["Industrial", "Real Estate", "Utilities"] : [],
          summary: `M${q.mag.toFixed(1)} earthquake — ${q.place}`,
          impact: q.mag >= 6.5 ? "High" : q.mag >= 5.5 ? "Medium" : "Low",
          payload: q,
        });
      }
    }
    quakes.splice(0, quakes.length, ...next.sort((a, b) => b.time - a.time));
  } catch { /* offline — keep last snapshot */ }
}

export function startQuakeFeed(): void {
  if (started) return;
  started = true;
  poll();
  setInterval(poll, 120000);
}
