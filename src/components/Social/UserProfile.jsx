import React, { useState, useEffect } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { Settings, Check, X, Camera, BadgeCheck, MapPin, Link as LinkIcon, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserProfile({ isExpanded = true }) {
  const { currentUser, updateUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // posts, replies, media, likes
  
  // Edit State
  const [editForm, setEditForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    photoURL: "",
    bannerURL: "",
    location: "",
    websiteUrl: ""
  });
  
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        setEditForm({
          displayName: data.displayName || currentUser.displayName || "",
          username: data.username || "",
          bio: data.bio || "",
          photoURL: data.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          bannerURL: data.bannerUrl || "",
          location: data.location || "",
          websiteUrl: data.websiteUrl || ""
        });
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validation (e.g. 14 day cooldown would be checked on backend ideally, but we can do a UI check if usernameChangedAt exists)
    if (userProfile?.username !== editForm.username) {
       const now = Date.now();
       const changedAt = userProfile?.usernameChangedAt;
       if (changedAt && now - changedAt < 14 * 24 * 60 * 60 * 1000) {
           setErrorMsg("Username can only be changed every 14 days.");
           return;
       }
       editForm.usernameChangedAt = now;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: editForm.displayName,
        username: editForm.username.toLowerCase(),
        bio: editForm.bio,
        photoURL: editForm.photoURL,
        bannerUrl: editForm.bannerURL,
        location: editForm.location,
        websiteUrl: editForm.websiteUrl,
        ...(editForm.usernameChangedAt && { usernameChangedAt: editForm.usernameChangedAt })
      });
      setIsEditing(false);
      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update profile.");
    }
  };

  if (!userProfile) return null;

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/80 backdrop-blur-md border-l border-white/5 overflow-y-auto">
      {/* Banner */}
      <div className="h-32 w-full bg-indigo-900/50 relative">
        {userProfile.bannerUrl ? (
           <img src={userProfile.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
        ) : (
           <div className="w-full h-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
        )}
      </div>

      <div className="px-4 pb-6 relative flex-1">
        {/* Avatar */}
        <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-4 border-[#0f172a] overflow-hidden bg-slate-800">
          <img src={userProfile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`} alt="Avatar" className="w-full h-full object-cover" />
        </div>

        {/* Action Button */}
        <div className="flex justify-end mt-3 mb-2">
          {!isEditing ? (
             <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors">
               Edit Profile
             </button>
          ) : (
             <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors">
               Cancel
             </button>
          )}
        </div>

        {/* Profile Info */}
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold font-display">{userProfile.displayName || "Anonymous"}</h2>
                 {userProfile.isVerified && <BadgeCheck className="w-5 h-5 text-indigo-400" />}
              </div>
              <p className="text-slate-400 text-sm">@{userProfile.username || `user_${currentUser?.uid.slice(0,6)}`}</p>
              
              <div className="mt-4 text-sm text-slate-200 whitespace-pre-wrap">
                {userProfile.bio || "No bio yet."}
              </div>

              <div className="flex gap-4 mt-4 text-sm text-slate-400">
                 <div><strong className="text-white">{(userProfile.followingList || []).length}</strong> Following</div>
                 <div><strong className="text-white">{(userProfile.followerList || []).length}</strong> Followers</div>
              </div>

              {/* Location & Website */}
              {(userProfile.location || userProfile.websiteUrl) && (
                <div className="flex flex-col gap-1 mt-4 text-xs text-slate-400">
                   {userProfile.location && (
                       <div className="flex items-center gap-1.5"><MapPin size={14} /> {userProfile.location}</div>
                   )}
                   {userProfile.websiteUrl && (
                       <div className="flex items-center gap-1.5"><LinkIcon size={14} /> <a href={userProfile.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{userProfile.websiteUrl.replace(/^https?:\/\//,'')}</a></div>
                   )}
                </div>
              )}

              {/* Status Indicator */}
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1 w-fit">
                 <Circle size={10} className="text-emerald-500 fill-emerald-500" /> Online
              </div>

              {/* Profile Tabs */}
              <div className="mt-6 flex border-b border-white/10 w-full">
                 {['posts', 'replies', 'media', 'likes'].map(tab => (
                    <button 
                       key={tab} 
                       onClick={() => setActiveTab(tab)}
                       className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-center transition-colors relative ${activeTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       {tab}
                       {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full"></div>}
                    </button>
                 ))}
              </div>
              
              {/* Tab Content Placeholder */}
              <div className="mt-4 text-center text-slate-500 text-xs py-8">
                 {activeTab === 'posts' && "No posts yet."}
                 {activeTab === 'replies' && "No replies yet."}
                 {activeTab === 'media' && "No media shared yet."}
                 {activeTab === 'likes' && "No liked posts yet."}
              </div>

            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSave} className="flex flex-col gap-3 mt-4">
               {errorMsg && <div className="text-red-400 text-xs">{errorMsg}</div>}
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Display Name</label>
                 <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
               </div>
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Username</label>
                 <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
               </div>
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Bio</label>
                 <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" rows={3}></textarea>
               </div>
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Avatar URL</label>
                 <input type="text" value={editForm.photoURL} onChange={e => setEditForm({...editForm, photoURL: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
               </div>
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Banner URL</label>
                 <input type="text" value={editForm.bannerURL} onChange={e => setEditForm({...editForm, bannerURL: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
               </div>
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Location</label>
                 <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
               </div>
               <div>
                 <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Website URL</label>
                 <input type="text" value={editForm.websiteUrl} onChange={e => setEditForm({...editForm, websiteUrl: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
               </div>
               <button type="submit" className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md py-2 text-sm font-medium transition-colors">
                 Save Changes
               </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
