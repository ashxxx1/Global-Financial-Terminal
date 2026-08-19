/**
 * Finnhub provider.
 *
 * The only vendor-aware file in the research layer. Everything above it sees
 * capabilities and normalised shapes; the dataset names, the 403-means-paid
 * convention and the response envelope all stop here.
 */
import type { CapabilityId } from "../capabilities";
import type { Provider, Fetched, FailureReason } from "./types";
import { ttlFor } from "./types";

/** capability -> the dataset name api/research.ts understands. */
const DATASETS: Partial<Record<CapabilityId, string>> = {
  fundamentals: "metrics",
  "fundamental-history": "metrics",
  "earnings-surprises": "earnings",
  "analyst-ratings": "recommendations",
  "company-news": "news",
  "sec-filings": "filings",
  "insider-transactions": "insider",
  peers: "peers",
};

const PROFILE_DATASET = "profile";

function classify(status: number): FailureReason {
  if (status === 403) return "premium";
  if (status === 429) return "rate-limited";
  if (status === 501) return "not-configured";
  return "error";
}

export const finnhubProvider: Provider = {
  id: "finnhub",
  label: "Finnhub",
  serves: Object.keys(DATASETS) as CapabilityId[],

  async fetch<T>(capability: CapabilityId, symbol: string): Promise<Fetched<T>> {
    const dataset = capability === "company-profile" ? PROFILE_DATASET : DATASETS[capability];
    if (!dataset) {
      return { ok: false, reason: "unsupported", capability, provider: "finnhub" };
    }
    try {
      const r = await fetch(`/api/research?dataset=${dataset}&symbol=${encodeURIComponent(symbol)}`);
      if (!r.ok) {
        return { ok: false, reason: classify(r.status), capability, provider: "Finnhub" };
      }
      const body = await r.json();
      const data = body?.data;
      const empty =
        data == null ||
        (Array.isArray(data) && data.length === 0) ||
        (typeof data === "object" && Object.keys(data).length === 0);
      if (empty) return { ok: false, reason: "empty", capability, provider: "Finnhub" };

      return {
        ok: true,
        data: data as T,
        provenance: {
          provider: "Finnhub",
          fetchedAt: body.fetchedAt ?? Date.now(),
          ttlMs: ttlFor(capability),
          capability,
        },
      };
    } catch {
      return { ok: false, reason: "error", capability, provider: "Finnhub" };
    }
  },
};
