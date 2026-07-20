/**
 * store.ts — app state. Only the user's own collections persist
 * (watchlist, alerts); everything else is session state.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WatchItem { symbol: string; name: string; country: string | null; }
export interface PriceAlert {
  id: string; symbol: string; price: number; direction: "above" | "below";
  createdAt: string;
}
export interface AlertNotice { id: string; text: string; time: string; }

interface TerminalState {
  watchlist: WatchItem[];
  addWatch: (w: WatchItem) => void;
  removeWatch: (symbol: string) => void;
  inWatchlist: (symbol: string) => boolean;

  alerts: PriceAlert[];
  addAlert: (a: Omit<PriceAlert, "id" | "createdAt">) => void;
  removeAlert: (id: string) => void;
  notices: AlertNotice[];
  fireAlert: (alert: PriceAlert, price: number) => void;
  clearNotices: () => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}

export const useTerminal = create<TerminalState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addWatch: (w) => {
        if (get().watchlist.some((x) => x.symbol === w.symbol)) return;
        set({ watchlist: [...get().watchlist, w] });
      },
      removeWatch: (symbol) => set({ watchlist: get().watchlist.filter((x) => x.symbol !== symbol) }),
      inWatchlist: (symbol) => get().watchlist.some((x) => x.symbol === symbol),

      alerts: [],
      addAlert: (a) =>
        set({
          alerts: [
            ...get().alerts,
            { ...a, id: "al_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString() },
          ],
        }),
      removeAlert: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),
      notices: [],
      fireAlert: (alert, price) =>
        set({
          alerts: get().alerts.filter((a) => a.id !== alert.id),
          notices: [
            { id: "n_" + Date.now(), text: `${alert.symbol} hit ${price.toFixed(2)} — ${alert.direction} ${alert.price} triggered`, time: new Date().toLocaleTimeString() },
            ...get().notices,
          ].slice(0, 20),
        }),
      clearNotices: () => set({ notices: [] }),

      searchOpen: false,
      setSearchOpen: (v) => set({ searchOpen: v }),
    }),
    {
      name: "gft-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ watchlist: s.watchlist, alerts: s.alerts }),
    }
  )
);
