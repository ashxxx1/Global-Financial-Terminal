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

export const countryStats = {
  US: {
    gdp: "25.4",
    inflation: "3.2",
    rate: "5.50",
    currency: "104.50", // DXY
    riskScore: 28,
    companies: [
      { name: "Apple Inc.", returns: { "1D": 1.2, "1W": 2.4, "1M": 5.6 } },
      { name: "Microsoft", returns: { "1D": 0.8, "1W": -1.2, "1M": 3.4 } },
      { name: "JPMorgan", returns: { "1D": -0.5, "1W": 1.1, "1M": 2.2 } }
    ],
    aiAnalysis: "Strong AI investments driving tech sector. Inflation remains sticky, implying rates will remain higher for longer. Consumer spending holding up despite tighter financial conditions.",
    marketReturns: { "1D": 1.2, "1W": -0.5, "1M": 2.1 }
  },
  CN: {
    gdp: "17.9",
    inflation: "-0.8",
    rate: "3.45",
    currency: "7.24", // USD/CNY
    riskScore: 65,
    companies: [
      { name: "Tencent", returns: { "1D": 2.1, "1W": -3.4, "1M": 1.2 } },
      { name: "Alibaba", returns: { "1D": 1.5, "1W": -2.1, "1M": -5.6 } },
      { name: "ICBC", returns: { "1D": 0.2, "1W": 0.5, "1M": 1.1 } }
    ],
    aiAnalysis: "Deflationary pressures persisting. PBOC maintaining accommodative stance. Property sector restructuring continues to drag on broader growth outlook.",
    marketReturns: { "1D": 1.5, "1W": -2.8, "1M": -1.4 }
  },
  JP: {
    gdp: "4.2",
    inflation: "2.8",
    rate: "0.10",
    currency: "151.20", // USD/JPY
    riskScore: 15,
    companies: [
      { name: "Toyota", returns: { "1D": -1.2, "1W": 4.5, "1M": 8.2 } },
      { name: "Sony", returns: { "1D": 0.5, "1W": 2.1, "1M": -1.4 } },
      { name: "Mitsubishi UFJ", returns: { "1D": 1.8, "1W": 5.6, "1M": 12.4 } }
    ],
    aiAnalysis: "Historic shift in monetary policy underway. Yield curve control adjustments expected to continue. Weak Yen supporting export earnings significantly.",
    marketReturns: { "1D": -0.8, "1W": 3.2, "1M": 5.4 }
  },
  DE: {
    gdp: "4.0",
    inflation: "2.4",
    rate: "4.50",
    currency: "1.08", // EUR/USD
    riskScore: 22,
    companies: [
      { name: "SAP SE", returns: { "1D": 1.4, "1W": 2.8, "1M": 6.5 } },
      { name: "Siemens", returns: { "1D": -0.6, "1W": -1.2, "1M": 0.8 } },
      { name: "Allianz", returns: { "1D": 0.2, "1W": 1.5, "1M": 3.2 } }
    ],
    aiAnalysis: "Industrial sector facing prolonged weakness from energy transition costs. Services sector remains resilient. ECB rate cut expectations heavily weighted.",
    marketReturns: { "1D": -0.4, "1W": 1.2, "1M": 2.8 }
  },
  GB: {
    gdp: "3.1",
    inflation: "3.4",
    rate: "5.25",
    currency: "1.26", // GBP/USD
    riskScore: 30,
    companies: [
      { name: "AstraZeneca", returns: { "1D": -1.5, "1W": -2.4, "1M": -4.2 } },
      { name: "HSBC", returns: { "1D": 0.8, "1W": 2.1, "1M": 4.5 } },
      { name: "Shell", returns: { "1D": 1.2, "1W": 3.5, "1M": 5.2 } }
    ],
    aiAnalysis: "Labor market showing signs of cooling. Bank of England adopting a cautious approach to policy easing. Fiscal headroom remains highly constrained.",
    marketReturns: { "1D": 0.2, "1W": -1.1, "1M": 1.8 }
  },
  IN: {
    gdp: "3.4",
    inflation: "5.1",
    rate: "6.50",
    currency: "83.15", // USD/INR
    riskScore: 42,
    companies: [
      { name: "Reliance", returns: { "1D": 1.8, "1W": 4.2, "1M": 8.5 } },
      { name: "TCS", returns: { "1D": 0.5, "1W": -1.2, "1M": 2.4 } },
      { name: "HDFC Bank", returns: { "1D": -0.4, "1W": 1.8, "1M": 3.2 } }
    ],
    aiAnalysis: "Strong sustained domestic demand matrix. Capital expenditure cycles extending. FDI inflows stabilizing amidst global supply chain relocations.",
    marketReturns: { "1D": 1.4, "1W": 2.8, "1M": 6.5 }
  }
};

const _seed = (str) => { let h=0; for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0; return h; };
const _rnd = (str, seedOffset) => { const s=Math.sin(_seed(str)+seedOffset)*10000; return s-Math.floor(s); };

export function getCountryStats(iso) {
  if (countryStats[iso]) return countryStats[iso];
  
  // Deterministic fallback for unknown ISOs
  const riskScore = Math.floor(_rnd(iso, 5) * 100);
  const mockScore = Math.floor(_rnd(iso, 8) * 3);
  
  return {
    gdp: (_rnd(iso, 1) * 5 + 0.1).toFixed(1),
    inflation: (_rnd(iso, 2) * 15 - 2).toFixed(1),
    rate: (Math.max(0, _rnd(iso, 3) * 12)).toFixed(2),
    currency: (1 + _rnd(iso, 4) * 50).toFixed(2),
    riskScore,
    companies: [
      { name: "National Bank", returns: { "1D": _rnd(iso, 10)*4-2, "1W": _rnd(iso, 11)*10-5, "1M": _rnd(iso, 12)*20-10 } },
      { name: "State Telecom", returns: { "1D": _rnd(iso, 13)*4-2, "1W": _rnd(iso, 14)*10-5, "1M": _rnd(iso, 15)*20-10 } },
      { name: "Energy Corp", returns: { "1D": _rnd(iso, 16)*4-2, "1W": _rnd(iso, 17)*10-5, "1M": _rnd(iso, 18)*20-10 } }
    ],
    aiAnalysis: `AI models predicting a ${mockScore === 2 ? 'bullish' : mockScore === 0 ? 'bearish' : 'neutral'} baseline trend over 6 months. Sub-sector rotation expected.`,
    marketReturns: {
      "1D": _rnd(iso, 20)*4-2,
      "1W": _rnd(iso, 21)*10-5,
      "1M": _rnd(iso, 22)*20-10
    }
  };
}
