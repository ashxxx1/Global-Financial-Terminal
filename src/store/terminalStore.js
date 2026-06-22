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
}));

export default useTerminalStore;
