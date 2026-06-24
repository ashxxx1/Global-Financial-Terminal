export const indicesData = [
  { name: "S&P 500", value: "5,487.23", change: "+1.24%", isPositive: true },
  { name: "DOW JONES", value: "43,218.45", change: "+0.87%", isPositive: true },
  { name: "NASDAQ", value: "19,876.54", change: "+1.67%", isPositive: true },
  { name: "FTSE 100", value: "8,143.76", change: "-0.29%", isPositive: false },
  { name: "DAX 40", value: "18,234.56", change: "-0.78%", isPositive: false },
  { name: "NIKKEI 225", value: "39,847.12", change: "+0.79%", isPositive: true },
  { name: "HANG SENG", value: "18,342.11", change: "+0.43%", isPositive: true },
  { name: "SSE COMP", value: "3,124.56", change: "+1.47%", isPositive: true },
  { name: "CAC 40", value: "7,823.45", change: "-0.44%", isPositive: false },
  { name: "ASX 200", value: "7,834.21", change: "+0.73%", isPositive: true },
  { name: "NIFTY 50", value: "24,567.89", change: "+0.96%", isPositive: true },
  { name: "BOVESPA", value: "128,456", change: "-0.95%", isPositive: false },
  { name: "TSX COMP", value: "22,145.67", change: "+0.40%", isPositive: true },
  { name: "KOSPI", value: "2,847.23", change: "+1.23%", isPositive: true },
  { name: "TAIEX", value: "21,456.78", change: "+1.10%", isPositive: true },
];

export const topTicks = [
  { name: "BTC", value: "$67,234", change: "+2.4%", isPositive: true },
  { name: "GOLD", value: "$2,387", change: "+0.8%", isPositive: true },
  { name: "VIX", value: "14.32", change: "-3.2%", isPositive: true },
];

