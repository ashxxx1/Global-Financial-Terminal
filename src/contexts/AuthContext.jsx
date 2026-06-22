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
  runTransaction,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../services/firebase";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "aarushkapoor23@gmail.com";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // "pending" | "approved" | "rejected"
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // Sign in with Google
  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const counterRef = doc(db, "counters", "users");

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) {
        // New user — create their document as pending
        const counterSnap = await transaction.get(counterRef);
        let nextId = 1;
        if (counterSnap.exists()) {
          nextId = (counterSnap.data().count || 0) + 1;
        }
        transaction.set(counterRef, { count: nextId });
        transaction.set(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          idNum: nextId,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          status: user.email === ADMIN_EMAIL ? "approved" : "pending",
          requestedAt: serverTimestamp(),
          approvedAt: user.email === ADMIN_EMAIL ? serverTimestamp() : null,
          approvedBy: user.email === ADMIN_EMAIL ? ADMIN_EMAIL : null,
          lastLogin: serverTimestamp(),
          bio: "Institutional macro research & active swing trading.",
          reputation: "Analyst",
          friendsList: [],
          friendRequests: []
        });
      } else {
        // Existing user — update last login & ensure they have idNum
        const data = snap.data();
        const updateData = {
          lastLogin: serverTimestamp(),
          bio: data.bio || "Institutional macro research & active swing trading.",
          reputation: data.reputation || "Analyst",
          friendsList: data.friendsList || [],
          friendRequests: data.friendRequests || []
        };
        if (data.idNum === undefined) {
          const counterSnap = await transaction.get(counterRef);
          let nextId = 1;
          if (counterSnap.exists()) {
            nextId = (counterSnap.data().count || 0) + 1;
          }
          transaction.set(counterRef, { count: nextId });
          updateData.idNum = nextId;
        }
        transaction.update(userRef, updateData);
      }
    });

    return result;
  }

  async function updateUserProfile(fields) {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, fields);
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
        setUserProfileData(null);
        return;
      }

      // Listen to this user's Firestore doc in real-time
      const userRef = doc(db, "users", user.uid);
      const unsubFirestore = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserStatus(data.status || (user.email === ADMIN_EMAIL ? "approved" : "pending"));
          setUserProfileData(data);
        } else {
          setUserProfileData(null);
          if (user.email === ADMIN_EMAIL) {
            setUserStatus("approved");
          }
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
    userProfileData,
    isAdmin,
    loading,
    signInWithGoogle,
    updateUserProfile,
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
