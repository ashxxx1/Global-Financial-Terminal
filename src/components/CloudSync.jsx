/**
 * CloudSync — cross-device sync for the user's terminal collections.
 *
 * localStorage (via the store's persist middleware) is always the offline
 * mirror. When a real user is signed in, this component:
 *   1. loads their saved watchlist + alerts from Firestore on login
 *      (cloud wins if present; otherwise seeds the cloud from local), and
 *   2. writes changes back, debounced.
 *
 * Everything fails soft: if Firestore is unreachable or rules deny access,
 * the app keeps working entirely on localStorage.
 */
import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import useTerminalStore from "../store/terminalStore";

export default function CloudSync() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const loadedForUid = useRef(null);
  const saveTimer = useRef(null);
  const lastWritten = useRef("");

  // ── Load on login ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadedForUid.current = null;
    if (!uid) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;
        const prefs = snap.exists() ? snap.data().terminalPrefs : null;
        const store = useTerminalStore.getState();

        if (prefs && (Array.isArray(prefs.watchlist) || Array.isArray(prefs.alerts))) {
          // Cloud is the source of truth once it exists.
          useTerminalStore.setState({
            watchlist: Array.isArray(prefs.watchlist) ? prefs.watchlist : store.watchlist,
            alerts: Array.isArray(prefs.alerts) ? prefs.alerts : store.alerts,
          });
          lastWritten.current = serialize(prefs.watchlist, prefs.alerts);
        } else {
          // First time on this account — seed the cloud from whatever is local.
          const payload = { watchlist: store.watchlist, alerts: store.alerts };
          await setDoc(doc(db, "users", uid), { terminalPrefs: payload }, { merge: true });
          lastWritten.current = serialize(store.watchlist, store.alerts);
        }
      } catch (e) {
        // permission-denied / offline — localStorage remains the source of truth
        console.warn("CloudSync: load skipped —", e?.code || e?.message);
      } finally {
        if (!cancelled) loadedForUid.current = uid;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // ── Save on change (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = useTerminalStore.subscribe((state) => {
      if (loadedForUid.current !== uid) return; // don't write before initial load
      const snapshot = serialize(state.watchlist, state.alerts);
      if (snapshot === lastWritten.current) return; // watchlist/alerts unchanged
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await setDoc(
            doc(db, "users", uid),
            { terminalPrefs: { watchlist: state.watchlist, alerts: state.alerts } },
            { merge: true }
          );
          lastWritten.current = snapshot;
        } catch (e) {
          console.warn("CloudSync: save skipped —", e?.code || e?.message);
        }
      }, 1200);
    });

    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [uid]);

  return null;
}

function serialize(watchlist, alerts) {
  const w = (watchlist || []).map((s) => s.symbol + "@" + (s.country || "")).join(",");
  const a = (alerts || []).map((x) => x.id).join(",");
  return w + "|" + a;
}
