/**
 * "Is this valuation expensive?"
 *
 * Answered against the company's own history rather than in the abstract. A
 * P/E of 34 means nothing on its own — for this business it might be the
 * cheapest it has been in a decade or the most expensive. Finnhub gives up to
 * 42 annual and 149 quarterly observations, so the question has a real answer:
 * where does today sit in that distribution.
 *
 * Cross-company comparison is kept as a separate function, and it now compares
 * the *size* of the valuation gap with the *size* of the growth gap that is
 * supposed to explain it. Direction-matching alone rationalised a 24% premium
 * on a 1pp growth edge, which is how the previous version got it wrong.
 */
import { metaFor } from "../../market";
import { fetchDataset, num, type Metrics, type Profile } from "../data";
import { distribution, trend, percentileWord, seriesDetail, consistencyWord } from "../series";
import type { Answer, Claim, Source } from "../types";
import { buildHeadline, capabilityCaveats, unavailableList, hist,
} from "./shared";
import type { CapabilityId } from "../capabilities";

const WANTED: CapabilityId[] = ["fundamentals", "fundamental-history", "eps-estimates", "price-targets"];

/** The multiples we place in historical context, with their series keys. */
const MULTIPLES: { label: string; current: string; series: string; unit: string }[] = [
  { label: "P/E", current: "peTTM", series: "peTTM", unit: "×" },
  { label: "P/S", current: "psTTM", series: "psTTM", unit: "×" },
  { label: "P/B", current: "pb", series: "pb", unit: "×" },
  { label: "EV/EBITDA", current: "evEbitdaTTM", series: "evEbitdaTTM", unit: "×" },
];

export async function analyzeValuationHistory(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const met = await fetchDataset<Metrics>("metrics", symbol);
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!met.ok) {
    return {
      title: `${name} — valuation`, mode: "valuation",
      headline: "Fundamental data is not available for this symbol.",
      claims: [], caveats: ["Valuation metrics could not be retrieved. This is usually a listing our data plan does not cover."],
      asOf: Date.now(), suggestions: [],
    };
  }

  let placed = 0;
  for (const m of MULTIPLES) {
    const series = hist(met.data, m.series);
    const dist = distribution(series, 40);
    const current = num(met.data, m.current);
    if (!dist || current === null) continue;
    placed++;

    const src: Source = {
      kind: "fundamental-history",
      label: `${m.label} history`,
      detail: seriesDetail(series, 8, m.unit),
      asOf: met.fetchedAt,
      metricKey: m.series,
      raw: dist.current,
      unit: m.unit,
      capability: "fundamental-history",
    };

    claims.push({
      text: `${m.label} of ${dist.current.toFixed(1)}${m.unit} sits ${percentileWord(dist.percentile)} its own ${dist.n}-quarter range (median ${dist.median.toFixed(1)}${m.unit}, low ${dist.min.toFixed(1)}, high ${dist.max.toFixed(1)}).`,
      tier: "CALCULATION",
      confidence: 0.9,
      why: `Percentile of the current reading against ${dist.n} prior quarterly observations from ${dist.from.slice(0, 7)} to ${dist.to.slice(0, 7)}. The current period is excluded from the distribution it is measured against, so it cannot inflate its own percentile.`,
      sources: [src],
      calculation: {
        expression: `count(history ≤ ${dist.current.toFixed(2)}) ÷ ${dist.n} × 100`,
        inputs: [
          { label: `current ${m.label}`, metricKey: m.current, value: dist.current, asOf: met.fetchedAt },
          { label: "historical median", metricKey: m.series, value: dist.median },
          { label: "historical low", value: dist.min },
          { label: "historical high", value: dist.max },
        ],
        result: dist.percentile,
        unit: "percentile",
        n: dist.n,
      },
    });
  }

  if (placed === 0) {
    caveats.push("No multiple had enough clean history to place in context — we need at least eight quarterly observations before a percentile means anything.");
  }

  // The inference: expensive relative to history is only interesting alongside
  // whether the business improved enough to deserve it.
  const peDist = distribution(hist(met.data, "peTTM"), 40);
  const marginTrend = trend(hist(met.data, "netMargin"), 8);
  if (peDist && marginTrend) {
    const rerated = peDist.percentile >= 70;
    const improving = marginTrend.change > 0;
    claims.push({
      text: rerated && !improving
        ? `The multiple is in the upper part of its own range while net margin has been falling ${consistencyWord(marginTrend.consistency)} — the market is paying more for a business earning less on each sale.`
        : rerated && improving
          ? `The multiple is high against its own history, but net margin has improved ${Math.abs(marginTrend.change).toFixed(1)}pp${marginTrend.changePct !== null ? ` (a ${Math.abs(marginTrend.changePct).toFixed(0)}% relative increase)` : ""} over the same window, so some of the re-rating tracks a better business.`
          : !rerated && improving
            ? `The multiple sits below the middle of its range while margins have been improving — the combination worth looking at more closely.`
            : `Both the multiple and margins sit in the lower part of their recent ranges, which is consistent rather than contradictory.`,
      tier: "INFERENCE",
      confidence: 0.4,
      why: `Combines the P/E percentile (${peDist.percentile.toFixed(0)}) with the direction of net margin over ${marginTrend.n} quarters (${marginTrend.change > 0 ? "+" : ""}${marginTrend.change.toFixed(2)}pp, moving the same way ${consistencyWord(marginTrend.consistency)}). Margin is one input into what a multiple should be — growth, capital intensity, buybacks and rates all matter and none are in this comparison.`,
      sources: [
        { kind: "fundamental-history", label: "P/E history", detail: `${peDist.n} quarters, current ${peDist.current.toFixed(2)}, median ${peDist.median.toFixed(2)}`, asOf: met.fetchedAt, metricKey: "peTTM", capability: "fundamental-history" },
        { kind: "fundamental-history", label: "Net margin history", detail: seriesDetail(hist(met.data, "netMargin"), 8, "%"), asOf: met.fetchedAt, metricKey: "netMargin", capability: "fundamental-history" },
      ],
    });
  }

  caveats.push(...capabilityCaveats(WANTED));

  return {
    title: `${name} — is the valuation expensive?`,
    mode: "valuation",
    headline: buildHeadline(claims, `${name} against its own valuation history`),
    claims, caveats,
    unavailable: unavailableList(WANTED),
    asOf: Date.now(),
    suggestions: [`What changed at ${symbol}?`, `Is earnings momentum improving at ${symbol}?`, `What are the key risks to ${symbol}?`],
  };
}

