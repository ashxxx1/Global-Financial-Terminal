import { create } from "zustand";

const useTerminalStore = create((set, get) => ({
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
}));

export default useTerminalStore;
