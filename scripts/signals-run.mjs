/**
 * Publish the shared signal track record.
 *
 * The track record used to be seeded into each visitor's localStorage, which
 * meant every browser had a different one. That is not a track record — it is a
 * demo that looks like evidence, and it is exactly the thing this product spent
 * weeks removing everywhere else.
 *
 * This runs in CI once a day and produces ONE record that everybody reads:
 *
 *   1. resolve every open signal against real bars since it was issued
 *   2. generate today's signals from the same model the app uses
 *   3. append and publish to public/signals/track-record.json
 *
 * The file is committed, so git history is the audit trail: you can see when
 * each signal was written and prove it was not back-filled after the fact. A
 * performance claim nobody can check is worth nothing.
 *
 *   node scripts/signals-run.mjs [--dry]
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SITE = process.env.SITE || "https://global-financial-terminal-eight.vercel.app";
const OUT = path.join(process.cwd(), "public", "signals", "track-record.json");
const DRY = process.argv.includes("--dry");
const BUNDLE = path.join(process.cwd(), "node_modules", ".cache", "signals-engine.mjs");

/* ── build the engine so Node can import it ──────────────────────────────── */
fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
execFileSync("npx", ["--no-install", "rolldown", "scripts/signals/entry.ts",
  "--format", "esm", "--file", BUNDLE], { stdio: "pipe" });
const engine = await import(`file://${BUNDLE}`);

/* ── a provider backed by REAL bars from our own API ─────────────────────── */

const barCache = new Map();

/**
 * The signal assets are indices; the candles endpoint takes tickers. Route each
 * through the same tracking ETF the terminal already prices it with, so the
 * bars behind a signal are the bars the rest of the product shows — not a
 * second, differently-sourced view of the same market.
 */
function tickerFor(symbol) {
  // Quote symbols arrive as "IDX:S&P 500" for indices; the proxy table is
  // keyed by the bare name.
  const bare = symbol.startsWith("IDX:") ? symbol.slice(4) : symbol;
  const proxy = engine.ETF_PROXIES?.[bare];
  return proxy?.etf ?? bare;
}

async function loadBars(symbol, days = 200) {
  if (barCache.has(symbol)) return barCache.get(symbol);
  const ticker = tickerFor(symbol);
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86400;
  let bars = [];
  try {
    const r = await fetch(`${SITE}/api/candles?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}`);
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j.candles)) bars = j.candles;
    }
  } catch { /* a symbol we cannot price is skipped, never invented */ }
  barCache.set(symbol, bars);
  return bars;
}

/** Pre-load every asset the model might use, so the provider can stay sync. */
async function warm() {
  const symbols = [...new Set(engine.SIGNAL_ASSETS.map((a) => a.quoteSymbol))];
  for (const s of symbols) {
    await loadBars(s);
    await new Promise((r) => setTimeout(r, 120));   // stay polite to the API
  }
  return symbols.filter((s) => (barCache.get(s) ?? []).length > 20);
}

const realProvider = {
  getQuote(symbol) {
    const bars = barCache.get(symbol) ?? [];
    if (bars.length < 2) return null;
    const last = bars[bars.length - 1], prev = bars[bars.length - 2];
    return {
      price: last.c,
      changePct: prev.c > 0 ? ((last.c - prev.c) / prev.c) * 100 : 0,
      source: "delayed",
    };
  },
  getHistoricalData(symbol) { return barCache.get(symbol) ?? []; },
  getIntradayData(symbol) { return barCache.get(symbol) ?? []; },
  getVolume(symbol) {
    const bars = barCache.get(symbol) ?? [];
    return bars.length ? (bars[bars.length - 1].v ?? null) : null;
  },
  /**
   * Delegated to the app's own implementation rather than stubbed.
   *
   * A stub returning "open" would make the model issue signals for markets that
   * are shut, which is how a track record quietly becomes fiction. Reusing the
   * real exchange-hours logic means CI issues exactly what a user would have
   * seen at that moment — and if a market is closed, nothing is issued for it.
   */
  getMarketStatus(asset, asOf) {
    return realHours.getMarketStatus(asset, asOf);
  },
};

