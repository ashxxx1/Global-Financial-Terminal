import type { Source } from "../market";
/**
 * GFT Financial Impact Copilot — evidence model.
 *
 * Same rule as the research engine: nothing is presented as a guaranteed
 * outcome. Claims are tagged FACT / INFERENCE / VIEW, confidence is computed
 * from named inputs, and missing data is stated rather than filled in.
 */

export type ImpactTier = "FACT" | "INFERENCE" | "VIEW";

export type ImpactMagnitude = "Low" | "Medium" | "High";
export type Horizon = "Short" | "Medium" | "Long";
export type Direction = "positive" | "negative" | "mixed" | "uncertain";
export type GftSignalKind = "POSITIVE" | "WATCH" | "NEGATIVE";
export type ThesisStatus = "STRENGTHENING" | "NEUTRAL" | "WEAKENING";
export type RegionFocus = "global" | "IN" | "US" | "EU";
export type RiskLevel = "low" | "medium" | "high";
export type DurationChoice = "3m" | "1y" | "2y";

export type EventKind =
  | "tariff"
  | "trade-tensions"
  | "oil-shock"
  | "rate-cut"
  | "rate-hike"
  | "rates-stay-high"
  | "fx-move"
  | "product-announcement"
  | "geopolitics"
  | "defence-spending"
  | "ai-cycle"
  | "portfolio-risk"
  | "news-event"
  | "generic";

export interface ExtractedEvent {
  raw: string;
  event: string;
  kind: EventKind;
  countries: string[];
  sectors: string[];
  industries: string[];
  companiesNamed: string[];
  commodities: string[];
  currencies: string[];
  macro: string[];
  horizon: Horizon;
  direction: Direction;
  mechanism: string;
  magnitudeHint: ImpactMagnitude;
  /** Parsed numeric shock when the question names one (oil $, bps, fx %). */
  shockValue: number | null;
  shockUnit: string | null;
  tags: string[];
  /** How clearly the question maps onto a known mechanism (0–1). */
  parseConfidence: number;
  parseNote: string;
}

export interface ScenarioAssumptions {
  oilPrice: number | null;
  duration: DurationChoice;
  region: RegionFocus;
  riskLevel: RiskLevel;
  shockValue: number | null;
}

export const DEFAULT_SCENARIO: ScenarioAssumptions = {
  oilPrice: null,
  duration: "1y",
  region: "global",
  riskLevel: "medium",
  shockValue: null,
};

export interface MetricPoint {
  label: string;
  value: string;
  source: string;
  asOf: number;
  simulated?: boolean;
}

export interface ReasoningTrace {
  event: string;
  mechanism: string;
  sectorExposure: string;
  companyExposure: string;
  financialData: string;
  historicalPrecedent: string;
  valuation: string;
  risks: string[];
  confidenceCalc: string;
}

export interface CompanyImpact {
  symbol: string;
  name: string;
  country: string;
  sector: string;
  side: "beneficiary" | "negative";
  why: string;
  impact: ImpactMagnitude;
  confidence: number;
  confidenceNote: string;
  signal: GftSignalKind;
  signalLabel: string;
  reason: string;
  evidence: string[];
  keyRisk: string;
  timeHorizon: string;
  metrics: MetricPoint[];
  reasoning: ReasoningTrace;
  quoteSource: Source | "none";
  lastPrice: string | null;
  changePct: number | null;
}

export interface SectorView {
  name: string;
  stance: "positive" | "mixed" | "negative";
  why: string;
}

export interface ImpactChainStep {
  label: string;
  text: string;
}

export interface Precedent {
  date: string;
  event: string;
  similarity: string;
  marketReaction: string;
  relevant: string;
  measuredReturns: { symbol: string; window: string; pct: number | null; note: string }[];
  dataAvailable: boolean;
}

export interface PortfolioHoldingHit {
  symbol: string;
  name: string;
  stance: "Positive" | "Negative" | "Watch";
  why: string;
  weightPct: number | null;
}

export interface PortfolioExposure {
  affected: number;
  positiveWeightPct: number;
  negativeWeightPct: number;
  holdings: PortfolioHoldingHit[];
  note: string;
}

export interface ConfidenceBreakdown {
  score: number;
  explanation: string;
  factors: { label: string; delta: number; note: string }[];
  insufficient: boolean;
}

export interface ImpactSource {
  label: string;
  detail: string;
  asOf: number;
  kind: "market" | "fundamentals" | "news" | "catalog" | "history" | "scenario";
  url?: string;
}

export interface ImpactAnalysis {
  id: string;
  question: string;
  asOf: number;
  extracted: ExtractedEvent;
  scenario: ScenarioAssumptions;
  chain: ImpactChainStep[];
  sectors: SectorView[];
  beneficiaries: CompanyImpact[];
  negatives: CompanyImpact[];
  watch: string[];
  risks: string[];
  confidence: ConfidenceBreakdown;
  precedents: Precedent[];
  portfolio: PortfolioExposure | null;
  sources: ImpactSource[];
  caveats: string[];
  relatedNews: { title: string; source: string; url: string; asOf: string }[];
  dataFreshness: string;
  disclaimer: string;
}

export interface SavedImpactAnalysis {
  id: string;
  savedAt: string;
  question: string;
  event: string;
  confidence: number;
  scenario: ScenarioAssumptions;
  signals: { symbol: string; signal: GftSignalKind; name: string }[];
  companies: string[];
  snapshot: ImpactAnalysis;
}

export interface MonitoredThesis {
  id: string;
  createdAt: string;
  question: string;
  event: string;
  expectedDirection: Direction;
  symbols: string[];
  tags: string[];
  status: ThesisStatus;
  lastCheckedAt: number;
  note: string;
}

export const IMPACT_DISCLAIMER =
  "This analysis is based on available data and scenarios and is not a guarantee of future performance. It is research-oriented context, not investment advice.";
