/**
 * Map mechanism + evidence onto a GFT signal.
 *
 * Language is deliberately non-advisory: Positive GFT signal / Watch /
 * Negative GFT signal. BUY/WATCH/AVOID exist as internal kinds only.
 */
import { companyConfidence } from "./confidence";
import type { Candidate } from "./universe";
import type { CompanyImpact, ExtractedEvent, Horizon, MetricPoint, ReasoningTrace } from "./types";

function horizonLabel(h: Horizon, duration: string): string {
  if (duration === "3m") return "0–3 months";
  if (duration === "2y") return "12–24 months";
  if (h === "Short") return "0–6 months";
  if (h === "Long") return "12–24 months";
  return "6–12 months";
}

function impactBand(score: number): CompanyImpact["impact"] {
  if (score >= 78) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function signalOf(side: Candidate["side"], score: number): CompanyImpact["signal"] {
  if (side === "beneficiary" && score >= 62) return "POSITIVE";
  if (side === "negative" && score >= 62) return "NEGATIVE";
  return "WATCH";
}

function labelOf(sig: CompanyImpact["signal"], side: Candidate["side"]): string {
  if (sig === "POSITIVE") return "Positive GFT signal · potential beneficiary";
  if (sig === "NEGATIVE") return "Negative GFT signal · potentially exposed";
  return side === "beneficiary" ? "Watch · potential beneficiary" : "Watch · potentially exposed";
}

export function toCompanyImpact(
  c: Candidate,
  ev: ExtractedEvent,
  extras: {
    metrics: MetricPoint[];
    quoteSource: CompanyImpact["quoteSource"];
    lastPrice: string | null;
    changePct: number | null;
    duration: string;
    precedentNote: string;
    catalogCaveat?: string | null;
  },
): CompanyImpact {
  const live = extras.quoteSource === "live" || extras.quoteSource === "cached";
  const fundamentals = extras.metrics.some((m) => m.source.toLowerCase().includes("finnhub") || m.source.toLowerCase().includes("fundamental"));
  const conf = companyConfidence(c.score, live, fundamentals, ev.parseConfidence);
  const signal = signalOf(c.side, c.score);
  const risks = defaultRisks(ev.kind);
  const reasoning: ReasoningTrace = {
    event: ev.event,
    mechanism: ev.mechanism,
    sectorExposure: `${c.sector} in ${c.country || "unspecified market"}.`,
    companyExposure: `${c.why}${extras.catalogCaveat ? ` ${extras.catalogCaveat}` : ""}`,
    financialData: extras.metrics.length
      ? extras.metrics.map((m) => `${m.label}: ${m.value} (${m.source})`).join("; ")
      : "No retrieved fundamental snapshot for this listing.",
    historicalPrecedent: extras.precedentNote,
    valuation: extras.metrics.find((m) => /p\/e|pe /i.test(m.label))
      ? "A multiple is shown where retrieved. It is context, not a target."
      : "No valuation multiple retrieved — none is invented.",
    risks,
    confidenceCalc: conf.note,
  };

  return {
    symbol: c.symbol,
    name: c.name,
    country: c.country,
    sector: c.sector,
    side: c.side,
    why: c.why,
    impact: impactBand(c.score),
    confidence: conf.score,
    confidenceNote: conf.note,
    signal,
    signalLabel: labelOf(signal, c.side),
    reason: c.why,
    evidence: [
      `FACT: ${c.name} (${c.symbol}) is listed in the GFT universe as ${c.sector} / ${c.country || "—"}.`,
      `INFERENCE: ${c.why}`,
      `GFT VIEW: ${labelOf(signal, c.side)} — research signal, not a recommendation to transact.`,
    ],
    keyRisk: risks[0],
    timeHorizon: horizonLabel(ev.horizon, extras.duration),
    metrics: extras.metrics,
    reasoning,
    quoteSource: extras.quoteSource,
    lastPrice: extras.lastPrice,
    changePct: extras.changePct,
  };
}

export function defaultRisks(kind: string): string[] {
  switch (kind) {
    case "tariff":
    case "trade-tensions":
      return ["Policy reversal or carve-outs", "Demand destruction from higher prices", "Retaliation hitting exporters on the other side"];
    case "oil-shock":
      return ["Price mean-reversion", "Demand destruction / recession", "OPEC+ supply response"];
    case "rate-cut":
    case "rate-hike":
    case "rates-stay-high":
      return ["Path of policy differs from the scenario", "Credit losses offset NII gains", "Inflation re-accelerates"];
    case "fx-move":
      return ["RBI / central-bank intervention", "Hedge ratios mute translation gains", "Volume loss if clients cut IT budgets"];
    case "geopolitics":
      return ["Scenario does not materialise", "Policy / insurance backstops", "Secondary sanctions path differs"];
    case "ai-cycle":
    case "product-announcement":
      return ["Adoption slower than the product cycle implies", "Capex pause", "Competitive response"];
    default:
      return ["Scenario assumptions fail", "Company-specific offsetting news", "Liquidity / risk-off overwhelms the mechanism"];
  }
}
