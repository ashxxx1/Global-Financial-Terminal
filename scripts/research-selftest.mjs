/**
 * Research engine self-test against live production data.
 *
 * Exists because the unit bug this catches was invisible to typecheck, lint and
 * the browser: every number rendered, every source resolved, and net margin
 * moves were reported at 1/100th of their true size. Only comparing the series
 * against its point-in-time twin exposed it.
 *
 * Run before shipping research changes:
 *   node scripts/research-selftest.mjs
 */

const SITE = process.env.SITE || "https://global-financial-terminal-eight.vercel.app";
const SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "JPM"];

/** Must match FRACTIONAL_SERIES in src/lib/research/series.ts. */
const FRACTIONAL = new Set([
  "grossMargin", "operatingMargin", "netMargin", "pretaxMargin", "fcfMargin",
  "roe", "roeTTM", "roa", "roaTTM", "roic", "roicTTM", "rotc", "rotcTTM",
  "payoutRatio", "payoutRatioTTM", "sgaToSale",
]);

/**
 * Series key → the point-in-time metric measuring the same thing. If the two
 * disagree by ~100x after scaling, the scale table is wrong.
 */
const TWINS = [
  { series: "netMargin", metric: "netProfitMarginTTM" },
  { series: "grossMargin", metric: "grossMarginTTM" },
  { series: "operatingMargin", metric: "operatingMarginTTM" },
  { series: "roeTTM", metric: "roeTTM" },
  { series: "roaTTM", metric: "roaTTM" },
  { series: "peTTM", metric: "peTTM" },
  { series: "pb", metric: "pb" },
  { series: "totalDebtToEquity", metric: "totalDebt/totalEquityQuarterly" },
  { series: "currentRatio", metric: "currentRatioQuarterly" },
];

const failures = [];
const notes = [];

const scale = (k) => (FRACTIONAL.has(k) ? 100 : 1);

for (const sym of SYMBOLS) {
  const r = await fetch(`${SITE}/api/research?dataset=metrics&symbol=${sym}`);
  if (!r.ok) { failures.push(`${sym}: metrics HTTP ${r.status}`); continue; }
  const { data } = await r.json();
  const q = data?.series?.quarterly;
  const m = data?.metric;
  if (!q || !m) { failures.push(`${sym}: missing series or metric block`); continue; }

  for (const t of TWINS) {
    const pts = q[t.series];
    const point = m[t.metric];
    if (!Array.isArray(pts) || typeof point !== "number") continue;
    const latest = pts.find((p) => typeof p.v === "number");
    if (!latest) continue;

    const scaled = latest.v * scale(t.series);
    // The series is a point-in-time snapshot and the metric is often TTM, so
    // they legitimately differ. A scale error is an order of magnitude, and
    // that is all we are testing for.
    const ratio = Math.abs(point) > 1e-9 ? Math.abs(scaled / point) : 1;
    if (ratio > 10 || ratio < 0.1) {
      failures.push(
        `${sym}: ${t.series} scaled=${scaled.toFixed(3)} vs metric ${t.metric}=${point.toFixed(3)} — off by ~${ratio > 1 ? ratio.toFixed(0) + "x" : "1/" + (1 / ratio).toFixed(0)}. Check FRACTIONAL_SERIES.`,
      );
    } else {
      notes.push(`✅ ${sym} ${t.series} ≈ ${t.metric} (${scaled.toFixed(2)} vs ${point.toFixed(2)})`);
    }
  }

  // A normalised margin should look like a percentage, not a fraction.
  const nm = q.netMargin?.find((p) => typeof p.v === "number");
  if (nm) {
    const v = nm.v * scale("netMargin");
    if (Math.abs(v) < 0.5 && v !== 0) {
      failures.push(`${sym}: normalised netMargin is ${v.toFixed(4)} — still looks like a fraction.`);
    }
  }
}

for (const n of notes.slice(0, 8)) console.log(n);
console.log(`… ${notes.length} scale checks passed`);

if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error("  ❌ " + f);
  process.exit(1);
}
console.log("\nAll research self-tests passed.");
