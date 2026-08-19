/**
 * Attach live quotes and, where the research pipeline can retrieve them,
 * fundamental snapshots. Failures become caveats — never invented metrics.
 */
import { quoteFor } from "../market";
import { fetchDataset, num, type Metrics, type NewsItem } from "../research/data";
import type { MetricPoint } from "./types";

const US_LIKE = /^[A-Z]{1,5}$/;

export interface EnrichedQuote {
  metrics: MetricPoint[];
  quoteSource: "live" | "cached" | "sim" | "none";
  lastPrice: string | null;
  changePct: number | null;
  caveat: string | null;
  news: NewsItem[];
}

function isResearchable(symbol: string): boolean {
  // Finnhub free coverage is US-ticker shaped. Exchange-local codes usually 403/empty.
  return US_LIKE.test(symbol) && !/^[0-9]+$/.test(symbol);
}

export async function enrichSymbol(symbol: string): Promise<EnrichedQuote> {
  const q = quoteFor(symbol);
  const quoteSource: EnrichedQuote["quoteSource"] = q ? q.source : "none";
  const metrics: MetricPoint[] = [];
  let caveat: string | null = null;
  let news: NewsItem[] = [];

  if (q) {
    metrics.push({
      label: "Last",
      value: `${q.display} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%)`,
      source: q.source === "live" ? "Live quote" : q.source === "cached" ? "Cached quote" : "GFT quote (simulated — labelled)",
      asOf: Date.now(),
      simulated: q.source === "sim",
    });
  }

  if (!isResearchable(symbol)) {
    return {
      metrics,
      quoteSource,
      lastPrice: q?.display ?? null,
      changePct: q?.changePct ?? null,
      caveat: "Fundamentals are not requested for this listing — the current research feed is US-ticker shaped. No numbers are invented.",
      news: [],
    };
  }

  try {
    const [m, n] = await Promise.all([
      fetchDataset<Metrics>("metrics", symbol),
      fetchDataset<NewsItem[]>("news", symbol),
    ]);
    if (m.ok) {
      const pe = num(m.data, "peTTM");
      const mgn = num(m.data, "netProfitMarginTTM");
      const rev = num(m.data, "revenueGrowthTTMYoy");
      const de = num(m.data, "totalDebt/totalEquityQuarterly") ?? num(m.data, "totalDebtToEquity");
      if (pe != null) metrics.push({ label: "P/E TTM", value: `${pe.toFixed(1)}×`, source: "Finnhub fundamentals", asOf: m.fetchedAt });
      if (mgn != null) metrics.push({ label: "Net margin TTM", value: `${mgn.toFixed(1)}%`, source: "Finnhub fundamentals", asOf: m.fetchedAt });
      if (rev != null) metrics.push({ label: "Revenue growth YoY", value: `${rev >= 0 ? "+" : ""}${rev.toFixed(1)}%`, source: "Finnhub fundamentals", asOf: m.fetchedAt });
      if (de != null) metrics.push({ label: "Debt/equity", value: de.toFixed(2), source: "Finnhub fundamentals", asOf: m.fetchedAt });
      if (pe == null && mgn == null && rev == null) {
        caveat = "Fundamentals payload arrived but the usual metrics were empty.";
      }
    } else {
      caveat = m.reason === "rate-limited"
        ? "Fundamentals rate-limited — analysis continues on quotes and catalog exposure."
        : m.reason === "premium"
          ? "This fundamental dataset is not on the current plan."
          : "Fundamentals unavailable — using catalog exposure and quotes only.";
    }
    if (n.ok && Array.isArray(n.data)) news = n.data.slice(0, 3);
  } catch {
    caveat = "Research feed failed — analysis continues on catalog exposure and any local quote.";
  }

  return {
    metrics,
    quoteSource,
    lastPrice: q?.display ?? null,
    changePct: q?.changePct ?? null,
    caveat,
    news,
  };
}
