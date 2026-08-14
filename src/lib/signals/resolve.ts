/**
 * SignalResolutionService — resolves ACTIVE signals without hindsight favoritism.
 *
 * Same-candle ambiguity: if both target and stop are inside one OHLC bar and
 * sequence cannot be determined → AMBIGUOUS (never pick the winning outcome).
 */
import type { MarketDataProvider } from "./marketDataProvider";
import { assertImmutableUpdate } from "./validate";
import type { Signal, SignalStatus } from "./types";

export interface ResolutionUpdate {
  status: SignalStatus;
  exitPriceActual: number;
  realizedReturn: number;
  resolvedAt: number;
  resolutionNote: string;
  entryPriceActual?: number;
}

function realized(signal: Signal, exit: number, entry: number): number {
  if (signal.direction === "BEARISH") return (entry - exit) / entry;
  return (exit - entry) / entry;
}

function entryRef(signal: Signal): number {
  return signal.entryPriceActual ?? signal.signalPrice;
}

function bullishHit(signal: Signal, price: number): "TARGET_HIT" | "STOP_HIT" | null {
  if (price >= signal.targetPrice) return "TARGET_HIT";
  if (price <= signal.stopPrice) return "STOP_HIT";
  return null;
}

function bearishHit(signal: Signal, price: number): "TARGET_HIT" | "STOP_HIT" | null {
  if (price <= signal.targetPrice) return "TARGET_HIT";
  if (price >= signal.stopPrice) return "STOP_HIT";
  return null;
}

function evaluateBar(
  signal: Signal,
  bar: { o: number; h: number; l: number; c: number; t: number },
): ResolutionUpdate | null {
  const entry = entryRef(signal);
  const targetIn = bar.l <= signal.targetPrice && signal.targetPrice <= bar.h;
  const stopIn = bar.l <= signal.stopPrice && signal.stopPrice <= bar.h;

  if (targetIn && stopIn) {
    // Ambiguous same-candle — do not assume favorable path
    return {
      status: "AMBIGUOUS",
      exitPriceActual: bar.c,
      realizedReturn: realized(signal, bar.c, entry),
      resolvedAt: bar.t,
      resolutionNote: "Both target and stop within same OHLC bar; sequence undetermined — marked AMBIGUOUS",
    };
  }

  if (signal.direction === "BULLISH") {
    if (targetIn || bar.h >= signal.targetPrice) {
      return {
        status: "TARGET_HIT",
        exitPriceActual: signal.targetPrice,
        realizedReturn: realized(signal, signal.targetPrice, entry),
        resolvedAt: bar.t,
        resolutionNote: "Target reached",
      };
    }
    if (stopIn || bar.l <= signal.stopPrice) {
      return {
        status: "STOP_HIT",
        exitPriceActual: signal.stopPrice,
        realizedReturn: realized(signal, signal.stopPrice, entry),
        resolvedAt: bar.t,
        resolutionNote: "Stop reached",
      };
    }
  } else if (signal.direction === "BEARISH") {
    if (targetIn || bar.l <= signal.targetPrice) {
      return {
        status: "TARGET_HIT",
        exitPriceActual: signal.targetPrice,
        realizedReturn: realized(signal, signal.targetPrice, entry),
        resolvedAt: bar.t,
        resolutionNote: "Target reached",
      };
    }
    if (stopIn || bar.h >= signal.stopPrice) {
      return {
        status: "STOP_HIT",
        exitPriceActual: signal.stopPrice,
        realizedReturn: realized(signal, signal.stopPrice, entry),
        resolvedAt: bar.t,
        resolutionNote: "Stop reached",
      };
    }
  }
  return null;
}

export function resolveSignalAgainstBars(
  signal: Signal,
  bars: Array<{ o: number; h: number; l: number; c: number; t: number }>,
  now: number = Date.now(),
): ResolutionUpdate | null {
  if (signal.status !== "ACTIVE" && signal.status !== "PENDING") return null;

  const post = bars.filter((b) => b.t > signal.createdAt).sort((a, b) => a.t - b.t);
  for (const bar of post) {
    const hit = evaluateBar(signal, bar);
    if (hit) return hit;
  }

  if (now >= signal.expiresAt) {
    const last = post[post.length - 1] ?? bars[bars.length - 1];
    const exit = last?.c ?? signal.signalPrice;
    const entry = entryRef(signal);
    return {
      status: "EXPIRED",
      exitPriceActual: exit,
      realizedReturn: realized(signal, exit, entry),
      resolvedAt: Math.max(signal.expiresAt, last?.t ?? now),
      resolutionNote: "Timeframe expired without target or stop",
    };
  }

  // Tick-level last price check (intraday)
  const last = post[post.length - 1];
  if (last) {
    const spot =
      signal.direction === "BULLISH" ? bullishHit(signal, last.c) : bearishHit(signal, last.c);
    if (spot === "TARGET_HIT") {
      return {
        status: "TARGET_HIT",
        exitPriceActual: signal.targetPrice,
        realizedReturn: realized(signal, signal.targetPrice, entryRef(signal)),
        resolvedAt: last.t,
        resolutionNote: "Target reached on close",
      };
    }
    if (spot === "STOP_HIT") {
      return {
        status: "STOP_HIT",
        exitPriceActual: signal.stopPrice,
        realizedReturn: realized(signal, signal.stopPrice, entryRef(signal)),
        resolvedAt: last.t,
        resolutionNote: "Stop reached on close",
      };
    }
  }
  return null;
}

export function applyResolution(signal: Signal, update: ResolutionUpdate): Signal {
  const patch: Partial<Signal> = {
    status: update.status,
    exitPriceActual: update.exitPriceActual,
    realizedReturn: update.realizedReturn,
    resolvedAt: update.resolvedAt,
    resolutionNote: update.resolutionNote,
    entryPriceActual: update.entryPriceActual ?? signal.entryPriceActual ?? signal.signalPrice,
  };
  const check = assertImmutableUpdate(signal, patch);
  if (!check.ok) throw new Error(`Immutability violation: ${check.errors.join(", ")}`);
  return { ...signal, ...patch };
}

export function resolveActiveSignals(
  signals: Signal[],
  provider: MarketDataProvider,
  now: number = Date.now(),
): Signal[] {
  return signals.map((s) => {
    if (s.status !== "ACTIVE" && s.status !== "PENDING") return s;
    // Prefer intraday when available for ambiguity reduction
    const intra = provider.getIntradayData(s.assetId.includes("cry") || s.market === "CRYPTO" || s.market === "FX"
      ? /* quote symbol stored separately — use symbol via snapshot */ (s as any)._quoteSymbol || guessQuote(s)
      : guessQuote(s), now);
    const daily = provider.getHistoricalData(guessQuote(s), "3M", now);
    const bars = [...daily, ...intra].filter((b) => b.t > s.createdAt);
    // Deduplicate by t
    const byT = new Map<number, typeof bars[0]>();
    for (const b of bars) byT.set(b.t, b);
    const ordered = [...byT.values()].sort((a, b) => a.t - b.t);
    const update = resolveSignalAgainstBars(s, ordered, now);
    return update ? applyResolution(s, update) : (s.status === "PENDING" ? { ...s, status: "ACTIVE" as const } : s);
  });
}

function guessQuote(s: Signal): string {
  return `IDX:${s.symbol}`;
}
