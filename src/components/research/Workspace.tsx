import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { openWorkspace, buildSection, SECTIONS, type Workspace as Ws, type Section, type SectionId } from "../../lib/research/workspace";
import { TIER_MEANING, overallConfidence, type Claim } from "../../lib/research";
import { gapSentence, type ResearchGap } from "../../lib/research/gaps";
import type { TimelineEvent } from "../../lib/research/analyzers/timeline";
import { metaFor } from "../../lib/market";
import { useTerminal } from "../../store";
import { portfolioImpact, type PortfolioImpact } from "../../lib/research/portfolioImpact";
import { explainMove, type MoveExplanation } from "../../lib/research/analyzers/explainMove";
import type { ScoreDimension } from "../../lib/research/scorecard";
import { useSeo } from "../../lib/seo";

/**
 * The research workspace.
 *
 * Laid out as a terminal surface rather than a chat: a fixed section rail, one
 * dense working column, and the timeline always visible beside it. The sections
 * are views over a single company context, so switching between them costs
 * nothing and they cannot disagree with each other.
 *
 * Auditability drives the visual hierarchy. Every claim carries its tier inline
 * and opens to its full evidence — source, metric key, raw value, formula,
 * timestamp — because a research tool nobody can check is a rumour with better
 * typography.
 */
