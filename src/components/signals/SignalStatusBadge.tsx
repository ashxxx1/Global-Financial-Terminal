import { Link } from "react-router-dom";
import type { SignalStatus } from "../../lib/signals/types";
import { statusLabel, statusTone } from "../../lib/signals/format";

const TONE: Record<string, { color: string; bg: string }> = {
  up: { color: "var(--up)", bg: "var(--up-dim)" },
  down: { color: "var(--down)", bg: "var(--down-dim)" },
  gold: { color: "var(--gold)", bg: "var(--gold-dim)" },
  blue: { color: "var(--blue)", bg: "var(--blue-dim)" },
  muted: { color: "var(--muted)", bg: "transparent" },
  purple: { color: "var(--purple)", bg: "var(--purple-dim)" },
};

export default function SignalStatusBadge({ status }: { status: SignalStatus }) {
  const tone = TONE[statusTone(status)];
  return (
    <span
      className="sig-badge"
      style={{
        color: tone.color,
        background: tone.bg,
        border: `1px solid ${tone.color}`,
        fontFamily: "var(--mono)",
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.1em",
        padding: "2px 7px",
        borderRadius: 3,
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

export function SignalDirectionBadge({ direction }: { direction: string }) {
  const tone = direction === "BULLISH" ? TONE.up : direction === "BEARISH" ? TONE.down : TONE.blue;
  return (
    <span
      style={{
        color: tone.color,
        background: tone.bg,
        border: `1px solid ${tone.color}`,
        fontFamily: "var(--mono)",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.12em",
        padding: "3px 8px",
        borderRadius: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.color }} />
      {direction}
    </span>
  );
}

export function SignalsDisclaimer() {
  return (
    <p className="sig-disclaimer" style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5, margin: "12px 0 0" }}>
      GFT Signals are model-generated market forecasts for informational purposes only and are not investment advice or a guarantee of future returns.
    </p>
  );
}

export function DemoBanner({ demo }: { demo: boolean }) {
  if (!demo) {
    return (
      <span className="chip" style={{ color: "var(--up)", borderColor: "var(--up)" }}>LIVE MODEL</span>
    );
  }
  return (
    <span className="chip" title="Deterministic demo track record — not live historical performance" style={{ color: "var(--purple)", borderColor: "var(--purple)" }}>
      DEMO TRACK RECORD
    </span>
  );
}

export function SignalsSubnav({ active }: { active: string }) {
  const links = [
    { to: "/terminal/signals", id: "today", label: "TODAY" },
    { to: "/terminal/signals/history", id: "history", label: "HISTORY" },
    { to: "/terminal/signals/performance", id: "performance", label: "TRACK RECORD" },
    { to: "/terminal/signals/calendar", id: "calendar", label: "CALENDAR" },
    { to: "/terminal/signals/backtest", id: "backtest", label: "BACKTEST" },
    { to: "/terminal/signals/methodology", id: "methodology", label: "METHODOLOGY" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
      {links.map((l) => (
        <Link key={l.id} to={l.to} className={`chip ${active === l.id ? "active" : ""}`} style={{ textDecoration: "none" }}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}
