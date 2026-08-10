import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { track } from "../lib/analytics";

/**
 * Product tour — growth-plan item 42.
 *
 * A spotlight coach-mark walk through the globe's interactions, for people who
 * land on a 3D map and don't know it's draggable/clickable. It runs once,
 * automatically, after onboarding, and can be replayed from the nav.
 *
 * Per the onboarding UX rules: never a locked overlay. Skip and Back are always
 * present, Escape exits, and clicking the dimmed area does nothing destructive.
 * Steps whose target isn't on the page are silently dropped, so it degrades
 * instead of pointing at nothing.
 */

interface Step {
  /** CSS selector for the element to spotlight. Missing → step skipped. */
  target: string;
  title: string;
  body: string;
  /** Preferred tooltip side; falls back if it would overflow. */
  place?: "bottom" | "top" | "left" | "right";
}

const STEPS: Step[] = [
  {
    target: "[data-tour='overlays']",
    title: "Recolour the world",
    body: "Switch the globe between market performance, risk, live events and more. Each lens tells a different story about the same planet.",
    place: "bottom",
  },
  {
    target: "[data-tour='globe']",
    title: "It's a globe — spin it",
    body: "Drag to rotate, scroll to zoom, and click any country to open its full market dashboard.",
    place: "right",
  },
  {
    target: "[data-tour='rail']",
    title: "Your command rail",
    body: "Live market sessions, breadth, your watchlist and the latest news — all here, updating on their own.",
    place: "left",
  },
  {
    target: "[data-tour='search']",
    title: "Jump anywhere",
    body: "Press ⌘K (or click) to search any stock, country or headline in seconds.",
    place: "bottom",
  },
];

const STORAGE_KEY = "gft-toured";
const PAD = 8;

function seen(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}
function markSeen(): void {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
}

export default function ProductTour({ autoStart }: { autoStart?: boolean }) {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const startVia = useRef<"auto" | "manual">("auto");

  // Resolve the steps whose targets actually exist right now.
  const stepsRef = useRef<Step[]>(STEPS);
  const steps = stepsRef.current;

  const begin = useCallback((via: "auto" | "manual") => {
    const present = STEPS.filter((s) => document.querySelector(s.target));
    if (present.length === 0) return;
    stepsRef.current = present;
    startVia.current = via;
    setI(0);
    setActive(true);
    track("tour_started", { via });
  }, []);

  // Auto-start once, shortly after mount so the globe/rail have laid out.
  useEffect(() => {
    if (!autoStart || seen()) return;
    const t = setTimeout(() => begin("auto"), 1200);
    return () => clearTimeout(t);
  }, [autoStart, begin]);

  // Replay trigger from the nav.
  useEffect(() => {
    const onStart = () => begin("manual");
    window.addEventListener("gft:start-tour", onStart);
    return () => window.removeEventListener("gft:start-tour", onStart);
  }, [begin]);

  const finish = useCallback((completed: boolean) => {
    markSeen();
    if (completed) track("tour_completed", { steps: steps.length });
    else track("tour_skipped", { atStep: i });
    setActive(false);
  }, [i, steps.length]);

  // Track the highlighted element's box; keep it in sync with layout changes.
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const el = document.querySelector(steps[i]?.target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const iv = setInterval(measure, 500); // globe canvas can resize as it settles
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      clearInterval(iv);
    };
  }, [active, i, steps]);

  // Keyboard: Esc exits, arrows/enter navigate.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, i, steps.length]);

  const next = () => {
    if (i >= steps.length - 1) finish(true);
    else setI((v) => v + 1);
  };

  if (!active) return null;
  const step = steps[i];

  // Spotlight box, clamped to the viewport.
  const box = rect
    ? {
        left: Math.max(4, rect.left - PAD),
        top: Math.max(4, rect.top - PAD),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Dim everything except the spotlight, via a huge outset shadow. */}
      {box && (
        <div
          className="tour-spot"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
        />
      )}
      {/* Clicking the dim area advances (common, non-destructive). */}
      <div className="tour-catch" onClick={next} />

      <TourCard
        step={step}
        index={i}
        total={steps.length}
        box={box}
        onBack={() => setI((v) => Math.max(0, v - 1))}
        onNext={next}
        onSkip={() => finish(false)}
      />
    </div>
  );
}

function TourCard({
  step, index, total, box, onBack, onNext, onSkip,
}: {
  step: Step; index: number; total: number; box: { left: number; top: number; width: number; height: number } | null;
  onBack: () => void; onNext: () => void; onSkip: () => void;
}) {
  const CARD_W = 300;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  // Position the card near the spotlight, flipping to stay on-screen.
  let left = vw / 2 - CARD_W / 2;
  let top = vh / 2;
  if (box) {
    const place = step.place ?? "bottom";
    if (place === "bottom") { top = box.top + box.height + 12; left = box.left; }
    else if (place === "top") { top = box.top - 12 - 150; left = box.left; }
    else if (place === "left") { top = box.top; left = box.left - CARD_W - 12; }
    else { top = box.top; left = box.left + box.width + 12; }
    left = Math.min(Math.max(12, left), vw - CARD_W - 12);
    top = Math.min(Math.max(12, top), vh - 180);
  }

  return (
    <div className="tour-card" style={{ left, top, width: CARD_W }}>
      <div className="tour-step-count label">STEP {index + 1} / {total}</div>
      <h3 className="tour-title">{step.title}</h3>
      <p className="tour-body">{step.body}</p>
      <div className="tour-actions">
        <button className="tour-skip" onClick={onSkip}>Skip</button>
        <div className="tour-nav">
          {index > 0 && <button className="btn-ghost sm" onClick={onBack}>Back</button>}
          <button className="btn-primary sm" onClick={onNext}>
            {index >= total - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
      <div className="tour-dots">
        {Array.from({ length: total }).map((_, d) => (
          <span key={d} className={`tour-dot ${d === index ? "on" : ""}`} />
        ))}
      </div>
    </div>
  );
}
