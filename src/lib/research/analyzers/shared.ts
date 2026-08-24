/**
 * Helpers shared by the analyzers.
 *
 * The `unavailableAnswer` builder is the one that matters: when a question
 * needs a capability we do not have, the answer says which one and what we
 * offer instead, rather than quietly answering a nearby question.
 */
import { quoteFor, metaFor, historyFor, stocksOf } from "../../market";
import { provenanceFor } from "../../marketStatus";
import { seriesOf, type Metrics } from "../data";
import { normalize } from "../series";
import type { Answer, Claim, Source } from "../types";
import { weakestTier } from "../types";
import { CAPABILITIES, absenceNote, missingFrom, type CapabilityId } from "../capabilities";

/**
 * The only sanctioned way to read a historical series.
 *
 * Goes through normalize() so fraction-scaled series (margins, returns) come
 * back on the same scale as their point-in-time twins. Reading seriesOf()
 * directly in an analyzer reintroduces the 100x understatement — use this.
 */
export function hist(
  m: Metrics | undefined,
  key: string,
  cadence: "annual" | "quarterly" = "quarterly",
) {
  return normalize(key, seriesOf(m, key, cadence));
}

export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
/** Magnitude only. pct() on an absolute value prints "down +0.06%", where the
 *  sign contradicts the direction word beside it. */
export const mag = (n: number) => `${Math.abs(n).toFixed(2)}%`;

export function marketSource(symbol: string): Source {
  const meta = metaFor(symbol);
  const q = quoteFor(symbol);
  const prov = provenanceFor(meta?.kind ?? "stock", q?.source ?? "pending", meta?.country ?? null, meta?.name);
  return {
    kind: "market",
    label: prov.label,
    detail: q ? `${symbol} ${q.display} (${pct(q.changePct)}) — ${prov.provider}` : `${symbol} — no quote`,
    asOf: Date.now(),
    raw: q?.price,
    capability: "quote",
    unpriced: !q || !Number.isFinite(q.price),
  };
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function dailyVol(symbol: string): { sd: number; n: number } | null {
  const { candles } = historyFor(symbol, "3M");
  if (candles.length < 20) return null;
  const rets: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].c;
    if (prev > 0) rets.push((candles[i].c - prev) / prev * 100);
  }
  if (rets.length < 20) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varr = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length - 1);
  return { sd: Math.sqrt(varr), n: rets.length };
}

export function sectorPeers(symbol: string): { symbol: string; changePct: number }[] {
  const meta = metaFor(symbol);
  if (!meta?.country || !meta.sector) return [];
  return stocksOf(meta.country)
    .filter((s) => s !== symbol && metaFor(s)?.sector === meta.sector)
    .map((s) => ({ symbol: s, q: quoteFor(s) }))
    .filter((x): x is { symbol: string; q: NonNullable<ReturnType<typeof quoteFor>> } => !!x.q)
    .map((x) => ({ symbol: x.symbol, changePct: x.q.changePct }));
}

/** Caveats for every capability an analyzer wanted but could not get. */
export function capabilityCaveats(wanted: CapabilityId[]): string[] {
  return missingFrom(wanted).map(absenceNote);
}

/** The structured "we cannot see that" list the UI renders separately. */
export function unavailableList(wanted: CapabilityId[]) {
  return missingFrom(wanted).map((c) => ({ label: c.label, note: absenceNote(c) }));
}

/**
 * The answer returned when the question itself targets something unavailable.
 * It names the capability, explains the gap, and offers the nearest valid
 * question — the user decides whether the substitute is worth having.
 */
export function unavailableAnswer(
  title: string,
  wanted: CapabilityId,
  suggestions: string[],
): Answer {
  const c = CAPABILITIES[wanted];
  const alt = c.alternative ? CAPABILITIES[c.alternative.capability] : null;
  return {
    title,
    mode: "changed",
    headline: `We cannot answer that: ${c.label.toLowerCase()} is ${c.availability === "premium" ? "a paid dataset we do not have" : "not available to us"}.`,
    claims: [],
    caveats: [],
    unavailable: [{ label: c.label, note: absenceNote(c) }],
    asOf: Date.now(),
    suggestions: alt ? suggestions : [],
  };
}

/** The headline inherits the weakest tier, so an answer resting on an
 *  inference can never be skimmed as established fact. */
export function buildHeadline(claims: Claim[], fallback: string): string {
  if (claims.length === 0) return fallback;
  const t = weakestTier(claims);
  const facts = claims.filter((c) => c.tier === "FACT").length;
  const suffix =
    t === "FACT" ? "— every statement below is a reported fact"
    : t === "CALCULATION" ? "— facts and reproducible arithmetic on them"
    : t === "INFERENCE" ? "— includes reasoning that could be wrong"
    : "— includes a judgement the data supports but does not establish";
  return `${fallback} ${suffix} (${facts} fact${facts === 1 ? "" : "s"} cited)`;
}

export function noQuoteAnswer(symbol: string): Answer {
  return {
    title: metaFor(symbol)?.name || symbol,
    mode: "moving",
    headline: "No quote available for this symbol.",
    claims: [],
    caveats: ["We have no price for this symbol, so there is nothing to analyse."],
    asOf: Date.now(),
    suggestions: [],
  };
}
