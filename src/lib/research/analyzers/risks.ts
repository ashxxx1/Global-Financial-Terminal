/**
 * "What are the key risks?"
 *
 * Measured against the company's own past rather than against fixed thresholds.
 * A debt-to-equity of 1.4 is unremarkable for one business and a warning for
 * another, so the useful statement is not "leverage is high" but "leverage is
 * the highest it has been in six years, and rising in most quarters since".
 *
 * Fixed thresholds still appear where they are genuinely conventional (a
 * current ratio below 1), and where they do, the text says the threshold is a
 * convention.
 */
import { metaFor } from "../../market";
import { fetchDataset, num, type Metrics, type InsiderResponse } from "../data";
import { distribution, trend, percentileWord, consistencyWord, seriesDetail } from "../series";
import type { Answer, Claim } from "../types";
import { buildHeadline, capabilityCaveats, unavailableList, hist,
} from "./shared";
import type { CapabilityId } from "../capabilities";

const WANTED: CapabilityId[] = [
  "fundamentals", "fundamental-history", "insider-transactions",
  "filing-text", "short-interest", "options-positioning",
];

/** Risk lines measured in historical context. `worseUp` sets which direction hurts. */
const RISK_SERIES: { key: string; label: string; worseUp: boolean; note: string }[] = [
  { key: "totalDebtToEquity", label: "Debt to equity", worseUp: true, note: "leverage" },
  { key: "longtermDebtTotalCapital", label: "Long-term debt to capital", worseUp: true, note: "leverage" },
  { key: "currentRatio", label: "Current ratio", worseUp: false, note: "liquidity" },
  { key: "grossMargin", label: "Gross margin", worseUp: false, note: "pricing power" },
  { key: "operatingMargin", label: "Operating margin", worseUp: false, note: "cost control" },
  { key: "fcfMargin", label: "Free cash flow margin", worseUp: false, note: "cash conversion" },
];

