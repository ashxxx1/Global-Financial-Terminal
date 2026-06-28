import { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { Search, Plus } from "lucide-react";

export default function DirectMessageList({ activeDmUser, setActiveDmUser }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
      if (!currentUser) return;

      const q = query(collection(db, "users"));
      const unsub = onSnapshot(q, (snap) => {
          const list = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(u => u.id !== currentUser.uid);
          setUsers(list);
      });

      return () => unsub();
  }, [currentUser]);

  const filteredUsers = users.filter(u =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <div className="flex flex-col h-full">
          <div className="gft-panel-head">
              <div className="gft-panel-title">Messages</div>
              <div className="gft-panel-sub">Direct messages & group chats</div>
          </div>

          <div className="gft-dm-search relative">
              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2" style={{ color: "var(--gft-text-soft)" }} />
              <input
                  type="text"
                  placeholder="Find or start a conversation"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: "32px" }}
              />
          </div>

          <div className="flex-1 overflow-y-auto py-2">
              <div className="gft-nav-section flex justify-between items-center">
                  <span>Direct Messages</span>
                  <button type="button" onClick={() => setShowGroupModal(true)} className="gft-icon-btn" title="Create Group DM">
                      <Plus size={14} />
                  </button>
              </div>

              {filteredUsers.map(user => (
                  <button
                      key={user.id}
                      type="button"
                      onClick={() => setActiveDmUser(user)}
                      className={`gft-dm-item ${activeDmUser?.id === user.id ? 'active' : ''}`}
                  >
                      <div className="relative flex-shrink-0">
                          <img
                              src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover"
                          />
                          <span className="gft-online-dot" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                          <span className="block truncate text-sm font-medium">{user.displayName || 'Unknown'}</span>
                          {user.username && (
                              <span className="block truncate text-xs" style={{ color: "var(--gft-text-soft)" }}>@{user.username}</span>
                          )}
                      </div>
                  </button>
              ))}

              {filteredUsers.length === 0 && (
                  <p className="gft-empty text-xs py-6">No users found.</p>
              )}
          </div>

          {showGroupModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <div className="gft-card w-full max-w-sm">
                      <h3 className="gft-card-title text-base">Select friends</h3>
                      <p className="text-xs mb-4" style={{ color: "var(--gft-text-muted)" }}>You can add up to 9 more friends.</p>
                      <input
                          type="text"
                          placeholder="Type the username of a friend"
                          className="w-full mb-4 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "var(--gft-elevated)", border: "1px solid var(--gft-border)", color: "var(--gft-text)" }}
                      />
                      <div className="flex justify-between items-center">
                          <button type="button" onClick={() => setShowGroupModal(false)} className="gft-btn-ghost text-xs">Cancel</button>
                          <button type="button" className="gft-btn-primary text-xs opacity-50 cursor-not-allowed">Create Group DM</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
}
