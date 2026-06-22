// ─── Local Geopolitical News Data ────────────────────────────────────────────────
// Pre-seeded local news outlets and recent headlines for major countries.
// Each country is connected to 10 prominent local news channels.

export const LOCAL_NEWS_OUTLETS = {
  US: [
    { name: "CNBC", weight: "Major", focus: "Financial Markets" },
    { name: "Bloomberg US", weight: "Major", focus: "Macro Economics" },
    { name: "Reuters US", weight: "Major", focus: "International News" },
    { name: "WSJ", weight: "Major", focus: "Business Policy" },
    { name: "FT US", weight: "High", focus: "Global Trade" },
    { name: "AP News", weight: "Medium", focus: "General Politics" },
    { name: "NYT Business", weight: "High", focus: "Socio-Economics" },
    { name: "MarketWatch", weight: "Medium", focus: "Retail Investing" },
    { name: "Yahoo Finance", weight: "Medium", focus: "Ticker Tracking" },
    { name: "Forbes", weight: "Medium", focus: "Corporate Policy" }
  ],
  IN: [
    { name: "Economic Times", weight: "Major", focus: "Corporate & Markets" },
    { name: "LiveMint", weight: "Major", focus: "Economy & Tech" },
    { name: "Moneycontrol", weight: "Major", focus: "Live Markets & Retail" },
    { name: "NDTV Profit", weight: "High", focus: "Business & Geopolitics" },
    { name: "Times of India", weight: "Medium", focus: "National Affairs" },
    { name: "Business Standard", weight: "High", focus: "Industrial Policy" },
    { name: "Reuters India", weight: "High", focus: "EM Investment Flows" },
    { name: "Indian Express", weight: "Medium", focus: "Policy & Governance" },
    { name: "Financial Express", weight: "Medium", focus: "Macro Economy" },
    { name: "CNBC-TV18", weight: "Major", focus: "Live Trading Coverage" }
  ],
  CN: [
    { name: "Xinhua Finance", weight: "Major", focus: "State Policy" },
    { name: "Caixin Global", weight: "Major", focus: "Independent Business" },
    { name: "SCMP Business", weight: "High", focus: "Hong Kong & Trade" },
    { name: "People's Daily", weight: "Major", focus: "Communist Party Directives" },
    { name: "Global Times", weight: "Medium", focus: "Foreign Affairs" },
    { name: "China Daily", weight: "Medium", focus: "Industrial Progress" },
    { name: "Reuters China", weight: "High", focus: "Global Supply Chain" },
    { name: "Bloomberg Asia", weight: "High", focus: "Capital Markets" },
    { name: "Sina Finance", weight: "High", focus: "Tech & Consumer" },
    { name: "Tencent Business", weight: "Medium", focus: "Retail & Internet" }
  ],
  DE: [
    { name: "Handelsblatt", weight: "Major", focus: "Business & Finance" },
    { name: "FAZ", weight: "Major", focus: "Conservative Politics" },
    { name: "Der Spiegel", weight: "High", focus: "Investigative Reports" },
    { name: "Die Welt", weight: "High", focus: "Industrial Policy" },
    { name: "Süddeutsche Zeitung", weight: "High", focus: "Social Policy" },
    { name: "Tagesschau", weight: "Major", focus: "National Broadcasting" },
    { name: "Börsen-Zeitung", weight: "High", focus: "Corporate Bonds" },
    { name: "Reuters Deutschland", weight: "High", focus: "EU Integration" },
    { name: "Bloomberg Germany", weight: "High", focus: "ECB Rate Actions" },
    { name: "n-tv", weight: "Medium", focus: "Live Market News" }
  ],
  JP: [
    { name: "Nikkei Asia", weight: "Major", focus: "Financial Markets" },
    { name: "Asahi Shimbun", weight: "High", focus: "National Affairs" },
    { name: "Yomiuri Shimbun", weight: "Medium", focus: "General Politics" },
    { name: "NHK World", weight: "Major", focus: "Public Broadcast" },
    { name: "Japan Times", weight: "High", focus: "English Commentary" },
    { name: "Reuters Tokyo", weight: "High", focus: "Yen Carry Trade" },
    { name: "Bloomberg Japan", weight: "High", focus: "Bank of Japan Actions" },
    { name: "Toyo Keizai", weight: "Medium", focus: "Corporate Governance" },
    { name: "Mainichi Shimbun", weight: "Medium", focus: "Socio-Economics" },
    { name: "Kyodo News", weight: "Medium", focus: "Industrial Tech" }
  ]
};

