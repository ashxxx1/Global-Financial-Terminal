// Curated real financial centers (stock exchanges / financial hubs) with
// verified lat/lon, market code, and importance tier. These are the persistent
// nodes rendered on the globe. countryName maps each to an entry in COUNTRIES
// so the intelligence panel can reuse the country market model.
export const FINANCIAL_CENTERS = [
  // Tier 1 — global hubs
  { city: "New York",     countryName: "United States",        lat: 40.71, lon: -74.01, code: "NYSE",     tier: 1 },
  { city: "London",       countryName: "United Kingdom",       lat: 51.51, lon: -0.13,  code: "LSE",      tier: 1 },
  { city: "Tokyo",        countryName: "Japan",                lat: 35.68, lon: 139.69, code: "TSE",      tier: 1 },
  { city: "Hong Kong",    countryName: "China",                lat: 22.32, lon: 114.17, code: "HKEX",     tier: 1 },
  { city: "Shanghai",     countryName: "China",                lat: 31.23, lon: 121.47, code: "SSE",      tier: 1 },
  { city: "Singapore",    countryName: "Singapore",            lat: 1.29,  lon: 103.85, code: "SGX",      tier: 1 },
  { city: "Frankfurt",    countryName: "Germany",              lat: 50.11, lon: 8.68,   code: "XETRA",    tier: 1 },
  // Tier 2 — major regional markets
  { city: "Paris",        countryName: "France",               lat: 48.85, lon: 2.35,   code: "EURONEXT", tier: 2 },
  { city: "Shenzhen",     countryName: "China",                lat: 22.54, lon: 114.06, code: "SZSE",     tier: 2 },
  { city: "Mumbai",       countryName: "India",                lat: 19.08, lon: 72.88,  code: "NSE",      tier: 2 },
  { city: "Seoul",        countryName: "South Korea",          lat: 37.57, lon: 126.98, code: "KRX",      tier: 2 },
  { city: "Toronto",      countryName: "Canada",               lat: 43.65, lon: -79.38, code: "TSX",      tier: 2 },
  { city: "Sydney",       countryName: "Australia",            lat: -33.87,lon: 151.21, code: "ASX",      tier: 2 },
  { city: "Zurich",       countryName: "Switzerland",          lat: 47.37, lon: 8.54,   code: "SIX",      tier: 2 },
  { city: "Sao Paulo",    countryName: "Brazil",               lat: -23.55,lon: -46.63, code: "B3",       tier: 2 },
  { city: "Taipei",       countryName: "Taiwan",               lat: 25.03, lon: 121.57, code: "TWSE",     tier: 2 },
  // Tier 3 — national markets
  { city: "Dubai",        countryName: "United Arab Emirates", lat: 25.20, lon: 55.27,  code: "DFM",      tier: 3 },
  { city: "Amsterdam",    countryName: "Netherlands",          lat: 52.37, lon: 4.90,   code: "AEX",      tier: 3 },
  { city: "Madrid",       countryName: "Spain",                lat: 40.42, lon: -3.70,  code: "BME",      tier: 3 },
  { city: "Milan",        countryName: "Italy",                lat: 45.46, lon: 9.19,   code: "MIB",      tier: 3 },
  { city: "Johannesburg", countryName: "South Africa",         lat: -26.20,lon: 28.04,  code: "JSE",      tier: 3 },
  { city: "Moscow",       countryName: "Russia",               lat: 55.75, lon: 37.62,  code: "MOEX",     tier: 3 },
  { city: "Mexico City",  countryName: "Mexico",               lat: 19.43, lon: -99.13, code: "BMV",      tier: 3 },
  { city: "Jakarta",      countryName: "Indonesia",            lat: -6.21, lon: 106.85, code: "IDX",      tier: 3 },
  { city: "Riyadh",       countryName: "Saudi Arabia",         lat: 24.71, lon: 46.68,  code: "TADAWUL",  tier: 3 },
  { city: "Istanbul",     countryName: "Turkey",               lat: 41.01, lon: 28.98,  code: "BIST",     tier: 3 },
  { city: "Bangkok",      countryName: "Thailand",             lat: 13.75, lon: 100.50, code: "SET",      tier: 3 },
];
