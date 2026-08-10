/**
 * Watchlist sync — local zustand store ⇄ Firestore user document.
 *
 * The store stays the single source of truth for the UI (so the app still works
 * offline and signed out); Firestore is a mirror keyed to the account. On sign
 * in we merge rather than overwrite, so stars added as a guest are not lost.
 */
import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import { useTerminal, type WatchItem } from "../store";

async function pull(uid: string): Promise<WatchItem[]> {
  if (!db) return [];
  const snap = await getDoc(doc(db, "users", uid));
  const raw = snap.exists() ? (snap.data().watchlist as WatchItem[] | undefined) : undefined;
  return Array.isArray(raw) ? raw : [];
}

async function push(uid: string, watchlist: WatchItem[]): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, "users", uid), { watchlist }, { merge: true });
}

export function useWatchlistSync(): void {
  const uid = useAuth((s) => s.user?.uid ?? null);
  const watchlist = useTerminal((s) => s.watchlist);
  const merged = useRef(false);

  // On sign-in: merge the remote list into the local one, once.
  useEffect(() => {
    if (!uid || !db) { merged.current = false; return; }
    let cancelled = false;
    (async () => {
      try {
        const remote = await pull(uid);
        if (cancelled) return;
        const local = useTerminal.getState().watchlist;
        const bySymbol = new Map(remote.map((w) => [w.symbol, w]));
        for (const w of local) bySymbol.set(w.symbol, w);
        const next = [...bySymbol.values()];
        if (next.length !== local.length || remote.length !== next.length) {
          useTerminal.setState({ watchlist: next });
        }
        merged.current = true;
        await push(uid, next);
      } catch {
        merged.current = true; // never block the UI on a sync failure
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  // After the merge, mirror every local change up.
  useEffect(() => {
    if (!uid || !db || !merged.current) return;
    const t = setTimeout(() => { void push(uid, watchlist); }, 600); // debounce rapid starring
    return () => clearTimeout(t);
  }, [uid, watchlist]);
}
