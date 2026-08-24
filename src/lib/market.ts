/**
 * market.ts — THE market-data provider. Every quote on screen reads from here.
 *
 * Sources resolve in priority order; today the always-on source is the
 * deterministic engine ("sim"): prices are a pure function of wall-clock time,
 * seeded per symbol from a vetted snapshot — they move continuously, agree
 * across tabs/reloads, and are honestly labeled SIM everywhere. A live feed can
 * be layered in later ("live") with zero UI changes.
 */
import { STOCKS_BY_COUNTRY } from "../data/stocksData";
import { availabilityOf, unavailableReason } from "./priceAvailability";
import { GLOBAL_INDICES, COUNTRIES_DATA } from "../data/mockData";

/**
 * Where a price came from.
 *
 * "sim" is retired. It described a deterministic invented price, and however
 * carefully it was labelled it still put a plausible number where a real one
 * belongs. The two states that replaced it are honest about which kind of
 * absence you are looking at:
 *
 *   pending      a feed covers this and has not answered yet
 *   unavailable  no feed exists for it; unavailableReason() says why
 */
export type Source = "live" | "cached" | "pending" | "unavailable";

/**
 * Where a CANDLE SERIES came from. Separate from Source on purpose.
 *
 * Spot prices no longer fall back to a simulation — an invented price sitting
 * where a real one belongs is the thing this terminal spent a month removing.
 * Chart history is a different question and is not yet solved: real daily bars
 * come from /api/candles for symbols our providers cover, and the local
 * generator still fills the rest so a chart has a shape to draw.
 *
 * That generator is honest only because "synthetic" is carried here and the
 * chart prints it on the axis. It is a known gap, tracked, and it must never
 * be widened back into spot prices.
 */
export type HistorySource = "live" | "cached" | "synthetic" | "unavailable";
export type Kind = "stock" | "index" | "fx" | "crypto" | "commodity";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  currency: string;
  sector: string;
  country: string | null;
  kind: Kind;
  source: Source;
  display: string;
}

export interface Candle { t: number; o: number; h: number; l: number; c: number; }

interface Meta {
  key: string; name: string; base: number; snapChange: number;
  currency: string; sector: string; country: string | null; kind: Kind;
  vol: number; ph: { a: number; b: number; c: number };
  fmt: { decimals: number; comma: boolean; prefix: string };
}

/* ── deterministic per-symbol phases ── */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function phases(key: string) {
  const h = hash(key); const TAU = Math.PI * 2;
  return { a: ((h % 997) / 997) * TAU, b: (((h >> 7) % 991) / 991) * TAU, c: (((h >> 13) % 983) / 983) * TAU };
}

const SECTOR_VOL: Record<string, number> = {
  Technology: 0.011, Automotive: 0.013, "Mining & Resources": 0.012, Energy: 0.010,
  Media: 0.009, Transportation: 0.008, "Banking & Finance": 0.007, "Real Estate": 0.007,
  Industrial: 0.007, Healthcare: 0.006, Consumer: 0.006, Defence: 0.006,
  Telecom: 0.005, Utilities: 0.004,
};

function parseNum(v: unknown): number {
  return parseFloat(String(v).replace(/[^0-9.-]/g, ""));
}

/* ── registry ── */
const REGISTRY: Record<string, Meta> = {};

function classifyIndex(name: string): Kind {
  // Crypto must be tested before FX: pairs are quoted as "BTC/USD", so an
  // FX-first check swallowed every coin and mislabelled it as an ECB daily fix
  // — which then showed the wrong provenance badge on a live Binance feed.
  // Anchored to the start of the ticker: an unanchored alternation matched the
  // "ADA" inside TADAWUL and filed a Saudi index under crypto.
  if (/^(BTC|ETH|SOL|XRP|ADA|DOGE|LTC|DOT)\b/i.test(name)) return "crypto";
  if (/USD|EUR|GBP|JPY|DXY/.test(name)) return "fx";
  if (/GOLD|SILVER|OIL|BRENT|GAS|COPPER|WHEAT|CORN|COFFEE|SUGAR|COTTON/.test(name)) return "commodity";
  return "index";
}

