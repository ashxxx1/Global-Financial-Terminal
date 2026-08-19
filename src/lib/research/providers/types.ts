/**
 * Provider abstraction for the research layer.
 *
 * The analyzers must never know which vendor answered. They ask the capability
 * registry for a capability — "fundamental-history" — and get back data plus
 * the provenance of whoever served it. That is what makes adding a paid source
 * a registration rather than a rewrite: a new provider declares the
 * capabilities it serves, and every analyzer that already asks for them starts
 * receiving richer data with no code change.
 *
 * It is also what stops Finnhub's shapes leaking upward. A provider is
 * responsible for normalising its own payload into the shared types below;
 * anything vendor-specific dies at this boundary.
 */
import type { CapabilityId } from "../capabilities";

/** Why a fetch produced nothing. Distinct reasons drive distinct user copy. */
export type FailureReason =
  | "premium"        // exists, but our plan does not include it
  | "unsupported"    // no provider we have offers it at all
  | "rate-limited"
  | "empty"          // provider answered, had nothing for this symbol
  | "not-configured"
  | "error";

export interface Provenance {
  /** Human name of whoever served this, for the evidence trail. */
  provider: string;
  /** When we fetched it. */
  fetchedAt: number;
  /**
   * When the underlying datum was published, when the provider tells us.
   * Distinct from fetchedAt: a filing from March fetched today is March data.
   */
  reportedAt?: number;
  /** How stale this may be before it misleads, in ms. */
  ttlMs: number;
  capability: CapabilityId;
}

export type Fetched<T> =
  | { ok: true; data: T; provenance: Provenance }
  | { ok: false; reason: FailureReason; capability: CapabilityId; provider?: string };

/** What a provider must implement to serve a capability. */
export interface Provider {
  id: string;
  label: string;
  /** Capabilities this provider can serve, given the current plan. */
  serves: CapabilityId[];
  /**
   * Fetch one capability for one symbol. Providers normalise into the shared
   * shapes in ../data.ts; returning raw vendor JSON defeats the abstraction.
   */
  fetch<T>(capability: CapabilityId, symbol: string): Promise<Fetched<T>>;
}

/** Cache policy per capability, in ms. Slow-moving data, long life. */
export const TTL: Record<string, number> = {
  quote: 30_000,
  "price-history": 5 * 60_000,
  fundamentals: 60 * 60_000,
  "fundamental-history": 60 * 60_000,
  "earnings-surprises": 60 * 60_000,
  "analyst-ratings": 60 * 60_000,
  "company-news": 15 * 60_000,
  "sec-filings": 60 * 60_000,
  "insider-transactions": 60 * 60_000,
  peers: 24 * 60 * 60_000,
};

export const ttlFor = (c: CapabilityId): number => TTL[c] ?? 15 * 60_000;
