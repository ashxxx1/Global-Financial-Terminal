export const COUNTRIES_DATA = {
  US: {
    name: "United States",
    code: "US",
    lat: 37.09,
    lng: -95.71,
    currency: "USD",
    marketIndex: "S&P 500",
    indexValue: 7707.98,
    indexChange: 114.56,
    indexChangePct: 1.51,
    color: "#00ff88",
    newsIntensity: 0.95,
    sentiment: "bullish",
    exchange: "NYSE / NASDAQ",
    tradingHours: "09:30–16:00 EST",
    timezone: "EST",
    sparkline: [7520, 7585, 7610, 7642, 7595, 7680, 7708],
    news: [
    {
      id: 1,
      title: "Federal Reserve signals potential rate cuts as inflation cools to 2.1%",
      source: "Global Macro Desk",
      time: "12 min ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Monetary Policy"
    },
    {
      id: 2,
      title: "Nvidia surpasses $4 trillion market cap, becomes world's most valuable company",
      source: "Macro Wire",
      time: "38 min ago",
      sentiment: "bullish",
      impact: "+2.4%",
      category: "Tech"
    },
    {
      id: 3,
      title: "US unemployment rate holds steady at 3.7%, beating economist forecasts",
      source: "WSJ",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+0.3%",
      category: "Employment"
    },
    {
      id: 4,
      title: "US-China trade tensions escalate as new semiconductor  controls announced",
      source: "FT",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-0.6%",
      category: "Trade"
    },
    {
      id: 5,
      title: "Apple unveils AI-powered Mac lineup, shares surge 3.2% in after-hours trading",
      source: "CNBC",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Tech"
    }
  ]
  },
  CA: {
    name: "Canada",
    code: "CA",
    lat: 56.13,
    lng: -106.34,
    currency: "CAD",
    marketIndex: "TSX Composite",
    indexValue: 22145.67,
    indexChange: 89.34,
    indexChangePct: 0.4,
    color: "#00ff88",
    newsIntensity: 0.52,
    sentiment: "bullish",
    exchange: "TSX",
    tradingHours: "09:30–16:00 EST",
    timezone: "EST",
    sparkline: [22000, 22040, 22070, 22095, 22110, 22130, 22145],
    news: [
    {
      id: 1,
      title: "Canada oil sands production hits record 3.4 million barrels/day",
      source: "CBC",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Bank of Canada cuts rates by 25bps, third consecutive cut",
      source: "Capital Feed",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Monetary Policy"
    }
  ]
  },
  BR: {
    name: "Brazil",
    code: "BR",
    lat: -14.23,
    lng: -51.92,
    currency: "BRL",
    marketIndex: "Bovespa",
    indexValue: 128456,
    indexChange: -1234.5,
    indexChangePct: -0.95,
    color: "#ff6b35",
    newsIntensity: 0.61,
    sentiment: "bearish",
    exchange: "B3",
    tradingHours: "10:00–17:55 BRT",
    timezone: "BRT",
    sparkline: [130000, 129800, 129500, 129200, 128900, 128650, 128456],
    news: [
    {
      id: 1,
      title: "Brazil central bank hikes rates to 13.75% to combat 5.2% inflation",
      source: "Trade Flow Intel",
      time: "30 min ago",
      sentiment: "bearish",
      impact: "-1.1%",
      category: "Monetary Policy"
    },
    {
      id: 2,
      title: "Amazon deforestation drops 45% in 2025, investors react positively",
      source: "FX Monitor",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.6%",
      category: "ESG"
    }
  ]
  },
  MX: {
    name: "Mexico",
    code: "MX",
    lat: 23.63,
    lng: -102.55,
    currency: "MXN",
    marketIndex: "BMV IPC",
    indexValue: 52345.67,
    indexChange: 345.67,
    indexChangePct: 0.66,
    color: "#00ff88",
    newsIntensity: 0.6,
    sentiment: "bullish",
    exchange: "BMV",
    tradingHours: "08:30–15:00 CST",
    timezone: "CST",
    sparkline: [51800, 51900, 52000, 52100, 52200, 52280, 52345],
    news: [
    {
      id: 1,
      title: "Mexico nearshoring boom attracts $25bn FDI as US firms shift from China",
      source: "Commodity Desk",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+1.8%",
      category: "Trade"
    }
  ]
  },
  AR: {
    name: "Argentina",
    code: "AR",
    lat: -38.41,
    lng: -63.61,
    currency: "ARS",
    marketIndex: "Merval",
    indexValue: 1867234,
    indexChange: 34567,
    indexChangePct: 1.89,
    color: "#00ff88",
    newsIntensity: 0.82,
    sentiment: "bullish",
    exchange: "BYMA",
    tradingHours: "11:00–17:00 ART",
    timezone: "ART",
    sparkline: [1780000, 1800000, 1820000, 1835000, 1850000, 1860000, 1867234],
    news: [
    {
      id: 1,
      title: "Argentina's Milei economic shock therapy shows results as inflation drops to 8% monthly",
      source: "Credit Monitor",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Economy"
    },
    {
      id: 2,
      title: "IMF approves $15bn support package for Argentina fiscal reform",
      source: "Alpha Terminal",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+3.2%",
      category: "Finance"
    },
    {
      id: 3,
      title: "Milei's austerity delivers 7% fiscal surplus — first in decades",
      source: "Macro Pulse",
      time: "20 min ago",
      sentiment: "bullish",
      impact: "+4.5%",
      category: "Fiscal"
    },
    {
      id: 4,
      title: "Argentina inflation falls to 48% from 290% peak, reforms praised",
      source: "Market Wire",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.8%",
      category: "Inflation"
    },
    {
      id: 5,
      title: "Vaca Muerta shale output hits record 700,000 bpd, dollar inflows surge",
      source: "FT",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+3.1%",
      category: "Energy"
    }
  ]
  },
  CL: {
    name: "Chile",
    code: "CL",
    lat: -35.67,
    lng: -71.54,
    currency: "CLP",
    marketIndex: "IPSA",
    indexValue: 6734.56,
    indexChange: 45.67,
    indexChangePct: 0.68,
    color: "#ffaa00",
    newsIntensity: 0.58,
    sentiment: "neutral",
    exchange: "Bolsa de Santiago",
    tradingHours: "09:30–17:00 CLT",
    timezone: "CLT",
    sparkline: [6640, 6660, 6680, 6698, 6710, 6724, 6734],
    news: [
    {
      id: 1,
      title: "Chile copper output declines 8% amid labor disputes at key mines",
      source: "Global Macro Desk",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-1.2%",
      category: "Resources"
    },
    {
      id: 2,
      title: "Chile lithium nationalization plan draws mixed investor reaction",
      source: "Macro Wire",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-1.2%",
      category: "Resources"
    },
    {
      id: 3,
      title: "Copper futures hit $5.20/lb on Chinese stimulus demand surge",
      source: "Capital Feed",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Commodities"
    }
  ]
  },
  CO: {
    name: "Colombia",
    code: "CO",
    lat: 4.57,
    lng: -74.29,
    currency: "COP",
    marketIndex: "Colcap",
    indexValue: 1234.56,
    indexChange: -23.45,
    indexChangePct: -1.86,
    color: "#ff2244",
    newsIntensity: 0.6,
    sentiment: "bearish",
    exchange: "BVC",
    tradingHours: "09:00–16:00 COT",
    timezone: "COT",
    sparkline: [1310, 1296, 1282, 1272, 1263, 1249, 1234],
    news: [
    {
      id: 1,
      title: "Colombia GDP growth outpaces Latin America peers at 3.2%",
      source: "FT",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Colombia peso hits 3-month low as fiscal deficit widens",
      source: "Trade Flow Intel",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-2.0%",
      category: "Fiscal"
    },
    {
      id: 3,
      title: "Ecopetrol crude output misses targets amid security incidents",
      source: "FX Monitor",
      time: "4h ago",
      sentiment: "bearish",
      impact: "-1.5%",
      category: "Energy"
    }
  ]
  },
  GB: {
    name: "United Kingdom",
    code: "GB",
    lat: 55.37,
    lng: -3.43,
    currency: "GBP",
    marketIndex: "FTSE 100",
    indexValue: 10743.35,
    indexChange: -67.12,
    indexChangePct: -0.62,
    color: "#ff6b35",
    newsIntensity: 0.65,
    sentiment: "bearish",
    exchange: "LSE",
    tradingHours: "08:00–16:30 GMT",
    timezone: "GMT",
    sparkline: [10880, 10855, 10820, 10790, 10770, 10755, 10743],
    news: [
    {
      id: 1,
      title: "Bank of England keeps rates at 4.5%, warns of persistent inflation risks",
      source: "BBC",
      time: "22 min ago",
      sentiment: "bearish",
      impact: "-0.4%",
      category: "Monetary Policy"
    },
    {
      id: 2,
      title: "UK GDP growth slows to 0.1% in Q1, raising recession fears",
      source: "Guardian",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-0.7%",
      category: "Economy"
    },
    {
      id: 3,
      title: "UK fintech sector attracts record £8.2bn investment in 2026",
      source: "Commodity Desk",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Finance"
    }
  ]
  },
  DE: {
    name: "Germany",
    code: "DE",
    lat: 51.16,
    lng: 10.45,
    currency: "EUR",
    marketIndex: "DAX 40",
    indexValue: 26091.33,
    indexChange: -167.4,
    indexChangePct: -0.64,
    color: "#ff6b35",
    newsIntensity: 0.72,
    sentiment: "bearish",
    exchange: "XETRA",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [26450, 26380, 26310, 26240, 26180, 26120, 26091],
    news: [
    {
      id: 1,
      title: "Germany enters technical recession as industrial output falls 2.3%",
      source: "FT",
      time: "15 min ago",
      sentiment: "bearish",
      impact: "-1.2%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Volkswagen announces 15,000 job cuts amid EV transition struggles",
      source: "Credit Monitor",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-2.1%",
      category: "Auto"
    },
    {
      id: 3,
      title: "German renewable energy hits 65% of total grid capacity for first time",
      source: "Alpha Terminal",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.4%",
      category: "Energy"
    }
  ]
  },
  FR: {
    name: "France",
    code: "FR",
    lat: 46.22,
    lng: 2.21,
    currency: "EUR",
    marketIndex: "CAC 40",
    indexValue: 7823.45,
    indexChange: -34.56,
    indexChangePct: -0.44,
    color: "#ff6b35",
    newsIntensity: 0.58,
    sentiment: "bearish",
    exchange: "Euronext Paris",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [7880, 7870, 7860, 7850, 7840, 7830, 7823],
    news: [
    {
      id: 1,
      title: "France political uncertainty weighs on markets as budget talks stall",
      source: "FT",
      time: "45 min ago",
      sentiment: "bearish",
      impact: "-0.6%",
      category: "Politics"
    },
    {
      id: 2,
      title: "LVMH posts 12% revenue growth, luxury sector outperforms",
      source: "Macro Pulse",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Luxury"
    }
  ]
  },
  IT: {
    name: "Italy",
    code: "IT",
    lat: 41.87,
    lng: 12.56,
    currency: "EUR",
    marketIndex: "FTSE MIB",
    indexValue: 34218.4,
    indexChange: 127.6,
    indexChangePct: 0.37,
    color: "#ffaa00",
    newsIntensity: 0.58,
    sentiment: "neutral",
    exchange: "Borsa Italiana",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [33900, 33980, 34050, 34100, 34150, 34185, 34218],
    news: [
    {
      id: 1,
      title: "Italy's tourism boom drives record €50bn revenue in 2026",
      source: "Market Wire",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Tourism"
    },
    {
      id: 2,
      title: "Italian government unveils €15bn infrastructure spending plan",
      source: "Il Sole",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Fiscal"
    },
    {
      id: 3,
      title: "Italy debt-to-GDP ratio hits 143%, ECB scrutiny intensifies",
      source: "Global Macro Desk",
      time: "5h ago",
      sentiment: "bearish",
      impact: "-0.5%",
      category: "Debt"
    }
  ]
  },
  ES: {
    name: "Spain",
    code: "ES",
    lat: 40.46,
    lng: -3.74,
    currency: "EUR",
    marketIndex: "IBEX 35",
    indexValue: 10847.3,
    indexChange: -89.4,
    indexChangePct: -0.82,
    color: "#ff6b35",
    newsIntensity: 0.62,
    sentiment: "bearish",
    exchange: "Bolsa de Madrid",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [11010, 10990, 10960, 10930, 10910, 10875, 10847],
    news: [
    {
      id: 1,
      title: "Spain renewable energy capacity surpasses 80GW, leads EU green transition",
      source: "Macro Wire",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Spain unemployment rate drops to 11.4%, 15-year low",
      source: "El País",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Employment"
    },
    {
      id: 3,
      title: "Spanish banks face headwinds as ECB signals policy divergence",
      source: "FT",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-0.9%",
      category: "Banking"
    }
  ]
  },
  NL: {
    name: "Netherlands",
    code: "NL",
    lat: 52.13,
    lng: 5.29,
    currency: "EUR",
    marketIndex: "AEX",
    indexValue: 898.72,
    indexChange: 8.34,
    indexChangePct: 0.94,
    color: "#00ff88",
    newsIntensity: 0.6,
    sentiment: "bullish",
    exchange: "Euronext Amsterdam",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [880, 884, 888, 891, 894, 896, 898],
    news: [
    {
      id: 1,
      title: "ASML warns on China  curbs impacting chip equipment demand",
      source: "FT",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-1.8%",
      category: "Semiconductors"
    },
    {
      id: 2,
      title: "ASML books record €8.4bn orders, AI chip demand drives boom",
      source: "Capital Feed",
      time: "30 min ago",
      sentiment: "bullish",
      impact: "+2.8%",
      category: "Semiconductors"
    },
    {
      id: 3,
      title: "Shell completes €5bn share buyback program",
      source: "Trade Flow Intel",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.6%",
      category: "Energy"
    }
  ]
  },
  SE: {
    name: "Sweden",
    code: "SE",
    lat: 60.12,
    lng: 18.64,
    currency: "SEK",
    marketIndex: "OMX Stockholm 30",
    indexValue: 2587.45,
    indexChange: 23.12,
    indexChangePct: 0.9,
    color: "#00ff88",
    newsIntensity: 0.55,
    sentiment: "bullish",
    exchange: "Nasdaq Stockholm",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [2540, 2550, 2558, 2567, 2573, 2581, 2587],
    news: [
    {
      id: 1,
      title: "Spotify reports record 650M users, ad revenue up 28%",
      source: "FX Monitor",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+4.2%",
      category: "Tech"
    },
    {
      id: 2,
      title: "Spotify exceeds 650M monthly active users, stock rallies 4%",
      source: "Commodity Desk",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.9%",
      category: "Tech"
    },
    {
      id: 3,
      title: "Riksbank cuts rates for second time, SEK weakens",
      source: "Credit Monitor",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.4%",
      category: "Monetary Policy"
    }
  ]
  },
  CH: {
    name: "Switzerland",
    code: "CH",
    lat: 46.81,
    lng: 8.22,
    currency: "CHF",
    marketIndex: "SMI",
    indexValue: 11987.3,
    indexChange: 76.5,
    indexChangePct: 0.64,
    color: "#00ff88",
    newsIntensity: 0.57,
    sentiment: "bullish",
    exchange: "SIX Swiss Exchange",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [11830, 11860, 11890, 11920, 11950, 11970, 11987],
    news: [
    {
      id: 1,
      title: "Swiss franc strengthens as safe-haven demand rises on global uncertainty",
      source: "Alpha Terminal",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "FX"
    },
    {
      id: 2,
      title: "Nestlé reports 5.2% organic sales growth, beats estimates",
      source: "Macro Pulse",
      time: "45 min ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Consumer"
    },
    {
      id: 3,
      title: "SNB holds rates at 1.5%, CHF safe-haven demand rises",
      source: "Market Wire",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.4%",
      category: "Monetary Policy"
    }
  ]
  },
  NO: {
    name: "Norway",
    code: "NO",
    lat: 60.47,
    lng: 8.46,
    currency: "NOK",
    marketIndex: "OBX",
    indexValue: 1312.88,
    indexChange: 4.21,
    indexChangePct: 0.32,
    color: "#ffaa00",
    newsIntensity: 0.5,
    sentiment: "neutral",
    exchange: "Oslo Børs",
    tradingHours: "09:00–16:30 CET",
    timezone: "CET",
    sparkline: [1300, 1303, 1306, 1308, 1310, 1312, 1313],
    news: [
    {
      id: 1,
      title: "Equinor's offshore wind expansion reaches 5GW milestone",
      source: "Global Macro Desk",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Equinor raises 2026 output target as North Sea oil production surges",
      source: "FT",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Energy"
    },
    {
      id: 3,
      title: "Norway sovereign wealth fund hits $1.8 trillion, a new record",
      source: "Macro Wire",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.3%",
      category: "Finance"
    }
  ]
  },
  DK: {
    name: "Denmark",
    code: "DK",
    lat: 56.26,
    lng: 9.5,
    currency: "DKK",
    marketIndex: "OMX Copenhagen 20",
    indexValue: 2234.67,
    indexChange: 34.56,
    indexChangePct: 1.57,
    color: "#00ff88",
    newsIntensity: 0.65,
    sentiment: "bullish",
    exchange: "Nasdaq Copenhagen",
    tradingHours: "09:00–17:00 CET",
    timezone: "CET",
    sparkline: [2170, 2183, 2196, 2205, 2215, 2226, 2234],
    news: [
    {
      id: 1,
      title: "Novo Nordisk obesity drug demand drives Denmark market to record high",
      source: "FT",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+3.4%",
      category: "Pharma"
    },
    {
      id: 2,
      title: "Novo Nordisk obesity drug Ozempic drives 22% revenue surge",
      source: "FT",
      time: "20 min ago",
      sentiment: "bullish",
      impact: "+3.4%",
      category: "Pharma"
    },
    {
      id: 3,
      title: "Denmark leads Europe in green energy transition, 88% renewables",
      source: "Capital Feed",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Energy"
    }
  ]
  },
  PL: {
    name: "Poland",
    code: "PL",
    lat: 51.91,
    lng: 19.14,
    currency: "PLN",
    marketIndex: "WIG 20",
    indexValue: 2456.78,
    indexChange: 34.12,
    indexChangePct: 1.41,
    color: "#00ff88",
    newsIntensity: 0.61,
    sentiment: "bullish",
    exchange: "GPW Warsaw",
    tradingHours: "09:00–17:00 CET",
    timezone: "CET",
    sparkline: [2390, 2403, 2415, 2425, 2436, 2446, 2456],
    news: [
    {
      id: 1,
      title: "Poland defense spending rises to 4% of GDP as Eastern Europe security concerns mount",
      source: "Trade Flow Intel",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-0.5%",
      category: "Defense"
    },
    {
      id: 2,
      title: "Poland GDP grows 4.1% in Q1, fastest in Central Europe",
      source: "FX Monitor",
      time: "45 min ago",
      sentiment: "bullish",
      impact: "+1.3%",
      category: "Economy"
    },
    {
      id: 3,
      title: "PKN Orlen acquires 3 European refinery assets, expands footprint",
      source: "Commodity Desk",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Energy"
    }
  ]
  },
  PT: {
    name: "Portugal",
    code: "PT",
    lat: 39.39,
    lng: -8.22,
    currency: "EUR",
    marketIndex: "PSI 20",
    indexValue: 6712.34,
    indexChange: 12.45,
    indexChangePct: 0.19,
    color: "#ffaa00",
    newsIntensity: 0.45,
    sentiment: "neutral",
    exchange: "Euronext Lisbon",
    tradingHours: "08:00–16:30 WET",
    timezone: "WET",
    sparkline: [6680, 6685, 6690, 6698, 6703, 6708, 6712],
    news: [
    {
      id: 1,
      title: "Portugal golden visa reforms drive tech startup influx",
      source: "FT",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.6%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Portugal tourism revenues hit record €25bn, beating pre-COVID peak",
      source: "Credit Monitor",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Tourism"
    },
    {
      id: 3,
      title: "German renewable energy hits 65% of total grid capacity for first time",
      source: "Alpha Terminal",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.4%",
      category: "Energy"
    }
  ]
  },
  GR: {
    name: "Greece",
    code: "GR",
    lat: 39.07,
    lng: 21.82,
    currency: "EUR",
    marketIndex: "ASE General",
    indexValue: 1423.56,
    indexChange: -18.72,
    indexChangePct: -1.3,
    color: "#ff2244",
    newsIntensity: 0.53,
    sentiment: "bearish",
    exchange: "Athens Stock Exchange",
    tradingHours: "10:00–17:20 EET",
    timezone: "EET",
    sparkline: [1480, 1467, 1456, 1448, 1440, 1431, 1423],
    news: [
    {
      id: 1,
      title: "Greece tourism hits record 35M visitors, economy grows 3.8%",
      source: "Macro Pulse",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Tourism"
    },
    {
      id: 2,
      title: "Greek sovereign debt downgraded outlook to negative by S&P",
      source: "FT",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-1.8%",
      category: "Debt"
    },
    {
      id: 3,
      title: "UK fintech sector attracts record £8.2bn investment in 2026",
      source: "Market Wire",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Finance"
    }
  ]
  },
  IE: {
    name: "Ireland",
    code: "IE",
    lat: 53.41,
    lng: -8.24,
    currency: "EUR",
    marketIndex: "ISEQ 20",
    indexValue: 9234.56,
    indexChange: -67.89,
    indexChangePct: -0.73,
    color: "#ff6b35",
    newsIntensity: 0.54,
    sentiment: "bearish",
    exchange: "Euronext Dublin",
    tradingHours: "08:00–16:30 GMT",
    timezone: "GMT",
    sparkline: [9380, 9360, 9340, 9315, 9300, 9268, 9234],
    news: [
    {
      id: 1,
      title: "Ireland corporate tax revenue hits €28bn as tech giant headquarters boost economy",
      source: "FT",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Finance"
    },
    {
      id: 2,
      title: "Apple Ireland tax ruling forces €13bn payment to EU, shares dip",
      source: "FT",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-0.9%",
      category: "Tech"
    },
    {
      id: 3,
      title: "Ireland FDI at risk as US multinationals eye reshoring",
      source: "Global Macro Desk",
      time: "5h ago",
      sentiment: "bearish",
      impact: "-0.6%",
      category: "Trade"
    }
  ]
  },
  FI: {
    name: "Finland",
    code: "FI",
    lat: 61.92,
    lng: 25.74,
    currency: "EUR",
    marketIndex: "OMX Helsinki 25",
    indexValue: 5234.78,
    indexChange: 45.23,
    indexChangePct: 0.87,
    color: "#00ff88",
    newsIntensity: 0.52,
    sentiment: "bullish",
    exchange: "Nasdaq Helsinki",
    tradingHours: "09:00–17:30 EET",
    timezone: "EET",
    sparkline: [5150, 5168, 5182, 5196, 5210, 5223, 5234],
    news: [
    {
      id: 1,
      title: "Nokia restructures as 5G market share continues to decline vs Ericsson",
      source: "Macro Wire",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-1.4%",
      category: "Tech"
    },
    {
      id: 2,
      title: "Nokia wins €2.1bn 5G infrastructure contract across Southeast Asia",
      source: "Capital Feed",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Tech"
    },
    {
      id: 3,
      title: "Finland NATO integration boosts defence sector stocks 5%",
      source: "Trade Flow Intel",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+1.0%",
      category: "Defence"
    }
  ]
  },
  BE: {
    name: "Belgium",
    code: "BE",
    lat: 50.5,
    lng: 4.47,
    currency: "EUR",
    marketIndex: "BEL 20",
    indexValue: 3987.34,
    indexChange: -28.45,
    indexChangePct: -0.71,
    color: "#ff6b35",
    newsIntensity: 0.49,
    sentiment: "bearish",
    exchange: "Euronext Brussels",
    tradingHours: "09:00–17:30 CET",
    timezone: "CET",
    sparkline: [4060, 4048, 4035, 4022, 4010, 3998, 3987],
    news: [
    {
      id: 1,
      title: "AB InBev reports record beer volumes in Asia-Pacific markets",
      source: "FX Monitor",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Consumer"
    },
    {
      id: 2,
      title: "AB InBev volumes fall 3% amid global beer market slowdown",
      source: "FT",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-1.4%",
      category: "Consumer"
    },
    {
      id: 3,
      title: "Belgium nuclear plant life extension approved through 2040",
      source: "Commodity Desk",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Energy"
    }
  ]
  },
  AT: {
    name: "Austria",
    code: "AT",
    lat: 47.51,
    lng: 14.55,
    currency: "EUR",
    marketIndex: "ATX",
    indexValue: 3587.45,
    indexChange: -42.3,
    indexChangePct: -1.17,
    color: "#ff2244",
    newsIntensity: 0.48,
    sentiment: "bearish",
    exchange: "Vienna Stock Exchange",
    tradingHours: "09:00–17:35 CET",
    timezone: "CET",
    sparkline: [3680, 3660, 3640, 3625, 3610, 3597, 3587],
    news: [
    {
      id: 1,
      title: "Austria energy independence plan progresses with record solar installations",
      source: "Credit Monitor",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Austrian banks exposed to Eastern Europe risks, Moody's warns",
      source: "FT",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-1.5%",
      category: "Banking"
    },
    {
      id: 3,
      title: "Vienna real estate market softens as rates bite construction sector",
      source: "Alpha Terminal",
      time: "6h ago",
      sentiment: "bearish",
      impact: "-0.6%",
      category: "Real Estate"
    }
  ]
  },
  RU: {
    name: "Russia",
    code: "RU",
    lat: 61.52,
    lng: 105.31,
    currency: "RUB",
    marketIndex: "MOEX Russia",
    indexValue: 3123.45,
    indexChange: -67.89,
    indexChangePct: -2.13,
    color: "#ff2244",
    newsIntensity: 0.9,
    sentiment: "bearish",
    exchange: "MOEX",
    tradingHours: "10:00–18:40 MSK",
    timezone: "MSK",
    sparkline: [3280, 3250, 3220, 3195, 3170, 3145, 3123],
    news: [
    {
      id: 1,
      title: "Russia oil revenue falls 18% as G7 price cap enforcement tightens",
      source: "Macro Pulse",
      time: "30 min ago",
      sentiment: "bearish",
      impact: "-2.5%",
      category: "Sanctions"
    },
    {
      id: 2,
      title: "Ceasefire talks in Ukraine resume, markets cautiously optimistic",
      source: "Market Wire",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Geopolitics"
    }
  ]
  },
  TR: {
    name: "Turkey",
    code: "TR",
    lat: 38.96,
    lng: 35.24,
    currency: "TRY",
    marketIndex: "BIST 100",
    indexValue: 9876.43,
    indexChange: -234.56,
    indexChangePct: -2.32,
    color: "#ff2244",
    newsIntensity: 0.8,
    sentiment: "bearish",
    exchange: "Borsa Istanbul",
    tradingHours: "10:00–18:00 TRT",
    timezone: "TRT",
    sparkline: [10300, 10230, 10160, 10100, 10040, 9960, 9876],
    news: [
    {
      id: 1,
      title: "Turkey inflation falls to 45% from peak of 85%, lira stabilizes",
      source: "Global Macro Desk",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+2.3%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Turkish lira falls 4% vs USD after central bank surprise decision",
      source: "Macro Wire",
      time: "20 min ago",
      sentiment: "bearish",
      impact: "-3.2%",
      category: "Currency"
    },
    {
      id: 3,
      title: "Japan inflation rises to 2.8%, highest in 18 months",
      source: "Capital Feed",
      time: "3h ago",
      sentiment: "neutral",
      impact: "-0.2%",
      category: "Inflation"
    },
    {
      id: 4,
      title: "Ankara secures $10bn Qatar investment deal in defence & energy",
      source: "FT",
      time: "7h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Investment"
    }
  ]
  },
  CZ: {
    name: "Czech Republic",
    code: "CZ",
    lat: 49.81,
    lng: 15.47,
    currency: "CZK",
    marketIndex: "PX",
    indexValue: 1587.34,
    indexChange: 8.23,
    indexChangePct: 0.52,
    color: "#ffaa00",
    newsIntensity: 0.44,
    sentiment: "neutral",
    exchange: "Prague Stock Exchange",
    tradingHours: "09:00–16:20 CET",
    timezone: "CET",
    sparkline: [1565, 1568, 1572, 1576, 1580, 1584, 1587],
    news: [
    {
      id: 1,
      title: "Czech automotive sector adapts to EV mandate with new battery plant",
      source: "FT",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Auto"
    },
    {
      id: 2,
      title: "Czech Republic inflation cools to 2.8%, central bank signals cut",
      source: "Trade Flow Intel",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+0.6%",
      category: "Monetary Policy"
    },
    {
      id: 3,
      title: "Skoda EV transition plan worth €5bn approved by VW group",
      source: "FX Monitor",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.4%",
      category: "Auto"
    }
  ]
  },
  HU: {
    name: "Hungary",
    code: "HU",
    lat: 47.16,
    lng: 19.5,
    currency: "HUF",
    marketIndex: "BUX",
    indexValue: 71234.56,
    indexChange: -876.5,
    indexChangePct: -1.22,
    color: "#ff2244",
    newsIntensity: 0.56,
    sentiment: "bearish",
    exchange: "Budapest Stock Exchange",
    tradingHours: "09:00–17:00 CET",
    timezone: "CET",
    sparkline: [73500, 73000, 72600, 72200, 71900, 71550, 71234],
    news: [
    {
      id: 1,
      title: "Hungary forint weakens as EU funding dispute remains unresolved",
      source: "Commodity Desk",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-0.8%",
      category: "FX"
    },
    {
      id: 2,
      title: "Hungary forint hits new low vs EUR amid political uncertainty",
      source: "Credit Monitor",
      time: "30 min ago",
      sentiment: "bearish",
      impact: "-2.1%",
      category: "Currency"
    },
    {
      id: 3,
      title: "OTP Bank reports rising NPL ratio, provisions surge",
      source: "Alpha Terminal",
      time: "4h ago",
      sentiment: "bearish",
      impact: "-1.4%",
      category: "Banking"
    }
  ]
  },
  RO: {
    name: "Romania",
    code: "RO",
    lat: 45.94,
    lng: 24.96,
    currency: "RON",
    marketIndex: "BET",
    indexValue: 19456.78,
    indexChange: 234.5,
    indexChangePct: 1.22,
    color: "#00ff88",
    newsIntensity: 0.5,
    sentiment: "bullish",
    exchange: "Bucharest Stock Exchange",
    tradingHours: "10:00–18:00 EET",
    timezone: "EET",
    sparkline: [19050, 19120, 19200, 19280, 19340, 19400, 19456],
    news: [
    {
      id: 1,
      title: "Romania's IT sector booms as EU digital transition funds flow in",
      source: "FT",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Tech"
    },
    {
      id: 2,
      title: "Romania FDI surges 28% as EU funds unlock €12bn for infrastructure",
      source: "Macro Pulse",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.6%",
      category: "Investment"
    },
    {
      id: 3,
      title: "Petrom crude oil output rises 8%, boosts Bucharest index",
      source: "Market Wire",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Energy"
    }
  ]
  },
  JP: {
    name: "Japan",
    code: "JP",
    lat: 36.2,
    lng: 138.25,
    currency: "JPY",
    marketIndex: "Nikkei 225",
    indexValue: 65326.42,
    indexChange: -2158.4,
    indexChangePct: -3.20,
    color: "#ff6b35",
    newsIntensity: 0.78,
    sentiment: "bearish",
    exchange: "TSE",
    tradingHours: "09:00–15:30 JST",
    timezone: "JST",
    sparkline: [67800, 67450, 67020, 66680, 66240, 65810, 65326],
    news: [
    {
      id: 1,
      title: "Bank of Japan raises rates for third time, yen strengthens to 142/USD",
      source: "Nikkei",
      time: "5 min ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Monetary Policy"
    },
    {
      id: 2,
      title: "Toyota announces $20bn EV investment, targeting 40% EV sales by 2028",
      source: "Global Macro Desk",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.8%",
      category: "Auto"
    },
    {
      id: 3,
      title: "Japan inflation rises to 2.8%, highest in 18 months",
      source: "Macro Wire",
      time: "3h ago",
      sentiment: "neutral",
      impact: "-0.2%",
      category: "Inflation"
    }
  ]
  },
  CN: {
    name: "China",
    code: "CN",
    lat: 35.86,
    lng: 104.19,
    currency: "CNY",
    marketIndex: "Shanghai Composite",
    indexValue: 3894.42,
    indexChange: -95.72,
    indexChangePct: -2.40,
    color: "#ff6b35",
    newsIntensity: 0.88,
    sentiment: "bearish",
    exchange: "SSE / SZSE",
    tradingHours: "09:30–15:00 CST",
    timezone: "CST",
    sparkline: [4020, 3995, 3970, 3948, 3925, 3908, 3894],
    news: [
    {
      id: 1,
      title: "China's PBOC injects ¥500bn liquidity, boosting market confidence",
      source: "Xinhua",
      time: "8 min ago",
      sentiment: "bullish",
      impact: "+1.5%",
      category: "Monetary Policy"
    },
    {
      id: 2,
      title: "China GDP grows 5.2% in Q2, exceeding government 5% target",
      source: "Capital Feed",
      time: "45 min ago",
      sentiment: "bullish",
      impact: "+2.3%",
      category: "Economy"
    },
    {
      id: 3,
      title: "BYD overtakes Tesla globally in EV deliveries for first time",
      source: "Trade Flow Intel",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+3.1%",
      category: "Auto"
    },
    {
      id: 4,
      title: "China imposes new restrictions on rare earth exports, global supply concerns",
      source: "FT",
      time: "4h ago",
      sentiment: "bearish",
      impact: "-0.8%",
      category: "Trade"
    }
  ]
  },
  IN: {
    name: "India",
    code: "IN",
    lat: 20.59,
    lng: 78.96,
    currency: "INR",
    marketIndex: "Nifty 50",
    indexValue: 24078.30,
    indexChange: -48.16,
    indexChangePct: -0.20,
    color: "#00ff88",
    newsIntensity: 0.82,
    sentiment: "bullish",
    exchange: "NSE / BSE",
    tradingHours: "09:15–15:30 IST",
    timezone: "IST",
    sparkline: [24280, 24240, 24190, 24150, 24120, 24095, 24078],
    news: [
    {
      id: 1,
      title: "India's economy to surpass Japan, become 3rd largest by 2027 — IMF report",
      source: "Times of India",
      time: "20 min ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Economy"
    },
    {
      id: 2,
      title: "RBI holds repo rate at 6.25%, forecasts 7.1% GDP growth for FY26",
      source: "Economic Times",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Monetary Policy"
    },
    {
      id: 3,
      title: "Reliance Jio completes 5G rollout across all Indian cities",
      source: "Mint",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Tech"
    },
    {
      id: 4,
      title: "India-Pakistan tensions ease after diplomatic breakthrough",
      source: "FX Monitor",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Geopolitics"
    }
  ]
  },
  KR: {
    name: "South Korea",
    code: "KR",
    lat: 35.9,
    lng: 127.76,
    currency: "KRW",
    marketIndex: "KOSPI",
    indexValue: 2847.23,
    indexChange: 34.56,
    indexChangePct: 1.23,
    color: "#00ff88",
    newsIntensity: 0.68,
    sentiment: "bullish",
    exchange: "KRX",
    tradingHours: "09:00–15:30 KST",
    timezone: "KST",
    sparkline: [2800, 2808, 2817, 2825, 2835, 2842, 2847],
    news: [
    {
      id: 1,
      title: "Samsung unveils Galaxy AI chip, challenging TSMC's dominance",
      source: "Korea Herald",
      time: "25 min ago",
      sentiment: "bullish",
      impact: "+3.2%",
      category: "Semiconductors"
    },
    {
      id: 2,
      title: "South Korea K-pop industry exports hit $12bn, cultural economy booms",
      source: "Commodity Desk",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.4%",
      category: "Culture"
    }
  ]
  },
  AU: {
    name: "Australia",
    code: "AU",
    lat: -25.27,
    lng: 133.77,
    currency: "AUD",
    marketIndex: "ASX 200",
    indexValue: 7834.21,
    indexChange: 56.78,
    indexChangePct: 0.73,
    color: "#00ff88",
    newsIntensity: 0.55,
    sentiment: "bullish",
    exchange: "ASX",
    tradingHours: "10:00–16:00 AEST",
    timezone: "AEST",
    sparkline: [7760, 7780, 7795, 7810, 7820, 7828, 7834],
    news: [
    {
      id: 1,
      title: "Australia's lithium exports hit record $18bn as EV demand surges",
      source: "AFR",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.4%",
      category: "Resources"
    },
    {
      id: 2,
      title: "RBA holds rates steady, housing market shows signs of cooling",
      source: "Credit Monitor",
      time: "3h ago",
      sentiment: "neutral",
      impact: "+0.1%",
      category: "Monetary Policy"
    }
  ]
  },
  HK: {
    name: "Hong Kong",
    code: "HK",
    lat: 22.31,
    lng: 114.16,
    currency: "HKD",
    marketIndex: "Hang Seng",
    indexValue: 25495.07,
    indexChange: 23.92,
    indexChangePct: 0.09,
    color: "#ffaa00",
    newsIntensity: 0.72,
    sentiment: "neutral",
    exchange: "HKEX",
    tradingHours: "09:30–16:00 HKT",
    timezone: "HKT",
    sparkline: [25420, 25440, 25455, 25470, 25480, 25490, 25495],
    news: [
    {
      id: 1,
      title: "Hong Kong IPO market rebounds with $12bn raised in Q2 2026",
      source: "SCMP",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Finance"
    },
    {
      id: 2,
      title: "HK IPO market revives with 14 tech listings in Q2, biggest since 2020",
      source: "SCMP",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.5%",
      category: "IPO"
    },
    {
      id: 3,
      title: "Property sector drag continues as Evergrande liquidation proceeds",
      source: "Alpha Terminal",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-0.9%",
      category: "Real Estate"
    }
  ]
  },
  TW: {
    name: "Taiwan",
    code: "TW",
    lat: 23.69,
    lng: 120.96,
    currency: "TWD",
    marketIndex: "TAIEX",
    indexValue: 21456.78,
    indexChange: 345.67,
    indexChangePct: 1.64,
    color: "#00ff88",
    newsIntensity: 0.88,
    sentiment: "bullish",
    exchange: "TWSE",
    tradingHours: "09:00–13:30 CST",
    timezone: "CST",
    sparkline: [20900, 20990, 21080, 21170, 21260, 21360, 21456],
    news: [
    {
      id: 1,
      title: "TSMC announces next-gen 1.4nm chip, orders surge from Apple and NVIDIA",
      source: "Macro Pulse",
      time: "20 min ago",
      sentiment: "bullish",
      impact: "+4.5%",
      category: "Semiconductors"
    },
    {
      id: 2,
      title: "TSMC Q2 revenue surges 40% on AI chip demand, raises 2026 outlook",
      source: "Market Wire",
      time: "5 min ago",
      sentiment: "bullish",
      impact: "+4.2%",
      category: "Semiconductors"
    },
    {
      id: 3,
      title: "India-Pakistan tensions ease after diplomatic breakthrough",
      source: "Global Macro Desk",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Geopolitics"
    },
    {
      id: 4,
      title: "MediaTek wins 5G baseband chip contract with major US OEM",
      source: "FT",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Tech"
    }
  ]
  },
  SG: {
    name: "Singapore",
    code: "SG",
    lat: 1.35,
    lng: 103.82,
    currency: "SGD",
    marketIndex: "STI",
    indexValue: 3456.78,
    indexChange: 23.45,
    indexChangePct: 0.68,
    color: "#00ff88",
    newsIntensity: 0.62,
    sentiment: "bullish",
    exchange: "SGX",
    tradingHours: "09:00–17:00 SGT",
    timezone: "SGT",
    sparkline: [3410, 3420, 3430, 3438, 3445, 3451, 3456],
    news: [
    {
      id: 1,
      title: "Singapore emerges as Asia's premier crypto regulation hub",
      source: "CNA",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Crypto"
    }
  ]
  },
  ID: {
    name: "Indonesia",
    code: "ID",
    lat: -0.78,
    lng: 113.92,
    currency: "IDR",
    marketIndex: "IDX Composite",
    indexValue: 7234.56,
    indexChange: 89.23,
    indexChangePct: 1.25,
    color: "#00ff88",
    newsIntensity: 0.72,
    sentiment: "bullish",
    exchange: "IDX",
    tradingHours: "09:00–16:00 WIB",
    timezone: "WIB",
    sparkline: [7040, 7075, 7100, 7130, 7162, 7198, 7234],
    news: [
    {
      id: 1,
      title: "Indonesia nickel reserves drive record FDI as global EV battery demand surges",
      source: "Macro Wire",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Resources"
    },
    {
      id: 2,
      title: "Indonesia nickel processing boom attracts $12bn EV supply-chain FDI",
      source: "Capital Feed",
      time: "30 min ago",
      sentiment: "bullish",
      impact: "+2.3%",
      category: "Resources"
    },
    {
      id: 3,
      title: "Bank Indonesia holds rate at 6%, eyes Q3 cut as inflation drops",
      source: "Trade Flow Intel",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Monetary Policy"
    }
  ]
  },
  MY: {
    name: "Malaysia",
    code: "MY",
    lat: 4.21,
    lng: 108.96,
    currency: "MYR",
    marketIndex: "KLCI",
    indexValue: 1612.34,
    indexChange: 18.45,
    indexChangePct: 1.16,
    color: "#00ff88",
    newsIntensity: 0.64,
    sentiment: "bullish",
    exchange: "Bursa Malaysia",
    tradingHours: "09:00–17:00 MYT",
    timezone: "MYT",
    sparkline: [1570, 1578, 1587, 1595, 1601, 1607, 1612],
    news: [
    {
      id: 1,
      title: "Malaysia ringgit weakens as oil revenues disappoint",
      source: "FX Monitor",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-0.6%",
      category: "FX"
    },
    {
      id: 2,
      title: "Malaysia overtakes Singapore as SE Asia's top semiconductor hub",
      source: "Commodity Desk",
      time: "45 min ago",
      sentiment: "bullish",
      impact: "+1.9%",
      category: "Semiconductors"
    },
    {
      id: 3,
      title: "Petronas reports record quarterly profit of RM 23bn",
      source: "Credit Monitor",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Energy"
    }
  ]
  },
  TH: {
    name: "Thailand",
    code: "TH",
    lat: 15.87,
    lng: 100.99,
    currency: "THB",
    marketIndex: "SET",
    indexValue: 1387.45,
    indexChange: -23.12,
    indexChangePct: -1.64,
    color: "#ff2244",
    newsIntensity: 0.6,
    sentiment: "bearish",
    exchange: "SET",
    tradingHours: "10:00–16:30 ICT",
    timezone: "ICT",
    sparkline: [1450, 1435, 1425, 1415, 1407, 1397, 1387],
    news: [
    {
      id: 1,
      title: "Thailand tourism revenue hits $35bn as Chinese visitors return en masse",
      source: "Alpha Terminal",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.0%",
      category: "Tourism"
    },
    {
      id: 2,
      title: "Thai baht weakens as tourism receipts fall short of target",
      source: "Macro Pulse",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-1.3%",
      category: "Tourism"
    },
    {
      id: 3,
      title: "Thailand political crisis resurfaces, PM faces no-confidence vote",
      source: "Market Wire",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-2.1%",
      category: "Politics"
    }
  ]
  },
  PH: {
    name: "Philippines",
    code: "PH",
    lat: 12.87,
    lng: 121.77,
    currency: "PHP",
    marketIndex: "PSEi",
    indexValue: 6987.45,
    indexChange: 67.34,
    indexChangePct: 0.97,
    color: "#00ff88",
    newsIntensity: 0.61,
    sentiment: "bullish",
    exchange: "PSE",
    tradingHours: "09:30–15:30 PHT",
    timezone: "PHT",
    sparkline: [6840, 6862, 6885, 6910, 6935, 6962, 6987],
    news: [
    {
      id: 1,
      title: "Philippines BPO sector grows 12%, becomes 2nd largest globally",
      source: "Global Macro Desk",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Services"
    },
    {
      id: 2,
      title: "Philippines OFW remittances hit record $38bn, drives consumer spending",
      source: "Macro Wire",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+1.0%",
      category: "Economy"
    },
    {
      id: 3,
      title: "SM Investments reports 14% profit growth on mall & banking units",
      source: "Capital Feed",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Consumer"
    }
  ]
  },
  VN: {
    name: "Vietnam",
    code: "VN",
    lat: 14.05,
    lng: 108.27,
    currency: "VND",
    marketIndex: "VN Index",
    indexValue: 1287.45,
    indexChange: 23.45,
    indexChangePct: 1.86,
    color: "#00ff88",
    newsIntensity: 0.7,
    sentiment: "bullish",
    exchange: "HOSE",
    tradingHours: "09:00–14:30 ICT",
    timezone: "ICT",
    sparkline: [1230, 1242, 1254, 1263, 1272, 1280, 1287],
    news: [
    {
      id: 1,
      title: "Vietnam manufacturing boom continues as 85 global firms relocate from China",
      source: "Trade Flow Intel",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.4%",
      category: "Manufacturing"
    },
    {
      id: 2,
      title: "Vietnam electronics exports top $130bn as Apple shifts production from China",
      source: "FX Monitor",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+2.8%",
      category: "Trade"
    },
    {
      id: 3,
      title: "Vingroup EV brand VinFast expands into US and European markets",
      source: "Commodity Desk",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+3.2%",
      category: "Auto"
    }
  ]
  },
  NZ: {
    name: "New Zealand",
    code: "NZ",
    lat: -40.9,
    lng: 174.88,
    currency: "NZD",
    marketIndex: "NZX 50",
    indexValue: 11987.45,
    indexChange: 78.34,
    indexChangePct: 0.66,
    color: "#00ff88",
    newsIntensity: 0.5,
    sentiment: "bullish",
    exchange: "NZX",
    tradingHours: "10:00–16:45 NZST",
    timezone: "NZST",
    sparkline: [11800, 11830, 11858, 11890, 11920, 11955, 11987],
    news: [
    {
      id: 1,
      title: "New Zealand dairy exports at 10-year high as China demand rebounds",
      source: "Credit Monitor",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Agriculture"
    },
    {
      id: 2,
      title: "New Zealand RBNZ cuts rates 50bps, housing market reacts",
      source: "Alpha Terminal",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Monetary Policy"
    },
    {
      id: 3,
      title: "Fonterra dairy exports surge on Chinese demand recovery",
      source: "Macro Pulse",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Agriculture"
    }
  ]
  },
  PK: {
    name: "Pakistan",
    code: "PK",
    lat: 30.37,
    lng: 69.34,
    currency: "PKR",
    marketIndex: "KSE 100",
    indexValue: 78234.56,
    indexChange: 1234.56,
    indexChangePct: 1.6,
    color: "#00ff88",
    newsIntensity: 0.75,
    sentiment: "bullish",
    exchange: "PSX",
    tradingHours: "09:30–15:30 PKT",
    timezone: "PKT",
    sparkline: [75000, 75600, 76200, 76800, 77300, 77800, 78234],
    news: [
    {
      id: 1,
      title: "Pakistan secures $7bn IMF bailout, stock market surges on relief rally",
      source: "Market Wire",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+4.5%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Pakistan IMF deal extended, $7bn loan unlocks economic stabilization",
      source: "Global Macro Desk",
      time: "30 min ago",
      sentiment: "bullish",
      impact: "+3.1%",
      category: "Economy"
    },
    {
      id: 3,
      title: "Karachi exchange hits all-time high as inflation drops to 18%",
      source: "Macro Wire",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+2.4%",
      category: "Monetary Policy"
    }
  ]
  },
  BD: {
    name: "Bangladesh",
    code: "BD",
    lat: 23.68,
    lng: 90.35,
    currency: "BDT",
    marketIndex: "DSEX",
    indexValue: 5234.56,
    indexChange: -89.34,
    indexChangePct: -1.68,
    color: "#ff2244",
    newsIntensity: 0.66,
    sentiment: "bearish",
    exchange: "DSE",
    tradingHours: "10:00–14:30 BST",
    timezone: "BST",
    sparkline: [5500, 5470, 5440, 5415, 5388, 5362, 5234],
    news: [
    {
      id: 1,
      title: "Bangladesh garment exports hit $45bn, becoming world's 2nd largest exporter",
      source: "Capital Feed",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Manufacturing"
    },
    {
      id: 2,
      title: "Bangladesh garment sector faces order cancellations from EU buyers",
      source: "Trade Flow Intel",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-2.1%",
      category: "Trade"
    },
    {
      id: 3,
      title: "Political unrest disrupts Dhaka markets, taka hits low vs USD",
      source: "FX Monitor",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-1.9%",
      category: "Politics"
    }
  ]
  },
  SA: {
    name: "Saudi Arabia",
    code: "SA",
    lat: 23.88,
    lng: 45.07,
    currency: "SAR",
    marketIndex: "Tadawul All Share",
    indexValue: 11234.56,
    indexChange: 123.45,
    indexChangePct: 1.11,
    color: "#00ff88",
    newsIntensity: 0.75,
    sentiment: "bullish",
    exchange: "Tadawul",
    tradingHours: "10:00–15:00 AST",
    timezone: "AST",
    sparkline: [11050, 11090, 11130, 11160, 11190, 11215, 11234],
    news: [
    {
      id: 1,
      title: "Saudi Aramco announces $50bn expansion plan, oil output to rise 10%",
      source: "Commodity Desk",
      time: "10 min ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Energy"
    },
    {
      id: 2,
      title: "OPEC+ agrees to extend production cuts through Q4 2026",
      source: "Credit Monitor",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+1.5%",
      category: "Energy"
    }
  ]
  },
  AE: {
    name: "UAE",
    code: "AE",
    lat: 23.42,
    lng: 53.84,
    currency: "AED",
    marketIndex: "DFM General",
    indexValue: 4234.56,
    indexChange: 56.78,
    indexChangePct: 1.36,
    color: "#00ff88",
    newsIntensity: 0.7,
    sentiment: "bullish",
    exchange: "DFM / ADX",
    tradingHours: "10:00–14:00 GST",
    timezone: "GST",
    sparkline: [4150, 4170, 4185, 4200, 4215, 4225, 4234],
    news: [
    {
      id: 1,
      title: "Dubai real estate sales reach $15bn in Q2, international buyers surge",
      source: "Gulf News",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.4%",
      category: "Real Estate"
    }
  ]
  },
  QA: {
    name: "Qatar",
    code: "QA",
    lat: 25.35,
    lng: 51.18,
    currency: "QAR",
    marketIndex: "QSI",
    indexValue: 10234.56,
    indexChange: 89.45,
    indexChangePct: 0.88,
    color: "#00ff88",
    newsIntensity: 0.68,
    sentiment: "bullish",
    exchange: "QSE",
    tradingHours: "09:30–13:15 AST",
    timezone: "AST",
    sparkline: [10050, 10080, 10110, 10140, 10175, 10205, 10234],
    news: [
    {
      id: 1,
      title: "Qatar LNG expansion to 126 MTPA marks major energy milestone",
      source: "Alpha Terminal",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.3%",
      category: "Energy"
    },
    {
      id: 2,
      title: "QatarEnergy signs 27-year LNG supply deal with Germany",
      source: "Macro Pulse",
      time: "35 min ago",
      sentiment: "bullish",
      impact: "+1.7%",
      category: "Energy"
    },
    {
      id: 3,
      title: "Qatar 2030 Vision attracts $18bn in tech and tourism FDI",
      source: "Market Wire",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+0.9%",
      category: "Investment"
    }
  ]
  },
  IL: {
    name: "Israel",
    code: "IL",
    lat: 31.04,
    lng: 34.85,
    currency: "ILS",
    marketIndex: "TA-35",
    indexValue: 1734.56,
    indexChange: -45.23,
    indexChangePct: -2.54,
    color: "#ff2244",
    newsIntensity: 0.92,
    sentiment: "bearish",
    exchange: "TASE",
    tradingHours: "09:59–17:15 IST",
    timezone: "IST",
    sparkline: [1890, 1860, 1840, 1810, 1790, 1762, 1734],
    news: [
    {
      id: 1,
      title: "Israel market falls on geopolitical tensions, shekel weakens",
      source: "Global Macro Desk",
      time: "30 min ago",
      sentiment: "bearish",
      impact: "-2.5%",
      category: "Geopolitics"
    },
    {
      id: 2,
      title: "Geopolitical tensions weigh on Tel Aviv exchange, shekel weakens",
      source: "Macro Wire",
      time: "10 min ago",
      sentiment: "bearish",
      impact: "-2.8%",
      category: "Geopolitics"
    },
    {
      id: 3,
      title: "Israel tech sector VC funding drops 35% amid security concerns",
      source: "Capital Feed",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-1.5%",
      category: "Tech"
    },
    {
      id: 4,
      title: "Check Point Software reports 18% revenue growth, defies market",
      source: "FT",
      time: "8h ago",
      sentiment: "bullish",
      impact: "+2.3%",
      category: "Cybersecurity"
    }
  ]
  },
  ZA: {
    name: "South Africa",
    code: "ZA",
    lat: -30.55,
    lng: 22.93,
    currency: "ZAR",
    marketIndex: "JSE All Share",
    indexValue: 78234.56,
    indexChange: -456.78,
    indexChangePct: -0.58,
    color: "#ff6b35",
    newsIntensity: 0.5,
    sentiment: "bearish",
    exchange: "JSE",
    tradingHours: "09:00–17:00 SAST",
    timezone: "SAST",
    sparkline: [79000, 78900, 78800, 78650, 78500, 78380, 78234],
    news: [
    {
      id: 1,
      title: "South Africa load shedding crisis costs economy R1.2bn daily",
      source: "Business Day",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-0.9%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Platinum group metals exports surge on green hydrogen demand",
      source: "Trade Flow Intel",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Resources"
    }
  ]
  },
  NG: {
    name: "Nigeria",
    code: "NG",
    lat: 9.08,
    lng: 8.67,
    currency: "NGN",
    marketIndex: "NGX All Share",
    indexValue: 98234.56,
    indexChange: 1234.56,
    indexChangePct: 1.27,
    color: "#00ff88",
    newsIntensity: 0.63,
    sentiment: "bullish",
    exchange: "NGX",
    tradingHours: "10:00–14:30 WAT",
    timezone: "WAT",
    sparkline: [96000, 96500, 97000, 97500, 97800, 98050, 98234],
    news: [
    {
      id: 1,
      title: "Nigeria's Dangote Refinery begins crude production, fuel imports to fall",
      source: "FX Monitor",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.3%",
      category: "Energy"
    }
  ]
  },
  EG: {
    name: "Egypt",
    code: "EG",
    lat: 26.82,
    lng: 30.8,
    currency: "EGP",
    marketIndex: "EGX 30",
    indexValue: 26789.45,
    indexChange: 234.56,
    indexChangePct: 0.88,
    color: "#ffaa00",
    newsIntensity: 0.62,
    sentiment: "neutral",
    exchange: "EGX",
    tradingHours: "10:00–14:30 EET",
    timezone: "EET",
    sparkline: [26300, 26400, 26500, 26580, 26640, 26715, 26789],
    news: [
    {
      id: 1,
      title: "Egypt IMF deal and Suez Canal reforms boost investor confidence",
      source: "Commodity Desk",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Egypt IMF programme extended as reforms gain traction",
      source: "Credit Monitor",
      time: "40 min ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Economy"
    },
    {
      id: 3,
      title: "Suez Canal revenues fall 40% on Red Sea shipping diversions",
      source: "Alpha Terminal",
      time: "3h ago",
      sentiment: "bearish",
      impact: "-1.8%",
      category: "Trade"
    }
  ]
  },
  KE: {
    name: "Kenya",
    code: "KE",
    lat: -0.02,
    lng: 37.9,
    currency: "KES",
    marketIndex: "NSE 20",
    indexValue: 1687.34,
    indexChange: -34.56,
    indexChangePct: -2.01,
    color: "#ff2244",
    newsIntensity: 0.6,
    sentiment: "bearish",
    exchange: "NSE",
    tradingHours: "09:30–15:00 EAT",
    timezone: "EAT",
    sparkline: [1780, 1765, 1752, 1740, 1727, 1708, 1687],
    news: [
    {
      id: 1,
      title: "Kenya mobile money ecosystem drives 8.5% GDP growth, leads Africa fintech",
      source: "Macro Pulse",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.4%",
      category: "Fintech"
    },
    {
      id: 2,
      title: "Kenya shilling slides 18% YTD, IMF bailout talks intensify",
      source: "Market Wire",
      time: "25 min ago",
      sentiment: "bearish",
      impact: "-2.5%",
      category: "Currency"
    },
    {
      id: 3,
      title: "Safaricom M-Pesa passes 50M users across Africa",
      source: "Global Macro Desk",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+1.6%",
      category: "Fintech"
    }
  ]
  },
  MA: {
    name: "Morocco",
    code: "MA",
    lat: 31.79,
    lng: -7.09,
    currency: "MAD",
    marketIndex: "MASI",
    indexValue: 13456.78,
    indexChange: 123.45,
    indexChangePct: 0.93,
    color: "#00ff88",
    newsIntensity: 0.55,
    sentiment: "bullish",
    exchange: "Casablanca SE",
    tradingHours: "09:30–15:30 WET",
    timezone: "WET",
    sparkline: [13200, 13240, 13280, 13320, 13370, 13415, 13456],
    news: [
    {
      id: 1,
      title: "Morocco green hydrogen project attracts €10bn EU investment",
      source: "Macro Wire",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+1.8%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Morocco World Cup 2030 co-host status boosts construction stocks",
      source: "Capital Feed",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+2.1%",
      category: "Infrastructure"
    },
    {
      id: 3,
      title: "Green hydrogen Xlinks project reaches financial close for €17bn",
      source: "Trade Flow Intel",
      time: "4h ago",
      sentiment: "bullish",
      impact: "+1.4%",
      category: "Energy"
    }
  ]
  },
  UA: {
    name: "Ukraine",
    code: "UA",
    lat: 48.37,
    lng: 31.16,
    currency: "UAH",
    marketIndex: "PFTS Index",
    indexValue: 312.45,
    indexChange: -8.67,
    indexChangePct: -2.7,
    color: "#ff2244",
    newsIntensity: 0.95,
    sentiment: "bearish",
    exchange: "PFTS Stock Exchange",
    tradingHours: "10:00–17:00 EET",
    timezone: "EET",
    sparkline: [345, 338, 332, 325, 320, 316, 312],
    news: [
    {
      id: 1,
      title: "IMF unlocks $2.2bn tranche for Ukraine reconstruction fund",
      source: "FX Monitor",
      time: "15 min ago",
      sentiment: "bullish",
      impact: "+1.8%",
      category: "Aid"
    },
    {
      id: 2,
      title: "Ukraine grain corridor disruption raises global food price fears",
      source: "Commodity Desk",
      time: "2h ago",
      sentiment: "bearish",
      impact: "-3.1%",
      category: "Agriculture"
    },
    {
      id: 3,
      title: "Kyiv tech diaspora firms raise $800M in Silicon Valley",
      source: "FT",
      time: "8h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Tech"
    }
  ]
  },
  KW: {
    name: "Kuwait",
    code: "KW",
    lat: 29.31,
    lng: 47.48,
    currency: "KWD",
    marketIndex: "Boursa Kuwait",
    indexValue: 7234.56,
    indexChange: 56.78,
    indexChangePct: 0.79,
    color: "#00ff88",
    newsIntensity: 0.58,
    sentiment: "bullish",
    exchange: "Boursa Kuwait",
    tradingHours: "09:00–12:30 AST",
    timezone: "AST",
    sparkline: [7110, 7135, 7158, 7176, 7196, 7215, 7234],
    news: [
    {
      id: 1,
      title: "Kuwait Investment Authority divests $4bn US equity stake, rebalances",
      source: "FT",
      time: "2h ago",
      sentiment: "neutral",
      impact: "-0.2%",
      category: "Sovereign Wealth"
    },
    {
      id: 2,
      title: "Zain Group reports 12% profit jump on mobile data growth",
      source: "Credit Monitor",
      time: "5h ago",
      sentiment: "bullish",
      impact: "+1.1%",
      category: "Telecom"
    }
  ]
  },
  OM: {
    name: "Oman",
    code: "OM",
    lat: 21.51,
    lng: 55.92,
    currency: "OMR",
    marketIndex: "MSM 30",
    indexValue: 4567.89,
    indexChange: 23.45,
    indexChangePct: 0.52,
    color: "#ffaa00",
    newsIntensity: 0.46,
    sentiment: "neutral",
    exchange: "Muscat Stock Exchange",
    tradingHours: "10:00–14:00 GST",
    timezone: "GST",
    sparkline: [4510, 4523, 4535, 4547, 4555, 4562, 4567],
    news: [
    {
      id: 1,
      title: "Oman accelerates Vision 2040 economic diversification push",
      source: "Alpha Terminal",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Bank Muscat profits rise 9% on loan growth and digital banking",
      source: "Macro Pulse",
      time: "7h ago",
      sentiment: "bullish",
      impact: "+0.6%",
      category: "Banking"
    }
  ]
  },
  JO: {
    name: "Jordan",
    code: "JO",
    lat: 30.58,
    lng: 36.23,
    currency: "JOD",
    marketIndex: "ASE",
    indexValue: 2134.56,
    indexChange: -23.45,
    indexChangePct: -1.09,
    color: "#ff6b35",
    newsIntensity: 0.48,
    sentiment: "bearish",
    exchange: "Amman Stock Exchange",
    tradingHours: "10:00–12:45 EET",
    timezone: "EET",
    sparkline: [2200, 2192, 2184, 2175, 2165, 2150, 2134],
    news: [
    {
      id: 1,
      title: "Jordan regional instability weighs on investor confidence",
      source: "Market Wire",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-1.4%",
      category: "Geopolitics"
    },
    {
      id: 2,
      title: "Potash exports hit record — phosphate royalties boost budget",
      source: "Global Macro Desk",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+0.7%",
      category: "Resources"
    }
  ]
  },
  BH: {
    name: "Bahrain",
    code: "BH",
    lat: 26,
    lng: 50.55,
    currency: "BHD",
    marketIndex: "Bahrain All Share",
    indexValue: 1987.34,
    indexChange: 14.56,
    indexChangePct: 0.74,
    color: "#00ff88",
    newsIntensity: 0.44,
    sentiment: "bullish",
    exchange: "Bahrain Bourse",
    tradingHours: "09:30–13:00 AST",
    timezone: "AST",
    sparkline: [1950, 1956, 1962, 1968, 1975, 1981, 1987],
    news: [
    {
      id: 1,
      title: "Bahrain becomes first Gulf state to list crypto asset on exchange",
      source: "Macro Wire",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+1.3%",
      category: "Crypto"
    },
    {
      id: 2,
      title: "Alba aluminium smelter expansion complete, capacity up 35%",
      source: "Capital Feed",
      time: "8h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Industry"
    }
  ]
  },
  IR: {
    name: "Iran",
    code: "IR",
    lat: 32.42,
    lng: 53.68,
    currency: "IRR",
    marketIndex: "Tehran SE",
    indexValue: 2134567,
    indexChange: -45678,
    indexChangePct: -2.1,
    color: "#ff2244",
    newsIntensity: 0.78,
    sentiment: "bearish",
    exchange: "Tehran Stock Exchange",
    tradingHours: "09:00–12:30 IRST",
    timezone: "IRST",
    sparkline: [2280000, 2250000, 2225000, 2200000, 2175000, 2155000, 2134567],
    news: [
    {
      id: 1,
      title: "US sanctions tightening cuts Iran oil exports to 25-year low",
      source: "Trade Flow Intel",
      time: "1h ago",
      sentiment: "bearish",
      impact: "-3.5%",
      category: "Sanctions"
    },
    {
      id: 2,
      title: "Iranian rial hits new historical low vs USD on black market",
      source: "FX Monitor",
      time: "4h ago",
      sentiment: "bearish",
      impact: "-2.8%",
      category: "Currency"
    }
  ]
  },
  GH: {
    name: "Ghana",
    code: "GH",
    lat: 7.95,
    lng: -1.02,
    currency: "GHS",
    marketIndex: "GSE Composite",
    indexValue: 3456.78,
    indexChange: -56.78,
    indexChangePct: -1.62,
    color: "#ff2244",
    newsIntensity: 0.57,
    sentiment: "bearish",
    exchange: "Ghana Stock Exchange",
    tradingHours: "10:00–15:00 GMT",
    timezone: "GMT",
    sparkline: [3620, 3598, 3575, 3555, 3535, 3497, 3456],
    news: [
    {
      id: 1,
      title: "Ghana completes $3bn debt restructuring, IMF program resumes",
      source: "Commodity Desk",
      time: "1h ago",
      sentiment: "bullish",
      impact: "+1.5%",
      category: "Debt"
    },
    {
      id: 2,
      title: "Cocoa production falls 22% on El Niño drought impact",
      source: "Credit Monitor",
      time: "4h ago",
      sentiment: "bearish",
      impact: "-2.3%",
      category: "Agriculture"
    }
  ]
  },
  CI: {
    name: "Ivory Coast",
    code: "CI",
    lat: 7.54,
    lng: -5.55,
    currency: "XOF",
    marketIndex: "BRVM Composite",
    indexValue: 234.56,
    indexChange: 3.45,
    indexChangePct: 1.49,
    color: "#00ff88",
    newsIntensity: 0.5,
    sentiment: "bullish",
    exchange: "BRVM",
    tradingHours: "09:00–16:00 GMT",
    timezone: "GMT",
    sparkline: [224, 226, 228, 230, 231, 233, 234],
    news: [
    {
      id: 1,
      title: "Ivory Coast cocoa output rebounds 15%, world's top producer surges",
      source: "Alpha Terminal",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.0%",
      category: "Agriculture"
    },
    {
      id: 2,
      title: "Abidjan port expansion boosts West Africa trade hub status",
      source: "Macro Pulse",
      time: "7h ago",
      sentiment: "bullish",
      impact: "+0.8%",
      category: "Trade"
    }
  ]
  },
  TZ: {
    name: "Tanzania",
    code: "TZ",
    lat: -6.36,
    lng: 34.89,
    currency: "TZS",
    marketIndex: "DSE All Share",
    indexValue: 2187.45,
    indexChange: 23.12,
    indexChangePct: 1.07,
    color: "#00ff88",
    newsIntensity: 0.44,
    sentiment: "bullish",
    exchange: "Dar es Salaam Stock Exchange",
    tradingHours: "10:00–14:00 EAT",
    timezone: "EAT",
    sparkline: [2130, 2141, 2152, 2162, 2171, 2180, 2187],
    news: [
    {
      id: 1,
      title: "Tanzania lithium reserves attract $5bn in mining investment",
      source: "Market Wire",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+1.9%",
      category: "Resources"
    },
    {
      id: 2,
      title: "East African Community integration boosts Dar es Salaam exchange",
      source: "Global Macro Desk",
      time: "8h ago",
      sentiment: "bullish",
      impact: "+0.5%",
      category: "Trade"
    }
  ]
  },
  LK: {
    name: "Sri Lanka",
    code: "LK",
    lat: 7.87,
    lng: 80.77,
    currency: "LKR",
    marketIndex: "CSE All Share",
    indexValue: 12456.78,
    indexChange: 89.34,
    indexChangePct: 0.72,
    color: "#ffaa00",
    newsIntensity: 0.54,
    sentiment: "neutral",
    exchange: "Colombo Stock Exchange",
    tradingHours: "09:30–12:30 IST",
    timezone: "IST",
    sparkline: [12200, 12240, 12280, 12320, 12370, 12415, 12456],
    news: [
    {
      id: 1,
      title: "Sri Lanka exits IMF program, debt restructuring complete",
      source: "Macro Wire",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+2.5%",
      category: "Economy"
    },
    {
      id: 2,
      title: "Ceylon Tea exports recover 8% after supply disruptions ease",
      source: "Capital Feed",
      time: "7h ago",
      sentiment: "bullish",
      impact: "+0.6%",
      category: "Agriculture"
    }
  ]
  },
  KZ: {
    name: "Kazakhstan",
    code: "KZ",
    lat: 48.01,
    lng: 66.92,
    currency: "KZT",
    marketIndex: "KASE",
    indexValue: 4567.89,
    indexChange: 56.78,
    indexChangePct: 1.26,
    color: "#00ff88",
    newsIntensity: 0.55,
    sentiment: "bullish",
    exchange: "Kazakhstan Stock Exchange",
    tradingHours: "11:30–17:00 ALMT",
    timezone: "ALMT",
    sparkline: [4420, 4450, 4480, 4505, 4530, 4550, 4567],
    news: [
    {
      id: 1,
      title: "Kazakhstan oil output diversification cuts Russia dependency to 30%",
      source: "Trade Flow Intel",
      time: "2h ago",
      sentiment: "bullish",
      impact: "+1.8%",
      category: "Energy"
    },
    {
      id: 2,
      title: "Almaty crypto mining hub attracts $2bn in global investments",
      source: "FX Monitor",
      time: "6h ago",
      sentiment: "bullish",
      impact: "+1.2%",
      category: "Crypto"
    }
  ]
  },
  PE: {
    name: "Peru",
    code: "PE",
    lat: -9.19,
    lng: -75.01,
    currency: "PEN",
    marketIndex: "BVL General",
    indexValue: 21456.78,
    indexChange: 134.56,
    indexChangePct: 0.63,
    color: "#ffaa00",
    newsIntensity: 0.52,
    sentiment: "neutral",
    exchange: "Bolsa de Valores de Lima",
    tradingHours: "08:30–15:00 PET",
    timezone: "PET",
    sparkline: [21100, 21160, 21220, 21280, 21340, 21400, 21456],
    news: [
    {
      id: 1,
      title: "Southern Copper reports 18% profit jump, largest producer gains",
      source: "Commodity Desk",
      time: "3h ago",
      sentiment: "bullish",
      impact: "+1.8%",
      category: "Resources"
    },
    {
      id: 2,
      title: "Peru political instability weighs on mining investment outlook",
      source: "Credit Monitor",
      time: "7h ago",
      sentiment: "bearish",
      impact: "-0.9%",
      category: "Politics"
    }
  ]
  },
  GY: {
    name: "Guyana",
    code: "GY",
    lat: 4.86,
    lng: -58.93,
    currency: "GYD",
    marketIndex: "GASCI",
    indexValue: 1823.45,
    indexChange: 12.34,
    indexChangePct: 0.68,
    color: "#00ff88",
    newsIntensity: 0.35,
    sentiment: "bullish",
    exchange: "GASCI",
    tradingHours: "09:00–13:00 GYT",
    timezone: "GYT",
    sparkline: [1780, 1790, 1800, 1810, 1815, 1820, 1823],
    news: [
      {
        id: 1,
        title: "Guyana oil sector drives double-digit GDP growth outlook",
        source: "GASCI Wire",
        time: "3h ago",
        sentiment: "bullish",
        impact: "+1.5%",
        category: "Energy"
      }
    ]
  },
  DZ: {
    name: "Algeria",
    code: "DZ",
    lat: 28.03,
    lng: 1.66,
    currency: "DZD",
    marketIndex: "SGBV Index",
    indexValue: 3456.78,
    indexChange: 23.45,
    indexChangePct: 0.68,
    color: "#ffaa00",
    newsIntensity: 0.42,
    sentiment: "neutral",
    exchange: "SGBV",
    tradingHours: "09:00–12:00 CET",
    timezone: "CET",
    sparkline: [3410, 3420, 3428, 3435, 3442, 3450, 3456],
    news: [
      {
        id: 1,
        title: "Algeria signs major gas pipeline transit deals with European partners",
        source: "Algiers Wire",
        time: "2h ago",
        sentiment: "bullish",
        impact: "+1.2%",
        category: "Energy"
      }
    ]
  }
};

