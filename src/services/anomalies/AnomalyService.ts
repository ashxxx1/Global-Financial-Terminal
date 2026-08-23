import { MOCK_ANOMALIES } from "../../data/anomalies";
import { findAnomaly, rankAnomalies, topAnomalies } from "../../lib/anomalies/engine";
import { ANOMALY_CATEGORIES, type Anomaly, type AnomalyCategory } from "../../types/anomaly";

/**
 * AnomalyService — catalog + ranking for the GFT Anomaly Detector.
 *
 * Today the source of truth is a typed mock covering all six categories.
 * Ranking, clamping and lookup are shared with the engine so a live scanner
 * can drop in without changing the Markets widget.
 */
export class AnomalyService {
  private catalog: Anomaly[];

  constructor(seed: readonly Anomaly[] = MOCK_ANOMALIES) {
    this.catalog = rankAnomalies(seed.map((a) => ({ ...a })));
  }

  list(): Anomaly[] {
    return this.catalog.slice();
  }

  top(n = 5): Anomaly[] {
    return topAnomalies(this.catalog, n);
  }

  getById(id: string): Anomaly | undefined {
    return findAnomaly(this.catalog, id);
  }

  byCategory(category: AnomalyCategory): Anomaly[] {
    return this.catalog.filter((a) => a.category === category);
  }

  categoriesPresent(): AnomalyCategory[] {
    const seen = new Set(this.catalog.map((a) => a.category));
    return ANOMALY_CATEGORIES.filter((c) => seen.has(c));
  }
}

let singleton: AnomalyService | null = null;

export function getAnomalyService(): AnomalyService {
  if (!singleton) singleton = new AnomalyService();
  return singleton;
}

export function resetAnomalyService(seed?: readonly Anomaly[]): AnomalyService {
  singleton = new AnomalyService(seed ?? MOCK_ANOMALIES);
  return singleton;
}