for (const [country, list] of Object.entries(STOCKS_BY_COUNTRY as Record<string, any[]>)) {
  for (const s of list) {
    if (REGISTRY[s.ticker]) continue;
    REGISTRY[s.ticker] = {
      key: s.ticker, name: s.name, base: s.price, snapChange: s.changePct || 0,
      currency: s.currency || "", sector: s.sector || "", country, kind: "stock",
      vol: SECTOR_VOL[s.sector] || 0.008, ph: phases(s.ticker),
      fmt: { decimals: 2, comma: s.price >= 1000, prefix: "" },
    };
  }
}

const INDEX_KEYS: string[] = (GLOBAL_INDICES as any[]).map((idx) => {
  const key = "IDX:" + idx.name;
  const raw = String(idx.value);
  REGISTRY[key] = {
    key, name: idx.name, base: parseNum(raw),
    snapChange: parseFloat(String(idx.change).replace(/%/g, "")) || 0,
    currency: "", sector: "Index", country: null, kind: classifyIndex(idx.name),
    vol: 0.004, ph: phases(idx.name),
    fmt: {
      decimals: (raw.split(".")[1] || "").length,
      comma: raw.includes(","),
      prefix: (raw.match(/^[^0-9.-]+/) || [""])[0],
    },
  };
  return key;
});

/* ── synthetic pricing (sum of slow sines; sector-scaled) ── */
function wiggle(m: Meta, t: number): number {
  return m.vol * (
    0.6 * Math.sin(t / 37000 + m.ph.a) +
    0.3 * Math.sin(t / 13000 + m.ph.b) +
    0.1 * Math.sin(t / 4700 + m.ph.c)
  );
}

export function formatPrice(price: number, fmt: Meta["fmt"] = { decimals: 2, comma: true, prefix: "" }): string {
  return fmt.prefix + price.toLocaleString("en-US", {
    minimumFractionDigits: fmt.decimals, maximumFractionDigits: fmt.decimals, useGrouping: fmt.comma,
  });
}

/* ── live-override layer ─────────────────────────────────────────────────────
   Real feeds (Binance WS, ECB FX, …) push prices here; quoteFor prefers them
   over the deterministic engine and the UI's SIM badges flip to LIVE
   automatically. Overrides expire if a feed goes quiet (stale → cached). */
interface LiveOverride { price: number; changePct: number; source: Source; at: number; }
const LIVE: Record<string, LiveOverride> = {};
const LIVE_TTL_MS = 5 * 60000;

export function setLiveQuote(symbol: string, q: { price: number; changePct: number; source?: Source }): void {
  LIVE[symbol] = { price: q.price, changePct: q.changePct, source: q.source || "live", at: Date.now() };
}
export function liveSymbolCount(): number {
  const now = Date.now();
  return Object.values(LIVE).filter((l) => now - l.at < LIVE_TTL_MS).length;
}

export function quoteFor(symbol: string, t: number = Date.now()): Quote | null {
  const m = REGISTRY[symbol];
  if (!m) return null;

  const live = LIVE[symbol];
  if (live) {
    const fresh = t - live.at < LIVE_TTL_MS;
    return {
      symbol, name: m.name, price: live.price, changePct: live.changePct,
      currency: m.currency, sector: m.sector, country: m.country, kind: m.kind,
      source: fresh ? live.source : "cached",
      display: formatPrice(live.price, m.fmt),
    };
  }

  // No live value. Say which kind of nothing this is rather than inventing a
  // number to fill the cell.
  const availability = availabilityOf(symbol, m.kind, m.country, m.name);
  return {
    symbol, name: m.name,
    // NaN rather than 0: a zero silently participates in sums and averages,
    // where NaN forces every caller to handle the absence explicitly.
    price: Number.NaN,
    changePct: Number.NaN,
    currency: m.currency, sector: m.sector, country: m.country, kind: m.kind,
    source: availability === "coverable" ? "pending" : "unavailable",
    display: "—",
  };
}

/**
 * Render a percentage change, or an em dash when there is no number.
 *
 * Every call site that did `changePct.toFixed(2)` printed "NaN%" for an
 * unpriced instrument. Fixing them individually invites the next one to be
 * missed, so the formatting lives here and components call it.
 */