export default function ResearchWorkspace() {
  const { symbol = "" } = useParams();
  const navigate = useNavigate();
  const sym = symbol.toUpperCase();
  const meta = metaFor(sym);

  const [ws, setWs] = useState<Ws | null>(null);
  const [active, setActive] = useState<SectionId>("moving");
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [loading, setLoading] = useState(true);
  const [sectionError, setSectionError] = useState<Record<string, string>>({});
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [move, setMove] = useState<MoveExplanation | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);
  const positions = useTerminal((s) => s.positions);

  /** All computed in the engine; this component only renders the result. */
  const impact = useMemo<PortfolioImpact | null>(
    () => (ws ? portfolioImpact(ws.ctx, positions, ws.scorecard) : null),
    [ws, positions],
  );

  useSeo({
    title: `${meta?.name || sym} — research workspace`,
    description: `Evidence-backed research on ${meta?.name || sym}: what moved it, what changed, valuation in historical context, peers, filings and insider activity.`,
    path: `/research/${sym}`,
  });

  useEffect(() => {
    let live = true;
    setLoading(true); setWs(null); setSections({}); setSectionError({}); setSectionLoading({});
    void openWorkspace(sym).then((w) => { if (live) { setWs(w); setLoading(false); } });
    return () => { live = false; };
  }, [sym]);

  const load = useCallback(async (w: Ws, id: SectionId) => {
    if (sections[id] || sectionLoading[id]) return;
    setSectionLoading((p) => ({ ...p, [id]: true }));
    try {
      const s = await buildSection(w, id);
      setSections((prev) => ({ ...prev, [id]: s }));
    } catch (e) {
      setSectionError((p) => ({
        ...p,
        [id]: e instanceof Error ? e.message : "Failed to load this section.",
      }));
    } finally {
      setSectionLoading((p) => ({ ...p, [id]: false }));
    }
  }, [sections, sectionLoading]);

  useEffect(() => { if (ws) void load(ws, active); }, [ws, active, load]);

  const section = sections[active];
  const freshness = useMemo(() => {
    if (!ws) return "";
    const mins = Math.round(ws.freshness.oldestMs / 60000);
    return mins < 1 ? "fetched just now" : `oldest evidence ${mins} min old`;
  }, [ws]);

  if (!meta) {
    return (
      <div className="rw-empty">
        <h1>Unknown symbol</h1>
        <p>We do not track “{sym}”. Search for a company to open its research workspace.</p>
      </div>
    );
  }

  return (
    <div className="rw">
      <header className="rw-head">
        <div className="rw-id">
          <button className="rw-back" onClick={() => navigate(`/stock/${sym}`)}>← {sym}</button>
          <h1>{meta.name}</h1>
          <span className="rw-meta">{meta.sector} · {meta.country}</span>
        </div>
        <div className="rw-fresh">
          {ws?.freshness.anyStale && <span className="rw-stale">STALE</span>}
          <span>{freshness}</span>
          {ws && <span className="rw-at">built {new Date(ws.freshness.builtAt).toISOString().slice(11, 16)} UTC</span>}
        </div>
      </header>

      {ws && (
        <>
          <section className="rw-scorecard" aria-label="Research scorecard">
            {ws.scorecard.map((d) => <ScoreCell key={d.id} dim={d} />)}
          </section>
          <div className="rw-scorenote">
            {ws.coverageOfScorecard.scored} of {ws.coverageOfScorecard.total} dimensions scored from available evidence.
            Scores describe what the data says about the company — they are not a view on the shares, and there is
            deliberately no combined rating.
            <button className="rw-cov-btn" onClick={() => setShowCoverage((v) => !v)} aria-expanded={showCoverage}>
              {showCoverage ? "HIDE DATA COVERAGE" : "DATA COVERAGE"}
            </button>
          </div>
          {showCoverage && (
            <section className="rw-coverage" aria-label="Data coverage">
              {ws.coverage.map((c) => (
                <div key={c.label} className={`rw-cov ${c.available ? "yes" : "no"}`}>
                  <span className="rw-cov-mark">{c.available ? "✓" : "—"}</span>
                  <span className="rw-cov-label">{c.label}</span>
                  <span className="rw-cov-detail">
                    {c.detail}{c.cadence ? ` · ${c.cadence}` : ""}{c.period ? ` · period ${c.period.slice(0, 10)}` : ""}
                  </span>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <div className="rw-body">
        <nav className="rw-rail" aria-label="Research sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`rw-tab ${active === s.id ? "on" : ""}`}
              aria-pressed={active === s.id}
              onClick={() => setActive(s.id)}
              title={s.blurb}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main className="rw-main">
          {loading && <div className="rw-loading">Retrieving and checking sources…</div>}
          {!loading && sectionLoading[active] && <div className="rw-loading">Loading section…</div>}
          {!loading && sectionError[active] && <div className="rw-loading" style={{ color: "var(--down)" }}>{sectionError[active]}</div>}
          {!loading && section && (
            <>
              <p className="rw-blurb">{SECTIONS.find((s) => s.id === active)?.blurb}</p>
              {section.claims.length > 0 && (
                <div className="rw-conf">
                  <span className="rw-conf-label">CONFIDENCE</span>
                  <span className="rw-conf-bar"><span style={{ width: `${Math.round(overallConfidence(section.claims) * 100)}%` }} /></span>
                  <span className="rw-conf-val">{Math.round(overallConfidence(section.claims) * 100)}%</span>
                  <span className="rw-conf-note">weakest claim, not the average</span>
                </div>
              )}
              <ol className="rw-claims">
                {section.claims.map((c, i) => <ClaimRow key={i} claim={c} />)}
              </ol>
              {section.rows && section.rows.length > 0 && (
                <table className="rw-rows">
                  <tbody>
                    {section.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="rw-row-primary">
                          {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.primary}</a> : r.primary}
                        </td>
                        <td className="rw-row-secondary">{r.secondary}</td>
                        <td className="rw-row-meta">{r.meta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {section.claims.length === 0 && (!section.rows || section.rows.length === 0) && (
                <p className="rw-none">Nothing to show — the data behind this section was unavailable.</p>
              )}
              {section.gaps.length > 0 && <Gaps gaps={section.gaps} />}
              {active === "moving" && ws && ws.unusual.length === 0 && (
                <section className="rw-unusual">
                  <div className="rw-calc-h">UNUSUAL MOVES</div>
                  <p className="rw-none">
                    No session in the last year moved more than two standard deviations from
                    this stock&rsquo;s own daily range. A quiet year is a finding; it is not a
                    missing feature.
                  </p>
                </section>
              )}
              {active === "moving" && ws && ws.unusual.length > 0 && (
                <section className="rw-unusual">
                  <div className="rw-calc-h">UNUSUAL MOVES — CLICK TO EXPLAIN</div>
                  <div className="rw-unusual-row">
                    {ws.unusual.map((u) => (
                      <button
                        key={u.at}
                        className="rw-unusual-chip"
                        onClick={() => setMove(explainMove(ws.ctx, ws.timeline, u.at, u.movePct, u.sigma))}
                      >
                        <span>{new Date(u.at).toISOString().slice(5, 10)}</span>
                        <b style={{ color: u.movePct >= 0 ? "var(--up)" : "var(--down)" }}>
                          {u.movePct >= 0 ? "+" : ""}{u.movePct.toFixed(1)}%
                        </b>
                        <em>{Math.abs(u.sigma).toFixed(1)}σ</em>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {ws && <ThesisBlock thesis={ws.thesis} />}
              {impact && <PortfolioBlock impact={impact} symbol={ctx0(ws)} />}
            </>
          )}
        </main>

        <aside className="rw-timeline" aria-label="Company timeline">
          <div className="rw-tl-head">TIMELINE</div>
          {ws?.timeline.map((e) => (
            <button
              key={e.id}
              className={`rw-tl-item k-${e.kind} ${selected?.id === e.id ? "on" : ""}`}
              onClick={() => setSelected(selected?.id === e.id ? null : e)}
            >
              <span className="rw-tl-date">{new Date(e.at).toISOString().slice(0, 10)}</span>
              <span className="rw-tl-title">{e.title}</span>
              {e.reaction?.dayPct != null && (
                <span className="rw-tl-react" style={{ color: e.reaction.dayPct >= 0 ? "var(--up)" : "var(--down)" }}>
                  {e.reaction.dayPct >= 0 ? "+" : ""}{e.reaction.dayPct.toFixed(1)}%
                </span>
              )}
            </button>
          ))}
          {ws && ws.timeline.length === 0 && <p className="rw-none">No dated events available.</p>}
        </aside>
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
      {move && <MoveDetail explanation={move} onClose={() => setMove(null)} />}
    </div>
  );
}

function ClaimRow({ claim }: { claim: Claim }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rw-claim ${open ? "open" : ""}`}>
      <button className="rw-claim-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className={`rw-tier t-${claim.tier.toLowerCase()}`}>{claim.tier}</span>
        <span className="rw-claim-text">{claim.text}</span>
        <span className="rw-claim-conf">{Math.round(claim.confidence * 100)}%</span>
      </button>
      {open && (
        <div className="rw-evidence">
          <div className="rw-ev-line"><b>{claim.tier}</b> — {TIER_MEANING[claim.tier]}</div>
          <div className="rw-ev-line"><b>How this was reached</b> — {claim.why}</div>
          {claim.calculation && (
            <div className="rw-calc">
              <div className="rw-calc-h">INPUTS</div>
              <table>
                <tbody>
                  {claim.calculation.inputs.map((inp, i) => (
                    <tr key={i}>
                      <td>{inp.label}{inp.metricKey && <code>{inp.metricKey}</code>}</td>
                      <td className="num">{inp.value.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rw-calc-expr">{claim.calculation.expression}</div>
              <div className="rw-calc-res">
                = {claim.calculation.result.toFixed(2)} {claim.calculation.unit}
                {claim.calculation.n !== undefined && <em>n = {claim.calculation.n}</em>}
              </div>
            </div>
          )}
          <div className="rw-calc-h">SOURCES</div>
          <ul className="rw-sources">
            {claim.sources.map((s, i) => (
              <li key={i}>
                <span className="rw-src-label">{s.label}</span>
                {s.metricKey && <code>{s.metricKey}</code>}
                {s.unpriced && <span className="rw-sim">NO PRICE</span>}
                <span className="rw-src-detail">{s.detail}</span>
                <span className="rw-src-time">
                  {new Date(s.asOf).toISOString().replace("T", " ").slice(0, 16)} UTC
                  {s.capability && <> · {s.capability}</>}
                </span>
                {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer">source ↗</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function Gaps({ gaps }: { gaps: ResearchGap[] }) {
  return (
    <section className="rw-gaps">
      <div className="rw-gaps-h">RESEARCH GAPS — {gaps.length}</div>
      {gaps.map((g) => (
        <div key={g.capability} className={`rw-gap sev-${g.severity}`}>
          <div className="rw-gap-missing">{g.missing}</div>
          <div className="rw-gap-blocks"><b>Cannot determine:</b> {g.blocks}.</div>
          {g.instead ? (
            <div className="rw-gap-instead">
              <b>Available instead:</b> {g.instead.label} — {g.instead.difference}
            </div>
          ) : (
            <div className="rw-gap-instead">No alternative available.</div>
          )}
        </div>
      ))}
    </section>
  );
}

function EventDetail({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  return (
    <div className="rw-event" role="dialog" aria-label={event.title}>
      <div className="rw-event-head">
        <div>
          <div className="rw-event-kind">{event.kind.toUpperCase()} · {new Date(event.at).toISOString().slice(0, 10)}</div>
          <h2>{event.title}</h2>
        </div>
        <button className="fb-x" onClick={onClose} aria-label="Close event">×</button>
      </div>
      <p className="rw-event-detail">{event.detail}</p>

      {event.reaction ? (
        <div className="rw-react">
          <div className="rw-calc-h">MARKET REACTION</div>
          <div className="rw-react-row">
            <span>On the day</span>
            <b style={{ color: (event.reaction.dayPct ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
              {event.reaction.dayPct === null ? "—" : `${event.reaction.dayPct >= 0 ? "+" : ""}${event.reaction.dayPct.toFixed(2)}%`}
            </b>
          </div>
          <div className="rw-react-row">
            <span>Following week</span>
            <b style={{ color: (event.reaction.weekPct ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
              {event.reaction.weekPct === null ? "—" : `${event.reaction.weekPct >= 0 ? "+" : ""}${event.reaction.weekPct.toFixed(2)}%`}
            </b>
          </div>
          <p className="rw-react-basis">
            {event.reaction.basis} This is a FACT about the price. Whether the event
            caused the move is not something this data can establish.
          </p>
        </div>
      ) : (
        <p className="rw-react-basis">No price history around this date, so no reaction can be measured.</p>
      )}

      <div className="rw-calc-h">EVIDENCE</div>
      <ul className="rw-sources">
        {event.sources.map((s, i) => (
          <li key={i}>
            <span className="rw-src-label">{s.label}</span>
            <span className="rw-src-detail">{s.detail}</span>
            <span className="rw-src-time">{new Date(s.asOf).toISOString().slice(0, 10)}{s.capability && ` · ${s.capability}`}</span>
            {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer">source ↗</a>}
          </li>
        ))}
      </ul>
      {event.url && <a className="rw-event-link" href={event.url} target="_blank" rel="noopener noreferrer">Open original ↗</a>}
    </div>
  );
}


/** Symbol accessor kept tiny so the JSX above stays readable. */
function ctx0(ws: Ws | null): string { return ws?.ctx.symbol ?? ""; }

function ScoreCell({ dim }: { dim: ScoreDimension }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rw-score b-${dim.band}`}>
      <button className="rw-score-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="rw-score-label">{dim.label}</span>
        <span className="rw-score-val">{dim.score === null ? "—" : (dim.score > 0 ? "+" : "") + dim.score.toFixed(1)}</span>
        <span className="rw-score-band">{dim.band}</span>
      </button>
      {open && (
        <div className="rw-score-detail">
          <p>{dim.missing ?? dim.basis}</p>
          <div className="rw-score-meta">
            {Math.round(dim.confidence * 100)}% confidence · {dim.cadence.replace("-", " ")}
            {dim.period && <> · period {dim.period.slice(0, 10)}</>}
            {" "}· fetched {new Date(dim.asOf).toISOString().slice(11, 16)} UTC
          </div>
          {dim.sources.map((s, i) => (
            <div key={i} className="rw-score-src">{s.label}: {s.detail}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThesisBlock({ thesis }: { thesis: { bull: { dimension: string; text: string }[]; bear: { dimension: string; text: string }[]; falsifiers: { target: string; test: string; basis: string }[]; note?: string } }) {
  return (
    <section className="rw-thesis">
      <div className="rw-thesis-cols">
        <div>
          <div className="rw-calc-h">STRONGEST POSITIVE EVIDENCE</div>
          {thesis.bull.length === 0 && <p className="rw-none">Nothing measurable points this way.</p>}
          {thesis.bull.map((p, i) => <p key={i} className="rw-thesis-pt"><b>{p.dimension}</b> — {p.text}</p>)}
        </div>
        <div>
          <div className="rw-calc-h">STRONGEST NEGATIVE EVIDENCE</div>
          {thesis.bear.length === 0 && <p className="rw-none">Nothing measurable points this way.</p>}
          {thesis.bear.map((p, i) => <p key={i} className="rw-thesis-pt"><b>{p.dimension}</b> — {p.text}</p>)}
        </div>
      </div>
      {thesis.note && <p className="rw-none">{thesis.note}</p>}
      {thesis.falsifiers.length > 0 && (
        <div className="rw-falsify">
          <div className="rw-calc-h">WHAT WOULD CHANGE THIS</div>
          {thesis.falsifiers.map((f, i) => (
            <p key={i} className="rw-thesis-pt"><b>{f.target}</b> — {f.test} <em>{f.basis}</em></p>
          ))}
        </div>
      )}
    </section>
  );
}

function PortfolioBlock({ impact, symbol }: { impact: PortfolioImpact; symbol: string }) {
  if (impact.portfolioUsd <= 0) {
    return (
      <section className="rw-portfolio">
        <div className="rw-calc-h">YOUR PORTFOLIO</div>
        <p className="rw-none">No holdings tracked yet — add positions and this research gets placed against what you own.</p>
      </section>
    );
  }
  return (
    <section className="rw-portfolio">
      <div className="rw-calc-h">HOW THIS SITS IN YOUR PORTFOLIO</div>
      <div className="rw-pf-grid">
        <div><span>{symbol} weight</span><b>{impact.weightPct === null ? "not held" : `${impact.weightPct.toFixed(1)}%`}</b></div>
        {impact.sectorExposurePct !== null && (
          <div><span>{impact.sectorLabel} exposure</span><b>{impact.sectorExposurePct.toFixed(0)}%</b></div>
        )}
        {impact.drawdown && (
          <div>
            <span>Worst 21-session fall</span>
            <b style={{ color: "var(--down)" }}>{impact.drawdown.worstMonthPct.toFixed(1)}%</b>
          </div>
        )}
        {impact.drawdown && (
          <div>
            <span>Would have cost the portfolio</span>
            <b style={{ color: "var(--down)" }}>{impact.drawdown.portfolioHitPct.toFixed(2)}%</b>
          </div>
        )}
      </div>
      {impact.correlated.filter((c) => c.correlation !== null).length > 0 && (
        <table className="rw-rows">
          <tbody>
            {impact.correlated.filter((c) => c.correlation !== null).map((c) => (
              <tr key={c.symbol}>
                <td className="rw-row-primary">{c.symbol} <span style={{ color: "var(--faint)" }}>{c.weightPct.toFixed(1)}%</span></td>
                <td className="rw-row-secondary">r = {c.correlation!.toFixed(2)}</td>
                <td className="rw-row-meta">{c.sharedSector ? "same sector" : ""} {c.overlapDays}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {impact.notes.map((n, i) => <p key={i} className="rw-pf-note">{n.text}</p>)}
      <p className="rw-pf-foot">
        Measurements about your own holdings placed beside the research. No recommendation is made or implied.
        {impact.positionsExcluded > 0 && ` ${impact.positionsExcluded} position${impact.positionsExcluded === 1 ? "" : "s"} excluded — no price or no USD rate.`}
      </p>
    </section>
  );
}

function MoveDetail({ explanation, onClose }: { explanation: MoveExplanation; onClose: () => void }) {
  const e = explanation;
  return (
    <div className="rw-event" role="dialog" aria-label="Explain this move">
      <div className="rw-event-head">
        <div>
          <div className="rw-event-kind">PRICE MOVE · {new Date(e.at).toISOString().slice(0, 10)}</div>
          <h2 style={{ color: e.movePct >= 0 ? "var(--up)" : "var(--down)" }}>
            {e.movePct >= 0 ? "+" : ""}{e.movePct.toFixed(2)}%{e.sigma !== null && ` · ${Math.abs(e.sigma).toFixed(1)}σ`}
          </h2>
        </div>
        <button className="fb-x" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="rw-react">
        <div className="rw-react-row"><span>Sector median that session</span>
          <b>{e.peerMovePct === null ? "—" : `${e.peerMovePct >= 0 ? "+" : ""}${e.peerMovePct.toFixed(2)}%`}</b></div>
        <div className="rw-react-row"><span>Unexplained by the sector</span>
          <b>{e.idiosyncraticPct === null ? "—" : `${e.idiosyncraticPct >= 0 ? "+" : ""}${e.idiosyncraticPct.toFixed(2)}pp`}</b></div>
      </div>

      <p className={`rw-verdict v-${e.verdict}`}>{e.verdictText}</p>

      {e.candidates.length > 0 && (
        <>
          <div className="rw-calc-h">CANDIDATE EVIDENCE, RANKED</div>
          <ul className="rw-sources">
            {e.candidates.map((c, i) => (
              <li key={i}>
                <span className="rw-src-label">{c.event.kind.toUpperCase()} · relevance {c.relevance.toFixed(2)}</span>
                <span className="rw-src-detail">{c.event.title}</span>
                <span className="rw-src-time">{c.reasons.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
