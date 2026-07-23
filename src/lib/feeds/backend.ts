/**
 * feeds/backend.ts — connect the UI to the hosted ingest service (SSE).
 *
 * When VITE_API_URL is set, the frontend consumes the backend's unified stream
 * (all sources, server-side keys, history replay) instead of running feeds in
 * the browser. Quote envelopes update the live-override layer; everything is
 * republished onto the in-app bus so components stay source-agnostic. If unset,
 * the app runs the in-browser feeds and nothing here is used.
 */
import { publish, type Envelope } from "./bus";
import { setLiveQuote } from "../market";

export const BACKEND_URL: string = (import.meta as any).env?.VITE_API_URL || "";

export function connectBackend(baseUrl: string = BACKEND_URL): () => void {
  if (!baseUrl) return () => {};
  const url = baseUrl.replace(/\/$/, "") + "/api/stream";
  const es = new EventSource(url);

  es.addEventListener("envelope", (ev) => {
    try {
      const e = JSON.parse((ev as MessageEvent).data) as Envelope;
      if (e.kind === "quote" && e.marketTags[0]) {
        const p = e.payload as { price?: number; changePct?: number };
        if (typeof p?.price === "number") {
          setLiveQuote(e.marketTags[0], { price: p.price, changePct: p.changePct ?? 0, source: "live" });
        }
      }
      publish(e);
    } catch { /* malformed frame — skip */ }
  });

  es.onerror = () => { /* EventSource auto-reconnects; nothing to do */ };
  return () => es.close();
}
