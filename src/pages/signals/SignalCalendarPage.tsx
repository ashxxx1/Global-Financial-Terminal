import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, isDemoMode } from "../../lib/signals/api";
import { computeDailyPerformance } from "../../lib/signals/performance";
import { fmtPct } from "../../lib/signals/format";
import type { Signal } from "../../lib/signals/types";
import { DemoBanner, SignalsDisclaimer, SignalsSubnav } from "../../components/signals/SignalStatusBadge";
import SignalStatusBadge, { SignalDirectionBadge } from "../../components/signals/SignalStatusBadge";

export default function SignalCalendarPage() {
  useSeo({
    title: "Signal Calendar",
    description: "Daily GFT signal outcomes on a calendar.",
    path: "/terminal/signals/calendar",
  });

  const [signals, setSignals] = useState<Signal[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { setSignals(bootstrapSignals()); }, []);
  const daily = useMemo(() => computeDailyPerformance(signals), [signals]);
  const byDate = useMemo(() => new Map(daily.map((d) => [d.date, d])), [daily]);

  const year = cursor.getUTCFullYear();
  const month = cursor.getUTCMonth();
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d });
  }

  const selectedSignals = selected
    ? signals.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === selected)
    : [];

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).toUpperCase();

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>SIGNAL CALENDAR</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Signals generated · target hits · stop hits · daily model result</p>
        </div>
        <DemoBanner demo={isDemoMode()} />
      </div>
      <SignalsSubnav active="calendar" />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button type="button" className="chip" onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}>←</button>
        <div style={{ fontWeight: 800, letterSpacing: "0.08em" }}>{monthLabel}</div>
        <button type="button" className="chip" onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}>→</button>
      </div>

      <div className="panel" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} className="label" style={{ textAlign: "center" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {cells.map((c, i) => {
            if (!c.date) return <div key={`e${i}`} />;
            const d = byDate.get(c.date);
            const tone = !d || d.signalsGenerated === 0
              ? "transparent"
              : d.targetHits > d.stopHits
                ? "var(--up-dim)"
                : d.stopHits > d.targetHits
                  ? "var(--down-dim)"
                  : "var(--gold-dim)";
            const border = selected === c.date ? "var(--gold)" : "var(--line)";
            return (
              <button
                key={c.date}
                type="button"
                onClick={() => setSelected(c.date)}
                style={{
                  background: tone, border: `1px solid ${border}`, borderRadius: 6,
                  padding: "8px 6px", minHeight: 64, cursor: "pointer", textAlign: "left", color: "var(--text)",
                }}
              >
                <div className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{c.day}</div>
                {d && d.signalsGenerated > 0 && (
                  <div className="label" style={{ marginTop: 4 }}>
                    {d.targetHits > d.stopHits ? "🟢" : d.stopHits > d.targetHits ? "🔴" : "🟡"} {d.signalsGenerated}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">{selected} · {selectedSignals.length} SIGNALS</span>
            {byDate.get(selected) && (
              <span className="label">
                HIT {byDate.get(selected)!.targetHits} · STOP {byDate.get(selected)!.stopHits}
                {byDate.get(selected)!.avgReturn != null ? ` · ${fmtPct(byDate.get(selected)!.avgReturn)}` : ""}
              </span>
            )}
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 8 }}>
            {selectedSignals.map((s) => (
              <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, textDecoration: "none", color: "inherit" }}>
                <span style={{ fontWeight: 650 }}>{s.symbol}</span>
                <SignalDirectionBadge direction={s.direction} />
                <SignalStatusBadge status={s.status} />
                <span className="mono">{s.realizedReturn == null ? "—" : fmtPct(s.realizedReturn)}</span>
              </Link>
            ))}
            {!selectedSignals.length && <div style={{ color: "var(--muted)" }}>No signals this day.</div>}
          </div>
        </div>
      )}
      <SignalsDisclaimer />
    </div>
  );
}
