/**
 * Auth layer — Firebase Auth + a Firestore user profile document.
 *
 * The store is deliberately thin: components read `user`/`status` and call the
 * action functions. Everything that touches Firebase is funnelled through here
 * so the rest of the app never imports the SDK directly.
 */
import { create } from "zustand";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  getAdditionalUserInfo,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp,
  updateDoc, onSnapshot, query, collection, where, getDocs,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, googleProvider, isConfigured } from "./firebase";
import { identify, track, resetAnalytics } from "./analytics";

export interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bannerURL?: string | null;
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

/** "ada.lovelace@x.com" → "Ada Lovelace". Good enough to greet someone by. */
function deriveName(email: string): string {
  const local = email.split("@")[0] || "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 40);
}

function toProfile(u: User): Profile {
  return { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL, bannerURL: null };
}

/** Create the profile doc on first sign-in, refresh lastSeenAt after that. */
/* ── Sequential member numbers ────────────────────────────────────────────
   Every account gets a permanent #N, assigned once and never reused. Founder
   accounts are pinned by email so they keep their number regardless of when
   the document happens to be written; everyone else draws the next value from
   a single counter document, inside a transaction so two simultaneous signups
   can't collide on the same number. */

const RESERVED_MEMBER_NO: Record<string, number> = {
  "aarushkapoor23@gmail.com": 1,
};
const COUNTER_START = 3; // 1 and 2 are reserved above / by prefix

function reservedMemberNo(email: string | null): number | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  if (RESERVED_MEMBER_NO[e]) return RESERVED_MEMBER_NO[e];
  // Anchita's exact address isn't known here; match the local part so the
  // number lands on the right person whichever provider they signed up with.
  if (e.split("@")[0].startsWith("anchita")) return 2;
  return null;
}

/** Draw the next member number, or null if the counter is unavailable. */
async function nextMemberNo(): Promise<number | null> {
  if (!db) return null;
  const ref = doc(db, "meta", "memberCounter");
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const next = snap.exists() ? Number(snap.data().next) || COUNTER_START : COUNTER_START;
      tx.set(ref, { next: next + 1 }, { merge: true });
      return next;
    });
  } catch {
    return null; // rules or offline — never block sign-in over a vanity number
  }
}

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
    if (snap.exists()) {
      // Backfill for accounts created before member numbers existed.
      const existing = snap.data().memberNo;
      const patch = typeof existing === "number"
        ? base
        : { ...base, memberNo: reservedMemberNo(u.email) ?? (await nextMemberNo()) };
      await setDoc(ref, patch, { merge: true });
    } else {
      const memberNo = reservedMemberNo(u.email) ?? (await nextMemberNo());
      await setDoc(ref, { ...base, createdAt: serverTimestamp(), watchlist: [], memberNo });
    }
  } catch {
    // A profile write failing must never block sign-in.
  }
}

/** The signed-in user's permanent member number, or null if not yet assigned. */
export async function fetchMemberNo(): Promise<number | null> {
  const u = auth?.currentUser;
  if (!db || !u) return null;
  try {
    const snap = await getDoc(doc(db, "users", u.uid));
    const n = snap.exists() ? snap.data().memberNo : null;
    return typeof n === "number" ? n : null;
  } catch { return null; }
}

export const useAuth = create<AuthState>()((set) => ({
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
        identify(u.uid, { email: u.email ?? undefined, name: u.displayName ?? undefined });
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
      const res = await signInWithPopup(auth, googleProvider);
      track(getAdditionalUserInfo(res)?.isNewUser ? "signed_up" : "signed_in", { method: "google" });
    } catch (e) { set({ error: humanError(e) }); }
  },


  signInEmail: async (email, password) => {
    if (!auth) return;
    try {
      set({ error: null });
      await signInWithEmailAndPassword(auth, email.trim(), password);
      track("signed_in", { method: "email" });
    } catch (e) { set({ error: humanError(e) }); }
  },

  signUpEmail: async (name, email, password) => {
    if (!auth) return;
    try {
      set({ error: null });
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Item 44: signup asks for email + password only. A readable display
      // name is derived from the address rather than costing a third field.
      const display = name.trim() || deriveName(email);
      if (display) await updateProfile(cred.user, { displayName: display });
      set({ user: toProfile(cred.user) });
      track("signed_up", { method: "email" });
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
    track("signed_out");
    resetAnalytics();
    set({ user: null, status: "signedOut" });
  },

  clearError: () => set({ error: null }),
}));

/** Auth is only enforced when Firebase is actually configured. */
export const authRequired = (): boolean =>
  isConfigured && import.meta.env.VITE_REQUIRE_AUTH !== "false";

/* ── GDPR: data portability & right to erasure (growth-plan item 13) ────────
   Every byte we hold on a user is either in their Auth record, their one
   Firestore profile doc, or the local `gft-v1` store. Export gathers all
   three; delete removes the profile doc then the Auth user. Nothing here
   touches another user's data — the security rules guarantee it. */

