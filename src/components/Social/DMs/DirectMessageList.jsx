import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, getDocs, onSnapshot, where } from "firebase/firestore";
import { Search, User } from "lucide-react";

export default function DirectMessageList({ activeDmUser, setActiveDmUser }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
      // In a real app, this would query a 'friends' subcollection or 'dm_channels'
      // For this demo, we'll fetch all users except current user to populate the list quickly
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
      <div className="flex flex-col h-full bg-[#11131a] text-slate-300">
          <div className="h-14 px-4 flex items-center shadow-sm border-b border-white/5 flex-shrink-0">
              <div className="relative w-full">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                      type="text" 
                      placeholder="Find or start a conversation" 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-[#1e293b] text-xs text-white rounded-md py-1.5 pl-8 pr-3 outline-none border border-transparent focus:border-indigo-500/50 transition-colors placeholder:text-slate-500"
                  />
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Direct Messages
              </div>
              
              <div className="flex flex-col gap-0.5">
                  {filteredUsers.map(user => (
                      <button 
                          key={user.id}
                          onClick={() => setActiveDmUser(user)}
                          className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-md transition-colors group ${activeDmUser?.id === user.id ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 hover:text-slate-100'}`}
                      >
                          <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 relative">
                              <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} alt="" className="w-full h-full object-cover"/>
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#11131a] rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0 text-left flex flex-col">
                              <span className="truncate text-sm">{user.displayName || 'Unknown'}</span>
                          </div>
                      </button>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                      <div className="text-center px-4 py-8 text-xs text-slate-500">
                          No users found.
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}
