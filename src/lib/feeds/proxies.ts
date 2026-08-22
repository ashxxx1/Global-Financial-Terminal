/**
 * Index and commodity prices, via their US-listed ETF proxies.
 *
 * Index levels (S&P 500, FTSE 100, DAX …) and commodity spot prices are
 * licensed products; nobody gives them away on a free tier. What *is* freely
 * priced is the ETF that tracks each one, and those are ordinary US tickers
 * that Finnhub's free tier quotes through the existing /api/quote proxy.
 *
 * This is the difference between 30 permanently-simulated instruments and 30
 * real ones, so it is worth doing — but it is a proxy, and the product says so
 * rather than quietly passing an ETF off as an index:
 *
 *   - The PRICE shown is the ETF's real price. It is not the index level; SPY
 *     trades near the S&P 500 / 10 while the index itself is in the thousands.
 *     We do not scale it into a fake index level, because a synthesised number
 *     that looks official is exactly the thing /data-sources exists to prevent.
 *   - The CHANGE is the ETF's real daily change, which is what tracking is for
 *     and is accurate to within tracking error and FX.
 *   - Provenance renders "via SPY" so the substitution is visible on screen,
 *     not buried in a docs page.
 *
 * Instruments with no honest proxy are omitted and stay simulated. MOEX has no
 * accessible ETF; VIX futures ETFs (VIXY/VXX) decay and do not track the index,
 * so quoting one as "VIX" would be actively misleading.
 */

export interface Proxy {
  /** ETF ticker Finnhub will price. */
  etf: string;
  /** What it tracks, for the provenance tooltip. */
  note: string;
}

/** Registry key (the instrument's display name) -> tracking ETF. */
export const ETF_PROXIES: Record<string, Proxy> = {
  // ── US indices: the closest tracking there is ──
  "S&P 500":    { etf: "SPY", note: "SPDR S&P 500 ETF" },
  "DOW JONES":  { etf: "DIA", note: "SPDR Dow Jones Industrial Average ETF" },
  "NASDAQ":     { etf: "QQQ", note: "Invesco QQQ (Nasdaq-100)" },

  // ── International indices: iShares single-country funds. These are USD
  //    denominated, so their daily change includes a currency component. ──
  "FTSE 100":   { etf: "EWU", note: "iShares MSCI United Kingdom (USD)" },
  "DAX 40":     { etf: "EWG", note: "iShares MSCI Germany (USD)" },
  "NIKKEI 225": { etf: "EWJ", note: "iShares MSCI Japan (USD)" },
  "HANG SENG":  { etf: "EWH", note: "iShares MSCI Hong Kong (USD)" },
  "SSE COMP":   { etf: "FXI", note: "iShares China Large-Cap (USD)" },
  "CAC 40":     { etf: "EWQ", note: "iShares MSCI France (USD)" },
  "ASX 200":    { etf: "EWA", note: "iShares MSCI Australia (USD)" },
  "NIFTY 50":   { etf: "INDA", note: "iShares MSCI India (USD)" },
  "BOVESPA":    { etf: "EWZ", note: "iShares MSCI Brazil (USD)" },
  "TSX COMP":   { etf: "EWC", note: "iShares MSCI Canada (USD)" },
  "KOSPI":      { etf: "EWY", note: "iShares MSCI South Korea (USD)" },
  "TAIEX":      { etf: "EWT", note: "iShares MSCI Taiwan (USD)" },
  "STI":        { etf: "EWS", note: "iShares MSCI Singapore (USD)" },
  "IBEX 35":    { etf: "EWP", note: "iShares MSCI Spain (USD)" },
  "SMI":        { etf: "EWL", note: "iShares MSCI Switzerland (USD)" },
  "FTSE MIB":   { etf: "EWI", note: "iShares MSCI Italy (USD)" },
  "AEX":        { etf: "EWN", note: "iShares MSCI Netherlands (USD)" },
  "BIST 100":   { etf: "TUR", note: "iShares MSCI Turkey (USD)" },
  "TADAWUL":    { etf: "KSA", note: "iShares MSCI Saudi Arabia (USD)" },
  "TASE":       { etf: "EIS", note: "iShares MSCI Israel (USD)" },

  // ── Commodities ──
  "GOLD":       { etf: "GLD", note: "SPDR Gold Shares" },
  "SILVER":     { etf: "SLV", note: "iShares Silver Trust" },
  "WTI OIL":    { etf: "USO", note: "United States Oil Fund" },
  "BRENT":      { etf: "BNO", note: "United States Brent Oil Fund" },
  "COPPER":     { etf: "CPER", note: "United States Copper Index Fund" },
  "NAT GAS":    { etf: "UNG", note: "United States Natural Gas Fund" },
};

export const proxyFor = (name: string): Proxy | undefined => ETF_PROXIES[name];
export const proxiedNames = (): string[] => Object.keys(ETF_PROXIES);
