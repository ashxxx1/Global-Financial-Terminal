/**
 * Thesis monitor — conceptual loop using quotes + optional headlines.
 *
 * Automated push alerts are not wired. Status is derived from whether names
 * that the thesis marked as beneficiaries are outperforming (and vice versa)
 * since the thesis was saved. That is a live check, not a backtest of the idea.
 */
import { quoteFor } from "../market";
import type { MonitoredThesis, ThesisStatus } from "./types";

export function evaluateThesis(t: MonitoredThesis): Pick<MonitoredThesis, "status" | "note" | "lastCheckedAt"> {
  const moves = t.symbols.map((s) => quoteFor(s)).filter((q): q is NonNullable<ReturnType<typeof quoteFor>> => !!q);
  const lastCheckedAt = Date.now();
  if (moves.length < 2) {
    return {
      status: "NEUTRAL",
      lastCheckedAt,
      note: "Not enough live/sim quotes on the watched names to mark strengthening or weakening.",
    };
  }
  const avg = moves.reduce((a, q) => a + q.changePct, 0) / moves.length;
  const expectedUp = t.expectedDirection === "positive";
  const expectedDown = t.expectedDirection === "negative";

  let status: ThesisStatus = "NEUTRAL";
  if (expectedUp && avg >= 0.6) status = "STRENGTHENING";
  else if (expectedUp && avg <= -0.6) status = "WEAKENING";
  else if (expectedDown && avg <= -0.6) status = "STRENGTHENING";
  else if (expectedDown && avg >= 0.6) status = "WEAKENING";
  else if (t.expectedDirection === "mixed" || t.expectedDirection === "uncertain") status = "NEUTRAL";

  const note = `Mean session move across ${moves.length} watched names: ${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%. `
    + (status === "STRENGTHENING"
      ? "Session tape is moving with the stated direction — not confirmation the thesis is ‘right’."
      : status === "WEAKENING"
        ? "Session tape is moving against the stated direction — a contradictory signal, not a verdict."
        : "Session tape is inconclusive versus the stated direction.");

  return { status, note, lastCheckedAt };
}
