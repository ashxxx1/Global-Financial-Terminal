/**
 * CompanyContext — the shared research state for one company.
 *
 * The panels are not separate tools that each go and fetch. They are views over
 * one context: fetched once, cached with provenance, and handed to every
 * analyzer. That is what makes the workspace coherent rather than eleven
 * widgets that happen to sit on the same screen — the valuation panel and the
 * timeline are reading the same numbers, fetched at the same instant, and the
 * evidence trail says so.
 *
 * It also means gaps are computed once. If earnings history is missing, every
 * panel that depends on it says the same thing about why.
 */
import { getCapability } from "./providers";
import type { Fetched } from "./providers/types";
import type { CapabilityId } from "./capabilities";
import type {
  Metrics, EarningsPoint, NewsItem, Filing, Recommendation, Profile, InsiderResponse,
} from "./data";
import { metaFor, quoteFor } from "../market";

/** Everything a company-level analyzer might need, fetched together. */
export interface CompanyContext {
  symbol: string;
  name: string;
  country: string | null;
  sector: string | null;
  currency: string;
  /** The live/simulated quote at the moment this context was built. */
  quote: { price: number; changePct: number; live: boolean } | null;

  profile: Fetched<Profile>;
  metrics: Fetched<Metrics>;
  earnings: Fetched<EarningsPoint[]>;
  recommendations: Fetched<Recommendation[]>;
  news: Fetched<NewsItem[]>;
  filings: Fetched<Filing[]>;
  insider: Fetched<InsiderResponse>;
  peers: Fetched<string[]>;

  /** When this context was assembled. Every panel stamps from here. */
  builtAt: number;
}

/** The capabilities a full company context tries to fill. */
export const CONTEXT_CAPABILITIES: CapabilityId[] = [
  "company-profile", "fundamentals", "fundamental-history", "earnings-surprises",
  "analyst-ratings", "company-news", "sec-filings", "insider-transactions", "peers",
];

/**
 * Build the context for a symbol.
 *
 * Everything is requested in parallel and every request goes through the
 * capability cache, so opening the workspace on a company visited five minutes
 * ago costs nothing.
 */
export async function buildContext(symbol: string): Promise<CompanyContext> {
  const meta = metaFor(symbol);
  const q = quoteFor(symbol);

  const [profile, metrics, earnings, recommendations, news, filings, insider, peers] = await Promise.all([
    getCapability<Profile>("company-profile", symbol),
    getCapability<Metrics>("fundamentals", symbol),
    getCapability<EarningsPoint[]>("earnings-surprises", symbol),
    getCapability<Recommendation[]>("analyst-ratings", symbol),
    getCapability<NewsItem[]>("company-news", symbol),
    getCapability<Filing[]>("sec-filings", symbol),
    getCapability<InsiderResponse>("insider-transactions", symbol),
    getCapability<string[]>("peers", symbol),
  ]);

  return {
    symbol,
    name: (profile.ok && profile.data.name) || meta?.name || symbol,
    country: meta?.country ?? null,
    sector: meta?.sector ?? null,
    currency: meta?.currency ?? "",
    quote: q ? { price: q.price, changePct: q.changePct, live: q.source === "live" } : null,
    // fundamentals and fundamental-history are the same payload from this
    // provider; a future provider may split them, which is why they are
    // separate capabilities rather than one.
    profile, metrics, earnings, recommendations, news, filings, insider, peers,
    builtAt: Date.now(),
  };
}

/** Which of the context's capabilities came back empty, and why. */
export function contextFailures(ctx: CompanyContext): { capability: CapabilityId; reason: string }[] {
  const entries: [CapabilityId, Fetched<unknown>][] = [
    ["company-profile", ctx.profile], ["fundamentals", ctx.metrics],
    ["earnings-surprises", ctx.earnings], ["analyst-ratings", ctx.recommendations],
    ["company-news", ctx.news], ["sec-filings", ctx.filings],
    ["insider-transactions", ctx.insider], ["peers", ctx.peers],
  ];
  return entries
    .filter(([, f]) => !f.ok)
    .map(([capability, f]) => ({ capability, reason: (f as { reason: string }).reason }));
}

/** Age of the oldest piece of evidence in the context, for the freshness pill. */
export function contextAge(ctx: CompanyContext): { oldestMs: number; anyStale: boolean } {
  const now = Date.now();
  const ages = [ctx.profile, ctx.metrics, ctx.earnings, ctx.recommendations, ctx.news, ctx.filings, ctx.insider, ctx.peers]
    .filter((f): f is Extract<typeof f, { ok: true }> => f.ok)
    .map((f) => ({ age: now - f.provenance.fetchedAt, ttl: f.provenance.ttlMs }));
  if (ages.length === 0) return { oldestMs: 0, anyStale: false };
  return {
    oldestMs: Math.max(...ages.map((a) => a.age)),
    anyStale: ages.some((a) => a.age > a.ttl),
  };
}
