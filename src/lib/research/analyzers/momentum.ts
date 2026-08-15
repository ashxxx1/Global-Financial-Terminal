/**
 * "Is earnings momentum improving?"
 *
 * The honest version of this question is narrower than it sounds. Real earnings
 * momentum work leans on estimate revisions — are analysts raising next
 * quarter — and that dataset is paywalled for us. So this answers from three
 * things we can see: the surprise history, the reported EPS series, and how the
 * analyst rating mix has shifted. The gap is stated rather than papered over,
 * because "momentum improving" from realised results and from revisions can
 * point in opposite directions.
 */
import { metaFor } from "../../market";
import { fetchDataset, type Metrics, type EarningsPoint, type Recommendation } from "../data";
import { clean, trend, consistencyWord, seriesDetail } from "../series";
import type { Answer, Claim } from "../types";
import { buildHeadline, capabilityCaveats, unavailableList, hist,
} from "./shared";
import type { CapabilityId } from "../capabilities";

const WANTED: CapabilityId[] = [
  "earnings-surprises", "fundamental-history", "analyst-ratings",
  "eps-estimates", "revenue-estimates", "earnings-transcripts",
];

/** Weighted analyst score: strong buy +2 … strong sell −2, normalised. */
function ratingScore(r: Recommendation): number {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  return total === 0 ? 0 : (r.strongBuy * 2 + r.buy - r.sell - r.strongSell * 2) / total;
}

