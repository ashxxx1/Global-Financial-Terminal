/**
 * Auth layer — Firebase Auth + a Firestore user profile document.
 *
 * The store is deliberately thin: components read `user`/`status` and call the
 * action functions. Everything that touches Firebase is funnelled through here
 * so the rest of the app never imports the SDK directly.
 */
import { create } from "zustand";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, isConfigured } from "./firebase";

export interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: unknown;
  lastSeenAt?: unknown;
}

type Status = "loading" | "signedIn" | "signedOut";

interface AuthState {
  user: Profile | null;
  status: Status;
  error: string | null;
  init: () => void;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/** Firebase error codes are not user-facing copy. Translate the common ones. */
function humanError(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  const map: Record<string, string> = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account with that email. Create one below.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with that email — sign in instead.",
    "auth/weak-password": "Password needs to be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in window closed before finishing.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and retry.",
    "auth/account-exists-with-different-credential":
      "That email is already registered with a different sign-in method.",
    "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
    "auth/network-request-failed": "Network problem — check your connection.",
    // Setup problems. These are the operator's fault, not the visitor's, so the
    // copy names the exact console switch instead of saying "try again".
    "auth/operation-not-allowed":
      "This sign-in method isn't enabled yet. Turn it on in Firebase console → Authentication → Sign-in method.",
    "auth/unauthorized-domain":
      "This domain isn't authorised for sign-in. Add it in Firebase console → Authentication → Settings → Authorized domains.",
    // Firebase reports this when the Email/Password provider row is off (or is
    // set to email-link only). Sign-UP can still succeed while sign-IN fails,
    // which strands anyone who just registered — so name it precisely.
    "auth/admin-restricted-operation":
      "Email sign-in is switched off for this project. Enable Firebase console → Authentication → Sign-in method → Email/Password (the first toggle, not just Email link).",
    "auth/configuration-not-found":
      "Firebase Authentication isn't set up for this project yet. Enable it in the console, then reload.",
  };
  return map[code] || (err instanceof Error ? err.message : "Something went wrong. Try again.");
}

function toProfile(u: User): Profile {
  return { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL };
}

/** Create the profile doc on first sign-in, refresh lastSeenAt after that. */
async function syncProfile(u: User): Promise<void> {
  if (!db) return;
  try {
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    const base = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lastSeenAt: serverTimestamp(),
    };
    if (snap.exists()) await setDoc(ref, base, { merge: true });
    else await setDoc(ref, { ...base, createdAt: serverTimestamp(), watchlist: [] });
  } catch {
    // A profile write failing must never block sign-in.
  }
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  status: "loading",
  error: null,

  init: () => {
    if (!isConfigured || !auth) {
      // No Firebase project wired up — run as an open guest session rather
      // than trapping the user behind a login that cannot possibly succeed.
      set({ status: "signedOut", user: null });
      return;
    }
    onAuthStateChanged(auth, (u) => {
      if (u) {
        set({ user: toProfile(u), status: "signedIn", error: null });
        void syncProfile(u);
      } else {
        set({ user: null, status: "signedOut" });
      }
    });
  },

  signInGoogle: async () => {
    if (!auth) return;
    try {
      set({ error: null });
      await signInWithPopup(auth, googleProvider);
    } catch (e) { set({ error: humanError(e) }); }
  },


  signInEmail: async (email, password) => {
    if (!auth) return;
    try {
      set({ error: null });
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) { set({ error: humanError(e) }); }
  },

  signUpEmail: async (name, email, password) => {
    if (!auth) return;
    try {
      set({ error: null });
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      set({ user: toProfile(cred.user) });
      await syncProfile(cred.user);
    } catch (e) { set({ error: humanError(e) }); }
  },

  resetPassword: async (email) => {
    if (!auth) return;
    try {
      set({ error: null });
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e) { set({ error: humanError(e) }); }
  },

  signOut: async () => {
    if (!auth) return;
    await fbSignOut(auth);
    set({ user: null, status: "signedOut" });
  },

  clearError: () => set({ error: null }),
}));

/** Auth is only enforced when Firebase is actually configured. */
export const authRequired = (): boolean =>
  isConfigured && import.meta.env.VITE_REQUIRE_AUTH !== "false";
