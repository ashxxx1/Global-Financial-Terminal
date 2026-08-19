/**
 * Provider registry and the cache in front of it.
 *
 * Resolution is capability-first: ask for a capability, get whichever provider
 * serves it. Providers are tried in registration order, so adding a paid source
 * ahead of the free one is a one-line change and every analyzer that already
 * declared the capability starts getting the better data.
 *
 * Caching lives here rather than in a provider so the policy is uniform and so
 * every cached value keeps the provenance it was fetched with. Nothing is ever
 * handed back without a timestamp — a research tool that cannot say how old a
 * number is has no business showing it.
 */
import { CAPABILITIES, type CapabilityId } from "../capabilities";
import type { Fetched, Provider } from "./types";
import { ttlFor } from "./types";
import { finnhubProvider } from "./finnhub";

/** Ordered: the first provider that serves a capability wins. */
const PROVIDERS: Provider[] = [finnhubProvider];

/** Register a provider ahead of the existing ones (paid sources go first). */
export function registerProvider(p: Provider, position: "first" | "last" = "first"): void {
  if (position === "first") PROVIDERS.unshift(p); else PROVIDERS.push(p);
  cache.clear();   // a better source may now answer what previously failed
}

export const providersFor = (c: CapabilityId): Provider[] =>
  PROVIDERS.filter((p) => p.serves.includes(c));

interface Entry { at: number; value: Fetched<unknown>; ttl: number }
const cache = new Map<string, Entry>();

/** Cached entries with their age, for the freshness panel. */
export function cacheReport(): { key: string; ageMs: number; ttlMs: number; stale: boolean }[] {
  const now = Date.now();
  return [...cache.entries()].map(([key, e]) => ({
    key, ageMs: now - e.at, ttlMs: e.ttl, stale: now - e.at > e.ttl,
  }));
}

export const clearResearchCache = (): void => cache.clear();

/**
 * Fetch a capability for a symbol, through the cache.
 *
 * A cached value past its TTL is discarded rather than served: the whole point
 * of the freshness contract is that a stale number never poses as a live one.
 */
export async function getCapability<T>(capability: CapabilityId, symbol: string): Promise<Fetched<T>> {
  const declared = CAPABILITIES[capability];
  if (declared && declared.availability !== "available") {
    return {
      ok: false,
      reason: declared.availability === "premium" ? "premium" : "unsupported",
      capability,
    };
  }

  const key = `${capability}:${symbol}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value as Fetched<T>;

  const candidates = providersFor(capability);
  if (candidates.length === 0) {
    return { ok: false, reason: "unsupported", capability };
  }

  let last: Fetched<T> = { ok: false, reason: "error", capability };
  for (const p of candidates) {
    const res = await p.fetch<T>(capability, symbol);
    if (res.ok) {
      cache.set(key, { at: Date.now(), value: res, ttl: ttlFor(capability) });
      return res;
    }
    last = res;
    // A hard "not for sale on this plan" will not improve by asking again;
    // a transient error might, so keep trying other providers.
    if (res.reason === "premium") break;
  }
  cache.set(key, { at: Date.now(), value: last, ttl: Math.min(ttlFor(capability), 60_000) });
  return last;
}
