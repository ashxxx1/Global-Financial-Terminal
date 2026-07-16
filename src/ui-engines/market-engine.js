// Deterministic synthetic market-data generator.
// All figures are SIMULATED for demo purposes — not real market data.
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CURRENCIES = { "United States":"USD","United Kingdom":"GBP","Japan":"JPY","China":"CNY","Germany":"EUR","France":"EUR","India":"INR","Brazil":"BRL","Canada":"CAD","Australia":"AUD","Switzerland":"CHF","Russia":"RUB","South Korea":"KRW","Mexico":"MXN","Singapore":"SGD" };
const INDEX_NAMES = { "United States":"S&P Synth 500","United Kingdom":"FTSE Horizon","Japan":"Nikkei Pulse","China":"Shanghai Vector","Germany":"DAX Meridian","India":"Sensex Nova","Brazil":"Bovespa Aurora","Canada":"TSX Arc","Australia":"ASX Compass","France":"CAC Lumen" };

const HEADLINE_TEMPLATES = [
  "Central bank signals {rate} on policy rate amid {mood} outlook",
  "{sector} stocks lead {direction} as investors weigh growth data",
  "Currency desks watch {code} after {mood} trade balance report",
  "Sovereign bond yields {direction2} on inflation print",
  "Foreign inflows {direction3} into {name} equities this session",
  "Manufacturing PMI {mood2} expectations, lifting risk sentiment",
  "{name} finance ministry unveils fiscal outlook for next quarter",
  "Regional markets react to {name} export data surprise",
];
const SECTORS = ["Energy","Tech","Financials","Industrials","Consumer","Materials","Healthcare"];
const MOODS = ["a cautious","an upbeat","a mixed","a resilient","a fragile"];
const MOODS2 = ["beats","misses","matches"];
const DIRS = ["gains","losses","a rally","a pullback"];
const DIRS2 = ["tighten","ease","hold steady"];
const DIRS3 = ["accelerate","slow","reverse"];
const RATE_WORDS = ["a hold","a hike","a cut","no change"];

export function getCountryMarket(country) {
  const rnd = mulberry32(hashStr(country.name));
  const change = (rnd() * 5.2 - 2.4);
  const indexBase = 800 + rnd() * 24000;
  const fxRate = (0.4 + rnd() * 3.2);
  const fxChange = (rnd() * 2.4 - 1.2);
  const gdp = (0.3 + rnd() * 6.5);
  const rate = (0.25 + rnd() * 9);
  const inflation = (0.5 + rnd() * 12);
  const code = CURRENCIES[country.name] || (country.name.slice(0,3).toUpperCase());
  const indexName = INDEX_NAMES[country.name] || (country.name + " Composite");

  const series = [];
  let v = indexBase;
  const trend = change / 100;
  for (let i = 0; i < 24; i++) {
    v = v * (1 + trend/24 + (rnd()-0.5) * 0.006);
    series.push(v);
  }

  const headlines = [];
  for (let i = 0; i < 3; i++) {
    const t = HEADLINE_TEMPLATES[Math.floor(rnd() * HEADLINE_TEMPLATES.length)];
    headlines.push(t
      .replace("{name}", country.name)
      .replace("{code}", code)
      .replace("{sector}", SECTORS[Math.floor(rnd()*SECTORS.length)])
      .replace("{mood}", MOODS[Math.floor(rnd()*MOODS.length)])
      .replace("{mood2}", MOODS2[Math.floor(rnd()*MOODS2.length)])
      .replace("{direction}", DIRS[Math.floor(rnd()*DIRS.length)])
      .replace("{direction2}", DIRS2[Math.floor(rnd()*DIRS2.length)])
      .replace("{direction3}", DIRS3[Math.floor(rnd()*DIRS3.length)])
      .replace("{rate}", RATE_WORDS[Math.floor(rnd()*RATE_WORDS.length)])
    );
  }

  return {
    name: country.name, region: country.region,
    indexName, indexValue: indexBase, change,
    currencyCode: code, fxRate, fxChange,
    gdp, rate, inflation, series, headlines,
    minutesAgo: 1 + Math.floor(rnd()*58),
  };
}

