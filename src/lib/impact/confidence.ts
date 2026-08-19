/**
 * Confidence 0–100 from named evidence — never a mood.
 *
 * If the mapping is weak we cap the score and surface
 * "Insufficient evidence — confidence low." rather than a precise 82%.
 */
import type { Candidate } from "./universe";
import type { ConfidenceBreakdown, ExtractedEvent } from "./types";

export function scoreConfidence(opts: {
  extracted: ExtractedEvent;
  candidates: Candidate[];
  liveQuotes: number;
  liveFundamentals: number;
  precedentsWithData: number;
  newsHits: number;
  contradictory: number;
}): ConfidenceBreakdown {
  const factors: ConfidenceBreakdown["factors"] = [];
  let score = 18;

  const event = Math.round(opts.extracted.parseConfidence * 28);
  factors.push({ label: "Event mapping", delta: event, note: opts.extracted.parseNote });
  score += event;

  const exposure = Math.min(22, opts.candidates.filter((c) => c.score >= 70).length * 4);
  factors.push({ label: "Company exposure match", delta: exposure, note: `${opts.candidates.length} catalog matches; ${opts.candidates.filter((c) => c.score >= 70).length} with strong mechanism fit.` });
  score += exposure;

  const hist = Math.min(12, opts.precedentsWithData * 6 + (opts.precedentsWithData === 0 ? 0 : 2));
  factors.push({
    label: "Historical evidence",
    delta: hist,
    note: opts.precedentsWithData
      ? `${opts.precedentsWithData} precedent(s) with a measured price window.`
      : "Qualitative precedents only — no measured return window from a live candle source.",
  });
  score += hist;

  const dataQ = Math.min(16, opts.liveQuotes * 2 + opts.liveFundamentals * 3);
  factors.push({
    label: "Data quality",
    delta: dataQ,
    note: `${opts.liveQuotes} live/cached quotes, ${opts.liveFundamentals} fundamental snapshots. Simulated quotes do not raise this factor.`,
  });
  score += dataQ;

  const news = Math.min(8, opts.newsHits * 2);
  factors.push({ label: "Supporting news", delta: news, note: opts.newsHits ? `${opts.newsHits} related headline(s).` : "No confirming live headlines retrieved." });
  score += news;

  const contra = Math.min(18, opts.contradictory * 6);
  if (contra) {
    factors.push({ label: "Contradictory signals", delta: -contra, note: "Offsetting mechanism matches or missing catalog coverage." });
    score -= contra;
  }

  score = Math.max(8, Math.min(92, score));
  const insufficient = opts.extracted.parseConfidence < 0.4 || opts.candidates.length < 2;
  if (insufficient) score = Math.min(score, 38);

  const explanation = insufficient
    ? "Insufficient evidence — confidence low. The question does not map cleanly onto companies and data we actually hold."
    : `Confidence ${score}% is the sum of the listed factors, capped so missing live fundamentals cannot look like precision.`;

  return { score, explanation, factors, insufficient };
}

export function companyConfidence(base: number, live: boolean, fundamentals: boolean, parse: number): { score: number; note: string } {
  let score = Math.round(base * 0.7 + parse * 25);
  if (live) score += 6;
  if (fundamentals) score += 8;
  else score = Math.min(score, 72);
  score = Math.max(12, Math.min(90, score));
  const note = fundamentals
    ? "Mechanism fit plus a retrieved fundamental snapshot."
    : live
      ? "Mechanism fit plus a market quote. No fundamental snapshot for this listing on the current data plan."
      : "Catalog mechanism fit only. Quote is simulated or missing — do not read the percentage as market-implied probability.";
  return { score, note };
}
