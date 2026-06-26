/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../services/firebase";

const ADMIN_EMAILS = ["aarushkapoor23@gmail.com", "anchitaduggal7@gmail.com", "anchitaduggal@7gmail.com"];

const AuthContext = createContext(null);

// Detect mobile browsers (Safari on iOS blocks popups)
function isMobileBrowser() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Shared function to create/update the user Firestore doc after sign-in
async function upsertUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const counterRef = doc(db, "counters", "users");

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (!snap.exists()) {
      // Do not create document here, let SetupUsername handle creation
    } else {
      const data = snap.data();
      const updateData = {
        lastLogin: serverTimestamp(),
        bio: data.bio || "Institutional macro research & active swing trading.",
        reputation: data.reputation || "Analyst",
        friendsList: data.friendsList || [],
        friendRequests: data.friendRequests || [],
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
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);

  // Sign in — use redirect on mobile (popup blocked by iOS Safari)
  async function signInWithGoogle() {
    if (isMobileBrowser()) {
      // Redirect flow: stores intent and redirects to Google,
      // then getRedirectResult() below picks up the result on return.
      await signInWithRedirect(auth, googleProvider);
      return; // page will redirect away — no further code runs
    }
    // Desktop: popup is fine
    const result = await signInWithPopup(auth, googleProvider);
    await upsertUserDoc(result.user);
    return result;
  }

  async function updateUserProfile(fields) {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, fields, { merge: true });
  }

  async function logout() {
    await signOut(auth);
    setUserStatus(null);
  }

  useEffect(() => {
    // Handle the redirect result when returning from Google on mobile
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await upsertUserDoc(result.user);
        }
      })
      .catch((err) => {
        console.warn("Redirect result error:", err.code, err.message);
      });

    // Listen to auth state
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setUserStatus(null);
        setUserProfileData(null);
        return;
      }

      const loadProfile = (snapData) => {
        let data = snapData;
        const localProfileStr = localStorage.getItem("gf_user_profile_" + user.uid);
        if (localProfileStr) {
          try {
            const localData = JSON.parse(localProfileStr);
            data = { ...(data || {}), ...localData };
          } catch (e) {
            console.error("Local profile parse error:", e);
          }
        }
        if (data) {
          if (data.isSuspended) {
            setUserStatus("suspended");
          } else {
            setUserStatus(
              data.status || (ADMIN_EMAILS.includes(user.email) ? "approved" : "pending")
            );
          }
          setUserProfileData(data);
        } else {
          setUserProfileData(null);
          if (ADMIN_EMAILS.includes(user.email)) {
            setUserStatus("approved");
          } else {
            setUserStatus("pending");
          }
        }
      };

      // Listen to this user's Firestore doc in real-time
      const userRef = doc(db, "users", user.uid);
      const unsubFirestore = onSnapshot(
        userRef,
        (snap) => {
          loadProfile(snap.exists() ? snap.data() : null);
          setLoading(false);
        },
        (err) => {
          console.error("Firestore snapshot error:", err);
          // Fallback if snap fails (e.g. permission-denied)
          loadProfile(null);
          setLoading(false);
        }
      );

      // Listen for local profile updates
      const handleLocalUpdate = () => {
        loadProfile(null); // reload from local storage / cache
      };
      window.addEventListener("localProfileUpdated", handleLocalUpdate);

      return () => {
        unsubFirestore();
        window.removeEventListener("localProfileUpdated", handleLocalUpdate);
      };
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
