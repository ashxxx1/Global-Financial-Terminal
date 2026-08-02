/**
 * Firebase bootstrap.
 *
 * Config comes from VITE_FIREBASE_* env vars (see .env.example). If they are
 * absent the app still boots — `isConfigured` is false and the auth layer
 * falls back to a local-only guest session, so a fresh clone runs without
 * anyone having to provision a Firebase project first.
 */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isConfigured) {
  const app = initializeApp(cfg);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = dbInstance;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
