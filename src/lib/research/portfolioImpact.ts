/**
 * Research → portfolio context.
 *
 * The bridge the whole terminal is pointed at: a user reading about AAPL should
 * be able to see what that research means for what they already own.
 *
 * It recommends nothing. Every output is a measurement about the user's own
 * holdings — weight, overlap, correlation, historical drawdown impact — and the
 * research findings are placed beside them. Whether a 34% technology weight is
 * too much is not a question this data can answer, and it does not pretend to.
 */
import { historyFor, metaFor, quoteFor } from "../market";
import { toUsd } from "../fxRates";
import type { Position } from "../../store";
import type { CompanyContext } from "./context";
import type { ScoreDimension } from "./scorecard";
import type { Source } from "./types";

export interface HoldingLink {
  symbol: string;
  name: string;
  /** Correlation of daily returns over the shared window. */
  correlation: number | null;
  sharedSector: boolean;
  sharedCountry: boolean;
  weightPct: number;
  overlapDays: number;
}

export interface PortfolioImpact {
  /** Whether this company is actually held. */
  held: boolean;
  weightPct: number | null;
  valueUsd: number | null;
  portfolioUsd: number;
  positionsCounted: number;
  positionsExcluded: number;

  sectorExposurePct: number | null;
  sectorLabel: string | null;
  countryExposurePct: number | null;

  /** Holdings whose returns move with this one. */
  correlated: HoldingLink[];

  /** Worst historical 1-month drawdown, and what that would have cost. */
  drawdown: { worstMonthPct: number; portfolioHitPct: number; window: string } | null;

  /** Findings that bear on concentration, stated as observations. */
  notes: { text: string; kind: "concentration" | "overlap" | "research" }[];
  sources: Source[];
}

/** Pearson correlation of aligned daily returns. */
function correlate(a: string, b: string): { r: number | null; n: number } {
  const ca = historyFor(a, "1Y").candles;
  const cb = historyFor(b, "1Y").candles;
  if (ca.length < 30 || cb.length < 30) return { r: null, n: 0 };

  const mapB = new Map(cb.map((c) => [new Date(c.t).toISOString().slice(0, 10), c.c]));
  const xs: number[] = [], ys: number[] = [];
  for (let i = 1; i < ca.length; i++) {
    const dayNow = new Date(ca[i].t).toISOString().slice(0, 10);
    const dayPrev = new Date(ca[i - 1].t).toISOString().slice(0, 10);
    const bNow = mapB.get(dayNow), bPrev = mapB.get(dayPrev);
    if (bNow === undefined || bPrev === undefined || !(bPrev > 0) || !(ca[i - 1].c > 0)) continue;
    xs.push((ca[i].c - ca[i - 1].c) / ca[i - 1].c);
    ys.push((bNow - bPrev) / bPrev);
  }
  if (xs.length < 20) return { r: null, n: xs.length };

  const mx = xs.reduce((s, v) => s + v, 0) / xs.length;
  const my = ys.reduce((s, v) => s + v, 0) / ys.length;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const a1 = xs[i] - mx, b1 = ys[i] - my;
    num += a1 * b1; dx += a1 * a1; dy += b1 * b1;
  }
  const den = Math.sqrt(dx * dy);
  return { r: den > 0 ? num / den : null, n: xs.length };
}

/** Worst rolling 21-session drawdown over the available history. */
function worstMonth(symbol: string): { pct: number; window: string } | null {
  const { candles } = historyFor(symbol, "1Y");
  if (candles.length < 40) return null;
  let worst = 0, at = "";
  for (let i = 21; i < candles.length; i++) {
    const start = candles[i - 21].c;
    if (!(start > 0)) continue;
    const move = ((candles[i].c - start) / start) * 100;
    if (move < worst) {
      worst = move;
      at = `${new Date(candles[i - 21].t).toISOString().slice(0, 10)} → ${new Date(candles[i].t).toISOString().slice(0, 10)}`;
    }
  }
  return worst < 0 ? { pct: worst, window: at } : null;
}

