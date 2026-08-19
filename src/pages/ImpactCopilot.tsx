import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSeo } from "../lib/seo";
import { useTerminal } from "../store";
import { analyzeImpact, EXAMPLE_PROMPTS, evaluateThesis } from "../lib/impact";
import type { ImpactAnalysis, ScenarioAssumptions } from "../lib/impact/types";
import { AnalysisView } from "../components/impact/AnalysisView";

type Tab = "analyze" | "saved" | "monitor";

export default function ImpactCopilot() {
  useSeo({
    title: "Financial Impact Copilot",
    description: "Ask what an event could mean for markets, sectors, companies or your portfolio — mechanism, catalog exposure, live data and documented precedents.",
    path: "/impact",
  });
  const [params, setParams] = useSearchParams();
  const positions = useTerminal((s) => s.positions);
  const saved = useTerminal((s) => s.savedImpact);
  const saveImpact = useTerminal((s) => s.saveImpact);
  const removeImpact = useTerminal((s) => s.removeImpact);
  const theses = useTerminal((s) => s.impactTheses);
  const addThesis = useTerminal((s) => s.addImpactThesis);
  const removeThesis = useTerminal((s) => s.removeImpactThesis);
  const patchThesis = useTerminal((s) => s.patchImpactThesis);

  const [tab, setTab] = useState<Tab>("analyze");
  const [input, setInput] = useState(params.get("q") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);
  const [scenario, setScenario] = useState<ScenarioAssumptions | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = useCallback(async (question: string, scen?: ScenarioAssumptions | null) => {
    const q = question.trim();
    if (q.length < 8) {
      setError("Enter a specific event, policy, price or geopolitical question.");
      setAnalysis(null);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const a = await analyzeImpact(q, { scenario: scen ?? undefined, positions });
      setAnalysis(a);
      setScenario(a.scenario);
      setParams({ q }, { replace: true });
    } catch {
      setError("The analysis could not be completed — a data request failed. Try again; catalog mapping still runs if the research feed is down.");
    } finally {
      setBusy(false);
    }
  }, [positions, setParams]);

  useEffect(() => {
    const q = params.get("q");
    if (q && q.trim().length >= 8 && !analysis) void run(q);
    // Only auto-run on first landing with ?q=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScenario = useCallback((s: ScenarioAssumptions) => {
    setScenario(s);
    if (analysis) void run(analysis.question, s);
  }, [analysis, run]);

  const refreshTheses = useCallback(() => {
    for (const t of theses) {
      const next = evaluateThesis(t);
      patchThesis(t.id, next);
    }
  }, [theses, patchThesis]);

  useEffect(() => {
    if (tab === "monitor") refreshTheses();
  }, [tab, refreshTheses]);

  const examples = useMemo(() => EXAMPLE_PROMPTS, []);

  return (
    <div className="imp">
      <p className="imp-kicker">GFT FINANCIAL IMPACT COPILOT</p>
      <h1 className="imp-title">Event → impact → exposure</h1>
      <p className="imp-lede">
        Ask GFT what an event could mean for markets, sectors, companies or your portfolio.
        Answers are built from the terminal universe, live feeds where they exist, and documented precedents — not a chat model inventing tickers.
      </p>

      <div className="imp-tabs" role="tablist">
        {(["analyze", "saved", "monitor"] as Tab[]).map((t) => (
          <button key={t} type="button" className={`imp-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {t === "analyze" ? "ANALYZE" : t === "saved" ? "SAVED RESEARCH" : "MONITOR"}
          </button>
        ))}
      </div>

      {tab === "analyze" && (
        <>
          <form className="imp-ask" onSubmit={(e) => { e.preventDefault(); void run(input, scenario); }}>
            <input
              className="imp-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about markets, companies, economics or global events..."
              aria-label="Impact question"
              disabled={busy}
            />
            <button className="imp-send" type="submit" disabled={busy || input.trim().length < 3}>
              {busy ? "…" : "ANALYZE"}
            </button>
          </form>
          <div className="imp-examples">
            {examples.map((ex) => (
              <button key={ex} type="button" className="imp-ex" onClick={() => { setInput(ex); void run(ex, null); }}>
                {ex}
              </button>
            ))}
          </div>
          {busy && <p className="imp-busy">Mapping the event onto the GFT catalog and retrieving what the research feed will give us…</p>}
          {error && <p className="imp-err">{error}</p>}
          {notice && <p className="imp-note">{notice}</p>}
          {analysis && scenario && (
            <AnalysisView
              a={analysis}
              scenario={scenario}
              onScenario={onScenario}
              onSave={() => {
                saveImpact({
                  id: analysis.id,
                  savedAt: new Date().toISOString(),
                  question: analysis.question,
                  event: analysis.extracted.event,
                  confidence: analysis.confidence.score,
                  scenario: analysis.scenario,
                  signals: [...analysis.beneficiaries, ...analysis.negatives].map((c) => ({
                    symbol: c.symbol, signal: c.signal, name: c.name,
                  })),
                  companies: [...analysis.beneficiaries, ...analysis.negatives].map((c) => c.symbol),
                  snapshot: analysis,
                });
                setNotice("Analysis saved to this browser.");
                setTab("saved");
              }}
              onMonitor={() => {
                addThesis({
                  id: `th-${Date.now().toString(36)}`,
                  createdAt: new Date().toISOString(),
                  question: analysis.question,
                  event: analysis.extracted.event,
                  expectedDirection: analysis.extracted.direction,
                  symbols: [...analysis.beneficiaries, ...analysis.negatives].map((c) => c.symbol).slice(0, 10),
                  tags: analysis.extracted.tags,
                  status: "NEUTRAL",
                  lastCheckedAt: Date.now(),
                  note: "Monitoring uses session tape on the ranked names. Push alerts are not enabled.",
                });
                setNotice("Thesis added to Monitor. Status updates from quotes when you open that tab.");
                setTab("monitor");
              }}
            />
          )}
        </>
      )}

      {tab === "saved" && (
        <div className="imp-saved">
          {saved.length === 0 && <p className="imp-note">No saved analyses yet. Run one and use SAVE ANALYSIS.</p>}
          {saved.map((s) => (
            <div key={s.id} className="imp-card">
              <button
                type="button"
                className="row"
                onClick={() => {
                  setAnalysis(s.snapshot);
                  setScenario(s.snapshot.scenario);
                  setInput(s.question);
                  setTab("analyze");
                }}
              >
                <div className="imp-meta">{new Date(s.savedAt).toISOString().slice(0, 10)} · confidence {s.confidence}%</div>
                <div className="imp-body"><strong>{s.question}</strong></div>
                <div className="imp-meta">{s.event} · {s.companies.slice(0, 6).join(" ")}</div>
              </button>
              <button type="button" className="imp-whybtn" onClick={() => removeImpact(s.id)}>REMOVE</button>
            </div>
          ))}
        </div>
      )}

      {tab === "monitor" && (
        <div className="imp-saved">
          <p className="imp-note">
            Status is a live quote check against the thesis direction — STRENGTHENING / NEUTRAL / WEAKENING.
            News, filings and contracts are listed as what a full monitor would watch; automated push alerts are not implemented.
          </p>
          <button type="button" className="imp-btn" onClick={refreshTheses}>REFRESH STATUS</button>
          {theses.length === 0 && <p className="imp-note">No monitored theses.</p>}
          {theses.map((t) => (
            <article key={t.id} className="imp-card">
              <div className={`imp-status ${t.status}`}>{t.status}</div>
              <p className="imp-body"><strong>{t.event}</strong></p>
              <p className="imp-meta">{t.question}</p>
              <p className="imp-body">{t.note}</p>
              <p className="imp-meta">Watching {t.symbols.join(" · ") || "—"} · last check {new Date(t.lastCheckedAt).toISOString().slice(11, 19)} UTC</p>
              <p className="imp-meta">Conceptual feed: news · government announcements · earnings · contracts · industry prints · tape · contradictory signals.</p>
              <button type="button" className="imp-whybtn" onClick={() => removeThesis(t.id)}>STOP MONITORING</button>
            </article>
          ))}
        </div>
      )}

      <p className="imp-disc">{/* always visible */}
        Research-oriented signals only. Distinguish reported facts from inferred mechanisms from GFT’s analytical view.
        This analysis is based on available data and scenarios and is not a guarantee of future performance.
      </p>
    </div>
  );
}
