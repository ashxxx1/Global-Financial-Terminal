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
  sidebarTab: "indices", // 'indices' | 'stocks' | 'watchlist'
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
}));

export default useTerminalStore;
