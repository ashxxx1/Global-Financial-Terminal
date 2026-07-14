/**
 * intelApi.js — frontend client for the intelligence backend (server/).
 *
 * Base URL comes from VITE_INTEL_API (set it to your deployed backend, e.g.
 * https://gft-intel.onrender.com). Defaults to localhost for dev. EVERY call
 * fails soft (returns null / no-op) so the app works with no backend at all —
 * the client-side signal engine remains the always-on fallback.
 */
const BASE = import.meta.env.VITE_INTEL_API || "http://localhost:8787";

async function get(path, { timeout = 4000 } = {}) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(`${BASE}${path}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // backend absent/unreachable — caller falls back
  }
}

export const intelApi = {
  base: BASE,
  economy: (code) => get(`/api/economy/${code}`),
  markets: (code) => get(`/api/markets/${code}`),
  country: (code) => get(`/api/country/${code}`),
  recent: () => get(`/api/recent`),
  health: () => get(`/health`, { timeout: 2500 }),

  /** Subscribe to the live SSE event stream. Returns an unsubscribe fn (or no-op). */
  subscribe(onEvent) {
    if (typeof EventSource === "undefined") return () => {};
    let es;
    try {
      es = new EventSource(`${BASE}/stream`);
      es.addEventListener("event", (e) => {
        try { onEvent(JSON.parse(e.data)); } catch { /* ignore malformed */ }
      });
      es.onerror = () => {}; // stay silent; browser auto-retries
    } catch {
      return () => {};
    }
    return () => es && es.close();
  },
};
