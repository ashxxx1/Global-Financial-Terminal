import { useState } from "react";
import { track } from "../lib/analytics";

/**
 * Share control — the growth loop.
 *
 * This product's edge is that it's beautiful, and beautiful things get shared.
 * On mobile we hand off to the native share sheet; on desktop we copy the link
 * and confirm inline. Either way it fires a `shared` event so we can measure
 * the viral coefficient once there's traffic.
 */
export default function ShareButton({ surface = "nav" }: { surface?: string }) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: "GFT Terminal — the world's economy, live",
    text: "A living 3D map of global markets and the news that moves them.",
    url: typeof window !== "undefined" ? window.location.origin : "https://global-financial-terminal-eight.vercel.app",
  };

  const onShare = async () => {
    // Native share sheet where the browser supports it (mostly mobile).
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        track("shared", { method: "native", surface });
        return;
      } catch {
        // user cancelled or it failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      track("shared", { method: "clipboard", surface });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing more we can do silently */
    }
  };

  return (
    <button
      className="share-btn"
      onClick={onShare}
      title="Share the terminal"
      aria-label="Share the terminal"
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
