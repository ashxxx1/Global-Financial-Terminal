/**
 * Daily signal generation pipeline (server-side / offline).
 * Never run this inside React render — call from jobs or store bootstrap.
 */
import { SIGNAL_ASSETS } from "./assets";
import { GftCoreModel } from "./engine";
import { getMarketDataProvider } from "./marketDataProvider";
import { validateCandidate, validatePublishedSignal } from "./validate";
import {
  DEFAULT_DAILY_SIGNAL_LIMIT,
  MODEL_CORE,
  type AuditEvent,
  type Signal,
  type SignalAsset,
  type SignalTimeframe,
} from "./types";

export interface GenerateOptions {
  asOf?: number;
  limit?: number;
  assets?: SignalAsset[];
  timeframe?: SignalTimeframe;
  demo?: boolean;
  /** Allow generation outside market open (next-session forecast). */
  allowClosedMarket?: boolean;
  modelName?: string;
  modelVersion?: string;
}

function timeframeMs(tf: SignalTimeframe): number {
  switch (tf) {
    case "INTRADAY": return 8 * 3600000;
    case "1D": return 24 * 3600000;
    case "3D": return 3 * 86400000;
    case "1W": return 7 * 86400000;
    case "1M": return 30 * 86400000;
  }
}

function signalId(assetId: string, asOf: number, modelVersion: string): string {
  const day = new Date(asOf).toISOString().slice(0, 10).replace(/-/g, "");
  return `sig_${assetId}_${day}_${modelVersion.replace(/\W/g, "")}`;
}

function rankScore(c: { confidence: number; riskReward: number }): number {
  return c.confidence * 0.6 + Math.min(c.riskReward, 3) * 12;
}

export function generateSignals(opts: GenerateOptions = {}): { signals: Signal[]; audits: AuditEvent[]; skipped: Array<{ assetId: string; reason: string }> } {
  const asOf = opts.asOf ?? Date.now();
  const limit = opts.limit ?? DEFAULT_DAILY_SIGNAL_LIMIT;
  const assets = opts.assets ?? SIGNAL_ASSETS;
  const timeframe = opts.timeframe ?? "1D";
  const demo = opts.demo ?? isDemoMode();
  const modelName = opts.modelName ?? MODEL_CORE.name;
  const modelVersion = opts.modelVersion ?? MODEL_CORE.version;
  const provider = getMarketDataProvider();

  const skipped: Array<{ assetId: string; reason: string }> = [];
  const candidates: Signal[] = [];

  for (const asset of assets) {
    const status = provider.getMarketStatus(asset, asOf);
    if (!opts.allowClosedMarket && !status.open && asset.assetType !== "CRYPTO" && asset.assetType !== "FX") {
      // Still allow next-session forecast within 90 minutes of open
      // getMarketStatus already softens the window; if closed, skip
      skipped.push({ assetId: asset.assetId, reason: "Market closed — no signal" });
      continue;
    }

    const quote = provider.getQuote(asset.quoteSymbol, asOf);
    if (!quote) {
      skipped.push({ assetId: asset.assetId, reason: "No quote" });
      continue;
    }

    const candles = provider.getHistoricalData(asset.quoteSymbol, "6M", asOf);
    // Attach synthetic volume for volume model when missing
    const withVol = candles.map((c, i) => ({ ...c, v: c.v ?? 800 + ((i * 37) % 400) }));

    const candidate = GftCoreModel.generateSignal({
      asset,
      candles: withVol,
      asOf,
    });

    if (!candidate) {
      skipped.push({ assetId: asset.assetId, reason: "Insufficient directional edge / NO SIGNAL" });
      continue;
    }

    const v = validateCandidate(candidate);
    if (!v.ok) {
      skipped.push({ assetId: asset.assetId, reason: `Rejected: ${v.errors.join("; ")}` });
      continue;
    }

    const id = signalId(asset.assetId, asOf, modelVersion);
    const signal: Signal = {
      id,
      assetId: asset.assetId,
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      market: asset.market,
      exchange: asset.exchange,
      direction: candidate.direction,
      signalType: candidate.signalType,
      entryLow: candidate.entryLow,
      entryHigh: candidate.entryHigh,
      signalPrice: candidate.snapshot.price,
      referencePrice: candidate.snapshot.price,
      targetPrice: candidate.targetPrice,
      stopPrice: candidate.stopPrice,
      expectedReturn: candidate.expectedReturn,
      expectedMove: candidate.expectedMove,
      risk: candidate.risk,
      riskReward: candidate.riskReward,
      confidence: candidate.confidence,
      timeframe,
      modelName,
      modelVersion,
      reasoning: candidate.reasoning,
      factors: candidate.factors,
      createdAt: asOf,
      expiresAt: asOf + timeframeMs(timeframe),
      status: "ACTIVE",
      entryPriceActual: null,
      exitPriceActual: null,
      realizedReturn: null,
      resolvedAt: null,
      resolutionNote: null,
      sourceSnapshot: candidate.snapshot,
      demo,
    };

    const pub = validatePublishedSignal(signal);
    if (!pub.ok) {
      skipped.push({ assetId: asset.assetId, reason: `Publish reject: ${pub.errors.join("; ")}` });
      continue;
    }
    candidates.push(signal);
  }

  candidates.sort((a, b) => rankScore(b) - rankScore(a));
  const selected = candidates.slice(0, limit);

  const audits: AuditEvent[] = selected.map((s) => ({
    id: `aud_${s.id}_created`,
    signalId: s.id,
    action: "published",
    at: asOf,
    detail: `Published ${s.direction} ${s.symbol} @ ${s.confidence}%`,
    nextStatus: "ACTIVE",
  }));

  return { signals: selected, audits, skipped };
}

export function isDemoMode(): boolean {
  try {
    const env = (import.meta as any)?.env;
    if (env?.VITE_SIGNALS_DEMO_MODE === "false") return false;
    if (env?.VITE_SIGNALS_LIVE === "true") return false;
    // Default demo until a live track record exists
    return true;
  } catch {
    return true;
  }
}

export function generateDailyReport(signals: Signal[], asOf = Date.now()): string {
  const day = new Date(asOf).toISOString().slice(0, 10);
  const todays = signals.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === day);
  const active = todays.filter((s) => s.status === "ACTIVE" || s.status === "PENDING").length;
  const hits = todays.filter((s) => s.status === "TARGET_HIT").length;
  const stops = todays.filter((s) => s.status === "STOP_HIT").length;
  const top = [...todays].sort((a, b) => b.confidence - a.confidence).slice(0, 3);

  const yDay = new Date(asOf - 86400000).toISOString().slice(0, 10);
  const ySignals = signals.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === yDay);
  const yHits = ySignals.filter((s) => s.status === "TARGET_HIT").length;

  const lines = [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "GFT DAILY MARKET SIGNALS",
    day,
    "",
    `${todays.length} SIGNALS`,
    "",
    `${active} ACTIVE`,
    `${hits} TARGETS HIT`,
    `${stops} STOP HIT`,
    "",
    "TOP CONVICTION",
    "",
    ...top.map((s) => `${s.symbol}\n${s.direction}\n${s.confidence}%`),
    "",
    "YESTERDAY",
    "",
    `${yHits} / ${ySignals.length}`,
    "TARGETS HIT",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ];
  return lines.join("\n");
}
