import { MOCK_ANOMALIES } from "../../data/anomalies";
import { ANOMALY_CATEGORIES } from "../../types/anomaly";
import {
  clampScore,
  detectPriceAnomalies,
  rankAnomalies,
  scoreFromDivergencePp,
  scoreFromVolumeMultiple,
  scoreFromZ,
  severityForScore,
  topAnomalies,
} from "./engine";
import { resolveAnomalyLinks } from "./format";
import { AnomalyService } from "../../services/anomalies/AnomalyService";

export function runAnomalySelftest(): { name: string; ok: boolean; detail?: string }[] {
  const out: { name: string; ok: boolean; detail?: string }[] = [];
  const check = (name: string, ok: boolean, detail?: string) => { out.push({ name, ok, detail }); };

  check("clamp floors at 0", clampScore(-12) === 0);
  check("clamp caps at 100", clampScore(140) === 100);
  check("clamp rounds", clampScore(61.4) === 61);

  check("2σ maps to notable band", severityForScore(scoreFromZ(2)) === "notable", `${scoreFromZ(2)} ${severityForScore(scoreFromZ(2))}`);
  check("3σ is severe or higher", scoreFromZ(3) >= 70, String(scoreFromZ(3)));
  check("5σ saturates near 100", scoreFromZ(5) >= 90, String(scoreFromZ(5)));
  check("4× volume is severe-ish", scoreFromVolumeMultiple(4) >= 70, String(scoreFromVolumeMultiple(4)));
  check("12pp divergence is extreme-ish", scoreFromDivergencePp(12) >= 80, String(scoreFromDivergencePp(12)));

  const ranked = rankAnomalies(MOCK_ANOMALIES);
  check("catalog is non-empty", ranked.length >= 6, String(ranked.length));
  check("scores are monotonic after rank", ranked.every((a, i) => i === 0 || ranked[i - 1].anomalyScore >= a.anomalyScore));
  check("every score in 0–100", ranked.every((a) => a.anomalyScore >= 0 && a.anomalyScore <= 100));
  check("required fields present", ranked.every((a) =>
    Boolean(a.id && a.tickerOrSector && a.title && a.category && a.summary && a.interpretation && a.timestamp)
    && a.factors.length > 0
    && a.possibleExplanations.length > 0));

  const cats = new Set(ranked.map((a) => a.category));
  check("all six categories in mock catalog", ANOMALY_CATEGORIES.every((c) => cats.has(c)), [...cats].join(","));

  const top5 = topAnomalies(MOCK_ANOMALIES, 5);
  check("top 5 length", top5.length === 5);
  check("top 5 first is max score", top5[0].anomalyScore === ranked[0].anomalyScore);

  const svc = new AnomalyService();
  check("service top matches engine", svc.top(5).map((a) => a.id).join() === top5.map((a) => a.id).join());
  check("service getById", svc.getById(top5[0].id)?.id === top5[0].id);
  check("service covers six categories", svc.categoriesPresent().length === 6, String(svc.categoriesPresent().length));

  const live = detectPriceAnomalies([
    { symbol: "TEST", name: "Test Co", changePct: -8.2, sector: "Technology" },
    { symbol: "QUIET", name: "Quiet Co", changePct: 0.2, sector: "Utilities" },
  ], Date.parse("2026-08-21T12:00:00.000Z"));
  check("live detector flags 8% tech drop", live.some((a) => a.id === "live-price-TEST"));
  check("live detector ignores quiet utility", !live.some((a) => a.id === "live-price-QUIET"));
  check("live detector is PRICE category", live[0]?.category === "PRICE");

  const corr = ranked.find((a) => a.category === "CORRELATION");
  const macro = ranked.find((a) => a.category === "MACRO");
  check("correlation chart is a compare pair", Boolean(corr && resolveAnomalyLinks(corr).chartPath.startsWith("/compare/")), corr && resolveAnomalyLinks(corr).chartPath);
  check("macro chart goes to /macro", macro ? resolveAnomalyLinks(macro).chartPath === "/macro" : false);
  check("impact links are non-empty", ranked.every((a) => resolveAnomalyLinks(a).impactPath.includes("/impact?q=")));

  return out;
}
