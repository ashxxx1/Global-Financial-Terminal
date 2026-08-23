import { severityForScore } from "../../lib/anomalies/engine";
import { scoreTone, SEVERITY_LABEL } from "../../lib/anomalies/format";

export default function AnomalyScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const tone = scoreTone(score);
  const sev = severityForScore(score);
  const pad = size === "sm" ? "2px 7px" : "3px 8px";
  const fontSize = size === "sm" ? 10 : 11;
  return (
    <span
      className="anom-score"
      title={`${SEVERITY_LABEL[sev]} · ${score}/100`}
      style={{
        color: tone.color,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        fontFamily: "var(--mono)",
        fontSize,
        fontWeight: 800,
        letterSpacing: "0.08em",
        padding: pad,
        borderRadius: 3,
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: fontSize - 1.5, fontWeight: 600, letterSpacing: "0.14em", opacity: 0.85 }}>
        {SEVERITY_LABEL[sev].toUpperCase()}
      </span>
      {score}
    </span>
  );
}
