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

/** In-memory cache. The edge already caches; this stops one question from
 *  re-requesting the same dataset five times inside one analyzer run. */
const cache = new Map<string, { at: number; value: Fetched<unknown> }>();
const TTL_MS = 5 * 60 * 1000;

export async function fetchDataset<T>(dataset: DatasetName, symbol: string): Promise<Fetched<T>> {
  const key = `${dataset}:${symbol}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Fetched<T>;

  let result: Fetched<T>;
  try {
    const r = await fetch(`/api/research?dataset=${dataset}&symbol=${encodeURIComponent(symbol)}`);
    if (r.status === 403) {
      result = { ok: false, reason: "premium" };
    } else if (r.status === 429) {
      result = { ok: false, reason: "rate-limited" };
    } else if (!r.ok) {
      result = { ok: false, reason: "error" };
    } else {
      const body = await r.json();
      const data = body?.data;
      const empty =
        data == null ||
        (Array.isArray(data) && data.length === 0) ||
        (typeof data === "object" && Object.keys(data).length === 0);
      result = empty
        ? { ok: false, reason: "empty" }
        : { ok: true, data: data as T, fetchedAt: body.fetchedAt ?? Date.now() };
    }
  } catch {
    result = { ok: false, reason: "error" };
  }

  cache.set(key, { at: Date.now(), value: result });
  return result;
}

/* ── Shapes we actually consume, narrowed to the fields used ─────────────── */

export interface Profile {
  name?: string; ticker?: string; finnhubIndustry?: string;
  marketCapitalization?: number; shareOutstanding?: number;
  country?: string; currency?: string; weburl?: string; ipo?: string;
}

/** Finnhub returns ~133 metrics; these are the ones the analyzers cite. */
export interface Metrics {
  metric?: Record<string, number | string | null>;
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
