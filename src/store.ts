/**
 * store.ts — app state. Only the user's own collections persist
 * (watchlist, alerts); everything else is session state.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { track } from "./lib/analytics";

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

  /** Onboarding has been shown and dismissed or completed. */
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  /** Set once, the first time the user takes any value action. */
  activated: boolean;
  markActivated: (via: string) => void;
}

export const useTerminal = create<TerminalState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addWatch: (w) => {
        if (get().watchlist.some((x) => x.symbol === w.symbol)) return;
        set({ watchlist: [...get().watchlist, w] });
        track("watchlist_added", { symbol: w.symbol });
        get().markActivated("watchlist_added");
      },
      removeWatch: (symbol) => {
        set({ watchlist: get().watchlist.filter((x) => x.symbol !== symbol) });
        track("watchlist_removed", { symbol });
      },
      inWatchlist: (symbol) => get().watchlist.some((x) => x.symbol === symbol),

      alerts: [],
      addAlert: (a) => {
        track("alert_created", { symbol: a.symbol });
        get().markActivated("alert_created");
        return set({
          alerts: [
            ...get().alerts,
            { ...a, id: "al_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString() },
          ],
        });
      },
      removeAlert: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),
      notices: [],
      fireAlert: (alert, price) => {
        track("alert_fired", { symbol: alert.symbol });
        return set({
          alerts: get().alerts.filter((a) => a.id !== alert.id),
          notices: [
            { id: "n_" + Date.now(), text: `${alert.symbol} hit ${price.toFixed(2)} — ${alert.direction} ${alert.price} triggered`, time: new Date().toLocaleTimeString() },
            ...get().notices,
          ].slice(0, 20),
        });
      },
      clearNotices: () => set({ notices: [] }),

      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),

      activated: false,
      // Activation fires exactly once per user — the guard is what makes the
      // funnel number trustworthy rather than a running total of actions.
      markActivated: (via) => {
        if (get().activated) return;
        set({ activated: true });
        track("activated", { via });
      },

      searchOpen: false,
      setSearchOpen: (v) => {
        if (v) track("search_opened");
        set({ searchOpen: v });
      },
    }),
    {
      name: "gft-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ watchlist: s.watchlist, alerts: s.alerts, onboarded: s.onboarded, activated: s.activated }),
    }
  )
);