// ---------------------------------------------------------------------------
// Country Intelligence Dashboard data — ALL SIMULATED (deterministic per
// country name). This mirrors the shape a real News API / market-data API /
// LLM-analysis endpoint would return, so a real backend can be swapped in
// without changing the UI. Nothing here is live or fact-checked.
// ---------------------------------------------------------------------------
const SECTOR_LIST = ["Technology","Financials","Energy","Industrials","Healthcare","Consumer","Utilities","Materials"];
const CREDIT_RATINGS = ["AAA","AA+","AA","AA-","A+","A","A-","BBB+","BBB","BBB-","BB+","BB","B+"];
const STANCES = ["bullish","bearish","neutral"];
const SECTOR_TICKER_ROOTS = { Technology:"TEK", Financials:"FIN", Energy:"NRG", Industrials:"IND", Healthcare:"HLT", Consumer:"CNS", Utilities:"UTL", Materials:"MAT" };

function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

export function getCountryIntel(country, market) {
  const rnd = mulberry32(hashStr(country.name + ":intel"));
  const lon = country.lon;

  // Local time from longitude (~15°/hr) — approximate, not DST-aware.
  const utcOffsetHours = Math.round(lon / 15);
  const now = new Date();
  const localMs = now.getTime() + now.getTimezoneOffset() * 60000 + utcOffsetHours * 3600000;
  const local = new Date(localMs);
  const localHour = local.getUTCHours();
  const localMin = local.getUTCMinutes();
  const marketOpen = localHour >= 9 && localHour < 16;

  // Sectors — pick 6 of 8, deterministic daily moves
  const sectors = SECTOR_LIST.slice().sort(() => rnd() - 0.5).slice(0, 6).map(name => ({
    name, change: (rnd() * 6 - 2.8),
  })).sort((a,b) => b.change - a.change);

  // Movers — synthetic tickers built from country code + sector, clearly fictional
  const cc = (country.name.slice(0,2)).toUpperCase();
  function makeMover(dir) {
    const sector = pick(rnd, SECTOR_LIST);
    const root = SECTOR_TICKER_ROOTS[sector] || "GEN";
    const ticker = cc + root + (1 + Math.floor(rnd() * 9));
    const price = 8 + rnd() * 480;
    const change = dir === 'gain' ? (0.8 + rnd() * 8.5) : -(0.8 + rnd() * 8.5);
    const cap = 0.3 + rnd() * 240;
    return { ticker, name: sector + " " + (dir === 'gain' ? "Holdings" : "Group") + " " + ticker.slice(-1), sector, price, change, capB: cap };
  }
  const gainers = [0,0,0].map(() => makeMover('gain')).sort((a,b) => b.change - a.change);
  const losers = [0,0,0].map(() => makeMover('lose')).sort((a,b) => a.change - b.change);

  // Economic snapshot extras beyond getCountryMarket()
  const unemployment = 2 + rnd() * 11;
  const govDebtPctGdp = 20 + rnd() * 110;
  const creditRating = pick(rnd, CREDIT_RATINGS);

  // AI-style analysis per headline (template-generated, not a real model call)
  const aiAnalyses = (market.headlines || []).map(headline => {
    const stance = pick(rnd, STANCES);
    const confidence = 55 + Math.round(rnd() * 40);
    const industries = SECTOR_LIST.slice().sort(() => rnd()-0.5).slice(0, 2);
    const benef = gainers[Math.floor(rnd()*gainers.length)];
    const hurt = losers[Math.floor(rnd()*losers.length)];
    return {
      headline, stance, confidence,
      why: stance === 'bullish'
        ? `Signals improving conditions for ${industries[0].toLowerCase()} exposure; positioning has room to add risk.`
        : stance === 'bearish'
        ? `Raises near-term risk for ${industries[0].toLowerCase()} names; desks likely trim exposure into the print.`
        : `Directionally ambiguous — desks are more likely to wait for confirming data than react immediately.`,
      industries,
      benefits: benef ? [benef.name] : [],
      hurts: hurt ? [hurt.name] : [],
      shortTerm: stance === 'bullish' ? "Modest upside into next session" : stance === 'bearish' ? "Pressure likely into next session" : "Range-bound",
      longTerm: stance === 'bullish' ? "Supportive if follow-through data confirms" : stance === 'bearish' ? "Watch for confirmation before repricing further" : "Limited standalone effect",
    };
  });

  const sentimentScore = sectors.reduce((s,x) => s + x.change, 0) / sectors.length + (market.change || 0) * 0.4;
  const overallLabel = sentimentScore > 2 ? "Very Bullish" : sentimentScore > 0.5 ? "Bullish" : sentimentScore > -0.5 ? "Neutral" : sentimentScore > -2 ? "Bearish" : "Very Bearish";

  return {
    localTimeStr: String(localHour).padStart(2,'0') + ':' + String(localMin).padStart(2,'0'),
    marketOpen,
    sectors, gainers, losers,
    unemployment, govDebtPctGdp, creditRating,
    aiAnalyses,
    overallSentiment: { label: overallLabel, confidence: 60 + Math.round(rnd()*30), blurb: `Synthesized from sector breadth (${sectors[0].name} leading) and index momentum.` },
    marketNarrative: `${market.name}'s ${market.indexName} is ${market.change >= 0 ? 'higher' : 'lower'} on the session, tracking ${sectors[0].change >= 0 ? 'strength' : 'weakness'} in ${sectors[0].name.toLowerCase()} against a backdrop of ${market.inflation > 5 ? 'elevated' : 'contained'} inflation readings.`,
  };
}

