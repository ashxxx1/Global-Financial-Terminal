import { useEffect, useRef, useState } from "react";

/**
 * A number that tweens to its new value and flashes the direction it moved.
 *
 * A terminal that silently swaps 133.87 for 134.02 reads as static. Tweening
 * the digits and flashing green/red is how a trader's eye catches that a value
 * changed at all without staring at it.
 */
export default function AnimatedNumber({
  value,
  format,
  duration = 420,
  className = "",
  style,
}: {
  value: number;
  /** Formatter for the tweened value — defaults to 2dp with thousands separators. */
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const fmt = format || ((n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const [shown, setShown] = useState(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const from = useRef(value);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;

    setDir(value > start ? "up" : "down");
    const t0 = performance.now();
    // easeOutCubic — fast off the mark, settles gently, reads as "landing" on a price
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setShown(start + (value - start) * ease(t));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf.current = requestAnimationFrame(tick);

    const clear = setTimeout(() => setDir(null), duration + 500);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      clearTimeout(clear);
    };
  }, [value, duration]);

  return (
    <span
      className={`mono ${dir ? (dir === "up" ? "flash-up" : "flash-down") : ""} ${className}`}
      style={style}
    >
      {fmt(shown)}
    </span>
  );
}