export function formatChange(pct: number | null | undefined, withSign = true): string {
  if (typeof pct !== "number" || !Number.isFinite(pct)) return "—";
  return `${withSign && pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

/**
 * Whether a quote carries a real number. Use before any arithmetic.
 *
 * Deliberately NOT a type predicate. An unpriced quote is still a Quote — it
 * has a symbol, a name and a source — so narrowing the false branch to `never`
 * would stop callers reading the very fields they need to explain the absence.
 */
export const hasPrice = (q: Quote | null | undefined): boolean =>
  !!q && Number.isFinite(q.price);

/** Why this instrument shows no price. Empty when it is merely pending. */
export function reasonFor(symbol: string): string {
  const m = REGISTRY[symbol];
  if (!m) return "We do not track this symbol.";
  return unavailableReason(symbol, m.kind, m.country, m.name);
}

/* ── history: seeded daily candles, cached ── */
const RANGE_DAYS: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
const histCache = new Map<string, { candles: Candle[]; source: HistorySource }>();

export function historyFor(symbol: string, range = "1M"): { candles: Candle[]; source: HistorySource } {
  const ck = symbol + ":" + range;
  const hit = histCache.get(ck);
  if (hit) return hit;
  const m = REGISTRY[symbol];
  if (!m) return { candles: [], source: "unavailable" as HistorySource };

  const n = RANGE_DAYS[range] || 30;
  let seed = hash(symbol + range);
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  const candles: Candle[] = [];
  let close = m.base;
  const dayVol = m.vol * 2.6;
  for (let i = 0; i < n; i++) {
    const drift = (rnd() - 0.5) * 2 * dayVol;
    const open = close / (1 + drift);
    const h = Math.max(open, close) * (1 + rnd() * m.vol);
    const l = Math.min(open, close) * (1 - rnd() * m.vol);
    candles.unshift({ t: Date.now() - i * 86400000, o: open, h, l, c: close });
    close = open;
  }
  const out = { candles, source: "synthetic" as HistorySource };
  histCache.set(ck, out);
  return out;
}

/* ── shared tick loop ── */
type Sub = (t: number) => void;
const subs = new Set<Sub>();
let timer: ReturnType<typeof setInterval> | null = null;
const TICK_MS = 2500;

export function subscribe(fn: Sub): () => void {
  subs.add(fn);
  if (!timer) timer = setInterval(() => { const t = Date.now(); subs.forEach((s) => { try { s(t); } catch { /* keep loop alive */ } }); }, TICK_MS);
  fn(Date.now());
  return () => {
    subs.delete(fn);
    if (subs.size === 0 && timer) { clearInterval(timer); timer = null; }
  };
}

/* ── registry accessors ── */
export const indexSymbols = (): string[] => INDEX_KEYS;
export const allStockSymbols = (): string[] => Object.keys(REGISTRY).filter((k) => REGISTRY[k].kind === "stock");
export const metaFor = (symbol: string): Meta | null => REGISTRY[symbol] || null;
export const stocksOf = (country: string): string[] =>
  ((STOCKS_BY_COUNTRY as Record<string, any[]>)[country] || []).map((s) => s.ticker);

export interface CountryMeta {
  code: string; name: string; lat: number; lng: number; currency: string;
  marketIndex: string; exchange: string; sentiment: string; newsIntensity: number;
}
export const COUNTRIES: Record<string, CountryMeta> = {};
for (const [code, c] of Object.entries(COUNTRIES_DATA as Record<string, any>)) {
  COUNTRIES[code] = {
    code, name: c.name, lat: c.lat, lng: c.lng, currency: c.currency,
    marketIndex: c.marketIndex, exchange: c.exchange || "—",
    sentiment: c.sentiment || "neutral", newsIntensity: c.newsIntensity ?? 0.4,
  };
}
export const countryList = (): CountryMeta[] =>
  Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));

/* Movers computed from live quotes */
export function topMovers(n = 6): { gainers: Quote[]; losers: Quote[] } {
  const t = Date.now();
  // Only instruments with a real number can be ranked. Unpriced ones sort
  // unpredictably against NaN and would otherwise drift into the leaders.
  const qs = allStockSymbols()
    .map((s) => quoteFor(s, t))
    .filter((q): q is Quote => !!q && Number.isFinite(q.changePct))
    .sort((a, b) => b.changePct - a.changePct);
  return { gainers: qs.slice(0, n), losers: qs.slice(-n).reverse() };
}
