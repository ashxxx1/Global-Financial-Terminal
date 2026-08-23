import type { Anomaly, AnomalyCategory, AnomalySeverity } from "../../types/anomaly";

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Map an absolute z-score onto the 0–100 anomaly scale.
 * ~2σ ≈ 55, ~3σ ≈ 76, ~4σ ≈ 88, ≥5σ saturates near 100.
 */
export function scoreFromZ(z: number): number {
  const abs = Math.abs(z);
  if (abs <= 0) return 0;
  return clampScore((1 - Math.exp(-abs / 2.05)) * 112);
}

/** Volume multiple vs trailing average → score (2× ≈ 48, 4× ≈ 78, 8× ≈ 94). */
export function scoreFromVolumeMultiple(multiple: number): number {
  const m = Math.max(0, multiple);
  return clampScore((1 - Math.exp(-(m - 1) / 2.4)) * 108);
}

/**
 * Divergence magnitude in percentage points (name vs benchmark, or two legs).
 * 4pp ≈ 52, 8pp ≈ 74, 14pp ≈ 90.
 */
export function scoreFromDivergencePp(points: number): number {
  const abs = Math.abs(points);
  return clampScore((1 - Math.exp(-abs / 6.2)) * 118);
}

export function severityForScore(score: number): AnomalySeverity {
  const s = clampScore(score);
  if (s >= 90) return "extreme";
  if (s >= 75) return "severe";
  if (s >= 60) return "notable";
  return "watch";
}

export function rankAnomalies(items: readonly Anomaly[]): Anomaly[] {
  return [...items].sort((a, b) => {
    if (b.anomalyScore !== a.anomalyScore) return b.anomalyScore - a.anomalyScore;
    const tb = Date.parse(b.timestamp);
    const ta = Date.parse(a.timestamp);
    if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
    return a.id.localeCompare(b.id);
  });
}

export function topAnomalies(items: readonly Anomaly[], n = 5): Anomaly[] {
  const count = Math.max(0, Math.floor(n));
  return rankAnomalies(items).slice(0, count);
}

export function findAnomaly(items: readonly Anomaly[], id: string): Anomaly | undefined {
  return items.find((a) => a.id === id);
}

export function categoriesCovered(items: readonly Anomaly[]): Set<AnomalyCategory> {
  return new Set(items.map((a) => a.category));
}

/** Typical 1-day σ used when a live quote is scored against a sector baseline. */
export const SECTOR_BASELINE_VOL: Record<string, number> = {
  Technology: 1.45,
  Automotive: 1.85,
  Energy: 1.55,
  "Mining & Resources": 1.7,
  "Banking & Finance": 1.15,
  Healthcare: 1.2,
  Consumer: 1.05,
  Industrial: 1.1,
  Defence: 1.25,
  Telecom: 0.95,
  Utilities: 0.8,
  "Real Estate": 1.15,
  Transportation: 1.5,
  Media: 1.35,
};

export function zFromDailyMove(changePct: number, sector: string): number {
  const vol = SECTOR_BASELINE_VOL[sector] ?? 1.25;
  if (vol <= 0) return 0;
  return changePct / vol;
}

export interface LiveQuoteInput {
  symbol: string;
  name: string;
  changePct: number;
  sector: string;
}

/**
 * Live price-tail scan. Flags names whose session move is ≥ ~2.4σ versus the
 * sector baseline. Output is evidence-shaped so the UI can render it the same
 * way as catalogued anomalies.
 */
export function detectPriceAnomalies(quotes: readonly LiveQuoteInput[], now = Date.now()): Anomaly[] {
  const out: Anomaly[] = [];
  for (const q of quotes) {
    const z = zFromDailyMove(q.changePct, q.sector);
    if (Math.abs(z) < 2.4) continue;
    const score = scoreFromZ(z);
    const dir = q.changePct >= 0 ? "up" : "down";
    const absPct = Math.abs(q.changePct).toFixed(2);
    out.push({
      id: `live-price-${q.symbol}`,
      tickerOrSector: q.symbol,
      title: `${q.symbol} ${absPct}% ${dir} versus sector volatility`,
      category: "PRICE",
      anomalyScore: score,
      timestamp: new Date(now).toISOString(),
      summary: `${q.name} is ${absPct}% ${dir} today — about ${Math.abs(z).toFixed(1)}σ versus a typical ${q.sector || "market"} session.`,
      interpretation:
        `GFT compared the session return to a sector baseline of ~${(SECTOR_BASELINE_VOL[q.sector] ?? 1.25).toFixed(2)}% one-day σ. ` +
        `A ${Math.abs(z).toFixed(1)}σ print is in the tail of that distribution. This is a statistical flag, not a directional call.`,
      factors: [
        {
          factor: "Session return",
          normalBaseline: `${q.changePct >= 0 ? "+" : ""}0.0% to ±${(SECTOR_BASELINE_VOL[q.sector] ?? 1.25).toFixed(1)}% (1σ)`,
          currentObserved: `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`,
          status: Math.abs(z) >= 3 ? "elevated" : "divergent",
        },
        {
          factor: "Z-score vs sector vol",
          normalBaseline: "|z| < 2.0",
          currentObserved: `${z >= 0 ? "+" : ""}${z.toFixed(2)}σ`,
          status: Math.abs(z) >= 3.5 ? "broken" : "elevated",
        },
      ],
      possibleExplanations: [
        "Idiosyncratic news or a filing the tape has not fully digested",
        "Block trading, options pin, or a rebalance print",
        "Sector-wide move mis-attributed to a single name",
        "Gap from a halt, listing event, or stale prior close",
      ],
      primarySymbol: q.symbol,
    });
  }
  return rankAnomalies(out);
}
