import { useState, useEffect, useRef } from 'react';
import { SocialFeed } from './SocialFeed';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { Hash, Mail, User, Plus, Compass, Check, Send, Image, X } from 'lucide-react';

const INITIAL_MOCK_FRIENDS = [];

export function SocialModule() {
  const { currentUser, userProfileData, updateUserProfile } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState('home');
  const [activeHomeTab, setActiveHomeTab] = useState('home');

  // Friends Roster State
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);

  // Search friend state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchMsg, setSearchMsg] = useState("");

  // Private messages state
  const [messages, setMessages] = useState([]);
  const [prevFriendId, setPrevFriendId] = useState(activeFriend ? (activeFriend.uid || activeFriend.name) : null);
  const [chatInputText, setChatInputText] = useState("");
  const [chatImageURL, setChatImageURL] = useState("");
  const [showChatImgInput, setShowChatImgInput] = useState(false);
  const chatBottomRef = useRef(null);

  const currentFriendId = activeFriend ? (activeFriend.uid || activeFriend.name) : null;
  if (currentFriendId !== prevFriendId) {
    setPrevFriendId(currentFriendId);
    setMessages([]);
  }

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(() => userProfileData?.displayName || currentUser?.displayName || "Trader");
  const [profileBio, setProfileBio] = useState(() => userProfileData?.bio || "Institutional macro research & active swing trading.");
  const [profileRep, setProfileRep] = useState(() => userProfileData?.reputation || "Analyst");
  const [profileAvatar, setProfileAvatar] = useState(() => userProfileData?.photoURL || currentUser?.photoURL || "");

  const [prevUserUid, setPrevUserUid] = useState(currentUser?.uid || null);
  const [prevUserProfile, setPrevUserProfile] = useState(userProfileData);

  const currentUserUid = currentUser?.uid || null;
  if (currentUserUid !== prevUserUid || userProfileData !== prevUserProfile) {
    setPrevUserUid(currentUserUid);
    setPrevUserProfile(userProfileData);
    setProfileName(userProfileData?.displayName || currentUser?.displayName || "Trader");
    setProfileBio(userProfileData?.bio || "Institutional macro research & active swing trading.");
    setProfileRep(userProfileData?.reputation || "Analyst");
    setProfileAvatar(userProfileData?.photoURL || currentUser?.photoURL || "");
  }

  const [servers, setServers] = useState([]);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [newServerName, setNewServerName] = useState("");

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const [channelMessages, setChannelMessages] = useState([]);
  const [channelInputText, setChannelInputText] = useState("");
  const [channelImageURL, setChannelImageURL] = useState("");
  const [showChannelImgInput, setShowChannelImgInput] = useState(false);
  const channelBottomRef = useRef(null);

  // Fetch servers in real-time
  useEffect(() => {
    const q = query(collection(db, "social_servers"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServers(list);
      } else {
        // Default seed servers if empty
        setServers([
          { id: 's1', name: 'Macro Trading', initials: 'MT', color: 'bg-emerald-600' },
          { id: 's2', name: 'Crypto Alpha', initials: 'CA', color: 'bg-indigo-600' },
          { id: 's3', name: 'Quant Network', initials: 'QN', color: 'bg-purple-600' },
        ]);
      }
    }, (err) => {
      console.warn("Firestore servers permission or read error, using offline seed:", err);
      setServers([
        { id: 's1', name: 'Macro Trading', initials: 'MT', color: 'bg-emerald-600' },
        { id: 's2', name: 'Crypto Alpha', initials: 'CA', color: 'bg-indigo-600' },
        { id: 's3', name: 'Quant Network', initials: 'QN', color: 'bg-purple-600' },
      ]);
    });
    return () => unsub();
  }, []);

  // Fetch channels for the selected server
  useEffect(() => {
    if (activeWorkspace === 'home') {
      setChannels([]);
      setActiveChannelId(null);
      return;
    }
    const q = query(
      collection(db, "social_channels"),
      where("serverId", "==", activeWorkspace)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tA - tB;
        });
        setChannels(list);
        if (!list.some(c => c.id === activeChannelId)) {
          setActiveChannelId(list[0].id);
        }
      } else {
        // Enforce default general channel
        const defaultCh = { id: `ch_gen_${activeWorkspace}`, serverId: activeWorkspace, name: "general" };
        setChannels([defaultCh]);
        setActiveChannelId(defaultCh.id);
      }
    }, (err) => {
      console.warn("Firestore channels read error, using offline channels:", err);
      const defaultChList = [
        { id: `ch_gen_${activeWorkspace}`, serverId: activeWorkspace, name: "general" },
        { id: `ch_ideas_${activeWorkspace}`, serverId: activeWorkspace, name: "trade-ideas" },
        { id: `ch_news_${activeWorkspace}`, serverId: activeWorkspace, name: "macro-news" }
      ];
      setChannels(defaultChList);
      if (!defaultChList.some(c => c.id === activeChannelId)) {
        setActiveChannelId(defaultChList[0].id);
      }
    });
    return () => unsub();
  }, [activeWorkspace]);

  // Fetch group messages for the selected channel
  useEffect(() => {
    if (!activeChannelId) {
      setChannelMessages([]);
      return;
    }
    const q = query(
      collection(db, "channel_messages"),
      where("channelId", "==", activeChannelId)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."
        }));
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tA - tB;
        });
        setChannelMessages(list);
      } else {
        setChannelMessages([]);
      }
    }, (err) => {
      console.warn("Firestore channel messages error, using local fallback:", err);
      setChannelMessages([]);
    });
    return () => unsub();
  }, [activeChannelId]);

  // Load registered users dynamically in real time
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "users"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              uid: doc.id,
              name: data.displayName || data.username || "Trader",
              avatar: data.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.id}`,
              role: data.bio || "Quantitative Analyst",
              reputation: data.reputation || "Analyst",
              idNum: data.idNum || null,
              online: true
            };
          })
          .filter((u) => u.uid !== currentUser.uid); // exclude self
        setFriends(list);
      } else {
        setFriends([]);
      }
    }, (err) => {
      console.error("Failed to load registered users:", err);
      setFriends([]);
    });

    return () => unsub();
  }, [currentUser]);

  // Load Mutual Chat Messages
  useEffect(() => {
    if (!activeFriend) return;
    if (!currentUser) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "in", [
        `${currentUser.uid}_${activeFriend.uid}`,
        `${activeFriend.uid}_${currentUser.uid}`
      ])
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId === currentUser.uid ? "me" : "other",
          text: doc.data().text,
          imageURL: doc.data().imageURL,
          createdAt: doc.data().createdAt,
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."
        }));
        // Sort in memory to bypass composite index requirement
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tA - tB;
        });
        setMessages(list);
      } else {
        setMessages([]);
      }
    }, (err) => {
      console.error("DMs query error:", err);
    });

    return () => unsub();
  }, [activeFriend, currentUser]);

  // Scroll to bottom on message update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() && !chatImageURL.trim()) return;

    const text = chatInputText;
    const img = chatImageURL;
    setChatInputText("");
    setChatImageURL("");
    setShowChatImgInput(false);

    if (currentUser && activeFriend) {
      const chatId = `${currentUser.uid}_${activeFriend.uid}`;
      try {
        await addDoc(collection(db, "messages"), {
          chatId,
          senderId: currentUser.uid,
          text,
          imageURL: img || null,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Message send failed:", err);
      }
    }
  };

  // Search User by Email
  const handleSearchUser = async (e) => {
    e.preventDefault();
    const email = searchQuery.trim().toLowerCase();
    if (!email) return;

    if (!currentUser) {
      setSearchMsg("Authentication required.");
      return;
    }

    try {
      const qSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", email))
      );
      if (!qSnap.empty) {
        const docData = qSnap.docs[0].data();
        if (docData.uid === currentUser.uid) {
          setSearchMsg("You cannot add yourself.");
          setSearchResult(null);
          return;
        }
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

  // Send friend request
  const sendFriendRequest = async () => {
    if (!searchResult || !currentUser) return;
    try {
      const targetRef = doc(db, "users", searchResult.uid);
      await updateDoc(targetRef, {
        friendRequests: arrayUnion({
          uid: currentUser.uid,
          name: currentUser.displayName || "Trader"
        })
      });
      setSearchMsg("Friend request sent!");
      setSearchResult(null);
      setSearchQuery("");
    } catch (err) {
      console.error("Request failed", err);
    }
  };

  // Accept Friend Request
  const acceptRequest = async (reqUser) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const friendRef = doc(db, "users", reqUser.uid);
      
      // Remove request
      await updateDoc(userRef, {
        friendRequests: arrayRemove({
           uid: reqUser.uid,
           name: reqUser.name
        })
      });
      
      // Update both friendsList
      await updateDoc(userRef, {
        friendsList: arrayUnion(reqUser.uid)
      });
      await updateDoc(friendRef, {
        friendsList: arrayUnion(currentUser.uid)
      });

      // Filter local request state
      setFriendRequests(prev => prev.filter(r => r.uid !== reqUser.uid));
    } catch (err) {
      console.error("Accept friend failed", err);
    }
  };

  // Save profile edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (currentUser) {
      await updateUserProfile({
        displayName: profileName,
        photoURL: profileAvatar,
        bio: profileBio,
        reputation: profileRep
      });
    }
    setIsEditingProfile(false);
  };

  // Handle Server Creation
  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const serverName = newServerName.trim();
    setNewServerName("");
    setShowCreateServerModal(false);

    // Compute initials
    const words = serverName.split(/\s+/);
    let initials = words.map(w => w[0]).join("").slice(0, 3).toUpperCase();
    if (!initials) initials = serverName.slice(0, 2).toUpperCase();

    const colors = ["bg-emerald-600", "bg-indigo-600", "bg-purple-600", "bg-rose-600", "bg-pink-600", "bg-amber-600", "bg-blue-600"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    if (currentUser) {
      try {
        const docRef = await addDoc(collection(db, "social_servers"), {
          name: serverName,
          initials,
          color,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp()
        });

        // Auto create general channel
        await addDoc(collection(db, "social_channels"), {
          serverId: docRef.id,
          name: "general",
          createdBy: currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to create server:", err);
      }
    } else {
      // Local fallback
      const localId = `s_${Date.now()}`;
      const newS = { id: localId, name: serverName, initials, color };
      setServers(prev => [...prev, newS]);
      setChannels(prev => [...prev, { id: `ch_gen_${localId}`, serverId: localId, name: "general" }]);
    }
  };

  // Handle Channel Creation
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const channelName = newChannelName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    setNewChannelName("");
    setShowCreateChannelModal(false);

    if (currentUser && activeWorkspace !== 'home') {
      try {
        await addDoc(collection(db, "social_channels"), {
          serverId: activeWorkspace,
          name: channelName,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to create channel:", err);
      }
    } else {
      // Local fallback
      const localCh = { id: `ch_${Date.now()}`, serverId: activeWorkspace, name: channelName };
      setChannels(prev => [...prev, localCh]);
    }
  };

  // Handle Send Channel Message
  const handleSendChannelMessage = async (e) => {
    e.preventDefault();
    if (!channelInputText.trim() && !channelImageURL.trim()) return;

    const text = channelInputText;
    const img = channelImageURL;
    setChannelInputText("");
    setChannelImageURL("");
    setShowChannelImgInput(false);

    if (currentUser && activeChannelId) {
      try {
        await addDoc(collection(db, "channel_messages"), {
          channelId: activeChannelId,
          serverId: activeWorkspace,
          senderId: currentUser.uid,
          senderName: userProfileData?.displayName || currentUser.displayName || "Trader",
          senderIdNum: userProfileData?.idNum || null,
          senderAvatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          text,
          imageURL: img || null,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Channel message send failed:", err);
      }
    } else {
      // Local fallback message
      const fallbackMsg = {
        id: `m_${Date.now()}`,
        senderName: userProfileData?.displayName || "Trader",
        senderIdNum: userProfileData?.idNum || 1,
        senderAvatar: userProfileData?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=fallback`,
        text,
        imageURL: img || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChannelMessages(prev => [...prev, fallbackMsg]);
    }
  };

  // Scroll to bottom on channel messages update
  useEffect(() => {
    channelBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages]);

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-[#020617] text-slate-200">
      {/* Server List Column */}
      <div className="w-[72px] shrink-0 bg-black flex flex-col items-center py-3 gap-3 border-r border-white/5 z-20">
        <button 
          onClick={() => setActiveWorkspace('home')}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${activeWorkspace === 'home' ? 'bg-indigo-500 text-white rounded-xl' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:rounded-xl'}`}
          title="Social Core Feed"
        >
          <Hash className="w-6 h-6" />
        </button>
        <div className="w-8 h-0.5 bg-slate-800 rounded-full" />
        {servers.map(s => (
          <button 
            key={s.id}
            onClick={() => setActiveWorkspace(s.id)}
            className={`w-12 h-12 flex items-center justify-center font-bold text-lg transition-all cursor-pointer ${activeWorkspace === s.id ? `${s.color} text-white justify-center rounded-xl` : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:rounded-xl rounded-2xl'}`}
            title={s.name}
          >
            {s.initials}
          </button>
        ))}
        <button 
          onClick={() => setShowCreateServerModal(true)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:rounded-xl group cursor-pointer"
          title="Create a Server"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-800 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:rounded-xl group cursor-pointer" title="Discover Public Servers">
          <Compass className="w-6 h-6" />
        </button>
      </div>

      {/* Roster & Tabs Navigation Column */}
      {activeWorkspace === 'home' ? (
        <div className="w-[240px] shrink-0 border-r border-white/5 bg-[#070b14] flex flex-col pt-4">
          <div className="px-4 mb-4">
             <h2 className="text-xl font-bold tracking-widest uppercase text-slate-100">Social Core</h2>
          </div>
          <div className="flex flex-col px-2 gap-1">
            <button 
              onClick={() => setActiveHomeTab('home')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeHomeTab === 'home' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 text-slate-400'}`}
            >
               <Hash className="w-5 h-5" />
               <span className="text-[15px] font-bold uppercase tracking-wider">Feed</span>
            </button>
            <button 
              onClick={() => setActiveHomeTab('messages')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeHomeTab === 'messages' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 text-slate-400'}`}
            >
               <Mail className="w-5 h-5" />
               <span className="text-[15px] font-bold uppercase tracking-wider">Messages</span>
            </button>
            <button 
              onClick={() => setActiveHomeTab('profile')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeHomeTab === 'profile' ? 'bg-white/10 font-bold' : 'hover:bg-white/5 text-slate-400'}`}
            >
               <User className="w-5 h-5" />
               <span className="text-[15px] font-bold uppercase tracking-wider">Profile</span>
            </button>
          </div>

          {/* Incoming Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="mt-8 px-4 flex flex-col gap-2">
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Friend Requests ({friendRequests.length})</h3>
               <div className="flex flex-col gap-2">
                 {friendRequests.map((req) => (
                   <div key={req.uid} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5 text-xs">
                     <span className="font-bold text-slate-300 truncate max-w-[100px]">{req.name}</span>
                     <button 
                       onClick={() => acceptRequest(req)}
                       className="p-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors cursor-pointer"
                       title="Accept"
                     >
                       <Check className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-[240px] shrink-0 border-r border-white/5 bg-[#070b14] flex flex-col">
          <div className="p-4 border-b border-white/5 shadow-md font-bold text-[13px] hover:bg-white/5 cursor-pointer transition-colors text-slate-200 uppercase tracking-wider">
            {servers.find(s => s.id === activeWorkspace)?.name || "Active Server"}
          </div>
          <div className="p-3 flex flex-col gap-1">
            <div className="flex justify-between items-center px-2 mb-2">
              <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Text Channels</div>
              <button 
                onClick={() => setShowCreateChannelModal(true)} 
                className="text-slate-500 hover:text-white cursor-pointer transition-colors"
                title="Create Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[400px]">
              {channels.map(c => {
                const active = activeChannelId === c.id;
                return (
                  <button 
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-left w-full cursor-pointer ${active ? 'bg-white/10 text-slate-200 font-bold' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 font-medium'}`}
                  >
                    <Hash className="w-4 h-4 text-slate-500" />
                    <span className="text-xs">{c.name}</span>
                  </button>
                );
              })}
              {channels.length === 0 && (
                <div className="text-[10px] text-slate-600 font-mono italic px-2">No channels.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex justify-center bg-[#010409]">
        {activeWorkspace === 'home' ? (
          <div className="flex w-full max-w-[1100px] gap-6">
            {/* Center column based on activeHomeTab */}
            <div className="flex-1 max-w-[650px] border-x border-white/5 flex flex-col bg-[#020617]">
               {activeHomeTab === 'home' && <SocialFeed />}
               {activeHomeTab === 'messages' && (
                  <div className="flex w-full h-full">
                     {/* Friends Chat Roster */}
                     <div className="w-[240px] border-r border-white/5 flex flex-col items-stretch shrink-0">
                       <div className="p-4 border-b border-white/5">
                         <h3 className="font-bold text-base mb-2">Direct Messages</h3>
                         <div className="bg-white/5 rounded px-2.5 py-1.5 flex items-center gap-1.5 border border-white/5">
                            <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Filter traders by name..." 
                              className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder:text-slate-500" 
                            />
                         </div>
                       </div>

                       <div className="flex-1 overflow-y-auto">
                         {filteredFriends.map((friend) => {
                           const active = activeFriend?.uid === friend.uid;
                           return (
                             <div 
                               key={friend.uid} 
                               onClick={() => setActiveFriend(friend)}
                               className={`px-4 py-3 border-b border-white/5 flex gap-3 hover:bg-white/5 cursor-pointer items-center transition-colors ${active ? 'bg-white/5 border-l-2 border-indigo-500' : ''}`}
                             >
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm overflow-hidden shrink-0">
                                  {friend.avatar && (friend.avatar.startsWith("http") || friend.avatar.includes("/") || friend.avatar.startsWith("data:")) ? (
                                    <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{friend.avatar || "T"}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-baseline">
                                      <span className="font-bold text-slate-200 text-xs truncate">
                                        {friend.name} {friend.idNum && <span className="text-[10px] text-emerald-400 font-mono font-bold">#{friend.idNum}</span>}
                                      </span>
                                      {friend.online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                                   </div>
                                   <p className="text-[10px] text-slate-500 truncate mt-0.5">{friend.role}</p>
                                </div>
                             </div>
                           )
                         })}
                       </div>
                     </div>

                     {/* Chat Messages Log */}
                     <div className="flex-1 flex flex-col relative bg-black/25">
                       {activeFriend ? (
                         <>
                           <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/10">
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden shrink-0">
                                {activeFriend.avatar && (activeFriend.avatar.startsWith("http") || activeFriend.avatar.includes("/") || activeFriend.avatar.startsWith("data:")) ? (
                                  <img src={activeFriend.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{activeFriend.avatar || "T"}</span>
                                )}
                              </div>
                              <div>
                                 <h3 className="font-bold text-slate-200 text-sm">
                                   {activeFriend.name} {activeFriend.idNum && <span className="text-[11px] text-emerald-400 font-mono font-bold">#{activeFriend.idNum}</span>}
                                 </h3>
                                 <p className={`text-[10px] font-bold ${activeFriend.online ? 'text-emerald-400' : 'text-slate-500'}`}>{activeFriend.online ? 'Online' : 'Offline'}</p>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-500/10 ml-auto">{activeFriend.reputation}</span>
                           </div>

                           <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                              {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.senderId === 'me' ? 'ml-auto justify-end' : ''}`}>
                                   {msg.senderId === 'other' && (
                                     <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 overflow-hidden shrink-0 mt-1">
                                       {activeFriend.avatar && (activeFriend.avatar.startsWith("http") || activeFriend.avatar.includes("/") || activeFriend.avatar.startsWith("data:")) ? (
                                         <img src={activeFriend.avatar} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                         <span>{activeFriend.avatar || "T"}</span>
                                       )}
                                     </div>
                                   )}
                                   <div className={`flex flex-col gap-1 ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                                      <div className={`rounded-xl px-3.5 py-2 text-[13px] ${msg.senderId === 'me' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-slate-200 rounded-tl-sm'}`}>
                                         {msg.imageURL ? (
                                            <div className="rounded overflow-hidden max-h-[180px] mb-1">
                                               <img src={msg.imageURL} alt="Shared analysis screenshot" className="w-full h-full object-cover" />
                                            </div>
                                         ) : null}
                                         {msg.text}
                                      </div>
                                      <span className="text-[8px] text-slate-600 font-mono">{msg.time}</span>
                                   </div>
                                </div>
                              ))}
                              <div ref={chatBottomRef} />
                           </div>

                           <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex flex-col gap-2">
                              {showChatImgInput && (
                                 <div className="bg-white/5 border border-white/10 rounded px-3 py-1 flex items-center">
                                    <input 
                                      type="text" 
                                      value={chatImageURL}
                                      onChange={(e) => setChatImageURL(e.target.value)}
                                      placeholder="Paste chart image link..." 
                                      className="bg-transparent border-none outline-none text-xs w-full text-slate-200" 
                                    />
                                 </div>
                              )}
                              <div className="bg-white/5 border border-white/10 rounded-full flex items-center px-4 py-2">
                                 <button 
                                   type="button" 
                                   onClick={() => setShowChatImgInput(!showChatImgInput)} 
                                   className={`p-1.5 mr-2 rounded hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white ${showChatImgInput ? 'text-indigo-400' : ''}`}
                                 >
                                    <Image className="w-4 h-4" />
                                 </button>
                                 <input 
                                   type="text" 
                                   value={chatInputText}
                                   onChange={(e) => setChatInputText(e.target.value)}
                                   placeholder={`Secure line message to ${activeFriend.name}...`} 
                                   className="bg-transparent border-none outline-none text-xs w-full text-slate-200" 
                                 />
                                 <button type="submit" className="text-indigo-400 hover:text-white cursor-pointer ml-2">
                                    <Send className="w-4 h-4" />
                                 </button>
                              </div>
                           </form>
                         </>
                       ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-[12px] p-6 text-center">
                            <span>💬</span>
                            <p className="mt-2">Select a trader from the roster to establish a secure DM link.</p>
                         </div>
                       )}
                     </div>
                  </div>
               )}
               {activeHomeTab === 'profile' && (
                  <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 bg-[#020617]">
                     <div className="h-44 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent" />
                     </div>
                     <div className="px-6 pb-6 relative shrink-0">
                        <div className="absolute -top-12 right-6 z-10 flex gap-2">
                           <button 
                             onClick={() => setIsEditingProfile(!isEditingProfile)}
                             className="px-4 py-1.5 rounded-full border border-slate-600 font-bold text-xs hover:bg-white/5 cursor-pointer bg-slate-900 text-slate-200"
                           >
                             {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                           </button>
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-[#020617] bg-gradient-to-tr from-indigo-500 to-purple-600 absolute -top-12 flex items-center justify-center text-2xl font-bold z-10 shadow-lg overflow-hidden">
                          {profileAvatar ? (
                             <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <span>ME</span>
                          )}
                        </div>

                        {isEditingProfile ? (
                          <form onSubmit={handleSaveProfile} className="mt-16 flex flex-col gap-3 max-w-md bg-white/5 border border-white/5 p-4 rounded-xl">
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                                <input 
                                  type="text" 
                                  value={profileName}
                                  onChange={(e) => setProfileName(e.target.value)}
                                  className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" 
                                />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avatar preset / Dicebear seed URL</label>
                                <input 
                                  type="text" 
                                  value={profileAvatar}
                                  onChange={(e) => setProfileAvatar(e.target.value)}
                                  className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" 
                                />
                                <div className="flex gap-2 mt-1">
                                  {['bottts', 'identicon', 'avataaars'].map((p) => (
                                     <button
                                       key={p}
                                       type="button"
                                       onClick={() => setProfileAvatar(`https://api.dicebear.com/7.x/${p}/svg?seed=${currentUser?.uid}`)}
                                       className="px-2 py-0.5 border border-slate-700 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700 cursor-pointer"
                                     >
                                       {p.toUpperCase()}
                                     </button>
                                  ))}
                                </div>
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bio Summary</label>
                                <textarea 
                                  value={profileBio}
                                  onChange={(e) => setProfileBio(e.target.value)}
                                  rows={2}
                                  className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-none" 
                                />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reputation Tier</label>
                                <select 
                                  value={profileRep}
                                  onChange={(e) => setProfileRep(e.target.value)}
                                  className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                                >
                                   <option value="Analyst">Analyst</option>
                                   <option value="Bull">Bull</option>
                                   <option value="Bear">Bear</option>
                                   <option value="Wizard">Wizard</option>
                                </select>
                             </div>
                             <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded font-bold text-xs hover:bg-indigo-600 transition-colors cursor-pointer mt-2">Save Profile Details</button>
                          </form>
                        ) : (
                          <div className="mt-16">
                             <h2 className="text-xl font-bold flex items-center gap-2">
                                 {profileName} 
                                 {userProfileData?.idNum && <span className="text-[10px] text-emerald-400 font-mono font-bold">#{userProfileData.idNum}</span>}
                             </h2>
                             <p className="text-slate-400 text-xs mb-3">@{userProfileData?.username || 'analyst_node'}</p>
                             <div className="text-xs font-mono font-bold text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-500/10 inline-block mb-4">{profileRep}</div>
                             <p className="text-[13px] leading-relaxed max-w-xl text-slate-300">"{profileBio}"</p>
                          </div>
                        )}
                     </div>
                  </div>
               )}
            </div>

            {/* Trending/Follows Right Sidebar column */}
            <div className="w-[300px] shrink-0 py-4 hidden xl:flex flex-col gap-4 overflow-y-auto">
               {/* Trending */}
               <div className="bg-[#070b14]/60 border border-white/5 rounded-2xl p-4">
                  <h3 className="font-bold text-[13px] mb-3 text-slate-400 uppercase tracking-widest">Trending Topics</h3>
                   <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-0.5 cursor-pointer group">
                         <span className="text-[10px] text-slate-500 font-medium">Finance · Trending</span>
                         <span className="font-bold text-slate-300 group-hover:text-indigo-400 transition-colors text-xs">#MarketVol</span>
                         <span className="text-[10px] text-slate-600">23K posts</span>
                      </div>
                      <div className="flex flex-col gap-0.5 cursor-pointer group">
                         <span className="text-[10px] text-slate-500 font-medium">Technology · Trending</span>
                         <span className="font-bold text-slate-300 group-hover:text-indigo-400 transition-colors text-xs">Apple $AAPL intelligence</span>
                         <span className="text-[10px] text-slate-600">89K posts</span>
                      </div>
                      <div className="flex flex-col gap-0.5 cursor-pointer group">
                         <span className="text-[10px] text-slate-500 font-medium">Macro Policy · Trending</span>
                         <span className="font-bold text-slate-300 group-hover:text-indigo-400 transition-colors text-xs">Interest Rates Peak</span>
                         <span className="text-[10px] text-slate-600">12K posts</span>
                      </div>
                   </div>
               </div>

               {/* Suggested Roster */}
               <div className="bg-[#070b14]/60 border border-white/5 rounded-2xl p-4">
                  <h3 className="font-bold text-[13px] mb-3 text-slate-400 uppercase tracking-widest">Suggested Voices</h3>
                  <div className="flex flex-col gap-3">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0 text-xs">CB</div>
                        <div className="flex-1 min-w-0">
                           <div className="font-bold text-slate-200 text-xs truncate">Central Bank Watch</div>
                           <div className="text-[10px] text-slate-500 truncate">@cb_watcher</div>
                        </div>
                        <button className="px-2.5 py-1 bg-white text-black font-bold rounded-full text-[10px] hover:bg-slate-200 transition-colors cursor-pointer">Follow</button>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white shrink-0 text-xs">MD</div>
                        <div className="flex-1 min-w-0">
                           <div className="font-bold text-slate-200 text-xs truncate">Macro Daily</div>
                           <div className="text-[10px] text-slate-500 truncate">@macrodaily</div>
                        </div>
                        <button className="px-2.5 py-1 bg-white text-black font-bold rounded-full text-[10px] hover:bg-slate-200 transition-colors cursor-pointer">Follow</button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* Dynamic sub-servers channels visual view */
          <>
             <div className="flex-1 flex flex-col border-r border-white/5 bg-[#020617]">
                <div className="h-14 border-b border-white/5 px-6 flex items-center gap-2 shadow-sm shrink-0">
                   <Hash className="w-5 h-5 text-slate-400" />
                   <span className="font-bold text-slate-200 text-sm">
                     {channels.find(c => c.id === activeChannelId)?.name || "general"}
                   </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                   {channelMessages.map(msg => (
                      <div key={msg.id} className="flex gap-4 group">
                         <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold shrink-0 text-xs text-white overflow-hidden">
                            {msg.senderAvatar && (msg.senderAvatar.startsWith("http") || msg.senderAvatar.includes("/")) ? (
                              <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{msg.senderAvatar || (msg.senderName || "T")[0]}</span>
                            )}
                         </div>
                         <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                               <span className="font-bold text-indigo-400 text-xs">
                                 {msg.senderName}
                               </span>
                               {msg.senderIdNum && (
                                 <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                   #{msg.senderIdNum}
                                 </span>
                               )}
                               <span className="text-[9px] text-slate-500">{msg.time}</span>
                            </div>
                            {msg.imageURL && (
                              <div className="rounded-lg overflow-hidden border border-white/5 max-h-[200px] mt-2 mb-1 max-w-md">
                                 <img src={msg.imageURL} alt="Shared attachment" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <p className="text-[#e2e8f0] leading-relaxed mt-1 text-sm">{msg.text}</p>
                         </div>
                      </div>
                   ))}
                   {channelMessages.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 font-mono text-xs p-6 text-center">
                         <span>📡</span>
                         <p className="mt-2">No messages in #{channels.find(c => c.id === activeChannelId)?.name || 'general'}. Start the conversation!</p>
                      </div>
                   )}
                   <div ref={channelBottomRef} />
                </div>
                <form onSubmit={handleSendChannelMessage} className="p-4 shrink-0 flex flex-col gap-2 border-t border-white/5 bg-black/20">
                   {showChannelImgInput && (
                      <div className="bg-white/5 border border-white/10 rounded px-3 py-1 flex items-center">
                         <input 
                           type="text" 
                           value={channelImageURL}
                           onChange={(e) => setChannelImageURL(e.target.value)}
                           placeholder="Paste image link..." 
                           className="bg-transparent border-none outline-none text-xs w-full text-slate-200" 
                         />
                      </div>
                   )}
                   <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 flex items-center shadow-inner">
                      <button 
                        type="button" 
                        onClick={() => setShowChannelImgInput(!showChannelImgInput)} 
                        className={`p-1.5 mr-2 rounded hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white ${showChannelImgInput ? 'text-indigo-400' : ''}`}
                      >
                         <Image className="w-4 h-4" />
                      </button>
                      <input 
                        type="text" 
                        value={channelInputText}
                        onChange={(e) => setChannelInputText(e.target.value)}
                        placeholder={`Message #${channels.find(c => c.id === activeChannelId)?.name || 'general'}`} 
                        className="bg-transparent flex-1 outline-none font-medium placeholder:text-slate-500 text-slate-200 text-xs" 
                      />
                      <button type="submit" className="text-indigo-400 hover:text-white cursor-pointer ml-2">
                         <Send className="w-4 h-4" />
                      </button>
                   </div>
                </form>
             </div>
             {/* Channels active roster members list */}
             <div className="w-[200px] shrink-0 bg-[#070b14] hidden xl:flex flex-col p-4">
                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Online Members</div>
                
                {/* Current User */}
                <div className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors">
                   <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white overflow-hidden">
                        {userProfileData?.photoURL ? (
                          <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>ME</span>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#070b14]" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-indigo-400 font-bold text-xs">
                       {userProfileData?.displayName || "Trader"}
                     </span>
                     {userProfileData?.idNum && (
                       <span className="text-[8px] text-emerald-400 font-mono">#{userProfileData.idNum}</span>
                     )}
                   </div>
                </div>

                {/* Simulated Members */}
                <div className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors">
                   <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">T</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#070b14]" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-emerald-400 font-bold text-xs">TraderJoe</span>
                      <span className="text-[8px] text-emerald-400 font-mono">#23</span>
                   </div>
                </div>
                <div className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors">
                   <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">Q</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#070b14]" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-indigo-400 font-bold text-xs">QuantAlgo</span>
                      <span className="text-[8px] text-emerald-400 font-mono">#42</span>
                   </div>
                </div>
             </div>
          </>
        )}
      </div>

      {/* Create Server Modal */}
      {showCreateServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#080f1e] border border-[#1e293b] rounded-xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCreateServerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-200 mb-4 uppercase tracking-wider">Create a Server</h3>
            <form onSubmit={handleCreateServer} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Server Name</label>
                <input 
                  type="text" 
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="e.g. Quantitative Syndicate"
                  className="bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="mt-2 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#080f1e] border border-[#1e293b] rounded-xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCreateChannelModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-200 mb-4 uppercase tracking-wider">Create Text Channel</h3>
            <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Channel Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-bold text-sm">#</span>
                  <input 
                    type="text" 
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. options-alpha"
                    className="w-full bg-black/40 border border-[#1e293b] rounded-lg pl-7 pr-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="mt-2 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default SocialModule;
