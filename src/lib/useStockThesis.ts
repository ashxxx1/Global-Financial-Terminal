/**
 * The bull/bear case for one company, for surfaces outside the workspace.
 *
 * A thin hook over the research engine's own chain — context, scorecard,
 * thesis — so the stock page and the workspace cannot tell different stories
 * about the same company. The alternative, generating a second opinion locally,
 * is how a product ends up contradicting itself on two of its own pages.
 */
import { useEffect, useState } from "react";
import { buildContext } from "./research/context";
import { buildScorecard } from "./research/scorecard";
import { buildThesis, type Falsifier, type ThesisPoint } from "./research/thesis";

export type ThesisState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "unavailable"; reason: string }
  | { state: "ok"; bull: ThesisPoint[]; bear: ThesisPoint[]; falsifiers: Falsifier[]; note?: string };

export function useStockThesis(symbol: string | null): ThesisState {
  const [state, setState] = useState<ThesisState>({ state: "idle" });

  useEffect(() => {
    if (!symbol) { setState({ state: "idle" }); return; }
    let live = true;
    setState({ state: "loading" });
    void (async () => {
      try {
        const ctx = await buildContext(symbol);
        if (!live) return;
        const dims = buildScorecard(ctx);
        const t = buildThesis(ctx, dims);
        if (!live) return;
        // Neither side scoring is a real answer about the evidence, not a
        // failure — but a panel with two empty columns and no explanation reads
        // as a bug, so it is reported as the absence it is.
        if (t.bull.length === 0 && t.bear.length === 0) {
          setState({
            state: "unavailable",
            reason: t.note
              || "No dimension of this company scored strongly enough in either direction to be worth stating. That is usually a coverage gap rather than a neutral company — the workspace lists exactly which datasets are missing.",
          });
          return;
        }
        setState({ state: "ok", bull: t.bull, bear: t.bear, falsifiers: t.falsifiers, note: t.note });
      } catch {
        if (live) setState({ state: "unavailable", reason: "The evidence needed for this could not be retrieved." });
      }
    })();
    return () => { live = false; };
  }, [symbol]);

  return state;
}
