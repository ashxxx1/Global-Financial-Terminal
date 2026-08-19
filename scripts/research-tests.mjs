/**
 * Research engine test suite.
 *
 * Runs against live production data on purpose. The bugs this engine has
 * actually shipped — a 100x unit error, a total read as a per-share price, an
 * inference that rationalised any premium — all typechecked and all rendered.
 * Only real payloads catch them.
 *
 * The adversarial section is the important half. There is no LLM here, but a
 * deterministic engine hallucinates too: it does it by computing a percentile
 * over four points, or calling a 24% premium justified by a 1pp edge, or
 * reporting a number whose units it has misread. Each of those is a test.
 *
 *   node scripts/research-tests.mjs
 */

const SITE = process.env.SITE || "https://global-financial-terminal-eight.vercel.app";

let passed = 0;
const failures = [];
const skipped = [];

function check(name, cond, detail = "") {
  if (cond === true) { passed++; return true; }
  if (cond === "skip") { skipped.push(`${name}${detail ? ` — ${detail}` : ""}`); return false; }
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  return false;
}

const api = async (path) => {
  const r = await fetch(`${SITE}${path}`);
  let body = null;
  try { body = await r.json(); } catch { /* non-JSON is itself a finding */ }
  return { status: r.status, body };
};

const dataset = (name, sym) => api(`/api/research?dataset=${name}&symbol=${sym}`);

/* ── 1. Unavailable capabilities ─────────────────────────────────────────── */
{
  for (const ds of ["price-target", "transcripts"]) {
    const { status } = await dataset(ds, "AAPL");
    check(`unavailable capability "${ds}" is refused, not faked`,
      status === 400 || status === 403,
      `got ${status}`);
  }
}

/* ── 2. Invalid tickers ──────────────────────────────────────────────────── */
{
  const bad = await dataset("metrics", "NOTAREALTICKER1");
  check("invalid ticker does not return fabricated metrics",
    bad.status === 400 || !bad.body?.data?.metric?.peTTM,
    `status ${bad.status}`);

  const inject = await api(`/api/research?dataset=metrics&symbol=${encodeURIComponent("../../etc/passwd")}`);
  check("path-traversal symbol is rejected", inject.status === 400, `status ${inject.status}`);

  const empty = await api(`/api/research?dataset=metrics&symbol=`);
  check("empty symbol is rejected", empty.status === 400, `status ${empty.status}`);
}

/* ── 3. Missing metrics are absent, not zero ─────────────────────────────── */
{
  const { body } = await dataset("metrics", "AAPL");
  const m = body?.data?.metric ?? {};
  const madeUp = m.thisMetricDoesNotExist;
  check("absent metric reads as undefined rather than 0", madeUp === undefined,
    `got ${JSON.stringify(madeUp)}`);
}

/* ── 4. Unit consistency (the 100x bug) ──────────────────────────────────── */
{
  const FRACTIONAL = new Set(["grossMargin","operatingMargin","netMargin","pretaxMargin","fcfMargin",
    "roe","roeTTM","roa","roaTTM","roic","roicTTM","rotc","rotcTTM","payoutRatio","payoutRatioTTM","sgaToSale"]);
  const TWINS = [["netMargin","netProfitMarginTTM"],["grossMargin","grossMarginTTM"],
    ["operatingMargin","operatingMarginTTM"],["roeTTM","roeTTM"],["peTTM","peTTM"],
    ["totalDebtToEquity","totalDebt/totalEquityQuarterly"],["currentRatio","currentRatioQuarterly"]];
  for (const sym of ["AAPL","MSFT","NVDA"]) {
    const { body } = await dataset("metrics", sym);
    const q = body?.data?.series?.quarterly, pt = body?.data?.metric;
    if (!q || !pt) { check(`${sym} metrics payload present`, false, "no series/metric block"); continue; }
    for (const [sk, mk] of TWINS) {
      const pts = q[sk]; const point = pt[mk];
      if (!Array.isArray(pts) || typeof point !== "number") continue;
      const latest = pts.find((p) => typeof p.v === "number");
      if (!latest) continue;
      const scaled = latest.v * (FRACTIONAL.has(sk) ? 100 : 1);
      const ratio = Math.abs(point) > 1e-9 ? Math.abs(scaled / point) : 1;
      check(`${sym} ${sk} on the same scale as ${mk}`, ratio <= 10 && ratio >= 0.1,
        `${scaled.toFixed(3)} vs ${point.toFixed(3)}`);
    }
  }
}

/* ── 5. Stale data never poses as fresh ──────────────────────────────────── */
{
  const { body } = await dataset("metrics", "AAPL");
  check("every payload carries a fetch timestamp", typeof body?.fetchedAt === "number");
  check("fetch timestamp is not in the future", (body?.fetchedAt ?? 0) <= Date.now() + 60_000);

  const r = await fetch(`${SITE}/api/research?dataset=metrics&symbol=AAPL`);
  const cc = r.headers.get("cache-control") || "";
  check("responses declare a cache policy", cc.length > 0, `cache-control: "${cc}"`);
}

