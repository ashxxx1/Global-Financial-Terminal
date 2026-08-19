/**
 * "Explain this move."
 *
 * Given an unusual price move, gather every dated thing we hold around it and
 * rank by how well each candidate actually lines up. The ranking is mechanical:
 * proximity in time, whether the event type is the kind that moves prices, and
 * whether peers moved too — because if the whole sector fell, the company's own
 * news is not the explanation.
 *
 * The most important behaviour is the refusal. When nothing scores well enough,
 * it says so. "No sufficiently strong evidence for a specific cause" is a real
 * research finding and vastly better than the plausible story a reader would
 * otherwise believe.
 */
import { historyFor, metaFor, stocksOf } from "../../market";
import type { CompanyContext } from "../context";
import type { TimelineEvent } from "./timeline";
import type { Source } from "../types";

export interface MoveCandidate {
  event: TimelineEvent;
  /** 0–1. Mechanical, and the components are shown. */
  relevance: number;
  daysApart: number;
  reasons: string[];
}

export interface MoveExplanation {
  at: number;
  movePct: number;
  /** How unusual, in standard deviations of this stock's daily returns. */
  sigma: number | null;
  /** What the sector did on the same day. */
  peerMovePct: number | null;
  peerN: number;
  /** Portion of the move not explained by the sector. */
  idiosyncraticPct: number | null;
  candidates: MoveCandidate[];
  /** Set when nothing clears the bar. */
  verdict: "candidates-found" | "no-sufficient-evidence" | "sector-wide";
  verdictText: string;
  sources: Source[];
}

/** Event types that plausibly move a price, and their base weight. */
const KIND_WEIGHT: Record<TimelineEvent["kind"], number> = {
  earnings: 1.0, rating: 0.7, filing: 0.5, news: 0.6, insider: 0.25,
};

/** Unusual daily moves, for the timeline to offer as drill-downs. */
export function unusualMoves(symbol: string, minSigma = 2, limit = 8): { at: number; movePct: number; sigma: number }[] {
  const { candles } = historyFor(symbol, "1Y");
  if (candles.length < 30) return [];
  const rets: { at: number; pct: number }[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].c;
    if (prev > 0) rets.push({ at: candles[i].t, pct: ((candles[i].c - prev) / prev) * 100 });
  }
  const mean = rets.reduce((a, r) => a + r.pct, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, r) => a + (r.pct - mean) ** 2, 0) / Math.max(1, rets.length - 1));
  if (!(sd > 0)) return [];
  return rets
    .map((r) => ({ at: r.at, movePct: r.pct, sigma: (r.pct - mean) / sd }))
    .filter((r) => Math.abs(r.sigma) >= minSigma)
    .sort((a, b) => Math.abs(b.sigma) - Math.abs(a.sigma))
    .slice(0, limit)
    .sort((a, b) => b.at - a.at);
}

/** Median same-sector move on a given day. */
function peerMoveOn(ctx: CompanyContext, at: number): { pct: number | null; n: number } {
  if (!ctx.country || !ctx.sector) return { pct: null, n: 0 };
  const peers = stocksOf(ctx.country).filter((s) => s !== ctx.symbol && metaFor(s)?.sector === ctx.sector);
  const moves: number[] = [];
  for (const p of peers) {
    const { candles } = historyFor(p, "1Y");
    const i = candles.findIndex((c) => c.t >= at);
    if (i > 0 && candles[i - 1].c > 0) moves.push(((candles[i].c - candles[i - 1].c) / candles[i - 1].c) * 100);
  }
  if (!moves.length) return { pct: null, n: 0 };
  const s = moves.sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return { pct: s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2, n: s.length };
}

export function explainMove(
  ctx: CompanyContext, timeline: TimelineEvent[], at: number, movePct: number, sigma: number | null,
): MoveExplanation {
  const WINDOW = 4 * 86400000;   // events up to four days before, one day after
  const peer = peerMoveOn(ctx, at);
  const idiosyncratic = peer.pct === null ? null : movePct - peer.pct;

  const candidates: MoveCandidate[] = [];
  for (const e of timeline) {
    const delta = at - e.at;
    if (delta < -86400000 || delta > WINDOW) continue;
    const days = delta / 86400000;
    const reasons: string[] = [];

    // Proximity: same day is full weight, decaying to nothing at four days.
    const proximity = Math.max(0, 1 - Math.abs(days) / 4);
    reasons.push(days <= 0.5 && days >= -0.5 ? "same session as the move" : `${Math.abs(days).toFixed(0)} day${Math.abs(days) < 1.5 ? "" : "s"} ${days > 0 ? "before" : "after"} the move`);

    const kind = KIND_WEIGHT[e.kind];
    reasons.push(`${e.kind} events carry a base weight of ${kind.toFixed(2)}`);

    // Direction agreement, where the event has a sign we can read.
    let agreement = 0.5;
    const negative = /miss|fell|sold|down/i.test(e.title);
    const positive = /beat|rose|bought|up/i.test(e.title);
    if ((negative && movePct < 0) || (positive && movePct > 0)) { agreement = 1; reasons.push("direction matches the move"); }
    else if ((negative && movePct > 0) || (positive && movePct < 0)) { agreement = 0.2; reasons.push("direction runs against the move"); }

    candidates.push({
      event: e,
      daysApart: days,
      relevance: proximity * 0.5 + kind * 0.3 + agreement * 0.2,
      reasons,
    });
  }
  candidates.sort((a, b) => b.relevance - a.relevance);

  // If the sector moved with it, the sector is the explanation and the
  // company's own news mostly is not.
  const sectorWide = peer.pct !== null && Math.abs(peer.pct) > 1 &&
    Math.sign(peer.pct) === Math.sign(movePct) &&
    Math.abs(idiosyncratic ?? 0) < Math.abs(movePct) * 0.4;

  const best = candidates[0];
  let verdict: MoveExplanation["verdict"];
  let verdictText: string;

  if (sectorWide) {
    verdict = "sector-wide";
    verdictText = `This looks sector-wide rather than company-specific: ${peer.n} same-sector names moved a median ${peer.pct!.toFixed(2)}% on the same session, leaving only ${idiosyncratic!.toFixed(2)}pp unexplained by the sector. Company events below are listed for completeness, not as an explanation.`;
  } else if (!best || best.relevance < 0.45) {
    verdict = "no-sufficient-evidence";
    verdictText = `No sufficiently strong evidence found for a specific cause. ${candidates.length === 0 ? "We hold no dated events within four days of this move." : `The closest candidate scored ${best.relevance.toFixed(2)}, below the 0.45 threshold we require before naming anything.`} A move without a visible cause is common and is not a failure of the market — it is a limit of what this data can see.`;
  } else {
    verdict = "candidates-found";
    verdictText = `Ranked candidates below. Timing and direction are observable; that any of these caused the move is not something this data can establish.`;
  }

  return {
    at, movePct, sigma,
    peerMovePct: peer.pct, peerN: peer.n, idiosyncraticPct: idiosyncratic,
    candidates: candidates.slice(0, 6),
    verdict, verdictText,
    sources: [
      { kind: "market", label: "Price history", detail: `${movePct.toFixed(2)}% on ${new Date(at).toISOString().slice(0, 10)}${sigma !== null ? `, ${sigma.toFixed(1)}σ against its own daily range` : ""}`, asOf: at, capability: "price-history" },
      ...(peer.pct !== null ? [{ kind: "peers" as const, label: "Sector reaction", detail: `${peer.n} same-sector names, median ${peer.pct.toFixed(2)}% the same session`, asOf: at, capability: "peers" as const }] : []),
    ],
  };
}
