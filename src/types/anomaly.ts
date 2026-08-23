/** Shared types for the GFT Anomaly Detector. */

export const ANOMALY_CATEGORIES = [
  "PRICE",
  "VOLUME",
  "NEWS_PRICE",
  "SECTOR",
  "CORRELATION",
  "MACRO",
] as const;

export type AnomalyCategory = (typeof ANOMALY_CATEGORIES)[number];

export const FACTOR_STATUSES = [
  "normal",
  "elevated",
  "depressed",
  "aligned",
  "divergent",
  "broken",
] as const;

export type FactorStatus = (typeof FACTOR_STATUSES)[number];

export const ANOMALY_SEVERITIES = ["watch", "notable", "severe", "extreme"] as const;
export type AnomalySeverity = (typeof ANOMALY_SEVERITIES)[number];

/** One row in the investigation evidence table. */
export interface AnomalyFactor {
  factor: string;
  normalBaseline: string;
  currentObserved: string;
  status: FactorStatus;
}

/**
 * A flagged statistical divergence. Framing is evidence, not a trade call:
 * scores describe how unusual the observation is versus its own baseline.
 */
export interface Anomaly {
  id: string;
  tickerOrSector: string;
  title: string;
  category: AnomalyCategory;
  /** Integer 0–100. Higher = further from the historical baseline. */
  anomalyScore: number;
  /** ISO-8601 timestamp of the observation. */
  timestamp: string;
  summary: string;
  interpretation: string;
  factors: AnomalyFactor[];
  possibleExplanations: string[];
  /** Instrument used for Chart / News deep-links when it differs from the label. */
  primarySymbol?: string;
  /** Second leg for correlation / pair comparisons. */
  compareSymbol?: string;
  /** Sector page slug when the investigation should open a sector chart. */
  sectorSlug?: string;
}

export interface AnomalyLinks {
  chartPath: string;
  newsPath: string;
  impactPath: string;
}
