import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { OverlayMode } from "./Globe3D";
import { startQuakeFeed, latestQuakes, type QuakeEvent } from "../lib/feeds/quakes";

const Globe3D = lazy(() => import("./Globe3D"));

/**
 * The scroll-driven product tour — the spine of the landing redesign.
 *
 * Pattern: ui-ux-pro-max "Immersive/Interactive Experience" (full-screen
 * interactive element → guided tour → benefits → CTA), with the pinned-visual
 * structure from 21st.dev's "Interactive Scrolling Story". The globe sticks to
 * the viewport while chapters scroll past it, and each chapter *actually
 * repaints the globe* — the marketing is the product running, not a video of it.
 *
 * Two deliberate constraints:
 *  - Only genuinely live overlays appear here. Risk Index and AI Sentiment are
 *    DEMO-tagged in the app, and selling on them would undo the honesty work.
 *  - Pinning is CSS `position: sticky`, not a scroll listener, so there is no
 *    per-frame JS and nothing to jank. Below 900px it unpins into a plain
 *    stack — the skill flags a mobile fallback as essential for this pattern.
 */

export interface Chapter {
  id: string;
  overlay: OverlayMode;
  eyebrow: string;
  title: string;
  body: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: "perf",
    overlay: "market",
    eyebrow: "01 · MARKET PERFORMANCE",
    title: "See where the money went today.",
    body: "Every country shaded by how its market actually moved. Green is buying, red is selling — one glance replaces a page of tables.",
  },
  {
    id: "events",
    overlay: "quakes",
    eyebrow: "02 · LIVE EVENTS",
    title: "Real events, the moment they land.",
    body: "Live seismic and event data straight from USGS, plotted where it happened. Markets react to the world; this is the world.",
  },
  {
    id: "calendar",
    overlay: "calendar",
    eyebrow: "03 · WHAT'S COMING",
    title: "Know what moves things next.",
    body: "Central-bank decisions, inflation prints and earnings, placed on the map and the clock — so nothing important arrives as a surprise.",
  },
];

export default function LandingStage() {
  const [active, setActive] = useState(0);
  const [quakes, setQuakes] = useState<QuakeEvent[]>([]);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // The "live events" chapter claims real USGS data — so it has to actually
  // carry some. An empty globe under that headline would be the exact kind of
  // marketing the honesty work exists to prevent.
  useEffect(() => {
    startQuakeFeed();
    const pull = () => setQuakes(latestQuakes());
    pull();
    const iv = setInterval(pull, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    // Deterministic beats clever here. A thin-band IntersectionObserver fired
    // once during initial layout — while the lazy globe was still settling and
    // every chapter measured zero-height — then latched on whichever entry
    // happened to come last. Measuring against the viewport centre on scroll
    // has no such start-up dependency: it is correct on the very first frame
    // and on every frame after, whatever the layout did in between.
    let raf = 0;
    const measure = () => {
      raf = 0;
      const els = chapterRefs.current.filter(Boolean) as HTMLDivElement[];
      if (els.length === 0) return;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive((prev) => (prev === best ? prev : best));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };

    measure();
    // The landing lives in `.lp`, a fixed full-viewport overlay that scrolls
    // itself — so `window` never emits a scroll event here. Scroll doesn't
    // bubble, but it does capture, so a capture-phase listener on document
    // catches it from whichever element is actually scrolling. That keeps this
    // working if the page is ever re-parented into a different container.
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const chapter = CHAPTERS[active];

  return (
    <section className="stage" aria-label="Product tour">
      <div className="stage-visual">
        <div className="stage-globe">
          <Suspense fallback={<div className="lp-globe-skeleton" />}>
            <Globe3D
              overlay={chapter.overlay}
              quakes={quakes}
              onHover={() => {}}
              onCountryClick={() => {}}
            />
          </Suspense>
          <div className="stage-vignette" aria-hidden />
          <div className="stage-legend" aria-live="polite">
            <span className="pulse-dot" style={{ background: "var(--up)" }} />
            {chapter.eyebrow.split("·")[1]?.trim() ?? chapter.eyebrow}
          </div>
        </div>
        <ol className="stage-dots" aria-hidden>
          {CHAPTERS.map((c, i) => (
            <li key={c.id} className={i === active ? "on" : ""} />
          ))}
        </ol>
      </div>

      <div className="stage-chapters">
        {CHAPTERS.map((c, i) => (
          <div
            key={c.id}
            className={`stage-chapter ${i === active ? "on" : ""}`}
            ref={(el) => { chapterRefs.current[i] = el; }}
          >
            <span className="stage-eyebrow">{c.eyebrow}</span>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