/** Gather everything we hold on the signed-in user into a plain object. */
export async function exportUserData(): Promise<Record<string, unknown>> {
  const u = auth?.currentUser ?? null;
  let local: unknown = null;
  try { local = JSON.parse(localStorage.getItem("gft-v1") || "null"); } catch { /* private mode */ }
  let profile: unknown = null;
  if (db && u) {
    try {
      const snap = await getDoc(doc(db, "users", u.uid));
      profile = snap.exists() ? snap.data() : null;
    } catch { /* offline or rules — fall through with null */ }
  }
  return {
    exportedAt: new Date().toISOString(),
    note: "Everything Global Financial Terminal holds about your account.",
    account: u
      ? {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          createdAt: u.metadata.creationTime,
          lastSignInAt: u.metadata.lastSignInTime,
          providers: u.providerData.map((p) => p.providerId),
        }
      : null,
    profile,
    app: local,
  };
}

/** Signalled to the UI when a fresh sign-in is needed before deletion. */
export class ReauthRequired extends Error {
  constructor(public method: "password" | "google") { super("reauth-required"); }
}

/**
 * Permanently delete the account: the Firestore profile doc, then the Auth
 * user. Firebase blocks deletion unless the login is recent; on that error we
 * reauthenticate (password inline, Google via popup) and retry once. If a
 * password is needed but not supplied, we throw `ReauthRequired` so the UI can
 * ask for it.
 */
export async function deleteAccount(password?: string): Promise<void> {
  const u = auth?.currentUser ?? null;
  if (!auth || !u) throw new Error("You're not signed in.");

  const purge = async () => {
    if (db) { try { await deleteDoc(doc(db, "users", u.uid)); } catch { /* already gone */ } }
    await deleteUser(u);
  };

  try {
    await purge();
  } catch (e) {
    if ((e as { code?: string })?.code !== "auth/requires-recent-login") throw e;
    const usesPassword = u.providerData.some((p) => p.providerId === "password");
    if (usesPassword) {
      if (!password) throw new ReauthRequired("password");
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email || "", password));
    } else {
      await reauthenticateWithPopup(u, googleProvider);
    }
    await purge();
  }

  track("account_deleted");
  resetAnalytics();
  useAuth.setState({ user: null, status: "signedOut" });
}

/* ── Public profile (any user, by uid) ─────────────────────────────────── */

export interface PublicProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  bannerURL: string | null;
  username: string | null;
  memberNo: number | null;
  createdAt: Date | null;
}

/** Live-snapshot hook that reads another user's public profile doc. */
export function usePublicProfile(uid: string | undefined): { profile: PublicProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) { setLoading(false); return; }
    setLoading(true);
    return onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            uid,
            displayName: d.displayName ?? null,
            photoURL: d.photoURL ?? null,
            bannerURL: typeof d.bannerURL === "string" ? d.bannerURL : null,
            username: d.username ?? null,
            memberNo: typeof d.memberNo === "number" ? d.memberNo : null,
            createdAt: d.createdAt?.toDate?.() ?? null,
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  return { profile, loading };
}

/* ── Profile mutations ─────────────────────────────────────────────────── */

/** Update the signed-in user's display name in Auth + Firestore. */
export async function updateDisplayName(name: string): Promise<void> {
  const u = auth?.currentUser;
  if (!u) throw new Error("Not signed in.");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name can't be empty.");
  if (trimmed.length > 60) throw new Error("Name is too long (60 char max).");
  await updateProfile(u, { displayName: trimmed });
  if (db) {
    await updateDoc(doc(db, "users", u.uid), { displayName: trimmed }).catch(() => {});
  }
  // Refresh the local auth store so the UI updates immediately.
  useAuth.setState({ user: { ...useAuth.getState().user!, displayName: trimmed } });
}

/** Update the signed-in user's username. Must be unique across all users. */
export async function updateUsername(username: string): Promise<void> {
  const u = auth?.currentUser;
  if (!u || !db) throw new Error("Not signed in.");
  const clean = username.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{2,20}$/.test(clean)) {
    throw new Error("Username must be 2–20 lowercase letters, numbers, or underscores.");
  }
  // Uniqueness check: query for any other user with this username.
  const q = query(collection(db, "users"), where("username", "==", clean));
  const snap = await getDocs(q);
  const taken = snap.docs.some((d) => d.id !== u.uid);
  if (taken) throw new Error(`"${clean}" is already taken — pick another.`);
  await updateDoc(doc(db, "users", u.uid), { username: clean });
}

/** Upload a new avatar image to Storage and update Auth + Firestore. */
export async function updateAvatarPhoto(file: File): Promise<void> {
  const u = auth?.currentUser;
  if (!u) throw new Error("Not signed in.");
  if (!storage) throw new Error("Storage is not configured.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are accepted.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 8);
  const path = `avatars/${u.uid}/avatar_${Date.now()}.${ext}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);

  await updateProfile(u, { photoURL: url });
  if (db) {
    await updateDoc(doc(db, "users", u.uid), { photoURL: url }).catch(() => {});
  }
  useAuth.setState({ user: { ...useAuth.getState().user!, photoURL: url } });
}

/** Upload a new wallpaper image for the user profile banner. */
export async function updateBannerPhoto(file: File): Promise<void> {
  const u = auth?.currentUser;
  if (!u) throw new Error("Not signed in.");
  if (!storage) throw new Error("Storage is not configured.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are accepted.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Wallpaper must be under 8 MB.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 8);
  const path = `banners/${u.uid}/banner_${Date.now()}.${ext}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);

  if (db) {
    await updateDoc(doc(db, "users", u.uid), { bannerURL: url }).catch(() => {});
  }
  useAuth.setState({ user: { ...useAuth.getState().user!, bannerURL: url } });
}

/** Format a number as an ordinal string: 1→"1st", 2→"2nd", 42→"42nd". */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
