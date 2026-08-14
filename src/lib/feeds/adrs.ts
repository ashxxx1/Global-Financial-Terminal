/**
 * Non-US equities, priced through their US-listed ADRs.
 *
 * Finnhub's free tier returns 403 for every international exchange — verified
 * against production for .L, .T, .NS, .DE and .KS. International coverage is a
 * paid feature, full stop.
 *
 * What the free tier *does* price is any US listing, and most large non-US
 * companies have one: an ADR (Toyota → TM), a direct US listing (Shell → SHEL),
 * or a dual listing (Canadian banks trade on the NYSE under their own tickers).
 * Those are real prices for the real company, so the majors can be live.
 *
 * Two honest limits, both surfaced rather than smoothed over:
 *
 *  1. Coverage is large-cap only. Mid- and small-caps have no US listing and
 *     stay simulated; there is no free route to them at any quality.
 *  2. An ADR is priced in USD and often represents a ratio of ordinary shares
 *     (Toyota's ADR is 10 ordinary shares), so the PRICE is the ADR's, not the
 *     local share price, and the daily change carries an FX component. The row
 *     names the ADR inline for exactly this reason.
 *
 * Same rule as the index proxies: never rescale into a synthetic local price.
 * A number that looks like the Tokyo close but isn't is worse than an honest
 * ADR that says what it is.
 *
 * Every symbol here was verified against production before being added. Six
 * candidates were REMOVED on the evidence:
 *   - SSNLF (Samsung), HYMTF (Hyundai), LGCLF (LG Chem) quote a price of 0.
 *   - SBKFF (+12.5%/day), BDORY (-10.4%), WOLWF (+6.8%) are grey-market tickers
 *     so thin that a single trade sets the price. Those are not the underlying
 *     company's real daily move, and printing them would be worse than showing
 *     nothing — which is why those names stay simulated and labelled.
 */

/** Local registry ticker -> US-listed symbol Finnhub will price. */
export const ADR_MAP: Record<string, string> = {
  // ── United Kingdom (many are direct US listings, not ADRs) ──
  SHEL: "SHEL", BP: "BP", HSBA: "HSBC", AZN: "AZN", GSK: "GSK",
  ULVR: "UL", BARC: "BCS", LLOY: "LYG", RIO: "RIO", VOD: "VOD",

  // ── Japan ──
  "7203": "TM",     // Toyota
  "6758": "SONY",   // Sony
  "7267": "HMC",    // Honda
  "8306": "MUFG",   // Mitsubishi UFJ
  "9984": "SFTBY",  // SoftBank
  "8035": "TOELY",  // Tokyo Electron
  "6501": "HTHIY",  // Hitachi
  "7974": "NTDOY",  // Nintendo

  // ── Germany ──
  SAP: "SAP", SIE: "SIEGY", ALV: "ALIZY", BAYN: "BAYRY",
  BMW: "BMWYY", MBG: "MBGYY", VOW3: "VWAGY", DTE: "DTEGY",

  // ── France ──
  MC: "LVMUY", OR: "LRLCY", TTE: "TTE", SAN: "SNY",
  AIR: "EADSY", BNP: "BNPQY", CS: "AXAHY",

  // ── Switzerland ──
  NESN: "NSRGY", ROG: "RHHBY", NOVN: "NVS", ABBN: "ABBNY",
  UBSG: "UBS", ZURN: "ZURVY",

  // ── Netherlands ──
  ASML: "ASML", PHIA: "PHG", ING: "ING", HEIA: "HEINY",
  AD: "ADRNY", WKL: "WTKWY",

  // ── South Korea: no usable US listing. Samsung (SSNLF), Hyundai (HYMTF) and
  //    LG Chem (LGCLF) all return a price of 0 on the free tier — verified —
  //    so Korea stays simulated rather than showing a dead quote.

  // ── Taiwan ──
  "2330": "TSM",      // TSMC
  "2317": "HNHPF",    // Foxconn
  "2412": "CHT",      // Chunghwa Telecom
  "3711": "ASX",      // ASE Technology

  // ── India ──
  INFY: "INFY", HDFCBANK: "HDB", ICICIBANK: "IBN",
  WIPRO: "WIT", TATAMOTORS: "TTM",

  // ── China / Hong Kong ──
  "601318": "PNGAY",  // Ping An
  "002594": "BYDDY",  // BYD
  "600519": "MHGVY",  // Kweichow Moutai
  "601398": "IDCBY",  // ICBC

  // ── Brazil ──
  PETR4: "PBR", VALE3: "VALE", ITUB4: "ITUB", BBDC4: "BBD",
  ABEV3: "ABEV",   // BBAS3 omitted: BDORY is grey-market and unreliable

  // ── Canada (dual-listed on the NYSE under their own tickers) ──
  RY: "RY", TD: "TD", BNS: "BNS", CNQ: "CNQ", SU: "SU",
  SHOP: "SHOP", CNR: "CNI", BCE: "BCE", ENB: "ENB", TRP: "TRP",

  // ── Australia ──
  BHP: "BHP", CBA: "CMWAY", NAB: "NABZY", ANZ: "ANZGY",
  WBC: "WBK", CSL: "CSLLY",   // WOW omitted: WOLWF is grey-market

  // ── Others ──
  NOKIA: "NOK", ERICB: "ERIC", EQNR: "EQNR", NVO: "NVO",
  TSM: "TSM", SPOT: "SPOT",
};

export const adrFor = (ticker: string): string | undefined => ADR_MAP[ticker];
export const adrCount = (): number => Object.keys(ADR_MAP).length;
