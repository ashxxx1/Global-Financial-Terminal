import type { Source, Kind } from "./market";

/**
 * Human "as of" labelling for a quote — growth-plan item 7.
 *
 * A real price that isn't moving (weekend, after-hours) reads as fake unless
 * the UI says *when* it's from. This turns a source + the clock into a short,
 * honest freshness label so nobody mistakes a genuine Friday close for a
 * simulation.
 */

export type FreshTone = "live" | "stale" | "sim";
export interface Freshness {
  label: string;
  tone: FreshTone;
  detail: string;
}

/** US equity session from NYSE local wall-clock (handles DST via Intl). */
function usSession(now: Date): "open" | "pre" | "post" | "weekend" {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday");
  if (day === "Sat" || day === "Sun") return "weekend";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const mins = hour * 60 + parseInt(get("minute"), 10);
  if (mins < 9 * 60 + 30) return "pre";
  if (mins >= 16 * 60) return "post";
  return "open";
}

export function freshness(source: Source, country: string | null, now: Date = new Date()): Freshness {
  if (source !== "live") {
    return { label: "Simulated", tone: "sim", detail: "Illustrative value, not real market data. See /data-sources." };
  }
  // Live, non-equity (crypto 24/7, FX daily) — treat as current.
  if (country !== "US") {
    return { label: "Live", tone: "live", detail: "Live feed." };
  }
  switch (usSession(now)) {
    case "open":
      return { label: "Live", tone: "live", detail: "US market open — quotes update through the session." };
    case "weekend":
      return { label: "At Fri close", tone: "stale", detail: "US markets are closed for the weekend; showing the last close." };
    case "pre":
      return { label: "Prev close", tone: "stale", detail: "Before the US open; showing the previous close." };
    case "post":
      return { label: "At close", tone: "stale", detail: "US market closed for the day; showing today's close." };
  }
}

/* ── Per-instrument provenance — growth-plan item 2 ────────────────────────
   Item 7 answered "when is this from". This answers "where did it come from
   and how delayed is it", per instrument class, in the one place the whole UI
   reads. The facts here must stay in lockstep with /data-sources — if they
   ever disagree, that page is the one telling the truth to regulators. */

export interface Provenance {
  /** Short badge text. */
  label: string;
  tone: FreshTone;
  /** Provider name, for the tooltip. */
  provider: string;
  /** Human delay description. */
  delay: string;
  detail: string;
}

export function provenanceFor(kind: Kind, source: Source, country: string | null = null): Provenance {
  // Genuinely live feeds, regardless of the quote engine.
  if (kind === "crypto") {
    return {
      label: "LIVE", tone: "live", provider: "Binance", delay: "real time",
      detail: "Streamed live from Binance's public WebSocket. Genuine market data.",
    };
  }
  if (kind === "fx") {
    return {
      label: "ECB DAILY", tone: "stale", provider: "European Central Bank", delay: "once per business day",
      detail: "Official ECB reference rates, published once each business day — not intraday.",
    };
  }
  // Non-US equities priced through a US listing — name it, same as the ETFs.
  if (kind === "stock" && source === "live" && country && country !== "US") {
    const adr = name ? adrFor(name, country) : undefined;
    if (adr) {
      return {
        label: `VIA ${adr}`, tone: "stale", provider: `${adr} (US listing) · Finnhub`,
        delay: "delayed (free tier)",
        detail: `Priced from ${adr}, this company's US listing. Real price for the real company, quoted in USD — so the value is the US line's, not the local share price, and the daily change carries an FX component.`,
      };
    }
  }
  // Equities: real but delayed when the provider is wired up.
  if (kind === "stock" && source === "live") {
    return {
      label: "DELAYED", tone: "stale", provider: "Finnhub", delay: "delayed (free tier)",
      detail: "Real quote from Finnhub, delayed on the free tier. Not a real-time trading feed.",
    };
  }
  if (source === "cached") {
    return {
      label: "CACHED", tone: "stale", provider: "last known", delay: "last known value",
      detail: "The provider is unreachable; showing the last value we successfully fetched.",
    };
  }
  // Everything else is the deterministic engine.
  const what =
    kind === "index" ? "Index levels" :
    kind === "commodity" ? "Commodity prices" :
    country && country !== "US" ? "Non-US equity prices" : "Prices";
  return {
    label: "SIMULATED", tone: "sim", provider: "deterministic engine", delay: "not real",
    detail: `${what} here are a deterministic simulation for demonstration — not real market data. See /data-sources.`,
  };
}
