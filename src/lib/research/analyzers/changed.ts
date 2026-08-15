/**
 * "What changed?"
 *
 * The most-asked research question and the one most often answered with
 * narrative. Here it is answered structurally: take the metrics the company
 * itself reports each quarter, and find the ones whose latest reading departs
 * most from their own recent history. That surfaces what actually moved rather
 * than what someone chose to write about.
 *
 * Ranking is by standardised distance, so a 0.4pp move in a stable margin can
 * legitimately outrank a 3pp move in a volatile one. Reporting raw magnitudes
 * would just rank the noisiest lines every time.
 */
import { metaFor } from "../../market";
import { fetchDataset, type Metrics, type EarningsPoint } from "../data";
import { clean, trend, consistencyWord, seriesDetail } from "../series";
import type { Answer, Claim } from "../types";
import { buildHeadline, capabilityCaveats, unavailableList, hist,
} from "./shared";
import type { CapabilityId } from "../capabilities";

const WANTED: CapabilityId[] = [
  "fundamental-history", "earnings-surprises", "earnings-transcripts", "eps-estimates",
];

/** Quarterly series worth watching, with how to phrase a move in each. */
const WATCHED: { key: string; label: string; unit: string; goodUp: boolean }[] = [
  { key: "grossMargin", label: "Gross margin", unit: "pp", goodUp: true },
  { key: "operatingMargin", label: "Operating margin", unit: "pp", goodUp: true },
  { key: "netMargin", label: "Net margin", unit: "pp", goodUp: true },
  { key: "fcfMargin", label: "Free cash flow margin", unit: "pp", goodUp: true },
  { key: "roeTTM", label: "Return on equity", unit: "pp", goodUp: true },
  { key: "roicTTM", label: "Return on invested capital", unit: "pp", goodUp: true },
  { key: "totalDebtToEquity", label: "Debt to equity", unit: "", goodUp: false },
  { key: "currentRatio", label: "Current ratio", unit: "", goodUp: true },
  { key: "eps", label: "Reported EPS", unit: "", goodUp: true },
  { key: "salesPerShare", label: "Sales per share", unit: "", goodUp: true },
  { key: "inventoryTurnoverTTM", label: "Inventory turnover", unit: "×", goodUp: true },
];

interface Shift {
  label: string; key: string; unit: string; goodUp: boolean;
  latest: number; prior: number; change: number;
  /** Change in standard deviations of that metric's own quarterly changes. */
  z: number;
  sd: number; n: number; period: string;
}

