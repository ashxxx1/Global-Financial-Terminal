/** Display helpers for GFT Signals UI. */
import type { Signal, SignalStatus } from "./types";

export function fmtPct(x: number | null | undefined, digits = 2): string {
  if (x == null || !Number.isFinite(x)) return "—";
  const pct = x * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

export function fmtPx(x: number, ref?: number): string {
  const r = ref ?? x;
  if (r >= 1000) return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (r >= 100) return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (r >= 1) return x.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return x.toPrecision(4);
}

export function fmtConfidence(n: number): string {
  return `${Math.round(n)}%`;
}

export function fmtDate(ms: number, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(ms).toLocaleDateString("en-GB", opts ?? {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();
}

export function fmtDateTime(ms: number, timeZone?: string): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: timeZone || undefined,
    hour12: false,
  }).toUpperCase().replace(",", " ·");
}

export function statusLabel(s: SignalStatus): string {
  switch (s) {
    case "TARGET_HIT": return "TARGET HIT";
    case "STOP_HIT": return "STOP HIT";
    case "EXPIRED": return "EXPIRED";
    case "AMBIGUOUS": return "AMBIGUOUS";
    case "ACTIVE": return "ACTIVE";
    case "PENDING": return "PENDING";
    case "INVALIDATED": return "INVALIDATED";
  }
}

export function statusTone(s: SignalStatus): "up" | "down" | "blue" | "gold" | "muted" {
  if (s === "TARGET_HIT") return "up";
  if (s === "STOP_HIT") return "down";
  if (s === "ACTIVE" || s === "PENDING") return "gold";
  if (s === "AMBIGUOUS") return "blue";
  return "muted";
}

export function directionTone(d: Signal["direction"]): "up" | "down" | "blue" {
  if (d === "BULLISH") return "up";
  if (d === "BEARISH") return "down";
  return "blue";
}

export function riskRewardLabel(rr: number): string {
  return `1 : ${rr.toFixed(2)}`;
}

export function todayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function yesterdayKey(now = Date.now()): string {
  return new Date(now - 86400000).toISOString().slice(0, 10);
}

export function sameDay(ms: number, key: string): boolean {
  return new Date(ms).toISOString().slice(0, 10) === key;
}
