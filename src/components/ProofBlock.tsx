import { useEffect, useMemo, useRef, useState } from "react";
import { bootstrapSignals } from "../lib/signals/api";
import { computePerformance } from "../lib/signals/performance";
import type { Signal } from "../lib/signals/types";

/**
 * Proof, with the caveats attached.
 *
 * Two kinds of number appear here and they are not the same kind of claim:
 *
 *  - Coverage (instruments, countries, sectors, indexed pages) is measured off
 *    the actual registry and sitemap. Those are facts about the product.
 *  - The signal track record is computed live from the signals engine, which
 *    ships in demo mode — so it is a *simulated* record and is labelled as one,
 *    loudly, inline. Presenting a backtest as realised performance is the exact
 *    fraud this product's data-honesty work exists to prevent, and in a
 *    finance-adjacent product it is also the fastest route to a regulator.
 *
 * There are deliberately no user counts, testimonials or "traders made $X"
 * figures. There are no users yet. Inventing them would poison the one thing
 * this product is actually selling: that its numbers can be trusted.
 */

const COVERAGE = [
  { n: 587, label: "Instruments tracked", suffix: "" },
  { n: 68, label: "Country markets", suffix: "" },
  { n: 13, label: "Sectors, live", suffix: "" },
  { n: 5, label: "Independent data sources", suffix: "" },
];

/** Ease-out count-up, once, on reveal. */
function useCountUp(target: number, run: boolean, ms = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setN(target); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return n;
}

function Stat({ n, label, run }: { n: number; label: string; run: boolean }) {
  const shown = useCountUp(n, run);
  return (
    <div className="proof-stat">
      <span className="proof-n">{shown.toLocaleString("en-US")}</span>
      <span className="proof-l">{label}</span>
    </div>
  );
}

export default function ProofBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || run) return;
    const io = new IntersectionObserver((es, obs) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      setRun(true); obs.disconnect();
    }), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [run]);

  // The track record is computed, not typed in — if the engine changes, this
  // number changes with it rather than becoming a stale marketing claim.
  const perf = useMemo(() => {
    try {
      const signals: Signal[] = bootstrapSignals();
      return computePerformance(signals);
    } catch { return null; }
  }, []);

  const resolved = perf?.resolvedSignals ?? 0;
  const winRate = perf?.winRate;

  return (
    <div className="proof" ref={ref}>
      <div className="proof-grid">
        {COVERAGE.map((c) => <Stat key={c.label} n={c.n} label={c.label} run={run} />)}
      </div>

      {perf && resolved > 0 && (
        <div className="proof-record">
          <div className="proof-record-head">
            <span className="proof-record-title">Signal track record</span>
            <span className="proof-demo">Simulated · demo mode</span>
          </div>
          <div className="proof-record-row">
            <div>
              <span className="proof-rn">{resolved}</span>
              <span className="proof-l">Signals scored</span>
            </div>
            <div>
              <span className="proof-rn up">{perf.targetHits}</span>
              <span className="proof-l">Hit target</span>
            </div>
            <div>
              <span className="proof-rn down">{perf.stopHits}</span>
              <span className="proof-l">Stopped out</span>
            </div>
            <div>
              <span className="proof-rn">{winRate != null ? `${Math.round(winRate * 100)}%` : "—"}</span>
              <span className="proof-l">Hit rate</span>
            </div>
          </div>
          <p className="proof-caveat">
            <b>This is the whole record, not the good half.</b> Every signal is
            published with its target and stop <em>before</em> the outcome is
            known, then scored automatically — losses included, nothing
            retro-fitted. The numbers above are generated in demo mode and are{" "}
            <b>not realised performance</b>. Past results, simulated or
            otherwise, do not predict future returns.
          </p>
        </div>
      )}
    </div>
  );
}