export async function analyzeRisks(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const [met, insider] = await Promise.all([
    fetchDataset<Metrics>("metrics", symbol),
    fetchDataset<InsiderResponse>("insider", symbol),
  ]);
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!met.ok) {
    return {
      title: `${name} — key risks`, mode: "risks",
      headline: "Fundamental data is not available for this symbol.",
      claims: [], caveats: ["Metrics could not be retrieved, so balance-sheet and margin risk cannot be assessed."],
      asOf: Date.now(), suggestions: [],
    };
  }

  // Rank risk lines by how unusual the current reading is *in the bad direction*.
  interface Flag { label: string; key: string; note: string; dist: NonNullable<ReturnType<typeof distribution>>; severity: number; worseUp: boolean }
  const flags: Flag[] = [];
  for (const r of RISK_SERIES) {
    const series = hist(met.data, r.key);
    const dist = distribution(series, 40);
    if (!dist) continue;
    // Severity is distance into the harmful tail: high percentile hurts when
    // worseUp, low percentile hurts otherwise.
    const severity = r.worseUp ? dist.percentile : 100 - dist.percentile;
    flags.push({ label: r.label, key: r.key, note: r.note, dist, severity, worseUp: r.worseUp });
  }
  flags.sort((a, b) => b.severity - a.severity);

  for (const f of flags.slice(0, 3)) {
    // 70, not 60: "modestly below the middle of its range" is not a key risk,
    // and listing it as one buries the readings that are.
    if (f.severity < 70) continue;
    const t = trend(hist(met.data, f.key), 8);
    // A level in the harmful tail that is *moving the healthy way* is a
    // different statement. Saying "this is a risk" while the number improves
    // reads as incoherent, and it is — so the text says both.
    const improving = t ? (t.change > 0) !== f.worseUp && Math.abs(t.change) > 1e-9 : false;
    claims.push({
      text: `${f.label} (${f.note}) is ${f.dist.current.toFixed(2)}, ${percentileWord(f.dist.percentile)} its own ${f.dist.n}-quarter range${
        t
          ? improving
            ? `, though it has been recovering — up ${Math.abs(t.change).toFixed(2)} over eight quarters ${consistencyWord(t.consistency)}`
            : `, and has moved ${t.change >= 0 ? "up" : "down"} ${Math.abs(t.change).toFixed(2)} over eight quarters ${consistencyWord(t.consistency)}`
          : ""
      }.`,
      tier: "CALCULATION",
      confidence: improving ? 0.75 : 0.85,
      why: `Current reading placed against ${f.dist.n} prior quarters of the same metric (median ${f.dist.median.toFixed(2)}, range ${f.dist.min.toFixed(2)}–${f.dist.max.toFixed(2)}). Ranked by how far into the harmful tail it sits, rather than against a fixed threshold that would mean different things for different businesses.`,
      sources: [{
        kind: "fundamental-history", label: `${f.label} history`,
        detail: seriesDetail(hist(met.data, f.key), 8),
        asOf: met.fetchedAt, metricKey: f.key, raw: f.dist.current, capability: "fundamental-history",
      }],
      calculation: {
        expression: `percentile of ${f.dist.current.toFixed(2)} within ${f.dist.n} prior quarters (${f.worseUp ? "higher is worse" : "lower is worse"})`,
        inputs: [
          { label: "current", metricKey: f.key, value: f.dist.current, asOf: met.fetchedAt },
          { label: "median", value: f.dist.median },
          { label: "min", value: f.dist.min },
          { label: "max", value: f.dist.max },
        ],
        result: f.dist.percentile, unit: "percentile", n: f.dist.n,
      },
    });
  }

  if (claims.length === 0) {
    claims.push({
      text: `No tracked balance-sheet or margin metric currently sits in an unusual part of its own historical range.`,
      tier: "CALCULATION", confidence: 0.8,
      why: `Checked ${flags.length} risk metrics against their own quarterly histories; none reached the 70th percentile in the harmful direction. That threshold is our convention.`,
      sources: flags.slice(0, 4).map((f) => ({
        kind: "fundamental-history" as const, label: f.label,
        detail: `current ${f.dist.current.toFixed(2)}, median ${f.dist.median.toFixed(2)}, ${f.dist.n} quarters`,
        asOf: met.fetchedAt, metricKey: f.key, capability: "fundamental-history" as const,
      })),
    });
  }

  // Fixed-threshold checks, flagged as conventions.
  const cr = num(met.data, "currentRatioQuarterly");
  if (cr !== null && cr < 1) {
    claims.push({
      text: `Current ratio of ${cr.toFixed(2)} is below 1: current liabilities exceed current assets.`,
      tier: "FACT", confidence: 1,
      why: "Reported figure against the conventional threshold of 1. Common and unalarming for businesses that convert cash quickly, so this is context rather than a verdict.",
      sources: [{ kind: "fundamentals", label: "Liquidity", detail: `currentRatioQuarterly ${cr.toFixed(4)}`, asOf: met.fetchedAt, metricKey: "currentRatioQuarterly", raw: cr, capability: "fundamentals" }],
    });
  }

  // Valuation-plus-beta as a downside-behaviour inference.
  const beta = num(met.data, "beta");
  const peDist = distribution(hist(met.data, "peTTM"), 40);
  if (beta !== null && peDist) {
    claims.push({
      text: `With a beta of ${beta.toFixed(2)} and a multiple ${percentileWord(peDist.percentile)} its own range, a disappointment would likely be punished more than average.`,
      tier: "INFERENCE", confidence: 0.35,
      why: `Links reported beta with the P/E percentile (${peDist.percentile.toFixed(0)} over ${peDist.n} quarters). High-multiple, high-beta names have historically de-rated harder on bad news, but that is a tendency observed across many stocks, not a measured property of this one.`,
      sources: [
        { kind: "fundamentals", label: "Beta", detail: `beta ${beta.toFixed(4)}`, asOf: met.fetchedAt, metricKey: "beta", raw: beta, capability: "fundamentals" },
        { kind: "fundamental-history", label: "P/E history", detail: `current ${peDist.current.toFixed(2)}, median ${peDist.median.toFixed(2)}, ${peDist.n} quarters`, asOf: met.fetchedAt, metricKey: "peTTM", capability: "fundamental-history" },
      ],
    });
  }

  if (insider.ok && insider.data.data && insider.data.data.length > 0) {
    const recent = insider.data.data.slice(0, 40);
    const sold = recent.filter((t) => (t.change ?? 0) < 0).length;
    const bought = recent.filter((t) => (t.change ?? 0) > 0).length;
    claims.push({
      text: `Insider filings in the latest window: ${bought} buys, ${sold} sells.`,
      tier: "FACT", confidence: 1,
      why: "Counted from reported filings. Sales frequently reflect scheduled 10b5-1 plans or tax events rather than any view on the business, so the raw count carries little signal on its own.",
      sources: [{
        kind: "insider", label: "Insider transactions",
        detail: recent.slice(0, 5).map((t) => `${t.name ?? "?"} ${(t.change ?? 0) > 0 ? "+" : ""}${t.change ?? "?"} on ${t.transactionDate ?? "?"}`).join(" · "),
        asOf: insider.fetchedAt, capability: "insider-transactions",
      }],
    });
  }

  caveats.push(...capabilityCaveats(WANTED));

  return {
    title: `${name} — key risks`,
    mode: "risks",
    headline: buildHeadline(claims, `What the numbers flag at ${name}`),
    claims, caveats,
    unavailable: unavailableList(WANTED),
    asOf: Date.now(),
    suggestions: [`What changed at ${symbol}?`, `Is ${symbol}'s valuation expensive?`],
  };
}
