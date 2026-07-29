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
import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

export const analyticsEnabled = Boolean(KEY);

let started = false;

export function initAnalytics(): void {
  if (!analyticsEnabled || started) return;
  started = true;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // we send SPA pageviews manually on route change
    capture_pageleave: true,
    person_profiles: "identified_only", // don't create a profile for every anon visitor
    autocapture: true,
  });
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
  alert_fired: { symbol: string };
  search_opened: Record<string, never>;
  news_clicked: { source: string };
  upgrade_clicked: { placement: string };
  shared: { method: "native" | "clipboard"; surface: string };
}

export function track<K extends keyof EventMap>(event: K, props?: EventMap[K]): void {
  if (!analyticsEnabled) return;
  posthog.capture(event, props);
}

/** Tie events to the signed-in user so retention/funnels are per-account. */
export function identify(uid: string, traits?: Record<string, unknown>): void {
  if (!analyticsEnabled) return;
  posthog.identify(uid, traits);
}

export function resetAnalytics(): void {
  if (!analyticsEnabled) return;
  posthog.reset();
}

export function trackPageview(path: string): void {
  if (!analyticsEnabled) return;
  posthog.capture("$pageview", { $current_url: window.location.href, path });
  track("page_viewed", { path });
}
