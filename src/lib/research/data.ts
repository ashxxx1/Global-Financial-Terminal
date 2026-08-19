/**
 * Retrieval layer for the research copilot.
 *
 * Everything the analyzers reason over comes through here, and nothing here
 * invents a value. A dataset that is missing, paywalled or rate-limited returns
 * a typed failure so the analyzer can raise a caveat instead of quietly
 * reasoning over a hole.
 */

export type DatasetName =
  | "profile" | "metrics" | "recommendations" | "earnings"
  | "news" | "filings" | "peers" | "insider";

export type Fetched<T> =
  | { ok: true; data: T; fetchedAt: number }
  | { ok: false; reason: "premium" | "rate-limited" | "empty" | "error" };

import { getCapability } from "./providers";
import type { CapabilityId } from "./capabilities";

/**
 * Legacy shape-level accessor, now a thin adapter over the provider layer.
 *
 * The analyzers written before providers existed still ask for a "dataset".
 * Rather than rewrite them all at once, this maps the dataset name onto a
 * capability so every request shares one cache, one TTL policy and one
 * provenance trail. New code should call getCapability directly.
 */
const DATASET_CAPABILITY: Record<DatasetName, CapabilityId> = {
  profile: "company-profile",
  metrics: "fundamentals",
  recommendations: "analyst-ratings",
  earnings: "earnings-surprises",
  news: "company-news",
  filings: "sec-filings",
  peers: "peers",
  insider: "insider-transactions",
};

export async function fetchDataset<T>(dataset: DatasetName, symbol: string): Promise<Fetched<T>> {
  const res = await getCapability<T>(DATASET_CAPABILITY[dataset], symbol);
  if (res.ok) return { ok: true, data: res.data, fetchedAt: res.provenance.fetchedAt };
  const reason = res.reason === "premium" ? "premium"
    : res.reason === "rate-limited" ? "rate-limited"
    : res.reason === "empty" ? "empty" : "error";
  return { ok: false, reason };
}

/* ── Shapes we actually consume, narrowed to the fields used ─────────────── */

export interface Profile {
  name?: string; ticker?: string; finnhubIndustry?: string;
  marketCapitalization?: number; shareOutstanding?: number;
  country?: string; currency?: string; weburl?: string; ipo?: string;
}

/**
 * Finnhub returns ~133 point-in-time metrics plus historical series: 39 annual
 * (up to 42 years) and 41 quarterly (up to 149 quarters). The series are what
 * make historical context possible — see series.ts.
 */
export interface Metrics {
  metric?: Record<string, number | string | null>;
  series?: {
    annual?: Record<string, { period: string; v: number | null }[]>;
    quarterly?: Record<string, { period: string; v: number | null }[]>;
  };
}

/** Read a historical series, tolerating either cadence being absent. */
export function seriesOf(
  m: Metrics | undefined,
  key: string,
  cadence: "annual" | "quarterly" = "quarterly",
): { period: string; v: number | null }[] | undefined {
  return m?.series?.[cadence]?.[key];
}

export interface Recommendation {
  period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number;
}

export interface EarningsPoint {
  period: string; actual: number | null; estimate: number | null;
  surprise: number | null; surprisePercent: number | null;
}

export interface NewsItem {
  datetime: number; headline: string; source: string; url: string; summary?: string;
}

export interface Filing {
  accessNumber?: string; symbol?: string; cik?: string; form?: string;
  filedDate?: string; acceptedDate?: string; reportUrl?: string; filingUrl?: string;
}

export interface InsiderTx {
  name?: string; share?: number; change?: number; filingDate?: string;
  transactionDate?: string; transactionCode?: string; transactionPrice?: number;
}

/** Finnhub wraps insider transactions in { data: [...] }. */
export interface InsiderResponse { data?: InsiderTx[] }

/** Read a numeric metric, tolerating the string/null the API sometimes sends. */
export function num(m: Metrics | undefined, key: string): number | null {
  const v = m?.metric?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
