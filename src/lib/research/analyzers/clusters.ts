/**
 * Event clustering and relationship classification.
 *
 * Events that land within days of each other are worth reading together — an
 * earnings miss, downgrades and insider selling in the same fortnight is a
 * different story from any one of them alone.
 *
 * The hard part is saying what the grouping means without overclaiming. Three
 * labels, and the rules are strict:
 *
 *   DIRECTLY OBSERVED    the data itself states the link (a filing IS the
 *                        earnings report; a rating period contains the print)
 *   TEMPORALLY ASSOCIATED  they occurred close together, which is all we know
 *   INFERENCE            we are drawing a conclusion beyond the timing
 *
 * Nothing is ever labelled causal. We cannot observe causation with this data
 * and saying otherwise would be the single most damaging thing this feature
 * could do.
 */
import type { TimelineEvent } from "./timeline";
import { historyFor } from "../../market";

export type Relationship = "DIRECTLY OBSERVED" | "TEMPORALLY ASSOCIATED" | "INFERENCE";

export interface EventCluster {
  id: string;
  /** Calendar label, e.g. "June 2026". */
  label: string;
  from: number;
  to: number;
  events: TimelineEvent[];
  /** Price move across the cluster window. */
  priceMovePct: number | null;
  relationships: { text: string; kind: Relationship; why: string }[];
}

const MONTH = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/** Move across a window, from the closes bracketing it. */
function moveAcross(symbol: string, from: number, to: number): number | null {
  const { candles } = historyFor(symbol, "1Y");
  if (candles.length < 5) return null;
  const before = [...candles].reverse().find((c) => c.t <= from);
  const after = candles.find((c) => c.t >= to);
  if (!before || !after || !(before.c > 0)) return null;
  return ((after.c - before.c) / before.c) * 100;
}

/**
 * Group events by calendar month.
 *
 * Month rather than a rolling window because it is the unit a reader already
 * thinks in, and because a rolling window would silently split a cluster that
 * straddles an arbitrary boundary in one direction but not the other.
 */
export function clusterEvents(symbol: string, events: TimelineEvent[], minSize = 2): EventCluster[] {
  const byMonth = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const d = new Date(e.at);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }

  const clusters: EventCluster[] = [];
  for (const [key, group] of byMonth) {
    if (group.length < minSize) continue;
    const [y, mo] = key.split("-").map(Number);
    const from = Date.UTC(y, mo, 1);
    const to = Date.UTC(y, mo + 1, 0, 23, 59);
    const sorted = [...group].sort((a, b) => b.at - a.at);
    clusters.push({
      id: key,
      label: `${MONTH[mo]} ${y}`,
      from, to,
      events: sorted,
      priceMovePct: moveAcross(symbol, from, to),
      relationships: classify(sorted),
    });
  }
  return clusters.sort((a, b) => b.from - a.from);
}

/** What can honestly be said about a group of co-occurring events. */
function classify(events: TimelineEvent[]): EventCluster["relationships"] {
  const out: EventCluster["relationships"] = [];
  const kinds = new Set(events.map((e) => e.kind));
  const has = (k: TimelineEvent["kind"]) => kinds.has(k);

  // A 10-Q filed in the same month as an earnings print is the same event
  // reported twice. That link is in the data, not inferred from it.
  if (has("earnings") && has("filing")) {
    const filing = events.find((e) => e.kind === "filing");
    const earnings = events.find((e) => e.kind === "earnings");
    if (filing && earnings && Math.abs(filing.at - earnings.at) <= 21 * 86400000) {
      out.push({
        text: "The periodic filing and the earnings print are the same reporting event.",
        kind: "DIRECTLY OBSERVED",
        why: "A 10-Q or 10-K filed within three weeks of the reported period end is that period's report. This is what the documents are, not a pattern we spotted.",
      });
    }
  }

  if (has("earnings") && has("rating")) {
    out.push({
      text: "Analyst rating changes fall in the same month as an earnings print.",
      kind: "TEMPORALLY ASSOCIATED",
      why: "Rating counts are reported monthly, so a change in the same month as a print may or may not follow it. We cannot see individual revision dates, so the ordering within the month is unknown to us.",
    });
  }

  if (has("insider") && has("earnings")) {
    out.push({
      text: "Insider transactions occurred in the same month as an earnings print.",
      kind: "TEMPORALLY ASSOCIATED",
      why: "Insiders commonly transact in the window after results, often under 10b5-1 plans scheduled months earlier. Timing alone tells us nothing about intent.",
    });
  }

  const negative = events.filter((e) =>
    (e.kind === "earnings" && /miss/i.test(e.title)) ||
    (e.kind === "rating" && /fell/i.test(e.title)) ||
    (e.kind === "insider" && /sold/i.test(e.title)));
  if (negative.length >= 2) {
    out.push({
      text: `${negative.length} separate negative signals landed in this window.`,
      kind: "INFERENCE",
      why: "Counting distinct unfavourable events is our judgement about what counts as negative, and co-occurrence is not evidence that they share a cause. Each event's own reaction is measured separately and shown with it.",
    });
  }

  return out;
}
