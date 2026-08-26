import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SITE_URL } from "../lib/site";
import { track } from "../lib/analytics";

/**
 * Embed snippet dialog — growth-plan item 111.
 *
 * Offers two snippets, and is explicit about the difference, because the
 * difference is the whole reason to offer both:
 *
 *   • The widget is an iframe. It shows a live price on someone else's page and
 *     sends us referral clicks. Search engines do not attribute a link inside
 *     an iframe to the page hosting it, so it earns no link equity.
 *   • The badge is a plain <a> with an image. It is a real backlink — the thing
 *     growth-plan item 108 is actually about.
 *
 * Publishers get told which is which here rather than discovering it later.
 *
 * Portalled to <body> because `.route-fade` animates a transform, and a
 * transformed ancestor becomes the containing block for `position: fixed` —
 * so an overlay rendered from inside a page is positioned against the route
 * wrapper rather than the viewport, and lands off-centre and clipped.
 */

export type EmbedKind = "stock" | "country";

export default function EmbedDialog({ kind, id, name, onClose }: {
  kind: EmbedKind; id: string; name: string; onClose: () => void;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState<string | null>(null);

  const query = theme === "light" ? "?theme=light" : "";
  /** Absolute for the snippet a publisher pastes into their own page. */
  const src = `${SITE_URL}/embed/${kind}/${id}${query}`;
  /** Relative for the preview, so it shows this environment rather than
   *  whatever production happens to be serving. */
  const previewSrc = `/embed/${kind}/${id}${query}`;
  const pageUrl = `${SITE_URL}/${kind === "stock" ? "stock" : "country"}/${id}`;

  const widget =
    `<iframe src="${src}" title="${name} — Global Financial Terminal"\n` +
    `  width="320" height="150" style="border:0;max-width:100%"\n` +
    `  loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

  const badge =
    `<a href="${pageUrl}">\n` +
    `  <img src="${SITE_URL}/api/og?${kind === "stock" ? `symbol=${id}` : `country=${id}`}"\n` +
    `       alt="${name} on Global Financial Terminal" width="600" height="315">\n` +
    `</a>`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async (which: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      track("embed_copied", { kind, id, snippet: which });
      setTimeout(() => setCopied(null), 1800);
    } catch { /* clipboard blocked — the textarea is still selectable */ }
  };

  return createPortal(
    <div className="acct-backdrop" onClick={onClose} role="presentation">
      <div className="acct-modal embed-modal" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={`Embed ${name}`}>
        <div className="acct-modal-head">
          <span className="panel-title">Embed {name}</span>
          <button className="fb-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="embed-body">
          <div className="embed-theme" role="group" aria-label="Widget theme">
            <span className="label">Theme</span>
            {(["dark", "light"] as const).map((t) => (
              <button key={t} className={`chip ${theme === t ? "active blue" : ""}`}
                aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>
            ))}
          </div>

          <div className="embed-preview">
            <iframe src={previewSrc} title={`${name} preview`} width="320" height="150"
              style={{ border: 0, maxWidth: "100%" }} loading="lazy" />
          </div>

          <section className="embed-snippet">
            <div className="embed-snippet-head">
              <h3>Live widget</h3>
              <button className="chip" onClick={() => void copy("widget", widget)}>
                {copied === "widget" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p className="embed-note">
              Updates itself every minute and states the time it was generated. Sends readers
              here when they click it. It is an iframe, so it does <b>not</b> pass search-engine
              link credit to us or to you — it is for readers, not rankings.
            </p>
            <textarea className="embed-code" readOnly rows={3} value={widget}
              onFocus={(e) => e.currentTarget.select()} spellCheck={false} />
          </section>

          <section className="embed-snippet">
            <div className="embed-snippet-head">
              <h3>Static badge</h3>
              <button className="chip" onClick={() => void copy("badge", badge)}>
                {copied === "badge" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p className="embed-note">
              A card image and a normal link. The image is generated when it is requested, so it
              is current whenever it is loaded — and because it is a plain link, this is the one
              that counts as a backlink.
            </p>
            <textarea className="embed-code" readOnly rows={4} value={badge}
              onFocus={(e) => e.currentTarget.select()} spellCheck={false} />
          </section>

          <p className="embed-terms">
            Free to embed on any site, commercial or not. Keep the link to the source page —
            it is how readers reach the provenance behind the figure. Prices are delayed and
            are not investment advice.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
