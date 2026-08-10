/**
 * useChartData — debounced OHLCV loader for TradingChart.
 */
import { useEffect, useRef, useState } from "react";
import { getMarketDataService } from "../services/marketData/MarketDataService";
import type { MarketDataResult, CompareSeries } from "../types/market";
import type { ChartRange, IntradayResolution } from "../types/chart";

export interface UseChartDataOpts {
  symbol: string;
  range: ChartRange;
  intraday?: IntradayResolution | null;
  compareSymbols?: string[];
  debounceMs?: number;
}

export interface UseChartDataState {
  data: MarketDataResult | null;
  compare: CompareSeries[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useChartData(opts: UseChartDataOpts): UseChartDataState {
  const { symbol, range, intraday = null, compareSymbols = [], debounceMs = 180 } = opts;
  const [data, setData] = useState<MarketDataResult | null>(null);
  const [compare, setCompare] = useState<CompareSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const gen = useRef(0);
  const compareKey = compareSymbols.join(",");

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      return;
    }
    const my = ++gen.current;
    setLoading(true);
    setError(null);
    const compareList = compareKey ? compareKey.split(",") : [];
    const handle = window.setTimeout(async () => {
      try {
        const svc = getMarketDataService();
        const result = await svc.getForRange(symbol, range, intraday);
        if (my !== gen.current) return;
        if (result.status === "rate_limited") {
          setError(result.error || "Rate limited");
        } else if (result.status === "error") {
          setError(result.error || "Failed to load chart data");
        } else if (result.status === "no_data") {
          setError("No market data for this window");
        } else {
          setError(null);
        }
        setData(result);

        if (compareList.length) {
          const comps = await svc.compare([symbol, ...compareList], range);
          if (my !== gen.current) return;
          setCompare(comps);
        } else {
          setCompare([]);
        }
      } catch (e) {
        if (my !== gen.current) return;
        setError(e instanceof Error ? e.message : "Chart data failed");
        setData(null);
      } finally {
        if (my === gen.current) setLoading(false);
      }
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [symbol, range, intraday, compareKey, debounceMs, tick]);

  return {
    data,
    compare,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}
