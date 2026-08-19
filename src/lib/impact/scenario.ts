/**
 * Scenario knobs. Changing an assumption re-runs ranking with a mutated event
 * rather than restyling the same answer.
 */
import type { ExtractedEvent, RegionFocus, ScenarioAssumptions } from "./types";
import { DEFAULT_SCENARIO } from "./types";

export function scenarioFromExtracted(ev: ExtractedEvent): ScenarioAssumptions {
  return {
    ...DEFAULT_SCENARIO,
    oilPrice: ev.commodities.includes("oil") ? (ev.shockValue ?? 120) : null,
    shockValue: ev.shockValue,
    region: ev.countries.includes("IN") && ev.countries.length === 1 ? "IN"
      : ev.countries.includes("US") && ev.countries.length === 1 ? "US"
        : "global",
    duration: ev.horizon === "Short" ? "3m" : ev.horizon === "Long" ? "2y" : "1y",
    riskLevel: ev.magnitudeHint === "High" ? "high" : ev.magnitudeHint === "Low" ? "low" : "medium",
  };
}

export function applyScenario(ev: ExtractedEvent, s: ScenarioAssumptions): ExtractedEvent {
  const next: ExtractedEvent = { ...ev, countries: [...ev.countries], tags: [...ev.tags] };
  if (s.oilPrice != null) {
    next.shockValue = s.oilPrice;
    next.shockUnit = "USD/bbl";
    next.event = next.event.replace(/\$\s?\d{2,3}/, `$${s.oilPrice}`);
    if (!/\$\s?\d{2,3}/.test(next.event) && next.kind === "oil-shock") {
      next.event = `Oil at $${s.oilPrice}`;
    }
    if (s.oilPrice >= 140) next.magnitudeHint = "High";
    else if (s.oilPrice >= 100) next.magnitudeHint = "Medium";
  }
  if (s.shockValue != null && next.kind !== "oil-shock") next.shockValue = s.shockValue;
  if (s.region !== "global") {
    const map: Record<RegionFocus, string> = { global: "", IN: "IN", US: "US", EU: "DE" };
    const code = map[s.region];
    if (code && !next.countries.includes(code)) next.countries = [code, ...next.countries];
  }
  next.horizon = s.duration === "3m" ? "Short" : s.duration === "2y" ? "Long" : "Medium";
  if (s.riskLevel === "high") next.magnitudeHint = "High";
  if (s.riskLevel === "low" && next.magnitudeHint === "High") next.magnitudeHint = "Medium";
  return next;
}

export function durationLabel(d: ScenarioAssumptions["duration"]): string {
  return d === "3m" ? "3 months" : d === "2y" ? "2 years" : "1 year";
}
