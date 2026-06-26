# PROMPT — Wire the Quant Engine In (no more fake numbers)

You're given a real file: `quantEngine.ts`. It contains working, tested implementations of:
momentum (12-1 month), EWMA volatility, a macro regime index, a weighted composite
signal score, an instability/risk index, multi-model ensemble confidence, a
Mahalanobis k-NN historical analog finder, a Monte Carlo scenario engine (Cholesky-
correlated shocks), Kelly-criterion position sizing, and a correlation/contagion
matrix. None of these are decorative — every function takes real inputs and computes
a real output. Your job now is integration, not invention.

## STEP 1 — FIND AND DELETE EVERY HARDCODED DISPLAY NUMBER

Search the codebase for any score, index, or percentage that is currently a literal
constant rather than the result of a calculation — most importantly the
**"Instability Risk: 42"** badge, and any static numbers inside `VectorBloom.tsx`,
`LivingIntelligenceStream.tsx`, or wherever the four quadrant panels render their
metrics. List every hardcoded number you find before changing anything.

## STEP 2 — DROP IN THE ENGINE

Add `quantEngine.ts` to `src/lib/`. Do not modify its logic — it's already verified.
If you genuinely need a new function, add it alongside the existing ones following
the same pattern (pure function, typed inputs, no hidden state).

## STEP 3 — FEED IT WITH DATA

You don't have live market feeds wired in yet. That's fine — use
`generateSyntheticPriceSeries()` to produce a believable, seeded price history
**per country**, with a different seed and drift/vol per country so countries are
visibly different from each other (this is likely why nothing looked different
before — if every country shows the same static number, the data feeding the
formula never changed). Derive returns, volatility, and momentum from that series
for each country independently.

## STEP 4 — WIRE EACH FEATURE TO ITS REAL FUNCTION

- **Instability Risk badge** → `instabilityIndex()`, fed by that country's z-scored
  volatility/political/sentiment inputs. Must change when you switch countries.
- **Signal Desk composite score** (Phase 3 from the previous prompt) →
  `compositeScore()`. Show the **factor breakdown** (each weighted term) visibly in
  the UI, not just the final number — this is what proves the math is real to
  anyone looking at it.
- **Precedent Panel** → `kNearestAnalogs()` + `precedentStats()`, using a rolling
  window of the synthetic series as the historical sample set.
- **Multi-model ensemble indicator** → `stanceFromZ()` per sub-model +
  `ensembleConfidence()`. The three sub-model stances must be computed from
  different subsets of the factor vector (quant = momentum+valuation+volatility,
  sentiment = sentiment factor alone, macro = macro index alone) so they can
  genuinely disagree.
- **Scenario Simulator sliders** (Phase 4) → on every slider move, call
  `monteCarloScenario()` with a `shockOverride` matching the slider, and update the
  displayed p5/p50/p95 band live. This must visibly differ from the baseline call
  (no override) — if the band doesn't move when the slider moves, the wiring is
  wrong, not the math.
- **Position sizing range** → `kellyRange()`, fed by the expected return implied by
  the composite score and the variance from the synthetic series.
- **Contagion Matrix** (Phase 5) → `correlationMatrix()` across all countries'
  synthetic return series, plus `beta()` against whichever country/index you treat
  as the benchmark.

## STEP 5 — PROVE IT, DON'T DESCRIBE IT

Before reporting anything as done:
1. Click two different countries and screenshot both Signal Desk panels side by
   side — the composite score, factor breakdown, and instability index **must show
   different numbers**. If they match, something is still hardcoded or every
   country is reading the same data — fix it.
2. Move a Scenario Simulator slider and screenshot the score band before and after —
   it must shift.
3. Open the browser console and log the actual `FactorVector` and `compositeZ()`
   output for the currently selected country, so the numbers on screen can be
   checked against the math, not just trusted.

Do not summarize this as complete until all three checks above produce real,
visibly different evidence.
