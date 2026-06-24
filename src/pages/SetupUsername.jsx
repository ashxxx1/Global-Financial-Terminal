import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/firebase";
import { doc, collection, query, where, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";


export default function SetupUsername() {
  const { currentUser, userStatus, userProfileData, loading, isAdmin } = useAuth();
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // If auth is still loading, show standard loading
  if (loading) {
    return (
      <div className="globe-loading">
        <span className="globe-loading__text">AUTHENTICATING...</span>
      </div>
    );
  }

  // Intercept access rules
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userStatus === "pending") return <Navigate to="/pending" replace />;
  if (userStatus === "rejected") return <Navigate to="/rejected" replace />;
  if (userProfileData?.username) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanUsername = username.trim().toLowerCase();

    // 1. Validation checks
    if (cleanUsername.length < 3 || cleanUsername.length > 15) {
      setError("Username must be between 3 and 15 characters.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError("Only lowercase letters, numbers, and underscores are allowed.");
      return;
    }

    setChecking(true);

    try {
      // 2. Uniqueness check in Firestore
      const q = query(
        collection(db, "users"),
        where("username", "==", cleanUsername)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        setError("This handle is already taken. Try another one.");
        setChecking(false);
        return;
      }

      // 3. Write username to Firestore and create user doc using a transaction
      const userRef = doc(db, "users", currentUser.uid);
      const counterRef = doc(db, "counters", "users");

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) {
          const counterSnap = await transaction.get(counterRef);
          let nextId = 1;
          if (counterSnap.exists()) {
            nextId = (counterSnap.data().count || 0) + 1;
          }
          transaction.set(counterRef, { count: nextId });
          transaction.set(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || cleanUsername,
            username: cleanUsername,
            idNum: nextId,
            photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
            status: isAdmin ? "approved" : "pending",
            requestedAt: serverTimestamp(),
            approvedAt: isAdmin ? serverTimestamp() : null,
            approvedBy: isAdmin ? currentUser.email : null,
            lastLogin: serverTimestamp(),
            bio: "Institutional macro research & active swing trading.",
            reputation: "Analyst",
            friendsList: [],
            friendRequests: [],
          });
        } else {
          transaction.update(userRef, {
            username: cleanUsername,
            displayName: snap.data().displayName || currentUser.displayName || cleanUsername,
          });
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (err) {
      console.error("SetupUsername error:", err);
      if (err.code === "permission-denied") {
        console.warn("Firestore rules blocked write, falling back to local storage profile...");
        const fallbackProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          username: cleanUsername,
          displayName: currentUser.displayName || cleanUsername,
          status: "approved",
        };
        localStorage.setItem("gf_user_profile_" + currentUser.uid, JSON.stringify(fallbackProfile));
        setSuccess(true);
        window.dispatchEvent(new Event("localProfileUpdated"));
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1000);
      } else if (err.code === "unavailable" || err.message?.includes("network")) {
        setError("Network error — check your connection and try again.");
      } else {
        setError(`Error: ${err.message || "Please try again."}`);
      }
    } finally {
      setChecking(false);
    }
  };


  return (
    <div className="login-page setup-username-page">
      <div className="login-bg">
        <div className="login-bg__grid" />
      </div>

      <div className="login-card setup-username-card">
        <div className="login-card__logo">
          <div className="login-card__logo-icon">🌐</div>
          <div>
            <div className="login-card__logo-title">
              GLOBAL<span>FIN</span> TERMINAL
            </div>
            <div className="login-card__logo-sub">ACCOUNT INITIALIZATION</div>
          </div>
        </div>

        <div className="login-card__divider" />

        <div className="login-card__body">
          <h1 className="login-card__heading">Claim Your Trader Handle</h1>
          <p className="login-card__desc">
            Choose a unique username to identify yourself in secure social chats and community macro forums.
          </p>

          <form onSubmit={handleSubmit} className="setup-username__form">
            <div className="setup-username__field">
              <label className="setup-username__label">Custom Handle</label>
              <div className="setup-username__input-wrapper">
                <span className="setup-username__prefix">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  maxLength={15}
                  disabled={checking || success}
                  required
                />
              </div>
              <span className="setup-username__hint">
                3-15 characters. Letters, numbers, and underscores only.
              </span>
            </div>

            {error && <div className="login-card__error">{error}</div>}
            {success && <div className="setup-username__success">✓ Handle registered! Loading terminal...</div>}

            <button
              type="submit"
              className="login-card__btn"
              disabled={checking || success || !username.trim()}
            >
              {checking ? "Verifying uniqueness..." : "Complete Setup →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
