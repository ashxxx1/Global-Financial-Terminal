/**
 * Single source of truth for the public origin.
 *
 * Canonical URLs, OG tags and the sitemap all have to agree, and they all have
 * to change together the day a custom domain is pointed at the app. Keeping the
 * value here (overridable with VITE_SITE_URL) makes that a one-line change
 * rather than a hunt through the codebase.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://global-financial-terminal-eight.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "GFT Terminal";

/** Legal entity shown on the Terms and Privacy pages. */
export const LEGAL_ENTITY = "Global Financial Terminal";

/** Last substantive revision of the legal pages. Bump when the text changes. */
export const LEGAL_UPDATED = "10 August 2026";
