import {
  generateSyntheticPriceSeries,
  mean,
  stdDev,
  zScore,
  momentumFactor,
  ewmaVolatility,
  macroIndex,
  compositeZ,
  compositeScore,
  instabilityIndex,
  stanceFromZ,
  ensembleConfidence,
  kNearestAnalogs,
  precedentStats,
  monteCarloScenario,
  kellyRange,
  correlationMatrix,
  beta,
  FactorVector,
  FactorWeights,
  RiskInputs,
  MacroInputs,
  DEFAULT_WEIGHTS
} from "./quantEngine";

// Cache for generated country data to ensure performance and consistency
const countryDataCache: {
  [iso: string]: {
    prices: number[];
    returns: number[];
    macroHistory: MacroInputs[];
    currentMacro: MacroInputs;
    riskHistory: any[];
    currentRisk: any;
    baseFactors: FactorVector;
  };
} = {};

// Helper to determine country-specific parameters
function getCountryParams(iso: string) {
  // Deterministic seed based on ISO string code
  const seed = (iso.charCodeAt(0) || 65) * 100 + (iso.charCodeAt(1) || 66);
  
  // Custom drifts and vols to make countries look highly distinct
  let drift = 0.05;
  let vol = 0.20;
  
  if (["US", "SG", "CH"].includes(iso)) {
    drift = 0.08;
    vol = 0.14;
  } else if (["JP", "DE", "FR", "NL", "SE"].includes(iso)) {
    drift = 0.06;
    vol = 0.17;
  } else if (["CN", "IN", "KR", "TW", "AE"].includes(iso)) {
    drift = 0.07;
    vol = 0.22;
  } else if (["RU", "AR", "VE", "TR"].includes(iso)) {
    drift = -0.04;
    vol = 0.42;
  } else if (["ZA", "BR", "MX", "ID", "TR"].includes(iso)) {
    drift = 0.03;
    vol = 0.28;
  }
  
  return { seed, drift, vol };
}

// Generate price series and compute baseline parameters
export function getCountryData(iso: string) {
  if (countryDataCache[iso]) {
    return countryDataCache[iso];
  }

  const { seed, drift, vol } = getCountryParams(iso);
  
  // 500 days of price history
  const prices = generateSyntheticPriceSeries(500, drift, vol, seed);
  
  // Calculate log returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  // Generate deterministic macro inputs history
  let macroSeed = seed + 500;
  const rndMacro = () => {
    macroSeed = (macroSeed * 9301 + 49297) % 233280;
    return macroSeed / 233280;
  };
  
  const macroHistory: MacroInputs[] = Array.from({ length: 60 }, (_, idx) => ({
    yieldSlope: (iso === "US" ? 1.2 : 0.8) + (rndMacro() - 0.5) * 1.5,
    pmi: 51.5 + (rndMacro() - 0.5) * 12,
    unemploymentDelta3m: (rndMacro() - 0.5) * 1.0,
    inflationSurprise: (rndMacro() - 0.5) * 2.0
  }));
  
  const currentMacro = macroHistory[macroHistory.length - 1];

  // Generate deterministic risk inputs history
  let riskSeed = seed + 1000;
  const rndRisk = () => {
    riskSeed = (riskSeed * 9301 + 49297) % 233280;
    return riskSeed / 233280;
  };

  const riskHistory = Array.from({ length: 60 }, () => ({
    vol: rndRisk() * 2.5,
    cds: rndRisk() * 200,
    fxVol: rndRisk() * 2.0,
    political: rndRisk() * 4.5,
    negSentiment: rndRisk() * 0.6
  }));

  const currentRisk = riskHistory[riskHistory.length - 1];

  // Calculate baseline factors
  const histMomentum: number[] = [];
  for (let i = 253; i < prices.length; i++) {
    histMomentum.push(momentumFactor(prices.slice(0, i)));
  }
  const currentMom = momentumFactor(prices);
  const momZ = zScore(currentMom, histMomentum);

  const histVol: number[] = [];
  for (let i = 30; i < returns.length; i++) {
    histVol.push(ewmaVolatility(returns.slice(0, i)));
  }
  const currentVol = ewmaVolatility(returns);
  const volZ = zScore(currentVol, histVol);

  const currentValuation = prices[prices.length - 1] / mean(prices);
  const histValuation = prices.slice(250).map(p => p / mean(prices));
  const valZ = -zScore(currentValuation, histValuation); // negative = expensive

  const macroZVal = macroIndex(currentMacro, macroHistory);
  
  const sentimentHistory = Array.from({ length: 60 }, (_, i) => 50 + Math.sin(i + seed) * 15);
  const sentZVal = zScore(50 + Math.sin(60 + seed) * 15, sentimentHistory);

  const baseFactors: FactorVector = {
    momentum: momZ,
    valuation: valZ,
    macro: macroZVal,
    volatility: volZ,
    sentiment: sentZVal
  };

  countryDataCache[iso] = {
    prices,
    returns,
    macroHistory,
    currentMacro,
    riskHistory,
    currentRisk,
    baseFactors
  };

  return countryDataCache[iso];
}

