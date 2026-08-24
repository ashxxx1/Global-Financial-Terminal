import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTerminal } from "../../store";
import { ask, MODES, TIER_MEANING, overallConfidence } from "../../lib/research";
import type { Answer, Claim, Mode, Tier } from "../../lib/research";
import { STARTERS } from "../../lib/research";
import { looksLikeImpactQuestion } from "../../lib/impact/extract";

/**
 * The research copilot surface.
 *
 * Two rules drive the whole layout. First, a claim's tier is never more than a
 * glance away from the claim — the badge sits inline, not in a legend at the
 * bottom, because a reader who has to look up what a statement means will
 * simply read it as fact. Second, evidence is always one click away and always
 * shows the exact figure used, not a citation to a dataset name.
 */

interface Turn {
  question: string;
  answer: Answer | null;
  error?: string;
  table?: { label: string; a: number | null; b: number | null; lowerIsCheaper: boolean }[];
  tableColumns?: { a: string; b: string };
}

const TIER_ORDER: Tier[] = ["FACT", "CALCULATION", "INFERENCE", "OPINION"];

export default function ResearchPanel() {
  const navigate = useNavigate();
  const open = useTerminal((s) => s.chatOpen);
  const setOpen = useTerminal((s) => s.setChatOpen);
  const watchlist = useTerminal((s) => s.watchlist);

  const [mode, setMode] = useState<Mode>("moving");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  /** Carried between turns so follow-ups know what "this" refers to. */
  const [ctxSymbol, setCtxSymbol] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, busy]);

  const run = useCallback(async (question: string) => {
    if (!question.trim() || busy) return;
    if (looksLikeImpactQuestion(question)) {
      setOpen(false);
      navigate(`/impact?q=${encodeURIComponent(question.trim())}`);
      return;
    }
    setInput("");
    setBusy(true);
    setTurns((t) => [...t, { question, answer: null }]);
    try {
      const { answer, parsed } = await ask(question, {
        symbol: ctxSymbol,
        watchlist: watchlist.map((w) => w.symbol),
      });
      if (parsed.symbols[0]) setCtxSymbol(parsed.symbols[0]);
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = {
          question, answer,
          table: (answer as Answer & { table?: Turn["table"] }).table,
          tableColumns: answer.tableColumns,
        };
        return next;
      });
    } catch {
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = { question, answer: null, error: "That question could not be answered — the data request failed." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }, [busy, ctxSymbol, watchlist, navigate, setOpen]);

  if (!open) return null;

  return (
    <aside className="rsx" role="complementary" aria-label="Research copilot">
      <header className="rsx-head">
        <div>
          <div className="rsx-title">RESEARCH</div>
          <div className="rsx-sub">Every claim carries its source and how far to trust it.</div>
        </div>
        <button className="fb-x" onClick={() => setOpen(false)} aria-label="Close research panel">×</button>
      </header>

      {/* Modes */}
      <div className="rsx-modes" role="group" aria-label="Research mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`rsx-mode ${mode === m.id ? "on" : ""}`}
            aria-pressed={mode === m.id}
            title={m.blurb}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rsx-body">
        {turns.length === 0 && (
          <div className="rsx-empty">
            <p className="rsx-blurb">{MODES.find((m) => m.id === mode)?.blurb}</p>
            <div className="rsx-starters">
              {(STARTERS[mode] ?? []).map((s) => (
                <button key={s} className="rsx-starter" onClick={() => void run(s)}>{s}</button>
              ))}
            </div>
            <p className="rsx-note">
              Answers are built from live market data, company fundamentals, earnings
              surprises, analyst ratings, filings and news — not from a language model.
              Nothing here is investment advice.
            </p>
          </div>
        )}

        {turns.map((t, i) => (
          <article key={i} className="rsx-turn">
            <div className="rsx-q">{t.question}</div>
            {t.answer === null && !t.error && <div className="rsx-loading">Retrieving and checking sources…</div>}
            {t.error && <div className="rsx-error">{t.error}</div>}
            {t.answer && <AnswerView answer={t.answer} table={t.table} tableColumns={t.tableColumns} onFollowUp={(q) => void run(q)} />}
          </article>
        ))}
        <div ref={endRef} />
      </div>

      <form className="rsx-form" onSubmit={(e) => { e.preventDefault(); void run(input); }}>
        <input
          className="rsx-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ctxSymbol ? `Ask about ${ctxSymbol}, or name another company…` : "Ask about a company, the market or your watchlist…"}
          aria-label="Ask a research question"
          disabled={busy}
        />
        <button className="rsx-send" type="submit" disabled={busy || !input.trim()}>
          {busy ? "…" : "ASK"}
        </button>
      </form>
    </aside>
  );
}

