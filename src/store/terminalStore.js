import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTerminalStore = create(persist((set, get) => ({
  // ─── Globe / Country ───
  selectedCountry: null,
  isNewsPanelOpen: false,
  globeAutoRotate: true,

  setSelectedCountry: (country) =>
    set({ selectedCountry: country, isNewsPanelOpen: !!country, selectedStock: null, isStockPanelOpen: false }),

  closeNewsPanel: () =>
    set({ isNewsPanelOpen: false, selectedCountry: null }),

  setGlobeAutoRotate: (val) => set({ globeAutoRotate: val }),

  // ─── Stock ───
  selectedStock: null,
  isStockPanelOpen: false,

  setSelectedStock: (stock) =>
    set({ selectedStock: stock, isStockPanelOpen: !!stock }),

  closeStockPanel: () =>
    set({ isStockPanelOpen: false, selectedStock: null }),

  // ─── Sidebar ───
  sidebarTab: "indices",
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  // ─── Watchlist ───
  watchlist: [],
  addToWatchlist: (stock) => {
    const { watchlist } = get();
    if (!watchlist.find((s) => s.symbol === stock.symbol && s.country === stock.country)) {
      set({ watchlist: [...watchlist, stock] });
    }
  },
  removeFromWatchlist: (symbol, country) => {
    const { watchlist } = get();
    set({ watchlist: watchlist.filter((s) => !(s.symbol === symbol && s.country === country)) });
  },
  isInWatchlist: (symbol, country) => {
    return get().watchlist.some((s) => s.symbol === symbol && s.country === country);
  },

  // ─── Search ───
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  isSearchOpen: false,
  setSearchOpen: (v) => set({ isSearchOpen: v }),

  // ─── Command Palette ───
  commandPaletteOpen: false,
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),

  // ─── Active View (globe / heatmap / calendar / portfolio / fx / correlation / alerts) ───
  activeView: "globe",
  setActiveView: (view) => set({ activeView: view }),

  // ─── Alerts ───
  alerts: [],
  notifications: [],
  unreadAlertCount: 0,
  alertPanelOpen: false,
  setAlertPanelOpen: (v) => set({ alertPanelOpen: v, unreadAlertCount: v ? 0 : get().unreadAlertCount }),

  addAlert: (alertData) => {
    const newAlert = {
      id: "alert_" + Date.now(),
      symbol: alertData.symbol,
      price: alertData.price,
      direction: alertData.direction || "above",
      createdAt: new Date().toISOString(),
      isSmart: alertData.isSmart || false,
      text: alertData.text || null,
      status: alertData.status || "Monitoring",
    };
    set({ alerts: [...get().alerts, newAlert] });
  },
  removeAlert: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),

  fireAlert: (alert, triggeredPrice) => {
    const notif = {
      id: "n_" + Date.now(),
      text: `${alert.symbol} hit $${triggeredPrice.toFixed(2)} — target ${alert.direction} $${alert.price} triggered!`,
      icon: "🔔",
      time: new Date().toLocaleTimeString(),
      read: false,
    };
    set({
      alerts: get().alerts.filter((a) => a.id !== alert.id),
      notifications: [...get().notifications, notif],
      unreadAlertCount: get().unreadAlertCount + 1,
    });
  },

  clearNotifications: () => set({ notifications: [], unreadAlertCount: 0 }),

  // ─── Causal Chain ───
  causalChainEventId: null,
  causalChainEventTitle: null,
  setCausalChainEvent: (id, title) => set({ causalChainEventId: id, causalChainEventTitle: title }),
  closeCausalChain: () => set({ causalChainEventId: null, causalChainEventTitle: null }),

  // ─── What-If Scenario ───
  whatIfScenario: null, // null | Partial<FactorVector> representing overrides
  setWhatIfScenario: (scenario) => set({ whatIfScenario: scenario }),
  clearWhatIfScenario: () => set({ whatIfScenario: null }),

  // ─── Compare Mode ───
  compareCountry: null, // null | country object
  setCompareCountry: (country) => set({ compareCountry: country }),
  closeCompareMode: () => set({ compareCountry: null }),

  // ─── Time-Scrub Playback ───
  scrubStep: 0, // 0 - 100 representing timeline progress
  isScrubPlaying: false,
  setScrubStep: (step) => set({ scrubStep: step }),
  setScrubPlaying: (val) => set({ isScrubPlaying: val }),

  // ─── Collaborative Annotations ───
  annotations: [
    { id: "a_1", lat: 35, lng: 105, text: "Yuan moves monitored closely post PBOC cut.", author: "User #1" },
    { id: "a_2", lat: 40, lng: -97, text: "Treasury auctions show sticky bid-to-cover.", author: "User #2" }
  ],
  addAnnotation: (ann) => set({ annotations: [...get().annotations, ann] }),

  // ─── Meridian Intelligence Brain ───
  intelligenceEvents: [
    {
      id: "e1",
      title: "Unscheduled OPEC+ Output Reduction",
      time: "2m ago",
      timestamp: Date.now() - 120000,
      category: "MACRO",
      type: "GEOPOLITICAL",
      impact: 94,
      sentiment: 21,
      sentimentLabel: "Bearish",
      confidence: 88,
      assets: ["$USO", "$XOM", "$CVX", "$BRENT"],
      source: "Automated Satellite ML / Refinery Heat Signatures",
      summary: "Anomalous heat signatures dropping across 4 primary Saudi facilities matching patterns historically preceding major output cuts. Likelihood of formal announcement within 48 hours exceeds 80%.",
      isAlert: true,
      countries: ["US", "SA", "CN", "DE", "JP"]
    },
    {
      id: "e2",
      title: "Semiconductor Supply Chain Disruption",
      time: "14m ago",
      timestamp: Date.now() - 840000,
      category: "SUPPLY CHAIN",
      type: "SUPPLY CHAIN",
      impact: 76,
      sentiment: 42,
      sentimentLabel: "Bearish",
      confidence: 94,
      assets: ["$TSM", "$NVDA", "$ASML"],
      source: "Global Port Logistics Network Tracker",
      summary: "Seismic event off Taiwan coast has paused operations at two major deepwater ports. Neon gas routing delays detected. AI supply chain disruption probability spiking.",
      isAlert: false,
      countries: ["TW", "US", "CN", "JP", "KR"]
    },
    {
      id: "e3",
      title: "ECB Emergency Liquidity Injection",
      time: "1h 2m ago",
      timestamp: Date.now() - 3720000,
      category: "MACRO",
      type: "MACROECONOMIC",
      impact: 89,
      sentiment: 66,
      sentimentLabel: "Bullish",
      confidence: 100,
      assets: ["$EURUSD", "$DE0001102309"],
      source: "ECB SWIFT Wire Feed",
      summary: "Unprecedented intra-meeting repo operations observed targeting specific Tier 1 European banks to preempt liquidity crunch. Suggests hidden balance sheet vulnerabilities.",
      isAlert: true,
      countries: ["DE", "FR", "NL", "IT", "GB"]
    },
    {
      id: "e4",
      title: "AI Regulatory Framework Draft Leaked",
      time: "3h 45m ago",
      timestamp: Date.now() - 13500000,
      category: "GEOPOLITICAL",
      type: "REGULATORY",
      impact: 65,
      sentiment: 45,
      sentimentLabel: "Neutral",
      confidence: 72,
      assets: ["$MSFT", "$GOOGL", "$META"],
      source: "Deep Web Policy Scraping",
      summary: "Draft EU directive implies strict liability for autonomous agents making financial decisions. Compliance costs modeled to impact MSFT operating margins by 1.2%.",
      isAlert: false,
      countries: ["US", "DE", "FR", "NL", "GB"]
    }
  ],
  countriesIntelligence: {},
  selectedSector: null,
  refreshInterval: 10,
  isSyncingIntelligence: false,

  addIntelligenceEvents: (newEvents) => {
    const { intelligenceEvents } = get();
    // Filter out duplicates based on title
    const filtered = newEvents.filter(ne => !intelligenceEvents.some(ie => ie.title.toLowerCase() === ne.title.toLowerCase()));
    if (filtered.length > 0) {
      set({ intelligenceEvents: [...filtered, ...intelligenceEvents] });
      // Update each country intelligence lists
      filtered.forEach(event => {
        if (event.countries && Array.isArray(event.countries)) {
          event.countries.forEach(iso => {
            get().routeEventToCountry(iso, event);
          });
        }
      });
    }
  },

  routeEventToCountry: (iso, event) => {
    const { countriesIntelligence } = get();
    const current = countriesIntelligence[iso] || {
      latest: [], breaking: [], market: [], politics: [],
      economic: [], corporate: [], ma: [], centralbank: [],
      commodity: [], supplychain: [], technology: [], regulatory: [],
      aiSummary: null
    };

    // Helper to prepend to a list and keep it unique
    const prependUnique = (list, item) => {
      const filtered = list.filter(x => x.title !== item.title);
      return [item, ...filtered].slice(0, 50); // limit to last 50
    };

    current.latest = prependUnique(current.latest, event);

    if (event.isAlert || event.impact > 80) {
      current.breaking = prependUnique(current.breaking, event);
    }
    
    // Categorize
    const cats = event.categories || [event.type];
    const summaryText = (event.summary || "").toLowerCase();
    const titleText = (event.title || "").toLowerCase();

    if (cats.some(c => ["M&A", "IPO", "Corporate Governance"].includes(c)) || titleText.includes("m&a") || titleText.includes("merger") || titleText.includes("acquisition")) {
      current.ma = prependUnique(current.ma, event);
    }
    if (cats.some(c => ["Central Banks", "Interest Rates"].includes(c)) || summaryText.includes("central bank") || summaryText.includes("fed") || summaryText.includes("interest rate")) {
      current.centralbank = prependUnique(current.centralbank, event);
    }
    if (cats.some(c => ["Technology", "AI", "Cybersecurity"].includes(c))) {
      current.technology = prependUnique(current.technology, event);
    }
    if (cats.some(c => ["Regulation", "Taxation"].includes(c))) {
      current.regulatory = prependUnique(current.regulatory, event);
    }
    if (cats.some(c => ["Energy", "Commodity", "Agriculture"].includes(c))) {
      current.commodity = prependUnique(current.commodity, event);
    }
    if (cats.some(c => ["Supply Chain", "Transportation", "Manufacturing"].includes(c))) {
      current.supplychain = prependUnique(current.supplychain, event);
    }
    if (cats.some(c => ["Politics", "War", "Conflict", "Sanctions", "Trade", "Diplomacy"].includes(c))) {
      current.politics = prependUnique(current.politics, event);
    }
    if (cats.some(c => ["Macroeconomics", "Inflation", "GDP", "Employment"].includes(c))) {
      current.economic = prependUnique(current.economic, event);
    }
    if (cats.some(c => ["Earnings", "Corporate"].includes(c))) {
      current.corporate = prependUnique(current.corporate, event);
    }

    // Default market routing for finance-related events
    if (event.assets && event.assets.length > 0) {
      current.market = prependUnique(current.market, event);
    }

    set({
      countriesIntelligence: {
        ...countriesIntelligence,
        [iso]: current
      }
    });
  },

  updateCountrySummary: (iso, summary) => {
    const { countriesIntelligence } = get();
    const current = countriesIntelligence[iso] || {
      latest: [], breaking: [], market: [], politics: [],
      economic: [], corporate: [], ma: [], centralbank: [],
      commodity: [], supplychain: [], technology: [], regulatory: [],
      aiSummary: null
    };
    current.aiSummary = summary;
    set({
      countriesIntelligence: {
        ...countriesIntelligence,
        [iso]: current
      }
    });
  },

  setSelectedSector: (sector) => set({ selectedSector: sector }),
  setRefreshInterval: (val) => set({ refreshInterval: val }),
  setSyncingIntelligence: (val) => set({ isSyncingIntelligence: val }),
}), {
  // Persist only the user's own collections — everything else is session state.
  // (Portfolio positions are persisted separately by PortfolioPanel.)
  name: "gft-terminal-v1",
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({
    watchlist: s.watchlist,
    alerts: s.alerts,
  }),
}));

export default useTerminalStore;
