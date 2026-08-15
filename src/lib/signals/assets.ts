/**
 * Signal asset universe for MVP markets: India, US, UK, Europe, Japan + FX/crypto/commodities.
 */
import type { SignalAsset } from "./types";

export const SIGNAL_ASSETS: SignalAsset[] = [
  // India
  { assetId: "idx-nifty50", symbol: "NIFTY 50", name: "Nifty 50", assetType: "INDEX", market: "INDIA", exchange: "NSE", timezone: "Asia/Kolkata", marketOpenHour: 9, marketOpenMinute: 15, quoteSymbol: "IDX:NIFTY 50" },
  // US
  { assetId: "idx-sp500", symbol: "S&P 500", name: "S&P 500", assetType: "INDEX", market: "US", exchange: "NYSE", timezone: "America/New_York", marketOpenHour: 9, marketOpenMinute: 30, quoteSymbol: "IDX:S&P 500" },
  { assetId: "idx-nasdaq", symbol: "NASDAQ", name: "Nasdaq Composite", assetType: "INDEX", market: "US", exchange: "NASDAQ", timezone: "America/New_York", marketOpenHour: 9, marketOpenMinute: 30, quoteSymbol: "IDX:NASDAQ" },
  { assetId: "idx-dow", symbol: "DOW JONES", name: "Dow Jones Industrial Average", assetType: "INDEX", market: "US", exchange: "NYSE", timezone: "America/New_York", marketOpenHour: 9, marketOpenMinute: 30, quoteSymbol: "IDX:DOW JONES" },
  // UK / Europe
  { assetId: "idx-ftse", symbol: "FTSE 100", name: "FTSE 100", assetType: "INDEX", market: "UK", exchange: "LSE", timezone: "Europe/London", marketOpenHour: 8, marketOpenMinute: 0, quoteSymbol: "IDX:FTSE 100" },
  { assetId: "idx-dax", symbol: "DAX 40", name: "DAX 40", assetType: "INDEX", market: "EUROPE", exchange: "XETRA", timezone: "Europe/Berlin", marketOpenHour: 9, marketOpenMinute: 0, quoteSymbol: "IDX:DAX 40" },
  { assetId: "idx-cac", symbol: "CAC 40", name: "CAC 40", assetType: "INDEX", market: "EUROPE", exchange: "EURONEXT", timezone: "Europe/Paris", marketOpenHour: 9, marketOpenMinute: 0, quoteSymbol: "IDX:CAC 40" },
  // Japan / Asia
  { assetId: "idx-nikkei", symbol: "NIKKEI 225", name: "Nikkei 225", assetType: "INDEX", market: "JAPAN", exchange: "TSE", timezone: "Asia/Tokyo", marketOpenHour: 9, marketOpenMinute: 0, quoteSymbol: "IDX:NIKKEI 225" },
  { assetId: "idx-hsi", symbol: "HANG SENG", name: "Hang Seng", assetType: "INDEX", market: "ASIA", exchange: "HKEX", timezone: "Asia/Hong_Kong", marketOpenHour: 9, marketOpenMinute: 30, quoteSymbol: "IDX:HANG SENG" },
  // Commodities
  { assetId: "cmd-gold", symbol: "GOLD", name: "Gold", assetType: "COMMODITY", market: "COMMODITIES", exchange: "COMEX", timezone: "America/New_York", marketOpenHour: 8, marketOpenMinute: 0, quoteSymbol: "IDX:GOLD" },
  { assetId: "cmd-oil", symbol: "WTI OIL", name: "WTI Crude Oil", assetType: "COMMODITY", market: "COMMODITIES", exchange: "NYMEX", timezone: "America/New_York", marketOpenHour: 9, marketOpenMinute: 0, quoteSymbol: "IDX:WTI OIL" },
  { assetId: "cmd-silver", symbol: "SILVER", name: "Silver", assetType: "COMMODITY", market: "COMMODITIES", exchange: "COMEX", timezone: "America/New_York", marketOpenHour: 8, marketOpenMinute: 0, quoteSymbol: "IDX:SILVER" },
  // FX
  { assetId: "fx-eurusd", symbol: "EUR/USD", name: "Euro / US Dollar", assetType: "FX", market: "FX", exchange: "OTC", timezone: "UTC", marketOpenHour: 0, marketOpenMinute: 0, quoteSymbol: "IDX:EUR/USD" },
  { assetId: "fx-gbpusd", symbol: "GBP/USD", name: "Pound / US Dollar", assetType: "FX", market: "FX", exchange: "OTC", timezone: "UTC", marketOpenHour: 0, marketOpenMinute: 0, quoteSymbol: "IDX:GBP/USD" },
  { assetId: "fx-usdjpy", symbol: "USD/JPY", name: "US Dollar / Yen", assetType: "FX", market: "FX", exchange: "OTC", timezone: "UTC", marketOpenHour: 0, marketOpenMinute: 0, quoteSymbol: "IDX:USD/JPY" },
  // Crypto
  { assetId: "cry-btc", symbol: "BTC/USD", name: "Bitcoin", assetType: "CRYPTO", market: "CRYPTO", exchange: "CRYPTO", timezone: "UTC", marketOpenHour: 0, marketOpenMinute: 0, quoteSymbol: "IDX:BTC/USD" },
  { assetId: "cry-eth", symbol: "ETH/USD", name: "Ethereum", assetType: "CRYPTO", market: "CRYPTO", exchange: "CRYPTO", timezone: "UTC", marketOpenHour: 0, marketOpenMinute: 0, quoteSymbol: "IDX:ETH/USD" },
  // Futures
  { assetId: "fut-es", symbol: "ES1!", name: "E-mini S&P 500", assetType: "FUTURES", market: "US", exchange: "CME", timezone: "America/Chicago", marketOpenHour: 17, marketOpenMinute: 0, quoteSymbol: "IDX:S&P 500" },
  { assetId: "fut-nq", symbol: "NQ1!", name: "E-mini Nasdaq-100", assetType: "FUTURES", market: "US", exchange: "CME", timezone: "America/Chicago", marketOpenHour: 17, marketOpenMinute: 0, quoteSymbol: "IDX:NASDAQ" },
  // Options
  { assetId: "opt-spy", symbol: "SPY", name: "SPY Options", assetType: "OPTIONS", market: "US", exchange: "CBOE", timezone: "America/New_York", marketOpenHour: 9, marketOpenMinute: 30, quoteSymbol: "IDX:S&P 500" },
  { assetId: "opt-qqq", symbol: "QQQ", name: "QQQ Options", assetType: "OPTIONS", market: "US", exchange: "CBOE", timezone: "America/New_York", marketOpenHour: 9, marketOpenMinute: 30, quoteSymbol: "IDX:NASDAQ" },
];

export function assetById(id: string): SignalAsset | undefined {
  return SIGNAL_ASSETS.find((a) => a.assetId === id);
}

export function assetBySymbol(symbol: string): SignalAsset | undefined {
  return SIGNAL_ASSETS.find((a) => a.symbol === symbol);
}

/** Map UI filter chips to asset markets. */
export function marketsForFilter(filter: string): string[] | null {
  const f = filter.toUpperCase();
  if (f === "ALL") return null;
  if (f === "INDICES") return SIGNAL_ASSETS.filter((a) => a.assetType === "INDEX").map((a) => a.market);
  if (f === "EQUITIES") return SIGNAL_ASSETS.filter((a) => a.assetType === "EQUITY").map((a) => a.market);
  if (f === "EUROPE") return ["EUROPE", "UK"];
  if (f === "ASIA") return ["ASIA", "JAPAN", "INDIA"];
  return [f];
}