export const GLOBAL_INDICES = [
  { name: "S&P 500", value: "7,707.98", change: "+1.51%", up: true },
  { name: "DOW JONES", value: "53,463.05", change: "+0.85%", up: true },
  { name: "NASDAQ", value: "26,331.09", change: "+1.37%", up: true },
  { name: "FTSE 100", value: "10,743.35", change: "-0.62%", up: false },
  { name: "DAX 40", value: "26,091.33", change: "-0.64%", up: false },
  { name: "NIKKEI 225", value: "65,326.42", change: "-3.20%", up: false },
  { name: "HANG SENG", value: "25,495.07", change: "+0.09%", up: true },
  { name: "SSE COMP", value: "3,894.42", change: "-2.40%", up: false },
  { name: "CAC 40", value: "7,823.45", change: "-0.44%", up: false },
  { name: "ASX 200", value: "7,834.21", change: "+0.73%", up: true },
  { name: "NIFTY 50", value: "24,078.30", change: "-0.20%", up: false },
  { name: "BOVESPA", value: "128,456", change: "-0.95%", up: false },
  { name: "TSX COMP", value: "22,145.67", change: "+0.40%", up: true },
  { name: "KOSPI", value: "2,847.23", change: "+1.23%", up: true },
  { name: "TAIEX", value: "21,456.78", change: "+1.10%", up: true },
  { name: "STI", value: "3,456.78", change: "+0.68%", up: true },
  { name: "IBEX 35", value: "11,234.56", change: "+0.51%", up: true },
  { name: "SMI", value: "11,876.54", change: "+0.39%", up: true },
  { name: "FTSE MIB", value: "32,456.78", change: "+0.38%", up: true },
  { name: "AEX", value: "872.34", change: "-0.65%", up: false },
  { name: "BIST 100", value: "9,876,543", change: "+1.26%", up: true },
  { name: "TADAWUL", value: "11,234.56", change: "+1.11%", up: true },
  { name: "TASE", value: "2,156.78", change: "-2.07%", up: false },
  { name: "MOEX", value: "3,123.45", change: "-2.13%", up: false },
  { name: "GOLD", value: "$4,487.91", change: "+0.32%", up: true },
  { name: "SILVER", value: "$29.14", change: "+0.67%", up: true },
  { name: "WTI OIL", value: "$78.43", change: "-0.54%", up: false },
  { name: "BRENT", value: "$82.17", change: "-0.48%", up: false },
  { name: "COPPER", value: "$4.52", change: "+1.12%", up: true },
  { name: "NAT GAS", value: "$2.34", change: "-1.23%", up: false },
  { name: "BTC/USD", value: "$67,234", change: "+2.14%", up: true },
  { name: "ETH/USD", value: "$3,456", change: "+3.21%", up: true },
  { name: "EUR/USD", value: "1.0876", change: "-0.12%", up: false },
  { name: "GBP/USD", value: "1.2734", change: "-0.23%", up: false },
  { name: "USD/JPY", value: "142.34", change: "+0.45%", up: true },
  { name: "DXY", value: "104.23", change: "+0.21%", up: true },
  { name: "VIX", value: "15.62", change: "-1.20%", up: false }
];

export const NEWS_MARKERS = Object.values(COUNTRIES_DATA).map((c) => ({
  lat: c.lat,
  lng: c.lng,
  size: c.newsIntensity * 0.8,
  color:
    c.sentiment === "bullish"
      ? "#00ff88"
      : c.sentiment === "bearish"
        ? "#ff2244"
        : "#ffaa00",
  country: c.code,
  label: c.name,
}));
