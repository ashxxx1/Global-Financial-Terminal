/**
 * hooks.ts — the only sanctioned way for UI to read market data.
 * Everything subscribes to the one shared tick, so all quotes move together.
 */
import { useEffect, useMemo, useState } from "react";
import { subscribe, quoteFor, indexSymbols, historyFor, type Quote, type Candle, type Source } from "./market";

export function useQuote(symbol: string | null | undefined): Quote | null {
  const [q, setQ] = useState<Quote | null>(() => (symbol ? quoteFor(symbol) : null));
  useEffect(() => {
    if (!symbol) { setQ(null); return; }
    return subscribe((t) => setQ(quoteFor(symbol, t)));
  }, [symbol]);
  return q;
}

export function useQuotes(symbols: string[]): Quote[] {
  const key = symbols.join(",");
  const [qs, setQs] = useState<Quote[]>(() => symbols.map((s) => quoteFor(s)).filter(Boolean) as Quote[]);
  useEffect(() => {
    if (symbols.length === 0) { setQs([]); return; }
    return subscribe((t) => setQs(symbols.map((s) => quoteFor(s, t)).filter(Boolean) as Quote[]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return qs;
}

export function useIndices(): Quote[] {
  const symbols = useMemo(() => indexSymbols(), []);
  return useQuotes(symbols);
}

export function useHistory(symbol: string | null, range = "1M"): { candles: Candle[]; source: Source } {
  return useMemo(
    () => (symbol ? historyFor(symbol, range) : { candles: [], source: "sim" as Source }),
    [symbol, range]
  );
}

/** UTC clock string, ticking every second. */
export function useUtcClock(): string {
  const [s, setS] = useState("00:00:00");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setS(
        String(d.getUTCHours()).padStart(2, "0") + ":" +
        String(d.getUTCMinutes()).padStart(2, "0") + ":" +
        String(d.getUTCSeconds()).padStart(2, "0")
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return s;
}
