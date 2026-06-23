// ─── AI Narrative Data ─────────────────────────────────────────────────────────
// Keyed by country code + sentiment → realistic market intelligence narratives

const NARRATIVES = {
  US: {
    bullish: [
      "Federal Reserve's pivot signals are resonating across risk assets — the S&P 500 is pricing in a soft landing scenario with above-trend corporate earnings growth. Technology and AI infrastructure spending remain the primary earnings driver, with semiconductor names leading sector rotation. Institutional flows into U.S. equities remain robust at $2.4bn weekly average.",
      "Strong labor market resilience is supporting consumer discretionary while disinflation continues in core goods. The Fed is threading the needle — markets now assign 72% probability to a September rate cut. Yield curve steepening is historically bullish for financials, setting up a potential sector rotation catalyst.",
    ],
    bearish: [
      "Persistent core inflation above the Fed's 2% target is delaying the rate cut timeline, pressuring rate-sensitive sectors. Credit spreads are widening in high-yield markets — a leading indicator of risk-off positioning. Earnings revision breadth is narrowing, with 60% of S&P 500 companies missing Q1 revenue estimates.",
      "Dollar strength is creating a headwind for S&P 500 multinationals with significant foreign revenue exposure. The yield curve remains inverted, historically predicting a 70% probability of recession within 18 months. Retail investor sentiment has turned cautious, with equity fund outflows accelerating for the third consecutive week.",
    ],
    neutral: [
      "U.S. markets are in a consolidation phase as mixed economic signals create a data-dependent Fed environment. Earnings quality is diverging sharply — mega-cap tech continues to beat, while small and mid-cap companies face margin pressure from elevated input costs. The VIX at 14 suggests complacency, which historically precedes volatility events.",
    ],
  },
  CN: {
    bullish: [
      "China's policy stimulus package is beginning to transmit into real economic activity — property sales volumes in tier-1 cities rose 8% month-on-month. The PBOC's liquidity injection is supporting credit growth, with M2 money supply expanding at 9.5% annually. Export competitiveness remains strong due to yuan depreciation, benefiting manufacturing-heavy indices.",
      "Beijing's strategic pivot toward advanced manufacturing and domestic consumption is gaining traction. EV adoption is accelerating, with monthly sales exceeding 1 million units — a structural demand driver for lithium and battery supply chains. Technology sector restrictions appear to be stabilizing, reducing regulatory overhang on tech equities.",
    ],
    bearish: [
      "China's property sector deleveraging continues to weigh on domestic demand, with secondary market home prices declining for the 18th consecutive month. Local government financing vehicle (LGFV) debt stress is creating contingent liability risks for regional banks. Deflationary pressures — with CPI running at -0.3% — are structurally problematic for corporate earnings.",
      "Capital outflows are accelerating as foreign institutional investors reduce China exposure amid geopolitical tensions and weak economic momentum. The yuan is testing PBOC intervention thresholds near 7.30, signaling currency pressure. Youth unemployment above 15% is a structural consumption drag that fiscal stimulus is struggling to address.",
    ],
    neutral: [
      "Chinese equities remain range-bound as stimulus measures offset structural headwinds — the policy put is real but insufficient for a sustainable re-rating. Export strength is countered by weak domestic consumption, creating an unbalanced recovery. Global investors are maintaining underweight China positioning despite attractive valuations.",
    ],
  },
  JP: {
    bullish: [
      "Bank of Japan's gradual normalization is being received positively by domestic financials — Japanese banks are benefiting from the first positive interest rate environment in decades. Corporate governance reforms are unlocking value, with share buybacks hitting record levels. The weak yen is creating exceptional export competitiveness for Toyota, Sony, and Keyence.",
      "Japan's Nikkei is benefiting from a global investor rotation into undervalued developed market equities. Warren Buffett's continued accumulation of Japanese trading houses has catalyzed institutional interest. The return of wage growth above 3% is beginning to create a domestic demand tailwind after decades of stagnation.",
    ],
    bearish: [
      "BOJ policy normalization risks triggering a yen carry trade unwind — an estimated $4 trillion in carry positions could unwind rapidly if USD/JPY breaks below 140. Japan's aging demographics create structural demand weakness that even corporate governance reforms cannot fully offset. Import cost inflation is compressing margins for domestic consumption companies.",
    ],
    neutral: [
      "Japanese equities are at a pivotal juncture — BOJ policy normalization timing is the critical variable. A hawkish surprise would strengthen the yen but pressure export earners; dovish continuation keeps the carry trade intact. Corporate reform momentum is real but unevenly distributed across sectors.",
    ],
  },
  DE: {
    bearish: [
      "Germany's industrial recession deepens as energy-intensive manufacturing faces structural cost disadvantages post-energy crisis. Automotive sector disruption is accelerating — German OEMs lost significant EV market share to Chinese competitors in 2025. Export slowdown to China, Germany's largest trading partner, is creating a demand vacuum.",
      "The Ifo Business Climate Index is at multi-year lows, signaling continued contraction in Europe's largest economy. Fiscal constraints under the constitutional debt brake limit the government's ability to deliver counter-cyclical stimulus. German 10-year Bund yields at 2.8% are creating headwinds for highly-leveraged corporates.",
    ],
    neutral: [
      "Germany is navigating a painful but potentially necessary industrial restructuring. Green energy investment is creating new growth vectors even as legacy manufacturing shrinks. The ECB rate path will be the key catalyst — any earlier-than-expected cuts would provide meaningful relief to the housing and construction sectors.",
    ],
    bullish: [
      "German engineering excellence is finding new applications in the AI infrastructure buildout — industrial automation companies are benefiting from reshoring trends in the U.S. and Europe. Defense spending increases from NATO commitments are creating a structural demand tailwind for Rheinmetall and the broader defense-industrial complex.",
    ],
  },
  GB: {
    bearish: [
      "UK stagflation dynamics are persisting — services inflation at 5.7% is preventing the Bank of England from cutting rates despite weakening growth. The housing market is under significant pressure with affordability metrics at record lows. Sterling weakness is exacerbating import cost pressures.",
    ],
    bullish: [
      "UK equities trade at significant discounts to global peers on price-to-book metrics, attracting activist investors and M&A interest. The financial services sector — particularly London's asset management hub — remains globally competitive. FTSE 100 dividend yields averaging 3.9% provide attractive income versus gilts.",
    ],
    neutral: [
      "UK markets are balancing Brexit-related structural headwinds against attractive valuations. The services sector remains resilient while manufacturing contracts. BoE rate cuts are on the horizon but priced cautiously, supporting sterling at current levels.",
    ],
  },
  IN: {
    bullish: [
      "India's economic transformation is accelerating — the world's most populous nation is at an early stage of a credit, consumption, and infrastructure supercycle. Digital public infrastructure (UPI, Aadhaar) is enabling financial inclusion at scale, creating massive addressable markets. PLI scheme investments are building domestic manufacturing capacity in electronics, pharma, and renewables.",
      "The Nifty 50 is supported by strong domestic institutional investor (DII) flows — Indian mutual fund SIP contributions hit ₹21,000 crore monthly. Consumer confidence is at multi-year highs driven by rising wages and a growing middle class. India's demographic dividend — median age 28 — contrasts sharply with aging developed market economies.",
    ],
    neutral: [
      "Indian equities offer compelling long-term growth but trade at premium valuations relative to EM peers. Nifty at 22x forward earnings requires continued strong earnings delivery. Near-term risks include monsoon volatility and oil price sensitivity — India imports 85% of its crude oil needs.",
    ],
    bearish: [
      "Indian small and mid-cap valuations are stretched after a multi-year bull run. Regulatory tightening on F&O speculation is reducing market liquidity. Corporate capex cycle may be peaking — order book growth is decelerating in capital goods companies. FII outflows intensifying as dollar strengthens.",
    ],
  },
  BR: {
    bearish: [
      "Brazil's fiscal situation remains precarious — primary deficit concerns are keeping the Central Bank hawkish with rates at 13.75%. Political uncertainty around fiscal policy credibility is weighing on long-term bonds. The Real has underperformed EM peers due to weak fiscal credibility signal.",
    ],
    bullish: [
      "Brazil is a commodity supercycle beneficiary — Petrobras, Vale, and agricultural exporters are generating record free cash flow. The current account surplus is improving on strong agri exports. Lula's consumption-focused fiscal policies are supporting domestic demand even as they create fiscal concerns.",
    ],
    neutral: [
      "Brazil presents a classic EM dilemma — exceptional commodity asset base versus fiscal and political uncertainty. The carry trade (high interest rates) attracts EM-dedicated funds but currency risk is substantial. Neutral positioning with tactical long energy on oil price uptick.",
    ],
  },
  AU: {
    bullish: [
      "Australia's commodity export base positions it uniquely in the global supply chain — iron ore demand from India's infrastructure boom is offsetting China slowdown. The RBA's cautious easing cycle is supportive of domestic housing. Banks maintain strong capital ratios and attractive dividend yields above 5%.",
    ],
    neutral: [
      "Australian equities trade at fair value with materials and financials offsetting each other. The economy is navigating a household debt overhang while benefiting from strong commodity terms of trade. RBA policy divergence from the Fed creates moderate AUD uncertainty.",
    ],
    bearish: [
      "Australia's housing market is under pressure from sustained high rates — mortgage stress is rising with 30% of variable rate mortgages facing negative cash flow. China demand slowdown is creating a structural headwind for iron ore prices, directly impacting the materials sector that represents 30% of ASX 200.",
    ],
  },
  KR: {
    bullish: [
      "South Korea's semiconductor cycle is turning — Samsung and SK Hynix are entering a margin expansion phase as HBM (High Bandwidth Memory) demand from AI accelerators surges. Memory pricing is recovering from cyclical lows. KOSPI trades at a significant discount to regional peers — 'Korea discount' is narrowing via corporate governance reform.",
    ],
    neutral: [
      "Korea is a leveraged play on global semiconductor demand — bullish on AI, but vulnerable to memory cycle volatility. Export concentration in chips, autos, and displays creates correlation risk. Political stability concerns are a modest overhang on foreign institutional sentiment.",
    ],
    bearish: [
      "DRAM oversupply is weighing on margins despite AI-related HBM demand. Korean corporate governance issues — cross-shareholding structures, low ROE — continue to suppress valuations. North Korea geopolitical risk premium cannot be ignored for foreign investors.",
    ],
  },
};

