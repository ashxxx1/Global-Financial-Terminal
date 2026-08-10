import { TrendModel } from "./trend";
import { MomentumModel } from "./momentum";
import { VolatilityModel } from "./volatility";
import { VolumeModel } from "./volume";
import { MarketRegimeModel } from "./regime";
import { SupportResistanceModel } from "./supportResistance";
import { EventRiskModel } from "./eventRisk";
import type { Bar } from "../indicators";
import type { ModelScore, MarketRegime } from "../types";

export interface FactorBundle {
  scores: ModelScore[];
  regime: MarketRegime;
  support: number;
  resistance: number;
}

export function runModularModels(bars: Bar[]): FactorBundle {
  const trend = TrendModel(bars);
  const momentum = MomentumModel(bars);
  const volatility = VolatilityModel(bars);
  const volume = VolumeModel(bars);
  const regime = MarketRegimeModel(bars);
  const levels = SupportResistanceModel(bars);
  const eventRisk = EventRiskModel(bars);
  return {
    scores: [trend, momentum, volatility, volume, regime, levels, eventRisk],
    regime: regime.regime,
    support: levels.support,
    resistance: levels.resistance,
  };
}
