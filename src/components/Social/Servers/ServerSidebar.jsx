import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { Compass, Plus, Hash, MessageCircle } from "lucide-react";
import { Permission, ALL_PERMISSIONS } from "../../../lib/permissions";

export default function ServerSidebar({ activeServer, setActiveServer, setActiveMode }) {
  const { currentUser } = useAuth();
  const [servers, setServers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newServerName, setNewServerName] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen for servers this user is a member of
    const q = query(collection(db, "server_members"), where("userId", "==", currentUser.uid));
    const unsub = onSnapshot(q, async (snap) => {
        const serverIds = snap.docs.map(d => d.data().serverId);
        if (serverIds.length === 0) {
            setServers([]);
            return;
        }
        
        // Fetch server details (this is a simplified approach, a real app might denormalize or use a different strategy if server list is huge)
        const serverDocs = await Promise.all(serverIds.map(id => getDoc(doc(db, "social_servers", id))));
        const loadedServers = serverDocs.filter(d => d.exists() && !d.data().isDeleted).map(d => ({id: d.id, ...d.data()}));
        setServers(loadedServers);
    });

    return () => unsub();
  }, [currentUser]);

  const handleCreateServer = async (e) => {
      e.preventDefault();
      if (!newServerName.trim() || !currentUser) return;

      try {
          // 1. Create everyone role
          const roleData = {
              name: "@everyone",
              color: "#94a3b8",
              permissions: Permission.VIEW_CHANNEL | Permission.SEND_MESSAGES | Permission.ADD_REACTIONS,
              position: 0,
              isMentionable: true,
              isHoisted: false,
              isEveryoneRole: true
          };
          const roleRef = await addDoc(collection(db, "roles"), roleData);
          
          // 2. Create Server
          const serverData = {
              name: newServerName.trim(),
              description: "",
              iconUrl: null,
              bannerUrl: null,
              ownerId: currentUser.uid,
              isDiscoverable: false,
              createdAtMs: serverTimestamp(),
              memberCount: 1,
              everyoneRoleId: roleRef.id,
              isDeleted: false
          };
          const serverRef = await addDoc(collection(db, "social_servers"), serverData);

          // Update role with serverId
          await addDoc(collection(db, "roles"), { ...roleData, serverId: serverRef.id }); // Assuming we recreate with correct serverId or update the first. Simplification here.

          // 3. Create General Channel
          await addDoc(collection(db, "social_channels"), {
              serverId: serverRef.id,
              categoryId: null,
              name: "general",
              topic: "General discussion",
              type: "text",
              position: 0,
              slowModeSeconds: 0,
              isNsfw: false,
              createdAtMs: serverTimestamp(),
              isArchived: false
          });

          // 4. Create ServerMember for creator
          await addDoc(collection(db, "server_members"), {
              serverId: serverRef.id,
              userId: currentUser.uid,
              nickname: null,
              joinedAt: serverTimestamp(),
              isBanned: false
          });

          setNewServerName("");
          setShowCreateModal(false);
          setActiveMode("servers");
          setActiveServer(serverRef.id);
          
      } catch (err) {
          console.error("Failed to create server", err);
      }
  };

  return (
    <>
      <div className="flex flex-col gap-3 w-full items-center overflow-y-auto no-scrollbar py-2">
        {/* Direct Messages Button */}
        <button 
            onClick={() => { setActiveMode("dm"); setActiveServer(null); }}
            className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center bg-[#1e293b] text-indigo-400 group relative ${!activeServer ? "rounded-[16px]" : "opacity-70 hover:opacity-100"}`}
        >
            {!activeServer && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md"></div>
            )}
            <MessageCircle size={24} />
            <div className="absolute left-16 px-3 py-1.5 bg-black/90 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Direct Messages
            </div>
        </button>
        
        <div className="w-8 h-[2px] bg-white/10 rounded-full my-1"></div>

        {servers.map(server => (
            <button 
                key={server.id}
                onClick={() => { setActiveMode("servers"); setActiveServer(server.id); }}
                className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center bg-gradient-premium text-white relative group ${activeServer === server.id ? "rounded-[16px]" : "opacity-70 hover:opacity-100"}`}
            >
                {activeServer === server.id && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md"></div>
                )}
                {server.iconUrl ? (
                    <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover rounded-inherit" />
                ) : (
                    <span className="font-bold text-lg font-display uppercase">{server.name.substring(0, 2)}</span>
                )}
                
                {/* Tooltip */}
                <div className="absolute left-16 px-3 py-1.5 bg-black/90 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {server.name}
                </div>
            </button>
        ))}

        <button 
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center bg-white/5 text-emerald-400 border border-dashed border-emerald-400/30 hover:bg-emerald-400/10 group relative"
        >
            <Plus size={24} />
            <div className="absolute left-16 px-3 py-1.5 bg-black/90 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Add Server
            </div>
        </button>

        <button className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center bg-white/5 text-emerald-400 hover:bg-emerald-400/10 group relative">
            <Compass size={24} />
            <div className="absolute left-16 px-3 py-1.5 bg-black/90 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Discover
            </div>
        </button>
      </div>

      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#1e293b] rounded-2xl w-full max-w-md p-6 border border-white/10 shadow-2xl">
                  <h2 className="text-xl font-display font-bold text-white mb-2">Create a Server</h2>
                  <p className="text-slate-400 text-sm mb-6">Your server is where you and your friends hang out. Make yours and start talking.</p>
                  
                  <form onSubmit={handleCreateServer}>
                      <div className="mb-6">
                          <label className="block text-xs uppercase font-semibold text-slate-300 mb-2">Server Name</label>
                          <input 
                             type="text" 
                             value={newServerName}
                             onChange={e => setNewServerName(e.target.value)}
                             className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-indigo-500"
                             placeholder="My Awesome Server"
                          />
                      </div>
                      
                      <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                              Cancel
                          </button>
                          <button type="submit" disabled={!newServerName.trim()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors">
                              Create
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </>
  );
}