// ─── Accurate country stats (IMF/World Bank 2024 data) ───────────────────────
// gdp = USD trillions | inflation/rate = % | currency = local FX rate vs USD or index
export const countryStats = {
  US: {
    gdp: "27.4", inflation: "3.2", rate: "5.50", currency: "104.50 (DXY)",
    riskScore: 28,
    companies: [
      { name: "Apple Inc.", returns: { "1D": 1.2, "1W": 2.4, "1M": 5.6 } },
      { name: "Microsoft", returns: { "1D": 0.8, "1W": -1.2, "1M": 3.4 } },
      { name: "JPMorgan Chase", returns: { "1D": -0.5, "1W": 1.1, "1M": 2.2 } }
    ],
    aiAnalysis: "Strong AI investments driving tech sector. Inflation remains sticky, implying rates will remain higher for longer. Consumer spending holding up despite tighter financial conditions.",
    marketReturns: { "1D": 1.2, "1W": -0.5, "1M": 2.1, "YTD": 12.4 }
  },
  CN: {
    gdp: "17.9", inflation: "-0.8", rate: "3.45", currency: "7.24 (USD/CNY)",
    riskScore: 65,
    companies: [
      { name: "Tencent", returns: { "1D": 2.1, "1W": -3.4, "1M": 1.2 } },
      { name: "Alibaba", returns: { "1D": 1.5, "1W": -2.1, "1M": -5.6 } },
      { name: "ICBC", returns: { "1D": 0.2, "1W": 0.5, "1M": 1.1 } }
    ],
    aiAnalysis: "Deflationary pressures persisting. PBOC maintaining accommodative stance. Property sector restructuring continues to drag on broader growth outlook.",
    marketReturns: { "1D": 1.5, "1W": -2.8, "1M": -1.4, "YTD": -4.2 }
  },
  JP: {
    gdp: "4.2", inflation: "2.8", rate: "0.10", currency: "151.20 (USD/JPY)",
    riskScore: 15,
    companies: [
      { name: "Toyota Motor", returns: { "1D": -1.2, "1W": 4.5, "1M": 8.2 } },
      { name: "Sony Group", returns: { "1D": 0.5, "1W": 2.1, "1M": -1.4 } },
      { name: "Mitsubishi UFJ", returns: { "1D": 1.8, "1W": 5.6, "1M": 12.4 } }
    ],
    aiAnalysis: "Historic shift in monetary policy underway. Yield curve control adjustments expected. Weak Yen supporting export earnings significantly.",
    marketReturns: { "1D": -0.8, "1W": 3.2, "1M": 5.4, "YTD": 18.6 }
  },
  DE: {
    gdp: "4.1", inflation: "2.4", rate: "4.50", currency: "1.08 (EUR/USD)",
    riskScore: 22,
    companies: [
      { name: "SAP SE", returns: { "1D": 1.4, "1W": 2.8, "1M": 6.5 } },
      { name: "Siemens AG", returns: { "1D": -0.6, "1W": -1.2, "1M": 0.8 } },
      { name: "Allianz SE", returns: { "1D": 0.2, "1W": 1.5, "1M": 3.2 } }
    ],
    aiAnalysis: "Industrial sector facing prolonged weakness from energy transition costs. Services sector remains resilient. ECB rate cut expectations heavily weighted.",
    marketReturns: { "1D": -0.4, "1W": 1.2, "1M": 2.8, "YTD": 6.4 }
  },
  GB: {
    gdp: "3.1", inflation: "3.4", rate: "5.25", currency: "1.26 (GBP/USD)",
    riskScore: 30,
    companies: [
      { name: "AstraZeneca", returns: { "1D": -1.5, "1W": -2.4, "1M": -4.2 } },
      { name: "HSBC Holdings", returns: { "1D": 0.8, "1W": 2.1, "1M": 4.5 } },
      { name: "Shell plc", returns: { "1D": 1.2, "1W": 3.5, "1M": 5.2 } }
    ],
    aiAnalysis: "Labour market cooling. Bank of England adopting cautious approach to easing. Fiscal headroom remains constrained post-pandemic.",
    marketReturns: { "1D": 0.2, "1W": -1.1, "1M": 1.8, "YTD": 4.2 }
  },
  IN: {
    gdp: "3.5", inflation: "5.1", rate: "6.50", currency: "83.15 (USD/INR)",
    riskScore: 42,
    companies: [
      { name: "Reliance Industries", returns: { "1D": 1.8, "1W": 4.2, "1M": 8.5 } },
      { name: "TCS", returns: { "1D": 0.5, "1W": -1.2, "1M": 2.4 } },
      { name: "HDFC Bank", returns: { "1D": -0.4, "1W": 1.8, "1M": 3.2 } }
    ],
    aiAnalysis: "Strong domestic demand. Capital expenditure cycles extending. FDI inflows stabilizing amid global supply chain relocations.",
    marketReturns: { "1D": 1.4, "1W": 2.8, "1M": 6.5, "YTD": 14.2 }
  },
  FR: {
    gdp: "2.9", inflation: "2.3", rate: "4.50", currency: "1.08 (EUR/USD)",
    riskScore: 35,
    companies: [
      { name: "LVMH", returns: { "1D": -0.8, "1W": -2.1, "1M": 3.4 } },
      { name: "TotalEnergies", returns: { "1D": 1.1, "1W": 2.4, "1M": 4.2 } },
      { name: "BNP Paribas", returns: { "1D": 0.4, "1W": 1.8, "1M": 5.6 } }
    ],
    aiAnalysis: "Political uncertainty weighing on business confidence. Luxury sector showing resilience despite slowing China demand. Fiscal deficit concerns persist.",
    marketReturns: { "1D": -0.6, "1W": 0.8, "1M": 2.1, "YTD": 3.8 }
  },
  IT: {
    gdp: "2.1", inflation: "1.8", rate: "4.50", currency: "1.08 (EUR/USD)",
    riskScore: 48,
    companies: [
      { name: "Enel SpA", returns: { "1D": 0.6, "1W": 1.4, "1M": 3.8 } },
      { name: "Ferrari NV", returns: { "1D": 1.2, "1W": 3.1, "1M": 7.2 } },
      { name: "UniCredit", returns: { "1D": 1.8, "1W": 4.5, "1M": 12.3 } }
    ],
    aiAnalysis: "Debt sustainability risks remain elevated. Tourism sector providing near-term GDP support. ECB policy transmission creating headwinds for SMEs.",
    marketReturns: { "1D": 0.3, "1W": 1.5, "1M": 4.2, "YTD": 9.1 }
  },
  CA: {
    gdp: "2.1", inflation: "2.9", rate: "5.00", currency: "1.36 (USD/CAD)",
    riskScore: 20,
    companies: [
      { name: "Shopify", returns: { "1D": 2.4, "1W": 5.8, "1M": 12.4 } },
      { name: "Royal Bank of Canada", returns: { "1D": 0.6, "1W": 1.2, "1M": 3.4 } },
      { name: "Suncor Energy", returns: { "1D": 1.1, "1W": 2.8, "1M": 5.6 } }
    ],
    aiAnalysis: "Housing market imbalances persisting. Resource sector benefiting from commodity cycle. Bank of Canada likely to lead rate cuts among G7 peers.",
    marketReturns: { "1D": 0.4, "1W": 0.9, "1M": 2.6, "YTD": 5.8 }
  },
  KR: {
    gdp: "1.7", inflation: "3.1", rate: "3.50", currency: "1,324 (USD/KRW)",
    riskScore: 35,
    companies: [
      { name: "Samsung Electronics", returns: { "1D": 1.8, "1W": 4.2, "1M": 9.6 } },
      { name: "SK Hynix", returns: { "1D": 3.2, "1W": 8.4, "1M": 22.1 } },
      { name: "Hyundai Motor", returns: { "1D": 0.5, "1W": 1.8, "1M": 4.2 } }
    ],
    aiAnalysis: "Semiconductor export surge driven by AI memory demand. Geopolitical exposure to North Korea risk priced in. Export-led recovery underway.",
    marketReturns: { "1D": 1.2, "1W": 3.4, "1M": 8.9, "YTD": 11.4 }
  },
  AU: {
    gdp: "1.7", inflation: "3.8", rate: "4.35", currency: "0.65 (AUD/USD)",
    riskScore: 18,
    companies: [
      { name: "BHP Group", returns: { "1D": 0.8, "1W": 1.6, "1M": -2.4 } },
      { name: "Commonwealth Bank", returns: { "1D": 0.4, "1W": 0.9, "1M": 2.8 } },
      { name: "Macquarie Group", returns: { "1D": 1.1, "1W": 2.4, "1M": 5.6 } }
    ],
    aiAnalysis: "Commodity sector facing China demand headwinds. RBA maintaining restrictive stance amid stubborn core inflation. Services exports holding up.",
    marketReturns: { "1D": 0.7, "1W": -0.4, "1M": 1.9, "YTD": 4.2 }
  },
  BR: {
    gdp: "2.2", inflation: "4.6", rate: "10.50", currency: "5.08 (USD/BRL)",
    riskScore: 58,
    companies: [
      { name: "Petrobras", returns: { "1D": 1.4, "1W": 3.2, "1M": 6.8 } },
      { name: "Vale SA", returns: { "1D": -0.8, "1W": -2.4, "1M": -5.6 } },
      { name: "Itaú Unibanco", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.2 } }
    ],
    aiAnalysis: "Fiscal credibility concerns weighing on BRL. Strong agricultural exports offsetting industrial weakness. Central bank navigating political pressure to cut rates.",
    marketReturns: { "1D": -0.9, "1W": -2.1, "1M": -4.8, "YTD": -8.4 }
  },
  MX: {
    gdp: "1.4", inflation: "4.8", rate: "11.00", currency: "17.15 (USD/MXN)",
    riskScore: 52,
    companies: [
      { name: "América Móvil", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "FEMSA", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.2 } },
      { name: "Grupo Bimbo", returns: { "1D": 0.2, "1W": 0.8, "1M": 2.1 } }
    ],
    aiAnalysis: "Nearshoring investment boom benefiting from US-China decoupling. Peso resilient on high carry. Political transition risks ahead of elections.",
    marketReturns: { "1D": 0.3, "1W": -0.8, "1M": 2.4, "YTD": 3.6 }
  },
  RU: {
    gdp: "2.0", inflation: "7.4", rate: "16.00", currency: "88.50 (USD/RUB)",
    riskScore: 92,
    companies: [
      { name: "Gazprom", returns: { "1D": -1.2, "1W": -3.4, "1M": -8.6 } },
      { name: "Sberbank", returns: { "1D": 0.8, "1W": 2.1, "1M": 4.5 } },
      { name: "Lukoil", returns: { "1D": -0.4, "1W": -1.8, "1M": -3.2 } }
    ],
    aiAnalysis: "Wartime economy under heavy Western sanctions. Elevated inflation driven by military spending. Capital controls limiting market price discovery.",
    marketReturns: { "1D": -0.5, "1W": 1.2, "1M": -2.4, "YTD": -6.8 }
  },
  SA: {
    gdp: "1.1", inflation: "1.6", rate: "6.00", currency: "3.75 (USD/SAR)",
    riskScore: 38,
    companies: [
      { name: "Saudi Aramco", returns: { "1D": 0.6, "1W": 1.8, "1M": 3.4 } },
      { name: "Al Rajhi Bank", returns: { "1D": 0.4, "1W": 1.2, "1M": 2.8 } },
      { name: "SABIC", returns: { "1D": -0.2, "1W": 0.8, "1M": 1.6 } }
    ],
    aiAnalysis: "Vision 2030 diversification progressing. Oil revenue volatility remains key budget risk. NEOM mega-project driving construction sector activity.",
    marketReturns: { "1D": 0.4, "1W": 1.1, "1M": 2.6, "YTD": 5.2 }
  },
  ZA: {
    gdp: "0.40", inflation: "5.6", rate: "8.25", currency: "18.62 (USD/ZAR)",
    riskScore: 68,
    companies: [
      { name: "Anglo American", returns: { "1D": 1.4, "1W": 3.2, "1M": 7.8 } },
      { name: "Standard Bank", returns: { "1D": 0.6, "1W": 1.4, "1M": 3.2 } },
      { name: "Naspers", returns: { "1D": 1.8, "1W": 4.2, "1M": 9.6 } }
    ],
    aiAnalysis: "Structural power outages constraining growth. Coalition government providing near-term political stability. Mining sector sensitive to China commodity demand.",
    marketReturns: { "1D": 0.8, "1W": 2.1, "1M": 5.4, "YTD": 8.6 }
  },
  NG: {
    gdp: "0.40", inflation: "29.9", rate: "24.75", currency: "1,480 (USD/NGN)",
    riskScore: 78,
    companies: [
      { name: "Dangote Cement", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "MTN Nigeria", returns: { "1D": -0.8, "1W": -2.4, "1M": -5.6 } },
      { name: "Zenith Bank", returns: { "1D": 1.2, "1W": 3.4, "1M": 8.2 } }
    ],
    aiAnalysis: "Currency liberalisation driving near-term inflation surge. Oil sector recovering from theft disruptions. Reforms show medium-term potential if sustained.",
    marketReturns: { "1D": -0.4, "1W": -1.8, "1M": -4.2, "YTD": -12.4 }
  },
  EG: {
    gdp: "0.40", inflation: "32.5", rate: "27.25", currency: "48.40 (USD/EGP)",
    riskScore: 74,
    companies: [
      { name: "Commercial Intl Bank", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } },
      { name: "EFG Hermes", returns: { "1D": 1.2, "1W": 3.4, "1M": 8.6 } },
      { name: "Telecom Egypt", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.2 } }
    ],
    aiAnalysis: "IMF programme providing external anchor. Currency devaluation improving competitiveness. High debt servicing costs constraining fiscal space significantly.",
    marketReturns: { "1D": 0.6, "1W": 1.8, "1M": 4.2, "YTD": 6.8 }
  },
  AR: {
    gdp: "0.64", inflation: "289.4", rate: "60.00", currency: "876 (USD/ARS)",
    riskScore: 88,
    companies: [
      { name: "MercadoLibre", returns: { "1D": 2.4, "1W": 5.8, "1M": 14.2 } },
      { name: "YPF", returns: { "1D": 1.8, "1W": 4.2, "1M": 9.6 } },
      { name: "Banco Macro", returns: { "1D": 1.2, "1W": 3.4, "1M": 8.4 } }
    ],
    aiAnalysis: "Milei shock therapy reducing fiscal deficit but at social cost. Hyperinflation gradually being tamed. Debt restructuring risk remains a tail scenario.",
    marketReturns: { "1D": 1.4, "1W": 4.2, "1M": 12.6, "YTD": 48.4 }
  },
  TR: {
    gdp: "1.1", inflation: "67.1", rate: "50.00", currency: "32.48 (USD/TRY)",
    riskScore: 72,
    companies: [
      { name: "Akbank", returns: { "1D": 1.2, "1W": 3.4, "1M": 8.6 } },
      { name: "Bim Birlesik", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.2 } },
      { name: "Turkcell", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } }
    ],
    aiAnalysis: "Orthodoxy returning to monetary policy. TRY stabilising but inflation remains extreme. Current account deficit narrowing on tourism receipts.",
    marketReturns: { "1D": 0.8, "1W": 2.4, "1M": 6.8, "YTD": 18.4 }
  },
  ID: {
    gdp: "1.4", inflation: "2.8", rate: "6.25", currency: "15,724 (USD/IDR)",
    riskScore: 44,
    companies: [
      { name: "Bank Central Asia", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "Astra International", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.2 } },
      { name: "Telkom Indonesia", returns: { "1D": 0.2, "1W": 0.8, "1M": 2.1 } }
    ],
    aiAnalysis: "Natural resource wealth supporting fiscal position. Nickel export restrictions reshaping EV supply chain. Domestic consumption growth outpacing regional peers.",
    marketReturns: { "1D": 0.4, "1W": 1.2, "1M": 3.4, "YTD": 6.8 }
  },
  SG: {
    gdp: "0.50", inflation: "2.7", rate: "3.68", currency: "1.34 (USD/SGD)",
    riskScore: 8,
    companies: [
      { name: "DBS Group", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } },
      { name: "Sea Limited", returns: { "1D": 2.4, "1W": 5.8, "1M": 14.2 } },
      { name: "Singapore Airlines", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } }
    ],
    aiAnalysis: "Regional financial hub role strengthening as China tensions persist. MAS maintaining tight policy via SGD appreciation. AI data centre investment influx.",
    marketReturns: { "1D": 0.6, "1W": 1.4, "1M": 3.8, "YTD": 7.2 }
  },
  CH: {
    gdp: "0.81", inflation: "1.4", rate: "1.50", currency: "0.89 (USD/CHF)",
    riskScore: 5,
    companies: [
      { name: "Nestlé SA", returns: { "1D": 0.2, "1W": 0.6, "1M": 1.8 } },
      { name: "Novartis", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } },
      { name: "UBS Group", returns: { "1D": 1.2, "1W": 3.4, "1M": 8.6 } }
    ],
    aiAnalysis: "Safe-haven currency appreciation pressuring export competitiveness. SNB cutting rates early among developed peers. Private banking inflows accelerating.",
    marketReturns: { "1D": 0.2, "1W": 0.8, "1M": 2.4, "YTD": 5.6 }
  },
  TW: {
    gdp: "0.79", inflation: "2.4", rate: "2.00", currency: "31.85 (USD/TWD)",
    riskScore: 55,
    companies: [
      { name: "TSMC", returns: { "1D": 2.8, "1W": 6.4, "1M": 18.6 } },
      { name: "MediaTek", returns: { "1D": 1.8, "1W": 4.2, "1M": 9.6 } },
      { name: "Foxconn", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } }
    ],
    aiAnalysis: "Semiconductor dominance via TSMC creates global strategic importance. Cross-strait risk priced into discount vs peers. AI chip demand creating strong earnings momentum.",
    marketReturns: { "1D": 1.8, "1W": 4.2, "1M": 12.4, "YTD": 28.6 }
  },
  NL: {
    gdp: "1.10", inflation: "2.8", rate: "4.50", currency: "1.08 (EUR/USD)",
    riskScore: 14,
    companies: [
      { name: "ASML Holding", returns: { "1D": 2.4, "1W": 5.8, "1M": 14.2 } },
      { name: "Shell plc", returns: { "1D": 1.2, "1W": 3.4, "1M": 5.2 } },
      { name: "ING Group", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } }
    ],
    aiAnalysis: "ASML's EUV monopoly creating critical chokepoint in global chip supply. Export controls restricting China sales but demand robust elsewhere.",
    marketReturns: { "1D": 1.4, "1W": 3.2, "1M": 8.6, "YTD": 16.4 }
  },
  SE: {
    gdp: "0.60", inflation: "4.1", rate: "3.75", currency: "10.58 (USD/SEK)",
    riskScore: 18,
    companies: [
      { name: "Spotify", returns: { "1D": 2.1, "1W": 4.8, "1M": 11.4 } },
      { name: "Ericsson", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "Volvo Group", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.2 } }
    ],
    aiAnalysis: "Krona weakness fading as Riksbank pivots. Housing market stabilising after sharp correction. Strong tech startup ecosystem remains growth engine.",
    marketReturns: { "1D": 0.8, "1W": 2.1, "1M": 5.4, "YTD": 9.8 }
  },
  NO: {
    gdp: "0.59", inflation: "3.6", rate: "4.50", currency: "10.68 (USD/NOK)",
    riskScore: 10,
    companies: [
      { name: "Equinor", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.2 } },
      { name: "DNB Bank", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "Norsk Hydro", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } }
    ],
    aiAnalysis: "Sovereign wealth fund exceeds $1.6T. Oil revenues buffering fiscal accounts. Krone sensitive to oil price movements and global risk appetite.",
    marketReturns: { "1D": 0.4, "1W": 1.2, "1M": 3.4, "YTD": 6.8 }
  },
  AE: {
    gdp: "0.51", inflation: "3.8", rate: "5.40", currency: "3.67 (USD/AED)",
    riskScore: 20,
    companies: [
      { name: "Emirates NBD", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.2 } },
      { name: "ADNOC", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "DP World", returns: { "1D": 0.8, "1W": 2.1, "1M": 5.4 } }
    ],
    aiAnalysis: "Dubai real estate boom continuing. Significant FDI inflows from East and West. Crypto and fintech hub status attracting global talent.",
    marketReturns: { "1D": 0.4, "1W": 1.2, "1M": 3.4, "YTD": 6.8 }
  },
  PK: {
    gdp: "0.37", inflation: "20.7", rate: "22.00", currency: "278 (USD/PKR)",
    riskScore: 82,
    companies: [
      { name: "Habib Bank", returns: { "1D": 0.8, "1W": 2.4, "1M": 6.8 } },
      { name: "PSO", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "Lucky Cement", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.8 } }
    ],
    aiAnalysis: "IMF programme stabilising external accounts. Inflation trajectory improving from peak. Political uncertainty and debt sustainability remain key risk factors.",
    marketReturns: { "1D": 0.6, "1W": 1.8, "1M": 5.4, "YTD": 14.2 }
  },
  BD: {
    gdp: "0.45", inflation: "9.7", rate: "8.50", currency: "110 (USD/BDT)",
    riskScore: 62,
    companies: [
      { name: "Grameenphone", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "BRAC Bank", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.8 } },
      { name: "Square Pharma", returns: { "1D": 0.2, "1W": 0.8, "1M": 2.4 } }
    ],
    aiAnalysis: "Garment export dominance under pressure from rising wages. Remittance inflows providing FX buffer. Political stability improving investment climate.",
    marketReturns: { "1D": 0.2, "1W": 0.8, "1M": 2.4, "YTD": 4.8 }
  },
  TH: {
    gdp: "0.51", inflation: "1.1", rate: "2.50", currency: "36.28 (USD/THB)",
    riskScore: 40,
    companies: [
      { name: "PTT PCL", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "Bangkok Bank", returns: { "1D": 0.6, "1W": 1.8, "1M": 4.8 } },
      { name: "Kasikornbank", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } }
    ],
    aiAnalysis: "Tourism recovery outperforming expectations. Manufacturing diversification gaining traction. Political stability improved following court ruling.",
    marketReturns: { "1D": 0.2, "1W": 0.8, "1M": 2.4, "YTD": 4.2 }
  },
  VN: {
    gdp: "0.43", inflation: "3.5", rate: "4.50", currency: "24,850 (USD/VND)",
    riskScore: 38,
    companies: [
      { name: "Vinhomes", returns: { "1D": 0.8, "1W": 2.4, "1M": 6.8 } },
      { name: "Vingroup", returns: { "1D": 1.2, "1W": 3.4, "1M": 9.6 } },
      { name: "Vietcombank", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } }
    ],
    aiAnalysis: "Manufacturing FDI influx as firms exit China. Samsung and Intel expanding facilities. Export-driven growth maintaining above-6% GDP trajectory.",
    marketReturns: { "1D": 0.6, "1W": 1.8, "1M": 5.4, "YTD": 12.4 }
  },
  // Guyana: Correct GDP ~$15B (0.015T) — booming on oil but tiny base
  GY: {
    gdp: "0.015", inflation: "4.2", rate: "5.50", currency: "209 (USD/GYD)",
    riskScore: 52,
    companies: [
      { name: "Demerara Bank", returns: { "1D": 0.2, "1W": 0.8, "1M": 2.4 } },
      { name: "Banks DIH", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "Guyana Power & Light", returns: { "1D": 0.2, "1W": 0.6, "1M": 1.8 } }
    ],
    aiAnalysis: "One of world's fastest per-capita growing economies driven by ExxonMobil Stabroek oil block discovery. GDP ~$15B — small base with high growth trajectory. Infrastructure bottlenecks remain key constraint.",
    marketReturns: { "1D": 0.4, "1W": 1.2, "1M": 3.4, "YTD": 8.6 }
  },
  KE: {
    gdp: "0.12", inflation: "5.1", rate: "13.00", currency: "130 (USD/KES)",
    riskScore: 60,
    companies: [
      { name: "Safaricom", returns: { "1D": 0.6, "1W": 1.8, "1M": 5.4 } },
      { name: "Equity Group", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } },
      { name: "KCB Group", returns: { "1D": 0.4, "1W": 1.2, "1M": 3.4 } }
    ],
    aiAnalysis: "M-PESA fintech leadership providing structural advantage. IMF programme stabilising FX pressures. East Africa hub status attracting tech investment.",
    marketReturns: { "1D": 0.4, "1W": 1.2, "1M": 3.4, "YTD": 6.8 }
  },
};

