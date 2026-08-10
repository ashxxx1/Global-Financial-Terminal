/**
 * Map GFT Signals → chart markers / price levels.
 * Labels are analytical GFT SIGNALS — not brokerage order tickets.
 */
import type { Signal, SignalAsset, SignalDirection } from "../signals/types";
import { GftCoreModel } from "../signals/engine";
import { getMarketDataProvider } from "../signals/marketDataProvider";
import { fetchSignals, quoteSymbolFor } from "../signals/api";
import { metaFor } from "../market";
import { COUNTRIES } from "../market";

export type ChartSignalKind = "BUY" | "SELL" | "EXIT" | "HOLD";

export interface ChartSignalView {
  id: string;
  kind: ChartSignalKind;
  time: number; // ms
  price: number;
  entry: number;
  target: number;
  stop: number;
  direction: SignalDirection;
  reasoning: string;
  status: Signal["status"];
  realizedReturn: number | null;
  demo: boolean;
  signal: Signal;
}

export function signalKind(s: Signal): ChartSignalKind {
  if (s.status === "TARGET_HIT" || s.status === "STOP_HIT" || s.status === "EXPIRED" || s.status === "INVALIDATED") {
    return "EXIT";
  }
  if (s.direction === "BULLISH") return "BUY";
  if (s.direction === "BEARISH") return "SELL";
  return "HOLD";
}

export function toChartSignal(s: Signal): ChartSignalView {
  return {
    id: s.id,
    kind: signalKind(s),
    time: s.createdAt,
    price: s.signalPrice,
    entry: (s.entryLow + s.entryHigh) / 2,
    target: s.targetPrice,
    stop: s.stopPrice,
    direction: s.direction,
    reasoning: s.reasoning,
    status: s.status,
    realizedReturn: s.realizedReturn,
    demo: s.demo,
    signal: s,
  };
}

function equityAsset(symbol: string): SignalAsset | null {
  const meta = metaFor(symbol);
  if (!meta || meta.kind !== "stock") return null;
  const region = meta.country === "US" ? "US"
    : meta.country === "IN" ? "INDIA"
      : meta.country === "GB" ? "UK"
        : meta.country === "JP" ? "JAPAN"
          : "GLOBAL";
  return {
    assetId: `eq-${symbol.toLowerCase()}`,
    symbol,
    name: meta.name,
    assetType: "EQUITY",
    market: region as SignalAsset["market"],
    exchange: COUNTRIES[meta.country || ""]?.exchange || "—",
    timezone: meta.country === "US" ? "America/New_York" : "UTC",
    marketOpenHour: 9,
    marketOpenMinute: 30,
    quoteSymbol: symbol,
  };
}

/** Generate a small historical equity signal track for the charted symbol. */
function generateEquityTrack(symbol: string, now = Date.now()): Signal[] {
  const asset = equityAsset(symbol);
  if (!asset) return [];
  const provider = getMarketDataProvider();
  const out: Signal[] = [];
  const days = [60, 45, 30, 20, 12, 7, 3, 0];
  for (const d of days) {
    const asOf = now - d * 86400000;
    const dow = new Date(asOf).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const candles = provider.getHistoricalData(symbol, "6M", asOf)
      .map((c, i) => ({ ...c, v: c.v ?? 800 + ((i * 37) % 400) }));
    const candidate = GftCoreModel.generateSignal({ asset, candles, asOf });
    if (!candidate || candidate.direction === "NEUTRAL") continue;
    const day = new Date(asOf).toISOString().slice(0, 10).replace(/-/g, "");
    const id = `sig_eq_${symbol}_${day}_chart`;
    if (out.some((s) => s.id === id)) continue;
    out.push({
      id,
      assetId: asset.assetId,
      symbol: asset.symbol,
      name: asset.name,
      assetType: "EQUITY",
      market: asset.market,
      exchange: asset.exchange,
      direction: candidate.direction,
      signalType: candidate.signalType,
      entryLow: candidate.entryLow,
      entryHigh: candidate.entryHigh,
      signalPrice: candidate.snapshot.price,
      referencePrice: candidate.snapshot.price,
      targetPrice: candidate.targetPrice,
      stopPrice: candidate.stopPrice,
      expectedReturn: candidate.expectedReturn,
      expectedMove: candidate.expectedMove,
      risk: candidate.risk,
      riskReward: candidate.riskReward,
      confidence: candidate.confidence,
      timeframe: "1D",
      modelName: "GFT CORE",
      modelVersion: "chart-overlay",
      reasoning: candidate.reasoning,
      factors: candidate.factors,
      createdAt: asOf,
      expiresAt: asOf + 86400000,
      status: d === 0 ? "ACTIVE" : "EXPIRED",
      entryPriceActual: d === 0 ? null : candidate.snapshot.price,
      exitPriceActual: d === 0 ? null : candles[candles.length - 1]?.c ?? null,
      realizedReturn: d === 0 ? null : ((candles[candles.length - 1]?.c ?? candidate.snapshot.price) - candidate.snapshot.price) / candidate.snapshot.price,
      resolvedAt: d === 0 ? null : asOf + 2 * 86400000,
      resolutionNote: d === 0 ? null : "Chart overlay historical evaluation",
      sourceSnapshot: candidate.snapshot,
      demo: true,
    });
  }
  return out;
}

/**
 * Signals relevant to a chart symbol:
 *  - store signals whose quoteSymbol/symbol matches
 *  - plus equity track for individual stocks
 */
export async function getSignalsForChart(symbol: string): Promise<ChartSignalView[]> {
  const sym = symbol.toUpperCase();
  const all = await fetchSignals();
  const fromStore = all.filter((s) => {
    const qs = quoteSymbolFor(s).toUpperCase();
    return qs === sym || s.symbol.toUpperCase() === sym || qs === `IDX:${sym}`;
  });

  const equity = fromStore.some((s) => s.assetType === "EQUITY")
    ? []
    : generateEquityTrack(sym);

  const merged = [...fromStore, ...equity];
  // Dedupe by id
  const seen = new Set<string>();
  const unique = merged.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  unique.sort((a, b) => a.createdAt - b.createdAt);
  return unique.map(toChartSignal);
}

export function kindColor(kind: ChartSignalKind): string {
  switch (kind) {
    case "BUY": return "#26D07C";
    case "SELL": return "#FF4D5E";
    case "EXIT": return "#E7B429";
    case "HOLD": return "#4F8DFF";
  }
}

export function kindMarkerShape(kind: ChartSignalKind): "arrowUp" | "arrowDown" | "circle" {
  if (kind === "BUY") return "arrowUp";
  if (kind === "SELL") return "arrowDown";
  return "circle";
}
