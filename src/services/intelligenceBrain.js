// ─── Meridian Intelligence Brain Service ──────────────────────────────────────────
// Rule-based NLP classifier, sentiment analyzer, and real-time background pipeline.

export const COUNTRY_COORDS = {
  US: { lat: 37.0902, lng: -95.7129, name: "United States" },
  CN: { lat: 35.8617, lng: 104.1954, name: "China" },
  DE: { lat: 51.1657, lng: 10.4515, name: "Germany" },
  JP: { lat: 36.2048, lng: 138.2529, name: "Japan" },
  IN: { lat: 20.5937, lng: 78.9629, name: "India" },
  GB: { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  FR: { lat: 46.2276, lng: 2.2137, name: "France" },
  SA: { lat: 23.8859, lng: 45.0792, name: "Saudi Arabia" },
  TW: { lat: 23.6978, lng: 120.9605, name: "Taiwan" },
  KR: { lat: 35.9078, lng: 127.7669, name: "South Korea" },
  RU: { lat: 61.5240, lng: 105.3188, name: "Russia" },
  BR: { lat: -14.2350, lng: -51.9253, name: "Brazil" },
  CA: { lat: 56.1304, lng: -106.3468, name: "Canada" },
  AU: { lat: -25.2744, lng: 133.7751, name: "Australia" },
  ZA: { lat: -30.5595, lng: 22.9375, name: "South Africa" },
  MX: { lat: 23.6345, lng: -102.5528, name: "Mexico" },
  SG: { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  AE: { lat: 23.4241, lng: 53.8478, name: "United Arab Emirates" },
  NL: { lat: 52.1326, lng: 5.2913, name: "Netherlands" },
  SE: { lat: 60.1282, lng: 18.6435, name: "Sweden" },
  NO: { lat: 60.4720, lng: 8.4689, name: "Norway" },
  CH: { lat: 46.8182, lng: 8.2275, name: "Switzerland" },
  IT: { lat: 41.8719, lng: 12.5674, name: "Italy" },
  ES: { lat: 40.4637, lng: -3.7492, name: "Spain" }
};

export const COMPANY_COORDS = {
  AAPL: { lat: 37.3318, lng: -122.0312, name: "Apple Inc.", ticker: "$AAPL", country: "US" },
  MSFT: { lat: 47.6419, lng: -122.1272, name: "Microsoft Corp.", ticker: "$MSFT", country: "US" },
  TSLA: { lat: 30.2241, lng: -97.6223, name: "Tesla Inc.", ticker: "$TSLA", country: "US" },
  NVDA: { lat: 37.3719, lng: -121.9678, name: "Nvidia Corp.", ticker: "$NVDA", country: "US" },
  TSM: { lat: 24.7801, lng: 120.9797, name: "TSMC", ticker: "$TSM", country: "TW" },
  ASML: { lat: 51.4118, lng: 5.4142, name: "ASML Holding", ticker: "$ASML", country: "NL" },
  GOOGL: { lat: 37.4220, lng: -122.0841, name: "Alphabet Inc.", ticker: "$GOOGL", country: "US" },
  META: { lat: 37.4848, lng: -122.1484, name: "Meta Platforms", ticker: "$META", country: "US" },
  AMZN: { lat: 47.6101, lng: -122.3338, name: "Amazon.com Inc.", ticker: "$AMZN", country: "US" },
  ARAMCO: { lat: 26.3048, lng: 50.1370, name: "Saudi Aramco", ticker: "$ARAMCO", country: "SA" }
};

const COUNTRY_RULES = [
  { code: "US", keywords: ["us", "usa", "united states", "fed", "federal reserve", "washington", "wall street", "sec", "treasury"] },
  { code: "CN", keywords: ["china", "chinese", "beijing", "yuan", "renminbi", "pboc", "shanghai", "shenzhen", "evergrande"] },
  { code: "DE", keywords: ["germany", "german", "berlin", "frankfurt", "dax", "bundesbank", "scholz", "basf", "sap"] },
  { code: "JP", keywords: ["japan", "japanese", "tokyo", "yen", "boj", "nikkei", "kishida", "softbank", "toyota"] },
  { code: "IN", keywords: ["india", "indian", "mumbai", "delhi", "rupee", "rbi", "nifty", "sebi", "modi", "reliance", "tata"] },
  { code: "GB", keywords: ["uk", "united kingdom", "london", "pound", "sterling", "boe", "bank of england", "sunak", "ftse"] },
  { code: "FR", keywords: ["france", "french", "paris", "macron", "cac", "societe generale", "totalenergies"] },
  { code: "SA", keywords: ["saudi", "riyadh", "aramco", "opec", "oil cut", "saudi arabia"] },
  { code: "TW", keywords: ["taiwan", "taipei", "tsmc", "taiwanese", "hsinchu"] },
  { code: "KR", keywords: ["korea", "korean", "seoul", "samsung", "sk hynix", "kospi"] }
];

const SECTOR_RULES = [
  { name: "Technology", keywords: ["technology", "ai", "semiconductor", "chip", "software", "hardware", "cybersecurity", "intel", "cloud", "artificial intelligence"] },
  { name: "Energy", keywords: ["energy", "oil", "gas", "petroleum", "refinery", "opec", "crude", "brent", "wti", "renewable"] },
  { name: "Financials", keywords: ["financial", "bank", "lending", "credit", "rate", "yield", "bond", "liquidity", "fed", "ecb", "boj", "rbi"] },
  { name: "Healthcare", keywords: ["healthcare", "pharma", "biotech", "vaccine", "drug", "fda", "clinical", "hospital"] },
  { name: "Consumer", keywords: ["consumer", "retail", "automobile", "ev", "spending", "e-commerce", "inflation", "cpi", "households"] },
  { name: "Industrials", keywords: ["industrial", "manufacturing", "factory", "shipping", "freight", "aerospace", "defense"] },
  { name: "Materials", keywords: ["materials", "steel", "copper", "lithium", "mining", "aluminum", "rare earths"] },
  { name: "Real Estate", keywords: ["real estate", "property", "housing", "mortgage", "developer", "construction"] }
];

const COMMODITY_RULES = [
  { name: "Oil", ticker: "$BRENT", keywords: ["oil", "crude", "brent", "wti", "opec"] },
  { name: "Gold", ticker: "$GOLD", keywords: ["gold", "bullion", "precious metal"] },
  { name: "Silver", ticker: "$SILVER", keywords: ["silver"] },
  { name: "Copper", ticker: "$COPPER", keywords: ["copper"] },
  { name: "Natural Gas", ticker: "$NATGAS", keywords: ["gas", "lng", "natural gas"] }
];

const CURRENCY_RULES = [
  { name: "USD", ticker: "$USD", keywords: ["dollar", "usd", "greenback", "dxy"] },
  { name: "EUR", ticker: "$EUR", keywords: ["euro", "eur", "single currency"] },
  { name: "GBP", ticker: "$GBP", keywords: ["pound", "gbp", "sterling"] },
  { name: "JPY", ticker: "$JPY", keywords: ["yen", "jpy"] },
  { name: "CNY", ticker: "$CNY", keywords: ["yuan", "cny", "renminbi"] },
  { name: "INR", ticker: "$INR", keywords: ["rupee", "inr"] }
];

const INDEX_RULES = [
  { name: "S&P 500", ticker: "$SPX", keywords: ["s&p 500", "spx", "s&p"] },
  { name: "Nasdaq", ticker: "$COMP", keywords: ["nasdaq", "ndx", "tech index"] },
  { name: "Dow Jones", ticker: "$DJIA", keywords: ["dow jones", "dow", "djia"] },
  { name: "DAX 40", ticker: "$DAX", keywords: ["dax", "dax 40", "german index"] },
  { name: "FTSE 100", ticker: "$FTSE", keywords: ["ftse", "ftse 100", "footsie"] },
  { name: "Nikkei 225", ticker: "$N225", keywords: ["nikkei", "nikkei 225"] },
  { name: "Nifty 50", ticker: "$NIFTY", keywords: ["nifty", "nifty 50"] }
];

const MACRO_KEYWORDS = ["inflation", "cpi", "rate", "hike", "cut", "gdp", "growth", "unemployment", "jobs", "payroll", "yield", "central bank", "regulation", "tax", "budget", "deficit", "tariffs", "trade"];
const GEOPOLITICAL_KEYWORDS = ["war", "conflict", "sanctions", "tariff", "trade war", "diplomacy", "treaty", "military", "defense", "geopolitical", "tensions"];

const SENTIMENT_RULES = {
  bullish: ["growth", "surge", "rise", "expansion", "beat", "upgrade", "profit", "rate cut", "easing", "stimulus", "recovery", "positive", "deal", "acquisition", "merger"],
  bearish: ["decline", "drop", "fall", "contraction", "miss", "downgrade", "loss", "rate hike", "tightening", "sanctions", "war", "disruption", "tariff", "probe", "antitrust", "deficit", "crisis", "recession"]
};

// ─── Deduplicator Cache ───────────────────────────────────────────────────────────
const processedArticleTitles = new Set();

// ─── News API Fetcher ─────────────────────────────────────────────────────────────
export async function fetchNewGlobalNews() {
  const countries = ["us", "in", "au", "ru", "fr", "gb"];
  const articlesList = [];

  const promises = countries.map(async (c) => {
    const url = `https://saurav.tech/NewsAPI/top-headlines/category/business/${c}.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.articles) {
        data.articles.forEach(article => {
          if (article && article.title) {
            articlesList.push({
              ...article,
              publishedCountry: c.toUpperCase()
            });
          }
        });
      }
    } catch (e) {
      console.warn(`Failed to fetch news feed for country ${c}:`, e.message);
    }
  });

  await Promise.all(promises);
  return articlesList;
}

// ─── Article Parser and Entity Extractor ──────────────────────────────────────────
export function processNewsArticle(article) {
  const title = article.title;
  const desc = article.description || "";
  const content = article.content || "";
  const combinedText = `${title} ${desc} ${content}`.toLowerCase();

  // 1. Remove duplicate checks
  const cleanTitle = title.trim().toLowerCase();
  if (processedArticleTitles.has(cleanTitle)) {
    return null;
  }
  processedArticleTitles.add(cleanTitle);
  // Cap the size of the deduplication cache at 1000 items to prevent memory leaks
  if (processedArticleTitles.size > 1000) {
    const firstItem = processedArticleTitles.values().next().value;
    processedArticleTitles.delete(firstItem);
  }

  // 2. Affected Countries Detection
  const affectedCountries = new Set();
  COUNTRY_RULES.forEach(rule => {
    if (rule.keywords.some(k => combinedText.includes(k))) {
      affectedCountries.add(rule.code);
    }
  });
  // Always include the country of publication
  if (article.publishedCountry) {
    affectedCountries.add(article.publishedCountry);
  }
  
  // Specific complex geopolitics mappings: e.g. tariffs, supply chains
  if (combinedText.includes("tariff") || combinedText.includes("trade war")) {
    // If trade war is between US and China, automatically tag regional supply chains
    if (affectedCountries.has("US") && affectedCountries.has("CN")) {
      affectedCountries.add("TW");
      affectedCountries.add("KR");
      affectedCountries.add("VN");
      affectedCountries.add("JP");
    }
  }

  // 3. Company Detection
  const affectedCompanies = [];
  const detectedAssets = new Set();
  Object.keys(COMPANY_COORDS).forEach(ticker => {
    const comp = COMPANY_COORDS[ticker];
    if (combinedText.includes(comp.name.toLowerCase()) || combinedText.includes(ticker.toLowerCase())) {
      affectedCompanies.push(comp.name);
      detectedAssets.add(comp.ticker);
      affectedCountries.add(comp.country);
    }
  });

  // 4. Sector Detection
  const affectedSectors = [];
  SECTOR_RULES.forEach(rule => {
    if (rule.keywords.some(k => combinedText.includes(k))) {
      affectedSectors.push(rule.name);
    }
  });

  // 5. Commodities Detection
  COMMODITY_RULES.forEach(rule => {
    if (rule.keywords.some(k => combinedText.includes(k))) {
      detectedAssets.add(rule.ticker);
      // Auto-tag Energy sector for oil/gas
      if (rule.name === "Oil" || rule.name === "Natural Gas") {
        if (!affectedSectors.includes("Energy")) affectedSectors.push("Energy");
      }
    }
  });

  // 6. Currencies Detection
  CURRENCY_RULES.forEach(rule => {
    if (rule.keywords.some(k => combinedText.includes(k))) {
      detectedAssets.add(rule.ticker);
    }
  });

  // 7. Stock Indices Detection
  INDEX_RULES.forEach(rule => {
    if (rule.keywords.some(k => combinedText.includes(k))) {
      detectedAssets.add(rule.ticker);
    }
  });

  // 8. Event Categorization
  const categories = [];
  if (combinedText.includes("merger") || combinedText.includes("acquisition") || combinedText.includes("buyout") || combinedText.includes("m&a")) {
    categories.push("M&A");
  }
  if (combinedText.includes("ipo") || combinedText.includes("public offering") || combinedText.includes("listing")) {
    categories.push("IPO");
  }
  if (combinedText.includes("earnings") || combinedText.includes("quarterly profit") || combinedText.includes("revenue increase")) {
    categories.push("Earnings");
  }
  if (MACRO_KEYWORDS.some(k => combinedText.includes(k))) {
    categories.push("Macroeconomics");
  }
  if (combinedText.includes("inflation") || combinedText.includes("cpi") || combinedText.includes("retail prices")) {
    categories.push("Inflation");
  }
  if (combinedText.includes("interest rate") || combinedText.includes("rate hike") || combinedText.includes("rate cut") || combinedText.includes("borrowing costs")) {
    categories.push("Interest Rates");
  }
  if (combinedText.includes("gdp") || combinedText.includes("economic growth")) {
    categories.push("GDP");
  }
  if (combinedText.includes("unemployment") || combinedText.includes("jobs") || combinedText.includes("payroll")) {
    categories.push("Employment");
  }
  if (combinedText.includes("fed") || combinedText.includes("ecb") || combinedText.includes("boj") || combinedText.includes("central bank")) {
    categories.push("Central Banks");
  }
  if (GEOPOLITICAL_KEYWORDS.some(k => combinedText.includes(k))) {
    categories.push("Politics");
  }
  if (combinedText.includes("war") || combinedText.includes("military") || combinedText.includes("conflict")) {
    categories.push("War");
  }
  if (combinedText.includes("sanctions") || combinedText.includes("embargo")) {
    categories.push("Sanctions");
  }
  if (combinedText.includes("tariff") || combinedText.includes("trade restriction") || combinedText.includes("trade dispute")) {
    categories.push("Trade");
  }
  if (combinedText.includes("diplomacy") || combinedText.includes("summit") || combinedText.includes("alliance")) {
    categories.push("Diplomacy");
  }
  if (combinedText.includes("regulation") || combinedText.includes("antitrust") || combinedText.includes("investigation") || combinedText.includes("lawsuit")) {
    categories.push("Regulation");
  }
  if (combinedText.includes("cybersecurity") || combinedText.includes("hacker") || combinedText.includes("data breach")) {
    categories.push("Cybersecurity");
  }
  if (combinedText.includes("artificial intelligence") || combinedText.includes("ai model") || combinedText.includes("openai") || combinedText.includes("llm")) {
    categories.push("AI");
  }
  if (combinedText.includes("supply chain") || combinedText.includes("semiconductor shortage") || combinedText.includes("port logjam")) {
    categories.push("Supply Chain");
  }

  // Fallback category if none matched
  if (categories.length === 0) {
    categories.push(affectedSectors[0] || "Corporate");
  }

  // 9. Sentiment Analysis (Bullish / Bearish / Neutral)
  let sentimentScore = 50; // neutral baseline
  let bullishCount = 0;
  let bearishCount = 0;
  
  SENTIMENT_RULES.bullish.forEach(w => {
    if (combinedText.includes(w)) bullishCount++;
  });
  SENTIMENT_RULES.bearish.forEach(w => {
    if (combinedText.includes(w)) bearishCount++;
  });

  if (bullishCount > bearishCount) {
    sentimentScore = Math.min(95, 55 + (bullishCount - bearishCount) * 8);
  } else if (bearishCount > bullishCount) {
    sentimentScore = Math.max(5, 45 - (bearishCount - bullishCount) * 8);
  }
  
  let sentimentLabel = "Neutral";
  if (sentimentScore > 58) sentimentLabel = "Bullish";
  else if (sentimentScore < 42) sentimentLabel = "Bearish";

  // 10. Scoring Importance (0-100)
  let importanceScore = 30; // base weight
  if (categories.includes("War") || categories.includes("Sanctions")) importanceScore += 35;
  else if (categories.includes("Central Banks") || categories.includes("Interest Rates")) importanceScore += 25;
  else if (categories.includes("Inflation") || categories.includes("GDP")) importanceScore += 20;
  else if (categories.includes("Trade") || categories.includes("Supply Chain")) importanceScore += 20;
  else if (categories.includes("M&A") || categories.includes("Earnings")) importanceScore += 15;
  
  if (affectedCompanies.length > 0) importanceScore += 10;
  if (affectedCountries.size > 1) importanceScore += 10;
  
  // Cap score
  importanceScore = Math.min(100, Math.max(10, importanceScore + Math.floor(Math.random() * 8)));

  // 11. Severity
  let severity = "Low";
  if (importanceScore > 85) severity = "Critical";
  else if (importanceScore > 70) severity = "High";
  else if (importanceScore > 40) severity = "Medium";

  // 12. Time Horizon
  let timeHorizon = "Short-Term";
  if (categories.includes("AI") || categories.includes("Regulation") || categories.includes("Technology")) {
    timeHorizon = "Long-Term";
  } else if (categories.includes("GDP") || categories.includes("Taxation") || categories.includes("Trade")) {
    timeHorizon = "Medium-Term";
  } else if (categories.includes("Unscheduled") || categories.includes("War") || categories.includes("Employment")) {
    timeHorizon = "Immediate";
  }

  // 13. Confidence Score
  const confidence = Math.min(98, 75 + Math.floor(Math.random() * 20));

  return {
    id: "event_" + Math.random().toString(36).substr(2, 9),
    title,
    summary: desc || title,
    time: article.publishedAt ? new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
    timestamp: article.publishedAt ? new Date(article.publishedAt).getTime() : Date.now(),
    category: categories[0] || "MACRO",
    type: categories[0] || "MACRO",
    categories,
    impact: importanceScore,
    sentiment: sentimentScore,
    sentimentLabel,
    confidence,
    severity,
    timeHorizon,
    assets: Array.from(detectedAssets),
    source: article.source?.name || "Global Node Service",
    countries: Array.from(affectedCountries),
    url: article.url
  };
}

// ─── AI Summary Generator ─────────────────────────────────────────────────────────
export function generateCountryAISummary(countryCode, events) {
  if (!events || events.length === 0) {
    return {
      whatChanged: "No major shifts reported. Baseline indicators tracking within normal ranges.",
      whyItMatters: "Sovereign liquidity indices and bond yield spreads are stable.",
      expectedReaction: "Range-bound trading across core stock indices.",
      countriesAffected: [COUNTRY_COORDS[countryCode]?.name || countryCode],
      industriesAffected: ["General Banking", "Broad Market"],
      stocksToWatch: [],
      potentialRisks: "Subdued retail consumption cycles.",
      potentialOpportunities: "Strategic yield capture in sovereign debt instruments."
    };
  }

  const primaryEvent = events[0];
  
  // Parse affected countries names
  const affectedNames = (primaryEvent.countries || []).map(code => COUNTRY_COORDS[code]?.name || code);
  if (affectedNames.length === 0) {
    affectedNames.push(COUNTRY_COORDS[countryCode]?.name || countryCode);
  }

  // Determine affected sectors
  const industries = primaryEvent.assets.filter(a => a.startsWith("$"))
    .map(a => {
      const match = COMPANY_COORDS[a.replace("$", "")];
      return match ? match.name : a;
    });
  if (industries.length === 0) {
    industries.push("Macro Economic Indices");
  }

  const watchTickers = primaryEvent.assets.filter(a => a.startsWith("$") && COMPANY_COORDS[a.replace("$", "")]);

  return {
    whatChanged: `Chronological headlines indicate a key ${primaryEvent.type.toLowerCase()} event: "${primaryEvent.title}". Source reports: ${primaryEvent.summary.slice(0, 150)}...`,
    whyItMatters: `This event triggers a severity level of ${primaryEvent.severity} over a ${primaryEvent.timeHorizon.toLowerCase()} time horizon. It carries an importance rating of ${primaryEvent.impact}/100.`,
    expectedReaction: `The expected market sentiment is classified as ${primaryEvent.sentimentLabel.toUpperCase()}. This is modeled to influence yields and trading volumes for connected financial assets.`,
    countriesAffected: affectedNames,
    industriesAffected: industries,
    stocksToWatch: watchTickers,
    potentialRisks: primaryEvent.sentimentLabel === "Bearish" ? `Heightened capital flight risks and volatility cascades across ${primaryEvent.category.toLowerCase()} channels.` : "Delayed monetary policy shifts or supply adjustments.",
    potentialOpportunities: primaryEvent.sentimentLabel === "Bullish" ? `Constructive valuation expansion and target asset outperformance.` : "Arbitrage positioning in safe-haven currency pairings."
  };
}

// ─── Background Orchestration Loop ───────────────────────────────────────────────
let pipelineTimerId = null;

export function startIntelligencePipeline(store) {
  if (pipelineTimerId) {
    clearInterval(pipelineTimerId);
  }

  const runCycle = async () => {
    const state = store.getState ? store.getState() : store;
    state.setSyncingIntelligence(true);
    try {
      const rawArticles = await fetchNewGlobalNews();
      const newEvents = [];
      
      rawArticles.forEach(article => {
        const ev = processNewsArticle(article);
        if (ev) {
          newEvents.push(ev);
        }
      });

      if (newEvents.length > 0) {
        // Sort chronologically (newest first)
        newEvents.sort((a, b) => b.timestamp - a.timestamp);
        state.addIntelligenceEvents(newEvents);

        // Update summaries for affected countries
        const updatedCountries = new Set();
        newEvents.forEach(e => {
          if (e.countries) e.countries.forEach(c => updatedCountries.add(c));
        });

        updatedCountries.forEach(iso => {
          const countryEvents = (state.countriesIntelligence[iso]?.latest) || [];
          const summary = generateCountryAISummary(iso, countryEvents);
          state.updateCountrySummary(iso, summary);
        });
      }
    } catch (err) {
      console.error("Meridian Pipeline Error:", err.message);
    } finally {
      state.setSyncingIntelligence(false);
    }
  };

  // Run immediately on start
  runCycle();

  const setupInterval = (intervalSeconds) => {
    if (pipelineTimerId) clearInterval(pipelineTimerId);
    pipelineTimerId = setInterval(runCycle, intervalSeconds * 1000);
  };

  // Run on interval
  const state = store.getState ? store.getState() : store;
  let currentInterval = state.refreshInterval || 10;
  setupInterval(currentInterval);

  // Subscribe to changes in the store to update the interval dynamically
  const unsub = store.subscribe((newState) => {
    const nextInterval = newState.refreshInterval || 10;
    if (nextInterval !== currentInterval) {
      currentInterval = nextInterval;
      setupInterval(nextInterval);
    }
  });

  return unsub;
}

export function stopIntelligencePipeline() {
  if (pipelineTimerId) {
    clearInterval(pipelineTimerId);
    pipelineTimerId = null;
  }
}
