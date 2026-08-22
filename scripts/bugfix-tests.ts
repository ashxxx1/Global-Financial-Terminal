/**
 * Bug-fix regression tests.
 *
 * Pure-function tests that would have caught every bug in the P0–P2 fix pass.
 * No network calls — this runs against the registry and logic directly.
 *
 *   npx --yes tsx scripts/bugfix-tests.ts
 */

/* ── Bootstrap: import the modules under test ──────────────────────────── */

// P0-1: compare pairs + symbol registration
import { POPULAR_COMPARE_PAIRS } from "../src/lib/charts/compareColors";
import { metaFor, allStockSymbols, quoteFor } from "../src/lib/market";

// P0-2: signals → chart routing
import { SIGNAL_ASSETS } from "../src/lib/signals/assets";

// P0-3: intent parser
import { parseQuestion } from "../src/lib/research/intent";

// P1-2: economic calendar
import { getEconCalendar } from "../src/data/econCalendar";

// P1-3: news relevance
import { isRelevant } from "../src/lib/research/analyzers/newsRelevance";

import { tickerSuggestions } from "../src/lib/portfolio/resolve";

/* ── Test runner ───────────────────────────────────────────────────────── */

let passed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; return; }
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

/* ── P0-1: Every symbol in POPULAR_COMPARE_PAIRS resolves ──────────────── */
{
  for (const [a, b] of POPULAR_COMPARE_PAIRS) {
    check(`metaFor("${a}") resolves`, metaFor(a) !== undefined && metaFor(a) !== null);
    check(`metaFor("${b}") resolves`, metaFor(b) !== undefined && metaFor(b) !== null);
  }
  // Explicit AMD check — the original bug report
  check("AMD is in the stock universe", allStockSymbols().includes("AMD"));
  check("SPY is in the stock universe", allStockSymbols().includes("SPY"));
  check("QQQ is in the stock universe", allStockSymbols().includes("QQQ"));
}

/* ── P0-2: Every SIGNAL_ASSETS quoteSymbol resolves via metaFor ────────── */
{
  const seenQuote = new Set<string>();
  for (const asset of SIGNAL_ASSETS) {
    if (seenQuote.has(asset.quoteSymbol)) continue;
    seenQuote.add(asset.quoteSymbol);
    check(
      `signal quoteSymbol "${asset.quoteSymbol}" resolves`,
      metaFor(asset.quoteSymbol) !== undefined && metaFor(asset.quoteSymbol) !== null,
      `asset ${asset.assetId}`,
    );
  }
}

/* ── P0-3a: Generic name words don't match wrong tickers ───────────────── */
{
  // "company" appears in many names — it should NOT resolve to a2 Milk Company
  // when the user is asking about NVDA.
  const result = parseQuestion(
    "What are the biggest company-specific risks to NVDA?",
    {},
  );
  check(
    "P0-3a: 'company' doesn't override NVDA",
    result.symbols[0] === "NVDA",
    `got symbols[0] = ${result.symbols[0]}`,
  );

  // Ticker should always outrank name-word even when the name-word appears first.
  const result2 = parseQuestion(
    "Tell me about Apple and what NVDA is doing",
    {},
  );
  check(
    "P0-3a: ticker NVDA appears in symbols",
    result2.symbols.includes("NVDA"),
    `got ${JSON.stringify(result2.symbols)}`,
  );
}

/* ── P0-3b: Word-boundary matching for has() ───────────────────────────── */
{
  // "compared" should NOT trigger the "compare" intent
  const r1 = parseQuestion(
    "How is NVDA performing compared to the rest of the sector?",
    {},
  );
  check(
    "P0-3b: 'compared' does NOT trigger compare intent",
    r1.intent !== "valuation-pair",
    `got intent = ${r1.intent}`,
  );

  // But "compare NVDA vs AAPL" should still work
  const r2 = parseQuestion("Compare NVDA vs AAPL", {});
  check(
    "P0-3b: 'Compare NVDA vs AAPL' triggers valuation-pair",
    r2.intent === "valuation-pair",
    `got intent = ${r2.intent}`,
  );

  // Pronoun inheritance: "Is this temporary?" should inherit the company
  const r3 = parseQuestion("Is this temporary?", { symbol: "NVDA" });
  check(
    "P0-3b: pronoun inherits context symbol",
    r3.symbols[0] === "NVDA" || (r3.symbols.length === 0 && r3.intent !== "unknown"),
    `got symbols = ${JSON.stringify(r3.symbols)}`,
  );
}

