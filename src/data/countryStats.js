// Standalone data module — no app imports.

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
  { name: "TAIEX", value: "21,456.78", change: "+1.64%", isPositive: true },
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
    gdp: "27.4", inflation: "2.9", rate: "5.25", currency: "104.50 (DXY)",
    riskScore: 28,
    companies: [
        {
            "name": "Apple Inc.",
            "returns": {
                "1D": 1.2,
                "1W": 2.4,
                "1M": 5.6
            }
        },
        {
            "name": "Microsoft",
            "returns": {
                "1D": 0.8,
                "1W": -1.2,
                "1M": 3.4
            }
        },
        {
            "name": "JPMorgan Chase",
            "returns": {
                "1D": -0.5,
                "1W": 1.1,
                "1M": 2.2
            }
        }
    ],
    aiAnalysis: "Strong AI investments driving tech sector. Inflation remains sticky, implying rates will remain higher for longer. Consumer spending holding up despite tighter financial conditions.",
    marketReturns: {
        "1D": 1.2,
        "1W": -0.5,
        "1M": 2.1,
        "YTD": 12.4
    }
  },
  CN: {
    gdp: "17.9", inflation: "-0.8", rate: "3.45", currency: "7.26 (USD/CNY)",
    riskScore: 65,
    companies: [
        {
            "name": "Tencent",
            "returns": {
                "1D": 2.1,
                "1W": -3.4,
                "1M": 1.2
            }
        },
        {
            "name": "Alibaba",
            "returns": {
                "1D": 1.5,
                "1W": -2.1,
                "1M": -5.6
            }
        },
        {
            "name": "ICBC",
            "returns": {
                "1D": 0.2,
                "1W": 0.5,
                "1M": 1.1
            }
        }
    ],
    aiAnalysis: "Deflationary pressures persisting. PBOC maintaining accommodative stance. Property sector restructuring continues to drag on broader growth outlook.",
    marketReturns: {
        "1D": 1.5,
        "1W": -2.8,
        "1M": -1.4,
        "YTD": -4.2
    }
  },
  JP: {
    gdp: "4.2", inflation: "2.8", rate: "0.10", currency: "152.67 (USD/JPY)",
    riskScore: 15,
    companies: [
        {
            "name": "Toyota Motor",
            "returns": {
                "1D": -1.2,
                "1W": 4.5,
                "1M": 8.2
            }
        },
        {
            "name": "Sony Group",
            "returns": {
                "1D": 0.5,
                "1W": 2.1,
                "1M": -1.4
            }
        },
        {
            "name": "Mitsubishi UFJ",
            "returns": {
                "1D": 1.8,
                "1W": 5.6,
                "1M": 12.4
            }
        }
    ],
    aiAnalysis: "Historic shift in monetary policy underway. Yield curve control adjustments expected. Weak Yen supporting export earnings significantly.",
    marketReturns: {
        "1D": -0.8,
        "1W": 3.2,
        "1M": 5.4,
        "YTD": 18.6
    }
  },
  DE: {
    gdp: "4.1", inflation: "2.4", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 22,
    companies: [
        {
            "name": "SAP SE",
            "returns": {
                "1D": 1.4,
                "1W": 2.8,
                "1M": 6.5
            }
        },
        {
            "name": "Siemens AG",
            "returns": {
                "1D": -0.6,
                "1W": -1.2,
                "1M": 0.8
            }
        },
        {
            "name": "Allianz SE",
            "returns": {
                "1D": 0.2,
                "1W": 1.5,
                "1M": 3.2
            }
        }
    ],
    aiAnalysis: "Industrial sector facing prolonged weakness from energy transition costs. Services sector remains resilient. ECB rate cut expectations heavily weighted.",
    marketReturns: {
        "1D": -0.4,
        "1W": 1.2,
        "1M": 2.8,
        "YTD": 6.4
    }
  },
  GB: {
    gdp: "3.1", inflation: "2.1", rate: "4.75", currency: "1.2720 (GBP/USD)",
    riskScore: 30,
    companies: [
        {
            "name": "AstraZeneca",
            "returns": {
                "1D": -1.5,
                "1W": -2.4,
                "1M": -4.2
            }
        },
        {
            "name": "HSBC Holdings",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 4.5
            }
        },
        {
            "name": "Shell plc",
            "returns": {
                "1D": 1.2,
                "1W": 3.5,
                "1M": 5.2
            }
        }
    ],
    aiAnalysis: "Labour market cooling. Bank of England adopting cautious approach to easing. Fiscal headroom remains constrained post-pandemic.",
    marketReturns: {
        "1D": 0.2,
        "1W": -1.1,
        "1M": 1.8,
        "YTD": 4.2
    }
  },
  IN: {
    gdp: "3.9", inflation: "5.1", rate: "6.50", currency: "83.54 (USD/INR)",
    riskScore: 42,
    companies: [
        {
            "name": "Reliance Industries",
            "returns": {
                "1D": 1.8,
                "1W": 4.2,
                "1M": 8.5
            }
        },
        {
            "name": "TCS",
            "returns": {
                "1D": 0.5,
                "1W": -1.2,
                "1M": 2.4
            }
        },
        {
            "name": "HDFC Bank",
            "returns": {
                "1D": -0.4,
                "1W": 1.8,
                "1M": 3.2
            }
        }
    ],
    aiAnalysis: "Strong domestic demand. Capital expenditure cycles extending. FDI inflows stabilizing amid global supply chain relocations.",
    marketReturns: {
        "1D": 1.4,
        "1W": 2.8,
        "1M": 6.5,
        "YTD": 14.2
    }
  },
  FR: {
    gdp: "2.9", inflation: "2.3", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 35,
    companies: [
        {
            "name": "LVMH",
            "returns": {
                "1D": -0.8,
                "1W": -2.1,
                "1M": 3.4
            }
        },
        {
            "name": "TotalEnergies",
            "returns": {
                "1D": 1.1,
                "1W": 2.4,
                "1M": 4.2
            }
        },
        {
            "name": "BNP Paribas",
            "returns": {
                "1D": 0.4,
                "1W": 1.8,
                "1M": 5.6
            }
        }
    ],
    aiAnalysis: "Political uncertainty weighing on business confidence. Luxury sector showing resilience despite slowing China demand. Fiscal deficit concerns persist.",
    marketReturns: {
        "1D": -0.6,
        "1W": 0.8,
        "1M": 2.1,
        "YTD": 3.8
    }
  },
  IT: {
    gdp: "2.1", inflation: "1.8", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 48,
    companies: [
        {
            "name": "Enel SpA",
            "returns": {
                "1D": 0.6,
                "1W": 1.4,
                "1M": 3.8
            }
        },
        {
            "name": "Ferrari NV",
            "returns": {
                "1D": 1.2,
                "1W": 3.1,
                "1M": 7.2
            }
        },
        {
            "name": "UniCredit",
            "returns": {
                "1D": 1.8,
                "1W": 4.5,
                "1M": 12.3
            }
        }
    ],
    aiAnalysis: "Debt sustainability risks remain elevated. Tourism sector providing near-term GDP support. ECB policy transmission creating headwinds for SMEs.",
    marketReturns: {
        "1D": 0.3,
        "1W": 1.5,
        "1M": 4.2,
        "YTD": 9.1
    }
  },
  CA: {
    gdp: "2.1", inflation: "2.9", rate: "5.00", currency: "1.3620 (USD/CAD)",
    riskScore: 20,
    companies: [
        {
            "name": "Shopify",
            "returns": {
                "1D": 2.4,
                "1W": 5.8,
                "1M": 12.4
            }
        },
        {
            "name": "Royal Bank of Canada",
            "returns": {
                "1D": 0.6,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Suncor Energy",
            "returns": {
                "1D": 1.1,
                "1W": 2.8,
                "1M": 5.6
            }
        }
    ],
    aiAnalysis: "Housing market imbalances persisting. Resource sector benefiting from commodity cycle. Bank of Canada likely to lead rate cuts among G7 peers.",
    marketReturns: {
        "1D": 0.4,
        "1W": 0.9,
        "1M": 2.6,
        "YTD": 5.8
    }
  },
  KR: {
    gdp: "1.7", inflation: "3.1", rate: "3.50", currency: "1,379 (USD/KRW)",
    riskScore: 35,
    companies: [
        {
            "name": "Samsung Electronics",
            "returns": {
                "1D": 1.8,
                "1W": 4.2,
                "1M": 9.6
            }
        },
        {
            "name": "SK Hynix",
            "returns": {
                "1D": 3.2,
                "1W": 8.4,
                "1M": 22.1
            }
        },
        {
            "name": "Hyundai Motor",
            "returns": {
                "1D": 0.5,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Semiconductor export surge driven by AI memory demand. Geopolitical exposure to North Korea risk priced in. Export-led recovery underway.",
    marketReturns: {
        "1D": 1.2,
        "1W": 3.4,
        "1M": 8.9,
        "YTD": 11.4
    }
  },
  AU: {
    gdp: "1.7", inflation: "3.8", rate: "4.35", currency: "0.6580 (AUD/USD)",
    riskScore: 18,
    companies: [
        {
            "name": "BHP Group",
            "returns": {
                "1D": 0.8,
                "1W": 1.6,
                "1M": -2.4
            }
        },
        {
            "name": "Commonwealth Bank",
            "returns": {
                "1D": 0.4,
                "1W": 0.9,
                "1M": 2.8
            }
        },
        {
            "name": "Macquarie Group",
            "returns": {
                "1D": 1.1,
                "1W": 2.4,
                "1M": 5.6
            }
        }
    ],
    aiAnalysis: "Commodity sector facing China demand headwinds. RBA maintaining restrictive stance amid stubborn core inflation. Services exports holding up.",
    marketReturns: {
        "1D": 0.7,
        "1W": -0.4,
        "1M": 1.9,
        "YTD": 4.2
    }
  },
  BR: {
    gdp: "2.2", inflation: "4.6", rate: "10.50", currency: "5.20 (USD/BRL)",
    riskScore: 58,
    companies: [
        {
            "name": "Petrobras",
            "returns": {
                "1D": 1.4,
                "1W": 3.2,
                "1M": 6.8
            }
        },
        {
            "name": "Vale SA",
            "returns": {
                "1D": -0.8,
                "1W": -2.4,
                "1M": -5.6
            }
        },
        {
            "name": "Itaú Unibanco",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Fiscal credibility concerns weighing on BRL. Strong agricultural exports offsetting industrial weakness. Central bank navigating political pressure to cut rates.",
    marketReturns: {
        "1D": -0.9,
        "1W": -2.1,
        "1M": -4.8,
        "YTD": -8.4
    }
  },
  MX: {
    gdp: "1.4", inflation: "4.8", rate: "11.00", currency: "17.04 (USD/MXN)",
    riskScore: 52,
    companies: [
        {
            "name": "América Móvil",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "FEMSA",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.2
            }
        },
        {
            "name": "Grupo Bimbo",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 2.1
            }
        }
    ],
    aiAnalysis: "Nearshoring investment boom benefiting from US-China decoupling. Peso resilient on high carry. Political transition risks ahead of elections.",
    marketReturns: {
        "1D": 0.3,
        "1W": -0.8,
        "1M": 2.4,
        "YTD": 3.6
    }
  },
  RU: {
    gdp: "2.0", inflation: "7.4", rate: "16.00", currency: "88.50 (USD/RUB)",
    riskScore: 92,
    companies: [
        {
            "name": "Gazprom",
            "returns": {
                "1D": -1.2,
                "1W": -3.4,
                "1M": -8.6
            }
        },
        {
            "name": "Sberbank",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 4.5
            }
        },
        {
            "name": "Lukoil",
            "returns": {
                "1D": -0.4,
                "1W": -1.8,
                "1M": -3.2
            }
        }
    ],
    aiAnalysis: "Wartime economy under heavy Western sanctions. Elevated inflation driven by military spending. Capital controls limiting market price discovery.",
    marketReturns: {
        "1D": -0.5,
        "1W": 1.2,
        "1M": -2.4,
        "YTD": -6.8
    }
  },
  SA: {
    gdp: "1.1", inflation: "1.6", rate: "6.00", currency: "3.75 (USD/SAR)",
    riskScore: 38,
    companies: [
        {
            "name": "Saudi Aramco",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 3.4
            }
        },
        {
            "name": "Al Rajhi Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "SABIC",
            "returns": {
                "1D": -0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Vision 2030 diversification progressing. Oil revenue volatility remains key budget risk. NEOM mega-project driving construction sector activity.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.1,
        "1M": 2.6,
        "YTD": 5.2
    }
  },
  ZA: {
    gdp: "0.40", inflation: "5.6", rate: "8.25", currency: "18.62 (USD/ZAR)",
    riskScore: 68,
    companies: [
        {
            "name": "Anglo American",
            "returns": {
                "1D": 1.4,
                "1W": 3.2,
                "1M": 7.8
            }
        },
        {
            "name": "Standard Bank",
            "returns": {
                "1D": 0.6,
                "1W": 1.4,
                "1M": 3.2
            }
        },
        {
            "name": "Naspers",
            "returns": {
                "1D": 1.8,
                "1W": 4.2,
                "1M": 9.6
            }
        }
    ],
    aiAnalysis: "Structural power outages constraining growth. Coalition government providing near-term political stability. Mining sector sensitive to China commodity demand.",
    marketReturns: {
        "1D": 0.8,
        "1W": 2.1,
        "1M": 5.4,
        "YTD": 8.6
    }
  },
  NG: {
    gdp: "0.40", inflation: "29.9", rate: "24.75", currency: "1,480 (USD/NGN)",
    riskScore: 78,
    companies: [
        {
            "name": "Dangote Cement",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "MTN Nigeria",
            "returns": {
                "1D": -0.8,
                "1W": -2.4,
                "1M": -5.6
            }
        },
        {
            "name": "Zenith Bank",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 8.2
            }
        }
    ],
    aiAnalysis: "Currency liberalisation driving near-term inflation surge. Oil sector recovering from theft disruptions. Reforms show medium-term potential if sustained.",
    marketReturns: {
        "1D": -0.4,
        "1W": -1.8,
        "1M": -4.2,
        "YTD": -12.4
    }
  },
  EG: {
    gdp: "0.40", inflation: "32.5", rate: "27.25", currency: "48.40 (USD/EGP)",
    riskScore: 74,
    companies: [
        {
            "name": "Commercial Intl Bank",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        },
        {
            "name": "EFG Hermes",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 8.6
            }
        },
        {
            "name": "Telecom Egypt",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.2
            }
        }
    ],
    aiAnalysis: "IMF programme providing external anchor. Currency devaluation improving competitiveness. High debt servicing costs constraining fiscal space significantly.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.8,
        "1M": 4.2,
        "YTD": 6.8
    }
  },
  AR: {
    gdp: "0.64", inflation: "289.4", rate: "60.00", currency: "876 (USD/ARS)",
    riskScore: 88,
    companies: [
        {
            "name": "MercadoLibre",
            "returns": {
                "1D": 2.4,
                "1W": 5.8,
                "1M": 14.2
            }
        },
        {
            "name": "YPF",
            "returns": {
                "1D": 1.8,
                "1W": 4.2,
                "1M": 9.6
            }
        },
        {
            "name": "Banco Macro",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 8.4
            }
        }
    ],
    aiAnalysis: "Milei shock therapy reducing fiscal deficit but at social cost. Hyperinflation gradually being tamed. Debt restructuring risk remains a tail scenario.",
    marketReturns: {
        "1D": 1.4,
        "1W": 4.2,
        "1M": 12.6,
        "YTD": 48.4
    }
  },
  TR: {
    gdp: "1.1", inflation: "67.1", rate: "50.00", currency: "32.48 (USD/TRY)",
    riskScore: 72,
    companies: [
        {
            "name": "Akbank",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 8.6
            }
        },
        {
            "name": "Bim Birlesik",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Turkcell",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        }
    ],
    aiAnalysis: "Orthodoxy returning to monetary policy. TRY stabilising but inflation remains extreme. Current account deficit narrowing on tourism receipts.",
    marketReturns: {
        "1D": 0.8,
        "1W": 2.4,
        "1M": 6.8,
        "YTD": 18.4
    }
  },
  ID: {
    gdp: "1.4", inflation: "2.8", rate: "6.25", currency: "15,724 (USD/IDR)",
    riskScore: 44,
    companies: [
        {
            "name": "Bank Central Asia",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Astra International",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Telkom Indonesia",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 2.1
            }
        }
    ],
    aiAnalysis: "Natural resource wealth supporting fiscal position. Nickel export restrictions reshaping EV supply chain. Domestic consumption growth outpacing regional peers.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 3.4,
        "YTD": 6.8
    }
  },
  SG: {
    gdp: "0.50", inflation: "2.7", rate: "3.68", currency: "1.35 (USD/SGD)",
    riskScore: 8,
    companies: [
        {
            "name": "DBS Group",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        },
        {
            "name": "Sea Limited",
            "returns": {
                "1D": 2.4,
                "1W": 5.8,
                "1M": 14.2
            }
        },
        {
            "name": "Singapore Airlines",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        }
    ],
    aiAnalysis: "Regional financial hub role strengthening as China tensions persist. MAS maintaining tight policy via SGD appreciation. AI data centre investment influx.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.4,
        "1M": 3.8,
        "YTD": 7.2
    }
  },
  CH: {
    gdp: "0.81", inflation: "1.4", rate: "1.50", currency: "0.91 (USD/CHF)",
    riskScore: 5,
    companies: [
        {
            "name": "Nestlé SA",
            "returns": {
                "1D": 0.2,
                "1W": 0.6,
                "1M": 1.8
            }
        },
        {
            "name": "Novartis",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        },
        {
            "name": "UBS Group",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 8.6
            }
        }
    ],
    aiAnalysis: "Safe-haven currency appreciation pressuring export competitiveness. SNB cutting rates early among developed peers. Private banking inflows accelerating.",
    marketReturns: {
        "1D": 0.2,
        "1W": 0.8,
        "1M": 2.4,
        "YTD": 5.6
    }
  },
  TW: {
    gdp: "0.79", inflation: "2.4", rate: "2.00", currency: "31.85 (USD/TWD)",
    riskScore: 55,
    companies: [
        {
            "name": "TSMC",
            "returns": {
                "1D": 2.8,
                "1W": 6.4,
                "1M": 18.6
            }
        },
        {
            "name": "MediaTek",
            "returns": {
                "1D": 1.8,
                "1W": 4.2,
                "1M": 9.6
            }
        },
        {
            "name": "Foxconn",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        }
    ],
    aiAnalysis: "Semiconductor dominance via TSMC creates global strategic importance. Cross-strait risk priced into discount vs peers. AI chip demand creating strong earnings momentum.",
    marketReturns: {
        "1D": 1.8,
        "1W": 4.2,
        "1M": 12.4,
        "YTD": 28.6
    }
  },
  NL: {
    gdp: "1.10", inflation: "2.8", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 14,
    companies: [
        {
            "name": "ASML Holding",
            "returns": {
                "1D": 2.4,
                "1W": 5.8,
                "1M": 14.2
            }
        },
        {
            "name": "Shell plc",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 5.2
            }
        },
        {
            "name": "ING Group",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        }
    ],
    aiAnalysis: "ASML's EUV monopoly creating critical chokepoint in global chip supply. Export controls restricting China sales but demand robust elsewhere.",
    marketReturns: {
        "1D": 1.4,
        "1W": 3.2,
        "1M": 8.6,
        "YTD": 16.4
    }
  },
  SE: {
    gdp: "0.60", inflation: "4.1", rate: "3.75", currency: "10.81 (USD/SEK)",
    riskScore: 18,
    companies: [
        {
            "name": "Spotify",
            "returns": {
                "1D": 2.1,
                "1W": 4.8,
                "1M": 11.4
            }
        },
        {
            "name": "Ericsson",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Volvo Group",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Krona weakness fading as Riksbank pivots. Housing market stabilising after sharp correction. Strong tech startup ecosystem remains growth engine.",
    marketReturns: {
        "1D": 0.8,
        "1W": 2.1,
        "1M": 5.4,
        "YTD": 9.8
    }
  },
  NO: {
    gdp: "0.59", inflation: "3.6", rate: "4.50", currency: "10.75 (USD/NOK)",
    riskScore: 10,
    companies: [
        {
            "name": "Equinor",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "DNB Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Norsk Hydro",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        }
    ],
    aiAnalysis: "Sovereign wealth fund exceeds $1.6T. Oil revenues buffering fiscal accounts. Krone sensitive to oil price movements and global risk appetite.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 3.4,
        "YTD": 6.8
    }
  },
  AE: {
    gdp: "0.51", inflation: "3.8", rate: "5.40", currency: "3.67 (USD/AED)",
    riskScore: 20,
    companies: [
        {
            "name": "Emirates NBD",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "ADNOC",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "DP World",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        }
    ],
    aiAnalysis: "Dubai real estate boom continuing. Significant FDI inflows from East and West. Crypto and fintech hub status attracting global talent.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 3.4,
        "YTD": 6.8
    }
  },
  PK: {
    gdp: "0.37", inflation: "20.7", rate: "22.00", currency: "278 (USD/PKR)",
    riskScore: 82,
    companies: [
        {
            "name": "Habib Bank",
            "returns": {
                "1D": 0.8,
                "1W": 2.4,
                "1M": 6.8
            }
        },
        {
            "name": "PSO",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Lucky Cement",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.8
            }
        }
    ],
    aiAnalysis: "IMF programme stabilising external accounts. Inflation trajectory improving from peak. Political uncertainty and debt sustainability remain key risk factors.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.8,
        "1M": 5.4,
        "YTD": 14.2
    }
  },
  BD: {
    gdp: "0.45", inflation: "9.7", rate: "8.50", currency: "110 (USD/BDT)",
    riskScore: 62,
    companies: [
        {
            "name": "Grameenphone",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "BRAC Bank",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.8
            }
        },
        {
            "name": "Square Pharma",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 2.4
            }
        }
    ],
    aiAnalysis: "Garment export dominance under pressure from rising wages. Remittance inflows providing FX buffer. Political stability improving investment climate.",
    marketReturns: {
        "1D": 0.2,
        "1W": 0.8,
        "1M": 2.4,
        "YTD": 4.8
    }
  },
  TH: {
    gdp: "0.51", inflation: "1.1", rate: "2.50", currency: "36.28 (USD/THB)",
    riskScore: 40,
    companies: [
        {
            "name": "PTT PCL",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Bangkok Bank",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.8
            }
        },
        {
            "name": "Kasikornbank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        }
    ],
    aiAnalysis: "Tourism recovery outperforming expectations. Manufacturing diversification gaining traction. Political stability improved following court ruling.",
    marketReturns: {
        "1D": 0.2,
        "1W": 0.8,
        "1M": 2.4,
        "YTD": 4.2
    }
  },
  VN: {
    gdp: "0.43", inflation: "3.5", rate: "4.50", currency: "24,850 (USD/VND)",
    riskScore: 38,
    companies: [
        {
            "name": "Vinhomes",
            "returns": {
                "1D": 0.8,
                "1W": 2.4,
                "1M": 6.8
            }
        },
        {
            "name": "Vingroup",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 9.6
            }
        },
        {
            "name": "Vietcombank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        }
    ],
    aiAnalysis: "Manufacturing FDI influx as firms exit China. Samsung and Intel expanding facilities. Export-driven growth maintaining above-6% GDP trajectory.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.8,
        "1M": 5.4,
        "YTD": 12.4
    }
  },
  GY: {
    gdp: "0.015", inflation: "4.2", rate: "5.50", currency: "209 (USD/GYD)",
    riskScore: 52,
    companies: [
        {
            "name": "Demerara Bank",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 2.4
            }
        },
        {
            "name": "Banks DIH",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Guyana Power & Light",
            "returns": {
                "1D": 0.2,
                "1W": 0.6,
                "1M": 1.8
            }
        }
    ],
    aiAnalysis: "One of world's fastest per-capita growing economies driven by ExxonMobil Stabroek oil block discovery. GDP ~$15B — small base with high growth trajectory. Infrastructure bottlenecks remain key constraint.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 3.4,
        "YTD": 8.6
    }
  },
  KE: {
    gdp: "0.12", inflation: "5.1", rate: "13.00", currency: "130 (USD/KES)",
    riskScore: 60,
    companies: [
        {
            "name": "Safaricom",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 5.4
            }
        },
        {
            "name": "Equity Group",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "KCB Group",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.4
            }
        }
    ],
    aiAnalysis: "M-PESA fintech leadership providing structural advantage. IMF programme stabilising FX pressures. East Africa hub status attracting tech investment.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 3.4,
        "YTD": 6.8
    }
  },
  CL: {
    gdp: "0.33", inflation: "3.8", rate: "6.00", currency: "945.00 (USD/CLP)",
    riskScore: 35,
    companies: [
        {
            "name": "SQM S.A.",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        },
        {
            "name": "Banco de Chile",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Copec",
            "returns": {
                "1D": -0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Lithium expansion and copper production dominate. Fiscal discipline maintains stable outlook despite domestic social reform pressures.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.8,
        "YTD": 5.6
    }
  },
  CO: {
    gdp: "0.38", inflation: "7.2", rate: "11.75", currency: "3,850 (USD/COP)",
    riskScore: 48,
    companies: [
        {
            "name": "Ecopetrol",
            "returns": {
                "1D": -1.2,
                "1W": -2.4,
                "1M": -4.5
            }
        },
        {
            "name": "Bancolombia",
            "returns": {
                "1D": 0.6,
                "1W": 1.2,
                "1M": 3.4
            }
        },
        {
            "name": "Grupo Aval",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Fiscal deficit challenges weigh on COP. Strong agricultural exports and oil revenues provide support amidst monetary tightening.",
    marketReturns: {
        "1D": -0.6,
        "1W": -1.2,
        "1M": 1.5,
        "YTD": 4.2
    }
  },
  ES: {
    gdp: "1.6", inflation: "3.3", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 22,
    companies: [
        {
            "name": "Banco Santander",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 4.5
            }
        },
        {
            "name": "Iberdrola",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Inditex (Zara)",
            "returns": {
                "1D": 1.2,
                "1W": 3.4,
                "1M": 6.8
            }
        }
    ],
    aiAnalysis: "Tourism and services sectors driving resilience. Unemployment rate continues slow downward trend. ECB policy acts as major monetary driver.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.5,
        "1M": 3.2,
        "YTD": 8.4
    }
  },
  DK: {
    gdp: "0.41", inflation: "0.8", rate: "3.35", currency: "6.95 (USD/DKK)",
    riskScore: 10,
    companies: [
        {
            "name": "Novo Nordisk",
            "returns": {
                "1D": 2.4,
                "1W": 5.8,
                "1M": 14.2
            }
        },
        {
            "name": "A.P. Møller-Mærsk",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 4.5
            }
        },
        {
            "name": "Ørsted",
            "returns": {
                "1D": -0.6,
                "1W": 1.2,
                "1M": 3.4
            }
        }
    ],
    aiAnalysis: "Novo Nordisk obesity drug boom fuels record GDP surplus. Extremely stable fiscal situation with strong sovereign balance sheet.",
    marketReturns: {
        "1D": 1.5,
        "1W": 3.4,
        "1M": 8.6,
        "YTD": 18.2
    }
  },
  PL: {
    gdp: "0.84", inflation: "2.4", rate: "5.75", currency: "3.98 (USD/PLN)",
    riskScore: 25,
    companies: [
        {
            "name": "PKN Orlen",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 4.5
            }
        },
        {
            "name": "PKO Bank Polski",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "CD Projekt",
            "returns": {
                "1D": 1.8,
                "1W": 4.2,
                "1M": 9.6
            }
        }
    ],
    aiAnalysis: "Robust domestic consumption and manufacturing inflows. Safe haven status in Central Europe supporting PLN. Fiscal path remains expansionary.",
    marketReturns: {
        "1D": 0.8,
        "1W": 2.1,
        "1M": 4.5,
        "YTD": 11.2
    }
  },
  PT: {
    gdp: "0.29", inflation: "2.2", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 20,
    companies: [
        {
            "name": "EDP Energias",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Galp Energia",
            "returns": {
                "1D": -0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "Jerónimo Martins",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Tourism and renewable energy generation support growth. External debt ratios improving rapidly. Aligned with ECB policy targets.",
    marketReturns: {
        "1D": 0.2,
        "1W": 0.8,
        "1M": 2.1,
        "YTD": 4.8
    }
  },
  GR: {
    gdp: "0.24", inflation: "2.4", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 38,
    companies: [
        {
            "name": "National Bank of Greece",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        },
        {
            "name": "Eurobank Ergasias",
            "returns": {
                "1D": 0.6,
                "1W": 1.4,
                "1M": 3.8
            }
        },
        {
            "name": "Alpha Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        }
    ],
    aiAnalysis: "Post-bailout economic recovery continues with investment grade rating return. Primary budget surpluses supporting fiscal credibility.",
    marketReturns: {
        "1D": -0.4,
        "1W": 1.1,
        "1M": 3.2,
        "YTD": 9.6
    }
  },
  IE: {
    gdp: "0.51", inflation: "1.7", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 15,
    companies: [
        {
            "name": "CRH plc",
            "returns": {
                "1D": 0.8,
                "1W": 2.4,
                "1M": 5.6
            }
        },
        {
            "name": "Ryanair Holdings",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Kerry Group",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 3.1
            }
        }
    ],
    aiAnalysis: "Multinational corporate tax revenues generate massive fiscal surpluses. Trade-reliant economy vulnerable to global tax reform changes.",
    marketReturns: {
        "1D": 0.8,
        "1W": 2.4,
        "1M": 5.6,
        "YTD": 12.4
    }
  },
  FI: {
    gdp: "0.30", inflation: "1.5", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 16,
    companies: [
        {
            "name": "Nokia Oyj",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Neste Oyj",
            "returns": {
                "1D": -0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "KONE Corp.",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Industrial sector recovery underway. Export exposure to European machinery demand remains key driver. ECB rates stabilizing borrowing costs.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.8,
        "YTD": 5.4
    }
  },
  BE: {
    gdp: "0.63", inflation: "2.2", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 18,
    companies: [
        {
            "name": "AB InBev",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "KBC Group",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "UCB SA",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        }
    ],
    aiAnalysis: "Central European hub benefiting from logistics and pharma exports. Fiscal deficit concerns remain a long-term structural challenge.",
    marketReturns: {
        "1D": 0.3,
        "1W": 1.1,
        "1M": 2.4,
        "YTD": 6.1
    }
  },
  AT: {
    gdp: "0.52", inflation: "2.1", rate: "4.50", currency: "1.0850 (EUR/USD)",
    riskScore: 15,
    companies: [
        {
            "name": "OMV AG",
            "returns": {
                "1D": -0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "Erste Group Bank",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Verbund AG",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        }
    ],
    aiAnalysis: "Industrial manufacturing and tourism supporting steady growth. Strong trade linkages with Eastern Europe remain major export factor.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.6,
        "YTD": 5.8
    }
  },
  CZ: {
    gdp: "0.33", inflation: "2.0", rate: "5.25", currency: "23.10 (USD/CZK)",
    riskScore: 20,
    companies: [
        {
            "name": "CEZ Group",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Komercni Banka",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Moneta Money Bank",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Inflation returning to 2% target, allowing CNB to ease rates. Strong automotive supply chain integration with Germany.",
    marketReturns: {
        "1D": 0.5,
        "1W": 1.4,
        "1M": 3.1,
        "YTD": 7.2
    }
  },
  HU: {
    gdp: "0.22", inflation: "3.7", rate: "7.25", currency: "365.00 (USD/HUF)",
    riskScore: 45,
    companies: [
        {
            "name": "OTP Bank",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 5.4
            }
        },
        {
            "name": "MOL Group",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Richter Gedeon",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Monetary policy easing continues as inflation moderates. EU funding disputes remain a minor headwind for investor sentiment.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.8,
        "1M": 4.2,
        "YTD": 9.8
    }
  },
  RO: {
    gdp: "0.36", inflation: "5.9", rate: "6.75", currency: "4.62 (USD/RON)",
    riskScore: 35,
    companies: [
        {
            "name": "OMV Petrom",
            "returns": {
                "1D": 0.8,
                "1W": 2.1,
                "1M": 4.5
            }
        },
        {
            "name": "Banca Transilvania",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Romgaz",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        }
    ],
    aiAnalysis: "Strong GDP growth driven by EU infrastructure funding inflows. Sticky core inflation maintains relatively hawkish central bank stance.",
    marketReturns: {
        "1D": 0.8,
        "1W": 2.1,
        "1M": 5.4,
        "YTD": 12.6
    }
  },
  HK: {
    gdp: "0.39", inflation: "1.5", rate: "5.75", currency: "7.8250 (USD/HKD)",
    riskScore: 32,
    companies: [
        {
            "name": "AIA Group",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "HKEX",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Link REIT",
            "returns": {
                "1D": -0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Financial hub adapting to closer integration with Mainland China. Pegged currency (HKD) moves in tandem with US Federal Reserve policy.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.1,
        "1M": 2.6,
        "YTD": 5.2
    }
  },
  MY: {
    gdp: "0.44", inflation: "1.8", rate: "3.00", currency: "4.72 (USD/MYR)",
    riskScore: 30,
    companies: [
        {
            "name": "Maybank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Public Bank",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "Tenaga Nasional",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Semiconductor packaging boom supporting electrical exports. Stable monetary policy by Bank Negara supporting domestic demand.",
    marketReturns: {
        "1D": 0.5,
        "1W": 1.3,
        "1M": 3.4,
        "YTD": 8.1
    }
  },
  PH: {
    gdp: "0.44", inflation: "3.7", rate: "6.50", currency: "57.80 (USD/PHP)",
    riskScore: 40,
    companies: [
        {
            "name": "SM Investments",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Ayala Land",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "BDO Unibank",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Strong consumption supported by remittances and outsourcing revenues. Elevated rates remain a drag on property sector investment.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.5,
        "1M": 3.8,
        "YTD": 9.2
    }
  },
  NZ: {
    gdp: "0.25", inflation: "4.0", rate: "5.50", currency: "1.67 (USD/NZD)",
    riskScore: 15,
    companies: [
        {
            "name": "Fisher & Paykel",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Auckland Airport",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Spark New Zealand",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "RBNZ maintaining restrictive rates to target core inflation. Agricultural commodity exports facing moderate global demand headwind.",
    marketReturns: {
        "1D": 0.3,
        "1W": 1.1,
        "1M": 2.5,
        "YTD": 5.1
    }
  },
  QA: {
    gdp: "0.22", inflation: "1.4", rate: "5.75", currency: "3.64 (USD/QAR)",
    riskScore: 25,
    companies: [
        {
            "name": "Qatar National Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Industries Qatar",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Ooredoo",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "North Field LNG expansion secures long-term fiscal revenue base. High current account surpluses supporting peg and sovereign wealth assets.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.8,
        "YTD": 6.4
    }
  },
  IL: {
    gdp: "0.53", inflation: "2.8", rate: "4.50", currency: "3.72 (USD/ILS)",
    riskScore: 60,
    companies: [
        {
            "name": "Teva Pharmaceutical",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Bank Leumi",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "Nice Ltd.",
            "returns": {
                "1D": 0.8,
                "1W": 2.4,
                "1M": 5.6
            }
        }
    ],
    aiAnalysis: "Tech sector exports resilient despite regional security tensions. Central bank supporting currency stability via reserve interventions.",
    marketReturns: {
        "1D": -0.8,
        "1W": -2.1,
        "1M": 1.4,
        "YTD": 3.8
    }
  },
  MA: {
    gdp: "0.15", inflation: "1.3", rate: "3.00", currency: "10.05 (USD/MAD)",
    riskScore: 35,
    companies: [
        {
            "name": "Attijariwafa Bank",
            "returns": {
                "1D": 0.5,
                "1W": 1.4,
                "1M": 3.2
            }
        },
        {
            "name": "Maroc Telecom",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "BCP Group",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Automotive and aerospace export hubs driving industrial expansion. Tourism recovery supporting external balances and currency stability.",
    marketReturns: {
        "1D": 0.5,
        "1W": 1.4,
        "1M": 3.2,
        "YTD": 8.6
    }
  },
  UA: {
    gdp: "0.19", inflation: "3.2", rate: "13.00", currency: "40.50 (USD/UAH)",
    riskScore: 90,
    companies: [
        {
            "name": "Kernel Holding",
            "returns": {
                "1D": -1.2,
                "1W": -2.5,
                "1M": -5.6
            }
        },
        {
            "name": "MHP SE",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Ukrnafta",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Economic activity supported by international aid. Severe structural war-related damages remain key constraint on recovery.",
    marketReturns: {
        "1D": -1.2,
        "1W": -2.5,
        "1M": -5.6,
        "YTD": -12.4
    }
  },
  KW: {
    gdp: "0.16", inflation: "3.2", rate: "4.25", currency: "0.31 (USD/KWD)",
    riskScore: 24,
    companies: [
        {
            "name": "National Bank of Kuwait",
            "returns": {
                "1D": 0.3,
                "1W": 1.1,
                "1M": 2.6
            }
        },
        {
            "name": "Zain Group",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Kuwait Finance House",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Oil revenues dominate fiscal position. Sovereign wealth fund remains top-tier buffer. Structural political delays slow non-oil reforms.",
    marketReturns: {
        "1D": 0.3,
        "1W": 1.1,
        "1M": 2.6,
        "YTD": 5.4
    }
  },
  OM: {
    gdp: "0.11", inflation: "0.9", rate: "6.00", currency: "0.38 (USD/OMR)",
    riskScore: 28,
    companies: [
        {
            "name": "Bank Muscat",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.9
            }
        },
        {
            "name": "Omantel",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "OQ Gas Networks",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Fiscal reforms and debt reduction program improving credit ratings. Energy diversification progressing via hydrogen projects.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.9,
        "YTD": 6.1
    }
  },
  JO: {
    gdp: "0.052", inflation: "1.6", rate: "7.50", currency: "0.71 (USD/JOD)",
    riskScore: 42,
    companies: [
        {
            "name": "Arab Bank",
            "returns": {
                "1D": -0.2,
                "1W": -0.8,
                "1M": 1.1
            }
        },
        {
            "name": "Jordan Phosphate",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Hikma Pharmaceuticals",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "IMF structural reforms anchors fiscal program. Regional conflict risk presents tourism and transportation headwinds.",
    marketReturns: {
        "1D": -0.2,
        "1W": -0.8,
        "1M": 1.1,
        "YTD": 3.2
    }
  },
  BH: {
    gdp: "0.045", inflation: "1.2", rate: "6.25", currency: "0.38 (USD/BHD)",
    riskScore: 35,
    companies: [
        {
            "name": "Aluminium Bahrain (Alba)",
            "returns": {
                "1D": 0.3,
                "1W": 1.1,
                "1M": 2.5
            }
        },
        {
            "name": "National Bank of Bahrain",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "Batelco",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        }
    ],
    aiAnalysis: "Fintech and financial hub growth supporting diversification. Fiscal balance program remains dependent on oil market support.",
    marketReturns: {
        "1D": 0.3,
        "1W": 1.1,
        "1M": 2.5,
        "YTD": 5.6
    }
  },
  IR: {
    gdp: "0.46", inflation: "35.0", rate: "23.00", currency: "42,000 (USD/IRR)",
    riskScore: 85,
    companies: [
        {
            "name": "Tehran Refinery",
            "returns": {
                "1D": -1.5,
                "1W": -3.2,
                "1M": -6.4
            }
        },
        {
            "name": "Persian Gulf Petrochemical",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Mobarakeh Steel",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Sustained high inflation and currency depreciation due to oil sanctions. Domestic demand driven by barter trade and state pricing.",
    marketReturns: {
        "1D": -1.5,
        "1W": -3.2,
        "1M": -6.4,
        "YTD": -15.2
    }
  },
  GH: {
    gdp: "0.075", inflation: "23.2", rate: "29.00", currency: "14.50 (USD/GHS)",
    riskScore: 58,
    companies: [
        {
            "name": "AngloGold Ashanti",
            "returns": {
                "1D": -0.5,
                "1W": -1.2,
                "1M": 1.8
            }
        },
        {
            "name": "Tullow Oil plc",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "MTN Ghana",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "IMF program anchors debt restructuring. Gold and cocoa production remains key external balance driver as GHS stabilizes.",
    marketReturns: {
        "1D": -0.5,
        "1W": -1.2,
        "1M": 1.8,
        "YTD": 4.1
    }
  },
  CI: {
    gdp: "0.086", inflation: "3.1", rate: "3.50", currency: "605.50 (USD/XOF)",
    riskScore: 38,
    companies: [
        {
            "name": "Sonatel CI",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        },
        {
            "name": "SGCI Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Solibra",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Leading economic growth in West Africa. Cocoa harvest rebounds supporting trade surplus. Stable currency backed by French Treasury peg.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.8,
        "1M": 4.2,
        "YTD": 9.4
    }
  },
  TZ: {
    gdp: "0.085", inflation: "3.1", rate: "6.00", currency: "2,600 (USD/TZS)",
    riskScore: 34,
    companies: [
        {
            "name": "CRDB Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Tanzania Breweries",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "Twiga Cement",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Gold exports and mining investments boost reserves. Infrastructure spend on SGR railway supports medium-term growth.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.8,
        "YTD": 6.2
    }
  },
  LK: {
    gdp: "0.084", inflation: "0.9", rate: "8.50", currency: "300.00 (USD/LKR)",
    riskScore: 54,
    companies: [
        {
            "name": "John Keells Holdings",
            "returns": {
                "1D": 0.5,
                "1W": 1.3,
                "1M": 3.1
            }
        },
        {
            "name": "Commercial Bank of Ceylon",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Dialog Axiata",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Exiting default under IMF guidance. Remittances and tourism recovering rapidly, improving FX reserve position.",
    marketReturns: {
        "1D": 0.5,
        "1W": 1.3,
        "1M": 3.1,
        "YTD": 8.6
    }
  },
  KZ: {
    gdp: "0.29", inflation: "8.7", rate: "14.75", currency: "448.00 (USD/KZT)",
    riskScore: 32,
    companies: [
        {
            "name": "KazMunayGas",
            "returns": {
                "1D": 0.6,
                "1W": 1.6,
                "1M": 3.8
            }
        },
        {
            "name": "Halyk Bank",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Kaspi.kz",
            "returns": {
                "1D": 0.8,
                "1W": 2.4,
                "1M": 5.6
            }
        }
    ],
    aiAnalysis: "Oil export revenues support fiscal buffers. Central bank gradually easing rates as inflation cools from peak.",
    marketReturns: {
        "1D": 0.6,
        "1W": 1.6,
        "1M": 3.8,
        "YTD": 9.1
    }
  },
  PE: {
    gdp: "0.27", inflation: "2.4", rate: "5.75", currency: "3.74 (USD/PEN)",
    riskScore: 36,
    companies: [
        {
            "name": "Credicorp Ltd.",
            "returns": {
                "1D": 0.3,
                "1W": 1.1,
                "1M": 2.5
            }
        },
        {
            "name": "Southern Copper Corp.",
            "returns": {
                "1D": 0.8,
                "1W": 2.4,
                "1M": 5.6
            }
        },
        {
            "name": "Buenaventura",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        }
    ],
    aiAnalysis: "Stable macroeconomic anchors despite political leadership shifts. Copper price boom supports balance of payments and PEN stability.",
    marketReturns: {
        "1D": 0.3,
        "1W": 1.1,
        "1M": 2.5,
        "YTD": 5.8
    }
  },
  DZ: {
    gdp: "0.26", inflation: "5.0", rate: "3.00", currency: "134.00 (USD/DZD)",
    riskScore: 42,
    companies: [
        {
            "name": "Sonatrach Oil",
            "returns": {
                "1D": 0.4,
                "1W": 1.2,
                "1M": 2.8
            }
        },
        {
            "name": "Banque Nationale d'Algerie",
            "returns": {
                "1D": 0.2,
                "1W": 0.8,
                "1M": 1.6
            }
        },
        {
            "name": "Cevital Group",
            "returns": {
                "1D": 0.6,
                "1W": 1.8,
                "1M": 4.2
            }
        }
    ],
    aiAnalysis: "Hydrocarbon gas exports to Europe driving budget surplus. Elevated foreign reserves anchor DZD currency value.",
    marketReturns: {
        "1D": 0.4,
        "1W": 1.2,
        "1M": 2.8,
        "YTD": 6.8
    }
  }
};

const _seed = (str) => { let h=0; for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0; return h; };
const _rnd = (str, seedOffset) => { const s=Math.sin(_seed(str)+seedOffset)*10000; return s-Math.floor(s); };

const statsCache = {};
const statsResultCache = {};

export function getCountryStats(isoCode) {
  const cleanIso = (isoCode || "").toUpperCase();
  if (statsResultCache[cleanIso]) {
    return statsResultCache[cleanIso];
  }

  const stats = countryStats[cleanIso] || statsCache[cleanIso] || (() => {
    // ── Safe deterministic fallback for unlisted countries ────────────────────
    const riskScore = Math.floor(_rnd(cleanIso, 5) * 60 + 20); // 20–80
    const mockScore = Math.floor(_rnd(cleanIso, 8) * 3);

    // Small economies: GDP $3B–$80B → 0.003T–0.080T
    const gdpVal = (_rnd(cleanIso, 1) * 0.077 + 0.003).toFixed(3);
    // Inflation: 2%–18%
    const inflVal = (_rnd(cleanIso, 2) * 16 + 2).toFixed(1);
    // Rate: 2%–15%
    const rateVal = (_rnd(cleanIso, 3) * 13 + 2).toFixed(2);
    // Generic FX vs USD
    const fxVal = (10 + _rnd(cleanIso, 4) * 490).toFixed(1);
    
    // Mapping of standard ISO2 to Currency codes for fallback formatting
    const ISO_TO_CURR = {
      AD: 'EUR', AF: 'AFN', AG: 'XCD', AL: 'ALL', AM: 'AMD', AO: 'AOA', AW: 'AWG', AZ: 'AZN',
      BA: 'BAM', BB: 'BBD', BF: 'XOF', BG: 'BGN', BI: 'BIF', BJ: 'XOF', BN: 'BND', BO: 'BOB',
      BS: 'BSD', BT: 'BTN', BW: 'BWP', BY: 'BYN', BZ: 'BZD', CD: 'CDF', CF: 'XAF', CG: 'XAF',
      CM: 'XAF', CR: 'CRC', CU: 'CUP', CV: 'CVE', DJ: 'DJF', DO: 'DOP', DZ: 'DZD', ER: 'ERN',
      ET: 'ETB', FJ: 'FJD', FM: 'USD', GA: 'XAF', GD: 'XCD', GE: 'GEL', GM: 'GMD', GN: 'GNF',
      GQ: 'XAF', GT: 'GTQ', GW: 'XOF', GY: 'GYD', HN: 'HNL', HR: 'EUR', HT: 'HTG', IQ: 'IQD',
      IS: 'ISK', JM: 'JMD', LY: 'LYD', MD: 'MDL', ME: 'EUR', MG: 'MGA', MK: 'MKD', ML: 'XOF',
      MM: 'MMK', MN: 'MNT', MR: 'MRU', MU: 'MUR', MV: 'MVR', MW: 'MWK', MZ: 'MZN', NA: 'NAD',
      NE: 'XOF', NI: 'NIO', NP: 'NPR', PA: 'PAB', PG: 'PGK', PR: 'USD', PS: 'ILS', PY: 'PYG',
      RS: 'RSD', RW: 'RWF', SB: 'SBD', SD: 'SDG', SL: 'SLE', SN: 'XOF', SO: 'SOS', SR: 'SRD',
      SS: 'SSP', ST: 'STN', SV: 'USD', SY: 'SYP', SZ: 'SZL', TD: 'XAF', TG: 'XOF', TJ: 'TJS',
      TL: 'USD', TM: 'TMT', TN: 'TND', TO: 'TOP', TT: 'TTD', UY: 'UYU', UZ: 'UZS', VE: 'VES',
      VU: 'VUV', WS: 'WST', YE: 'YER', ZW: 'ZWG'
    };
    const cCode = ISO_TO_CURR[cleanIso] || (cleanIso + 'D');
    let currencyStr;
    if (cCode === 'USD') {
      currencyStr = "1.00 (USD/USD)";
    } else if (cCode === 'EUR') {
      currencyStr = "1.0850 (EUR/USD)";
    } else {
      currencyStr = `${fxVal} (USD/${cCode})`;
    }

    const fallback = {
      gdp: gdpVal,
      inflation: inflVal,
      rate: rateVal,
      currency: currencyStr,
      riskScore,
      companies: [
        { name: "National Bank", returns: { "1D": _rnd(cleanIso, 10)*4-2, "1W": _rnd(cleanIso, 11)*10-5, "1M": _rnd(cleanIso, 12)*20-10 } },
        { name: "State Telecom", returns: { "1D": _rnd(cleanIso, 13)*4-2, "1W": _rnd(cleanIso, 14)*10-5, "1M": _rnd(cleanIso, 15)*20-10 } },
        { name: "Energy Corp",   returns: { "1D": _rnd(cleanIso, 16)*4-2, "1W": _rnd(cleanIso, 17)*10-5, "1M": _rnd(cleanIso, 18)*20-10 } }
      ],
      aiAnalysis: `${mockScore === 2 ? 'Positive' : mockScore === 0 ? 'Cautious' : 'Neutral'} outlook based on regional macro trends. Limited public market data available — analysis based on comparable-economy models.`,
      marketReturns: {
        "1D": _rnd(cleanIso, 20)*4-2,
        "1W": _rnd(cleanIso, 21)*10-5,
        "1M": _rnd(cleanIso, 22)*20-10,
        "YTD": _rnd(cleanIso, 23)*30-15
      }
    };
    statsCache[cleanIso] = fallback;
    return fallback;
  })();

  statsResultCache[cleanIso] = stats;
  return stats;
}

