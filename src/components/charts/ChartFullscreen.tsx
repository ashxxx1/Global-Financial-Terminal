import { useEffect } from "react";

interface Props {
  active: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  onChange: (active: boolean) => void;
}

/** Fullscreen wrapper — uses Fullscreen API on the chart shell. */
export default function ChartFullscreen({ active, containerRef, onChange }: Props) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onFs = () => {
      const isFs = document.fullscreenElement === el;
      onChange(isFs);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [containerRef, onChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isFs = document.fullscreenElement === el;
    if (active && !isFs) {
      el.requestFullscreen?.().catch(() => onChange(false));
    } else if (!active && isFs) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [active, containerRef, onChange]);

  return null;
}
