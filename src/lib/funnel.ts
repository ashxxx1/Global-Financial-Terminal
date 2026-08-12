import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { analyticsAllowed } from "./consent";

/**
 * First-party funnel tracking — no third-party key required.
 *
 * PostHog has been blocked for days on a key that has to be pasted into a
 * dashboard, and every day it stays blocked is a day of product decisions made
 * blind. This removes the dependency instead of waiting on it.
 *
 * It writes to `users/{uid}` — the one path whose rules are already deployed
 * and enforcing (`allow read, write: if request.auth.uid == uid`). So there is
 * no new collection, no rules change to deploy, no key, and no new vendor. It
 * works on the next deploy.
 *
 * What it records, per account:
 *   - firstSeenAt / lastSeenAt         → recency, and the raw material for DAU/WAU
 *   - activatedAt + activatedVia       → the activation moment (docs/METRICS.md)
 *   - onboardedAt, signupMethod        → top of funnel
 *   - counts.<event>                   → how often each value action happens
 *   - daysActive                       → distinct days seen, for the North Star
 *
 * Deliberately NOT a general event log. Per-user aggregates answer the funnel
 * questions in GROWTH-PLAN.md item 19 and stay inside the owner-only rule; an
 * append-only event stream would need a collection nobody can read back without
 * a rules deploy, which is the exact blocker this exists to sidestep.
 *
 * PostHog still fires alongside this when a key is present — the two are
 * complementary, and this is the one that works today.
 */

/** Local mirror, so we never write the same day twice in one session. */
const seenThisSession = new Set<string>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Fire-and-forget: analytics must never block or break a user action. */
function write(patch: Record<string, unknown>): void {
  const u = auth?.currentUser;
  if (!db || !u) return;
  void setDoc(doc(db, "users", u.uid), patch, { merge: true }).catch(() => {
    /* offline, rules, quota — losing a metric must never surface to the user */
  });
}

/**
 * Called on every tracked event. Cheap, deduped, merge-only.
 *
 * Consent-gated. Moving analytics in-house does not move the consent line —
 * behavioural counters are still analytics whether a vendor sees them or not,
 * and /privacy promises they are opt-in. Milestone writes below are different:
 * they are account state ("this account activated"), already covered by the
 * app-data section of the policy, and are what the user exports and deletes.
 */
export function recordEvent(event: string): void {
  if (!analyticsAllowed()) return;
  const day = todayKey();
  const patch: Record<string, unknown> = {
    lastSeenAt: serverTimestamp(),
    counts: { [event]: increment(1) },
  };

  // One write per day for the day-counter, not one per event.
  const dayFlag = `day:${day}`;
  if (!seenThisSession.has(dayFlag)) {
    seenThisSession.add(dayFlag);
    patch.daysActive = increment(1);
    patch.lastActiveDay = day;
  }
  write(patch);
}

/** The activation moment — the single most important number in the funnel. */
export function recordActivation(via: string): void {
  write({ activatedAt: serverTimestamp(), activatedVia: via });
}

/** Top of funnel, written once when the account document is created. */
export function recordSignup(method: string): void {
  write({ signupMethod: method, firstSeenAt: serverTimestamp() });
}

export function recordOnboarded(picked: number): void {
  write({ onboardedAt: serverTimestamp(), onboardingPicked: picked });
}
