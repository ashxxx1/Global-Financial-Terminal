// Risk Analyst Mode — deterministic synthetic risk scoring engine.
// All scores are SIMULATED (seeded per-country), same disclosure as market-engine.js.
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

const CATEGORIES = [
  ["geopolitical", "Geopolitical Risk"], ["economic", "Economic Risk"], ["currency", "Currency Risk"],
  ["credit", "Sovereign Credit Risk"], ["inflation", "Inflation Risk"], ["supplyChain", "Supply Chain Vulnerability"],
  ["tradeDependency", "Trade Dependency"], ["politicalStability", "Political Stability"], ["sanctions", "Sanctions & Trade Restrictions"],
  ["naturalDisaster", "Natural Disaster Exposure"], ["cyber", "Cybersecurity Risk"], ["climate", "Climate Risk"],
  ["regulatory", "Regulatory Risk"],
];

const RECENT_EVENT_TEMPLATES = [
  "Central bank tightened capital controls after a sharp currency swing",
  "Border trade volumes dipped following a regional diplomatic dispute",
  "A credit rating agency revised its outlook amid fiscal slippage",
  "New export licensing rules added friction to cross-border shipments",
  "A cyber incident at a state-linked institution renewed scrutiny of digital defenses",
  "Severe weather disrupted port operations for several days",
  "Parliament passed a contested regulatory reform package",
  "Sanctions exposure was reassessed after a allied-nation policy shift",
];

const OPPORTUNITY_TEMPLATES = [
  "Deep discount to regional peers on valuation multiples for patient capital",
  "Government incentives are actively courting foreign manufacturing investment",
  "A young, urbanizing workforce supports long-run consumption growth",
  "Diversification away from concentrated single-partner trade exposure is underway",
  "Digital infrastructure buildout is opening new logistics and fintech niches",
];

const MITIGATION_TEMPLATES = [
  "Hedge currency exposure via forwards rather than relying on spot conversion timing",
  "Structure new contracts with force-majeure and regulatory-change clauses",
  "Diversify suppliers across at least two adjacent jurisdictions",
  "Maintain political-risk insurance for fixed-asset investments",
  "Stage capital deployment in tranches tied to policy-stability milestones",
];

function scoreToTier(score) {
  if (score < 30) return { tier: "Low", color: "#39d6a3", glyph: "🟢" };
  if (score < 55) return { tier: "Moderate", color: "#e5c04d", glyph: "🟡" };
  if (score < 78) return { tier: "High", color: "#e08a3c", glyph: "🟠" };
  return { tier: "Critical", color: "#ff5b68", glyph: "🔴" };
}

export function getCountryRisk(country) {
  const rnd = mulberry32(hashStr(country.name + ":risk"));
  const scores = {};
  CATEGORIES.forEach(([key]) => { scores[key] = Math.round(8 + rnd() * 88); });

  const overall = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / CATEGORIES.length
  );
  const { tier, color, glyph } = scoreToTier(overall);

  // 6-point deterministic trend leading to `overall`
  const trend = [];
  let v = overall + (rnd() * 20 - 10);
  for (let i = 0; i < 6; i++) {
    v = v + (rnd() * 14 - 7);
    v = Math.max(5, Math.min(95, v));
    trend.push(Math.round(v));
  }
  trend[trend.length - 1] = overall;

  const topDrivers = CATEGORIES
    .map(([key, label]) => ({ key, label, score: scores[key] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const recentEvents = [0, 1, 2].map(() => pick(rnd, RECENT_EVENT_TEMPLATES));
  const opportunities = [0, 1].map(() => pick(rnd, OPPORTUNITY_TEMPLATES));
  const mitigations = [0, 1, 2].map(() => pick(rnd, MITIGATION_TEMPLATES));

  return {
    overall, tier, color, glyph,
    categories: CATEGORIES.map(([key, label]) => ({ key, label, score: scores[key], ...scoreToTier(scores[key]) })),
    topDrivers, trend, recentEvents, opportunities, mitigations,
    explanation: `${country.name}'s ${tier.toLowerCase()}-risk profile (${overall}/100) is driven primarily by ${topDrivers[0].label.toLowerCase()} (${topDrivers[0].score}) and ${topDrivers[1].label.toLowerCase()} (${topDrivers[1].score}), partially offset by relative stability elsewhere.`,
  };
}

export function getRiskTierColor(score) { return scoreToTier(score).color; }
export const RISK_CATEGORIES = CATEGORIES;