const _seed = (str) => { let h=0; for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0; return h; };
const _rnd = (str, seedOffset) => { const s=Math.sin(_seed(str)+seedOffset)*10000; return s-Math.floor(s); };

export function getCountryStats(iso) {
  if (countryStats[iso]) return countryStats[iso];

  // ── Safe deterministic fallback for unlisted countries ────────────────────
  // Capped to realistic small-economy ranges — no absurd multi-trillion GDPs
  const riskScore = Math.floor(_rnd(iso, 5) * 60 + 20); // 20–80
  const mockScore = Math.floor(_rnd(iso, 8) * 3);

  // Small economies: GDP $3B–$80B → 0.003T–0.080T
  const gdpVal = (_rnd(iso, 1) * 0.077 + 0.003).toFixed(3);
  // Inflation: 2%–18%
  const inflVal = (_rnd(iso, 2) * 16 + 2).toFixed(1);
  // Rate: 2%–15%
  const rateVal = (_rnd(iso, 3) * 13 + 2).toFixed(2);
  // Generic FX vs USD
  const fxVal = (10 + _rnd(iso, 4) * 490).toFixed(1);

  return {
    gdp: gdpVal,
    inflation: inflVal,
    rate: rateVal,
    currency: fxVal,
    riskScore,
    companies: [
      { name: "National Bank", returns: { "1D": _rnd(iso, 10)*4-2, "1W": _rnd(iso, 11)*10-5, "1M": _rnd(iso, 12)*20-10 } },
      { name: "State Telecom", returns: { "1D": _rnd(iso, 13)*4-2, "1W": _rnd(iso, 14)*10-5, "1M": _rnd(iso, 15)*20-10 } },
      { name: "Energy Corp",   returns: { "1D": _rnd(iso, 16)*4-2, "1W": _rnd(iso, 17)*10-5, "1M": _rnd(iso, 18)*20-10 } }
    ],
    aiAnalysis: `${mockScore === 2 ? 'Positive' : mockScore === 0 ? 'Cautious' : 'Neutral'} outlook based on regional macro trends. Limited public market data available — analysis based on comparable-economy models.`,
    marketReturns: {
      "1D": _rnd(iso, 20)*4-2,
      "1W": _rnd(iso, 21)*10-5,
      "1M": _rnd(iso, 22)*20-10,
      "YTD": _rnd(iso, 23)*30-15
    }
  };
}