const realHours = new engine.GftMarketDataProvider();

engine.setMarketDataProvider(realProvider);

/* ── load, resolve, generate, publish ────────────────────────────────────── */

function readRecord() {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    return { version: 1, createdAt: new Date().toISOString(), signals: [], runs: [] };
  }
}

const record = readRecord();
const priced = await warm();
console.log(`priced ${priced.length} of ${engine.SIGNAL_ASSETS.length} assets from real bars`);

/* 1. Resolve open signals against bars published since they were issued. */
let resolved = 0;
for (const s of record.signals) {
  if (s.status !== "ACTIVE" && s.status !== "PENDING") continue;
  const key = engine.SIGNAL_ASSETS.find((a) => a.assetId === s.assetId)?.quoteSymbol ?? s.symbol;
  const bars = (barCache.get(key) ?? []).filter((b) => b.t > new Date(s.createdAt).getTime());
  if (bars.length === 0) continue;
  const update = engine.resolveSignalAgainstBars(s, bars, Date.now());
  if (update && update.status && update.status !== s.status) {
    Object.assign(s, engine.applyResolution(s, update));
    resolved++;
  }
}

/* 2. Generate today's signals from the same model the app runs. */
const today = new Date().toISOString().slice(0, 10);
const alreadyToday = record.signals.some((s) => s.createdAt?.slice(0, 10) === today);
let added = 0;
if (!alreadyToday) {
  // demo:false matters. The model defaults to demo mode outside a browser, and
  // a published record whose signals are flagged demo would keep the DEMO
  // badge on real, price-resolved signals — mislabelling in the safe direction
  // is still mislabelling.
  const { signals, skipped } = engine.generateSignals({ demo: false, asOf: Date.now() });
  console.log(`model produced ${signals.length} signals, skipped ${skipped.length}`);
  if (skipped.length) {
    const why = {};
    for (const k of skipped) why[k.reason] = (why[k.reason] ?? 0) + 1;
    console.log("skip reasons:", JSON.stringify(why));
  }
  for (const s of signals) {
    // Only publish signals we could price from real bars. Keyed by the quote
    // symbol the model used, not the display symbol.
    const key = engine.SIGNAL_ASSETS.find((a) => a.assetId === s.assetId)?.quoteSymbol ?? s.symbol;
    if ((barCache.get(key) ?? []).length < 20) continue;
    record.signals.push(s);
    added++;
  }
} else {
  console.log("a run already exists for today — not issuing duplicates");
}

/* 3. Publish. */
record.updatedAt = new Date().toISOString();
record.runs = [...(record.runs ?? []), { at: record.updatedAt, added, resolved, priced: priced.length }].slice(-120);

const closed = record.signals.filter((s) => s.status === "TARGET_HIT" || s.status === "STOP_HIT" || s.status === "EXPIRED");
const wins = closed.filter((s) => s.status === "TARGET_HIT").length;
record.summary = {
  total: record.signals.length,
  open: record.signals.filter((s) => s.status === "ACTIVE" || s.status === "PENDING").length,
  closed: closed.length,
  wins,
  // Stated only once there is enough history to mean anything.
  hitRate: closed.length >= 10 ? Number(((wins / closed.length) * 100).toFixed(1)) : null,
  hitRateNote: closed.length >= 10
    ? `From ${closed.length} closed signals.`
    : `Withheld: only ${closed.length} signals have closed, too few for a rate to mean anything.`,
};

console.log(`resolved ${resolved}, added ${added}, total ${record.signals.length}, closed ${closed.length}`);
console.log("summary:", JSON.stringify(record.summary));

if (DRY) {
  console.log("--dry: not writing");
  process.exit(0);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(record, null, 1));
console.log(`wrote ${OUT}`);