export async function analyzeChanged(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const met = await fetchDataset<Metrics>("metrics", symbol);
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!met.ok) {
    return {
      title: `${name} — what changed`, mode: "changed",
      headline: "Reported fundamentals are not available for this symbol.",
      claims: [], caveats: ["Fundamental history could not be retrieved — typically a listing our data plan does not cover."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const shifts: Shift[] = [];
  for (const w of WATCHED) {
    const pts = clean(hist(met.data, w.key)).slice(0, 20);
    if (pts.length < 8) continue;
    const latest = pts[0].v, prior = pts[1].v;
    const change = latest - prior;

    // Standardise against this metric's own quarter-to-quarter volatility.
    const deltas: number[] = [];
    for (let i = 1; i < pts.length; i++) deltas.push(pts[i - 1].v - pts[i].v);
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const sd = Math.sqrt(deltas.reduce((a, d) => a + (d - mean) ** 2, 0) / Math.max(1, deltas.length - 1));
    if (!(sd > 0)) continue;

    shifts.push({
      label: w.label, key: w.key, unit: w.unit, goodUp: w.goodUp,
      latest, prior, change, z: change / sd, sd, n: pts.length, period: pts[0].period,
    });
  }

  shifts.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const notable = shifts.filter((s) => Math.abs(s.z) >= 1).slice(0, 4);

  if (notable.length === 0 && shifts.length > 0) {
    claims.push({
      text: `Nothing moved unusually in the latest reported quarter — every tracked metric changed by less than one standard deviation of its own history.`,
      tier: "CALCULATION", confidence: 0.85,
      why: `Compared ${shifts.length} quarterly metrics against the volatility of their own past changes. A quiet quarter is a real finding, and padding it with the largest raw move would misrepresent it.`,
      sources: shifts.slice(0, 5).map((s) => ({
        kind: "fundamental-history" as const, label: s.label,
        detail: `${s.period.slice(0, 7)}: ${s.latest.toFixed(2)} (prior ${s.prior.toFixed(2)}, typical move ±${s.sd.toFixed(2)})`,
        asOf: met.fetchedAt, metricKey: s.key, raw: s.latest, capability: "fundamental-history" as const,
      })),
    });
  }

  for (const s of notable) {
    const better = (s.change > 0) === s.goodUp;
    claims.push({
      text: `${s.label} moved from ${s.prior.toFixed(2)} to ${s.latest.toFixed(2)} in the quarter to ${s.period.slice(0, 7)} — a ${Math.abs(s.z).toFixed(1)}σ ${better ? "improvement" : "deterioration"} against its own normal quarterly swing of ±${s.sd.toFixed(2)}.`,
      tier: "CALCULATION",
      confidence: 0.9,
      why: `Latest minus prior quarter, divided by the standard deviation of the last ${s.n - 1} quarterly changes in the same metric. Standardising is what stops the noisiest line ranking first every quarter.`,
      sources: [{
        kind: "fundamental-history", label: `${s.label} history`,
        detail: seriesDetail(hist(met.data, s.key), 8, s.unit === "pp" ? "%" : s.unit),
        asOf: met.fetchedAt, metricKey: s.key, raw: s.latest, unit: s.unit, capability: "fundamental-history",
      }],
      calculation: {
        expression: `(${s.latest.toFixed(2)} − ${s.prior.toFixed(2)}) ÷ ${s.sd.toFixed(2)}`,
        inputs: [
          { label: "latest quarter", metricKey: s.key, value: s.latest, asOf: Date.parse(s.period) || met.fetchedAt },
          { label: "prior quarter", metricKey: s.key, value: s.prior },
          { label: "σ of quarterly changes", value: s.sd },
        ],
        result: s.z, unit: "σ", n: s.n - 1,
      },
    });
  }

  // Multi-quarter direction, so a single quarter is not read as a turn.
  const netMargin = trend(hist(met.data, "netMargin"), 8);
  if (netMargin) {
    claims.push({
      text: `Over eight quarters net margin has moved ${netMargin.change >= 0 ? "up" : "down"} ${Math.abs(netMargin.change).toFixed(2)}pp overall, ${consistencyWord(netMargin.consistency)}.`,
      tier: "CALCULATION", confidence: 0.85,
      why: `Newest minus oldest across ${netMargin.n} quarters, with the share of individual steps that moved the same way as the total (${(netMargin.consistency * 100).toFixed(0)}%). A steady drift and a noisy series with the same endpoints mean very different things.`,
      sources: [{
        kind: "fundamental-history", label: "Net margin history",
        detail: seriesDetail(hist(met.data, "netMargin"), 8, "%"),
        asOf: met.fetchedAt, metricKey: "netMargin", capability: "fundamental-history",
      }],
      calculation: {
        expression: `${netMargin.last.v.toFixed(2)} − ${netMargin.first.v.toFixed(2)}`,
        inputs: [
          { label: `newest (${netMargin.last.period.slice(0, 7)})`, metricKey: "netMargin", value: netMargin.last.v },
          { label: `oldest (${netMargin.first.period.slice(0, 7)})`, metricKey: "netMargin", value: netMargin.first.v },
        ],
        result: netMargin.change, unit: "pp", n: netMargin.n,
      },
    });
  }

  // The most recent print against consensus, as a FACT.
  const earn = await fetchDataset<EarningsPoint[]>("earnings", symbol);
  if (earn.ok && earn.data[0]) {
    const e = earn.data[0];
    if (e.actual !== null && e.estimate !== null) {
      claims.push({
        text: `Most recent print (${e.period}): EPS ${e.actual} against consensus ${e.estimate}, a ${(e.surprisePercent ?? 0) >= 0 ? "beat" : "miss"} of ${Math.abs(e.surprisePercent ?? 0).toFixed(1)}%.`,
        tier: "FACT", confidence: 1,
        why: "Reported actual and the consensus it was measured against, repeated as published.",
        sources: [{
          kind: "earnings", label: "Earnings surprise",
          detail: earn.data.slice(0, 4).map((x) => `${x.period}: ${x.actual} vs ${x.estimate}`).join(" · "),
          asOf: earn.fetchedAt, raw: e.actual, capability: "earnings-surprises",
        }],
      });
    }
  }

  caveats.push(...capabilityCaveats(WANTED));

  return {
    title: `${name} — what changed`,
    mode: "changed",
    headline: buildHeadline(claims, `Movements in ${name}'s reported numbers`),
    claims, caveats,
    unavailable: unavailableList(WANTED),
    asOf: Date.now(),
    suggestions: [`Is ${symbol}'s valuation expensive?`, `Is earnings momentum improving at ${symbol}?`, `What are the key risks to ${symbol}?`],
  };
}