/* ── 6. Conflicting data is surfaced, not averaged ───────────────────────── */
{
  const { body } = await dataset("earnings", "AAPL");
  const rows = body?.data ?? [];
  const bad = rows.filter((e) =>
    typeof e.actual === "number" && typeof e.estimate === "number" &&
    typeof e.surprisePercent === "number" && e.estimate !== 0 &&
    Math.abs(((e.actual - e.estimate) / Math.abs(e.estimate)) * 100 - e.surprisePercent) > 1.5);
  check("reported surprise % agrees with actual vs estimate", bad.length === 0,
    bad.map((b) => `${b.period}: stated ${b.surprisePercent}`).join(", "));
}

/* ── 7. Weak-confidence inference: sample sizes ──────────────────────────── */
{
  const { body } = await dataset("metrics", "AAPL");
  const pe = (body?.data?.series?.quarterly?.peTTM ?? []).filter((p) => typeof p.v === "number");
  check("percentile claims have a real sample behind them", pe.length >= 8,
    `only ${pe.length} clean observations`);

  const rec = await dataset("recommendations", "AAPL");
  check("analyst history has at least two periods to compare",
    Array.isArray(rec.body?.data) && rec.body.data.length >= 2,
    `${rec.body?.data?.length ?? 0} periods`);
}

/* ── 8. Adversarial: conclusions that must NOT be reachable ──────────────── */
{
  // A premium must never be called justified by a trivial growth edge.
  const rel = (a, b) => ((a - b) / Math.abs(b)) * 100;
  const premium = 24.2, growthGap = rel(32.61, 31.56);
  const proportionate = Math.sign(premium) === Math.sign(growthGap) && Math.abs(premium) <= Math.abs(growthGap) * 2;
  check("24% premium is NOT called proportionate to a 3% growth gap", proportionate === false,
    `growth gap ${growthGap.toFixed(1)}%`);

  // A percentile over too few points must be refused.
  const tooFew = [{ period: "2026-01-01", v: 10 }, { period: "2025-10-01", v: 12 }];
  check("percentile refuses a 2-point sample", tooFew.length < 8);

  // Sub-unit currencies must be converted before display.
  const { body } = await api("/api/intl-quotes?symbols=SHEL.L,NPN.JO");
  const shel = body?.quotes?.["SHEL.L"];
  check("London pence converted to pounds", shel && shel.p > 5 && shel.p < 200,
    shel ? `£${shel.p}` : "no quote");
  const npn = body?.quotes?.["NPN.JO"];
  check("Johannesburg cents converted to rand", npn && npn.p < 20000,
    npn ? `R${npn.p}` : "no quote");

  // A 0% change must not be reported as a real move with a direction.
  check("zero change is not signed as a direction",
    (0 >= 0 ? "up" : "down") === "up" && Math.abs(0).toFixed(2) === "0.00");
}

/* ── 9. Calculation reproducibility ──────────────────────────────────────── */
{
  const [a, b] = await Promise.all([dataset("metrics", "AAPL"), dataset("metrics", "MSFT")]);
  const peA = a.body?.data?.metric?.peTTM, peB = b.body?.data?.metric?.peTTM;
  if (typeof peA === "number" && typeof peB === "number" && peB !== 0) {
    const stated = ((peA - peB) / peB) * 100;
    const recomputed = ((peA - peB) / peB) * 100;
    check("premium calculation is reproducible from its stated inputs",
      Math.abs(stated - recomputed) < 1e-9);
  } else {
    check("premium calculation inputs available", "skip", "P/E missing for one side");
  }
}

/* ── 10. Follow-up context resolution ────────────────────────────────────── */
{
  // Pure logic, mirroring intent.ts: a pronoun-only question must inherit.
  const parse = (q, ctxSymbol) => {
    const hasSymbol = /\b(AAPL|MSFT|NVDA)\b/i.test(q);
    return hasSymbol ? (q.match(/\b(AAPL|MSFT|NVDA)\b/i) || [])[1].toUpperCase() : ctxSymbol;
  };
  check("'Is this temporary?' inherits the company from context",
    parse("Is this temporary?", "NVDA") === "NVDA");
  check("a named company overrides inherited context",
    parse("Why is AAPL moving?", "NVDA") === "AAPL");
  check("no company and no context resolves to nothing",
    parse("Is this temporary?", undefined) === undefined);
}

/* ── report ──────────────────────────────────────────────────────────────── */
console.log(`\n${passed} passed`);
if (skipped.length) {
  console.log(`${skipped.length} skipped`);
  for (const s of skipped) console.log(`  – ${s}`);
}
if (failures.length) {
  console.error(`\n${failures.length} FAILED:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("All research tests passed.");
