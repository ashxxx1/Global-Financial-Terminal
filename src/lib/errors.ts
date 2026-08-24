/**
 * Runtime error reporting — growth-plan item 21.
 *
 * Catches what a user would otherwise have to email us about: uncaught
 * exceptions, unhandled promise rejections, and render crashes (via
 * <ErrorBoundary>). Reports go to /api/client-error, which logs them to the
 * Vercel runtime logs we already have.
 *
 * Three rules this file exists to enforce:
 *   1. Reporting must never break the page. Every path is wrapped and silent.
 *   2. Never report the same thing twice — one broken render inside a resize
 *      handler can fire hundreds of identical errors a second.
 *   3. Never send anything a user typed. Query strings are stripped, not
 *      forwarded, because that is where search terms and symbols live.
 */

const ENDPOINT = "/api/client-error";
/** Deduped by message+stack for the life of the page. */
const seen = new Set<string>();
/** Hard ceiling per page view, so a render loop cannot become a request loop. */
const MAX_REPORTS = 12;
let sent = 0;
let installed = false;

const RELEASE: string = import.meta.env.VITE_RELEASE || "dev";

/** Path without the query string — see rule 3 above. */
function safePath(): string {
  try {
    return window.location.pathname;
  } catch {
    return "";
  }
}

export function reportError(
  kind: "error" | "unhandledrejection" | "render",
  message: string,
  stack?: string,
): void {
  try {
    if (!message || sent >= MAX_REPORTS) return;

    const key = `${kind}:${message}:${(stack || "").slice(0, 200)}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent++;

    const payload = JSON.stringify({
      kind,
      message: String(message).slice(0, 1000),
      stack: String(stack || "").slice(0, 2000),
      path: safePath(),
      release: RELEASE,
    });

    // sendBeacon survives the page being torn down, which is exactly the case
    // for the crashes worth hearing about. fetch+keepalive is the fallback.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    } else {
      void fetch(ENDPOINT, {
        method: "POST",
        body: payload,
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => { /* reporting failure is not a user-facing failure */ });
    }
  } catch {
    /* rule 1: never throw from the thing that reports throws */
  }
}

/** Install the global handlers. Safe to call more than once. */
export function installErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e: ErrorEvent) => {
    // Resource load failures (a dead <img>) surface here too but carry no
    // message and are not actionable — skip them.
    if (!e.message) return;
    reportError("error", e.message, e.error?.stack);
  });

  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const r = e.reason;
    reportError(
      "unhandledrejection",
      r instanceof Error ? r.message : String(r ?? "unknown rejection"),
      r instanceof Error ? r.stack : undefined,
    );
  });
}
