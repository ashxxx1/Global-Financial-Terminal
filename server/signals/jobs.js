/**
 * Lightweight server-side signal generation + resolution for scheduled jobs.
 * Uses deterministic math aligned with the frontend GFT CORE baseline.
 * Full engine lives in src/lib/signals; this port keeps the Node backend free
 * of a TS build step while preserving the same publish/resolve contracts.
 */
import { listSignals, publishSignals, updateResolution } from "./store.js";

const ASSETS = [
  { assetId: "idx-nifty50", symbol: "NIFTY 50", name: "Nifty 50", assetType: "INDEX", market: "INDIA", exchange: "NSE", base: 24567.89 },
  { assetId: "idx-sp500", symbol: "S&P 500", name: "S&P 500", assetType: "INDEX", market: "US", exchange: "NYSE", base: 5487.23 },
  { assetId: "idx-nasdaq", symbol: "NASDAQ", name: "Nasdaq", assetType: "INDEX", market: "US", exchange: "NASDAQ", base: 19876.54 },
  { assetId: "idx-ftse", symbol: "FTSE 100", name: "FTSE 100", assetType: "INDEX", market: "UK", exchange: "LSE", base: 8143.76 },
  { assetId: "idx-dax", symbol: "DAX 40", name: "DAX 40", assetType: "INDEX", market: "EUROPE", exchange: "XETRA", base: 18234.56 },
  { assetId: "idx-nikkei", symbol: "NIKKEI 225", name: "Nikkei 225", assetType: "INDEX", market: "JAPAN", exchange: "TSE", base: 39847.12 },
  { assetId: "cmd-gold", symbol: "GOLD", name: "Gold", assetType: "COMMODITY", market: "COMMODITIES", exchange: "COMEX", base: 2387.5 },
  { assetId: "fx-eurusd", symbol: "EUR/USD", name: "EUR/USD", assetType: "FX", market: "FX", exchange: "OTC", base: 1.0876 },
  { assetId: "cry-btc", symbol: "BTC/USD", name: "Bitcoin", assetType: "CRYPTO", market: "CRYPTO", exchange: "CRYPTO", base: 67234 },
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function syntheticBars(asset, asOf, n = 90) {
  let seed = hash(asset.assetId + String(Math.floor(asOf / 86400000)));
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const bars = [];
  let close = asset.base;
  for (let i = 0; i < n; i++) {
    const drift = (rnd() - 0.5) * 0.02;
    const open = close / (1 + drift);
    const h = Math.max(open, close) * (1 + rnd() * 0.008);
    const l = Math.min(open, close) * (1 - rnd() * 0.008);
    bars.unshift({ t: asOf - i * 86400000, o: open, h, l, c: close, v: 1000 + rnd() * 500 });
    close = open;
  }
  return bars;
}

function sma(xs, p) {
  if (xs.length < p) return null;
  const s = xs.slice(-p);
  return s.reduce((a, b) => a + b, 0) / p;
}

function rsi(closes, p = 14) {
  if (closes.length < p + 1) return null;
  let g = 0, l = 0;
  for (let i = closes.length - p; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) g += d; else l -= d;
  }
  if (l === 0) return 100;
  const rs = g / l;
  return 100 - 100 / (1 + rs);
}

function atr(bars, p = 14) {
  if (bars.length < p + 1) return null;
  const trs = [];
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i], prev = bars[i - 1];
    trs.push(Math.max(b.h - b.l, Math.abs(b.h - prev.c), Math.abs(b.l - prev.c)));
  }
  return sma(trs, p);
}