const INDUSTRY_POOL = ["Fintech","Renewable Energy","Advanced Manufacturing","Logistics & Ports","Biotech","Semiconductors","Agritech","Tourism & Hospitality","Digital Infrastructure","Mining & Metals"];
const TRADE_PARTNER_POOL = ["United States","China","Germany","Japan","United Kingdom","India","South Korea","Singapore","United Arab Emirates","Brazil","France","Netherlands"];

export function getInvestmentOutlook(country) {
  const rnd = mulberry32(hashStr(country.name + ":invest"));
  const industries = INDUSTRY_POOL.slice().sort(() => rnd() - 0.5).slice(0, 3);
  const fdiBillions = 0.4 + rnd() * 60;
  const easeRank = 1 + Math.floor(rnd() * 190);
  const opportunities = [
    `${industries[0]} infrastructure expansion attracting early-stage capital`,
    `Policy incentives broadening access for foreign operators in ${industries[1].toLowerCase()}`,
    `Rising domestic demand supporting ${industries[2].toLowerCase()} margins`,
  ];
  const trend = rnd() > 0.5 ? "accelerating" : "stabilizing";
  return { industries, fdiBillions, easeRank, opportunities, trend };
}

export function getTradePartners(country) {
  const rnd = mulberry32(hashStr(country.name + ":trade"));
  const pool = TRADE_PARTNER_POOL.filter(p => p !== country.name);
  const shuffled = pool.slice().sort(() => rnd() - 0.5);
  const exportPartners = shuffled.slice(0, 4).map(name => ({ name, pct: 8 + rnd() * 22 })).sort((a,b) => b.pct - a.pct);
  const importPartners = shuffled.slice(4, 8).map(name => ({ name, pct: 8 + rnd() * 22 })).sort((a,b) => b.pct - a.pct);
  const industries = INDUSTRY_POOL.slice().sort(() => rnd() - 0.5).slice(0, 3);
  return { exportPartners, importPartners, keyIndustries: industries };
}

export function getRelatedCountries(country, allCountries) {
  const rnd = mulberry32(hashStr(country.name + ":related"));
  const sameRegion = allCountries.filter(c => c.region === country.region && c.name !== country.name);
  const pool = sameRegion.length >= 3 ? sameRegion : allCountries.filter(c => c.name !== country.name);
  return pool.slice().sort(() => rnd() - 0.5).slice(0, 4);
}

const GLOBAL_TEMPLATES = [
  "Global risk sentiment {a} as traders parse central bank commentary",
  "Cross-asset volatility {b} into the close across major hubs",
  "Commodities {c} as supply data lands ahead of schedule",
  "Overnight desks flag thin liquidity across {region} sessions",
  "Sovereign curves {d} following coordinated data releases",
  "Flows rotate toward {region} as yield differentials shift",
];
export function getGlobalHeadlines(n, regions) {
  const rnd = mulberry32(1337);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = GLOBAL_TEMPLATES[Math.floor(rnd()*GLOBAL_TEMPLATES.length)];
    out.push(t
      .replace("{a}", ["improves","softens","holds firm","turns cautious"][Math.floor(rnd()*4)])
      .replace("{b}", ["eases","builds","stabilizes"][Math.floor(rnd()*3)])
      .replace("{c}", ["drift higher","slip lower","hold range"][Math.floor(rnd()*3)])
      .replace("{d}", ["steepen","flatten","hold steady"][Math.floor(rnd()*3)])
      .replace(/{region}/g, regions[Math.floor(rnd()*regions.length)])
    );
  }
  return out;
}
