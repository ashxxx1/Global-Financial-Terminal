/**
 * The shared, published track record.
 *
 * Signals used to be seeded into each visitor's localStorage, which meant every
 * browser held a different "track record" — a demo wearing the clothes of
 * evidence. This reads the one record CI publishes, so every visitor sees the
 * same signals, resolved against the same real prices.
 *
 * Its provenance is git: each daily run is a commit, so the history shows when
 * every signal was written and proves none were added after the outcome was
 * known.
 */
import type { Signal } from "./types";

export interface PublishedRecord {
  version: number;
  createdAt: string;
  updatedAt?: string;
  signals: Signal[];
  runs?: { at: string; added: number; resolved: number; priced: number }[];
  summary?: {
    total: number; open: number; closed: number; wins: number;
    /** Null until enough signals have closed for a rate to mean anything. */
    hitRate: number | null;
    hitRateNote: string;
  };
}

let cached: PublishedRecord | null = null;
/**
 * The in-flight fetch, shared by concurrent callers.
 *
 * A boolean `attempted` flag is not enough: React runs effects twice in
 * development, so the second call returned null while the first was still in
 * flight — and the second is the one whose result gets applied. The page then
 * concluded there was no published record and kept the DEMO label on a real,
 * price-resolved track record.
 */
let inflight: Promise<PublishedRecord | null> | null = null;
let settled = false;

export async function loadPublishedRecord(): Promise<PublishedRecord | null> {
  if (settled) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const r = await fetch("/signals/track-record.json", { cache: "no-cache" });
      if (r.ok) {
        const j = (await r.json()) as PublishedRecord;
        cached = Array.isArray(j?.signals) ? j : null;
      }
    } catch {
      cached = null;
    } finally {
      settled = true;
      inflight = null;
    }
    return cached;
  })();

  return inflight;
}

export const publishedRecord = (): PublishedRecord | null => cached;

/**
 * Whether a real record exists yet.
 *
 * Used to decide between the published record and the demo seed. It requires
 * signals to be present, not merely the file — an empty record is not a track
 * record and should not switch off the DEMO label.
 */
export const hasPublishedRecord = (): boolean => (cached?.signals.length ?? 0) > 0;
