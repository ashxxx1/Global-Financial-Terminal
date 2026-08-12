import { quoteFor } from "./market";
import { STOCKS_BY_COUNTRY } from "../data/stocksData";
import { countryStats } from "../data/countryStats";
import type { LiveArticle } from "./newsFeed";

/**
 * Risk and sentiment, computed — growth-plan items 3 and 4.
 *
 * Both overlays used to read a hardcoded `riskScore` constant per country and a
 * per-article sentiment string, neither of which moved. That is why they were
 * DEMO-tagged: they were placeholders wearing the clothes of analysis.
 *
 * These are real calculations over inputs we genuinely hold:
 *
 *   Risk      = market dispersion + drawdown breadth + inflation distance from
 *               target + policy-rate level, weighted and clamped to 0-100.
 *   Sentiment = the mean classified score of actual published headlines for
 *               that country, with the sample size carried alongside so a
 *               single article can never masquerade as a national mood.
 *
 * Provenance matters more than the number. `basis` reports whether the price
 * inputs were live or simulated, so a figure derived from simulated prices is
 * still labelled simulated downstream rather than being laundered into fact by
 * one round of arithmetic.
 */

export type RiskBasis = "live" | "mixed" | "simulated";

export interface CountryRisk {
  /** 0 (calm) … 100 (stressed). */
  score: number;
  basis: RiskBasis;
  /** Human breakdown, for the tooltip — never a bare number with no reasoning. */
  factors: { label: string; value: string }[];
  sampleSize: number;
}

const num = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Population standard deviation, in percentage points. */
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function riskFor(code: string): CountryRisk {
  const roster = (STOCKS_BY_COUNTRY as Record<string, { ticker: string }[]>)[code] || [];
  const quotes = roster
    .map((r) => quoteFor(r.ticker))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const changes = quotes.map((q) => q.changePct);
  const liveCount = quotes.filter((q) => q.source === "live").length;
  const basis: RiskBasis =
    quotes.length === 0 ? "simulated"
    : liveCount === quotes.length ? "live"
    : liveCount > 0 ? "mixed" : "simulated";

  // 1) Dispersion — how violently names disagree. ~2.5pp stdev reads as stressed.
  const dispersion = clamp((stdev(changes) / 2.5) * 100);

  // 2) Breadth — share of the roster falling. Broad declines are riskier than
  //    an index dragged by one megacap.
  const decliners = changes.filter((c) => c < 0).length;
  const breadth = changes.length ? (decliners / changes.length) * 100 : 50;

  // 3) Inflation distance from a 2% target, either direction (deflation is not
  //    "safe"). 6pp away saturates.
  const stats = (countryStats as Record<string, Record<string, unknown>>)[code];
  const infl = num(stats?.inflation);
  const inflationRisk = infl == null ? 45 : clamp((Math.abs(infl - 2) / 6) * 100);

  // 4) Policy rate level — tight money is a real financial-conditions risk.
  const rate = num(stats?.rate);
  const rateRisk = rate == null ? 45 : clamp((rate / 12) * 100);

  const score = Math.round(
    dispersion * 0.30 + breadth * 0.25 + inflationRisk * 0.25 + rateRisk * 0.20,
  );

  return {
    score: clamp(score),
    basis,
    sampleSize: quotes.length,
    factors: [
      { label: "Dispersion", value: `${stdev(changes).toFixed(2)}pp` },
      { label: "Declining", value: `${Math.round(breadth)}%` },
      { label: "Inflation", value: infl == null ? "n/a" : `${infl.toFixed(1)}%` },
      { label: "Policy rate", value: rate == null ? "n/a" : `${rate.toFixed(2)}%` },
    ],
  };
}

export interface CountrySentiment {
  /** 0 (bearish) … 100 (bullish), matching newsFeed's own scale. */
  score: number;
  label: "Bullish" | "Bearish" | "Neutral";
  /** Number of real headlines behind the figure. */
  sampleSize: number;
}

/**
 * Mean sentiment of real published headlines for a country.
 *
 * Returns null below three articles: two headlines are an anecdote, and
 * colouring a whole country by an anecdote is exactly the false confidence the
 * DEMO tag existed to warn about.
 */
export function sentimentFor(code: string, articles: LiveArticle[]): CountrySentiment | null {
  const mine = articles.filter((a) => a.country === code);
  if (mine.length < 3) return null;

  // newsFeed scores 0-100 with 58/42 as its own bullish/bearish thresholds —
  // reuse them rather than inventing a second, disagreeing scale.
  const mean = mine.reduce((s, a) => s + (a.sentimentScore ?? 50), 0) / mine.length;
  return {
    score: mean,
    label: mean >= 58 ? "Bullish" : mean <= 42 ? "Bearish" : "Neutral",
    sampleSize: mine.length,
  };
}