export const RECENT_LOCAL_HEADLINES = {
  US: [
    { source: "CNBC", title: "Federal Reserve hints at 'extended pause' as core CPI ticks up to 2.9%." },
    { source: "WSJ", title: "Treasury auctions meet weak demand; yields on 10-year notes hover near 4.35%." },
    { source: "Bloomberg US", title: "Mega-cap tech valuations face scrutiny as AI infrastructure capex rises." },
    { source: "Reuters US", title: "US antitrust probe into big tech AI partnerships intensifies." },
    { source: "FT US", title: "Dollar Index strengthens as global capital flows rotate back to US bonds." }
  ],
  IN: [
    { source: "Economic Times", title: "SEBI tightens futures & options rules to cool retail speculation frenzy." },
    { source: "LiveMint", title: "Monsoon rainfall deficit sparks fears of food inflation hike; FMCG margins pressured." },
    { source: "Moneycontrol", title: "FII outflows accelerate as US yields surge; DII mutual fund SIPs provide buffer." },
    { source: "CNBC-TV18", title: "Corporate earnings season starts slow with IT majors reporting flat margins." },
    { source: "NDTV Profit", title: "GST Council proposes higher brackets for high-end electronic imports." }
  ],
  CN: [
    { source: "Caixin Global", title: "Property development investment declines another 9.8% YoY." },
    { source: "Xinhua Finance", title: "State-backed funds step in to buy blue-chip ETFs amidst market index volatility." },
    { source: "SCMP Business", title: "Tariff tensions rise as EU moves closer to imposing import levies on Chinese EVs." },
    { source: "People's Daily", title: "PBOC sets yuan midpoint fixing at multi-month low to defend trade competitiveness." },
    { source: "Reuters China", title: "LGFV local debt stress increases; regional banks consolidate balance sheets." }
  ],
  DE: [
    { source: "Handelsblatt", title: "German industrial orders fall 3.2% as global demand for automotive machinery slows." },
    { source: "Der Spiegel", title: "Coalition government faces gridlock over constitutional debt brake revisions." },
    { source: "Bloomberg Germany", title: "ECB warns of persistent services wage growth; rate cuts in doubt." },
    { source: "Tagesschau", title: "Energy costs push manufacturing firms to accelerate production offshoring." },
    { source: "Die Welt", title: "BDI Index hits lowest level since energy crisis; recovery timeline delayed." }
  ],
  JP: [
    { source: "Nikkei Asia", title: "BOJ debates reducing monthly JGB bond purchases to support weak Yen." },
    { source: "Bloomberg Japan", title: "Yen carry trade unwinding risks rise as currency volatility spikes near 158." },
    { source: "NHK World", title: "Tokyo core inflation rises 2.1%, putting pressure on real wage metrics." },
    { source: "Toyo Keizai", title: "Shareholder activism achieves record victories at corporate board meetings." },
    { source: "Japan Times", title: "Household consumption logs fourth consecutive monthly decline." }
  ]
};

