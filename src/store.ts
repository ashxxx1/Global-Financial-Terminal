/**
 * store.ts — app state. Only the user's own collections persist
 * (watchlist, alerts); everything else is session state.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { track } from "./lib/analytics";

/**
 * A watchlist entry — growth-plan item 75.
 *
 * Notes, tags and a target price make a watchlist a working document rather
 * than a list of tickers. `listId` groups entries so one account can keep
 * several lists without a second data structure.
 */
export interface WatchItem {
  symbol: string;
  name: string;
  country: string | null;
  /** Which list this belongs to. Absent means the default list. */
  listId?: string;
  note?: string;
  tags?: string[];
  /** Price the user is watching for, in the instrument's own currency. */
  targetPrice?: number;
  addedAt?: string;
}

/** A named watchlist. The default one is implicit and always present. */
export interface WatchList { id: string; name: string; }
/**
 * Alert kinds — growth-plan item 71.
 *
 * "price" is the original crossing alert. The others exist because a level
 * alert only catches what you already thought to watch for: a percentage move
 * catches the day something happens, a volume spike catches it before the news
 * does, and a news alert catches what the price has not reacted to yet.
 */
export type AlertKind = "price" | "percent" | "volume" | "news";

export interface PriceAlert {
  id: string;
  symbol: string;
  kind?: AlertKind;
  metric?: string;
  direction?: "above" | "below";
  /** Price level, percentage move, or volume multiple, depending on kind. */
  targetValue: number;
  createdAt: string;
  /** Set once fired, so a one-shot alert does not repeat every tick. */
  firedAt?: string;
  /** Alerts repeat by default only for news; the rest are one-shot. */
  repeat?: boolean;
}
export interface AlertNotice { id: string; text: string; time: string; }

/**
 * A saved view — growth-plan item 77.
 *
 * Deliberately a route plus the two layout toggles rather than a serialised
 * component tree: it survives any redesign, and a saved view that breaks when
 * the page changes is worse than none.
 */
export interface SavedView {
  id: string;
  name: string;
  path: string;
  nerdMode: boolean;
  highDensity: boolean;
  createdAt: string;
}

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
  /** Item 75 — annotate a watchlist entry in place. */
  updateWatch: (symbol: string, patch: Partial<Omit<WatchItem, "symbol">>) => void;
  watchLists: WatchList[];
  addWatchList: (name: string) => string;
  removeWatchList: (id: string) => void;
  activeList: string | null;
  setActiveList: (id: string | null) => void;

  /** Item 77 — saved views: a named route plus the layout toggles. */
  savedViews: SavedView[];
  saveView: (v: Omit<SavedView, "id" | "createdAt">) => void;
  removeView: (id: string) => void;

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
  /** One-shot alerts record when they fired so they do not repeat. */
  markAlertFired: (id: string) => void;
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

      updateWatch: (symbol, patch) =>
        set({ watchlist: get().watchlist.map((w) => (w.symbol === symbol ? { ...w, ...patch } : w)) }),
      watchLists: [],
      addWatchList: (name) => {
        const id = `wl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set({ watchLists: [...get().watchLists, { id, name }] });
        return id;
      },
      removeWatchList: (id) =>
        set({
          watchLists: get().watchLists.filter((l) => l.id !== id),
          // Entries in a deleted list fall back to the default rather than
          // disappearing with it — losing a note the user wrote would be worse
          // than an entry showing up somewhere unexpected.
          watchlist: get().watchlist.map((w) => (w.listId === id ? { ...w, listId: undefined } : w)),
          activeList: get().activeList === id ? null : get().activeList,
        }),
      activeList: null,
      setActiveList: (activeList) => set({ activeList }),

      savedViews: [],
      saveView: (v) =>
        set({
          savedViews: [
            ...get().savedViews.filter((x) => x.path !== v.path || x.name !== v.name),
            { ...v, id: `view-${Date.now()}`, createdAt: new Date().toISOString() },
          ].slice(-12),
        }),
      removeView: (id) => set({ savedViews: get().savedViews.filter((x) => x.id !== id) }),

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
      markAlertFired: (id) =>
        set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, firedAt: new Date().toISOString() } : a)) }),
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
        watchLists: s.watchLists,
        savedViews: s.savedViews,
        activated: s.activated,
      }),
    }
  )
);
