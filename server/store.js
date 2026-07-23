/**
 * store.js — in-memory state for the ingest service.
 *
 * Holds three things:
 *   1. a capped ring buffer of recent Envelopes (searchable event/quote history),
 *   2. the latest live quote per symbol (for the /api/quotes snapshot),
 *   3. a short-TTL per-country news cache (so bursts of clicks hit one upstream call).
 *
 * Production target (see SPEC-PIPELINE.md) is Postgres for durable history +
 * Redis for the hot cache; this in-memory version deploys on any free tier and
 * exposes the exact same shapes, so swapping the storage layer is additive.
 */

const RING_MAX = 1000;
const ring = [];              // newest-first Envelopes
const seenIds = new Set();    // global dedupe
const quotes = new Map();     // symbol -> latest quote envelope payload
const newsCache = new Map();  // ISO2 -> { at, articles }

const subscribers = new Set(); // SSE push handlers

/** Record + fan out an Envelope. Returns false if it was a duplicate. */
export function ingest(envelope) {
  if (!envelope || !envelope.id) return false;
  if (seenIds.has(envelope.id)) return false;
  seenIds.add(envelope.id);
  if (seenIds.size > 5000) seenIds.delete(seenIds.values().next().value);

  ring.unshift(envelope);
  if (ring.length > RING_MAX) ring.pop();

  if (envelope.kind === "quote" && envelope.marketTags[0]) {
    quotes.set(envelope.marketTags[0], envelope);
  }

  for (const fn of subscribers) {
    try { fn(envelope); } catch { /* a broken subscriber never stalls ingest */ }
  }
  return true;
}

export function recent(kind, limit = 50) {
  const list = kind ? ring.filter((e) => e.kind === kind) : ring;
  return list.slice(0, limit);
}

export function quotesSnapshot() {
  return [...quotes.values()];
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function subscriberCount() {
  return subscribers.size;
}

/** Per-country news cache with a TTL (ms). */
export function getCachedNews(iso, ttlMs) {
  const hit = newsCache.get(iso);
  if (hit && Date.now() - hit.at < ttlMs) return hit.articles;
  return null;
}
export function setCachedNews(iso, articles) {
  newsCache.set(iso, { at: Date.now(), articles });
}

export function stats() {
  return {
    ringSize: ring.length,
    quotes: quotes.size,
    newsCountries: newsCache.size,
    subscribers: subscribers.size,
    events: ring.filter((e) => e.kind === "event").length,
  };
}
