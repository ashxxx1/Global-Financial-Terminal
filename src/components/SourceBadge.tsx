import type { Source } from "../lib/market";

const V: Record<Source, { label: string; color: string; dim: string; pulse: boolean; title: string }> = {
  live:   { label: "LIVE",   color: "var(--up)",   dim: "var(--up-dim)",   pulse: true,  title: "Live data feed" },
  cached: { label: "CACHED", color: "var(--blue)", dim: "var(--blue-dim)", pulse: false, title: "Cached — last known values" },
  sim:    { label: "SIM",    color: "var(--gold)", dim: "var(--gold-dim)", pulse: false, title: "Simulated — deterministic synthetic movement, not real market data" },
};

export default function SourceBadge({ source = "sim" as Source, style, title }: { source?: Source; style?: React.CSSProperties; title?: string }) {
  const v = V[source] || V.sim;
  return (
    <span
      title={title || v.title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: "var(--mono)", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em",
        color: v.color, background: v.dim, border: `1px solid ${v.color}`,
        borderRadius: 3, padding: "2px 6px", lineHeight: 1, ...style,
      }}
    >
      <span className={v.pulse ? "pulse-dot" : undefined}
        style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, boxShadow: `0 0 5px ${v.color}` }} />
      {v.label}
    </span>
  );
}
