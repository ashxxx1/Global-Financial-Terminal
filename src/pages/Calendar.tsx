import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTerminal } from "../store";
import { metaFor } from "../lib/market";
import { getEconCalendar, colorForEconKind, type EconCalendarEvent } from "../data/econCalendar";
import { getCapability } from "../lib/research/providers";
import { useSeo } from "../lib/seo";

/**
 * Economic and earnings calendar — growth-plan item 76.
 *
 * The globe already pinned macro events; what was missing was somewhere to read
 * them in order, and real earnings dates.
 *
 * The two sources are kept visually and textually distinct on purpose. The
 * earnings dates are real, published, and carry the consensus estimate for the
 * print. The macro schedule is a rolled-forward seed, because a licensed
 * macro-calendar feed is not something we have — and a projected central-bank
 * date sitting unlabelled next to a confirmed earnings date would be exactly
 * the kind of quiet blending this product refuses to do.
 */

interface CalRow {
  date: string;
  symbol: string;
  name: string;
  quarter: string;
  epsEstimate: number | null;
  held: boolean;
  watched: boolean;
}

interface EarningsCalendarEntry {
  symbol: string; date: string; quarter?: number; year?: number; epsEstimate?: number | null;
}

export default function Calendar() {
  const navigate = useNavigate();
  const watchlist = useTerminal((s) => s.watchlist);
  const positions = useTerminal((s) => s.positions);

  useSeo({
    title: "Economic & earnings calendar",
    description: "Upcoming earnings dates with consensus estimates, plus the macro events that move markets — filtered to what you actually hold.",
    path: "/calendar",
  });

  const [rows, setRows] = useState<CalRow[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(true);
  const macro = useMemo(() => getEconCalendar(), []);

  const mine = useMemo(() => {
    const s = new Set<string>();
    for (const w of watchlist) s.add(w.symbol);
    for (const p of positions) s.add(p.symbol);
    return s;
  }, [watchlist, positions]);

  useEffect(() => {
    let live = true;
    void (async () => {
      const res = await getCapability<{ earningsCalendar?: EarningsCalendarEntry[] }>("upcoming-earnings", "AAPL");
      if (!live) return;
      if (!res.ok) { setFailed(res.reason); setRows([]); return; }
      const all = res.data.earningsCalendar ?? [];
      setRows(
        all
          // Only companies the terminal actually tracks — a calendar full of
          // tickers with no page behind them is noise.
          .filter((e) => metaFor(e.symbol))
          .map((e) => ({
            date: e.date,
            symbol: e.symbol,
            name: metaFor(e.symbol)?.name || e.symbol,
            quarter: e.quarter && e.year ? `Q${e.quarter} ${e.year}` : "",
            epsEstimate: typeof e.epsEstimate === "number" ? e.epsEstimate : null,
            held: positions.some((p) => p.symbol === e.symbol),
            watched: mine.has(e.symbol),
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      );
    })();
    return () => { live = false; };
  }, [mine, positions]);

  const shown = useMemo(
    () => (rows ?? []).filter((r) => (onlyMine ? r.watched : true)),
    [rows, onlyMine],
  );

  const byDate = useMemo(() => {
    const m = new Map<string, CalRow[]>();
    for (const r of shown) {
      if (!m.has(r.date)) m.set(r.date, []);
      m.get(r.date)!.push(r);
    }
    return [...m.entries()];
  }, [shown]);

  const upcomingMacro = useMemo(
    () => macro.filter((e) => e.time >= Date.now() - 864e5).sort((a, b) => a.time - b.time).slice(0, 14),
    [macro],
  );

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Calendar</h1>
        <span className="label" style={{ color: "var(--faint)" }}>next 45 days</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button className={`chip ${onlyMine ? "active" : ""}`} onClick={() => setOnlyMine(true)}>MINE</button>
          <button className={`chip ${!onlyMine ? "active" : ""}`} onClick={() => setOnlyMine(false)}>ALL TRACKED</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "start" }}>
        <section className="panel" style={{ overflow: "hidden" }}>
          <div className="panel-head">
            <span className="panel-title">Scheduled earnings</span>
            <span className="label" style={{ color: "var(--faint)" }}>{shown.length}</span>
          </div>
          <div style={{ padding: "6px 12px 12px" }}>
            <p className="cal-src">
              Published earnings dates with the consensus EPS estimate for the print,
              where one has been set. Real, not projected.
            </p>
            {rows === null && <p className="cal-none">Loading…</p>}
            {failed && (
              <p className="cal-none">
                The earnings calendar could not be retrieved ({failed}). Nothing is shown
                rather than a guess at when companies might report.
              </p>
            )}
            {rows !== null && !failed && shown.length === 0 && (
              <p className="cal-none">
                {onlyMine
                  ? "None of the companies you watch or hold report in the next 45 days. Switch to ALL TRACKED to see the rest."
                  : "No scheduled prints in the next 45 days for companies we track."}
              </p>
            )}
            {byDate.map(([date, group]) => (
              <div key={date} className="cal-day">
                <div className="cal-date">{new Date(date).toUTCString().slice(0, 11)}</div>
                {group.map((r) => (
                  <button key={r.symbol + date} className="cal-row" onClick={() => navigate(`/research/${r.symbol}`)}>
                    <span className="cal-sym">{r.symbol}</span>
                    <span className="cal-name">{r.name}</span>
                    {r.held && <span className="cal-tag held">HELD</span>}
                    {!r.held && r.watched && <span className="cal-tag">WATCHED</span>}
                    <span className="cal-est">
                      {r.epsEstimate === null ? "no estimate" : `est. ${r.epsEstimate.toFixed(2)}`}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="panel" style={{ overflow: "hidden" }}>
          <div className="panel-head"><span className="panel-title">Macro schedule</span></div>
          <div style={{ padding: "6px 12px 12px" }}>
            <p className="cal-src warn">
              CPI and nonfarm payrolls follow the official BLS, ONS and Eurostat
              2026 calendars. Other entries are published central-bank or earnings
              schedules, not a live licensed feed — confirm the source before acting.
            </p>
            {upcomingMacro.map((e: EconCalendarEvent) => (
              <div key={e.id} className="cal-macro">
                <span className="cal-macro-date">{new Date(e.time).toUTCString().slice(0, 11)}</span>
                <span className="cal-macro-dot" style={{ background: colorForEconKind(e.kind) }} />
                <span className="cal-macro-title">{e.title}</span>
                <span className="cal-macro-country">{e.country}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