function candidateFromBars(asset, bars, asOf) {
  const closes = bars.map((b) => b.c);
  const price = closes[closes.length - 1];
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const r = rsi(closes);
  const a = atr(bars);
  if (s20 == null || s50 == null || r == null || a == null) return null;

  let score = 0;
  if (price > s20) score += 30; else score -= 30;
  if (s20 > s50) score += 35; else score -= 35;
  if (r > 55) score += 20; else if (r < 45) score -= 20;

  if (Math.abs(score) < 25) return null;
  const direction = score > 0 ? "BULLISH" : "BEARISH";
  const confidence = Math.min(92, Math.round(55 + Math.abs(score) * 0.35));
  if (confidence < 58) return null;

  const band = Math.max(a * 0.25, price * 0.0015);
  const entryLow = price - band;
  const entryHigh = price + band;
  let target, stop, rr;
  if (direction === "BULLISH") {
    stop = entryLow - a * 0.9;
    const risk = price - stop;
    target = price + risk * 1.8;
    rr = (target - price) / risk;
    if (!(target > entryHigh && stop < entryLow) || rr < 1.5) return null;
  } else {
    stop = entryHigh + a * 0.9;
    const risk = stop - price;
    target = price - risk * 1.8;
    rr = (price - target) / risk;
    if (!(target < entryLow && stop > entryHigh) || rr < 1.5) return null;
  }

  const expectedMove = direction === "BULLISH" ? (target - price) / price : (price - target) / price;
  const factors = [
    { key: "trend", label: "Trend agreement", score: price > s20 ? 40 : -40, weight: 0.2, polarity: direction === "BULLISH" && price > s20 ? "positive" : "negative", detail: `Price ${price > s20 ? "above" : "below"} 20D MA` },
    { key: "momentum", label: "Momentum agreement", score: r - 50, weight: 0.2, polarity: (direction === "BULLISH" && r > 50) || (direction === "BEARISH" && r < 50) ? "positive" : "negative", detail: `RSI ${r.toFixed(1)}` },
  ];

  return {
    direction,
    signalType: direction,
    confidence,
    entryLow, entryHigh, targetPrice: target, stopPrice: stop,
    expectedReturn: direction === "BULLISH" ? expectedMove : -expectedMove,
    expectedMove, risk: direction === "BULLISH" ? (stop - price) / price : (price - stop) / price,
    riskReward: rr,
    factors,
    reasoning: factors.map((f) => `${f.polarity === "positive" ? "+" : "-"} ${f.detail}`).join("\n") + `\nMODEL VIEW: ${direction}`,
    snapshot: {
      price, rsi: r, atr: a, sma20: s20, sma50: s50, sma200: null,
      volumeRatio: 1.1, volatility: a / price, roc10: ((price - closes[closes.length - 11]) / closes[closes.length - 11]) * 100,
      regime: score > 0 ? "RISK_ON" : "RISK_OFF",
      recentHigh20: Math.max(...bars.slice(-20).map((b) => b.h)),
      recentLow20: Math.min(...bars.slice(-20).map((b) => b.l)),
      support: Math.min(...bars.slice(-20).map((b) => b.l)),
      resistance: Math.max(...bars.slice(-20).map((b) => b.h)),
      capturedAt: asOf,
    },
  };
}

