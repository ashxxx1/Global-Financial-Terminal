import { useState } from "react";
import { Link } from "react-router-dom";
import type { CompanyImpact, ImpactAnalysis, ScenarioAssumptions } from "../../lib/impact/types";
import { durationLabel } from "../../lib/impact/scenario";

function pct(n: number, d = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(d)}%`;
}

function CompanyBlock({ c }: { c: CompanyImpact }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="imp-co">
      <div className="imp-co-hd">
        <div>
          <p className="imp-co-name">{c.name}</p>
          <div className="imp-meta">
            <Link className="imp-co-tk" to={`/stock/${c.symbol}`}>{c.symbol}</Link>
            {" · "}{c.country || "—"}{" · "}{c.sector}
            {c.lastPrice ? ` · ${c.lastPrice}` : ""}
            {c.changePct != null ? ` (${pct(c.changePct)})` : ""}
            {c.quoteSource === "pending" ? " · SIM" : c.quoteSource === "live" ? " · LIVE" : ""}
          </div>
        </div>
        <span className={`imp-sig ${c.signal}`}>{c.signalLabel}</span>
      </div>
      <p className="imp-body" style={{ marginTop: 8 }}>{c.why}</p>
      <div className="imp-meta" style={{ marginTop: 6 }}>
        Impact {c.impact} · Confidence {c.confidence}% · Horizon {c.timeHorizon}
      </div>
      {c.metrics.length > 0 && (
        <div className="imp-pills" style={{ marginTop: 8 }}>
          {c.metrics.slice(0, 4).map((m) => (
            <span key={m.label} className="imp-pill" title={`${m.source}${m.simulated ? " · simulated" : ""}`}>
              {m.label} {m.value}
            </span>
          ))}
        </div>
      )}
      <p className="imp-meta" style={{ marginTop: 8 }}>Key risk: {c.keyRisk}</p>
      <button type="button" className="imp-whybtn" onClick={() => setOpen((v) => !v)}>
        {open ? "HIDE REASONING" : "SHOW REASONING"}
      </button>
      {open && (
        <div className="imp-trace">
          <ol>
            <li><strong>Event.</strong> {c.reasoning.event}</li>
            <li><strong>Economic mechanism.</strong> {c.reasoning.mechanism}</li>
            <li><strong>Sector exposure.</strong> {c.reasoning.sectorExposure}</li>
            <li><strong>Company exposure.</strong> {c.reasoning.companyExposure}</li>
            <li><strong>Financial data.</strong> {c.reasoning.financialData}</li>
            <li><strong>Historical precedent.</strong> {c.reasoning.historicalPrecedent}</li>
            <li><strong>Valuation.</strong> {c.reasoning.valuation}</li>
            <li><strong>Risks.</strong> {c.reasoning.risks.join(" · ")}</li>
            <li><strong>Confidence.</strong> {c.confidence}% — {c.reasoning.confidenceCalc}</li>
          </ol>
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            {c.evidence.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}
    </article>
  );
}

export function AnalysisView({
  a,
  scenario,
  onScenario,
  onSave,
  onMonitor,
}: {
  a: ImpactAnalysis;
  scenario: ScenarioAssumptions;
  onScenario: (s: ScenarioAssumptions) => void;
  onSave: () => void;
  onMonitor: () => void;
}) {
  const ev = a.extracted;
  return (
    <div className="imp-grid">
      <section className="imp-card">
        <h2 className="imp-h">GFT ANALYSIS</h2>
        <p className="imp-body"><strong>FACT / INFERENCE / VIEW</strong> are labelled on each company card. {a.disclaimer}</p>
        <div className="imp-meta" style={{ marginTop: 8 }}>
          Data as of {new Date(a.asOf).toISOString().replace("T", " ").slice(0, 19)} UTC
        </div>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">EVENT</h2>
        <p className="imp-body">{ev.event}</p>
        <div className="imp-pills" style={{ marginTop: 8 }}>
          {ev.countries.map((c) => <span key={c} className="imp-pill">{c}</span>)}
          {ev.commodities.map((c) => <span key={c} className="imp-pill">{c}</span>)}
          {ev.currencies.map((c) => <span key={c} className="imp-pill">{c}</span>)}
          {ev.macro.map((c) => <span key={c} className="imp-pill">{c}</span>)}
          <span className="imp-pill">{ev.horizon} term</span>
          <span className="imp-pill">{ev.kind}</span>
        </div>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">MARKET MECHANISM</h2>
        <p className="imp-body">{ev.mechanism}</p>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">IMPACT MAP</h2>
        <div className="imp-chain">
          {a.chain.map((s) => (
            <div className="imp-step" key={s.label}>
              <div className="imp-step-lbl">{s.label}</div>
              <div className="imp-body">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">SECTORS</h2>
        <div className="imp-pills">
          {a.sectors.map((s) => (
            <span key={s.name} className={`imp-pill ${s.stance === "positive" ? "pos" : s.stance === "negative" ? "neg" : "mix"}`} title={s.why}>
              {s.stance === "positive" ? "▲" : s.stance === "negative" ? "▼" : "◆"} {s.name}
            </span>
          ))}
          {a.sectors.length === 0 && <span className="imp-meta">No sector map — insufficient mechanism fit.</span>}
        </div>
      </section>

      <div className="imp-cols">
        <section className="imp-card">
          <h2 className="imp-h">POTENTIAL BENEFICIARIES</h2>
          {a.beneficiaries.length === 0 && <p className="imp-meta">No catalog name cleared the mechanism filter on this side.</p>}
          <div className="imp-grid">
            {a.beneficiaries.map((c) => <CompanyBlock key={c.symbol} c={c} />)}
          </div>
        </section>
        <section className="imp-card">
          <h2 className="imp-h">POTENTIAL NEGATIVE IMPACT</h2>
          {a.negatives.length === 0 && <p className="imp-meta">No catalog name cleared the mechanism filter on this side.</p>}
          <div className="imp-grid">
            {a.negatives.map((c) => <CompanyBlock key={c.symbol} c={c} />)}
          </div>
        </section>
      </div>

      <section className="imp-card">
        <h2 className="imp-h">GFT SIGNALS</h2>
        <p className="imp-meta" style={{ marginBottom: 8 }}>Internal mapping POSITIVE / WATCH / NEGATIVE. Not a guarantee, not a broker ticket.</p>
        <div className="imp-pills">
          {[...a.beneficiaries, ...a.negatives].map((c) => (
            <Link key={c.symbol} className={`imp-pill ${c.signal === "POSITIVE" ? "pos" : c.signal === "NEGATIVE" ? "neg" : "mix"}`} to={`/stock/${c.symbol}`}>
              {c.symbol} · {c.signal}
            </Link>
          ))}
        </div>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">HISTORICAL PRECEDENT</h2>
        {a.precedents.length === 0 && <p className="imp-body">No documented analog in the GFT precedent table for this mechanism.</p>}
        {a.precedents.map((p) => (
          <div key={p.date + p.event} style={{ marginBottom: 12 }}>
            <div className="imp-meta">{p.date}</div>
            <p className="imp-body"><strong>{p.event}</strong></p>
            <p className="imp-body">{p.marketReaction}</p>
            <p className="imp-meta">{p.similarity} {p.relevant}</p>
            {p.measuredReturns.map((m) => (
              <div key={m.symbol + m.window} className="imp-meta">
                {m.symbol} {m.window}: {m.pct == null ? "no live candle window" : pct(m.pct, 1)} — {m.note}
              </div>
            ))}
          </div>
        ))}
      </section>

      {a.portfolio && (
        <section className="imp-card">
          <h2 className="imp-h">YOUR PORTFOLIO IMPACT</h2>
          <p className="imp-body">
            {a.portfolio.affected} holding{a.portfolio.affected === 1 ? "" : "s"} potentially affected
            {" · "}Positive exposure {pct(a.portfolio.positiveWeightPct, 0)}
            {" · "}Negative exposure {pct(-Math.abs(a.portfolio.negativeWeightPct), 0)}
          </p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
            {a.portfolio.holdings.map((h) => (
              <li key={h.symbol}>
                <Link to={`/stock/${h.symbol}`}>{h.symbol}</Link> — {h.stance}
                {h.weightPct != null ? ` (${h.weightPct.toFixed(1)}%)` : ""} — {h.why}
              </li>
            ))}
          </ul>
          <p className="imp-meta" style={{ marginTop: 8 }}>{a.portfolio.note}</p>
        </section>
      )}

      <section className="imp-card">
        <h2 className="imp-h">CHANGE SCENARIO</h2>
        <div className="imp-scen">
          <label>
            OIL $
            <input
              type="number"
              min={20}
              max={250}
              step={5}
              value={scenario.oilPrice ?? ""}
              placeholder="—"
              onChange={(e) => onScenario({ ...scenario, oilPrice: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </label>
          <label>
            DURATION
            <select value={scenario.duration} onChange={(e) => onScenario({ ...scenario, duration: e.target.value as ScenarioAssumptions["duration"] })}>
              <option value="3m">3 months</option>
              <option value="1y">1 year</option>
              <option value="2y">2 years</option>
            </select>
          </label>
          <label>
            REGION
            <select value={scenario.region} onChange={(e) => onScenario({ ...scenario, region: e.target.value as ScenarioAssumptions["region"] })}>
              <option value="global">Global</option>
              <option value="IN">India</option>
              <option value="US">US</option>
              <option value="EU">Europe</option>
            </select>
          </label>
          <label>
            RISK
            <select value={scenario.riskLevel} onChange={(e) => onScenario({ ...scenario, riskLevel: e.target.value as ScenarioAssumptions["riskLevel"] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <p className="imp-meta" style={{ marginTop: 8 }}>
          Horizon for this run: {durationLabel(scenario.duration)}. Changing a control re-runs the map.
        </p>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">KEY RISKS</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>
          {a.risks.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <p className="imp-meta" style={{ marginTop: 8 }}>Watch: {a.watch.join(" · ")}</p>
      </section>

      <section className="imp-card">
        <h2 className="imp-h">CONFIDENCE {a.confidence.score}%</h2>
        <div className="imp-confbar"><span className="imp-conffill" style={{ width: `${a.confidence.score}%` }} /></div>
        <p className="imp-body">{a.confidence.explanation}</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--muted)" }}>
          {a.confidence.factors.map((f) => (
            <li key={f.label}>{f.label} {f.delta >= 0 ? "+" : ""}{f.delta} — {f.note}</li>
          ))}
        </ul>
      </section>

      {a.relatedNews.length > 0 && (
        <section className="imp-card imp-news">
          <h2 className="imp-h">RELATED HEADLINES</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>
            {a.relatedNews.map((n) => (
              <li key={n.url + n.title}>
                {n.url ? <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a> : n.title}
                <span className="imp-meta"> — {n.source}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="imp-card">
        <h2 className="imp-h">SOURCES</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5, color: "var(--muted)" }}>
          {a.sources.map((s) => (
            <li key={s.label}>{s.label}: {s.detail}</li>
          ))}
        </ul>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--faint)" }}>
          {a.caveats.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </section>

      <div className="imp-actions">
        <button type="button" className="imp-btn" onClick={onSave}>SAVE ANALYSIS</button>
        <button type="button" className="imp-btn" onClick={onMonitor}>MONITOR THIS THESIS</button>
      </div>
    </div>
  );
}
