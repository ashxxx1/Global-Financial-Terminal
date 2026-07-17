/**
 * SourceBadge — tiny chip that tells the operator where a panel's data came
 * from. Honesty device: LIVE (real feed) · CACHED (last good) · SIM (synthetic
 * fallback). Styled from the unified token palette.
 */
const VARIANTS = {
  live: { label: "LIVE", color: "var(--nx-mint)", dim: "var(--nx-mint-dim)", pulse: true },
  cached: { label: "CACHED", color: "var(--nx-cyan)", dim: "var(--nx-cyan-dim)", pulse: false },
  sim: { label: "SIM", color: "var(--nx-gold)", dim: "var(--nx-gold-dim)", pulse: false },
};

export default function SourceBadge({ source = "sim", title, style }) {
  const v = VARIANTS[source] || VARIANTS.sim;
  return (
    <span
      title={title || sourceTitle(source)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--nx-font-mono)",
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: v.color,
        background: v.dim,
        border: `1px solid ${v.color}`,
        borderRadius: 2,
        padding: "2px 6px",
        lineHeight: 1,
        ...style,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: v.color,
          boxShadow: `0 0 6px ${v.color}`,
          animation: v.pulse ? "nx-live-pulse 1.2s ease-in-out infinite" : "none",
        }}
      />
      {v.label}
    </span>
  );
}

function sourceTitle(source) {
  if (source === "live") return "Live data feed";
  if (source === "cached") return "Cached — last known values";
  return "Simulated — synthetic movement from a static snapshot, not real market data";
}
