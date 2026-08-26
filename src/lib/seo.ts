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

import { SITE_URL as SITE, SITE_NAME } from "./site";

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

/**
 * Structured data — growth-plan item 97.
 *
 * Financial pages compete for rich results; without JSON-LD Google has to infer
 * what this site is from prose. One Organization/WebSite graph is emitted on
 * every page, with SearchAction so the site can win a sitelinks searchbox.
 */
function setJsonLd(url: string, title: string, description: string): void {
  const id = "gft-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#org`,
        name: "Global Financial Terminal",
        url: SITE,
        logo: `${SITE}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#site`,
        url: SITE,
        name: SITE_NAME,
        publisher: { "@id": `${SITE}/#org` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE}/stock/{search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      { "@type": "WebPage", "@id": url, url, name: title, description, isPartOf: { "@id": `${SITE}/#site` } },
    ],
  });
}

/**
 * URL for a page-specific Open Graph card — growth-plan item 96.
 *
 * A shared link with a real card is clicked several times more often than a
 * bare URL, and this is the cheapest distribution work available. Values are
 * encoded here so callers cannot accidentally emit a broken query string.
 */
/**
 * URL of the share card for a page.
 *
 * `symbol` and `country` are the preferred forms: the endpoint resolves the
 * company or market from our own registry and fetches the quote itself, at the
 * moment the card is scraped. The older shape passed `value` and `change`
 * through the query string, which meant anyone could mint a card on our domain
 * showing a price we never published — so the endpoint no longer reads a figure
 * from the caller, and neither does this.
 */
export function ogImageFor(opts: {
  symbol?: string;
  country?: string;
  title?: string;
  subtitle?: string;
  kind?: string;
}): string {
  const q = new URLSearchParams();
  if (opts.symbol) q.set("symbol", opts.symbol);
  else if (opts.country) q.set("country", opts.country);
  else {
    if (opts.title) q.set("title", opts.title);
    if (opts.subtitle) q.set("subtitle", opts.subtitle);
    if (opts.kind) q.set("kind", opts.kind);
  }
  return `${SITE}/api/og?${q.toString()}`;
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
    if (!noindex) setJsonLd(url, fullTitle, description);
  }, [title, description, path, image, noindex]);
}
