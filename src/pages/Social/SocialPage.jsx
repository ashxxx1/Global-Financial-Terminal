import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  query,
  getDoc,
  getDocs,
  where,
  updateDoc,
  doc,
  arrayUnion,
  onSnapshot
} from "firebase/firestore";
import ChatWindow from "../../components/Social/ChatWindow";
import PostsFeed from "../../components/Social/PostsFeed";

// Roster of initial mock traders
const INITIAL_MOCK_FRIENDS = [
  { uid: "uf1", name: "AlexTrade", avatar: "AT", role: "Senior Analyst", reputation: "Analyst", online: true },
  { uid: "uf2", name: "MarketWatcher", avatar: "MW", role: "Quant Researcher", reputation: "Bull", online: true },
  { uid: "uf3", name: "GlobeMacro", avatar: "GM", role: "Macro Strategist", reputation: "Bear", online: false }
];

export default function SocialPage() {
  const { currentUser, updateUserProfile } = useAuth();
  const [friends, setFriends] = useState(INITIAL_MOCK_FRIENDS);
  const [activeFriend, setActiveFriend] = useState(null);
  const [subView, setSubView] = useState("feed"); // "feed" | "chat"
  
  // Profile settings
  const [userProfile, setUserProfile] = useState({
    displayName: currentUser?.displayName || "AlphaTrader",
    username: "",
    idNum: "",
    photoURL: currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
    bio: "Institutional macro research & active swing trading.",
    reputation: "Analyst"
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Friend search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchMsg, setSearchMsg] = useState("");
  const [friendRequests, setFriendRequests] = useState([
    { uid: "uf_req", name: "SilkRoadFX", avatar: "SR", reputation: "Bull" }
  ]);

  // Load custom profile details on mount
  useEffect(() => {
    if (!currentUser) return;
    
    // Realtime listener for current user's profile card
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile({
          displayName: data.displayName || currentUser.displayName || "AlphaTrader",
          username: data.username || "",
          idNum: data.idNum || "",
          photoURL: data.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          bio: data.bio || "Institutional macro research & active swing trading.",
          reputation: data.reputation || "Analyst"
        });
        
        // Populate friends list if database matches
        if (data.friendsList && data.friendsList.length > 0) {
          const fetchFriendsDetails = async () => {
            const list = [];
            for (const fUid of data.friendsList) {
              try {
                const fSnap = await getDoc(doc(db, "users", fUid));
                if (fSnap.exists()) {
                  const fData = fSnap.data();
                  list.push({
                    uid: fUid,
                    name: fData.displayName || fData.username || `Trader_${fUid.slice(0, 4)}`,
                    idNum: fData.idNum || "",
                    avatar: fData.photoURL || (fData.displayName || "T")[0],
                    role: fData.bio || "Quantitative Analyst",
                    reputation: fData.reputation || "Analyst",
                    online: true
                  });
                }
              } catch (e) {
                console.error("Failed to load friend detail", e);
              }
            }
            setFriends([...INITIAL_MOCK_FRIENDS, ...list]);
          };
          fetchFriendsDetails();
        } else {
          setFriends(INITIAL_MOCK_FRIENDS);
        }

        if (data.friendRequests && data.friendRequests.length > 0) {
          const fetchRequestsDetails = async () => {
            const reqs = [];
            for (const req of data.friendRequests) {
              try {
                const rUid = typeof req === "string" ? req : req.uid;
                const rSnap = await getDoc(doc(db, "users", rUid));
                if (rSnap.exists()) {
                  const rData = rSnap.data();
                  reqs.push({
                    uid: rUid,
                    name: rData.displayName || rData.username || "New Trader",
                    avatar: rData.photoURL || (rData.displayName || "N")[0],
                    reputation: rData.reputation || "Analyst"
                  });
                }
              } catch (e) {
                console.error("Failed to load friend request detail", e);
              }
            }
            setFriendRequests(reqs);
          };
          fetchRequestsDetails();
        } else {
          setFriendRequests([]);
        }
      }
    });

    return () => unsub();
  }, [currentUser]);

  // Handle Profile Save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (currentUser) {
      await updateUserProfile({
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
        bio: userProfile.bio,
        reputation: userProfile.reputation
      });
    }
    setIsEditingProfile(false);
  };

  // Search User to add friend
  const handleSearchUser = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    if (!currentUser) {
      // Offline fallback search
      if (q === "silkroadfx" || q === "silkroad") {
        setSearchResult({ uid: "uf_req", name: "SilkRoadFX", avatar: "SR", reputation: "Bull" });
        setSearchMsg("");
      } else {
        setSearchResult(null);
        setSearchMsg("No trader found matching that alias.");
      }
      return;
    }

    try {
      const qSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", q))
      );
      if (!qSnap.empty) {
        const docData = qSnap.docs[0].data();
        setSearchResult({
          uid: docData.uid,
          name: docData.displayName || docData.username || "Trader",
          avatar: docData.photoURL || (docData.displayName || "T")[0],
          reputation: docData.reputation || "Analyst"
        });
        setSearchMsg("");
      } else {
        setSearchResult(null);
        setSearchMsg("No trader found with that email address.");
      }
    } catch {
      setSearchMsg("Lookup error. Try again.");
    }
  };

  const sendFriendRequest = async () => {
    if (!searchResult) return;
    
    if (currentUser) {
      try {
        const targetRef = doc(db, "users", searchResult.uid);
        await updateDoc(targetRef, {
          friendRequests: arrayUnion({
            uid: currentUser.uid,
            name: currentUser.displayName || "Trader"
          })
        });
        setSearchMsg("Request sent successfully!");
        setSearchResult(null);
        setSearchQuery("");
      } catch (err) {
        console.error("Firebase request error:", err);
      }
    } else {
      setSearchMsg("Request sent successfully! (Sandbox)");
      setSearchResult(null);
      setSearchQuery("");
    }
  };

  const acceptRequest = async (reqUser) => {
    setFriendRequests((prev) => prev.filter((r) => r.uid !== reqUser.uid));
    setFriends((prev) => [
      ...prev,
      {
        uid: reqUser.uid,
        name: reqUser.name,
        avatar: reqUser.avatar,
        role: "Collaborator",
        reputation: reqUser.reputation,
        online: true
      }
    ]);

    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const friendRef = doc(db, "users", reqUser.uid);
        
        await updateDoc(userRef, {
          friendsList: arrayUnion(reqUser.uid)
        });
        await updateDoc(friendRef, {
          friendsList: arrayUnion(currentUser.uid)
        });
      } catch (err) {
        console.error("Accept request failed:", err);
      }
    }
  };

  return (
    <div className="forum-page social-page">
      {/* Header */}
      <div className="forum-page__header">
        <div className="forum-page__header-content">
          <div className="forum-page__title-block">
            <div className="forum-page__breadcrumb">
              <Link to="/" className="forum-page__breadcrumb-link">← Terminal</Link>
              <span className="forum-page__breadcrumb-sep">/</span>
              <span>Social Trading Hub</span>
            </div>
            <h1 className="forum-page__title">👥 Trader Social Hub</h1>
            <p className="forum-page__subtitle">
              Secure messaging, direct analysis attachments, reputation levels, and macro community updates.
            </p>
          </div>
        </div>
      </div>

      <div className="forum-page__body">
        {/* Left Panel: Friends roster */}
        <aside className="forum-sidebar social-page__friends-sidebar">
          <div className="forum-sidebar__section-title"> Roster ({friends.length})</div>
          <div className="social-page__friends-list">
            {friends.map((f) => (
              <div
                key={f.uid}
                className={`social-page__friend-card ${activeFriend?.uid === f.uid && subView === "chat" ? "active" : ""}`}
                onClick={() => {
                  setActiveFriend(f);
                  setSubView("chat");
                }}
              >
                <div className="social-page__friend-avatar">
                  {f.avatar && (f.avatar.startsWith("http") || f.avatar.includes("/") || f.avatar.startsWith("data:")) ? (
                    <img src={f.avatar} alt={f.name} className="social-page__friend-avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    f.avatar || "T"
                  )}
                  <span className={`social-page__friend-status-dot ${f.online ? "online" : "offline"}`} />
                </div>
                <div className="social-page__friend-meta">
                  <div className="social-page__friend-name">
                    {f.name} {f.idNum && <span style={{ fontSize: "9px", color: "var(--accent-green)", fontWeight: "normal" }}>#ID {f.idNum}</span>}
                  </div>
                  <div className="social-page__friend-role">{f.role}</div>
                </div>
                <span className="social-page__friend-rep">{f.reputation}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel: Content Feed / Chat */}
        <main className="forum-page__main social-page__main">
          <div className="social-page__view-selector">
            <button
              className={`social-page__selector-btn ${subView === "feed" ? "active" : ""}`}
              onClick={() => setSubView("feed")}
            >
              📰 Community Feed
            </button>
            <button
              className={`social-page__selector-btn ${subView === "chat" ? "active" : ""}`}
              disabled={!activeFriend}
              onClick={() => setSubView("chat")}
            >
              💬 Secure Line {activeFriend ? `(${activeFriend.name})` : ""}
            </button>
          </div>

          <div className="social-page__view-content">
            {subView === "feed" ? (
              <PostsFeed />
            ) : (
              <ChatWindow activeFriend={activeFriend} />
            )}
          </div>
        </main>

        {/* Right Panel: Profile Setup & Friend Search */}
        <aside className="forum-sidebar social-page__profile-sidebar">
          {/* User Profile Card */}
          <div className="forum-sidebar__card">
            <div className="forum-sidebar__section-title">Trader Profile</div>
            {isEditingProfile ? (
              <form onSubmit={handleProfileSave} className="social-page__profile-form">
                <div className="social-page__form-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={userProfile.displayName}
                    onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                  />
                </div>
                <div className="social-page__form-field">
                  <label>Avatar Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.png"
                    value={userProfile.photoURL || ""}
                    onChange={(e) => setUserProfile({ ...userProfile, photoURL: e.target.value })}
                  />
                  <div className="avatar-preview-options" style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="avatar-preset-btn"
                      style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", borderRadius: 3, cursor: "pointer", color: "var(--text-primary)" }}
                      onClick={() => setUserProfile({ ...userProfile, photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.uid}` })}
                    >
                      Identicon
                    </button>
                    <button
                      type="button"
                      className="avatar-preset-btn"
                      style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", borderRadius: 3, cursor: "pointer", color: "var(--text-primary)" }}
                      onClick={() => setUserProfile({ ...userProfile, photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}` })}
                    >
                      Bottts
                    </button>
                    <button
                      type="button"
                      className="avatar-preset-btn"
                      style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", borderRadius: 3, cursor: "pointer", color: "var(--text-primary)" }}
                      onClick={() => setUserProfile({ ...userProfile, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}` })}
                    >
                      Avataaars
                    </button>
                  </div>
                </div>
                <div className="social-page__form-field">
                  <label>Bio Summary</label>
                  <textarea
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  />
                </div>
                <div className="social-page__form-field">
                  <label>Reputation Tier</label>
                  <select
                    value={userProfile.reputation}
                    onChange={(e) => setUserProfile({ ...userProfile, reputation: e.target.value })}
                  >
                    <option value="Analyst">Analyst</option>
                    <option value="Bull">Bull</option>
                    <option value="Bear">Bear</option>
                    <option value="Wizard">Wizard</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button type="submit" className="social-page__profile-save-btn">Save</button>
                  <button type="button" className="social-page__profile-cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="social-page__profile-view">
                <div className="social-page__profile-avatar">
                  {userProfile.photoURL && (userProfile.photoURL.startsWith("http") || userProfile.photoURL.includes("/") || userProfile.photoURL.startsWith("data:")) ? (
                    <img src={userProfile.photoURL} alt={userProfile.displayName} className="social-page__profile-avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    userProfile.displayName[0]?.toUpperCase()
                  )}
                </div>
                <div className="social-page__profile-name">
                  {userProfile.displayName} {userProfile.idNum && <span className="social-page__profile-id" style={{ fontSize: "11px", color: "var(--accent-green)", fontWeight: "normal", marginLeft: "4px" }}>#ID {userProfile.idNum}</span>}
                  {userProfile.username && <span className="social-page__profile-handle" style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>@{userProfile.username}</span>}
                </div>
                <div className="social-page__profile-badge">{userProfile.reputation}</div>
                <div className="social-page__profile-bio">"{userProfile.bio}"</div>
                <button className="social-page__profile-edit-btn" onClick={() => setIsEditingProfile(true)}>
                  Edit Profile Card
                </button>
              </div>
            )}
          </div>

          {/* Add Friend Search */}
          <div className="forum-sidebar__card">
            <div className="forum-sidebar__section-title">Find Traders</div>
            <form onSubmit={handleSearchUser} className="social-page__search-form">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
            {searchResult && (
              <div className="social-page__search-result">
                <div className="social-page__sr-avatar">
                  {searchResult.avatar && (searchResult.avatar.startsWith("http") || searchResult.avatar.includes("/") || searchResult.avatar.startsWith("data:")) ? (
                    <img src={searchResult.avatar} alt={searchResult.name} className="social-page__friend-avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    searchResult.avatar || "T"
                  )}
                </div>
                <div className="social-page__sr-info">
                  <div className="social-page__sr-name">{searchResult.name}</div>
                  <div className="social-page__sr-rep">{searchResult.reputation}</div>
                </div>
                <button className="social-page__sr-add-btn" onClick={sendFriendRequest}>+ Add</button>
              </div>
            )}
            {searchMsg && <div className="social-page__search-msg">{searchMsg}</div>}
          </div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="forum-sidebar__card">
              <div className="forum-sidebar__section-title">Friend Requests ({friendRequests.length})</div>
              {friendRequests.map((req) => (
                <div key={req.uid} className="social-page__request-row">
                  <div className="social-page__req-avatar">
                    {req.avatar && (req.avatar.startsWith("http") || req.avatar.includes("/") || req.avatar.startsWith("data:")) ? (
                      <img src={req.avatar} alt={req.name} className="social-page__friend-avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      req.avatar || "T"
                    )}
                  </div>
                  <div className="social-page__req-info">
                    <div className="social-page__req-name">{req.name}</div>
                    <div className="social-page__req-rep">{req.reputation}</div>
                  </div>
                  <button className="social-page__req-accept" onClick={() => acceptRequest(req)}>Accept</button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
