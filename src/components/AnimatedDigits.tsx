import { useEffect, useRef, useState } from "react";

/**
 * A number where only the digits that actually changed animate.
 *
 * Pattern borrowed from 21st.dev's "Animate Digits" and rebuilt natively (this
 * project uses plain CSS, not shadcn/Tailwind). The point is specificity: a
 * whole-number crossfade says "some component re-rendered", whereas a single
 * trailing digit blur-sliding up says "the price ticked". On a markets product
 * that distinction is the difference between decoration and information.
 *
 * Direction is carried by colour and travel — up ticks rise green, down ticks
 * fall red — so the movement itself is the signal, not just ornament.
 */
export default function AnimatedDigits({
  value,
  className = "",
  prefix = "",
}: {
  /** Pre-formatted display string, e.g. "43,109.16". */
  value: string;
  className?: string;
  prefix?: string;
}) {
  const prev = useRef(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current === value) return;
    const a = parseFloat(prev.current.replace(/[^0-9.-]/g, ""));
    const b = parseFloat(value.replace(/[^0-9.-]/g, ""));
    setDir(Number.isFinite(a) && Number.isFinite(b) ? (b >= a ? "up" : "down") : null);
    prev.current = value;
  }, [value]);

  const before = prev.current;
  const chars = value.split("");

  return (
    <span className={`digits ${className}`} aria-label={prefix + value}>
      {prefix}
      {chars.map((c, i) => {
        // Compare from the right: prices grow left-to-right, so aligning by the
        // end keeps "999→1000" from flagging every digit as changed.
        const j = before.length - (chars.length - i);
        const changed = before[j] !== c;
        return (
          <span
            // Re-keying on the character replays the CSS animation without a
            // timer to clear — React remounts the node, the animation runs once.
            key={`${i}-${c}-${changed ? dir : "same"}`}
            className={`digit${changed && dir ? ` tick-${dir}` : ""}${c === "," || c === "." ? " sep" : ""}`}
            aria-hidden
          >
            {c}
          </span>
        );
      })}
    </span>
  );
}
