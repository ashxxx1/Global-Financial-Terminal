/**
 * engine.js — the intelligence pipeline (spec Steps 2–5).
 *
 * processEvent(raw) takes a raw news item and returns a fully enriched event:
 *   - classification (country, sectors, sentiment, importance, urgency)
 *   - AI analysis (why it matters, implications, confidence, risk/opportunity)
 *   - historical correlation (cross-sector knock-on effects)
 *   - stock predictions (prob up/down, confidence, reasoning, horizon)
 *
 * All AI-derived fields are heuristic and labeled `generated: "ai"` so the
 * frontend can clearly distinguish them from verified facts (spec final goal).
 * When a real LLM key is wired in, swap `aiAnalyze()` for the model call.
 */
import { analyzeHeadline } from "../src/lib/newsSignals.js";
import { STOCKS_BY_COUNTRY } from "../src/data/stocksData.js";

// ── Step 4: historical correlation patterns (event → knock-on effects) ───────
// "When X happens, these sectors historically move this way." Probability-based.
const CORRELATIONS = [
  { match: /oil|crude|opec|gas prices/i, effects: [
    { sector: "Energy", dir: +1, note: "energy producers historically rise on higher oil" },
    { sector: "Transportation", dir: -1, note: "airlines/logistics historically fall on fuel costs" },
    { sector: "Utilities", dir: -1, note: "power costs historically pressure utilities" },
  ]},
  { match: /rate cut|rate hike|central bank|inflation|fed |interest rate/i, effects: [
    { sector: "Banking & Finance", dir: +1, note: "rate moves historically drive bank margins" },
    { sector: "Real Estate", dir: +1, note: "property historically sensitive to rates" },
  ]},
  { match: /chip|semiconductor|ai |artificial intelligence/i, effects: [
    { sector: "Technology", dir: +1, note: "AI/chip demand historically lifts tech" },
  ]},
  { match: /sanction|war|conflict|tariff|trade restriction/i, effects: [
    { sector: "Defence", dir: +1, note: "defence historically rises on conflict" },
    { sector: "Mining & Resources", dir: +1, note: "commodities historically rise on supply risk" },
    { sector: "Industrial", dir: -1, note: "trade friction historically hurts exporters" },
  ]},
];

let idSeq = 0;

// Detect importance/urgency from strong-signal words.
const HIGH_IMPACT = /crisis|emergency|record|crash|surge|default|war|sanction|collapse|breaking/i;

function canonicalKey(title = "") {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").slice(0, 6).join("-");
}

// ── Step 3: AI analysis (heuristic; replace with LLM when a key is available) ─
function aiAnalyze(raw, sentiment, sectors) {
  const dir = sentiment > 0.1 ? "positive" : sentiment < -0.1 ? "negative" : "mixed";
  const sectorList = sectors.length ? sectors.join(", ") : "broad market";
  return {
    generated: "ai",
    summary: raw.description || raw.title,
    whyItMatters: `Signals a ${dir} shift for ${sectorList} in ${raw.country}, based on sentiment and sector exposure.`,
    marketImplications:
      dir === "positive" ? "Supportive for exposed equities; watch for follow-through."
      : dir === "negative" ? "Headwind for exposed equities; risk of further downside."
      : "Impact unclear pending confirmation.",
    confidence: Math.round(40 + Math.abs(sentiment) * 45),
    riskLevel: HIGH_IMPACT.test(raw.title) ? "Elevated" : "Moderate",
    opportunityLevel: dir === "positive" ? "High" : dir === "negative" ? "Low" : "Medium",
  };
}

// ── Step 5: prediction engine (weighted, multi-factor, with reasoning) ───────
function predict(country, sectors, sentiment, correlations) {
  const stocksBySector = {};
  for (const s of STOCKS_BY_COUNTRY[country] || []) (stocksBySector[s.sector] ||= []).push(s);

  const preds = [];
  const seen = new Set([...sectors]);
  // add correlated sectors
  for (const c of correlations) for (const e of c.effects) seen.add(e.sector);

  for (const sector of seen) {
    const affected = (stocksBySector[sector] || []).slice(0, 4);
    if (!affected.length) continue;

    // weighted score: direct sentiment (0.6) + historical correlation (0.4)
    const corr = correlations.flatMap((c) => c.effects).filter((e) => e.sector === sector);
    const corrDir = corr.reduce((a, e) => a + e.dir, 0);
    const direct = sectors.includes(sector) ? sentiment : 0;
    const score = Math.max(-1, Math.min(1, direct * 0.6 + Math.sign(corrDir) * 0.4 * (corr.length ? 1 : 0)));

    const probUp = Math.round(50 + score * 45);
    const reasons = [];
    if (sectors.includes(sector)) reasons.push(`direct news sentiment (${direct > 0 ? "+" : ""}${direct.toFixed(2)})`);
    for (const e of corr) reasons.push(e.note);

    preds.push({
      generated: "ai",
      sector,
      tickers: affected.map((a) => a.ticker),
      label: score > 0.12 ? "Likely Rise" : score < -0.12 ? "Likely Fall" : "Neutral",
      probUp,
      probDown: 100 - probUp,
      expectedMovePct: Number((score * 3).toFixed(1)), // rough magnitude
      confidence: Math.round(45 + Math.abs(score) * 40),
      horizon: Math.abs(score) > 0.5 ? "1 Week" : "1 Month",
      reasoning: reasons.length ? reasons.join("; ") : "insufficient signal — neutral",
    });
  }
  return preds.sort((a, b) => b.confidence - a.confidence);
}

export function processEvent(raw) {
  const { sentiment, sectors } = analyzeHeadline(raw);
  const correlations = CORRELATIONS.filter((c) => c.match.test(`${raw.title} ${raw.description || ""}`));

  return {
    id: `evt_${Date.now()}_${idSeq++}`,
    canonicalKey: canonicalKey(raw.title),
    firstSeen: new Date().toISOString(),
    country: raw.country,
    headline: raw.title,
    summary: raw.description || raw.title,
    sources: [{ name: raw.source || "unknown", url: raw.url, publishedAt: raw.publishedAt }],
    classification: {
      generated: "ai",
      sectors,
      sentiment: Number(sentiment.toFixed(2)),
      importance: HIGH_IMPACT.test(raw.title) ? "High" : sectors.length ? "Medium" : "Low",
      urgency: HIGH_IMPACT.test(raw.title) ? "Breaking" : "Normal",
    },
    ai: aiAnalyze(raw, sentiment, sectors),
    correlations: correlations.flatMap((c) => c.effects),
    predictions: predict(raw.country, sectors, sentiment, correlations),
    disclaimer: "AI-generated analysis. Not financial advice.",
  };
}
