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
import { GLOBAL_INDICES, COUNTRIES_DATA } from "../data/mockData";

export type Source = "live" | "cached" | "sim";
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
  if (/USD|EUR|GBP|JPY|DXY/.test(name)) return "fx";
  if (/BTC|ETH/.test(name)) return "crypto";
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

export function quoteFor(symbol: string, t: number = Date.now()): Quote | null {
  const m = REGISTRY[symbol];
  if (!m) return null;
  const price = m.base * (1 + wiggle(m, t));
  const dayOpen = m.base / (1 + m.snapChange / 100);
  const changePct = ((price - dayOpen) / dayOpen) * 100;
  return {
    symbol, name: m.name, price, changePct, currency: m.currency, sector: m.sector,
    country: m.country, kind: m.kind, source: "sim", display: formatPrice(price, m.fmt),
  };
}

/* ── history: seeded daily candles, cached ── */
const RANGE_DAYS: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
const histCache = new Map<string, { candles: Candle[]; source: Source }>();

export function historyFor(symbol: string, range = "1M"): { candles: Candle[]; source: Source } {
  const ck = symbol + ":" + range;
  const hit = histCache.get(ck);
  if (hit) return hit;
  const m = REGISTRY[symbol];
  if (!m) return { candles: [], source: "sim" };

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
  const out = { candles, source: "sim" as Source };
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
  const qs = allStockSymbols().map((s) => quoteFor(s, t)!)
    .sort((a, b) => b.changePct - a.changePct);
  return { gainers: qs.slice(0, n), losers: qs.slice(-n).reverse() };
}
