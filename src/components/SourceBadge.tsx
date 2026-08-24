import type { Source } from "../lib/market";

const V: Record<Source, { label: string; color: string; dim: string; pulse: boolean; title: string }> = {
  live:   { label: "LIVE",   color: "var(--up)",   dim: "var(--up-dim)",   pulse: true,  title: "Live data feed" },
  cached: { label: "CACHED", color: "var(--blue)", dim: "var(--blue-dim)", pulse: false, title: "Cached — last known values" },
  pending: { label: "…",      color: "var(--muted)", dim: "transparent",   pulse: false, title: "A feed covers this instrument and has not answered yet. No price is shown rather than a placeholder." },
  unavailable: { label: "NO FEED", color: "var(--faint)", dim: "transparent", pulse: false, title: "No price feed exists for this instrument on any provider we can reach." },
};

export default function SourceBadge({ source = "pending" as Source, style, title }: { source?: Source; style?: React.CSSProperties; title?: string }) {
  const v = V[source] || V.pending;
  return (
    <span
      title={title || v.title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: "var(--mono)", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em",
        color: v.color, background: v.dim, border: `1px solid ${v.color}`,
        borderRadius: 3, padding: "2px 6px", lineHeight: 1,
        boxShadow: v.pulse ? `0 0 0 1px ${v.dim}, 0 0 12px ${v.dim}` : undefined,
        ...style,
      }}
    >
      <span className={v.pulse ? "pulse-dot" : undefined}
        style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, boxShadow: `0 0 5px ${v.color}` }} />
      {v.label}
    </span>
  );
}
