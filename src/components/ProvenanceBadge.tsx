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
  kind, source, country = null, name, className = "",
}: {
  kind: Kind;
  source: Source;
  country?: string | null;
  /**
   * The instrument's ticker (equities) or display name (indices). Without it
   * provenanceFor cannot tell a local-exchange listing from an ADR from a
   * generic delayed quote, and silently falls back to the vaguest label — a
   * badge describing a different number than the one beside it.
   */
  name?: string;
  className?: string;
}) {
  const p = provenanceFor(kind, source, country, name);
  return (
    <span className={`fresh fresh-${p.tone} ${className}`} title={`${p.detail} (${p.provider} · ${p.delay})`}>
      <span className="fresh-dot" />{p.label}
    </span>
  );
}
