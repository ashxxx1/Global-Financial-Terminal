import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, isDemoMode } from "../../lib/signals/api";
import { marketsForFilter } from "../../lib/signals/assets";
import { computePerformance } from "../../lib/signals/performance";
import { fmtConfidence, fmtPct, sameDay, todayKey, yesterdayKey } from "../../lib/signals/format";
import type { Signal } from "../../lib/signals/types";
import SignalCard from "../../components/signals/SignalCard";
import SignalStatusBadge, {
  DemoBanner,
  SignalsDisclaimer,
  SignalsSubnav,
  SignalDirectionBadge,
} from "../../components/signals/SignalStatusBadge";
import { MetricStrip, SignalFiltersBar } from "../../components/signals/SignalsHomeWidget";

export default function SignalsPage() {
  useSeo({
    title: "GFT Signals — Model Market Forecasts",
    description: "Model-generated market forecasts tracked in public. Every call stays on the record.",
    path: "/terminal/signals",
  });

  const [signals, setSignals] = useState<Signal[]>([]);
  const [market, setMarket] = useState("ALL");
  const [direction, setDirection] = useState("ALL");
  const [sort, setSort] = useState("confidence");
  const [bestWindow, setBestWindow] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    setSignals(bootstrapSignals());
  }, []);

  const metrics = useMemo(() => {
    const day = new Date().toISOString().slice(0, 10);
    const todays = signals.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === day);
    const stats = computePerformance(signals);
    const cutoff = Date.now() - 30 * 86400000;
    const return30d = signals
      .filter((s) => (s.resolvedAt ?? 0) >= cutoff && s.realizedReturn != null)
      .reduce((a, s) => a + (s.realizedReturn ?? 0), 0);
    return {
      todaysCount: todays.length,
      active: signals.filter((s) => s.status === "ACTIVE").length,
      targetsHitToday: todays.filter((s) => s.status === "TARGET_HIT").length,
      winRate: stats.winRate,
      return30d,
      streak: stats.currentStreak,
    };
  }, [signals]);
  const today = todayKey();
  const yday = yesterdayKey();

  const todays = useMemo(() => {
    let list = signals.filter((s) => sameDay(s.createdAt, today));
    const markets = marketsForFilter(market);
    if (markets) list = list.filter((s) => markets.includes(s.market) || (market === "INDICES" && s.assetType === "INDEX") || (market === "EQUITIES" && s.assetType === "EQUITY") || (market === "COMMODITIES" && s.assetType === "COMMODITY") || (market === "FX" && s.assetType === "FX") || (market === "CRYPTO" && s.assetType === "CRYPTO"));
    if (market === "INDICES") list = list.filter((s) => s.assetType === "INDEX");
    if (market === "EQUITIES") list = list.filter((s) => s.assetType === "EQUITY");
    if (direction !== "ALL") list = list.filter((s) => s.direction === direction);
    list = [...list].sort((a, b) => {
      if (sort === "expected") return Math.abs(b.expectedMove) - Math.abs(a.expectedMove);
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "rr") return b.riskReward - a.riskReward;
      return b.confidence - a.confidence;
    });
    return list;
  }, [signals, market, direction, sort, today]);

  const watch = useMemo(
    () => [...signals.filter((s) => sameDay(s.createdAt, today))].sort((a, b) => b.confidence - a.confidence).slice(0, 5),
    [signals, today],
  );

  const yesterday = useMemo(() => signals.filter((s) => sameDay(s.createdAt, yday)), [signals, yday]);
  const yHits = yesterday.filter((s) => s.status === "TARGET_HIT").length;

  const resolved = useMemo(() => signals.filter((s) => s.realizedReturn != null), [signals]);
  const best = useMemo(() => {
    const cutoff = bestWindow === "week" ? Date.now() - 7 * 86400000 : bestWindow === "month" ? Date.now() - 30 * 86400000 : 0;
    return [...resolved]
      .filter((s) => (s.resolvedAt ?? 0) >= cutoff && s.status === "TARGET_HIT")
      .sort((a, b) => (b.realizedReturn ?? 0) - (a.realizedReturn ?? 0))
      .slice(0, 5);
  }, [resolved, bestWindow]);
  const worst = useMemo(() => {
    return [...resolved]
      .filter((s) => s.status === "STOP_HIT")
      .sort((a, b) => (a.realizedReturn ?? 0) - (b.realizedReturn ?? 0))
      .slice(0, 5);
  }, [resolved]);

  const stats = useMemo(() => computePerformance(signals), [signals]);

  return (
    <div className="sig-page" style={{ padding: 18, maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="label" style={{ color: "var(--purple)" }}>TODAY · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: "0.04em" }}>GFT SIGNALS</h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 520 }}>Model-generated market forecasts. Tracked in public.</p>
        </div>
        <DemoBanner demo={isDemoMode()} />
      </div>

      <SignalsSubnav active="today" />

      <MetricStrip
        items={[
          { label: "TODAY'S SIGNALS", value: String(metrics.todaysCount) },
          { label: "ACTIVE", value: String(metrics.active), tone: "var(--gold)" },
          { label: "TARGETS HIT", value: String(metrics.targetsHitToday), tone: "var(--up)" },
          { label: "MODEL WIN RATE", value: metrics.winRate == null ? "—" : `${(metrics.winRate * 100).toFixed(1)}%`, tone: "var(--purple)" },
          { label: "30D RETURN*", value: fmtPct(metrics.return30d), tone: metrics.return30d >= 0 ? "var(--up)" : "var(--down)" },
          { label: "CURRENT STREAK", value: String(metrics.streak) },
        ]}
      />

      <section className="panel" style={{ marginBottom: 16, padding: "14px 16px" }}>
        <div className="label" style={{ marginBottom: 8 }}>GFT DAILY FORECAST · MARKETS TO WATCH</div>
        {watch.length === 0 ? (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>NO HIGH-CONVICTION SIGNALS</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Market conditions do not currently meet GFT&apos;s signal threshold.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {watch.map((s, i) => (
              <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{
                display: "grid", gridTemplateColumns: "28px 1fr auto auto", gap: 12, alignItems: "center",
                padding: "8px 4px", borderBottom: "1px solid var(--line)", color: "inherit", textDecoration: "none",
              }}>
                <span className="mono" style={{ color: "var(--faint)" }}>{i + 1}.</span>
                <span style={{ fontWeight: 700 }}>{s.symbol}</span>
                <SignalDirectionBadge direction={s.direction} />
                <span className="mono" style={{ color: "var(--purple)", fontWeight: 700 }}>{fmtConfidence(s.confidence)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 14, marginBottom: 18 }} className="sig-split">
        <section>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: "0.08em" }}>TODAY&apos;S SIGNALS</h2>
            <span className="label">{todays.length} SHOWN</span>
          </div>
          <SignalFiltersBar market={market} setMarket={setMarket} direction={direction} setDirection={setDirection} sort={sort} setSort={setSort} />
          {todays.length === 0 ? (
            <div className="panel" style={{ padding: 24, color: "var(--muted)" }}>
              No signals match these filters. The model only publishes when conviction clears the threshold.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {todays.map((s) => <SignalCard key={s.id} signal={s} />)}
            </div>
          )}
        </section>

        <aside>
          <div className="panel" style={{ marginBottom: 12 }}>
            <div className="panel-head"><span className="panel-title">YESTERDAY&apos;S CALLS</span></div>
            <div className="panel-body" style={{ display: "grid", gap: 8 }}>
              {yesterday.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>No calls on record for yesterday.</div>}
              {yesterday.slice(0, 6).map((s) => (
                <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, textDecoration: "none", color: "inherit" }}>
                  <span style={{ fontWeight: 650 }}>{s.symbol}</span>
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <SignalStatusBadge status={s.status} />
                    <span className="mono" style={{ fontSize: 12, color: (s.realizedReturn ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
                      {s.realizedReturn == null ? "—" : fmtPct(s.realizedReturn)}
                    </span>
                  </span>
                </Link>
              ))}
              <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{yHits} / {yesterday.length}</div>
                <div className="label">TARGETS HIT · {yesterday.length ? `${((yHits / yesterday.length) * 100).toFixed(0)}% SUCCESS RATE` : "—"}</div>
                <Link to="/terminal/signals/history" className="chip" style={{ marginTop: 10, display: "inline-block", textDecoration: "none" }}>VIEW ALL RESULTS</Link>
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 12 }}>
            <div className="panel-head">
              <span className="panel-title">WHAT WE GOT RIGHT</span>
            </div>
            <div style={{ display: "flex", gap: 4, padding: "0 12px 8px", flexWrap: "wrap" }}>
              {(["week", "month", "all"] as const).map((w) => (
                <button key={w} type="button" className={`chip ${bestWindow === w ? "active" : ""}`} onClick={() => setBestWindow(w)}>
                  {w === "week" ? "BEST THIS WEEK" : w === "month" ? "BEST THIS MONTH" : "BEST ALL TIME"}
                </button>
              ))}
            </div>
            <div className="panel-body" style={{ display: "grid", gap: 8 }}>
              {best.map((s) => (
                <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
                  <span>{s.symbol}</span>
                  <span className="mono" style={{ color: "var(--up)" }}>{fmtPct(s.realizedReturn)}</span>
                </Link>
              ))}
              {!best.length && <div style={{ color: "var(--muted)", fontSize: 13 }}>No target hits in this window yet.</div>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><span className="panel-title">WHAT WE GOT WRONG</span></div>
            <div className="panel-body" style={{ display: "grid", gap: 8 }}>
              {worst.map((s) => (
                <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
                  <span>{s.symbol}</span>
                  <span className="mono" style={{ color: "var(--down)" }}>{fmtPct(s.realizedReturn)}</span>
                </Link>
              ))}
              {!worst.length && <div style={{ color: "var(--muted)", fontSize: 13 }}>No stop hits on record yet.</div>}
            </div>
          </div>
        </aside>
      </div>

      <div className="panel" style={{ padding: 14, marginBottom: 8 }}>
        <div className="label" style={{ marginBottom: 8 }}>RESULT MIX (RESOLVED)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="sig-mix">
          <Mix label="TARGET HIT" value={stats.targetHitRate} color="var(--up)" />
          <Mix label="STOP HIT" value={stats.stopHitRate} color="var(--down)" />
          <Mix label="EXPIRED" value={stats.expiredRate} color="var(--muted)" />
          <Mix label="AMBIGUOUS" value={stats.ambiguousRate} color="var(--blue)" />
        </div>
      </div>

      <SignalsDisclaimer />
      <div className="label" style={{ marginTop: 6 }}>*30D return is hypothetical equal-notional model performance from resolved signals.</div>
    </div>
  );
}

function Mix({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 800, color }}>{value == null ? "—" : `${(value * 100).toFixed(0)}%`}</div>
      <div className="label">{label}</div>
    </div>
  );
}