export async function analyzeMomentum(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const [earn, met, recs] = await Promise.all([
    fetchDataset<EarningsPoint[]>("earnings", symbol),
    fetchDataset<Metrics>("metrics", symbol),
    fetchDataset<Recommendation[]>("recommendations", symbol),
  ]);
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!earn.ok && !met.ok) {
    return {
      title: `${name} — earnings momentum`, mode: "momentum",
      headline: "No earnings data available for this symbol.",
      claims: [], caveats: ["Neither earnings surprises nor fundamental history could be retrieved."],
      asOf: Date.now(), suggestions: [],
    };
  }

  // 1. Surprise trajectory — magnitude, not just sign.
  if (earn.ok) {
    const sp = earn.data
      .filter((e) => typeof e.surprisePercent === "number")
      .map((e) => ({ period: e.period, v: e.surprisePercent as number }));
    if (sp.length >= 3) {
      const newest = sp[0].v, oldest = sp[sp.length - 1].v;
      const avg = sp.reduce((a, b) => a + b.v, 0) / sp.length;
      const beats = sp.filter((x) => x.v > 0).length;
      claims.push({
        text: `Beat consensus in ${beats} of the last ${sp.length} quarters, averaging ${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%; the newest surprise is ${newest.toFixed(1)}% against ${oldest.toFixed(1)}% ${sp.length} quarters ago.`,
        tier: "CALCULATION", confidence: 0.9,
        why: `Counted and averaged from the reported surprise percentages. Reporting the newest against the oldest as well as the average distinguishes a company that is pulling ahead from one with a good long-run record and a weak recent print.`,
        sources: [{
          kind: "earnings", label: "Surprise history",
          detail: sp.map((x) => `${x.period}: ${x.v >= 0 ? "+" : ""}${x.v.toFixed(1)}%`).join(" · "),
          asOf: earn.fetchedAt, capability: "earnings-surprises",
        }],
        calculation: {
          expression: `mean(${sp.map((x) => x.v.toFixed(1)).join(", ")})`,
          inputs: sp.map((x) => ({ label: x.period, value: x.v })),
          result: avg, unit: "%", n: sp.length,
        },
      });
    }
  }

  // 2. Reported EPS trend from the quarterly series — deeper than the four
  //    quarters the surprise endpoint returns.
  if (met.ok) {
    const epsPoints = clean(hist(met.data, "eps")).slice(0, 12);
    const epsTrend = trend(hist(met.data, "eps"), 12);
    if (epsTrend && epsPoints.length >= 6) {
      claims.push({
        text: `Reported EPS has moved from ${epsTrend.first.v.toFixed(2)} to ${epsTrend.last.v.toFixed(2)} over ${epsTrend.n} quarters (${epsTrend.changePct !== null ? `${epsTrend.changePct >= 0 ? "+" : ""}${epsTrend.changePct.toFixed(0)}%` : "—"}), rising ${consistencyWord(epsTrend.consistency)}.`,
        tier: "CALCULATION", confidence: 0.9,
        why: `Newest against oldest across ${epsTrend.n} quarters of reported EPS, plus the share of steps moving the same way (${(epsTrend.consistency * 100).toFixed(0)}%). Quarterly EPS is seasonal for many businesses, so the consistency figure matters more than the endpoints alone.`,
        sources: [{
          kind: "fundamental-history", label: "Reported EPS",
          detail: seriesDetail(hist(met.data, "eps"), 8),
          asOf: met.fetchedAt, metricKey: "eps", capability: "fundamental-history",
        }],
        calculation: {
          expression: `(${epsTrend.last.v.toFixed(2)} − ${epsTrend.first.v.toFixed(2)}) ÷ |${epsTrend.first.v.toFixed(2)}| × 100`,
          inputs: [
            { label: `newest (${epsTrend.last.period.slice(0, 7)})`, metricKey: "eps", value: epsTrend.last.v },
            { label: `oldest (${epsTrend.first.period.slice(0, 7)})`, metricKey: "eps", value: epsTrend.first.v },
          ],
          result: epsTrend.changePct ?? 0, unit: "%", n: epsTrend.n,
        },
      });
    }
  }

  // 3. Analyst rating drift — the closest available stand-in for revisions.
  if (recs.ok && recs.data.length >= 2) {
    const now = recs.data[0], prev = recs.data[recs.data.length - 1];
    const d = ratingScore(now) - ratingScore(prev);
    claims.push({
      text: `Analyst rating mix has ${Math.abs(d) < 0.05 ? "barely shifted" : d > 0 ? "improved" : "deteriorated"} since ${prev.period} (score ${ratingScore(prev).toFixed(2)} → ${ratingScore(now).toFixed(2)}).`,
      tier: "CALCULATION", confidence: 0.75,
      why: `Weighted rating score (strong buy +2, buy +1, hold 0, sell −1, strong sell −2, divided by analyst count). The weighting is our convention, not a market standard, and a rating mix is a much blunter instrument than the estimate revisions we cannot see.`,
      sources: [{
        kind: "analysts", label: "Analyst ratings",
        detail: recs.data.slice(0, 4).map((r) => `${r.period}: ${r.strongBuy}/${r.buy}/${r.hold}/${r.sell}/${r.strongSell}`).join(" · ") + " (strong buy/buy/hold/sell/strong sell)",
        asOf: Date.parse(now.period) || recs.fetchedAt, capability: "analyst-ratings",
      }],
      calculation: {
        expression: `(${now.strongBuy}×2 + ${now.buy} − ${now.sell} − ${now.strongSell}×2) ÷ ${now.strongBuy + now.buy + now.hold + now.sell + now.strongSell}`,
        inputs: [
          { label: "current score", value: ratingScore(now) },
          { label: `score at ${prev.period}`, value: ratingScore(prev) },
        ],
        result: d, unit: "score change",
      },
    });
  }

  // The inference, only when at least two independent signals exist.
  const calcs = claims.filter((c) => c.tier === "CALCULATION");
  if (calcs.length >= 2) {
    const positives = calcs.filter((c) => (c.calculation?.result ?? 0) > 0).length;
    const agree = positives === calcs.length || positives === 0;
    claims.push({
      text: agree
        ? `All ${calcs.length} measures point the same way, which is the stronger case for momentum ${positives > 0 ? "improving" : "weakening"} — though all three are backward-looking.`
        : `The measures disagree (${positives} of ${calcs.length} positive), so there is no clean momentum signal here.`,
      tier: "INFERENCE", confidence: agree ? 0.45 : 0.3,
      why: `Counts how many of the computed measures moved positively. Agreement across independent measures is more informative than any one, but every measure here describes what already happened; genuine earnings momentum work uses forward estimate revisions, which we cannot see.`,
      sources: calcs.flatMap((c) => c.sources).slice(0, 4),
    });
  }

  caveats.push(...capabilityCaveats(WANTED));

  return {
    title: `${name} — earnings momentum`,
    mode: "momentum",
    headline: buildHeadline(claims, `Earnings momentum at ${name}`),
    claims, caveats,
    unavailable: unavailableList(WANTED),
    asOf: Date.now(),
    suggestions: [`What changed at ${symbol}?`, `Is ${symbol}'s valuation expensive?`, `What are the key risks to ${symbol}?`],
  };
}
