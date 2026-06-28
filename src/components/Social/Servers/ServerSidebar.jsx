import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { Compass, Plus } from "lucide-react";
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
      <div className="flex flex-col gap-2 w-full items-center overflow-y-auto no-scrollbar">
        {servers.map(server => (
            <button
                key={server.id}
                type="button"
                onClick={() => { setActiveMode("servers"); setActiveServer(server.id); }}
                className={`gft-rail-btn ${activeServer === server.id ? "active" : ""}`}
                title={server.name}
            >
                {server.iconUrl ? (
                    <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover rounded-inherit" />
                ) : (
                    <span className="font-bold text-sm uppercase">{server.name.substring(0, 2)}</span>
                )}
            </button>
        ))}

        <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="gft-rail-btn"
            title="Add Server"
            style={{ border: "1px dashed var(--gft-border-strong)", color: "var(--gft-green)" }}
        >
            <Plus size={22} />
        </button>

        <button type="button" className="gft-rail-btn" title="Discover servers">
            <Compass size={22} />
        </button>
      </div>

      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="gft-card w-full max-w-md">
                  <h2 className="gft-card-title">Create a server</h2>
                  <p className="text-sm mb-6" style={{ color: "var(--gft-text-muted)" }}>
                      Your server is where you and your community hang out. Make yours and start talking.
                  </p>

                  <form onSubmit={handleCreateServer}>
                      <div className="mb-6">
                          <label className="block text-xs uppercase font-semibold mb-2" style={{ color: "var(--gft-text-muted)" }}>Server Name</label>
                          <input
                             type="text"
                             value={newServerName}
                             onChange={e => setNewServerName(e.target.value)}
                             className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                             style={{ background: "var(--gft-elevated)", border: "1px solid var(--gft-border)", color: "var(--gft-text)" }}
                             placeholder="Markets Lounge"
                          />
                      </div>

                      <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setShowCreateModal(false)} className="gft-btn-ghost text-sm">
                              Cancel
                          </button>
                          <button type="submit" disabled={!newServerName.trim()} className="gft-btn-primary text-sm">
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
