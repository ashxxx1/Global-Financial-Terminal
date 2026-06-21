/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../services/firebase";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "aarushkapoor23@gmail.com";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // "pending" | "approved" | "rejected"
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // Sign in with Google
  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // New user — create their document as pending
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        status: user.email === ADMIN_EMAIL ? "approved" : "pending",
        requestedAt: serverTimestamp(),
        approvedAt: user.email === ADMIN_EMAIL ? serverTimestamp() : null,
        approvedBy: user.email === ADMIN_EMAIL ? ADMIN_EMAIL : null,
        lastLogin: serverTimestamp(),
      });
    } else {
      // Existing user — update last login
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    }

    return result;
  }

  async function logout() {
    await signOut(auth);
    setUserStatus(null);
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setUserStatus(null);
        return;
      }

      // Admin is always approved
      if (user.email === ADMIN_EMAIL) {
        setUserStatus("approved");
        setLoading(false);
        return;
      }

      // Listen to this user's Firestore doc in real-time
      const userRef = doc(db, "users", user.uid);
      const unsubFirestore = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserStatus(snap.data().status);
        }
        setLoading(false);
      });

      return () => unsubFirestore();
    });

    return () => unsubAuth();
  }, []);

  const value = {
    currentUser,
    userStatus,
    isAdmin,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
