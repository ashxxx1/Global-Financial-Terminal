/**
 * GFT mark.
 *
 * A globe reduced to its meridians, with the latitude lines stepping upward so
 * the same strokes read as a bar chart — the two halves of "global financial"
 * in one figure, rather than a generic orb with a swoosh through it. Built on a
 * 24-unit grid with a single 1.5 stroke weight so it stays legible at 20px in
 * the nav and at 120px on the hero.
 *
 * Monochrome by construction: it inherits currentColor, so it works on black,
 * on white, and inside a button without a second asset.
 */
export default function GftLogo({
  size = 24,
  animated = false,
  className = "",
}: { size?: number; animated?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={`gft-mark ${animated ? "is-animated" : ""} ${className}`}
      role="img"
      aria-label="Global Financial Terminal"
    >
      {/* the sphere */}
      <circle cx="12" cy="12" r="9.25" className="gft-ring" opacity="0.55" />
      {/* meridian — the only curve, so the mark still reads as a globe */}
      <path d="M12 2.75c3.1 3 4.6 6.1 4.6 9.25s-1.5 6.25-4.6 9.25c-3.1-3-4.6-6.1-4.6-9.25S8.9 5.75 12 2.75Z" opacity="0.35" />
      {/* latitudes, stepping up: globe lines that double as a bar chart */}
      <path d="M5.6 15.6h4.1" className="gft-bar gft-bar-1" />
      <path d="M7.4 12.4h6.4" className="gft-bar gft-bar-2" />
      <path d="M9.2 9.2h8.2" className="gft-bar gft-bar-3" />
      {/* the tick that closes the chart reading */}
      <path d="M15.4 6.2h3.1v3.1" className="gft-tick" opacity="0.9" />
    </svg>
  );
}