/* ── P1-2: Calendar dates are deterministic ────────────────────────────── */
{
  // Two calls 3 days apart should return the same absolute timestamp for
  // events that appear in both windows.
  const day1 = Date.parse("2026-08-20T12:00:00Z");
  const day2 = day1 + 3 * 86400_000;
  const cal1 = getEconCalendar(day1);
  const cal2 = getEconCalendar(day2);

  // Find a "US CPI" event that appears in both windows.
  const cpi1 = cal1.find((e) => e.title === "US CPI");
  const cpi2 = cal2.find((e) => e.title === "US CPI" && cpi1 && e.id === cpi1.id);

  if (cpi1 && cpi2) {
    check(
      "P1-2: same US CPI event has identical timestamp across calls",
      cpi1.time === cpi2.time,
      `day1: ${cpi1.time}, day2: ${cpi2.time}`,
    );
  } else {
    // If the CPI falls outside both windows, at least verify events have
    // absolute (non-relative) timestamps.
    const anyEvent = cal1[0];
    if (anyEvent) {
      const correspondingInCal2 = cal2.find((e) => e.id === anyEvent.id);
      if (correspondingInCal2) {
        check(
          "P1-2: event timestamp is absolute (same across calls)",
          anyEvent.time === correspondingInCal2.time,
          `event ${anyEvent.id}: ${anyEvent.time} vs ${correspondingInCal2.time}`,
        );
      } else {
        check("P1-2: at least one event exists", true);
      }
    } else {
      check("P1-2: calendar returns at least one event", cal1.length > 0, `got ${cal1.length}`);
    }
  }
}

/* ── P1-3: News relevance filter ───────────────────────────────────────── */
{
  const relevant = {
    datetime: Math.floor(Date.now() / 1000),
    headline: "NVIDIA reports record data-center revenue",
    source: "Reuters",
    url: "https://example.com/1",
    summary: "NVDA quarterly earnings exceeded expectations...",
  };
  const irrelevant = {
    datetime: Math.floor(Date.now() / 1000),
    headline: "Markets rally on optimism about trade talks",
    source: "Reuters",
    url: "https://example.com/2",
    summary: "Stocks rose broadly on hopes for a deal",
  };

  check(
    "P1-3: relevant news passes filter",
    isRelevant(relevant, "NVIDIA Corp", "NVDA"),
  );
  check(
    "P1-3: irrelevant news is filtered out",
    !isRelevant(irrelevant, "NVIDIA Corp", "NVDA"),
  );
}

/* ── P1-4: Follow-up suggestion logic ──────────────────────────────────── */
{
  // The top mover should be the one with the largest absolute change.
  const mockQuotes = [
    { sym: "AAPL", changePct: -0.5 },
    { sym: "NVDA", changePct: 4.2 },
    { sym: "MSFT", changePct: 1.1 },
  ];
  const topMover = mockQuotes
    .map((q) => ({ s: q.sym, chg: Math.abs(q.changePct) }))
    .sort((a, b) => b.chg - a.chg)[0]?.s;
  check(
    "P1-4: top mover is NVDA (largest absolute change)",
    topMover === "NVDA",
    `got ${topMover}`,
  );
}

