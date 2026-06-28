import { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, onSnapshot, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { Search, Plus } from "lucide-react";

export default function DirectMessageList({ activeDmUser, setActiveDmUser }) {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
      if (!currentUser) return;

      const q = query(
          collection(db, "dm_threads"),
          where("participantIds", "array-contains", currentUser.uid),
          orderBy("lastMessageAt", "desc")
      );

      const unsub = onSnapshot(q, (snap) => {
          setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {
          setThreads([]);
      });

      return () => unsub();
  }, [currentUser]);

  useEffect(() => {
      if (!showNewModal || !currentUser) return;
      getDocs(query(collection(db, "users"))).then(snap => {
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== currentUser.uid));
      });
  }, [showNewModal, currentUser]);

  const otherParticipant = (thread) => {
      const otherId = thread.participantIds?.find(id => id !== currentUser?.uid);
      return thread.participantProfiles?.[otherId] || { displayName: "User", username: otherId?.slice(0, 8), photoURL: null, id: otherId };
  };

  const openThread = async (thread) => {
      const otherId = thread.participantIds?.find(id => id !== currentUser?.uid);
      if (!otherId) return;
      const profile = thread.participantProfiles?.[otherId];
      if (profile) {
          setActiveDmUser({ id: otherId, ...profile });
          return;
      }
      const userDoc = await getDoc(doc(db, "users", otherId));
      if (userDoc.exists()) setActiveDmUser({ id: otherId, ...userDoc.data() });
  };

  const startConversation = (user) => {
      setActiveDmUser(user);
      setShowNewModal(false);
      setUserSearch("");
  };

  const filteredUsers = users.filter(u =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredThreads = threads.filter(t => {
      if (!search.trim()) return true;
      const other = otherParticipant(t);
      const q = search.toLowerCase();
      return other.displayName?.toLowerCase().includes(q) || other.username?.toLowerCase().includes(q) || t.lastMessage?.toLowerCase().includes(q);
  });

  return (
      <div className="flex flex-col h-full">
          <div className="gft-panel-head">
              <div className="gft-panel-title">Messages</div>
              <div className="gft-panel-sub">Direct messages</div>
          </div>

          <div className="gft-dm-search relative">
              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2" style={{ color: "var(--gft-text-soft)" }} />
              <input
                  type="text"
                  placeholder="Search conversations"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: "32px" }}
              />
          </div>

          <div className="flex-1 overflow-y-auto py-2">
              <div className="gft-nav-section flex justify-between items-center">
                  <span>Recent</span>
                  <button type="button" onClick={() => setShowNewModal(true)} className="gft-icon-btn" title="New message">
                      <Plus size={14} />
                  </button>
              </div>

              {filteredThreads.map(thread => {
                  const other = otherParticipant(thread);
                  const isActive = activeDmUser?.id === other.id;
                  return (
                      <button
                          key={thread.id}
                          type="button"
                          onClick={() => openThread(thread)}
                          className={`gft-dm-item ${isActive ? 'active' : ''}`}
                      >
                          <div className="relative flex-shrink-0">
                              <img
                                  src={other.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${other.id}`}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover"
                              />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                              <span className="block truncate text-sm font-medium">{other.displayName}</span>
                              <span className="block truncate text-xs" style={{ color: "var(--gft-text-soft)" }}>{thread.lastMessage || "No messages yet"}</span>
                          </div>
                      </button>
                  );
              })}

              {filteredThreads.length === 0 && (
                  <p className="gft-empty text-xs py-6">No conversations yet. Start a new message.</p>
              )}
          </div>

          {showNewModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <div className="gft-card w-full max-w-sm max-h-[70vh] flex flex-col">
                      <h3 className="gft-card-title text-base">New message</h3>
                      <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          className="w-full mb-3 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "var(--gft-elevated)", border: "1px solid var(--gft-border)", color: "var(--gft-text)" }}
                      />
                      <div className="overflow-y-auto flex-1 -mx-2">
                          {filteredUsers.map(user => (
                              <button key={user.id} type="button" onClick={() => startConversation(user)} className="gft-dm-item w-full">
                                  <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} alt="" className="w-9 h-9 rounded-full object-cover" />
                                  <div className="text-left min-w-0">
                                      <div className="text-sm font-medium truncate">{user.displayName || "User"}</div>
                                      <div className="text-xs truncate" style={{ color: "var(--gft-text-soft)" }}>@{user.username || user.id.slice(0, 8)}</div>
                                  </div>
                              </button>
                          ))}
                      </div>
                      <button type="button" onClick={() => setShowNewModal(false)} className="gft-btn-ghost mt-4 w-full text-sm">Cancel</button>
                  </div>
              </div>
          )}
      </div>
  );
}
