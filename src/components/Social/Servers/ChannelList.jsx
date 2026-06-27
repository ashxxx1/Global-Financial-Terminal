import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { Hash, Volume2, Bell, MessageSquare, Plus, ChevronDown, ChevronRight, Settings } from "lucide-react";

export default function ChannelList({ serverId, activeChannel, setActiveChannel }) {
  const { currentUser } = useAuth();
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [server, setServer] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("text");

  // Channel Settings Modal
  const [editingChannel, setEditingChannel] = useState(null);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelTopic, setEditChannelTopic] = useState("");
  const [editChannelNsfw, setEditChannelNsfw] = useState(false);

  useEffect(() => {
      if (!serverId) return;
      
      const fetchServer = async () => {
          const s = await getDoc(doc(db, "social_servers", serverId));
          if (s.exists()) setServer(s.data());
      };
      fetchServer();

      // Listen to channels
      const qc = query(collection(db, "social_channels"), where("serverId", "==", serverId), orderBy("position", "asc"));
      const unsubC = onSnapshot(qc, snap => {
          setChannels(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });

      // Listen to categories
      const qCat = query(collection(db, "social_categories"), where("serverId", "==", serverId), orderBy("position", "asc"));
      const unsubCat = onSnapshot(qCat, snap => {
          setCategories(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });

      return () => { unsubC(); unsubCat(); }
  }, [serverId]);

  const toggleCategory = (catId) => {
      const newSet = new Set(collapsedCategories);
      if (newSet.has(catId)) newSet.delete(catId);
      else newSet.add(catId);
      setCollapsedCategories(newSet);
  };

  const handleCreateChannel = async (e) => {
      e.preventDefault();
      if (!newChannelName.trim()) return;

      const formattedName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');

      try {
          await addDoc(collection(db, "social_channels"), {
              serverId,
              categoryId: null,
              name: formattedName,
              topic: "",
              type: newChannelType,
              position: channels.length,
              slowModeSeconds: 0,
              isNsfw: false,
              createdAtMs: serverTimestamp(),
              isArchived: false
          });
          setNewChannelName("");
          setShowCreateChannel(false);
          setNewChannelType("text");
      } catch(err) {
          console.error(err);
      }
  };

  const openChannelSettings = (e, channel) => {
      e.stopPropagation();
      setEditingChannel(channel);
      setEditChannelName(channel.name);
      setEditChannelTopic(channel.topic || "");
      setEditChannelNsfw(channel.isNsfw || false);
  };

  const handleUpdateChannel = async (e) => {
      e.preventDefault();
      if (!editingChannel) return;
      try {
          await updateDoc(doc(db, "channels", editingChannel.id), {
              name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
              topic: editChannelTopic,
              isNsfw: editChannelNsfw
          });
          setEditingChannel(null);
      } catch (err) {
          console.error(err);
      }
  };

  const handleArchiveChannel = async () => {
      if (!editingChannel) return;
      try {
          await updateDoc(doc(db, "channels", editingChannel.id), { isArchived: true });
          setEditingChannel(null);
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteChannel = async () => {
      if (!editingChannel) return;
      if (window.confirm(`Permanently delete #${editingChannel.name}?`)) {
          try {
              await updateDoc(doc(db, "channels", editingChannel.id), { isArchived: true });
              setEditingChannel(null);
          } catch (err) {
              console.error(err);
          }
      }
  };

  const uncategorizedChannels = channels.filter(c => !c.categoryId && !c.isArchived);

  return (
    <div className="flex flex-col h-full text-slate-300">
        
        {/* Uncategorized Channels */}
        <div className="flex flex-col gap-0.5 mt-2">
            {uncategorizedChannels.map(channel => (
                <button 
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={`flex items-center gap-2 px-2 py-1.5 mx-2 rounded-md transition-colors group ${activeChannel?.id === channel.id ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 hover:text-slate-100'}`}
                >
                    {channel.type === 'voice' ? <Volume2 size={18} className="text-slate-400 group-hover:text-slate-200 flex-shrink-0" /> : <Hash size={18} className="text-slate-400 group-hover:text-slate-200 flex-shrink-0" />}
                    
                    <span className="truncate flex-1 text-left">{channel.name}</span>
                    
                    {server?.ownerId === currentUser?.uid && (
                        <Settings 
                            size={14} 
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity flex-shrink-0" 
                            onClick={(e) => openChannelSettings(e, channel)} 
                        />
                    )}
                </button>
            ))}
        </div>

        {/* Categories */}
        {categories.map(category => {
            const catChannels = channels.filter(c => c.categoryId === category.id && !c.isArchived);
            const isCollapsed = collapsedCategories.has(category.id);

            return (
                <div key={category.id} className="mt-4">
                    <div 
                        className="flex items-center justify-between px-4 py-1 cursor-pointer hover:text-slate-100 group"
                        onClick={() => toggleCategory(category.id)}
                    >
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
                            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            {category.name}
                        </div>
                        <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white" />
                    </div>
                    
                    {!isCollapsed && (
                        <div className="flex flex-col gap-0.5 mt-1">
                            {catChannels.map(channel => (
                                <button 
                                    key={channel.id}
                                    onClick={() => setActiveChannel(channel)}
                                    className={`flex items-center gap-2 px-2 py-1.5 mx-2 rounded-md transition-colors group ${activeChannel?.id === channel.id ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 hover:text-slate-100'}`}
                                >
                                    {channel.type === 'voice' ? <Volume2 size={18} className="text-slate-400 group-hover:text-slate-200 flex-shrink-0" /> : <Hash size={18} className="text-slate-400 group-hover:text-slate-200 flex-shrink-0" />}
                                    <span className="truncate flex-1 text-left">{channel.name}</span>
                                    {server?.ownerId === currentUser?.uid && (
                                        <Settings 
                                            size={14} 
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity flex-shrink-0" 
                                            onClick={(e) => openChannelSettings(e, channel)} 
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )
        })}

        {/* Add Channel Button for demo */}
        {server && server.ownerId === currentUser?.uid && (
            <button 
                onClick={() => setShowCreateChannel(true)}
                className="mt-6 mx-4 py-1.5 px-3 flex items-center justify-center gap-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
            >
                <Plus size={14} /> Create Channel
            </button>
        )}

        {/* Create Channel Modal */}
        {showCreateChannel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[#1e293b] rounded-2xl w-full max-w-sm p-6 border border-white/10 shadow-2xl">
                    <h2 className="text-xl font-display font-bold text-white mb-4">Create Channel</h2>
                    
                    <form onSubmit={handleCreateChannel}>
                        <div className="mb-4">
                            <label className="block text-xs uppercase font-semibold text-slate-300 mb-2">Channel Type</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setNewChannelType("text")} className={`flex-1 py-2 rounded-md text-sm font-medium border ${newChannelType === 'text' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-black/20 border-white/10 text-slate-400'}`}>Text</button>
                                <button type="button" onClick={() => setNewChannelType("voice")} className={`flex-1 py-2 rounded-md text-sm font-medium border ${newChannelType === 'voice' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-black/20 border-white/10 text-slate-400'}`}>Voice</button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs uppercase font-semibold text-slate-300 mb-2">Channel Name</label>
                            <div className="relative">
                                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                   type="text" 
                                   value={newChannelName}
                                   onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                   className="w-full bg-black/40 border border-white/10 rounded-md pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                                   placeholder="new-channel"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowCreateChannel(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={!newChannelName.trim()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Edit Channel Modal */}
        {editingChannel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[#1e293b] rounded-2xl w-full max-w-sm p-6 border border-white/10 shadow-2xl">
                    <h2 className="text-xl font-display font-bold text-white mb-4">Edit Channel</h2>
                    
                    <form onSubmit={handleUpdateChannel}>
                        <div className="mb-4">
                            <label className="block text-xs uppercase font-semibold text-slate-300 mb-2">Channel Name</label>
                            <input 
                               type="text" 
                               value={editChannelName}
                               onChange={e => setEditChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                               className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-xs uppercase font-semibold text-slate-300 mb-2">Channel Topic</label>
                            <textarea 
                               value={editChannelTopic}
                               onChange={e => setEditChannelTopic(e.target.value)}
                               className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-indigo-500 min-h-[60px]"
                               placeholder="Let everyone know how to use this channel!"
                            />
                        </div>
                        
                        <div className="mb-6 flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                            <div>
                                <h4 className="text-white text-sm font-medium">NSFW Channel</h4>
                                <p className="text-slate-400 text-xs mt-0.5">Users will need to confirm they are of age.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={editChannelNsfw}
                                onChange={e => setEditChannelNsfw(e.target.checked)}
                                className="w-4 h-4 rounded bg-black/40 border-white/10 text-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <button type="button" onClick={handleArchiveChannel} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-md transition-colors" title="Archive">
                                    Archive
                                </button>
                                <button type="button" onClick={handleDeleteChannel} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
                                    Delete
                                </button>
                            </div>
                            
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingChannel(null)} className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={!editChannelName.trim()} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors">
                                    Save
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
