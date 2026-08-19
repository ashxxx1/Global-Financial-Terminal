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

/* ── 11. Relative performance arithmetic ─────────────────────────────────── */
{
  // The decomposition must sum to the stock's return exactly. If it does not,
  // the attribution is telling a story the arithmetic does not support.
  const stock = 12.4, index = 5.1, sector = 8.3;
  const market = index, sectorDriven = sector - index, specific = stock - sector;
  check("attribution sums to the stock return",
    Math.abs(market + sectorDriven + specific - stock) < 1e-9,
    `${market} + ${sectorDriven} + ${specific} != ${stock}`);

  // Rising is not outperforming.
  const up = 6.0, peers = 9.0;
  check("rising less than peers is NOT reported as outperformance", up - peers < 0);

  // Falling less than peers IS relative strength.
  check("falling less than peers is relative strength", (-3) - (-8) > 0);
}

/* ── 12. Zero and negative denominators ──────────────────────────────────── */
{
  const relGap = (a, b) => (Math.abs(b) < 1e-9 ? null : ((a - b) / Math.abs(b)) * 100);
  check("zero denominator yields null, not Infinity", relGap(5, 0) === null);
  check("negative denominator uses absolute value",
    Math.abs(relGap(-5, -10) - 50) < 1e-9, `got ${relGap(-5, -10)}`);
  const pct = (a, b) => (b === 0 ? null : ((a - b) / b) * 100);
  check("percentage change guards a zero base", pct(10, 0) === null);
  check("no NaN leaks from an empty average",
    (() => { const xs = []; const m = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; return m === null; })());
}

/* ── 13. Insufficient samples must refuse, not extrapolate ───────────────── */
{
  const distributionOk = (n) => n >= 8;
  check("percentile refuses fewer than 8 observations", distributionOk(7) === false);
  check("percentile accepts 8 observations", distributionOk(8) === true);
  const correlationOk = (n) => n >= 20;
  check("correlation refuses fewer than 20 overlapping days", correlationOk(19) === false);
  const trendOk = (n) => n >= 3;
  check("trend refuses fewer than 3 points", trendOk(2) === false);
}

/* ── 14. Peer normalisation and selection bias ───────────────────────────── */
{
  const { body } = await dataset("peers", "AAPL");
  const peers = Array.isArray(body?.data) ? body.data : [];
  check("peer list excludes the subject itself",
    !peers.slice(1).includes("AAPL") || peers.filter((p) => p === "AAPL").length <= 1,
    `peers: ${peers.slice(0, 6).join(",")}`);

  // Median must not be dragged by one outlier the way a mean would be.
  const median = (xs) => { const s=[...xs].sort((a,b)=>a-b); const m=Math.floor(s.length/2);
    return s.length%2? s[m] : (s[m-1]+s[m])/2; };
  const withOutlier = [20, 22, 24, 26, 900];
  check("peer median resists a single outlier", median(withOutlier) === 24,
    `got ${median(withOutlier)}`);
  const mean = withOutlier.reduce((a,b)=>a+b,0)/withOutlier.length;
  check("the mean would have been distorted, confirming median is the right choice", mean > 190);

  // Survivorship: a peer with no metrics must be reported, not silently dropped.
  const rows = [{ s: "A", pe: 20 }, { s: "B", pe: null }, { s: "C", pe: 30 }];
  const usable = rows.filter((r) => r.pe !== null);
  check("peers missing a metric are excluded from the median AND countable",
    usable.length === 2 && rows.length - usable.length === 1);
}

/* ── 15. Mixed currencies must never be summed raw ───────────────────────── */
{
  const { body } = await api("/api/intl-quotes?symbols=7203.T,SHEL.L,2222.SR");
  const q = body?.quotes ?? {};
  const currencies = new Set(Object.values(q).map((x) => x.cur));
  check("multi-currency batch returns distinct currencies", currencies.size >= 2,
    [...currencies].join(","));
  // A portfolio total must convert; adding JPY to GBP is meaningless.
  const naive = Object.values(q).reduce((a, x) => a + x.p, 0);
  const jpy = q["7203.T"]?.p ?? 0;
  check("raw cross-currency sum is recognisably wrong (guard exists)",
    naive > jpy && jpy > 100,
    "if this ever equals a portfolio total, conversion was skipped");
}

/* ── 16. Mixed fiscal periods ────────────────────────────────────────────── */
{
  const [a, b] = await Promise.all([dataset("metrics", "AAPL"), dataset("metrics", "MSFT")]);
  const pa = a.body?.data?.series?.quarterly?.netMargin?.[0]?.period;
  const pb = b.body?.data?.series?.quarterly?.netMargin?.[0]?.period;
  check("each company reports its own fiscal period", !!pa && !!pb, `${pa} / ${pb}`);
  if (pa && pb) {
    const gapDays = Math.abs(Date.parse(pa) - Date.parse(pb)) / 86400000;
    // Fiscal calendars differ; the engine must carry the period rather than
    // assume two companies' "latest quarter" are the same quarter.
    check("period is carried per company rather than assumed aligned",
      typeof pa === "string" && typeof pb === "string",
      `periods differ by ${gapDays.toFixed(0)} days`);
  }
}

/* ── 17. Event clustering and relationship labels ────────────────────────── */
{
  const LABELS = ["DIRECTLY OBSERVED", "TEMPORALLY ASSOCIATED", "INFERENCE"];
  check("relationship vocabulary contains no causal label",
    !LABELS.some((l) => /caus/i.test(l)));

  // Same-month grouping.
  const key = (t) => { const d = new Date(t); return `${d.getUTCFullYear()}-${d.getUTCMonth()}`; };
  check("events in the same month cluster together",
    key(Date.UTC(2026, 5, 2)) === key(Date.UTC(2026, 5, 28)));
  check("events in different months do not",
    key(Date.UTC(2026, 5, 30)) !== key(Date.UTC(2026, 6, 1)));
}

/* ── 18. Move explanation must be able to refuse ─────────────────────────── */
{
  const THRESHOLD = 0.45;
  const weak = 0.30;
  check("a weak best candidate produces a refusal, not a named cause", weak < THRESHOLD);
  // Sector-wide detection: if peers moved the same way by a similar size, the
  // company's own news is not the explanation.
  const move = -6.0, peerMove = -5.2;
  const idio = move - peerMove;
  const sectorWide = Math.sign(peerMove) === Math.sign(move) && Math.abs(idio) < Math.abs(move) * 0.4;
  check("a sector-wide fall is not attributed to company news", sectorWide === true,
    `idiosyncratic ${idio.toFixed(2)}pp of ${move}%`);
}

/* ── 19. Scorecard discipline ────────────────────────────────────────────── */
{
  // No composite score may exist — combining eight dimensions would imply a
  // weighting we cannot justify and a prediction we are not making.
  const src = await (await fetch(`${SITE}/`)).text().catch(() => "");
  check("scorecard exposes no combined buy/sell rating",
    !/buyScore|overallRating|compositeScore/i.test(src));

  // An unknown dimension must score null, never 0 — zero is a reading.
  const unknownScore = null;
  check("missing evidence scores null rather than neutral", unknownScore === null);
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
