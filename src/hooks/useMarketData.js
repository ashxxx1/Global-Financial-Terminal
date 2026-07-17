/**
 * useMarketData.js — React bindings for the market-data provider (Phase 2).
 *
 * These hooks are the ONLY way UI components should read market data. They
 * subscribe to the shared provider tick, so every quote on screen updates
 * together and unmounting cleans up automatically.
 */
import { useState, useEffect } from "react";
import {
  subscribe,
  quoteFor,
  indexSymbols,
  historyFor,
} from "../services/marketData";
import { fetchCountryNews } from "../services/newsService";

/** Live-ish quote for a single symbol. Returns null until a symbol is given. */
export function useQuote(symbol) {
  const [quote, setQuote] = useState(() => (symbol ? quoteFor(symbol) : null));
  useEffect(() => {
    if (!symbol) {
      setQuote(null);
      return;
    }
    return subscribe((t) => setQuote(quoteFor(symbol, t)));
  }, [symbol]);
  return quote;
}

/** All global index quotes, updating on every tick. Powers the ticker. */
export function useIndices() {
  const symbols = indexSymbols();
  const [quotes, setQuotes] = useState(() => symbols.map((s) => quoteFor(s)));
  useEffect(() => {
    return subscribe((t) => setQuotes(symbols.map((s) => quoteFor(s, t))));
    // symbols is a stable module-level array; intentionally run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return quotes;
}

/** Quotes for an explicit list of symbols (e.g. a watchlist or sector). */
export function useQuotes(symbols) {
  const key = (symbols || []).join(",");
  const [quotes, setQuotes] = useState(() =>
    (symbols || []).map((s) => quoteFor(s)).filter(Boolean)
  );
  useEffect(() => {
    if (!symbols || symbols.length === 0) {
      setQuotes([]);
      return;
    }
    return subscribe((t) =>
      setQuotes(symbols.map((s) => quoteFor(s, t)).filter(Boolean))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return quotes;
}

/** Historical daily candles for a symbol + range. Synchronous (cached). */
export function useHistory(symbol, range = "1M") {
  const [state, setState] = useState({ candles: [], source: "sim", loading: true });
  useEffect(() => {
    if (!symbol) {
      setState({ candles: [], source: "sim", loading: false });
      return;
    }
    const h = historyFor(symbol, range);
    setState({ ...h, loading: false });
  }, [symbol, range]);
  return state;
}

/**
 * Country business news. Real GNews when a key + supported country exist,
 * otherwise a realistic self-consistent fallback (newsService decides).
 */
export function useNews(countryCode) {
  const [state, setState] = useState({ items: [], loading: true, source: "sim" });
  useEffect(() => {
    if (!countryCode) {
      setState({ items: [], loading: false, source: "sim" });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetchCountryNews(countryCode)
      .then((items) => {
        if (!alive) return;
        const live = Boolean(import.meta.env.VITE_GNEWS_API_KEY);
        setState({ items: items || [], loading: false, source: live ? "live" : "sim" });
      })
      .catch(() => {
        if (alive) setState({ items: [], loading: false, source: "sim" });
      });
    return () => {
      alive = false;
    };
  }, [countryCode]);
  return state;
}