export function generateNarrative(countryCode, sentiment) {
  const countryNarratives = NARRATIVES[countryCode];
  if (!countryNarratives) {
    // Generic fallback
    return generateGenericNarrative(countryCode, sentiment);
  }
  const pool = countryNarratives[sentiment] || countryNarratives.neutral || [];
  if (!pool.length) return generateGenericNarrative(countryCode, sentiment);
  // Deterministically pick based on date to vary daily
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
}

function generateGenericNarrative(countryCode, sentiment) {
  const sentimentMap = {
    bullish: `${countryCode} equity markets are showing positive momentum driven by improving macroeconomic fundamentals and strong institutional inflows. Key sectors are outperforming regional benchmarks, with earnings guidance being revised upward. Technical indicators suggest continued upside momentum in the near-term.`,
    bearish: `${countryCode} markets are facing headwinds from a combination of tightening financial conditions and slowing economic growth. Earnings revisions are turning negative as margin pressure intensifies. Institutional outflows and currency weakness are compounding the bearish setup. Risk management protocols suggest reducing exposure.`,
    neutral: `${countryCode} markets are range-bound as bulls and bears battle over key technical levels. Mixed economic data is creating uncertainty about the central bank's next move. A catalyst is needed to break the current consolidation — watch upcoming economic data releases for direction.`,
  };
  return sentimentMap[sentiment] || sentimentMap.neutral;
}