function AnswerView({ answer, table, tableColumns, onFollowUp }: {
  answer: Answer;
  table?: Turn["table"];
  tableColumns?: Turn["tableColumns"];
  onFollowUp: (q: string) => void;
}) {
  const conf = overallConfidence(answer.claims);
  return (
    <div className="rsx-answer">
      <h3 className="rsx-atitle">{answer.title}</h3>
      <p className="rsx-headline">{answer.headline}</p>

      {answer.claims.length > 0 && (
        <div className="rsx-conf">
          <span className="rsx-conf-label">CONFIDENCE</span>
          <span className="rsx-conf-bar" aria-hidden="true">
            <span className="rsx-conf-fill" style={{ width: `${Math.round(conf * 100)}%` }} />
          </span>
          <span className="rsx-conf-val">{Math.round(conf * 100)}%</span>
          <span className="rsx-conf-why">weakest claim, not the average</span>
        </div>
      )}

      <ol className="rsx-claims">
        {answer.claims.map((c, i) => <ClaimView key={i} claim={c} />)}
      </ol>

      {table && table.length > 0 && (
        <div className="rsx-tablewrap">
          <table className="rsx-table">
            <thead><tr><th>Metric</th><th className="num">{tableColumns?.a ?? "A"}</th><th className="num">{tableColumns?.b ?? "B"}</th></tr></thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num">{r.a === null ? "—" : r.a.toFixed(2)}</td>
                  <td className="num">{r.b === null ? "—" : r.b.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {answer.unavailable && answer.unavailable.length > 0 && (
        <div className="rsx-unavail">
          <div className="rsx-unavail-h">DATA WE DO NOT HAVE</div>
          <ul>
            {answer.unavailable.map((u, i) => (
              <li key={i}><b>{u.label}</b> — {u.note}</li>
            ))}
          </ul>
        </div>
      )}

      {answer.caveats.length > 0 && (
        <div className="rsx-caveats">
          <div className="rsx-caveats-h">WHAT THIS ANSWER CANNOT SEE</div>
          <ul>{answer.caveats.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}

      {answer.suggestions.length > 0 && (
        <div className="rsx-follow">
          {answer.suggestions.map((s) => (
            <button key={s} className="rsx-starter" onClick={() => onFollowUp(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimView({ claim }: { claim: Claim }) {
  const [show, setShow] = useState(false);
  return (
    <li className="rsx-claim">
      <div className="rsx-claim-row">
        <span className={`rsx-tier t-${claim.tier.toLowerCase()}`} title={TIER_MEANING[claim.tier]}>
          {claim.tier}
        </span>
        <span className="rsx-claim-text">{claim.text}</span>
      </div>
      <div className="rsx-claim-foot">
        <span className="rsx-claim-conf">{Math.round(claim.confidence * 100)}% confidence</span>
        {claim.sources.slice(0, 4).map((s, i) => (
          <span key={i} className={`rsx-chip ${s.unpriced ? "sim" : ""}`}>{s.label}</span>
        ))}
        <button className="rsx-evidence-btn" aria-expanded={show} onClick={() => setShow((v) => !v)}>
          {show ? "HIDE EVIDENCE" : "SHOW EVIDENCE"}
        </button>
      </div>
      {show && (
        <div className="rsx-evidence">
          <div className="rsx-ev-why"><b>How this was reached:</b> {claim.why}</div>
          <div className="rsx-ev-tier"><b>{claim.tier}:</b> {TIER_MEANING[claim.tier]}</div>
          {claim.calculation && (
            <div className="rsx-calc">
              <div className="rsx-calc-h">CALCULATION — recompute it yourself</div>
              <table className="rsx-calc-t">
                <tbody>
                  {claim.calculation.inputs.map((inp, i) => (
                    <tr key={i}>
                      <td>{inp.label}{inp.metricKey && <span className="rsx-key">{inp.metricKey}</span>}</td>
                      <td className="num">{inp.value.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rsx-calc-expr">{claim.calculation.expression}</div>
              <div className="rsx-calc-res">
                = {claim.calculation.result.toFixed(2)} {claim.calculation.unit}
                {claim.calculation.n !== undefined && <span className="rsx-calc-n">n = {claim.calculation.n}</span>}
              </div>
            </div>
          )}
          <ul className="rsx-ev-list">
            {claim.sources.map((s, i) => (
              <li key={i}>
                <span className="rsx-ev-label">
                  {s.label}
                  {s.metricKey && <span className="rsx-key">{s.metricKey}</span>}
                </span>
                {s.unpriced && <span className="rsx-ev-sim">NO PRICE</span>}
                <span className="rsx-ev-detail">{s.detail}</span>
                <span className="rsx-ev-time">{new Date(s.asOf).toISOString().replace("T", " ").slice(0, 16)} UTC</span>
                {s.url && <a className="rsx-ev-link" href={s.url} target="_blank" rel="noopener noreferrer">source ↗</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

/** Exported for the tier legend elsewhere if needed. */
export { TIER_ORDER };
