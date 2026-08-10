import type { MarketRegime, ModelScore } from "../types";
import type { Bar } from "../indicators";
import { closesOf, roc, sma } from "../indicators";

/**
 * Market regime proxy from price structure (risk-on / risk-off).
 * Not a macro model — a transparent technical proxy for MVP.
 */
export function MarketRegimeModel(bars: Bar[]): ModelScore & { regime: MarketRegime } {
  const closes = closesOf(bars);
  const s50 = sma(closes, 50);
  const rate = roc(closes, 20);
  const price = closes[closes.length - 1];
  if (s50 == null || rate == null || price == null) {
    return { key: "regime", label: "Market regime", score: 0, detail: "Insufficient history", regime: "NEUTRAL" };
  }
  let regime: MarketRegime = "NEUTRAL";
  if (price > s50 && rate > 1) regime = "RISK_ON";
  else if (price < s50 && rate < -1) regime = "RISK_OFF";

  const score = regime === "RISK_ON" ? 55 : regime === "RISK_OFF" ? -55 : 0;
  return {
    key: "regime",
    label: "Market regime",
    score,
    detail: `Regime proxy: ${regime.replace("_", "-")} (price vs 50D, 20D ROC)`,
    regime,
  };
}
