import { useState } from "react";
import { track } from "../lib/analytics";
import { SITE_URL } from "../lib/site";

/**
 * Share control — growth-plan item 110.
 *
 * It used to share `window.location.origin` from every page, so someone reading
 * the Japan market page and pressing share sent their friend to the homepage.
 * The card, the title and the context were all thrown away at the exact moment
 * the loop depended on them.
 *
 * It now shares the page being read, with that page's own title and
 * description — which are set per route by useSeo and, since the prerender
 * work, are also in the HTML a scraper sees.
 */
export default function ShareButton({ surface = "nav" }: { surface?: string }) {
  const [copied, setCopied] = useState(false);

  const shareData = () => {
    const url = typeof window === "undefined" ? SITE_URL : window.location.href;
    const title = typeof document === "undefined" ? "GFT Terminal" : document.title;
    const text = typeof document === "undefined" ? "" :
      document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    return { title, text, url };
  };

  const onShare = async () => {
    const data = shareData();
    // Native share sheet where the browser supports it (mostly mobile).
    if (navigator.share) {
      try {
        await navigator.share(data);
        track("shared", { method: "native", surface, path: window.location.pathname });
        return;
      } catch {
        // user cancelled or it failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      track("shared", { method: "clipboard", surface, path: window.location.pathname });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing more we can do silently */
    }
  };

  return (
    <button
      className="share-btn"
      onClick={onShare}
      title="Share this page"
      aria-label="Share this page"
    >
      {copied ? (
        <span className="share-copied">Link copied ✓</span>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
        </svg>
      )}
    </button>
  );
}
