/**
 * GFT Signals — shared types.
 * Prediction fields are immutable after publish; only resolution fields mutate.
 */

export type SignalDirection = "BULLISH" | "BEARISH" | "NEUTRAL";

/** Extensible taxonomy — MVP uses the three primary directions. */
export type SignalType =
  | "BULLISH"
  | "BEARISH"
  | "NEUTRAL"
  | "BREAKOUT"
  | "REVERSAL"
  | "MOMENTUM"
  | "MEAN_REVERSION"
  | "EVENT_DRIVEN";

export type SignalTimeframe = "INTRADAY" | "1D" | "3D" | "1W" | "1M";

export type SignalStatus =
  | "PENDING"
  | "ACTIVE"
  | "TARGET_HIT"
  | "STOP_HIT"
  | "EXPIRED"
  | "INVALIDATED"
  | "AMBIGUOUS";

export type AssetType = "INDEX" | "EQUITY" | "FX" | "CRYPTO" | "COMMODITY" | "FUTURES" | "OPTIONS";

export type MarketRegion =
  | "US"
  | "INDIA"
  | "EUROPE"
  | "UK"
  | "ASIA"
  | "JAPAN"
  | "FX"
  | "CRYPTO"
  | "COMMODITIES"
  | "GLOBAL";

export type MarketRegime = "RISK_ON" | "RISK_OFF" | "NEUTRAL";

export interface SignalFactor {
  key: string;
  label: string;
  score: number;       // -100 … +100 (signed contribution)
  weight: number;      // 0…1
  polarity: "positive" | "negative" | "neutral";
  detail: string;
}

export interface MarketSnapshot {
  price: number;
  rsi: number;
  atr: number;
  sma20: number;
  sma50: number;
  sma200: number | null;
  volumeRatio: number;
  volatility: number;
  roc10: number;
  regime: MarketRegime;
  recentHigh20: number;
  recentLow20: number;
  support: number;
  resistance: number;
  capturedAt: number;
}

export interface Signal {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  market: MarketRegion;
  exchange: string;

  direction: SignalDirection;
  signalType: SignalType;

  entryLow: number;
  entryHigh: number;
  signalPrice: number;
  referencePrice: number;
  targetPrice: number;
  stopPrice: number;

  expectedReturn: number;
  expectedMove: number;
  risk: number;
  riskReward: number;
  confidence: number;

  timeframe: SignalTimeframe;
  modelName: string;
  modelVersion: string;
  reasoning: string;
  factors: SignalFactor[];

  createdAt: number;
  expiresAt: number;

  status: SignalStatus;

  entryPriceActual: number | null;
  exitPriceActual: number | null;
  realizedReturn: number | null;
  resolvedAt: number | null;
  resolutionNote: string | null;

  sourceSnapshot: MarketSnapshot;
  demo: boolean;
}

/** Fields that must never change after publish. */
export const IMMUTABLE_SIGNAL_FIELDS = [
  "id",
  "assetId",
  "symbol",
  "name",
  "assetType",
  "market",
  "exchange",
  "direction",
  "signalType",
  "entryLow",
  "entryHigh",
  "signalPrice",
  "referencePrice",
  "targetPrice",
  "stopPrice",
  "expectedReturn",
  "expectedMove",
  "risk",
  "riskReward",
  "confidence",
  "timeframe",
  "modelName",
  "modelVersion",
  "reasoning",
  "factors",
  "createdAt",
  "expiresAt",
  "sourceSnapshot",
  "demo",
] as const;

export interface SignalCandidate {
  direction: SignalDirection;
  signalType: SignalType;
  confidence: number;
  entryLow: number;
  entryHigh: number;
  targetPrice: number;
  stopPrice: number;
  expectedReturn: number;
  expectedMove: number;
  risk: number;
  riskReward: number;
  factors: SignalFactor[];
  reasoning: string;
  snapshot: MarketSnapshot;
}

export interface ModelScore {
  key: string;
  label: string;
  score: number; // -100 … +100
  detail: string;
}

export interface SignalModel {
  name: string;
  version: string;
  generateSignal(ctx: {
    asset: SignalAsset;
    candles: Array<{ t: number; o: number; h: number; l: number; c: number; v?: number }>;
    asOf: number;
  }): SignalCandidate | null;
}

export interface SignalAsset {
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  market: MarketRegion;
  exchange: string;
  timezone: string;
  marketOpenHour: number;
  marketOpenMinute: number;
  quoteSymbol: string; // key into market provider
}

export interface DailyPerformance {
  date: string; // YYYY-MM-DD
  signalsGenerated: number;
  targetHits: number;
  stopHits: number;
  expired: number;
  ambiguous: number;
  active: number;
  avgReturn: number | null;
  cumulativeReturn: number;
}

export interface PerformanceStats {
  totalSignals: number;
  resolvedSignals: number;
  targetHits: number;
  stopHits: number;
  expired: number;
  ambiguous: number;
  active: number;
  pending: number;
  winRate: number | null;
  targetHitRate: number | null;
  stopHitRate: number | null;
  expiredRate: number | null;
  ambiguousRate: number | null;
  averageWin: number | null;
  averageLoss: number | null;
  medianReturn: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  cumulativeReturn: number;
  maxDrawdown: number;
  averageHoldingPeriodMs: number | null;
  currentStreak: number;
  bestSignal: Signal | null;
  worstSignal: Signal | null;
  byMarket: Record<string, { n: number; winRate: number | null; avgReturn: number | null }>;
  byAsset: Record<string, { n: number; winRate: number | null; avgReturn: number | null }>;
  byTimeframe: Record<string, { n: number; winRate: number | null; avgReturn: number | null }>;
}

export interface AuditEvent {
  id: string;
  signalId: string;
  action: "created" | "published" | "activated" | "status_updated" | "resolved";
  at: number;
  detail: string;
  prevStatus?: SignalStatus;
  nextStatus?: SignalStatus;
}

export interface ModelVersion {
  name: string;
  version: string;
  description: string;
  createdAt: number;
  active: boolean;
}

export const MODEL_CORE: ModelVersion = {
  name: "GFT CORE",
  version: "v1.0",
  description: "Transparent baseline rule model: trend, momentum, volatility, volume, regime.",
  createdAt: Date.UTC(2026, 0, 1),
  active: true,
};

export const DISCLAIMER =
  "GFT Signals are model-generated market forecasts for informational purposes only and are not investment advice or a guarantee of future returns.";

export const MIN_RISK_REWARD = 1.5;
export const MAX_RISK_REWARD = 3.0;
export const MIN_CONFIDENCE = 58;
export const DEFAULT_DAILY_SIGNAL_LIMIT = 12;
