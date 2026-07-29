import { useEffect } from "react";

/**
 * Per-route document metadata.
 *
 * Growth-plan item 29. Every route currently ships the same title and
 * description, which means Google sees one page no matter how many exist —
 * fatal for a product whose primary acquisition channel is programmatic SEO
 * across countries and tickers.
 *
 * This is a dependency-free hook rather than react-helmet: we only need to set
 * a handful of tags, and the bundle is already the thing we just spent effort
 * shrinking.
 *
 * NOTE: this runs client-side. Crawlers that execute JS (Googlebot does) will
 * read it; those that don't will see index.html's defaults. Server rendering
 * (plan item 85) is what makes this bulletproof.
 */

const SITE = "https://global-financial-news.vercel.app";
const SITE_NAME = "GFT Terminal";
const DEFAULT_IMAGE = `${SITE}/og.png`;

export interface Seo {
  title: string;
  description: string;
  /** Path only, e.g. "/markets". Defaults to the current location. */
  path?: string;
  image?: string;
  /** Set true on pages that should not be indexed (auth screens etc.). */
  noindex?: boolean;
}

/** Create or update a <meta> tag, keyed by name or property. */
function setMeta(key: "name" | "property", value: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo({ title, description, path, image, noindex }: Seo): void {
  useEffect(() => {
    const url = `${SITE}${path ?? window.location.pathname}`;
    const img = image ?? DEFAULT_IMAGE;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

    document.title = fullTitle;
    setMeta("name", "description", description);
    setLink("canonical", url);

    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", img);

    // Auth screens must never be indexed; everything else should be.
    setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
  }, [title, description, path, image, noindex]);
}
