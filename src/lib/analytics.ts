/**
 * Product analytics — PostHog, gated behind an env key.
 *
 * Follows the same pattern as firebase.ts: if VITE_POSTHOG_KEY is absent every
 * call is a safe no-op, so local dev and a fresh clone run without anyone
 * having to provision analytics first. The moment a key is set, the whole app
 * is instrumented with no other change.
 *
 * All tracking flows through the typed `track()` helper below rather than
 * calling posthog directly, so the event vocabulary stays in one place and
 * cannot drift into a mess of ad-hoc string names.
 */
/**
 * posthog-js is ~74KB gzipped. It is imported dynamically so it never sits on
 * the critical path — analytics must never delay first paint. Events fired
 * before the SDK finishes loading are queued and flushed on arrival rather
 * than dropped.
 */
import { analyticsAllowed } from "./consent";

type PostHog = typeof import("posthog-js").default;

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

export const analyticsEnabled = Boolean(KEY);

let ph: PostHog | null = null;
let started = false;
const queue: Array<(p: PostHog) => void> = [];

/**
 * Run now if the SDK is ready, otherwise buffer until it is.
 *
 * Nothing is buffered without consent. Queuing pre-consent activity and
 * flushing it the moment someone opts in would be retroactive collection of
 * data they had not agreed to when it happened — consent is not backdated.
 */
function withPostHog(fn: (p: PostHog) => void): void {
  if (!analyticsEnabled || !analyticsAllowed()) return;
  if (ph) fn(ph);
  else queue.push(fn);
}

export function initAnalytics(): void {
  if (!analyticsEnabled || started) return;
  // Consent gate (item 11). Undecided counts as denied, so nothing loads until
  // the user explicitly opts in; onConsentChange re-invokes this on a grant.
  if (!analyticsAllowed()) return;
  started = true;
  // Load after the browser is idle so it competes with nothing that matters.
  const load = () => {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(KEY, {
          api_host: HOST,
          capture_pageview: false, // we send SPA pageviews manually on route change
          capture_pageleave: true,
          person_profiles: "identified_only", // don't profile every anon visitor
          autocapture: true,
        });
        ph = posthog;
        queue.splice(0).forEach((fn) => fn(posthog));
      })
      .catch(() => {
        // Analytics failing must never break the app.
        started = false;
      });
  };
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, o?: object) => void })
      .requestIdleCallback(load, { timeout: 3000 });
  } else {
    setTimeout(load, 1200);
  }
}

/**
 * The event vocabulary. Adding a member here is the only way to add an event,
 * which keeps naming consistent and makes the funnel legible.
 */
export interface EventMap {
  signed_up: { method: "email" | "google" };
  signed_in: { method: "email" | "google" };
  signed_out: Record<string, never>;
  page_viewed: { path: string };
  country_opened: { code: string };
  stock_opened: { symbol: string };
  overlay_switched: { overlay: string };
  watchlist_added: { symbol: string };
  watchlist_removed: { symbol: string };
  alert_created: { symbol: string };
  /** Portfolio — growth-plan items 73 & 74. */
  position_added: { symbol: string };
  positions_imported: { count: number };
  alert_fired: { symbol: string };
  search_opened: Record<string, never>;
  news_clicked: { source: string };
  upgrade_clicked: { placement: string };
  /** Which snippet publishers actually take — the widget or the badge — is the
   *  question item 137 has to price against. */
  embed_copied: { kind: string; id: string; snippet: string };
  /** `path` matters for the viral coefficient: which pages get shared is the
   *  question, and the event used to carry no way to answer it. */
  shared: { method: "native" | "clipboard"; surface: string; path: string };
  /** Fired exactly once per user, on their first value action. The single
   *  most important event in the funnel — see docs/METRICS.md. */
  activated: { via: string };
  onboarding_shown: Record<string, never>;
  onboarding_completed: { picked: number };
  onboarding_skipped: Record<string, never>;
  feedback_opened: Record<string, never>;
  feedback_submitted: { type: string };
  pmf_shown: Record<string, never>;
  pmf_answered: { answer: string };
  pmf_dismissed: Record<string, never>;
  tour_started: { via: "auto" | "manual" };
  tour_completed: { steps: number };
  tour_skipped: { atStep: number };
  compare_opened: { left: string; right: string; mode?: string };
  compare_saved: { a: string; b: string };
  page_view: { page: string };
  forum_post_created: { hasMedia: boolean };
  forum_post_deleted: Record<string, never>;
  forum_post_reposted: { postId: string };
  forum_post_unreposted: { postId: string };
  forum_comment_added: { postId: string };
  forum_comment_deleted: { postId: string };
  data_exported: Record<string, never>;
  /** Churn survey — growth-plan item 82. Reason is optional at the call site. */
  account_deleted: { reason?: string; note?: string };
}

export function track<K extends keyof EventMap>(event: K, props?: EventMap[K]): void {
  // First-party first: this works today, with no key and no vendor. PostHog
  // fires alongside it when configured — the two are complementary.
  void import("./funnel").then((f) => {
    f.recordEvent(event);
    if (event === "activated") f.recordActivation(String((props as { via?: string })?.via ?? "unknown"));
    if (event === "signed_up") f.recordSignup(String((props as { method?: string })?.method ?? "unknown"));
    if (event === "onboarding_completed") f.recordOnboarded(Number((props as { picked?: number })?.picked ?? 0));
  }).catch(() => { /* analytics must never break a user action */ });

  withPostHog((p) => p.capture(event, props));
}

/** Tie events to the signed-in user so retention/funnels are per-account. */
export function identify(uid: string, traits?: Record<string, unknown>): void {
  withPostHog((p) => p.identify(uid, traits));
}

export function resetAnalytics(): void {
  withPostHog((p) => p.reset());
}

export function trackPageview(path: string): void {
  withPostHog((p) => p.capture("$pageview", { $current_url: window.location.href, path }));
  track("page_viewed", { path });
}