const GEOPOLITICAL_SUMMARIES = {
  US: {
    bullish: "AI capital spending is translating directly to productivity gains, boosting mega-cap corporate margins. Retail disinflation supports consumer resilience, keeping soft landing probabilities above 70%. Fed rate cut timeline is delayed but priced as a late H2 catalyst.",
    bearish: "Core inflation remains sticky above the Fed's 2% target, forcing yields higher and compressing equity multiples. US antitrust regulators are expanding scrutiny on technology conglomerates, leading to regulatory selloffs. Large-scale corporate capital investments are triggering warnings of diminished returns on hardware capex.",
    neutral: "US indexes are trading within a tight range as mixed macroeconomic indicators create a data-dependent Federal Reserve stance. Tech consolidation offsets gains in financials and industrial shares. Bond market volatility remains elevated."
  },
  IN: {
    bullish: "Robust domestic mutual fund allocations continue to absorb global volatility. Industrial policy reforms and infrastructure capital investments are accelerating corporate earnings growth. The domestic transition to localized manufacturing offsets international headwinds.",
    bearish: "SEBI's regulatory clampdown on high-volume futures trading has cooled speculative liquidity. Below-average monsoon rains are fueling food inflation expectations, threatening FMCG retail margins. Foreign institutional capital is actively rotating into cheaper global markets.",
    neutral: "Indian equities trade at premium valuations, forcing the Nifty index to move sideways. Strong domestic consumption is offset by expensive crude import prices. Corporate earnings margins are stabilizing across core banking shares."
  },
  CN: {
    bullish: "PBOC's liquidity injections are transmitting to regional manufacturing activity, while export growth continues to beat expectations. State-backed buying has placed a floor under index drawdowns. Regulatory oversight on internet giants appears to have bottomed out.",
    bearish: "A grinding property sector correction continues to restrict consumer confidence and municipal land sale revenues. Geopolitical tariff threats from the US and EU on industrial exports are raising margins concerns. Local government financing vehicle credit exposures present systemic banking risks.",
    neutral: "Chinese equities continue to oscillate within policy-supported boundaries. Industrial supply chain strength is balanced against sluggish domestic real estate demand. Foreign fund flows remain cautious."
  },
  DE: {
    bullish: "German engineering firms are logging resilient export margins outside of the EU, especially in advanced factory automation equipment. High-tech defense spending allocations are acting as structural growth drivers. Natural gas reserves have fully stabilized, decreasing input cost risks.",
    bearish: "A deep industrial slowdown is unfolding as high energy costs force manufacturing companies to offshore operations. Germany's strict constitutional debt brake limits potential fiscal stimulus. Export demand from key markets like China remains subdued.",
    neutral: "German bund yields are stabilizing, leading to range-bound trading across DAX stocks. Companies are restructuring supply chains to adapt to higher baseline energy inputs. Focus rests on upcoming European Central Bank policy steps."
  },
  JP: {
    bullish: "Corporate governance reforms have unlocked cash-rich balance sheets, driving buybacks and dividends to historical highs. A weak Yen continues to yield record earnings translations for multi-national exporters. Bank of Japan's rate normalization has boosted domestic banking margins.",
    bearish: "Yen carry trade unwinding risks are creating global liquidity volatility. Real wage growth continues to contract, leading to sluggish consumer retail spending. Import cost inflation on raw materials compresses domestic factory margins.",
    neutral: "Japanese stocks are consolidating as currency swings dominate export valuations. Investor interest remains supportive due to Tokyo exchange reforms, but BOJ bond-buying adjustments are keeping bond markets on alert."
  }
};

export function getLocalNewsOutlets(countryCode) {
  return LOCAL_NEWS_OUTLETS[countryCode] || [
    { name: "National TV", weight: "Medium", focus: "General Affairs" },
    { name: "Daily Press", weight: "Medium", focus: "Business" },
    { name: "Reuters", weight: "High", focus: "Markets" },
    { name: "Bloomberg", weight: "High", focus: "Finance" }
  ];
}

export function getLocalHeadlines(countryCode) {
  return RECENT_LOCAL_HEADLINES[countryCode] || [
    { source: "Daily Chronicle", title: "Regional trade agreements face renegotiation timelines." },
    { source: "Finance Review", title: "Central Bank flags household debt ratio concerns." },
    { source: "Market Dispatch", title: "Small business sentiment Index improves slightly." }
  ];
}

export function generateGeopoliticalSummary(countryCode, sentiment = "neutral") {
  const summaries = GEOPOLITICAL_SUMMARIES[countryCode];
  if (summaries) {
    return summaries[sentiment] || summaries.neutral;
  }
  // Generic fallback
  return `Local news channels are reporting structural challenges combined with policy initiatives. Geopolitical risk indexes indicate moderate volatility as international trade partners re-negotiate tariffs. Investors are maintaining a defensive posture awaiting the next rate decision.`;
}
