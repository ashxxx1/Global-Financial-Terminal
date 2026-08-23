import type { Anomaly, AnomalyCategory, AnomalyLinks, AnomalySeverity, FactorStatus } from "../../types/anomaly";
import { clampScore, severityForScore } from "./engine";

export const CATEGORY_LABEL: Record<AnomalyCategory, string> = {
  PRICE: "Price anomaly",
  VOLUME: "Volume anomaly",
  NEWS_PRICE: "News vs price",
  SECTOR: "Sector divergence",
  CORRELATION: "Correlation breakdown",
  MACRO: "Macro divergence",
};

export const SEVERITY_LABEL: Record<AnomalySeverity, string> = {
  watch: "Watch",
  notable: "Notable",
  severe: "Severe",
  extreme: "Extreme",
};

export const FACTOR_STATUS_LABEL: Record<FactorStatus, string> = {
  normal: "Normal",
  elevated: "Elevated",
  depressed: "Depressed",
  aligned: "Aligned",
  divergent: "Divergent",
  broken: "Broken",
};

export function formatAnomalyRank(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function formatAnomalyTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }) + " UTC";
}

export function primarySymbolOf(anomaly: Anomaly): string {
  if (anomaly.primarySymbol) return anomaly.primarySymbol;
  const token = anomaly.tickerOrSector.split(/[·,/|&]/)[0]?.trim() ?? anomaly.tickerOrSector;
  return token.replace(/\s+/g, "");
}

export function resolveAnomalyLinks(anomaly: Anomaly): AnomalyLinks {
  const symbol = primarySymbolOf(anomaly);
  let chartPath: string;
  if (anomaly.compareSymbol) {
    chartPath = `/compare/${encodeURIComponent(symbol)}/${encodeURIComponent(anomaly.compareSymbol)}`;
  } else if (anomaly.category === "MACRO") {
    chartPath = "/macro";
  } else if (anomaly.sectorSlug && !anomaly.primarySymbol) {
    chartPath = `/sector/${encodeURIComponent(anomaly.sectorSlug)}`;
  } else {
    chartPath = `/stock/${encodeURIComponent(symbol)}`;
  }
  const newsQuery = [symbol, anomaly.compareSymbol].filter(Boolean).join(" ") || anomaly.tickerOrSector;
  const impactQ = `${anomaly.tickerOrSector}: ${anomaly.summary}`;
  return {
    chartPath,
    newsPath: `/news?q=${encodeURIComponent(newsQuery)}`,
    impactPath: `/impact?q=${encodeURIComponent(impactQ)}`,
  };
}

export interface ScoreTone {
  color: string;
  bg: string;
  border: string;
}

export function scoreTone(score: number): ScoreTone {
  const sev = severityForScore(clampScore(score));
  if (sev === "extreme") {
    return { color: "var(--down)", bg: "var(--down-dim)", border: "rgba(255, 77, 94, 0.55)" };
  }
  if (sev === "severe") {
    return { color: "#FF8A4D", bg: "rgba(255, 138, 77, 0.14)", border: "rgba(255, 138, 77, 0.45)" };
  }
  if (sev === "notable") {
    return { color: "var(--gold)", bg: "var(--gold-dim)", border: "rgba(255, 255, 255, 0.35)" };
  }
  return { color: "var(--muted)", bg: "rgba(255,255,255,0.04)", border: "var(--line)" };
}

export function factorStatusTone(status: FactorStatus): string {
  if (status === "broken" || status === "divergent") return "var(--down)";
  if (status === "elevated") return "#FF8A4D";
  if (status === "depressed") return "var(--blue)";
  if (status === "aligned") return "var(--up)";
  return "var(--muted)";
}
