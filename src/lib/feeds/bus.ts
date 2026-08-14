/**
 * feeds/bus.ts — the ingest backbone.
 *
 * Every piece of live data enters the app as a normalized Envelope
 * (timestamp · source · confidence · tags · summary · impact) and is fanned
 * out over an in-app event bus. Feeds push; UI subscribes; nothing polls the
 * DOM or requires refreshes. This is the client-side equivalent of the SSE
 * layer in SPEC-PIPELINE.md — when a hosted backend lands, these buses simply
 * re-point at real SSE/WebSocket endpoints with zero UI changes.
 */

export interface Envelope<T = unknown> {
  id: string;
  kind: "quote" | "event" | "news";
  timestamp: number;        // epoch ms — when the fact occurred / was published
  received: number;         // epoch ms — when we ingested it
  source: string;           // e.g. "Binance WS", "ECB via frankfurter.dev", "USGS"
  confidence: number;       // 0..100 — source authority × freshness
  countryTags: string[];    // ISO2
  marketTags: string[];     // symbols / asset classes
  industryTags: string[];
  summary: string;          // auto-generated one-liner
  impact: "High" | "Medium" | "Low";
  payload: T;
}

type Handler = (e: Envelope) => void;
const handlers = new Set<Handler>();
const recent: Envelope[] = [];
const MAX_RECENT = 200;
const seen = new Set<string>();

export function publish(e: Envelope): void {
  if (seen.has(e.id)) return;           // global dedupe
  seen.add(e.id);
  if (seen.size > 2000) { const first = seen.values().next().value; if (first) seen.delete(first); }
  recent.unshift(e);
  if (recent.length > MAX_RECENT) recent.pop();
  handlers.forEach((h) => { try { h(e); } catch { /* subscribers never break the bus */ } });
}

export function subscribeBus(h: Handler): () => void {
  handlers.add(h);
  return () => handlers.delete(h);
}

export function recentEnvelopes(kind?: Envelope["kind"], n = 50): Envelope[] {
  const list = kind ? recent.filter((e) => e.kind === kind) : recent;
  return list.slice(0, n);
}

/** Compact "just now / 5m / 3h / 2d" from an epoch-ms timestamp. */
export function relativeTime(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
