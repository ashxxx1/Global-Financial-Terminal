// ─── Chart Data Generator ─────────────────────────────────────────────────────
// Generates deterministic OHLCV data for any asset using seeded random walks.
// All data is simulated for demonstration — not real market data.

export const ASSET_CATALOG = [
  // ── US Equities ──────────────────────────────────────────────────────────────
  { symbol: "AAPL",  name: "Apple Inc.",            type: "Stock",     basePrice: 189.84, color: "#6366f1", sector: "Technology" },
  { symbol: "MSFT",  name: "Microsoft Corp.",        type: "Stock",     basePrice: 415.32, color: "#6366f1", sector: "Technology" },
  { symbol: "NVDA",  name: "NVIDIA Corp.",           type: "Stock",     basePrice: 875.40, color: "#6366f1", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.",          type: "Stock",     basePrice: 175.12, color: "#6366f1", sector: "Technology" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",        type: "Stock",     basePrice: 188.40, color: "#6366f1", sector: "Consumer & Retail" },
  { symbol: "TSLA",  name: "Tesla Inc.",             type: "Stock",     basePrice: 248.50, color: "#6366f1", sector: "Technology" },
  { symbol: "META",  name: "Meta Platforms Inc.",    type: "Stock",     basePrice: 524.60, color: "#6366f1", sector: "Technology" },
  { symbol: "JPM",   name: "JPMorgan Chase & Co.",  type: "Stock",     basePrice: 198.40, color: "#6366f1", sector: "Finance" },
  { symbol: "V",     name: "Visa Inc.",              type: "Stock",     basePrice: 276.80, color: "#6366f1", sector: "Finance" },
  { symbol: "WMT",   name: "Walmart Inc.",           type: "Stock",     basePrice: 68.20,  color: "#6366f1", sector: "Consumer & Retail" },
  { symbol: "JNJ",   name: "Johnson & Johnson",      type: "Stock",     basePrice: 147.30, color: "#6366f1", sector: "Healthcare" },
  { symbol: "XOM",   name: "ExxonMobil Corp.",       type: "Stock",     basePrice: 114.60, color: "#6366f1", sector: "Energy" },
  { symbol: "BAC",   name: "Bank of America Corp.",  type: "Stock",     basePrice: 40.20,  color: "#6366f1", sector: "Finance" },
  { symbol: "NFLX",  name: "Netflix Inc.",           type: "Stock",     basePrice: 684.20, color: "#6366f1", sector: "Technology" },
  { symbol: "AMD",   name: "Advanced Micro Devices", type: "Stock",     basePrice: 162.40, color: "#6366f1", sector: "Technology" },
  { symbol: "ASML",  name: "ASML Holding NV",        type: "Stock",     basePrice: 876.40, color: "#6366f1", sector: "Technology" },
  { symbol: "TSM",   name: "Taiwan Semiconductor",   type: "Stock",     basePrice: 168.20, color: "#6366f1", sector: "Technology" },
  { symbol: "NVO",   name: "Novo Nordisk A/S",       type: "Stock",     basePrice: 115.40, color: "#6366f1", sector: "Healthcare" },
  { symbol: "INTC",  name: "Intel Corp.",            type: "Stock",     basePrice: 30.50,  color: "#6366f1", sector: "Technology" },
  { symbol: "KO",    name: "Coca-Cola Company",      type: "Stock",     basePrice: 62.40,  color: "#6366f1", sector: "Consumer & Retail" },
  { symbol: "PEP",   name: "PepsiCo Inc.",           type: "Stock",     basePrice: 168.20, color: "#6366f1", sector: "Consumer & Retail" },
  { symbol: "PG",    name: "Procter & Gamble Co.",   type: "Stock",     basePrice: 162.80, color: "#6366f1", sector: "Consumer & Retail" },
  { symbol: "CVX",   name: "Chevron Corp.",          type: "Stock",     basePrice: 154.60, color: "#6366f1", sector: "Energy" },
  { symbol: "LLY",   name: "Eli Lilly & Co.",        type: "Stock",     basePrice: 780.40, color: "#6366f1", sector: "Healthcare" },
  { symbol: "COST",  name: "Costco Wholesale Corp.", type: "Stock",     basePrice: 725.10, color: "#6366f1", sector: "Consumer & Retail" },

  // ── Indian Stocks ────────────────────────────────────────────────────────────
  // IT Services
  { symbol: "TCS",        name: "Tata Consultancy Services Ltd", type: "Indian Stock", basePrice: 3850.50,  color: "#0d9488", sector: "IT Services" },
  { symbol: "INFY",       name: "Infosys Ltd",                   type: "Indian Stock", basePrice: 1530.20,  color: "#0d9488", sector: "IT Services" },
  { symbol: "WIPRO",      name: "Wipro Ltd",                     type: "Indian Stock", basePrice: 490.80,   color: "#0d9488", sector: "IT Services" },
  { symbol: "HCLTECH",    name: "HCL Technologies Ltd",          type: "Indian Stock", basePrice: 1450.40,  color: "#0d9488", sector: "IT Services" },
  { symbol: "TECHM",      name: "Tech Mahindra Ltd",             type: "Indian Stock", basePrice: 1380.60,  color: "#0d9488", sector: "IT Services" },
  { symbol: "LTIM",       name: "LTIMindtree Ltd",               type: "Indian Stock", basePrice: 4850.90,  color: "#0d9488", sector: "IT Services" },
  // Finance & Banking
  { symbol: "HDFCBANK",   name: "HDFC Bank Ltd",                 type: "Indian Stock", basePrice: 1680.40,  color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "ICICIBANK",  name: "ICICI Bank Ltd",                type: "Indian Stock", basePrice: 1120.30,  color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "SBIN",       name: "State Bank of India",           type: "Indian Stock", basePrice: 840.50,   color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank Ltd",       type: "Indian Stock", basePrice: 1750.60,  color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "AXISBANK",   name: "Axis Bank Ltd",                 type: "Indian Stock", basePrice: 1180.20,  color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd",             type: "Indian Stock", basePrice: 7100.80,  color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd",             type: "Indian Stock", basePrice: 1580.40,  color: "#0d9488", sector: "Banking & Finance" },
  { symbol: "LICI",       name: "Life Insurance Corp of India",  type: "Indian Stock", basePrice: 980.25,   color: "#0d9488", sector: "Banking & Finance" },
  // Energy & Utilities
  { symbol: "RELIANCE",   name: "Reliance Industries Ltd",       type: "Indian Stock", basePrice: 2950.40,  color: "#0d9488", sector: "Energy & Utilities" },
  { symbol: "ONGC",       name: "Oil & Natural Gas Corp Ltd",    type: "Indian Stock", basePrice: 270.80,   color: "#0d9488", sector: "Energy & Utilities" },
  { symbol: "NTPC",       name: "NTPC Ltd",                      type: "Indian Stock", basePrice: 360.50,   color: "#0d9488", sector: "Energy & Utilities" },
  { symbol: "POWERGRID",  name: "Power Grid Corp of India",      type: "Indian Stock", basePrice: 320.40,   color: "#0d9488", sector: "Energy & Utilities" },
  { symbol: "BPCL",       name: "Bharat Petroleum Corp Ltd",     type: "Indian Stock", basePrice: 310.20,   color: "#0d9488", sector: "Energy & Utilities" },
  { symbol: "COALINDIA",  name: "Coal India Ltd",                type: "Indian Stock", basePrice: 480.60,   color: "#0d9488", sector: "Energy & Utilities" },
  // Automotive
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd",               type: "Indian Stock", basePrice: 960.50,   color: "#0d9488", sector: "Automotive" },
  { symbol: "M&M",        name: "Mahindra & Mahindra Ltd",       type: "Indian Stock", basePrice: 2850.80,  color: "#0d9488", sector: "Automotive" },
  { symbol: "MARUTI",     name: "Maruti Suzuki India Ltd",       type: "Indian Stock", basePrice: 12100.60, color: "#0d9488", sector: "Automotive" },
  { symbol: "EICHERMOT",  name: "Eicher Motors Ltd",             type: "Indian Stock", basePrice: 4750.40,  color: "#0d9488", sector: "Automotive" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd",             type: "Indian Stock", basePrice: 5450.90,  color: "#0d9488", sector: "Automotive" },
  // FMCG & Retail
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd",        type: "Indian Stock", basePrice: 2450.80,  color: "#0d9488", sector: "Consumer Goods / FMCG" },
  { symbol: "ITC",        name: "ITC Ltd",                       type: "Indian Stock", basePrice: 430.40,   color: "#0d9488", sector: "Consumer Goods / FMCG" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd",    type: "Indian Stock", basePrice: 1110.20,  color: "#0d9488", sector: "Consumer Goods / FMCG" },
  { symbol: "BRITANNIA",  name: "Britannia Industries Ltd",      type: "Indian Stock", basePrice: 5350.60,  color: "#0d9488", sector: "Consumer Goods / FMCG" },
  { symbol: "NESTLEIND",  name: "Nestle India Ltd",              type: "Indian Stock", basePrice: 2520.40,  color: "#0d9488", sector: "Consumer Goods / FMCG" },
  { symbol: "TITAN",      name: "Titan Company Ltd",             type: "Indian Stock", basePrice: 3280.90,  color: "#0d9488", sector: "Consumer Goods / FMCG" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd",              type: "Indian Stock", basePrice: 2890.50,  color: "#0d9488", sector: "Consumer Goods / FMCG" },
  // Metals & Mining
  { symbol: "TATASTEEL",  name: "Tata Steel Ltd",                type: "Indian Stock", basePrice: 175.40,   color: "#0d9488", sector: "Metals & Mining" },
  { symbol: "JSWSTEEL",   name: "JSW Steel Ltd",                 type: "Indian Stock", basePrice: 920.80,   color: "#0d9488", sector: "Metals & Mining" },
  { symbol: "HINDALCO",   name: "Hindalco Industries Ltd",       type: "Indian Stock", basePrice: 680.50,   color: "#0d9488", sector: "Metals & Mining" },
  { symbol: "GRASIM",     name: "Grasim Industries Ltd",         type: "Indian Stock", basePrice: 2480.60,  color: "#0d9488", sector: "Metals & Mining" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd",          type: "Indian Stock", basePrice: 10850.40, color: "#0d9488", sector: "Metals & Mining" },
  // Healthcare & Pharma
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical Industries", type: "Indian Stock", basePrice: 1480.40,  color: "#0d9488", sector: "Healthcare & Pharma" },
  { symbol: "CIPLA",      name: "Cipla Ltd",                     type: "Indian Stock", basePrice: 1510.60,  color: "#0d9488", sector: "Healthcare & Pharma" },
  { symbol: "DRREDDY",    name: "Dr. Reddy's Laboratories Ltd",  type: "Indian Stock", basePrice: 6080.20,  color: "#0d9488", sector: "Healthcare & Pharma" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise",   type: "Indian Stock", basePrice: 6250.50,  color: "#0d9488", sector: "Healthcare & Pharma" },
  { symbol: "DIVISLAB",   name: "Divi's Laboratories Ltd",       type: "Indian Stock", basePrice: 3950.40,  color: "#0d9488", sector: "Healthcare & Pharma" },
  // Conglomerates & Infrastructure
  { symbol: "ADANIENT",   name: "Adani Enterprises Ltd",         type: "Indian Stock", basePrice: 3150.80,  color: "#0d9488", sector: "Conglomerates & Infrastructure" },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ Ltd",         type: "Indian Stock", basePrice: 1450.40,  color: "#0d9488", sector: "Conglomerates & Infrastructure" },
  { symbol: "LT",         name: "Larsen & Toubro Ltd",           type: "Indian Stock", basePrice: 3550.20,  color: "#0d9488", sector: "Conglomerates & Infrastructure" },

  // ── Crypto ───────────────────────────────────────────────────────────────────
  { symbol: "BTC",   name: "Bitcoin",                type: "Crypto",    basePrice: 67234,  color: "#f59e0b", sector: "Crypto" },
  { symbol: "ETH",   name: "Ethereum",               type: "Crypto",    basePrice: 3542,   color: "#f59e0b", sector: "Crypto" },
  { symbol: "SOL",   name: "Solana",                 type: "Crypto",    basePrice: 168.40, color: "#f59e0b", sector: "Crypto" },
  { symbol: "BNB",   name: "BNB",                    type: "Crypto",    basePrice: 582.40, color: "#f59e0b", sector: "Crypto" },
  { symbol: "XRP",   name: "XRP",                    type: "Crypto",    basePrice: 0.524,  color: "#f59e0b", sector: "Crypto" },
  { symbol: "ADA",   name: "Cardano",                type: "Crypto",    basePrice: 0.448,  color: "#f59e0b", sector: "Crypto" },
  { symbol: "AVAX",  name: "Avalanche",              type: "Crypto",    basePrice: 36.80,  color: "#f59e0b", sector: "Crypto" },
  { symbol: "DOGE",  name: "Dogecoin",               type: "Crypto",    basePrice: 0.162,  color: "#f59e0b", sector: "Crypto" },
  { symbol: "LINK",  name: "Chainlink",              type: "Crypto",    basePrice: 14.24,  color: "#f59e0b", sector: "Crypto" },

  // ── Indices ──────────────────────────────────────────────────────────────────
  { symbol: "NIFTY",      name: "NIFTY 50 Index (NSE)",  type: "Index",     basePrice: 23540,  color: "#0369a1", sector: "Index" },
  { symbol: "SENSEX",     name: "BSE SENSEX Index",      type: "Index",     basePrice: 77210,  color: "#0369a1", sector: "Index" },
  { symbol: "BANKNIFTY",  name: "Nifty Bank Index",      type: "Index",     basePrice: 51620,  color: "#0369a1", sector: "Index" },
  { symbol: "CNXIT",      name: "Nifty IT Index",        type: "Index",     basePrice: 38450,  color: "#0369a1", sector: "Index" },
  { symbol: "SPX",        name: "S&P 500 Index",          type: "Index",     basePrice: 5487,   color: "#22d3ee", sector: "Index" },
  { symbol: "NDX",        name: "Nasdaq 100 Index",       type: "Index",     basePrice: 19876,  color: "#22d3ee", sector: "Index" },
  { symbol: "DJI",        name: "Dow Jones Ind. Avg.",    type: "Index",     basePrice: 43218,  color: "#22d3ee", sector: "Index" },
  { symbol: "FTSE",       name: "FTSE 100 Index",         type: "Index",     basePrice: 8143,   color: "#22d3ee", sector: "Index" },
  { symbol: "DAX",        name: "DAX 40 Index",           type: "Index",     basePrice: 18234,  color: "#22d3ee", sector: "Index" },
  { symbol: "NKY",        name: "Nikkei 225 Index",       type: "Index",     basePrice: 39847,  color: "#22d3ee", sector: "Index" },
  { symbol: "HSI",        name: "Hang Seng Index",        type: "Index",     basePrice: 18342,  color: "#22d3ee", sector: "Index" },
  { symbol: "VIX",        name: "CBOE Volatility Index",  type: "Index",     basePrice: 14.32,  color: "#22d3ee", sector: "Index" },

  // ── Forex ─────────────────────────────────────────────────────────────────
  { symbol: "EURUSD",name: "Euro / US Dollar",       type: "Forex",     basePrice: 1.0842, color: "#a78bfa", sector: "Forex" },
  { symbol: "GBPUSD",name: "British Pound / USD",    type: "Forex",     basePrice: 1.2685, color: "#a78bfa", sector: "Forex" },
  { symbol: "USDJPY",name: "USD / Japanese Yen",     type: "Forex",     basePrice: 151.24, color: "#a78bfa", sector: "Forex" },
  { symbol: "AUDUSD",name: "Australian Dollar / USD",type: "Forex",     basePrice: 0.6524, color: "#a78bfa", sector: "Forex" },
  { symbol: "USDCAD",name: "USD / Canadian Dollar",  type: "Forex",     basePrice: 1.3648, color: "#a78bfa", sector: "Forex" },
  { symbol: "USDCHF",name: "USD / Swiss Franc",      type: "Forex",     basePrice: 0.8924, color: "#a78bfa", sector: "Forex" },
  { symbol: "NZDUSD",name: "NZ Dollar / USD",        type: "Forex",     basePrice: 0.6012, color: "#a78bfa", sector: "Forex" },
  { symbol: "EURGBP",name: "Euro / British Pound",   type: "Forex",     basePrice: 0.8548, color: "#a78bfa", sector: "Forex" },
  { symbol: "XAUUSD",name: "Gold / USD (Spot)",      type: "Forex",     basePrice: 2387,   color: "#a78bfa", sector: "Forex" },

  // ── Commodities ──────────────────────────────────────────────────────────────
  { symbol: "GOLD",  name: "Gold Futures",           type: "Commodity", basePrice: 2387,   color: "#fbbf24", sector: "Commodity" },
  { symbol: "OIL",   name: "Crude Oil (WTI)",        type: "Commodity", basePrice: 78.42,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "BRENT", name: "Brent Crude Oil",        type: "Commodity", basePrice: 82.64,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "SILVER",name: "Silver Futures",         type: "Commodity", basePrice: 28.48,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "NG",    name: "Natural Gas Futures",    type: "Commodity", basePrice: 2.684,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "COPPER",name: "Copper Futures",         type: "Commodity", basePrice: 4.424,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "WHEAT", name: "Wheat Futures",          type: "Commodity", basePrice: 572.4,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "CORN",  name: "Corn Futures",           type: "Commodity", basePrice: 448.0,  color: "#fbbf24", sector: "Commodity" },
  { symbol: "COFFEE",name: "Coffee Futures",         type: "Commodity", basePrice: 2.24,   color: "#fbbf24", sector: "Commodity" },
  { symbol: "COCOA", name: "Cocoa Futures",          type: "Commodity", basePrice: 9820.0, color: "#fbbf24", sector: "Commodity" },
  { symbol: "SUGAR", name: "Sugar Futures",          type: "Commodity", basePrice: 0.1870, color: "#fbbf24", sector: "Commodity" },
  { symbol: "COTTON",name: "Cotton Futures",         type: "Commodity", basePrice: 0.7320, color: "#fbbf24", sector: "Commodity" },
  { symbol: "PLATINUM",name: "Platinum Futures",     type: "Commodity", basePrice: 985.40, color: "#fbbf24", sector: "Commodity" },
  { symbol: "GASOLINE",name: "RBOB Gasoline Futures",type: "Commodity", basePrice: 2.45,   color: "#fbbf24", sector: "Commodity" },
];

// Seeded deterministic random
function seededRng(seed) {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

function strSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

// Timeframe definitions
export const TIMEFRAMES = [
  { label: "1m",  bars: 200, msPerBar: 60_000 },
  { label: "5m",  bars: 200, msPerBar: 300_000 },
  { label: "15m", bars: 200, msPerBar: 900_000 },
  { label: "1h",  bars: 300, msPerBar: 3_600_000 },
  { label: "4h",  bars: 250, msPerBar: 14_400_000 },
  { label: "1D",  bars: 365, msPerBar: 86_400_000 },
  { label: "1W",  bars: 104, msPerBar: 604_800_000 },
  { label: "1M",  bars: 60,  msPerBar: 2_592_000_000 },
];

export function generateOHLCV(symbol, timeframeLabel) {
  const asset = ASSET_CATALOG.find(a => a.symbol === symbol);
  const base = asset ? asset.basePrice : 100;
  const tf = TIMEFRAMES.find(t => t.label === timeframeLabel) || TIMEFRAMES[5];
  const rng = seededRng(strSeed(`${symbol}-${timeframeLabel}`));
  const now = Date.now();
  const bars = [];
  let price = base;

  // Volatility scaled by asset type & timeframe
  const tfVolMult = { "1m":0.02,"5m":0.04,"15m":0.06,"1h":0.1,"4h":0.18,"1D":0.35,"1W":0.8,"1M":1.8 };
  const assetVol = { Stock:0.012, "Indian Stock":0.012, Crypto:0.035, Index:0.008, Forex:0.003, Commodity:0.015 };
  const vol = (assetVol[asset?.type || "Stock"] || 0.012) * (tfVolMult[timeframeLabel] || 0.35);

  for (let i = tf.bars; i >= 0; i--) {
    const time = Math.floor((now - i * tf.msPerBar) / 1000);
    const trend = (rng() - 0.488) * vol;
    const spread = rng() * vol * 0.6;
    const open = price;
    const close = open * (1 + trend);
    const high = Math.max(open, close) * (1 + rng() * spread);
    const low = Math.min(open, close) * (1 - rng() * spread);
    const volume = Math.floor(base * 1000 * (0.5 + rng() * 1.5));
    bars.push({ time, open, high, low, close, volume });
    price = close;
  }
  return bars;
}

// ─── Technical Indicator Calculators ─────────────────────────────────────────

export function calcSMA(data, period) {
  return data.map((bar, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((s, b) => s + b.close, 0) / period;
    return { time: bar.time, value: avg };
  }).filter(Boolean);
}

export function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const result = [];
  let ema = data[0].close;
  data.forEach((bar, i) => {
    if (i === 0) { result.push({ time: bar.time, value: ema }); return; }
    ema = bar.close * k + ema * (1 - k);
    result.push({ time: bar.time, value: ema });
  });
  return result;
}

export function calcBollingerBands(data, period = 20, stdDev = 2) {
  const sma = calcSMA(data, period);
  const result = { upper: [], middle: [], lower: [] };
  sma.forEach((pt, i) => {
    const idx = data.findIndex(b => b.time === pt.time);
    const slice = data.slice(idx - period + 1, idx + 1).map(b => b.close);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    const sd = Math.sqrt(variance);
    result.upper.push({ time: pt.time, value: pt.value + stdDev * sd });
    result.middle.push({ time: pt.time, value: pt.value });
    result.lower.push({ time: pt.time, value: pt.value - stdDev * sd });
  });
  return result;
}

export function calcRSI(data, period = 14) {
  const result = [];
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const delta = data[j].close - data[j - 1].close;
      if (delta > 0) gains += delta; else losses += Math.abs(delta);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    result.push({ time: data[i].time, value: parseFloat(rsi.toFixed(2)) });
  }
  return result;
}

export function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(data, fast);
  const emaSlow = calcEMA(data, slow);
  const minLen = Math.min(emaFast.length, emaSlow.length);
  const macdLine = [];
  for (let i = 0; i < minLen; i++) {
    const fi = emaFast.length - minLen + i;
    const si = emaSlow.length - minLen + i;
    macdLine.push({ time: emaFast[fi].time, value: emaFast[fi].value - emaSlow[si].value });
  }
  // Signal = EMA of MACD
  const k = 2 / (signal + 1);
  let sig = macdLine[0].value;
  const signalLine = macdLine.map((pt, i) => {
    if (i === 0) return { time: pt.time, value: sig };
    sig = pt.value * k + sig * (1 - k);
    return { time: pt.time, value: sig };
  });
  const histogram = macdLine.map((pt, i) => ({
    time: pt.time, value: pt.value - signalLine[i].value
  }));
  return { macdLine, signalLine, histogram };
}

export function calcVWAP(data) {
  let cumVol = 0, cumPV = 0;
  return data.map(bar => {
    const typical = (bar.high + bar.low + bar.close) / 3;
    cumPV += typical * bar.volume;
    cumVol += bar.volume;
    return { time: bar.time, value: cumVol > 0 ? cumPV / cumVol : typical };
  });
}
