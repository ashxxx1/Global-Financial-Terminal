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
  // ── GB ──
  "GB:SHEL": "SHEL", "GB:BP": "BP", "GB:HSBA": "HSBC", "GB:AZN": "AZN", "GB:GSK": "GSK", "GB:ULVR": "UL", "GB:BARC": "BCS", "GB:LLOY": "LYG", "GB:RIO": "RIO", "GB:VOD": "VOD", "GB:DGE": "DEO", "GB:BATS": "BTI", "GB:AAL": "NGLOY",
  // ── JP ──
  "JP:7203": "TM", "JP:6758": "SONY", "JP:7267": "HMC", "JP:8306": "MUFG", "JP:9984": "SFTBY", "JP:8035": "TOELY", "JP:6501": "HTHIY", "JP:7974": "NTDOY", "JP:9432": "NTTYY", "JP:9433": "KDDIY", "JP:8316": "SMFG", "JP:4568": "DSNKY", "JP:7270": "FUJHY",
  // ── DE ──
  "DE:SAP": "SAP", "DE:SIE": "SIEGY", "DE:ALV": "ALIZY", "DE:BAYN": "BAYRY", "DE:BMW": "BMWYY", "DE:MBG": "MBGYY", "DE:VOW3": "VWAGY", "DE:DTE": "DTEGY", "DE:BAS": "BASFY", "DE:RWE": "RWEOY", "DE:DBK": "DB",
  // ── FR ──
  "FR:MC": "LVMUY", "FR:OR": "LRLCY", "FR:TTE": "TTE", "FR:SAN": "SNY", "FR:AIR": "EADSY", "FR:BNP": "BNPQY", "FR:CS": "AXAHY", "FR:SGO": "CODYY", "FR:KER": "PPRUY", "FR:CAP": "CGEMY", "FR:DG": "VCISY",
  // ── CH ──
  "CH:NESN": "NSRGY", "CH:ROG": "RHHBY", "CH:NOVN": "NVS", "CH:ABBN": "ABBNY", "CH:UBSG": "UBS", "CH:ZURN": "ZURVY", "CH:LONN": "LZAGY", "CH:SIKA": "SXYAY",
  // ── NL ──
  "NL:ASML": "ASML", "NL:PHIA": "PHG", "NL:ING": "ING", "NL:HEIA": "HEINY", "NL:AD": "ADRNY", "NL:WKL": "WTKWY", "NL:AKZA": "AKZOY",
  // ── TW ──
  "TW:2303": "UMC",
  "TW:2330": "TSM", "TW:2317": "HNHPF", "TW:2412": "CHT", "TW:3711": "ASX",
  // ── IN ──
  "IN:DRREDDY": "RDY",
  "IN:INFY": "INFY", "IN:HDFCBANK": "HDB", "IN:ICICIBANK": "IBN", "IN:WIPRO": "WIT", "IN:TATAMOTORS": "TTM",
  // ── CN ──
  "CN:601318": "PNGAY", "CN:002594": "BYDDY", "CN:601398": "IDCBY",
  // ── BR ──
  "BR:VIVT3": "VIV",
  "BR:PETR4": "PBR", "BR:VALE3": "VALE", "BR:ITUB4": "ITUB", "BR:BBDC4": "BBD", "BR:ABEV3": "ABEV",
  // ── CA ──
  "CA:BAM": "BAM",
  "CA:RY": "RY", "CA:TD": "TD", "CA:BNS": "BNS", "CA:CNQ": "CNQ", "CA:SU": "SU", "CA:SHOP": "SHOP", "CA:CNR": "CNI", "CA:BCE": "BCE", "CA:ENB": "ENB", "CA:TRP": "TRP",
  // ── AU ──
  "AU:RIO": "RIO", "AU:WDS": "WDS",
  "AU:BHP": "BHP", "AU:CBA": "CMWAY", "AU:NAB": "NABZY", "AU:ANZ": "ANZGY", "AU:WBC": "WBK", "AU:CSL": "CSLLY",
  // ── ES ──
  "ES:SAN": "SAN", "ES:BBVA": "BBVA", "ES:IBE": "IBDRY", "ES:REP": "REPYY", "ES:TEF": "TEF", "ES:ITX": "IDEXY", "ES:FER": "FER",
  // ── IT ──
  "IT:ENI": "E", "IT:ENEL": "ENLAY", "IT:ISP": "ISNPY", "IT:UCG": "UNCRY", "IT:STLA": "STLA", "IT:RACE": "RACE", "IT:PRY": "PRYMY",
  // ── SE ──
  "SE:VOLV-B": "VLVLY", "SE:HM-B": "HNNMY", "SE:SAND": "SDVKY", "SE:NDA-SE": "NRDBY", "SE:ATCO-A": "ATLKY", "SE:SWED-A": "SWDBY", "SE:ERICB": "ERIC", "SE:SPOT": "SPOT",
  // ── DK ──
  "DK:NOVO-B": "NVO", "DK:CARL-B": "CABGY", "DK:ORSTED": "DNNGY", "DK:VWS": "VWDRY", "DK:COLO-B": "CLPBY",
  // ── NO ──
  "NO:TEL": "TELNY", "NO:DNB": "DNBBY", "NO:YAR": "YARIY", "NO:MOWI": "MHGVY", "NO:EQNR": "EQNR",
  // ── MX ──
  "MX:ASURB": "ASR",
  "MX:AMXL": "AMX", "MX:FEMSAUBD": "FMX", "MX:KOFUBL": "KOF", "MX:GMEXICOB": "GMBXF",
  // ── ZA ──
  "ZA:NPN": "NPSNY", "ZA:GLN": "GLNCY", "ZA:SOL": "SSL", "ZA:MTN": "MTNOY",
  // ── HK ──
  "HK:0700": "TCEHY", "HK:9988": "BABA", "HK:1299": "AAGIY", "HK:0388": "HKXCY", "HK:0005": "HSBC",
  // ── IL ──
  "IL:ELBIT": "ESLT", "IL:MNDY": "MNDY",
  "IL:CHKP": "CHKP", "IL:NICE": "NICE", "IL:TEVA": "TEVA", "IL:ICL": "ICL",
  // ── AR ──
  "AR:PAMP": "PAM", "AR:CRES": "CRESY",
  "AR:YPF": "YPF", "AR:MELI": "MELI", "AR:BMA": "BMA", "AR:GGAL": "GGAL",
  // ── CH ── Alcon is Swiss but lists primarily on the NYSE.
  "CH:ALC": "ALC",
  // ── CL ──
  "CL:BSANTANDER": "BSAC", "CL:CHILE": "BCH", "CL:ENELCHILE": "ENIC",
  "CL:SQM-B": "SQM", "CL:CCU": "CCU",
  // ── KR ── Korea's four US-listed majors. The chaebol manufacturers
  // (Samsung Electronics, Hyundai, SK Hynix) have no US listing at all — only
  // grey-market lines that quote zero or stale, so they stay simulated.
  "KR:105560": "KB", "KR:055550": "SHG", "KR:017670": "SKM", "KR:030200": "KT",
  // ── ID ──
  "ID:TLKM": "TLK",
  // ── CO ── Bancolombia's ordinary and preferred lines share one NYSE ADR.
  "CO:EC": "EC", "CO:BCOLO": "CIB", "CO:PFBCOLOM": "CIB", "CO:GRUPOAVAL": "AVAL",
  // ── PE ── all three are NYSE primary listings, not ADRs.
  "PE:SCCO": "SCCO", "PE:BAP": "BAP", "PE:IFS": "IFS",
  // ── IE ── CRH moved its primary listing to the NYSE in 2023.
  "IE:CRH": "CRH", "IE:RYA": "RYAAY",
  // ── BE ──
  "BE:ABI": "BUD", "BE:ARGX": "ARGX",
  // ── FI ──
  "FI:NOKIA": "NOK",
};

/** Keyed "COUNTRY:TICKER" — local tickers collide across exchanges (SAN is
 *  Sanofi in Paris and Santander in Madrid), so the country is part of the key. */
/* Removed after verification against production:
 *   CYBR, DNSKY, KYCCY — quote a price of 0 on this tier.
 *   AMKBY (Maersk) printed +8.4% in a day, the signature of a thin OTC line
 *   rather than a real move, so it is kept out for the same reason SBKFF and
 *   BDORY were.
 */
export const adrFor = (ticker: string, country?: string | null): string | undefined =>
  country ? ADR_MAP[`${country}:${ticker}`] : undefined;
export const adrCount = (): number => Object.keys(ADR_MAP).length;
