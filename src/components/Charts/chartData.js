// ─── Chart Data Generator ─────────────────────────────────────────────────────
// Generates deterministic OHLCV data for any asset using seeded random walks.
// All data is simulated for demonstration — not real market data.

export const ASSET_CATALOG = [
  // ── US Equities ──────────────────────────────────────────────────────────────
  { symbol: "AAPL",  name: "Apple Inc.",            type: "Stock",     basePrice: 189.84, color: "#6366f1" },
  { symbol: "MSFT",  name: "Microsoft Corp.",        type: "Stock",     basePrice: 415.32, color: "#6366f1" },
  { symbol: "NVDA",  name: "NVIDIA Corp.",           type: "Stock",     basePrice: 875.40, color: "#6366f1" },
  { symbol: "GOOGL", name: "Alphabet Inc.",          type: "Stock",     basePrice: 175.12, color: "#6366f1" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",        type: "Stock",     basePrice: 188.40, color: "#6366f1" },
  { symbol: "TSLA",  name: "Tesla Inc.",             type: "Stock",     basePrice: 248.50, color: "#6366f1" },
  { symbol: "META",  name: "Meta Platforms Inc.",    type: "Stock",     basePrice: 524.60, color: "#6366f1" },
  { symbol: "JPM",   name: "JPMorgan Chase & Co.",  type: "Stock",     basePrice: 198.40, color: "#6366f1" },
  { symbol: "V",     name: "Visa Inc.",              type: "Stock",     basePrice: 276.80, color: "#6366f1" },
  { symbol: "WMT",   name: "Walmart Inc.",           type: "Stock",     basePrice: 68.20,  color: "#6366f1" },
  { symbol: "JNJ",   name: "Johnson & Johnson",      type: "Stock",     basePrice: 147.30, color: "#6366f1" },
  { symbol: "XOM",   name: "ExxonMobil Corp.",       type: "Stock",     basePrice: 114.60, color: "#6366f1" },
  { symbol: "BAC",   name: "Bank of America Corp.",  type: "Stock",     basePrice: 40.20,  color: "#6366f1" },
  { symbol: "NFLX",  name: "Netflix Inc.",           type: "Stock",     basePrice: 684.20, color: "#6366f1" },
  { symbol: "AMD",   name: "Advanced Micro Devices", type: "Stock",     basePrice: 162.40, color: "#6366f1" },
  { symbol: "ASML",  name: "ASML Holding NV",        type: "Stock",     basePrice: 876.40, color: "#6366f1" },
  { symbol: "TSM",   name: "Taiwan Semiconductor",   type: "Stock",     basePrice: 168.20, color: "#6366f1" },
  { symbol: "NVO",   name: "Novo Nordisk A/S",       type: "Stock",     basePrice: 115.40, color: "#6366f1" },
  { symbol: "INTC",  name: "Intel Corp.",            type: "Stock",     basePrice: 30.50,  color: "#6366f1" },
  { symbol: "KO",    name: "Coca-Cola Company",      type: "Stock",     basePrice: 62.40,  color: "#6366f1" },
  { symbol: "PEP",   name: "PepsiCo Inc.",           type: "Stock",     basePrice: 168.20, color: "#6366f1" },
  { symbol: "PG",    name: "Procter & Gamble Co.",   type: "Stock",     basePrice: 162.80, color: "#6366f1" },
  { symbol: "CVX",   name: "Chevron Corp.",          type: "Stock",     basePrice: 154.60, color: "#6366f1" },
  { symbol: "LLY",   name: "Eli Lilly & Co.",        type: "Stock",     basePrice: 780.40, color: "#6366f1" },
  { symbol: "COST",  name: "Costco Wholesale Corp.", type: "Stock",     basePrice: 725.10, color: "#6366f1" },
  // ── Crypto ───────────────────────────────────────────────────────────────────
  { symbol: "BTC",   name: "Bitcoin",                type: "Crypto",    basePrice: 67234,  color: "#f59e0b" },
  { symbol: "ETH",   name: "Ethereum",               type: "Crypto",    basePrice: 3542,   color: "#f59e0b" },
  { symbol: "SOL",   name: "Solana",                 type: "Crypto",    basePrice: 168.40, color: "#f59e0b" },
  { symbol: "BNB",   name: "BNB",                    type: "Crypto",    basePrice: 582.40, color: "#f59e0b" },
  { symbol: "XRP",   name: "XRP",                    type: "Crypto",    basePrice: 0.524,  color: "#f59e0b" },
  { symbol: "ADA",   name: "Cardano",                type: "Crypto",    basePrice: 0.448,  color: "#f59e0b" },
  { symbol: "AVAX",  name: "Avalanche",              type: "Crypto",    basePrice: 36.80,  color: "#f59e0b" },
  { symbol: "DOGE",  name: "Dogecoin",               type: "Crypto",    basePrice: 0.162,  color: "#f59e0b" },
  { symbol: "LINK",  name: "Chainlink",              type: "Crypto",    basePrice: 14.24,  color: "#f59e0b" },
  // ── Indices ──────────────────────────────────────────────────────────────────
  { symbol: "SPX",   name: "S&P 500 Index",          type: "Index",     basePrice: 5487,   color: "#22d3ee" },
  { symbol: "NDX",   name: "Nasdaq 100 Index",       type: "Index",     basePrice: 19876,  color: "#22d3ee" },
  { symbol: "DJI",   name: "Dow Jones Ind. Avg.",    type: "Index",     basePrice: 43218,  color: "#22d3ee" },
  { symbol: "FTSE",  name: "FTSE 100 Index",         type: "Index",     basePrice: 8143,   color: "#22d3ee" },
  { symbol: "DAX",   name: "DAX 40 Index",           type: "Index",     basePrice: 18234,  color: "#22d3ee" },
  { symbol: "NKY",   name: "Nikkei 225 Index",       type: "Index",     basePrice: 39847,  color: "#22d3ee" },
  { symbol: "HSI",   name: "Hang Seng Index",        type: "Index",     basePrice: 18342,  color: "#22d3ee" },
  { symbol: "VIX",   name: "CBOE Volatility Index",  type: "Index",     basePrice: 14.32,  color: "#22d3ee" },
  // ── Forex ─────────────────────────────────────────────────────────────────
  { symbol: "EURUSD",name: "Euro / US Dollar",       type: "Forex",     basePrice: 1.0842, color: "#a78bfa" },
  { symbol: "GBPUSD",name: "British Pound / USD",    type: "Forex",     basePrice: 1.2685, color: "#a78bfa" },
  { symbol: "USDJPY",name: "USD / Japanese Yen",     type: "Forex",     basePrice: 151.24, color: "#a78bfa" },
  { symbol: "AUDUSD",name: "Australian Dollar / USD",type: "Forex",     basePrice: 0.6524, color: "#a78bfa" },
  { symbol: "USDCAD",name: "USD / Canadian Dollar",  type: "Forex",     basePrice: 1.3648, color: "#a78bfa" },
  { symbol: "USDCHF",name: "USD / Swiss Franc",      type: "Forex",     basePrice: 0.8924, color: "#a78bfa" },
  { symbol: "NZDUSD",name: "NZ Dollar / USD",        type: "Forex",     basePrice: 0.6012, color: "#a78bfa" },
  { symbol: "EURGBP",name: "Euro / British Pound",   type: "Forex",     basePrice: 0.8548, color: "#a78bfa" },
  { symbol: "XAUUSD",name: "Gold / USD (Spot)",      type: "Forex",     basePrice: 2387,   color: "#a78bfa" },
  // ── Commodities ──────────────────────────────────────────────────────────────
  { symbol: "GOLD",  name: "Gold Futures",           type: "Commodity", basePrice: 2387,   color: "#fbbf24" },
  { symbol: "OIL",   name: "Crude Oil (WTI)",        type: "Commodity", basePrice: 78.42,  color: "#fbbf24" },
  { symbol: "BRENT", name: "Brent Crude Oil",        type: "Commodity", basePrice: 82.64,  color: "#fbbf24" },
  { symbol: "SILVER",name: "Silver Futures",         type: "Commodity", basePrice: 28.48,  color: "#fbbf24" },
  { symbol: "NG",    name: "Natural Gas Futures",    type: "Commodity", basePrice: 2.684,  color: "#fbbf24" },
  { symbol: "COPPER",name: "Copper Futures",         type: "Commodity", basePrice: 4.424,  color: "#fbbf24" },
  { symbol: "WHEAT", name: "Wheat Futures",          type: "Commodity", basePrice: 572.4,  color: "#fbbf24" },
  { symbol: "CORN",  name: "Corn Futures",           type: "Commodity", basePrice: 448.0,  color: "#fbbf24" },
  { symbol: "COFFEE",name: "Coffee Futures",         type: "Commodity", basePrice: 2.24,   color: "#fbbf24" },
  { symbol: "COCOA", name: "Cocoa Futures",          type: "Commodity", basePrice: 9820.0, color: "#fbbf24" },
  { symbol: "SUGAR", name: "Sugar Futures",          type: "Commodity", basePrice: 0.1870, color: "#fbbf24" },
  { symbol: "COTTON",name: "Cotton Futures",         type: "Commodity", basePrice: 0.7320, color: "#fbbf24" },
  { symbol: "PLATINUM",name: "Platinum Futures",     type: "Commodity", basePrice: 985.40, color: "#fbbf24" },
  { symbol: "GASOLINE",name: "RBOB Gasoline Futures",type: "Commodity", basePrice: 2.45,   color: "#fbbf24" },
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
  const assetVol = { Stock:0.012, Crypto:0.035, Index:0.008, Forex:0.003, Commodity:0.015 };
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