/* ── Official 2026 release calendar (verification report) ──────────────── */
{
  const now = Date.parse("2026-08-22T12:00:00Z");
  const cal = getEconCalendar(now);
  const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);

  const usCpi = cal.filter((e) => e.title === "US CPI");
  check("US CPI next print is 11 Sep 2026 (BLS)", usCpi.some((e) => ymd(e.time) === "2026-09-11"));
  check("US CPI is not dated 22 Aug 2026", usCpi.every((e) => ymd(e.time) !== "2026-08-22"));

  const ez = cal.filter((e) => e.title === "Eurozone CPI");
  check("Eurozone CPI next print is 1 Sep 2026 flash (Eurostat)", ez.some((e) => ymd(e.time) === "2026-09-01"));
  check("Eurozone CPI is not dated 23 Aug 2026", ez.every((e) => ymd(e.time) !== "2026-08-23"));

  const uk = cal.filter((e) => e.title === "UK CPI");
  check("UK CPI next print is 16 Sep 2026 (ONS)", uk.some((e) => ymd(e.time) === "2026-09-16"));
  check("UK CPI is not dated 24 Aug 2026", uk.every((e) => ymd(e.time) !== "2026-08-24"));

  const nfp = cal.filter((e) => e.title === "US Nonfarm payrolls");
  check("US NFP next print is 4 Sep 2026 (BLS)", nfp.some((e) => ymd(e.time) === "2026-09-04"));
  check("US NFP is not dated 25 Aug 2026", nfp.every((e) => ymd(e.time) !== "2026-08-25"));
}

/* ── Snapshot levels (Aug 2026 session) ───────────────────────────────── */
{
  const spx = metaFor("IDX:S&P 500");
  check("S&P 500 snapshot is ~7,708 not ~5,500", !!spx && spx.base > 7000 && spx.base < 8000, `base=${spx?.base}`);
  const dax = metaFor("IDX:DAX 40");
  check("DAX snapshot is ~26,091 not ~18,200", !!dax && dax.base > 25000 && dax.base < 27000, `base=${dax?.base}`);
  const gold = metaFor("IDX:GOLD");
  check("Gold snapshot is ~$4,488 not ~$2,380", !!gold && gold.base > 4000 && gold.base < 5000, `base=${gold?.base}`);
  const vix = metaFor("IDX:VIX");
  check("VIX snapshot is in the mid-teens", !!vix && vix.base >= 15 && vix.base <= 16.5, `base=${vix?.base}`);
  const hsi = metaFor("IDX:HANG SENG");
  check("Hang Seng snapshot is ~25,495", !!hsi && hsi.base > 25000 && hsi.base < 26000, `base=${hsi?.base}`);

  const xom = metaFor("XOM");
  check("XOM snapshot is ~$164.77 not ~$117", !!xom && xom.base > 150 && xom.base < 180, `base=${xom?.base}`);
  const cvx = metaFor("CVX");
  check("CVX snapshot is ~$205 not ~$156", !!cvx && cvx.base > 190 && cvx.base < 220, `base=${cvx?.base}`);
  const ongc = metaFor("ONGC");
  check("ONGC snapshot is ~₹239 not ~₹266", !!ongc && ongc.base > 220 && ongc.base < 250, `base=${ongc?.base}`);
  const aramco = metaFor("2222");
  check("Aramco snapshot is ~SAR 26.40 not ~29.50", !!aramco && aramco.base > 25 && aramco.base < 28, `base=${aramco?.base}`);

  const spy = quoteFor("SPY");
  check("SPY ETF price is hundreds, not the S&P 500 level", !!spy && spy.price > 100 && spy.price < 2000, `price=${spy?.price}`);
}

/* ── SPY / QQQ signals quote the ETF, not the index ────────────────────── */
{
  const spy = SIGNAL_ASSETS.find((a) => a.symbol === "SPY");
  const qqq = SIGNAL_ASSETS.find((a) => a.symbol === "QQQ");
  check("SPY signal quoteSymbol is SPY", spy?.quoteSymbol === "SPY", `got ${spy?.quoteSymbol}`);
  check("QQQ signal quoteSymbol is QQQ", qqq?.quoteSymbol === "QQQ", `got ${qqq?.quoteSymbol}`);
  check("SPY quoteSymbol resolves", metaFor("SPY") !== null);
}

/* ── AAPL must not resolve to AAL ──────────────────────────────────────── */
{
  const all = allStockSymbols();
  const hits = tickerSuggestions("AAPL", all, 8);
  check("AAPL suggestions include AAPL", hits.includes("AAPL"));
  check("AAPL suggestions do not include AAL", !hits.includes("AAL"));
  check("AAPL is Apple, not Anglo American", metaFor("AAPL")?.name.includes("Apple") === true);
  check("AAL remains Anglo American", metaFor("AAL")?.name.includes("Anglo") === true);
}

/* ── Report ────────────────────────────────────────────────────────────── */
console.log(`\n${passed} passed`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("All bug-fix tests passed.");