export const STOCK_NARRATIVES = {
  bullish: [
    "Technical momentum is strongly bullish — price action above all major moving averages with increasing volume on up-days confirming institutional accumulation. RSI at 62 suggests room to run before overbought territory. Options market showing elevated call buying in near-term strikes.",
    "Fundamental catalysts are aligning: recent earnings beat consensus by 12%, management raised full-year guidance, and analyst price target upgrades are accelerating. The stock is at the beginning of an earnings revision cycle that historically produces the strongest returns.",
  ],
  bearish: [
    "Technical breakdown is confirmed — price has decisively closed below the 200-day moving average on elevated volume. Options market is showing elevated put buying across multiple expiries, suggesting institutional hedging. Support at current levels is weak; next major support is 12-15% lower.",
    "Fundamentals are deteriorating: gross margin compression of 280bps versus prior year, rising customer acquisition costs, and increasing competitive pressure are creating a negative earnings revision cycle. Management guidance was vague on the path to margin recovery.",
  ],
  neutral: [
    "Stock is consolidating at key technical support after a 15% correction from highs. Valuation has de-rated from premium to fair value on a forward earnings basis. Waiting for a catalyst — either a macro shift or company-specific event — before taking a directional position.",
  ],
};

export function generateStockNarrative(stock) {
  const sentiment = stock.changePct >= 1 ? "bullish" : stock.changePct <= -1 ? "bearish" : "neutral";
  const pool = STOCK_NARRATIVES[sentiment];
  const idx = stock.symbol.charCodeAt(0) % pool.length;
  return pool[idx];
}