export function portfolioImpact(
  ctx: CompanyContext, positions: Position[], scorecard: ScoreDimension[],
): PortfolioImpact {
  const sources: Source[] = [];
  const notes: PortfolioImpact["notes"] = [];

  // Value every position in USD; exclude what we cannot convert, and say so.
  let total = 0, excluded = 0;
  const valued: { p: Position; usd: number }[] = [];
  for (const p of positions) {
    const q = quoteFor(p.symbol);
    if (!q) { excluded++; continue; }
    const conv = toUsd(p.shares * q.price, p.currency);
    if (conv.usd === null) { excluded++; continue; }
    valued.push({ p, usd: conv.usd });
    total += conv.usd;
  }

  const mine = valued.filter((v) => v.p.symbol === ctx.symbol);
  const valueUsd = mine.reduce((a, v) => a + v.usd, 0);
  const held = mine.length > 0;
  const weightPct = total > 0 && held ? (valueUsd / total) * 100 : held ? null : null;

  const sectorOf = (s: string) => metaFor(s)?.sector ?? null;
  const countryOf = (s: string) => metaFor(s)?.country ?? null;

  const sectorUsd = valued.filter((v) => sectorOf(v.p.symbol) === ctx.sector).reduce((a, v) => a + v.usd, 0);
  const countryUsd = valued.filter((v) => countryOf(v.p.symbol) === ctx.country).reduce((a, v) => a + v.usd, 0);
  const sectorExposurePct = total > 0 && ctx.sector ? (sectorUsd / total) * 100 : null;
  const countryExposurePct = total > 0 && ctx.country ? (countryUsd / total) * 100 : null;

  // Correlation against the other holdings.
  const correlated: HoldingLink[] = [];
  for (const v of valued) {
    if (v.p.symbol === ctx.symbol) continue;
    const { r, n } = correlate(ctx.symbol, v.p.symbol);
    correlated.push({
      symbol: v.p.symbol,
      name: v.p.name,
      correlation: r,
      sharedSector: sectorOf(v.p.symbol) === ctx.sector,
      sharedCountry: countryOf(v.p.symbol) === ctx.country,
      weightPct: total > 0 ? (v.usd / total) * 100 : 0,
      overlapDays: n,
    });
  }
  correlated.sort((a, b) => (b.correlation ?? -2) - (a.correlation ?? -2));

  // Historical downside, expressed as what it would have cost the portfolio.
  const wm = worstMonth(ctx.symbol);
  const drawdown = wm && weightPct !== null
    ? { worstMonthPct: wm.pct, portfolioHitPct: (wm.pct * weightPct) / 100, window: wm.window }
    : null;

  if (weightPct !== null) {
    sources.push({
      kind: "market", label: "Position weight",
      detail: `${ctx.symbol} $${valueUsd.toFixed(0)} of $${total.toFixed(0)} portfolio (${weightPct.toFixed(1)}%)`,
      asOf: ctx.builtAt, capability: "quote",
    });
  }
  if (drawdown) {
    sources.push({
      kind: "market", label: "Worst 21-session drawdown",
      detail: `${drawdown.worstMonthPct.toFixed(1)}% over ${drawdown.window}`,
      asOf: ctx.builtAt, capability: "price-history",
    });
  }

  /* Observations. Each is a measurement placed beside the research; none is
     advice, and the wording is chosen to keep it that way. */
  if (sectorExposurePct !== null && sectorExposurePct > 30) {
    notes.push({
      kind: "concentration",
      text: `${sectorExposurePct.toFixed(0)}% of the portfolio sits in ${ctx.sector}. Adding to ${ctx.symbol} would raise that; trimming would lower it. Whether that is appropriate depends on objectives this terminal has no view on.`,
    });
  }
  const tight = correlated.filter((c) => (c.correlation ?? 0) >= 0.7 && c.overlapDays >= 60);
  if (tight.length > 0) {
    notes.push({
      kind: "overlap",
      text: `Daily returns move closely with ${tight.map((c) => `${c.symbol} (r=${c.correlation!.toFixed(2)})`).join(", ")}. Positions that correlate this tightly tend to fall together, so they provide less diversification than the position count suggests.`,
    });
  }
  const val = scorecard.find((d) => d.id === "valuation");
  if (val?.score !== null && val?.score !== undefined && held) {
    notes.push({
      kind: "research",
      text: val.score < -0.5
        ? `The valuation reading is toward the expensive end of this company's own range while it represents ${weightPct?.toFixed(1)}% of the portfolio. That combination raises concentration in a position the evidence says is not cheap by its own history.`
        : val.score > 0.5
          ? `The valuation reading is toward the cheap end of this company's own range at a ${weightPct?.toFixed(1)}% weight.`
          : `The valuation reading is near the middle of this company's own range at a ${weightPct?.toFixed(1)}% weight.`,
    });
  }

  return {
    held, weightPct, valueUsd: held ? valueUsd : null,
    portfolioUsd: total, positionsCounted: valued.length, positionsExcluded: excluded,
    sectorExposurePct, sectorLabel: ctx.sector, countryExposurePct,
    correlated: correlated.slice(0, 6),
    drawdown, notes, sources,
  };
}
