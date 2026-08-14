import { useEffect, useState } from "react";
import { useIndices } from "../lib/hooks";
import AnimatedDigits from "./AnimatedDigits";

/**
 * A live, ticking slice of the actual product, on the landing page.
 *
 * The page previously *described* live markets in prose and showed none — the
 * single thing that made it read as a generic SaaS template rather than a
 * markets terminal. Real numbers that move while you read the headline are the
 * demo; no screenshot or feature card argues as well.
 *
 * Values come from the same engine the app uses, so this is not a mock: it is
 * the product, running, above the fold.
 */
export default function LiveMarketStrip() {
  const all = useIndices();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // One instrument per asset class, chosen by kind rather than by hardcoded
  // ticker — the registry keys indices as "IDX:<name>", so a literal list would
  // silently render nothing the moment the data file changed.
  const pick = (kind: string) => all.find((q) => q.kind === kind);
  const rows = [pick("crypto"), pick("fx"), pick("commodity"), pick("index")]
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  if (rows.length === 0) return null;

  return (
    <div className={`lms ${mounted ? "in" : ""}`} aria-label="Live market snapshot">
      {rows.map((q, i) => {
        const up = q.changePct >= 0;
        return (
          <div className="lms-cell" key={q.symbol} style={{ transitionDelay: `${i * 70}ms` }}>
            <span className="lms-sym">{q.name}</span>
            <AnimatedDigits className="lms-price" value={q.display} />
            <span className={`lms-chg ${up ? "up" : "down"}`}>
              {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
