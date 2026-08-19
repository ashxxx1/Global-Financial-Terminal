import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTerminal } from "../store";
import { subscribe, metaFor, allStockSymbols } from "../lib/market";
import { valuePortfolio, parseHoldingsCsv } from "../lib/portfolio/compute";
import { ensureRates, PEGGED, ratesAsOf } from "../lib/fxRates";
import { useSeo } from "../lib/seo";

/**
 * Portfolio — growth-plan items 73 and 74.
 *
 * Manual entry and CSV only. Brokerage integration would mean handling
 * regulated credentials, which is not something to bolt on.
 *
 * The design commitment is that the total is honest: positions we cannot price
 * or cannot convert to USD are excluded from it and named on screen, rather
 * than quietly dropped to make the headline number look complete.
 */
export default function Portfolio() {
  const navigate = useNavigate();
  const positions = useTerminal((s) => s.positions);
  const addPosition = useTerminal((s) => s.addPosition);
  const removePosition = useTerminal((s) => s.removePosition);
  const importPositions = useTerminal((s) => s.importPositions);

  useSeo({
    title: "Portfolio — track holdings across every market",
    description: "Track holdings across 68 markets with live prices, P&L in local currency and USD, and allocation by country and sector.",
    path: "/portfolio",
  });

  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  useEffect(() => { void ensureRates().then(() => setTick((t) => t + 1)); }, []);

  const summary = useMemo(() => valuePortfolio(positions), [positions]);

  /**
   * Import feedback lives here, not in AddPanel. The first import flips the page
   * out of its empty state, which unmounts that AddPanel and took the "2 lines
   * skipped" message with it — losing the warning at the one moment it mattered.
   */
  const [feedback, setFeedback] = useState<{ msg: string; errors: string[] } | null>(null);

  const money = (n: number) =>
    `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const pctText = (n: number | null) => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`);
  const tone = (n: number | null) => (n === null ? "var(--muted)" : n >= 0 ? "var(--up)" : "var(--down)");

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Portfolio</h1>
        <span className="label" style={{ color: "var(--faint)" }}>
          {positions.length} holding{positions.length === 1 ? "" : "s"}
          {summary.includedCount > 0 && ` · ${summary.liveCount}/${summary.includedCount} on live prices`}
        </span>
      </div>

      {positions.length === 0 ? (
        <EmptyState onAdd={addPosition} onImport={importPositions} feedback={feedback} setFeedback={setFeedback} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 16 }}>
            <Tile label="TOTAL VALUE" value={money(summary.totalUsd)} sub={`${summary.includedCount} of ${positions.length} priced`} />
            <Tile label="TOTAL P&L" value={money(summary.totalPnlUsd)} sub={pctText(summary.totalPnlPct)} color={tone(summary.totalPnlUsd)} />
            <Tile label="TODAY" value={money(summary.dayPnlUsd)} sub="from today's moves" color={tone(summary.dayPnlUsd)} />
            <Tile label="COST BASIS" value={money(summary.totalCostUsd)} sub="what you paid" />
          </div>

          {summary.excluded.length > 0 && (
            <div className="pf-excluded">
              <b>Not in the total above.</b>{" "}
              {summary.excluded.map((e, i) => (
                <span key={e.symbol + i}>
                  {i > 0 && ", "}
                  {e.symbol}{" "}
                  <span style={{ color: "var(--faint)" }}>
                    ({e.reason === "no-price" ? "no price available" : `no USD rate for ${e.currency}`})
                  </span>
                </span>
              ))}
              . These are excluded rather than dropped silently — a total that
              omits holdings without saying so is worse than one that names them.
            </div>
          )}

          <div className="panel" style={{ overflow: "hidden", marginBottom: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Symbol</th><th className="num">Shares</th><th className="num">Cost</th>
                    <th className="num">Price</th><th className="num">Value</th>
                    <th className="num">P&L</th><th className="num">Today</th><th />
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r) => (
                    <tr key={r.position.id}>
                      <td>
                        <button className="pf-sym" onClick={() => navigate(`/stock/${r.position.symbol}`)}>
                          {r.position.symbol}
                        </button>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {r.position.name}
                          {!r.live && r.price !== null && <span className="pf-sim">SIM</span>}
                        </div>
                      </td>
                      <td className="num">{r.position.shares}</td>
                      <td className="num">{r.position.currency}{r.position.costPerShare.toFixed(2)}</td>
                      <td className="num">{r.price === null ? "—" : `${r.position.currency}${r.price.toFixed(2)}`}</td>
                      <td className="num">{r.usdValue === null ? "—" : money(r.usdValue)}</td>
                      <td className="num" style={{ color: tone(r.pnl) }}>
                        {r.pnl === null ? "—" : pctText(r.pnlPct)}
                      </td>
                      <td className="num" style={{ color: tone(r.dayChangePct) }}>{pctText(r.dayChangePct)}</td>
                      <td className="num">
                        <button className="chip" onClick={() => removePosition(r.position.id)} aria-label={`Remove ${r.position.symbol}`}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 16 }}>
            <Allocation title="By country" rows={summary.byCountry} total={summary.totalUsd} />
            <Allocation title="By sector" rows={summary.bySector} total={summary.totalUsd} />
          </div>

          <FxNote />
          <AddPanel onAdd={addPosition} onImport={importPositions} feedback={feedback} setFeedback={setFeedback} />
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="panel" style={{ padding: "12px 14px" }}>
      <div className="label" style={{ color: "var(--faint)", fontSize: 9.5 }}>{label}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 21, fontWeight: 700, color: color ?? "var(--text)", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Allocation({ title, rows, total }: { title: string; rows: { key: string; usd: number }[]; total: number }) {
  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-head"><span className="panel-title">{title}</span></div>
      <div style={{ padding: "8px 12px 12px" }}>
        {rows.slice(0, 8).map((r) => {
          const pct = total > 0 ? (r.usd / total) * 100 : 0;
          return (
            <div key={r.key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span>{r.key}</span>
                <span className="mono" style={{ color: "var(--muted)" }}>{pct.toFixed(0)}%</span>
              </div>
              <div className="pf-bar"><span style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>Nothing priced yet.</div>}
      </div>
    </div>
  );
}

/** States exactly how each currency was converted — pegs are not live quotes. */
function FxNote() {
  const at = ratesAsOf();
  return (
    <p className="pf-note">
      Totals are converted to USD with ECB reference rates
      {at ? `, last loaded ${new Date(at).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}.
      {" "}{Object.keys(PEGGED).join(", ")} use their central banks' fixed pegs
      ({Object.entries(PEGGED).map(([k, v]) => `${k} ${v.rate} since ${v.since}`).join("; ")}) — those are
      administered rates, not live quotes. Currencies with neither are excluded and listed above.
      Nothing here is investment advice.
    </p>
  );
}

type Feedback = { msg: string; errors: string[] } | null;

function EmptyState({ onAdd, onImport, feedback, setFeedback }: {
  onAdd: ReturnType<typeof useTerminal.getState>["addPosition"];
  onImport: ReturnType<typeof useTerminal.getState>["importPositions"];
  feedback: Feedback;
  setFeedback: (f: Feedback) => void;
}) {
  return (
    <div className="panel" style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 16 }}>Track what you actually own</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 560 }}>
        Add holdings by hand or paste a CSV from your broker. Prices come from the
        same feeds as the rest of the terminal — live where we have them, labelled
        where we do not. We never ask for brokerage credentials.
      </p>
      <AddPanel onAdd={onAdd} onImport={onImport} feedback={feedback} setFeedback={setFeedback} />
    </div>
  );
}

function AddPanel({ onAdd, onImport, feedback, setFeedback }: {
  onAdd: ReturnType<typeof useTerminal.getState>["addPosition"];
  onImport: ReturnType<typeof useTerminal.getState>["importPositions"];
  feedback: Feedback;
  setFeedback: (f: Feedback) => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const msg = feedback?.msg ?? null;
  const errors = feedback?.errors ?? [];

  const suggestions = useMemo(() => {
    const q = symbol.trim().toUpperCase();
    if (q.length < 1) return [];
    return allStockSymbols().filter((s) => s.startsWith(q)).slice(0, 6);
  }, [symbol]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const sym = symbol.trim().toUpperCase();
    const meta = metaFor(sym);
    if (!meta) { setFeedback({ msg: `We do not track ${sym || "that symbol"}.`, errors: [] }); return; }
    const n = Number(shares), c = Number(cost);
    if (!Number.isFinite(n) || n <= 0) { setFeedback({ msg: "Share count must be a positive number.", errors: [] }); return; }
    onAdd({
      symbol: sym, name: meta.name, country: meta.country,
      shares: n, costPerShare: Number.isFinite(c) ? c : 0, currency: meta.currency,
    });
    setSymbol(""); setShares(""); setCost("");
    setFeedback({ msg: `Added ${n} ${sym}.`, errors: [] });
  };

  const onFile = async (f: File) => {
    setFeedback(null);
    const text = await f.text();
    const { rows, errors: errs } = parseHoldingsCsv(text);
    const made = rows.map((r) => {
      const m = metaFor(r.symbol)!;
      return { symbol: r.symbol, name: m.name, country: m.country, shares: r.shares, costPerShare: r.costPerShare, currency: m.currency };
    });
    const n = made.length ? onImport(made) : 0;
    setFeedback({
      msg: `Imported ${n} holding${n === 1 ? "" : "s"}${errs.length ? `, ${errs.length} line${errs.length === 1 ? "" : "s"} skipped` : ""}.`,
      errors: errs,
    });
  };

  return (
    <div className="pf-add">
      <form onSubmit={submit} className="pf-form">
        <label className="pf-field">
          <span>Symbol</span>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL" list="pf-syms" />
          <datalist id="pf-syms">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
        <label className="pf-field">
          <span>Shares</span>
          <input value={shares} onChange={(e) => setShares(e.target.value)} placeholder="10" inputMode="decimal" />
        </label>
        <label className="pf-field">
          <span>Cost per share</span>
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="150.00" inputMode="decimal" />
        </label>
        <button className="chip" type="submit">ADD HOLDING</button>
        <button className="chip" type="button" onClick={() => fileRef.current?.click()}>IMPORT CSV</button>
        <input
          ref={fileRef} type="file" accept=".csv,text/csv" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }}
        />
      </form>
      {msg && <p className="pf-msg">{msg}</p>}
      {errors.length > 0 && (
        <ul className="pf-errors">
          {errors.slice(0, 6).map((x, i) => <li key={i}>{x}</li>)}
          {errors.length > 6 && <li>…and {errors.length - 6} more.</li>}
        </ul>
      )}
      <p className="pf-hint">
        CSV needs a symbol and a share count; a cost column is used when present.
        Column order does not matter if the header names them.
      </p>
    </div>
  );
}
