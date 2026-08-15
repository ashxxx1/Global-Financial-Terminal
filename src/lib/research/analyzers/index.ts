/**
 * Analyzer registry.
 *
 * Each analyzer declares the capabilities it consumes, which is what makes the
 * feature extensible rather than rewritable: registering a premium source in
 * capabilities.ts and adding a dataset to api/research.ts is enough for the
 * analyzers that declared it to start using it. Nothing here needs to change.
 */
export { analyzeMoving, analyzePersistence } from "./moving";
export { analyzeChanged } from "./changed";
export { analyzeValuationHistory, analyzeValuationPair } from "./valuation";
export { analyzeMomentum } from "./momentum";
export { analyzeRisks } from "./risks";
export { analyzeFilings, analyzeScreen, analyzeMarket, analyzePortfolio, analyzeMacro } from "./scope";