// Compute metrics, sizing, model alignment, and precedents
export function getCountrySignalMetrics(iso: string, shockOverride: Partial<FactorVector> = {}) {
  const { prices, returns, baseFactors, riskHistory, currentRisk } = getCountryData(iso);
  
  // Overlay What-If Scenario shock values
  const activeFactors: FactorVector = {
    momentum: shockOverride.momentum !== undefined ? shockOverride.momentum : baseFactors.momentum,
    valuation: shockOverride.valuation !== undefined ? shockOverride.valuation : baseFactors.valuation,
    macro: shockOverride.macro !== undefined ? shockOverride.macro : baseFactors.macro,
    volatility: shockOverride.volatility !== undefined ? shockOverride.volatility : baseFactors.volatility,
    sentiment: shockOverride.sentiment !== undefined ? shockOverride.sentiment : baseFactors.sentiment
  };

  // 1. Instability Index
  const volZ = zScore(currentRisk.vol, riskHistory.map(h => h.vol));
  const cdsZ = zScore(currentRisk.cds, riskHistory.map(h => h.cds));
  const fxVolZ = zScore(currentRisk.fxVol, riskHistory.map(h => h.fxVol));
  const politicalZ = zScore(currentRisk.political, riskHistory.map(h => h.political));
  const negSentimentZ = zScore(currentRisk.negSentiment, riskHistory.map(h => h.negSentiment));
  
  // If volatility or macro is shocked via Scenario Simulator, scale risk inputs accordingly
  const riskInput: RiskInputs = {
    volZ: activeFactors.volatility,
    cdsZ: cdsZ + (activeFactors.macro < 0 ? Math.abs(activeFactors.macro) * 0.5 : 0),
    fxVolZ: fxVolZ,
    politicalZ: politicalZ,
    negSentimentZ: negSentimentZ - (activeFactors.sentiment * 0.3)
  };

  const riskScore = Math.round(instabilityIndex(riskInput));

  // 2. Composite Score
  const score = Math.round(compositeScore(activeFactors));

  // 3. Position Sizing (Kelly Range)
  // Expected excess return mapped from buy signal score, variance from returns
  const expectedExcessReturn = (score - 50) / 100;
  const variance = stdDev(returns) ** 2;
  const sizing = kellyRange(expectedExcessReturn, variance, 0.5);

  // 4. Ensemble Sub-model Stances
  // quant = momentum + valuation + volatility
  const quantZ = (activeFactors.momentum + activeFactors.valuation - activeFactors.volatility) / 3;
  const quantStance = stanceFromZ(quantZ);
  
  // sentiment stance
  const sentimentStance = stanceFromZ(activeFactors.sentiment);
  
  // macro stance
  const macroStance = stanceFromZ(activeFactors.macro);
  
  const stances = [quantStance, sentimentStance, macroStance];
  
  const stanceLabel = (s: number) => s === 1 ? "BULLISH" : s === -1 ? "BEARISH" : "NEUTRAL";
  
  const confidence = ensembleConfidence(stances);

  // 5. Precedents Analogs (k-NN)
  // Compute rolling window samples from the 500-day series
  const historicalSamples: any[] = [];
  
  // We mock a covariance matrix (diagonal identity)
  const invCov = [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1]
  ];

  const seed = (iso.charCodeAt(0) || 65) * 100 + (iso.charCodeAt(1) || 66);
  let s = seed + 2000;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let t = 253; t < prices.length - 30; t += 5) {
    historicalSamples.push({
      t,
      vec: [
        baseFactors.momentum + (rnd() - 0.5) * 1.5,
        baseFactors.valuation + (rnd() - 0.5) * 1.5,
        baseFactors.macro + (rnd() - 0.5) * 1.5,
        baseFactors.volatility + (rnd() - 0.5) * 1.0,
        baseFactors.sentiment + (rnd() - 0.5) * 1.0
      ],
      forwardReturn: (prices[t + 30] / prices[t] - 1) * (1.0 + (rnd() - 0.5) * 0.2)
    });
  }

  const currentVec = [
    activeFactors.momentum,
    activeFactors.valuation,
    activeFactors.macro,
    activeFactors.volatility,
    activeFactors.sentiment
  ];

  const analogs = kNearestAnalogs(currentVec, historicalSamples, invCov, 5, 20);
  const precStats = precedentStats(analogs);

  // 6. Monte Carlo Scenarios (Cholesky Shocks)
  // 5x5 covariance matrix among factors
  const cov = [
    [1.0, 0.15, 0.10, -0.15, 0.20],
    [0.15, 1.0, 0.05, -0.20, 0.10],
    [0.10, 0.05, 1.0, -0.10, 0.15],
    [-0.15, -0.20, -0.10, 1.0, -0.25],
    [0.20, 0.10, 0.15, -0.25, 1.0]
  ];

  const mcResult = monteCarloScenario(baseFactors, cov, shockOverride, DEFAULT_WEIGHTS, 500);

  return {
    score,
    factors: activeFactors,
    instability: riskScore,
    sizing: {
      low: Math.max(0, sizing.low * 100),
      high: Math.min(25, sizing.high * 100)
    },
    ensemble: {
      quant: stanceLabel(quantStance),
      sentiment: stanceLabel(sentimentStance),
      macro: stanceLabel(macroStance),
      confidence
    },
    precedents: {
      median: (precStats.median * 100).toFixed(1) + "%",
      min: (precStats.min * 100).toFixed(1) + "%",
      max: (precStats.max * 100).toFixed(1) + "%",
      values: analogs.map(a => Math.round(50 + a.forwardReturn * 200))
    },
    monteCarlo: {
      p5: Math.round(mcResult.p5),
      p50: Math.round(mcResult.p50),
      p95: Math.round(mcResult.p95)
    }
  };
}

// Compute Pearson correlation matrix across all key countries
export function getContagionMatrix(countriesList: string[]) {
  const returnSeries: number[][] = [];
  
  countriesList.forEach((iso) => {
    const { returns } = getCountryData(iso);
    returnSeries.push(returns);
  });
  
  const matrix = correlationMatrix(returnSeries);
  
  // Calculate beta against US as the benchmark
  const usIndex = countriesList.indexOf("US");
  const usReturns = usIndex !== -1 ? returnSeries[usIndex] : returnSeries[0];
  
  const betas = countriesList.map((iso, idx) => {
    return beta(returnSeries[idx], usReturns);
  });

  return {
    matrix,
    betas
  };
}
