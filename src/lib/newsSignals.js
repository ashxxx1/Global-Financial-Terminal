/**
 * newsSignals.js — News → Sector → Stock signal engine.
 *
 * Pure, dependency-free functions. Given a list of news items and the stocks
 * for a country, it:
 *   1. scores each headline's sentiment (lexicon-based),
 *   2. detects which market sector(s) the headline is about (keyword map),
 *   3. aggregates sentiment per sector (recency-weighted),
 *   4. maps each sector to the country's stocks in that sector,
 *   5. emits an informational signal (Bullish / Bearish / Neutral) + confidence.
 *
 * IMPORTANT: output is INFORMATIONAL market-sentiment analysis, NOT financial
 * advice. Every consumer of this module must surface DISCLAIMER to the user.
 */

export const DISCLAIMER =
  "Informational market-sentiment analysis generated from public news. " +
  "Not financial advice. Do your own research before making any investment decision.";

// ── Sentiment lexicon ────────────────────────────────────────────────────────
// Small, transparent word lists. Positive/negative market-relevant terms.
const POSITIVE = [
  "surge", "surges", "surged", "soar", "soars", "rally", "rallies", "gains", "gain",
  "jumps", "jump", "record", "profit", "profits", "beat", "beats", "growth", "grows",
  "upgrade", "bullish", "boom", "boosts", "boost", "rise", "rises", "strong", "strength",
  "expansion", "outperform", "recovery", "rebound", "optimism", "deal", "approval",
  "wins", "win", "breakthrough", "demand", "invest", "investment", "stimulus", "cuts rates",
];
const NEGATIVE = [
  "plunge", "plunges", "plunged", "slump", "slumps", "crash", "crashes", "falls", "fall",
  "drops", "drop", "loss", "losses", "miss", "misses", "decline", "declines", "downgrade",
  "bearish", "recession", "weak", "weakness", "cuts jobs", "layoffs", "default", "crisis",
  "sanction", "sanctions", "tariff", "tariffs", "probe", "lawsuit", "fraud", "ban", "bans",
  "shortage", "inflation", "hike", "hikes", "war", "conflict", "strike", "protest", "fear",
];

// Words that amplify magnitude (news is more "material").
const INTENSIFIERS = ["record", "historic", "massive", "sharp", "sharply", "biggest", "crisis", "emergency"];

// ── Keyword → sector map ─────────────────────────────────────────────────────
// Sector names MUST match the `sector` field in stocksData.js.
const SECTOR_KEYWORDS = {
  "Energy": ["oil", "crude", "gas", "opec", "energy", "fuel", "petroleum", "refiner", "barrel", "pipeline"],
  "Banking & Finance": ["bank", "banks", "rate", "rates", "interest", "central bank", "fed", "lending", "loan", "credit", "bond", "yield", "payments", "fintech", "insurer", "insurance"],
  "Technology": ["tech", "chip", "chips", "semiconductor", "ai", "software", "cloud", "data", "cyber", "smartphone", "gadget", "internet", "startup"],
  "Automotive": ["car", "cars", "auto", "automaker", "vehicle", "ev", "electric vehicle", "battery"],
  "Healthcare": ["pharma", "drug", "drugs", "vaccine", "health", "hospital", "biotech", "clinical", "fda"],
  "Consumer": ["retail", "consumer", "retail sales", "consumer spending", "shopping", "e-commerce", "food", "beverage", "household"],
  "Telecom": ["telecom", "5g", "network", "broadband", "spectrum", "carrier", "mobile"],
  "Mining & Resources": ["mining", "metal", "metals", "gold", "copper", "steel", "iron", "ore", "commodity", "commodities", "lithium"],
  "Industrial": ["manufactur", "factory", "industrial", "machinery", "export", "exports", "supply chain", "production"],
  "Real Estate": ["property", "housing", "real estate", "mortgage", "construction", "homebuilder"],
  "Utilities": ["utility", "utilities", "power", "electricity", "grid", "renewable", "solar", "wind"],
  "Transportation": ["airline", "airlines", "shipping", "freight", "logistics", "rail", "port", "aviation"],
  "Defence": ["defence", "defense", "military", "weapons", "missile", "army", "arms"],
};

const norm = (s) => (s || "").toLowerCase();