/* ── Pairwise comparison ─────────────────────────────────────────────────── */

export async function analyzeValuationPair(symA: string, symB: string): Promise<Answer> {
  const [ma, mb, pa, pb] = await Promise.all([
    fetchDataset<Metrics>("metrics", symA),
    fetchDataset<Metrics>("metrics", symB),
    fetchDataset<Profile>("profile", symA),
    fetchDataset<Profile>("profile", symB),
  ]);
  const nameA = (pa.ok && pa.data.name) || metaFor(symA)?.name || symA;
  const nameB = (pb.ok && pb.data.name) || metaFor(symB)?.name || symB;
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!ma.ok || !mb.ok) {
    return {
      title: `${nameA} vs ${nameB}`, mode: "valuation",
      headline: "Fundamental data was unavailable for at least one of these companies.",
      claims: [], caveats: ["Valuation metrics could not be retrieved for one side, so no comparison is possible."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const rows = [
    { label: "P/E (trailing)", key: "peTTM" }, { label: "P/E (forward)", key: "forwardPE" },
    { label: "PEG", key: "pegTTM" }, { label: "P/S", key: "psTTM" }, { label: "P/B", key: "pb" },
    { label: "EV/EBITDA", key: "evEbitdaTTM" }, { label: "Net margin %", key: "netProfitMarginTTM" },
    { label: "ROE %", key: "roeTTM" }, { label: "Revenue growth %", key: "revenueGrowthTTMYoy" },
    { label: "EPS growth %", key: "epsGrowthTTMYoy" },
  ].map((r) => ({ label: r.label, a: num(ma.data, r.key), b: num(mb.data, r.key), key: r.key }));

  const srcA: Source = { kind: "fundamentals", label: `${symA} fundamentals`, detail: rows.filter((r) => r.a !== null).map((r) => `${r.label} ${r.a!.toFixed(2)}`).join(" · "), asOf: ma.fetchedAt, capability: "fundamentals" };
  const srcB: Source = { kind: "fundamentals", label: `${symB} fundamentals`, detail: rows.filter((r) => r.b !== null).map((r) => `${r.label} ${r.b!.toFixed(2)}`).join(" · "), asOf: mb.fetchedAt, capability: "fundamentals" };

  const peA = num(ma.data, "peTTM"), peB = num(mb.data, "peTTM");
  if (peA && peB) {
    const prem = ((peA - peB) / peB) * 100;
    claims.push({
      text: `${nameA} trades at ${peA.toFixed(1)}× trailing earnings against ${nameB} at ${peB.toFixed(1)}× — a ${Math.abs(prem).toFixed(0)}% ${prem > 0 ? "premium" : "discount"}.`,
      tier: "CALCULATION", confidence: 0.95,
      why: "Both multiples as reported; the gap is arithmetic on them.",
      sources: [srcA, srcB],
      calculation: {
        expression: `(${peA.toFixed(2)} − ${peB.toFixed(2)}) ÷ ${peB.toFixed(2)} × 100`,
        inputs: [
          { label: `${symA} P/E`, metricKey: "peTTM", value: peA, asOf: ma.fetchedAt },
          { label: `${symB} P/E`, metricKey: "peTTM", value: peB, asOf: mb.fetchedAt },
        ],
        result: prem, unit: "%",
      },
    });

    const gA = num(ma.data, "epsGrowthTTMYoy"), gB = num(mb.data, "epsGrowthTTMYoy");
    if (gA !== null && gB !== null && gB !== 0) {
      const growthGapRel = ((gA - gB) / Math.abs(gB)) * 100;
      const sameDirection = Math.sign(prem) === Math.sign(growthGapRel);
      const proportionate = sameDirection && Math.abs(prem) <= Math.abs(growthGapRel) * 2;
      claims.push({
        text: proportionate
          ? `That gap is roughly proportionate to the growth difference (EPS growth ${gA.toFixed(1)}% vs ${gB.toFixed(1)}%, a ${growthGapRel.toFixed(0)}% relative gap).`
          : sameDirection
            ? `The ${Math.abs(prem).toFixed(0)}% gap is far larger than the growth difference explains — EPS growth differs by only ${Math.abs(growthGapRel).toFixed(0)}% relative, so something other than growth is carrying the valuation.`
            : `The gap runs against the growth difference (EPS growth ${gA.toFixed(1)}% vs ${gB.toFixed(1)}%), which is the kind of divergence worth investigating.`,
        tier: "INFERENCE", confidence: 0.4,
        why: `Compares the size of the valuation gap (${Math.abs(prem).toFixed(0)}%) with the relative growth gap (${Math.abs(growthGapRel).toFixed(0)}%), calling it proportionate only within a 2× band. That band is our convention, not a market standard. One year of growth is thin evidence, and multiples also reflect balance sheet, capital intensity, buybacks and cyclicality that this ignores.`,
        sources: [srcA, srcB],
        calculation: {
          expression: `growth gap = (${gA.toFixed(2)} − ${gB.toFixed(2)}) ÷ |${gB.toFixed(2)}| × 100; compared against valuation gap ${prem.toFixed(1)}%`,
          inputs: [
            { label: `${symA} EPS growth`, metricKey: "epsGrowthTTMYoy", value: gA },
            { label: `${symB} EPS growth`, metricKey: "epsGrowthTTMYoy", value: gB },
            { label: "valuation gap", value: prem },
          ],
          result: growthGapRel, unit: "% relative",
        },
      });
    }
  }

  caveats.push(...capabilityCaveats(["eps-estimates", "price-targets"]));
  if (rows.some((r) => r.a === null || r.b === null)) {
    caveats.push("Metrics not reported for one of the two companies are shown blank rather than guessed.");
  }

  return {
    title: `${nameA} vs ${nameB} — valuation`,
    mode: "valuation",
    headline: buildHeadline(claims, `${nameA} against ${nameB}`),
    claims, caveats,
    table: rows.map((r) => ({ label: r.label, a: r.a, b: r.b })),
    tableColumns: { a: symA, b: symB },
    unavailable: unavailableList(["eps-estimates", "price-targets"]),
    asOf: Date.now(),
    suggestions: [`Is ${symA}'s valuation expensive against its own history?`, `What are the key risks to ${symA}?`],
  };
}
