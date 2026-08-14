/**
 * MarketDataProvider — signal engine MUST use this abstraction.
 * Never call Finnhub / Alpha Vantage / Polygon / FMP from model code.
 */
import { historyFor, quoteFor, type Candle } from "../market";
import type { SignalAsset } from "./types";

export type OhlcBar = Candle & { v?: number };

export interface MarketStatus {
  open: boolean;
  timezone: string;
  nextOpenAt: number | null;
  sessionDate: string;
}

export interface MarketDataProvider {
  getQuote(symbol: string, asOf?: number): { price: number; changePct: number; source: string } | null;
  getHistoricalData(symbol: string, range?: string, asOf?: number): OhlcBar[];
  getIntradayData(symbol: string, asOf?: number): OhlcBar[];
  getVolume(symbol: string, asOf?: number): number | null;
  getMarketStatus(asset: SignalAsset, asOf?: number): MarketStatus;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ymdInTz(ms: number, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date(ms));
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  } catch {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
}

function hourMinuteInTz(ms: number, timeZone: string): { h: number; m: number; dow: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hour: "numeric", minute: "numeric", hour12: false, weekday: "short",
    }).formatToParts(new Date(ms));
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10) % 24;
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const wd = parts.find((p) => p.type === "weekday")?.value || "Mon";
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { h, m, dow: map[wd] ?? 1 };
  } catch {
    const d = new Date(ms);
    return { h: d.getUTCHours(), m: d.getUTCMinutes(), dow: d.getUTCDay() };
  }
}

/** Deterministic provider backed by GFT's market.ts engine (SIM or live overrides). */
export class GftMarketDataProvider implements MarketDataProvider {
  getQuote(symbol: string, asOf: number = Date.now()) {
    const q = quoteFor(symbol, asOf);
    if (!q) return null;
    return { price: q.price, changePct: q.changePct, source: q.source };
  }

  getHistoricalData(symbol: string, range = "6M", asOf?: number): OhlcBar[] {
    const { candles } = historyFor(symbol, range);
    if (asOf == null) return candles.map((c) => ({ ...c }));
    // Anti-hindsight: only bars with t <= asOf
    return candles.filter((c) => c.t <= asOf).map((c) => ({ ...c }));
  }

  getIntradayData(symbol: string, asOf: number = Date.now()): OhlcBar[] {
    // Synthetic intraday from daily bars + intraday wiggle — no future data.
    const daily = this.getHistoricalData(symbol, "1M", asOf);
    if (!daily.length) return [];
    const last = daily[daily.length - 1];
    const out: OhlcBar[] = [];
    const bars = 24;
    for (let i = bars; i >= 0; i--) {
      const t = asOf - i * 15 * 60_000;
      if (t > asOf) continue;
      const q = quoteFor(symbol, t);
      const px = q?.price ?? last.c;
      const wobble = px * 0.0015;
      out.push({ t, o: px - wobble * 0.2, h: px + wobble, l: px - wobble, c: px, v: 1000 + (i % 7) * 40 });
    }
    return out;
  }

  getVolume(symbol: string, asOf?: number): number | null {
    const bars = this.getHistoricalData(symbol, "1M", asOf);
    const last = bars[bars.length - 1];
    return last?.v ?? null;
  }

  getMarketStatus(asset: SignalAsset, asOf: number = Date.now()): MarketStatus {
    const sessionDate = ymdInTz(asOf, asset.timezone);
    // Crypto / FX: always open
    if (asset.assetType === "CRYPTO" || asset.assetType === "FX") {
      return { open: true, timezone: asset.timezone, nextOpenAt: null, sessionDate };
    }
    const { h, m, dow } = hourMinuteInTz(asOf, asset.timezone);
    const weekend = dow === 0 || dow === 6;
    const mins = h * 60 + m;
    const openMins = asset.marketOpenHour * 60 + asset.marketOpenMinute;
    const closeMins = openMins + 6.5 * 60; // approximate cash session
    const open = !weekend && mins >= openMins - 30 && mins <= closeMins + 30;
    return { open: open || mins >= openMins - 90, timezone: asset.timezone, nextOpenAt: null, sessionDate };
  }
}

let singleton: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!singleton) singleton = new GftMarketDataProvider();
  return singleton;
}

/** Test / live injection hook. */
export function setMarketDataProvider(p: MarketDataProvider) {
  singleton = p;
}
