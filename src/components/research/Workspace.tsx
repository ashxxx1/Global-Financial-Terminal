import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { openWorkspace, buildSection, SECTIONS, type Workspace as Ws, type Section, type SectionId } from "../../lib/research/workspace";
import { TIER_MEANING, overallConfidence, type Claim } from "../../lib/research";
import { gapSentence, type ResearchGap } from "../../lib/research/gaps";
import type { TimelineEvent } from "../../lib/research/analyzers/timeline";
import { metaFor } from "../../lib/market";
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
  const [selected, setSelected] = useState<TimelineEvent | null>(null);

  useSeo({
    title: `${meta?.name || sym} — research workspace`,
    description: `Evidence-backed research on ${meta?.name || sym}: what moved it, what changed, valuation in historical context, peers, filings and insider activity.`,
    path: `/research/${sym}`,
  });

  useEffect(() => {
    let live = true;
    setLoading(true); setWs(null); setSections({});
    void openWorkspace(sym).then((w) => { if (live) { setWs(w); setLoading(false); } });
    return () => { live = false; };
  }, [sym]);

  const load = useCallback(async (w: Ws, id: SectionId) => {
    if (sections[id]) return;
    const s = await buildSection(w, id);
    setSections((prev) => ({ ...prev, [id]: s }));
  }, [sections]);

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
                {s.simulated && <span className="rw-sim">SIMULATED</span>}
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
