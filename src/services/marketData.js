/**
 * marketData.js — the hybrid market-data provider (Phase 2).
 *
 * The UI never calls a price API directly. It reads through this provider,
 * which resolves the best available source and normalizes everything to one
 * quote shape. Today the only source is the deterministic fallback engine
 * (source: "sim") built from the static STOCKS_BY_COUNTRY snapshot; live
 * sources (source: "live") can be layered in later with zero UI changes.
 *
 * Movement is a *deterministic function of wall-clock time*, seeded per
 * symbol — so prices visibly breathe, yet two tabs (or a reload) agree on the
 * value at any given instant. It is synthetic, never a real trade; every
 * consumer surfaces the source so nothing masquerades as live.
 *
 * Quote shape: { symbol, name, price, changePct, currency, sector, kind, source }
 */
import { STOCKS_BY_COUNTRY } from "../data/stocksData";
import { GLOBAL_INDICES } from "../data/mockData";

// ── deterministic hashing → per-symbol phase seeds ──────────────────────────
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function phases(key) {
  const h = hash(key);
  const TAU = Math.PI * 2;
  return {
    a: ((h % 997) / 997) * TAU,
    b: (((h >> 7) % 991) / 991) * TAU,
    c: (((h >> 13) % 983) / 983) * TAU,
  };
}

// Intraday wiggle amplitude by sector (fraction of price). Tech/crypto swing
// more than utilities — keeps the synthetic movement plausible.
const SECTOR_VOL = {
  Technology: 0.011,
  Automotive: 0.013,
  "Mining & Resources": 0.012,
  Energy: 0.010,
  Media: 0.009,
  Transportation: 0.008,
  "Banking & Finance": 0.007,
  "Real Estate": 0.007,
  Industrial: 0.007,
  Healthcare: 0.006,
  Consumer: 0.006,
  Defence: 0.006,
  Telecom: 0.005,
  Utilities: 0.004,
};
const DEFAULT_VOL = 0.008;

// ── symbol registry ─────────────────────────────────────────────────────────
// ticker/key -> { name, base, snapChange, currency, sector, country, kind, vol, phases, fmt }
const REGISTRY = {};

for (const [country, list] of Object.entries(STOCKS_BY_COUNTRY)) {
  for (const s of list) {
    if (REGISTRY[s.ticker]) continue; // first country wins on duplicate listings
    REGISTRY[s.ticker] = {
      key: s.ticker,
      name: s.name,
      base: s.price,
      snapChange: s.changePct || 0,
      currency: s.currency || "",
      sector: s.sector || "",
      country,
      kind: "stock",
      vol: SECTOR_VOL[s.sector] || DEFAULT_VOL,
      ph: phases(s.ticker),
      fmt: { decimals: s.price < 10 ? 2 : 2, comma: s.price >= 1000 },
    };
  }
}

function parseNum(str) {
  return parseFloat(String(str).replace(/,/g, ""));
}

const INDEX_KEYS = GLOBAL_INDICES.map((idx) => {
  const key = "IDX:" + idx.name;
  const value = String(idx.value);
  const base = parseNum(value);
  const snap = parseFloat(String(idx.change).replace(/%/g, "")) || 0;
  REGISTRY[key] = {
    key,
    name: idx.name,
    base,
    snapChange: snap,
    currency: "",
    sector: "Index",
    country: null,
    kind: "index",
    vol: 0.004,
    ph: phases(idx.name),
    fmt: { decimals: (value.split(".")[1] || "").length, comma: value.includes(",") },
  };
  return key;
});

// ── synthetic pricing ───────────────────────────────────────────────────────
function wiggle(m, t) {
  return (
    m.vol *
    (0.6 * Math.sin(t / 37000 + m.ph.a) +
      0.3 * Math.sin(t / 13000 + m.ph.b) +
      0.1 * Math.sin(t / 4700 + m.ph.c))
  );
}

export function quoteFor(symbol, t = Date.now()) {
  const m = REGISTRY[symbol];
  if (!m) return null;
  const price = m.base * (1 + wiggle(m, t));
  const dayOpen = m.base / (1 + m.snapChange / 100);
  const changePct = ((price - dayOpen) / dayOpen) * 100;
  return {
    symbol,
    name: m.name,
    price,
    changePct,
    currency: m.currency,
    sector: m.sector,
    country: m.country,
    kind: m.kind,
    source: "sim",
    display: formatPrice(price, m.fmt),
  };
}

export function formatPrice(price, fmt = { decimals: 2, comma: true }) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
    useGrouping: fmt.comma,
  });
}

// ── history (seeded daily candles, cached) ──────────────────────────────────
const RANGE_DAYS = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, YTD: 200, "1Y": 365 };
const histCache = new Map();

export function historyFor(symbol, range = "1M") {
  const cacheKey = symbol + ":" + range;
  if (histCache.has(cacheKey)) return histCache.get(cacheKey);
  const m = REGISTRY[symbol];
  if (!m) return { candles: [], source: "sim" };

  const n = RANGE_DAYS[range] || 30;
  let seed = hash(symbol + range);
  const rnd = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // Walk backward from the current base price so the series ends at "today".
  const candles = [];
  let close = m.base;
  const dayVol = m.vol * 2.6;
  for (let i = 0; i < n; i++) {
    const drift = (rnd() - 0.5) * 2 * dayVol;
    const open = close / (1 + drift);
    const hi = Math.max(open, close) * (1 + rnd() * m.vol);
    const lo = Math.min(open, close) * (1 - rnd() * m.vol);
    candles.unshift({ t: Date.now() - i * 86400000, o: open, h: hi, l: lo, c: close });
    close = open;
  }
  const out = { candles, source: "sim" };
  histCache.set(cacheKey, out);
  return out;
}

// ── pub/sub tick loop (one interval shared by all subscribers) ──────────────
const subs = new Set();
let timer = null;
const TICK_MS = 2500;

function loop() {
  const t = Date.now();
  subs.forEach((fn) => {
    try {
      fn(t);
    } catch {
      /* subscriber errors never break the loop */
    }
  });
}

export function subscribe(fn) {
  subs.add(fn);
  if (!timer) timer = setInterval(loop, TICK_MS);
  fn(Date.now()); // fire immediately so the UI paints without waiting a tick
  return () => {
    subs.delete(fn);
    if (subs.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// ── registry accessors ──────────────────────────────────────────────────────
export function indexSymbols() {
  return INDEX_KEYS;
}
export function metaFor(symbol) {
  return REGISTRY[symbol] || null;
}
export function allSymbols() {
  return Object.keys(REGISTRY);
}
