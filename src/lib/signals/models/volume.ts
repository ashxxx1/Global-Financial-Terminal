import type { ModelScore } from "../types";
import type { Bar } from "../indicators";
import { volumeRatio } from "../indicators";

/** Volume relative to moving average. Neutral when volume unavailable. */
export function VolumeModel(bars: Bar[]): ModelScore {
  const ratio = volumeRatio(bars, 20);
  let score = 0;
  if (ratio >= 1.2) score = 40;
  else if (ratio >= 1.05) score = 20;
  else if (ratio <= 0.7) score = -25;
  // Volume alone is unsigned confirmation — caller combines with direction.
  const detail =
    ratio === 1 && bars.every((b) => b.v == null)
      ? "Volume unavailable — treated as neutral confirmation"
      : `Volume ratio ${ratio.toFixed(2)}× vs 20-bar average`;
  return { key: "volume", label: "Volume", score, detail };
}
