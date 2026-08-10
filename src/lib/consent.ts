/**
 * Cookie / analytics consent — growth-plan item 11.
 *
 * PostHog sets cookies and profiles users, so under GDPR it must not run in
 * the EU until the user opts in. The gate is deliberately strict: analytics
 * stays off until consent is explicitly *granted*, so an undecided visitor is
 * treated as a decline rather than a yes.
 *
 * Strictly-necessary storage (the auth session, the watchlist) is exempt and
 * is never gated — it is required for the product to function at all.
 */

const KEY = "gft-consent";

export type ConsentValue = "granted" | "denied";

export function readConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null; // private mode — treat as undecided, i.e. no analytics
  }
}

export function setConsent(v: ConsentValue): void {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(v));
}

/** True only on an explicit grant. Undecided means no. */
export function analyticsAllowed(): boolean {
  return readConsent() === "granted";
}

type Listener = (v: ConsentValue) => void;
const listeners = new Set<Listener>();

/** Lets the app boot analytics the moment consent is given, without a reload. */
export function onConsentChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
