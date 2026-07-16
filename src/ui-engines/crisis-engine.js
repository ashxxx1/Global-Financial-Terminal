// Crisis Mode — deterministic SIMULATED crisis scenarios. No live event feed;
// same disclosure as the rest of this prototype's data engine.
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

const SEVERITY_COLOR = { Low: "#39d6a3", Moderate: "#e5c04d", High: "#e08a3c", Critical: "#ff5b68" };

export const CRISIS_SCENARIOS = [
  {
    id: "energy-shock", type: "Energy Supply Disruption", severity: "High",
    epicenter: { name: "Saudi Arabia", lat: 24.71, lon: 46.68 },
    affected: [
      { name: "Saudi Arabia", lat: 24.71, lon: 46.68, severity: "Critical" },
      { name: "United Arab Emirates", lat: 24.45, lon: 54.38, severity: "High" },
      { name: "Iraq", lat: 33.31, lon: 44.36, severity: "High" },
      { name: "Iran", lat: 35.69, lon: 51.39, severity: "High" },
      { name: "India", lat: 28.61, lon: 77.21, severity: "Moderate" },
      { name: "Japan", lat: 35.68, lon: 139.69, severity: "Moderate" },
      { name: "Germany", lat: 52.52, lon: 13.4, severity: "Moderate" },
    ],
    routes: [
      { from: { lat: 24.71, lon: 46.68 }, to: { lat: 1.29, lon: 103.85 }, label: "Gulf → Singapore tanker corridor" },
      { from: { lat: 24.71, lon: 46.68 }, to: { lat: 35.68, lon: 139.69 }, label: "Gulf → Japan crude route" },
      { from: { lat: 24.71, lon: 46.68 }, to: { lat: 52.52, lon: 13.4 }, label: "Gulf → Europe energy corridor" },
    ],
    overview: "An unscheduled output disruption at a major Gulf export terminal has removed a significant share of daily crude capacity from the market. Refiners across Asia and Europe are reworking near-term supply contracts as tanker queues build at the Strait of Hormuz.",
    whyItMatters: "Roughly a fifth of the world's seaborne crude and a large share of LNG transits this corridor daily; even a short disruption pressures energy-importing economies and reprices freight and insurance.",
    economicConsequences: "Energy-import-dependent economies face near-term inflation pressure; energy exporters see currency and equity support; shipping and insurance costs rise across affected lanes.",
    marketImpact: {
      indices: [{ name: "S&P Synth 500", changePct: -1.4 }, { name: "FTSE Horizon", changePct: -0.9 }, { name: "Nikkei Pulse", changePct: -2.1 }],
      oil: { name: "Brent Crude (sim)", changePct: 6.8 },
      gold: { name: "Gold (sim)", changePct: 2.1 },
      bitcoin: { name: "BTC (sim)", changePct: -3.2 },
      currencies: [{ name: "USD Index (sim)", changePct: 0.6 }, { name: "JPY/USD (sim)", changePct: -0.8 }],
      bondYield: { name: "10Y Sovereign Yield (sim)", changeBps: -8 },
    },
    risks: [
      { key: "geopolitical", label: "Geopolitical Risk", score: 78, why: "Direct military/political exposure at the epicenter and neighboring producers." },
      { key: "supplyChain", label: "Supply Chain Risk", score: 71, why: "Tanker and refinery scheduling disruption cascades into downstream petrochemical supply." },
      { key: "trade", label: "Trade Risk", score: 58, why: "Rerouting around the corridor adds transit time and cost to affected trade lanes." },
      { key: "currency", label: "Currency Risk", score: 52, why: "Energy-importer currencies face depreciation pressure as import bills rise." },
      { key: "energy", label: "Energy Risk", score: 84, why: "Direct hit to global crude and LNG export capacity." },
      { key: "financialStability", label: "Financial Stability Risk", score: 44, why: "Contained so far to energy and related equities, not yet systemic." },
    ],
    timelineSeed: [
      { label: "Initial event detected", detail: "Export terminal reports unscheduled output halt." },
      { label: "Markets reacted", detail: "Energy futures gap higher at the open; risk-off tone spreads to equities." },
      { label: "Government response", detail: "Affected government convenes emergency energy council." },
      { label: "Central bank announcement", detail: "Regional central bank signals readiness to support currency stability." },
      { label: "Updated AI assessment", detail: "Model raises energy-risk score and flags refiners as most exposed." },
    ],
    recommendations: [
      "Monitor refiners and shippers with concentrated exposure to the affected corridor.",
      "Increase attention to defensive and energy-hedge sectors.",
      "Watch energy-importer currencies for accelerated depreciation.",
      "Review supply contracts with force-majeure exposure in the region.",
      "Track freight and insurance cost indices for early normalization signals.",
    ],
  },
  {
    id: "market-crash", type: "Financial Market Crash", severity: "Critical",
    epicenter: { name: "United States", lat: 38.9, lon: -77.04 },
    affected: [
      { name: "United States", lat: 38.9, lon: -77.04, severity: "Critical" },
      { name: "United Kingdom", lat: 51.51, lon: -0.13, severity: "High" },
      { name: "Germany", lat: 52.52, lon: 13.4, severity: "High" },
      { name: "Japan", lat: 35.68, lon: 139.69, severity: "High" },
      { name: "China", lat: 39.9, lon: 116.4, severity: "Moderate" },
      { name: "Brazil", lat: -15.79, lon: -47.88, severity: "Moderate" },
    ],
    routes: [
      { from: { lat: 38.9, lon: -77.04 }, to: { lat: 51.51, lon: -0.13 }, label: "Cross-Atlantic capital flow corridor" },
      { from: { lat: 38.9, lon: -77.04 }, to: { lat: 35.68, lon: 139.69 }, label: "Trans-Pacific capital flow corridor" },
    ],
    overview: "A sudden, broad-based selloff in major indices has triggered circuit breakers on multiple exchanges. Liquidity has thinned sharply across equity and credit markets as risk models reprice simultaneously.",
    whyItMatters: "Correlated deleveraging across major markets can amplify losses beyond fundamentals and spill into credit and funding markets if it persists.",
    economicConsequences: "Wealth-effect drag on consumption, tighter financial conditions, and a flight to quality that pressures risk assets broadly.",
    marketImpact: {
      indices: [{ name: "S&P Synth 500", changePct: -6.4 }, { name: "FTSE Horizon", changePct: -4.8 }, { name: "Nikkei Pulse", changePct: -5.1 }],
      oil: { name: "Brent Crude (sim)", changePct: -3.5 },
      gold: { name: "Gold (sim)", changePct: 3.4 },
      bitcoin: { name: "BTC (sim)", changePct: -9.7 },
      currencies: [{ name: "USD Index (sim)", changePct: 1.4 }, { name: "JPY/USD (sim)", changePct: 2.1 }],
      bondYield: { name: "10Y Sovereign Yield (sim)", changeBps: -22 },
    },
    risks: [
      { key: "financialStability", label: "Financial Stability Risk", score: 86, why: "Cross-asset deleveraging raises systemic contagion concerns." },
      { key: "geopolitical", label: "Geopolitical Risk", score: 40, why: "Not the proximate cause but compounds an already fragile backdrop." },
      { key: "supplyChain", label: "Supply Chain Risk", score: 35, why: "Limited direct effect so far, mostly financial-channel transmission." },
      { key: "trade", label: "Trade Risk", score: 48, why: "Risk-off tone weighs on trade-financing conditions." },
      { key: "currency", label: "Currency Risk", score: 66, why: "Flight-to-quality flows are moving major currency pairs sharply." },
      { key: "energy", label: "Energy Risk", score: 30, why: "Demand-destruction fears are pulling energy prices lower, not higher." },
    ],
    timelineSeed: [
      { label: "Initial event detected", detail: "Broad-based selloff triggers exchange circuit breakers." },
      { label: "Markets reacted", detail: "Volatility indices spike; correlated selling across asset classes." },
      { label: "Government response", detail: "Regulators confirm market mechanisms are functioning as designed." },
      { label: "Central bank announcement", detail: "Central bank issues a statement on liquidity facility readiness." },
      { label: "Updated AI assessment", detail: "Model flags financial-stability risk as the dominant driver." },
    ],
    recommendations: [
      "Monitor liquidity conditions in credit and funding markets closely.",
      "Increase exposure to defensive sectors and quality balance sheets.",
      "Watch central bank communications for liquidity-facility signals.",
      "Reassess leverage and margin exposure across portfolios.",
      "Track volatility term structure for signs of stabilization.",
    ],
  },
];

