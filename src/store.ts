/**
 * store.ts — app state. Only the user's own collections persist
 * (watchlist, alerts); everything else is session state.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { track } from "./lib/analytics";

export interface WatchItem { symbol: string; name: string; country: string | null; }
export interface PriceAlert {
  id: string;
  symbol: string;
  metric?: string;
  direction?: "above" | "below";
  targetValue: number;
  createdAt: string;
}
export interface AlertNotice { id: string; text: string; time: string; }

/**
 * One holding — growth-plan item 73. Manual entry and CSV only; no brokerage
 * integration, which would need regulated credentials we have no business
 * handling.
 */
export interface Position {
  id: string;
  symbol: string;
  name: string;
  country: string | null;
  /** Share count. Fractional allowed. */
  shares: number;
  /** Cost per share, in the instrument's own quoted currency. */
  costPerShare: number;
  currency: string;
  addedAt: string;
  note?: string;
}

interface TerminalState {
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;

  watchlist: WatchItem[];
  addWatch: (w: WatchItem) => void;
  removeWatch: (symbol: string) => void;
  inWatchlist: (symbol: string) => boolean;

  /** Holdings — growth-plan items 73 & 74. */
  positions: Position[];
  addPosition: (p: Omit<Position, "id" | "addedAt">) => void;
  updatePosition: (id: string, patch: Partial<Omit<Position, "id">>) => void;
  removePosition: (id: string) => void;
  importPositions: (rows: Omit<Position, "id" | "addedAt">[]) => number;

  alerts: PriceAlert[];
  addAlert: (a: Omit<PriceAlert, "id" | "createdAt">) => void;
  removeAlert: (id: string) => void;
  notices: AlertNotice[];
  fireAlert: (alert: PriceAlert, price: number) => void;
  clearNotices: () => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;

  /** Dense technical chrome is opt-in. Default off keeps the UI calm. */
  nerdMode: boolean;
  setNerdMode: (v: boolean) => void;

  highDensity: boolean;
  setHighDensity: (v: boolean) => void;

  contextMenu: { x: number; y: number; symbol?: string; type: "stock" | "country" } | null;
  setContextMenu: (v: { x: number; y: number; symbol?: string; type: "stock" | "country" } | null) => void;


  /** Recently opened symbols, most recent first — growth-plan item 78. */
  recent: string[];
  pushRecent: (symbol: string) => void;

  /** Saved A vs B compare pairs (max 12). */
  savedCompare: Array<{ a: string; b: string }>;
  saveComparePair: (a: string, b: string) => void;
  removeComparePair: (a: string, b: string) => void;

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
      chatOpen: false,
  setChatOpen: (chatOpen) => set({ chatOpen }),

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

      positions: [],
      addPosition: (p) => {
        set({
          positions: [
            ...get().positions,
            { ...p, id: `${p.symbol}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, addedAt: new Date().toISOString() },
          ],
        });
        track("position_added", { symbol: p.symbol });
      },
      updatePosition: (id, patch) =>
        set({ positions: get().positions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }),
      removePosition: (id) => set({ positions: get().positions.filter((x) => x.id !== id) }),
      importPositions: (rows) => {
        const now = Date.now();
        const made = rows.map((p, i) => ({
          ...p,
          id: `${p.symbol}-${now}-${i}`,
          addedAt: new Date().toISOString(),
        }));
        set({ positions: [...get().positions, ...made] });
        track("positions_imported", { count: made.length });
        return made.length;
      },

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
            { id: "n_" + Date.now(), text: `${alert.symbol} hit ${price.toFixed(2)} — ${alert.direction} ${alert.targetValue} triggered`, time: new Date().toLocaleTimeString() },
            ...get().notices,
          ].slice(0, 20),
        });
      },
      clearNotices: () => set({ notices: [] }),

      nerdMode: false,
      setNerdMode: (v) => set({ nerdMode: v }),

      highDensity: false,
      setHighDensity: (v) => set({ highDensity: v }),

      contextMenu: null,
      setContextMenu: (v) => set({ contextMenu: v }),


      // Item 78: "jump back in" beats an empty screen for a returning user.
      recent: [],
      pushRecent: (symbol) =>
        set({ recent: [symbol, ...get().recent.filter((s) => s !== symbol)].slice(0, 8) }),

      savedCompare: [],
      saveComparePair: (a, b) => {
        const A = a.toUpperCase();
        const B = b.toUpperCase();
        if (!A || !B || A === B) return;
        const next = [{ a: A, b: B }, ...get().savedCompare.filter((p) => !(p.a === A && p.b === B) && !(p.a === B && p.b === A))];
        set({ savedCompare: next.slice(0, 12) });
        track("compare_saved", { a: A, b: B });
      },
      removeComparePair: (a, b) => {
        const A = a.toUpperCase();
        const B = b.toUpperCase();
        set({
          savedCompare: get().savedCompare.filter((p) => !(p.a === A && p.b === B) && !(p.a === B && p.b === A)),
        });
      },

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
      partialize: (s) => ({
        watchlist: s.watchlist,
        alerts: s.alerts,
        recent: s.recent,
        savedCompare: s.savedCompare,
        nerdMode: s.nerdMode,
        highDensity: s.highDensity,
        onboarded: s.onboarded,
        positions: s.positions,
        activated: s.activated,
      }),
    }
  )
);
