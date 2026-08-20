/**
 * Node entry point for the signal engine.
 *
 * Re-exports only what the CI runner needs so rolldown can bundle the engine
 * without the browser app coming with it.
 */
export { generateSignals } from "../../src/lib/signals/generate";
export { resolveSignalAgainstBars, applyResolution } from "../../src/lib/signals/resolve";
export { setMarketDataProvider } from "../../src/lib/signals/marketDataProvider";
export { SIGNAL_ASSETS } from "../../src/lib/signals/assets";
export { ETF_PROXIES } from "../../src/lib/feeds/proxies";
export { GftMarketDataProvider } from "../../src/lib/signals/marketDataProvider";
