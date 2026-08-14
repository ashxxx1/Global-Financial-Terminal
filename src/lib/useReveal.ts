import { useEffect, useRef } from "react";

/**
 * Reveal children on scroll, staggered.
 *
 * Implements the ui-ux-pro-max "Stagger List (Standard)" preset — 300-450ms,
 * back.out(1.4), ~60ms between items — without pulling GSAP into the bundle
 * for what is four lines of CSS. The observer disconnects after firing, so a
 * section animates once rather than flickering on every scroll reversal.
 *
 * Motion is opt-out at the OS level: when prefers-reduced-motion is set the
 * elements are simply marked visible with no transition at all.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  /** Selector for the children to stagger. Omit to reveal the container itself. */
  childSelector?: string,
  { stagger = 60, threshold = 0.15 }: { stagger?: number; threshold?: number } = {},
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets: HTMLElement[] = childSelector
      ? Array.from(root.querySelectorAll<HTMLElement>(childSelector))
      : [root];
    if (targets.length === 0) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      targets.forEach((el) => el.classList.add("revealed"));
      return;
    }

    targets.forEach((el) => el.classList.add("reveal"));

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const i = targets.indexOf(el);
          el.style.transitionDelay = `${Math.max(0, i) * stagger}ms`;
          el.classList.add("revealed");
          obs.unobserve(el);
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [childSelector, stagger, threshold]);

  return ref;
}