export function generateDailySignals({ asOf = Date.now(), demo = process.env.SIGNALS_DEMO_MODE !== "false", limit = 12 } = {}) {
  const out = [];
  const audits = [];
  for (const asset of ASSETS) {
    const bars = syntheticBars(asset, asOf);
    const c = candidateFromBars(asset, bars, asOf);
    if (!c) continue;
    const day = new Date(asOf).toISOString().slice(0, 10).replace(/-/g, "");
    const id = `sig_${asset.assetId}_${day}_v10`;
    const signal = {
      id,
      assetId: asset.assetId,
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      market: asset.market,
      exchange: asset.exchange,
      direction: c.direction,
      signalType: c.signalType,
      entryLow: c.entryLow,
      entryHigh: c.entryHigh,
      signalPrice: c.snapshot.price,
      referencePrice: c.snapshot.price,
      targetPrice: c.targetPrice,
      stopPrice: c.stopPrice,
      expectedReturn: c.expectedReturn,
      expectedMove: c.expectedMove,
      risk: c.risk,
      riskReward: c.riskReward,
      confidence: c.confidence,
      timeframe: "1D",
      modelName: "GFT CORE",
      modelVersion: "v1.0",
      reasoning: c.reasoning,
      factors: c.factors,
      createdAt: asOf,
      expiresAt: asOf + 86400000,
      status: "ACTIVE",
      entryPriceActual: null,
      exitPriceActual: null,
      realizedReturn: null,
      resolvedAt: null,
      resolutionNote: null,
      sourceSnapshot: c.snapshot,
      demo,
    };
    out.push(signal);
    audits.push({
      id: `aud_${id}_created`,
      signalId: id,
      action: "published",
      at: asOf,
      detail: `Published ${signal.direction} ${signal.symbol}`,
      nextStatus: "ACTIVE",
    });
  }
  out.sort((a, b) => b.confidence - a.confidence);
  const selected = out.slice(0, limit);
  const added = publishSignals(selected, audits.filter((a) => selected.some((s) => s.id === a.signalId)));
  return { added, signals: selected };
}

export function resolveActiveSignals({ asOf = Date.now() } = {}) {
  const list = listSignals();
  let updated = 0;
  for (const s of list) {
    if (s.status !== "ACTIVE" && s.status !== "PENDING") continue;
    const asset = ASSETS.find((a) => a.assetId === s.assetId);
    if (!asset) continue;
    const bars = syntheticBars(asset, asOf, 10).filter((b) => b.t > s.createdAt);
    let resolved = null;
    for (const bar of bars) {
      const targetIn = bar.l <= s.targetPrice && s.targetPrice <= bar.h;
      const stopIn = bar.l <= s.stopPrice && s.stopPrice <= bar.h;
      if (targetIn && stopIn) {
        resolved = { status: "AMBIGUOUS", exit: bar.c, note: "Same-candle ambiguity" };
        break;
      }
      if (s.direction === "BULLISH") {
        if (bar.h >= s.targetPrice) { resolved = { status: "TARGET_HIT", exit: s.targetPrice, note: "Target reached" }; break; }
        if (bar.l <= s.stopPrice) { resolved = { status: "STOP_HIT", exit: s.stopPrice, note: "Stop reached" }; break; }
      } else {
        if (bar.l <= s.targetPrice) { resolved = { status: "TARGET_HIT", exit: s.targetPrice, note: "Target reached" }; break; }
        if (bar.h >= s.stopPrice) { resolved = { status: "STOP_HIT", exit: s.stopPrice, note: "Stop reached" }; break; }
      }
    }
    if (!resolved && asOf >= s.expiresAt) {
      const last = bars[bars.length - 1];
      resolved = { status: "EXPIRED", exit: last?.c ?? s.signalPrice, note: "Timeframe expired" };
    }
    if (!resolved) continue;
    const entry = s.signalPrice;
    const realized = s.direction === "BEARISH"
      ? (entry - resolved.exit) / entry
      : (resolved.exit - entry) / entry;
    updateResolution(s.id, {
      status: resolved.status,
      entryPriceActual: entry,
      exitPriceActual: resolved.exit,
      realizedReturn: realized,
      resolvedAt: asOf,
      resolutionNote: resolved.note,
    });
    updated++;
  }
  return { updated };
}

export function calculateDailyPerformance() {
  const list = listSignals();
  const byDay = new Map();
  for (const s of list) {
    const k = new Date(s.createdAt).toISOString().slice(0, 10);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(s);
  }
  return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, items]) => ({
    date,
    signalsGenerated: items.length,
    targetHits: items.filter((s) => s.status === "TARGET_HIT").length,
    stopHits: items.filter((s) => s.status === "STOP_HIT").length,
    expired: items.filter((s) => s.status === "EXPIRED").length,
    ambiguous: items.filter((s) => s.status === "AMBIGUOUS").length,
  }));
}
