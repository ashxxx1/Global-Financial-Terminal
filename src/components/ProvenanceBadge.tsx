import { provenanceFor } from "../lib/marketStatus";
import type { Source, Kind } from "../lib/market";

/**
 * States an instrument's true source and delay — growth-plan item 2.
 *
 * Reuses the freshness pill styling from item 7 so provenance reads as one
 * visual system across the app. Every label it can render is backed by a row
 * on /data-sources; the tooltip carries the full sentence.
 */
export default function ProvenanceBadge({
  kind, source, country = null, className = "",
}: {
  kind: Kind;
  source: Source;
  country?: string | null;
  className?: string;
}) {
  const p = provenanceFor(kind, source, country);
  return (
    <span className={`fresh fresh-${p.tone} ${className}`} title={`${p.detail} (${p.provider} · ${p.delay})`}>
      <span className="fresh-dot" />{p.label}
    </span>
  );
}