function scenarioForSeed(seed) {
  const idx = seed % CRISIS_SCENARIOS.length;
  return CRISIS_SCENARIOS[idx];
}

export function pickAutoCrisis() {
  // deterministic "auto-detected" scenario, changes slowly (per hour) rather than per-render
  const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
  return scenarioForSeed(hourSeed);
}

export function buildCrisisState(scenario, activatedAtMs) {
  const rnd = mulberry32(hashStr(scenario.id));
  const startTimes = [];
  let t = 8.5; // 08:30 baseline
  scenario.timelineSeed.forEach(() => { startTimes.push(t); t += 0.4 + rnd() * 1.1; });
  const timeline = scenario.timelineSeed.map((ev, i) => {
    const hh = Math.floor(startTimes[i]);
    const mm = Math.round((startTimes[i] - hh) * 60);
    return { time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, label: ev.label, detail: ev.detail };
  });

  const affected = scenario.affected.map(a => ({ ...a, color: SEVERITY_COLOR[a.severity] }));

  return {
    ...scenario,
    color: SEVERITY_COLOR[scenario.severity],
    activatedAt: activatedAtMs,
    affectedWithColor: affected,
    timeline,
    alerts: [
      { id: 1, kind: "Breaking", text: `${scenario.type} confirmed at ${scenario.epicenter.name}`, color: "#ff5b68" },
      { id: 2, kind: "Market", text: `${scenario.marketImpact.indices[0].name} moved ${scenario.marketImpact.indices[0].changePct >= 0 ? "+" : ""}${scenario.marketImpact.indices[0].changePct.toFixed(1)}% on the news`, color: "#e5c04d" },
      { id: 3, kind: "Central Bank", text: "Central bank issued a statement on market stability", color: "#3ec6ff" },
      { id: 4, kind: "Risk", text: `Composite risk elevated across ${affected.length} tracked countries`, color: "#e08a3c" },
    ],
  };
}

export function getHotspots(crisisState) {
  return crisisState.affectedWithColor.map(a => ({ lat: a.lat, lon: a.lon, color: a.color, severity: a.severity, name: a.name }));
}
