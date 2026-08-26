/**
 * Key fundamentals, from the provider rather than from a hash.
 *
 * What this replaces: `generateFundamentals()` derived market cap, P/E, EPS,
 * dividend yield, beta, average volume and the 52-week range from a hash of the
 * ticker string. It was labelled SIM, but a labelled invented P/E is still an
 * invented P/E sitting where a real one belongs — and these are the figures
 * people actually make decisions on, which makes them worse to fabricate than
 * a price.
 *
 * Every number here now comes from the same fundamentals capability the
 * research engine reasons over, carries the provider's own field name so it can
 * be looked up again, and is simply absent when the provider does not have it.
 * The provider covers US listings; everywhere else this reports the gap instead
 * of filling it.
 */
import { useEffect, useState } from "react";
import { fetchDataset, num, type Metrics } from "./research/data";

export interface FundamentalRow {
  label: string;
  /** Already formatted for display, or null when the provider has no value. */
  value: string | null;
  /** The provider's own field name — the trail back to the source. */
  metricKey: string;
  /** Extra context the figure is meaningless without, e.g. the date of a high. */
  note?: string;
}

export type FundamentalsState =
  | { state: "loading" }
  | { state: "ok"; rows: FundamentalRow[]; asOf: number }
  | { state: "unavailable"; reason: string };

/* ── formatting ──────────────────────────────────────────────────────────── */

/** Finnhub reports market cap in millions of the listing currency. */
function money(millions: number | null, symbol: string): string | null {
  if (millions === null) return null;
  if (millions >= 1_000_000) return `${symbol}${(millions / 1_000_000).toFixed(2)}T`;
  if (millions >= 1_000) return `${symbol}${(millions / 1_000).toFixed(1)}B`;
  return `${symbol}${millions.toFixed(0)}M`;
}

const dp = (n: number | null, places = 2) => (n === null ? null : n.toFixed(places));
const pct = (n: number | null) => (n === null ? null : `${n.toFixed(2)}%`);
const price = (n: number | null, sym: string) => (n === null ? null : `${sym}${n.toFixed(2)}`);
/** Volumes come through in millions of shares. */
const shares = (n: number | null) => (n === null ? null : `${n.toFixed(1)}M`);

const str = (m: Metrics | undefined, key: string): string | undefined => {
  const v = m?.metric?.[key];
  return typeof v === "string" && v ? v : undefined;
};

export function rowsFrom(m: Metrics, currency: string): FundamentalRow[] {
  return [
    { label: "Market cap", metricKey: "marketCapitalization", value: money(num(m, "marketCapitalization"), currency) },
    { label: "P/E (TTM)", metricKey: "peTTM", value: dp(num(m, "peTTM")) },
    { label: "EPS (TTM)", metricKey: "epsTTM", value: price(num(m, "epsTTM"), currency) },
    {
      label: "Dividend yield", metricKey: "dividendYieldIndicatedAnnual",
      value: pct(num(m, "dividendYieldIndicatedAnnual")),
      note: "Indicated annual, not trailing paid.",
    },
    { label: "Beta", metricKey: "beta", value: dp(num(m, "beta")) },
    {
      label: "Avg volume (10d)", metricKey: "10DayAverageTradingVolume",
      value: shares(num(m, "10DayAverageTradingVolume")),
    },
    {
      label: "52-week high", metricKey: "52WeekHigh",
      value: price(num(m, "52WeekHigh"), currency), note: str(m, "52WeekHighDate"),
    },
    {
      label: "52-week low", metricKey: "52WeekLow",
      value: price(num(m, "52WeekLow"), currency), note: str(m, "52WeekLowDate"),
    },
  ];
}

/**
 * Why a listing has no fundamentals. Named per cause rather than as one shrug,
 * because "we are rate-limited right now" and "no provider we hold covers this
 * exchange" are different facts and only one of them is worth retrying.
 */
function reasonFor(reason: string, country: string | null): string {
  if (reason === "rate-limited") {
    return "Our fundamentals provider is rate-limited right now. This is temporary — reload in a minute.";
  }
  if (reason === "premium") {
    return "Fundamentals for this listing sit behind a paid tier we do not hold.";
  }
  return country && country !== "US"
    ? "Our fundamentals provider covers US listings. It returns nothing for this exchange, so there is no market cap, P/E or 52-week range to show here."
    : "The provider returned no fundamentals for this symbol.";
}

export function useFundamentals(symbol: string | null, currency: string, country: string | null): FundamentalsState {
  const [state, setState] = useState<FundamentalsState>({ state: "loading" });

  useEffect(() => {
    if (!symbol) return;
    let live = true;
    setState({ state: "loading" });
    void (async () => {
      const res = await fetchDataset<Metrics>("metrics", symbol);
      if (!live) return;
      if (!res.ok) return setState({ state: "unavailable", reason: reasonFor(res.reason, country) });

      const rows = rowsFrom(res.data, currency);
      // An empty `metric` object is how the provider says "not covered" for a
      // listing it does not carry — it is a 200, not an error, so the absence
      // has to be detected here rather than in the fetch layer.
      if (rows.every((r) => r.value === null)) {
        return setState({ state: "unavailable", reason: reasonFor("empty", country) });
      }
      setState({ state: "ok", rows, asOf: res.fetchedAt });
    })();
    return () => { live = false; };
  }, [symbol, currency, country]);

  return state;
}