// Precompile each term as a word-boundary regex so short tokens like "ai" don't
// match inside words ("retail", "maintain"). Multi-word phrases work too.
const toRegexes = (list) =>
  list.map((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));

const POSITIVE_RE = toRegexes(POSITIVE);
const NEGATIVE_RE = toRegexes(NEGATIVE);
const INTENSIFIERS_RE = toRegexes(INTENSIFIERS);
const SECTOR_RE = Object.fromEntries(
  Object.entries(SECTOR_KEYWORDS).map(([k, v]) => [k, toRegexes(v)])
);

/** Count how many precompiled term-regexes match `text`. */
function countMatches(text, regexes) {
  let n = 0;
  for (const re of regexes) if (re.test(text)) n++;
  return n;
}

/**
 * Score one headline.
 * @returns { sentiment: -1..1, magnitude: 0..1, sectors: string[] }
 */
export function analyzeHeadline(item) {
  const text = `${norm(item.title)} ${norm(item.description)}`;
  const pos = countMatches(text, POSITIVE_RE);
  const neg = countMatches(text, NEGATIVE_RE);
  const intens = countMatches(text, INTENSIFIERS_RE);

  const total = pos + neg;
  const sentiment = total === 0 ? 0 : (pos - neg) / total; // -1..1
  const magnitude = Math.min(1, (total * 0.3) + (intens * 0.25)); // 0..1

  const sectors = [];
  for (const [sector, regexes] of Object.entries(SECTOR_RE)) {
    if (countMatches(text, regexes) > 0) sectors.push(sector);
  }
  return { sentiment, magnitude, sectors };
}

/** Recency weight: newer news counts more (half-life ~24h). */
function recencyWeight(publishedAt) {
  const t = publishedAt ? new Date(publishedAt).getTime() : Date.now();
  const hours = Math.max(0, (Date.now() - t) / 3.6e6);
  return Math.pow(0.5, hours / 24); // 1.0 now → 0.5 at 24h → 0.25 at 48h
}

function labelFor(score) {
  if (score >= 0.15) return "Bullish";
  if (score <= -0.15) return "Bearish";
  return "Neutral";
}

/**
 * Main entry point.
 * @param {Array} newsItems  [{ title, description, source, publishedAt, url }]
 * @param {Array} stocks     country stocks [{ ticker, name, sector, ... }]
 * @returns {{ generatedAt, overall, sectorSignals, disclaimer }}
 */
export function analyzeCountryNews(newsItems = [], stocks = []) {
  const sectorAgg = {}; // sector -> { weighted, weight, drivers: [] }

  for (const item of newsItems) {
    const { sentiment, magnitude, sectors } = analyzeHeadline(item);
    if (sentiment === 0 && magnitude === 0) continue;
    const w = recencyWeight(item.publishedAt) * (0.4 + magnitude);
    for (const sector of sectors) {
      const a = (sectorAgg[sector] ||= { weighted: 0, weight: 0, drivers: [] });
      a.weighted += sentiment * w;
      a.weight += w;
      if (a.drivers.length < 3 && item.title) {
        a.drivers.push({ title: item.title, source: item.source, url: item.url, sentiment });
      }
    }
  }

  const stocksBySector = {};
  for (const s of stocks) (stocksBySector[s.sector] ||= []).push(s);

  const sectorSignals = Object.entries(sectorAgg)
    .map(([sector, a]) => {
      const score = a.weight ? a.weighted / a.weight : 0; // -1..1
      const affected = (stocksBySector[sector] || []).slice(0, 5);
      // confidence grows with news volume behind the signal and its strength
      const confidence = Math.round(
        Math.min(100, (Math.abs(score) * 60) + Math.min(40, a.weight * 12))
      );
      return {
        sector,
        label: labelFor(score),
        score: Number(score.toFixed(2)),
        confidence,
        affected,
        drivers: a.drivers,
      };
    })
    .filter((s) => s.affected.length > 0)
    .sort((a, b) => b.confidence - a.confidence);

  const overallScore = sectorSignals.length
    ? sectorSignals.reduce((sum, s) => sum + s.score, 0) / sectorSignals.length
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    overall: { label: labelFor(overallScore), score: Number(overallScore.toFixed(2)) },
    sectorSignals,
    disclaimer: DISCLAIMER,
  };
}
