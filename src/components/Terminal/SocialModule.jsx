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
  serverTimestamp,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { Hash, Mail, User, Plus, Check, Send, Image, X, Ban, Radio } from 'lucide-react';

export function SocialModule() {
  const { currentUser, userProfileData, updateUserProfile } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState('home'); // 'home' or serverId
  const [activeHomeTab, setActiveHomeTab] = useState('home'); // 'home' (feed) | 'messages' (DMs) | 'profile'

  // Friends Roster State
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);

  // Private messages state
  const [messages, setMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState("");
  const [chatImageURL, setChatImageURL] = useState("");
  const [showChatImgInput, setShowChatImgInput] = useState(false);
  const chatBottomRef = useRef(null);

  // Profile View State
  const [profileUserId, setProfileUserId] = useState(null); // Null/defaults to currentUser.uid
  const [viewedUserProfile, setViewedUserProfile] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState("posts"); // posts | replies | media | likes

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileRep, setProfileRep] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileBanner, setProfileBanner] = useState("");
  const [profileError, setProfileError] = useState("");

  // Follow & Block States
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState([]); // List of uids currentUser is following

  // Servers and Channels state
  const [servers, setServers] = useState([]);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [newServerName, setNewServerName] = useState("");

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  // Public Topics State
  const [topics, setTopics] = useState([]);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [activeTopicFilter, setActiveTopicFilter] = useState(null);

  // Category and Members state
  const [categories, setCategories] = useState([]);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newChannelCategoryId, setNewChannelCategoryId] = useState("");
  const [serverMembers, setServerMembers] = useState([]);

  const [channelMessages, setChannelMessages] = useState([]);
  const [channelInputText, setChannelInputText] = useState("");
  const [channelImageURL, setChannelImageURL] = useState("");
  const [showChannelImgInput, setShowChannelImgInput] = useState(false);
  const channelBottomRef = useRef(null);

  // Set default profile user
  useEffect(() => {
    if (currentUser && !profileUserId) {
      Promise.resolve().then(() => setProfileUserId(currentUser.uid));
    }
  }, [currentUser, profileUserId]);

  // Load viewed user's profile
  useEffect(() => {
    if (!profileUserId) return;
    if (profileUserId === currentUser?.uid) {
      Promise.resolve().then(() => setViewedUserProfile(null));
      return;
    }
    const docRef = doc(db, "users", profileUserId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setViewedUserProfile(snap.data());
      } else {
        setViewedUserProfile(null);
      }
    });
    return () => unsub();
  }, [profileUserId, currentUser]);

  // Populate profile edit fields
  useEffect(() => {
    const data = viewedUserProfile || userProfileData || currentUser;
    if (data) {
      Promise.resolve().then(() => {
        setProfileName(data.displayName || "");
        setProfileUsername(data.username || "");
        setProfileBio(data.bio || "Institutional macro research & active swing trading.");
        setProfileRep(data.reputation || "Analyst");
        setProfileAvatar(data.photoURL || data.avatarUrl || "");
        setProfileBanner(data.bannerUrl || "");
      });
    }
  }, [viewedUserProfile, userProfileData, currentUser, isEditingProfile]);

  // Real-time Follow and Block lists listener
  useEffect(() => {
    if (!profileUserId || !currentUser) return;
    const followerQuery = query(collection(db, "follows"), where("followingId", "==", profileUserId));
    const followingQuery = query(collection(db, "follows"), where("followerId", "==", profileUserId));
    const userFollowQuery = query(collection(db, "follows"), where("followerId", "==", currentUser.uid), where("followingId", "==", profileUserId));

    const blockQuery = query(collection(db, "blocks"), where("blockerId", "==", currentUser.uid), where("blockedId", "==", profileUserId));
    const blockedMeQuery = query(collection(db, "blocks"), where("blockerId", "==", profileUserId), where("blockedId", "==", currentUser.uid));

    const unsubFollowers = onSnapshot(followerQuery, (snap) => setFollowerCount(snap.size));
    const unsubFollowing = onSnapshot(followingQuery, (snap) => setFollowingCount(snap.size));
    const unsubUserFollow = onSnapshot(userFollowQuery, (snap) => setIsFollowing(!snap.empty));

    const unsubBlock = onSnapshot(blockQuery, (snap) => setIsBlocked(!snap.empty));
    const unsubBlockedMe = onSnapshot(blockedMeQuery, (snap) => setHasBlockedMe(!snap.empty));

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubUserFollow();
      unsubBlock();
      unsubBlockedMe();
    };
  }, [profileUserId, currentUser]);

  // Real-time listener for current user's following list (used for Suggested Voices dynamic follows)
  useEffect(() => {
    if (!currentUser) {
      Promise.resolve().then(() => setFollowingList([]));
      return;
    }
    const q = query(collection(db, "follows"), where("followerId", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => doc.data().followingId);
      setFollowingList(list);
    }, (err) => {
      console.error("Following list query failed:", err);
      setFollowingList([]);
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch servers in real-time
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "social_servers"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServers(list);
      } else {
        setServers([]);
      }
    }, () => {
      setServers([]);
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch channels for selected server
  useEffect(() => {
    if (activeWorkspace === 'home' || !currentUser) {
      Promise.resolve().then(() => {
        setChannels([]);
        setActiveChannelId(null);
      });
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
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setChannels(list);
        if (!list.some(c => c.id === activeChannelId)) {
          setActiveChannelId(list[0].id);
        }
      } else {
        const defaultCh = { id: `ch_gen_${activeWorkspace}`, serverId: activeWorkspace, name: "general" };
        setChannels([defaultCh]);
        setActiveChannelId(defaultCh.id);
      }
    }, () => {
      const defaultCh = { id: `ch_gen_${activeWorkspace}`, serverId: activeWorkspace, name: "general" };
      setChannels([defaultCh]);
      setActiveChannelId(defaultCh.id);
    });
    return () => unsub();
  }, [activeWorkspace, currentUser]);

  // Fetch channel messages
  useEffect(() => {
    if (!activeChannelId || !currentUser) {
      Promise.resolve().then(() => setChannelMessages([]));
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
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setChannelMessages(list);
      } else {
        setChannelMessages([]);
      }
    }, () => {
      setChannelMessages([]);
    });
    return () => unsub();
  }, [activeChannelId, currentUser]);

  // Load active friends list
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
              avatar: data.photoURL || data.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.id}`,
              role: data.bio || "Quantitative Analyst",
              reputation: data.reputation || "Analyst",
              idNum: data.idNum || null,
              online: true
            };
          })
          .filter((u) => u.uid !== currentUser.uid);
        setFriends(list);
      } else {
        setFriends([]);
      }
    }, () => {
      setFriends([]);
    });
    return () => unsub();
  }, [currentUser]);

  // Load DMs
  useEffect(() => {
    if (!activeFriend || !currentUser) return;
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
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setMessages(list);
      } else {
        setMessages([]);
      }
    }, () => {
      setMessages([]);
    });
    return () => unsub();
  }, [activeFriend, currentUser]);

  const chatContainerRef = useRef(null);
  const channelContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight < 150) {
            chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    } else {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (channelContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = channelContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight < 150) {
            channelBottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    } else {
        channelBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [channelMessages]);

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

  // Follow/Unfollow toggle for any user
  const toggleFollowUser = async (targetUid) => {
    if (!currentUser || !targetUid) return;
    try {
      const qSnap = await getDocs(
        query(collection(db, "follows"), where("followerId", "==", currentUser.uid), where("followingId", "==", targetUid))
      );
      if (!qSnap.empty) {
        await deleteDoc(doc(db, "follows", qSnap.docs[0].id));
      } else {
        await addDoc(collection(db, "follows"), {
          followerId: currentUser.uid,
          followingId: targetUid,
          createdAt: Date.now()
        });
        
        await addDoc(collection(db, "notifications"), {
          userId: targetUid,
          type: "follow",
          sourceId: currentUser.uid,
          isRead: false,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  // Follow/Unfollow toggle
  const handleFollowToggle = async () => {
    await toggleFollowUser(profileUserId);
  };

  // Block/Unblock toggle
  const handleBlockToggle = async () => {
    if (!currentUser || !profileUserId) return;
    try {
      const qSnap = await getDocs(
        query(collection(db, "blocks"), where("blockerId", "==", currentUser.uid), where("blockedId", "==", profileUserId))
      );
      if (!qSnap.empty) {
        await deleteDoc(doc(db, "blocks", qSnap.docs[0].id));
      } else {
        await addDoc(collection(db, "blocks"), {
          blockerId: currentUser.uid,
          blockedId: profileUserId,
          createdAt: Date.now()
        });
        // Unfollow reciprocally
        const followSnap = await getDocs(
          query(collection(db, "follows"), where("followerId", "==", currentUser.uid), where("followingId", "==", profileUserId))
        );
        if (!followSnap.empty) await deleteDoc(doc(db, "follows", followSnap.docs[0].id));

        const followSnap2 = await getDocs(
          query(collection(db, "follows"), where("followerId", "==", profileUserId), where("followingId", "==", currentUser.uid))
        );
        if (!followSnap2.empty) await deleteDoc(doc(db, "follows", followSnap2.docs[0].id));
      }
    } catch (err) {
      console.error("Block toggle failed:", err);
    }
  };

  // Save profile with unique username check and 14-day change cooldown
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");

    if (!currentUser) return;

    const cleanUsername = profileUsername.trim().toLowerCase();
    const cleanDisplayName = profileName.trim();

    if (cleanUsername !== userProfileData?.username) {
      const cooldownMs = 14 * 24 * 60 * 60 * 1000; // 14 days
      const lastChanged = userProfileData?.usernameChangedAt || 0;
      if (Date.now() - lastChanged < cooldownMs) {
        const daysLeft = Math.ceil((cooldownMs - (Date.now() - lastChanged)) / (24 * 60 * 60 * 1000));
        setProfileError(`Username change cooldown active. Retry in ${daysLeft} days.`);
        return;
      }

      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        setProfileError("Username must be 3-20 characters.");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        setProfileError("Username allowed formats: a-z, 0-9, and underscore.");
        return;
      }

      try {
        const qSnap = await getDocs(
          query(collection(db, "users"), where("username", "==", cleanUsername))
        );
        if (!qSnap.empty) {
          setProfileError("This handle is already taken.");
          return;
        }
      } catch (err) {
        setProfileError("Handle uniqueness lookup failed. Try again.");
        return;
      }
    }

    try {
      await updateUserProfile({
        displayName: cleanDisplayName,
        photoURL: profileAvatar,
        avatarUrl: profileAvatar,
        bannerUrl: profileBanner,
        bio: profileBio,
        reputation: profileRep,
        username: cleanUsername,
        usernameChangedAt: cleanUsername !== userProfileData?.username ? Date.now() : (userProfileData?.usernameChangedAt || Date.now())
      });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError("Failed to update profile: " + err.message);
    }
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const serverName = newServerName.trim();
    setNewServerName("");
    setShowCreateServerModal(false);

    const words = serverName.split(/\s+/);
    let initials = words.map(w => w[0]).join("").slice(0, 3).toUpperCase();
    if (!initials) initials = serverName.slice(0, 2).toUpperCase();

    const colors = ["bg-emerald-600", "bg-indigo-600", "bg-purple-600", "bg-rose-600", "bg-pink-600", "bg-amber-600"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    if (currentUser) {
      try {
        const docRef = await addDoc(collection(db, "social_servers"), {
          name: serverName,
          initials,
          color,
          ownerId: currentUser.uid,
          members: [currentUser.uid],
          everyoneRoleId: "everyone",
          createdAt: serverTimestamp()
        });

        const catRef = await addDoc(collection(db, "social_categories"), {
          serverId: docRef.id,
          name: "TEXT CHANNELS",
          createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "social_channels"), {
          serverId: docRef.id,
          categoryId: catRef.id,
          name: "general",
          type: "text",
          createdBy: currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to create server:", err);
      }
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const channelName = newChannelName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const catId = newChannelCategoryId || null;
    setNewChannelName("");
    setNewChannelCategoryId("");
    setShowCreateChannelModal(false);

    if (currentUser && activeWorkspace !== 'home') {
      try {
        await addDoc(collection(db, "social_channels"), {
          serverId: activeWorkspace,
          categoryId: catId,
          name: channelName,
          type: "text",
          createdBy: currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to create channel:", err);
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim().toUpperCase();
    setNewCategoryName("");
    setShowCreateCategoryModal(false);

    if (currentUser && activeWorkspace !== 'home') {
      try {
        await addDoc(collection(db, "social_categories"), {
          serverId: activeWorkspace,
          name: catName,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to create category:", err);
      }
    }
  };

  // Fetch categories for active server
  useEffect(() => {
    if (activeWorkspace === 'home') {
      Promise.resolve().then(() => setCategories([]));
      return;
    }
    const q = query(
      collection(db, "social_categories"),
      where("serverId", "==", activeWorkspace)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setCategories(list);
      } else {
        setCategories([]);
      }
    }, () => {
      setCategories([]);
    });
    return () => unsub();
  }, [activeWorkspace]);

  // Join server automatically when selected
  useEffect(() => {
    if (activeWorkspace === 'home' || !currentUser) return;
    const serverRef = doc(db, "social_servers", activeWorkspace);
    getDoc(serverRef).then(async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.members || !data.members.includes(currentUser.uid)) {
          await updateDoc(serverRef, {
            members: arrayUnion(currentUser.uid)
          });
        }
      }
    });
  }, [activeWorkspace, currentUser]);

  // Real-time server members details fetch
  useEffect(() => {
    if (activeWorkspace === 'home') {
      Promise.resolve().then(() => setServerMembers([]));
      return;
    }
    const serverRef = doc(db, "social_servers", activeWorkspace);
    const unsubServer = onSnapshot(serverRef, (serverSnap) => {
      if (serverSnap.exists()) {
        const uids = serverSnap.data().members || [];
        if (uids.length > 0) {
          const q = query(
            collection(db, "users"),
            where("uid", "in", uids.slice(0, 30))
          );
          const unsubUsers = onSnapshot(q, (usersSnap) => {
            const list = usersSnap.docs.map(d => ({
              uid: d.id,
              name: d.data().displayName || d.data().username || "Trader",
              avatar: d.data().photoURL || d.data().avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.id}`,
              idNum: d.data().idNum || null,
              online: true
            }));
            setServerMembers(list);
          }, () => {});
          return () => unsubUsers();
        } else {
          setServerMembers([]);
        }
      } else {
        setServerMembers([]);
      }
    }, () => {
      setServerMembers([]);
    });
    return () => unsubServer();
  }, [activeWorkspace]);

  // Fetch public topics in real-time
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "social_topics"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setTopics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setTopics([]);
      }
    }, () => {
      setTopics([]);
    });
    return () => unsub();
  }, [currentUser]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const cleanName = newTopicName.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!cleanName) return;

    try {
      const qSnap = await getDocs(query(collection(db, "social_topics"), where("name", "==", cleanName)));
      if (!qSnap.empty) {
        alert("Topic already exists!");
        return;
      }

      await addDoc(collection(db, "social_topics"), {
        name: cleanName,
        description: newTopicDesc.trim(),
        postCount: 0,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });

      setNewTopicName("");
      setNewTopicDesc("");
      setShowCreateTopicModal(false);
    } catch (err) {
      console.error("Failed to create topic:", err);
    }
  };

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
    }
  };

  return (
    <div className="flex h-full w-full bg-[#020617] text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Server List Column */}
      <div className="w-[72px] shrink-0 bg-black flex flex-col items-center py-4 gap-3 border-r border-white/5 z-20">
        <button 
          onClick={() => setActiveWorkspace('home')}
          className={`cyber-server-btn ${activeWorkspace === 'home' ? 'active bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50'}`}
          title="Social Core Feed"
        >
          <Hash className="w-6 h-6" />
        </button>
        <div className="w-8 h-0.5 bg-slate-800 rounded-full" />
        {servers.map(s => (
          <button 
            key={s.id}
            onClick={() => setActiveWorkspace(s.id)}
            className={`cyber-server-btn ${activeWorkspace === s.id ? `active ${s.color} text-white` : 'bg-slate-800/50 text-slate-300 border-white/5 hover:bg-slate-700/50'}`}
            title={s.name}
          >
            {s.initials}
          </button>
        ))}
        <button 
          onClick={() => setShowCreateServerModal(true)}
          className="cyber-server-btn bg-slate-800/50 text-emerald-400 border-white/5 hover:bg-emerald-500 hover:text-white"
          title="Create a Server"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex min-w-0 h-full">
        {activeWorkspace === 'home' ? (
          /* Feed Pillar (X-style layout) */
          <div className="flex-1 flex min-w-0 h-full bg-[#020617]/40">
            {/* Left Nav Menu for Feed tab switching */}
            <div className="w-[220px] shrink-0 border-r border-white/5 bg-black/10 flex flex-col p-4 justify-between">
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => {
                    setActiveHomeTab('home');
                    setProfileUserId(currentUser?.uid);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-[11.5px] font-bold uppercase tracking-widest rounded-xl transition-all border cursor-pointer font-mono ${
                     activeHomeTab === 'home' 
                       ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-shadow-[0_0_6px_rgba(129,140,248,0.4)]' 
                       : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Hash className="w-4 h-4" /> Global Feed
                </button>
                <button 
                  onClick={() => setActiveHomeTab('messages')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-[11.5px] font-bold uppercase tracking-widest rounded-xl transition-all border cursor-pointer font-mono ${
                     activeHomeTab === 'messages' 
                       ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-shadow-[0_0_6px_rgba(129,140,248,0.4)]' 
                       : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Direct Logs
                </button>
                <button 
                  onClick={() => {
                    setProfileUserId(currentUser?.uid);
                    setActiveHomeTab('profile');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-[11.5px] font-bold uppercase tracking-widest rounded-xl transition-all border cursor-pointer font-mono ${
                     activeHomeTab === 'profile' && profileUserId === currentUser?.uid 
                       ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-shadow-[0_0_6px_rgba(129,140,248,0.4)]' 
                       : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
              </div>

              {/* Self Identity Box */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                <div 
                  onClick={() => {
                    setProfileUserId(currentUser?.uid);
                    setActiveHomeTab('profile');
                  }}
                  className="w-8 h-8 rounded-full bg-indigo-500 overflow-hidden shrink-0 cursor-pointer"
                >
                  {userProfileData?.photoURL ? (
                    <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono text-xs flex justify-center mt-1">ME</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-200 text-xs truncate">{userProfileData?.displayName || "Trader"}</div>
                  <div className="text-[10px] text-slate-500 truncate">@{userProfileData?.username || "trader"}</div>
                </div>
              </div>
            </div>

            {/* Middle main view */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 bg-[#020617]/25">
                {activeHomeTab === 'home' && (
                   <SocialFeed 
                     onViewProfile={(uid) => {
                       setProfileUserId(uid);
                       setActiveHomeTab('profile');
                     }}
                     activeTopicFilter={activeTopicFilter}
                     onClearTopicFilter={() => setActiveTopicFilter(null)}
                   />
                )}

               {activeHomeTab === 'messages' && (
                  <div className="flex-1 flex min-h-0 bg-[#020617]/20">
                     {/* Friends Chat Roster */}
                     <div className="w-[200px] shrink-0 border-r border-white/5 p-4 flex flex-col gap-3">
                       <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Secure Link Roster</span>
                       <div className="flex flex-col gap-2 overflow-y-auto">
                          {friends.map((f) => (
                            <div 
                              key={f.uid} 
                              className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${activeFriend?.uid === f.uid ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                               <div onClick={() => {
                                 setProfileUserId(f.uid);
                                 setActiveHomeTab('profile');
                               }} className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                     <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-xs truncate">{f.name}</span>
                               </div>
                               <button 
                                 onClick={() => setActiveFriend(f)}
                                 className="text-indigo-400 hover:text-white p-1 rounded hover:bg-indigo-500/10 cursor-pointer"
                                 title="Open Direct Message"
                               >
                                 💬
                               </button>
                            </div>
                          ))}
                       </div>
                     </div>

                     {/* Messages Log */}
                     <div className="flex-1 flex flex-col relative bg-black/25">
                       {activeFriend ? (
                         <>
                           <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/10">
                              <div 
                                onClick={() => {
                                  setProfileUserId(activeFriend.uid);
                                  setActiveHomeTab('profile');
                                }}
                                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden shrink-0 cursor-pointer"
                              >
                                <img src={activeFriend.avatar} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                 <h3 className="font-bold text-slate-200 text-sm">
                                   {activeFriend.name} {activeFriend.idNum && <span className="text-[11px] text-emerald-400 font-mono font-bold">#{activeFriend.idNum}</span>}
                                 </h3>
                                 <p className="text-[10px] font-bold text-emerald-400">Secure Direct Link Established</p>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-500/10 ml-auto">{activeFriend.reputation}</span>
                           </div>

                           <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                              {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.senderId === 'me' ? 'ml-auto justify-end' : ''}`}>
                                   <div className={`flex flex-col gap-1 ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                                      <div className={`rounded-xl px-3.5 py-2 text-[13px] ${msg.senderId === 'me' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-slate-200 rounded-tl-sm'}`}>
                                         {msg.text}
                                         {msg.imageURL && (
                                            <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-[260px] max-h-[180px]">
                                               <img src={msg.imageURL} alt="" className="w-full h-full object-cover" />
                                            </div>
                                         )}
                                      </div>
                                      <span className="text-[8px] text-slate-600 font-mono">{msg.time}</span>
                                   </div>
                                </div>
                              ))}
                              <div ref={chatBottomRef} />
                           </div>

                           <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex flex-col gap-2.5 bg-black/25">
                              {showChatImgInput && (
                                 <div className="bg-[#070d19]/80 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
                                    <input 
                                      type="text" 
                                      value={chatImageURL}
                                      onChange={(e) => setChatImageURL(e.target.value)}
                                      placeholder="Paste chart URL or base64..." 
                                      className="bg-transparent border-none outline-none text-xs w-full text-slate-200 font-mono" 
                                    />
                                    <label className="px-3 py-1 bg-slate-800 border border-white/10 rounded-lg text-[9px] font-bold font-mono hover:bg-slate-700 cursor-pointer flex items-center justify-center text-indigo-400 transition-colors uppercase shrink-0">
                                      Upload
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setChatImageURL(reader.result);
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                 </div>
                              )}
                              <div className="bg-[#070d19]/80 border border-white/10 rounded-xl flex items-center px-4 py-2.5 focus-within:border-indigo-500/50 transition-all duration-200">
                                 <button 
                                   type="button" 
                                   onClick={() => setShowChatImgInput(!showChatImgInput)} 
                                   className={`p-1 mr-2 rounded hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white ${showChatImgInput ? 'text-indigo-400' : ''}`}
                                   title="Add Media / Chart"
                                 >
                                    <Image className="w-4 h-4" />
                                 </button>
                                 <input 
                                   type="text" 
                                   value={chatInputText}
                                   onChange={(e) => setChatInputText(e.target.value)}
                                   placeholder={`Secure line message to @${activeFriend.name.toLowerCase()}...`} 
                                   className="bg-transparent border-none outline-none text-xs w-full text-slate-200 font-mono" 
                                 />
                                 <button type="submit" className="text-indigo-400 hover:text-white cursor-pointer ml-2 shrink-0">
                                    <Send className="w-4 h-4" />
                                 </button>
                              </div>
                           </form>
                         </>
                       ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-[12px] p-6 text-center">
                            <span>💬</span>
                            <p className="mt-2">Select a trader from the roster and click the DM bubble to start a secure chat.</p>
                         </div>
                       )}
                     </div>
                   </div>
                )}
                {activeHomeTab === 'profile' && (
                  <div ref={chatContainerRef} className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 bg-[#020617]">
                      <div 
                        className="h-44 bg-cover bg-center shrink-0 relative"
                        style={{
                          backgroundImage: `url(${(viewedUserProfile?.bannerUrl || userProfileData?.bannerUrl) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'})`
                        }}
                      >
                         <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent" />
                      </div>
                     
                     <div className="px-6 pb-6 relative shrink-0">
                        {/* Profile action controls */}
                        <div className="absolute -top-12 right-6 z-10 flex gap-2">
                           {(!profileUserId || profileUserId === currentUser?.uid) ? (
                             <button 
                               onClick={() => setIsEditingProfile(!isEditingProfile)}
                               className="uiverse-btn-secondary"
                             >
                               {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                             </button>
                           ) : (
                             <div className="flex gap-2">
                               <button 
                                 onClick={handleFollowToggle}
                                 className={isFollowing ? 'uiverse-btn-secondary active' : 'uiverse-btn-secondary'}
                               >
                                 {isFollowing ? 'Following' : 'Follow'}
                               </button>
                               <button 
                                 onClick={handleBlockToggle}
                                 className="uiverse-btn-danger"
                               >
                                 {isBlocked ? 'Blocked' : 'Block'}
                               </button>
                             </div>
                           )}
                        </div>

                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full border-4 border-[#020617] bg-gradient-to-tr from-indigo-500 to-purple-600 absolute -top-12 flex items-center justify-center text-2xl font-bold z-10 shadow-lg overflow-hidden">
                           <img src={profileAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUserId || currentUser?.uid}`} alt="" className="w-full h-full object-cover" />
                        </div>

                        {/* Profile Viewer / Form */}
                         {isEditingProfile ? (
                            <form onSubmit={handleSaveProfile} className="mt-16 flex flex-col gap-4 max-w-lg bg-[#070d19]/80 border border-indigo-500/20 p-6 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.05)] backdrop-blur-xl">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Display Name</label>
                                     <input 
                                       type="text" 
                                       value={profileName}
                                       onChange={(e) => setProfileName(e.target.value)}
                                       placeholder="e.g. Aarush Kapoor"
                                       className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] outline-none transition-all duration-200 font-mono" 
                                       maxLength={50}
                                     />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Username Handle</label>
                                     <input 
                                       type="text" 
                                       value={profileUsername}
                                       onChange={(e) => setProfileUsername(e.target.value)}
                                       placeholder="e.g. aarush"
                                       className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] outline-none transition-all duration-200 font-mono" 
                                       maxLength={20}
                                     />
                                  </div>
                               </div>

                               <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Avatar Image (URL or Upload)</label>
                                  <div className="flex gap-2.5">
                                     <input 
                                       type="text" 
                                       value={profileAvatar}
                                       onChange={(e) => setProfileAvatar(e.target.value)}
                                       placeholder="Avatar URL or base64..."
                                       className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] outline-none transition-all duration-200 font-mono" 
                                     />
                                     <label className="px-4 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-[10px] font-bold font-mono hover:bg-slate-700/80 hover:text-white cursor-pointer flex items-center justify-center text-indigo-400 transition-all duration-200 shrink-0 uppercase tracking-wider">
                                       Upload
                                       <input
                                         type="file"
                                         accept="image/*"
                                         className="hidden"
                                         onChange={(e) => {
                                           const file = e.target.files?.[0];
                                           if (file) {
                                             const reader = new FileReader();
                                             reader.onloadend = () => setProfileAvatar(reader.result);
                                             reader.readAsDataURL(file);
                                           }
                                         }}
                                       />
                                     </label>
                                  </div>
                               </div>

                               <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Banner Image (URL or Upload)</label>
                                  <div className="flex gap-2.5">
                                     <input 
                                       type="text" 
                                       value={profileBanner}
                                       onChange={(e) => setProfileBanner(e.target.value)}
                                       placeholder="Banner URL or base64..."
                                       className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] outline-none transition-all duration-200 font-mono" 
                                     />
                                     <label className="px-4 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-[10px] font-bold font-mono hover:bg-slate-700/80 hover:text-white cursor-pointer flex items-center justify-center text-indigo-400 transition-all duration-200 shrink-0 uppercase tracking-wider">
                                       Upload
                                       <input
                                         type="file"
                                         accept="image/*"
                                         className="hidden"
                                         onChange={(e) => {
                                           const file = e.target.files?.[0];
                                           if (file) {
                                             const reader = new FileReader();
                                             reader.onloadend = () => setProfileBanner(reader.result);
                                             reader.readAsDataURL(file);
                                           }
                                         }}
                                       />
                                     </label>
                                  </div>
                               </div>

                               <div className="grid grid-cols-3 gap-4 items-center">
                                  <div className="col-span-2 flex flex-col gap-1.5">
                                     <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Reputation Rank</label>
                                     <select 
                                       value={profileRep}
                                       onChange={(e) => setProfileRep(e.target.value)}
                                       className="bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] outline-none transition-all duration-200 font-mono"
                                     >
                                        <option value="Analyst">Analyst</option>
                                        <option value="Bull">Bull</option>
                                        <option value="Bear">Bear</option>
                                        <option value="Wizard">Wizard</option>
                                     </select>
                                  </div>
                                  <div className="flex flex-col items-center justify-center mt-4">
                                     {profileAvatar && (
                                        <div className="w-12 h-12 rounded-full border border-indigo-500/30 overflow-hidden shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                                           <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                                        </div>
                                     )}
                                  </div>
                               </div>

                               <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Profile Bio</label>
                                  <textarea 
                                    value={profileBio}
                                    onChange={(e) => setProfileBio(e.target.value)}
                                    rows={2}
                                    placeholder="Write a bio..."
                                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] outline-none resize-none transition-all duration-200 font-sans" 
                                    maxLength={280}
                                  />
                               </div>
                               
                               {profileError && <span className="text-rose-400 font-mono text-[10px] font-bold">{profileError}</span>}
                               
                               <button type="submit" className="uiverse-btn-primary mt-2 w-full">Save Profile</button>
                            </form>
                        ) : (
                          <div className="mt-16">
                             <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                                 {viewedUserProfile ? viewedUserProfile.displayName : (userProfileData?.displayName || currentUser?.displayName)} 
                                 {(viewedUserProfile?.idNum || userProfileData?.idNum) && <span className="text-[10px] text-emerald-400 font-mono font-bold">#{viewedUserProfile ? viewedUserProfile.idNum : userProfileData.idNum}</span>}
                             </h2>
                             <p className="text-slate-400 text-xs mb-3">@{viewedUserProfile ? viewedUserProfile.username : userProfileData?.username}</p>
                             
                             <div className="flex gap-2 items-center mb-4">
                               <div className="text-xs font-mono font-bold text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-500/10 inline-block">{viewedUserProfile ? viewedUserProfile.reputation : profileRep}</div>
                               {/* Follow metrics display */}
                               <span className="text-[10.5px] font-mono text-slate-500 uppercase">
                                 <strong>{followingCount}</strong> Following · <strong>{followerCount}</strong> Followers
                               </span>
                             </div>

                             <p className="text-[13px] leading-relaxed max-w-xl text-slate-300 italic">
                               "{viewedUserProfile ? viewedUserProfile.bio : profileBio}"
                             </p>

                             {/* Profile tabs and feeds */}
                             {hasBlockedMe ? (
                               <div className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center text-rose-400 font-mono text-xs tracking-wider">
                                 🚫 Profile posts are hidden because you have been blocked by this trader.
                               </div>
                             ) : (
                               <div className="mt-8 border-t border-white/5 pt-4">
                                  {/* Profile Feed Tab switcher */}
                                  <div className="flex border-b border-white/5 mb-4 gap-4 text-[11.5px] font-mono uppercase tracking-widest text-slate-500">
                                    {["posts", "replies", "media", "likes"].map(tab => (
                                      <button 
                                        key={tab} 
                                        onClick={() => setActiveProfileTab(tab)}
                                        className={`pb-2.5 cursor-pointer relative transition-colors ${activeProfileTab === tab ? 'text-indigo-400 font-bold' : 'hover:text-slate-300'}`}
                                      >
                                        {tab}
                                        {activeProfileTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,1)]" />}
                                      </button>
                                    ))}
                                  </div>
                                  
                                  <div className="bg-transparent border border-white/5 rounded-xl overflow-hidden shadow-inner">
                                    <SocialFeed 
                                      userIdFilter={profileUserId} 
                                      tabFilter={activeProfileTab} 
                                      onViewProfile={(uid) => {
                                        setProfileUserId(uid);
                                        setActiveHomeTab('profile');
                                      }}
                                    />
                                  </div>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                  </div>
               )}
            </div>

            {/* Trending/Follows Right Sidebar column */}
            <div className="w-[300px] shrink-0 py-4 hidden xl:flex flex-col gap-4 overflow-y-auto bg-black/10 px-4">
               {/* Trending (dynamic Public Topics) */}
                <div className="bg-[#070b14]/60 border border-white/5 rounded-2xl p-4">
                   <div className="flex justify-between items-center mb-3.5">
                      <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest font-mono">Public Topics</h3>
                      <button 
                        onClick={() => setShowCreateTopicModal(true)}
                        className="text-[9px] font-bold text-indigo-400 hover:text-white font-mono uppercase border border-indigo-500/30 px-1.5 py-0.5 rounded hover:bg-indigo-500/10 cursor-pointer"
                        title="Create a new public topic thread"
                      >
                        + NEW
                      </button>
                   </div>
                    <div className="flex flex-col gap-3 font-mono">
                       {topics.map(topic => (
                          <div 
                            key={topic.id} 
                            onClick={() => {
                              setActiveTopicFilter(activeTopicFilter === topic.name ? null : topic.name);
                              setActiveHomeTab('home');
                            }}
                            className={`flex flex-col gap-0.5 cursor-pointer group p-1.5 rounded transition-all ${activeTopicFilter === topic.name ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5'}`}
                          >
                             <span className="text-[9px] text-slate-500 uppercase font-medium">Topic Channel</span>
                             <span className="font-bold text-slate-300 group-hover:text-indigo-400 transition-colors text-xs">#{topic.name}</span>
                             {topic.description && <span className="text-[9.5px] text-slate-400 font-sans italic line-clamp-1">"{topic.description}"</span>}
                             <span className="text-[9px] text-slate-600">{topic.postCount || 0} posts</span>
                          </div>
                       ))}
                       {topics.length === 0 && (
                          <span className="text-[10px] text-slate-600 italic">No public topics found. Create the first one!</span>
                       )}
                    </div>
                </div>

               {/* Suggested Voices */}
               <div className="bg-[#070b14]/60 border border-white/5 rounded-2xl p-4">
                  <h3 className="font-bold text-[10px] mb-3.5 text-slate-500 uppercase tracking-widest font-mono">Suggested Voices</h3>
                  <div className="flex flex-col gap-3">
                     {friends.slice(0, 3).map((f) => {
                        const isFollowingVoice = followingList.includes(f.uid);
                        return (
                           <div key={f.uid} className="flex items-center justify-between gap-2 font-mono">
                              <div 
                                 onClick={() => {
                                    setProfileUserId(f.uid);
                                    setActiveHomeTab('profile');
                                 }}
                                 className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                              >
                                 <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/5 group-hover:border-indigo-500/50 transition-all duration-200">
                                    <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-200 text-xs truncate group-hover:text-indigo-400 transition-colors">{f.name}</div>
                                    <div className="text-[9px] text-slate-500 truncate">@{f.name.toLowerCase().replace(/\s+/g, '')}</div>
                                 </div>
                              </div>
                              <button
                                 onClick={() => toggleFollowUser(f.uid)}
                                 className={`px-2 py-1 text-[8.5px] font-bold uppercase font-mono tracking-widest rounded-md border transition-all cursor-pointer ${
                                    isFollowingVoice
                                       ? 'bg-transparent text-indigo-400 border-indigo-500/25 shadow-[0_0_8px_rgba(99,102,241,0.1)]'
                                       : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-500 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                                 }`}
                              >
                                 {isFollowingVoice ? 'Following' : 'Follow'}
                              </button>
                           </div>
                        );
                     })}
                     {friends.length === 0 && (
                        <span className="text-[9.5px] text-slate-600 italic">No other users found</span>
                     )}
                  </div>
               </div>
            </div>
          </div>
                 ) : (
          /* Servers Pillar (Discord-style channels visual view) */
          <>
             {/* Channels Sidebar */}
             <div className="w-[220px] shrink-0 bg-black/30 border-r border-white/5 flex flex-col justify-between">
                <div className="flex flex-col min-h-0">
                   {/* Server Header */}
                   <div className="h-14 border-b border-white/5 px-4 flex items-center justify-between bg-black/10 shrink-0">
                      <span className="font-bold text-slate-200 text-[13px] truncate font-mono tracking-wider">
                         {servers.find(s => s.id === activeWorkspace)?.name || "Discord Server"}
                      </span>
                      <button 
                        onClick={() => setShowCreateCategoryModal(true)}
                        className="text-[9px] font-bold text-slate-500 hover:text-white border border-white/10 px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer font-mono"
                        title="Create Category"
                      >
                        + CAT
                      </button>
                   </div>

                   {/* Channels & Categories List */}
                   <div ref={channelContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10">
                      {/* Uncategorized channels */}
                      {channels.filter(c => !c.categoryId).length > 0 && (
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono px-2">Uncategorized</span>
                            {channels.filter(c => !c.categoryId).map(ch => (
                               <button 
                                 key={ch.id}
                                 onClick={() => setActiveChannelId(ch.id)}
                                 className={`discord-channel-btn ${activeChannelId === ch.id ? 'active' : ''}`}
                               >
                                 <span># {ch.name}</span>
                               </button>
                            ))}
                         </div>
                      )}

                      {/* Grouped by categories */}
                      {categories.map(cat => {
                         const catChannels = channels.filter(c => c.categoryId === cat.id);
                         return (
                            <div key={cat.id} className="flex flex-col gap-1">
                               <div className="flex items-center justify-between px-2 text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono group">
                                  <span>{cat.name}</span>
                                  <button 
                                    onClick={() => {
                                      setNewChannelCategoryId(cat.id);
                                      setShowCreateChannelModal(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-white transition-all text-xs font-bold px-1 rounded cursor-pointer"
                                    title="Create Channel in Category"
                                  >
                                    +
                                  </button>
                               </div>
                               {catChannels.map(ch => (
                                  <button 
                                    key={ch.id}
                                    onClick={() => setActiveChannelId(ch.id)}
                                    className={`discord-channel-btn ${activeChannelId === ch.id ? 'active' : ''}`}
                                  >
                                    <span># {ch.name}</span>
                                  </button>
                               ))}
                               {catChannels.length === 0 && (
                                  <span className="text-[9px] text-slate-600 italic px-3 font-mono">No channels</span>
                                )}
                            </div>
                         );
                      })}
                   </div>
                </div>

                {/* Bottom identity panel */}
                <div className="bg-black/20 border-t border-white/5 p-3 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 overflow-hidden shrink-0 border border-white/10">
                         {userProfileData?.photoURL ? (
                           <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <span className="font-mono text-xs flex justify-center mt-1 text-white">ME</span>
                         )}
                      </div>
                      <div className="min-w-0">
                         <div className="font-bold text-slate-200 text-xs truncate leading-none">{userProfileData?.displayName || "Trader"}</div>
                         <div className="text-[9px] text-slate-500 truncate mt-0.5">@{userProfileData?.username || "trader"}</div>
                      </div>
                   </div>
                   <button 
                     onClick={async () => {
                       const serverRef = doc(db, "social_servers", activeWorkspace);
                       if (currentUser) {
                         await updateDoc(serverRef, {
                           members: arrayRemove(currentUser.uid)
                         });
                         setActiveWorkspace('home');
                       }
                     }}
                     className="text-[9px] font-mono font-bold text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:bg-rose-500/10 px-2 py-0.5 rounded cursor-pointer uppercase"
                     title="Leave Server"
                   >
                     LEAVE
                   </button>
                </div>
             </div>

             <div className="flex-1 flex flex-col border-r border-white/5 bg-[#020617]/40">
                <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between shadow-sm shrink-0 bg-black/10">
                   <div className="flex items-center gap-2">
                     <Hash className="w-5 h-5 text-slate-400 animate-pulse" />
                     <span className="font-bold text-slate-200 text-[13.5px] uppercase font-mono tracking-wide">
                       {channels.find(c => c.id === activeChannelId)?.name || "general"}
                     </span>
                   </div>
                   <span className="text-[8px] font-mono text-slate-500 border border-white/5 px-2 py-0.5 rounded bg-white/5">SECURE CHANNEL LINK</span>
                </div>
                
                {/* Channel messages list */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                   {channelMessages.map(msg => (
                      <div key={msg.id} className="flex gap-4 group animate-in fade-in duration-200">
                         <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold shrink-0 text-xs text-white overflow-hidden">
                            {msg.senderAvatar && (msg.senderAvatar.startsWith("http") || msg.senderAvatar.includes("/")) ? (
                              <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{msg.senderAvatar || (msg.senderName || "T")[0]}</span>
                            )}
                         </div>
                         <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                               <span className="font-bold text-indigo-400 text-xs hover:underline cursor-pointer" onClick={() => {
                                 setProfileUserId(msg.senderId);
                                 setActiveHomeTab('profile');
                                 setActiveWorkspace('home');
                                }}>
                                 {msg.senderName}
                               </span>
                               {msg.senderIdNum && (
                                 <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                   #{msg.senderIdNum}
                                 </span>
                               )}
                               <span className="text-[9px] text-slate-500 font-mono">{msg.time}</span>
                            </div>
                            <p className="text-[#e2e8f0] leading-relaxed mt-1 text-[13.5px] break-words">{msg.text}</p>
                            {msg.imageURL && (
                               <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 max-w-[320px] max-h-[220px]">
                                  <img src={msg.imageURL} alt="" className="w-full h-full object-cover" />
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                   {channelMessages.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 font-mono text-[11px] p-6 text-center">
                         <span>📡</span>
                         <p className="mt-2">No messages in #{channels.find(c => c.id === activeChannelId)?.name || 'general'}. Start the conversation!</p>
                      </div>
                   )}
                   <div ref={channelBottomRef} />
                </div>
                
                {/* Send message form */}
                <form onSubmit={handleSendChannelMessage} className="p-4 shrink-0 flex flex-col gap-2.5 border-t border-white/5 bg-black/35">
                   {showChannelImgInput && (
                      <div className="bg-[#070d19]/80 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
                         <input 
                           type="text" 
                           value={channelImageURL}
                           onChange={(e) => setChannelImageURL(e.target.value)}
                           placeholder="Paste chart URL or base64..." 
                           className="bg-transparent border-none outline-none text-xs w-full text-slate-200 font-mono" 
                         />
                         <label className="px-3 py-1 bg-slate-800 border border-white/10 rounded-lg text-[9px] font-bold font-mono hover:bg-slate-700 cursor-pointer flex items-center justify-center text-indigo-400 transition-colors uppercase shrink-0">
                           Upload
                           <input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setChannelImageURL(reader.result);
                                 reader.readAsDataURL(file);
                               }
                             }}
                           />
                         </label>
                      </div>
                   )}
                   <div className="bg-[#070d19]/80 border border-white/10 rounded-xl px-4 py-2.5 flex items-center shadow-inner focus-within:border-indigo-500/50 transition-all duration-200">
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
                        className="bg-transparent flex-1 outline-none placeholder:text-slate-500 text-slate-200 text-xs font-mono" 
                      />
                      <button 
                        type="submit" 
                        className="text-indigo-400 hover:text-white cursor-pointer ml-2 shrink-0"
                      >
                         <Send className="w-4 h-4" />
                      </button>
                   </div>
                </form>
             </div>
             
             {/* Channels active members list */}
             <div className="w-[200px] shrink-0 bg-[#070b14] hidden xl:flex flex-col p-4">
                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2 font-mono">Online Members ({serverMembers.length})</div>
                <div className="flex flex-col gap-3 overflow-y-auto scrollbar-none">
                   {serverMembers.map(member => (
                      <div 
                        key={member.uid}
                        onClick={() => {
                          setProfileUserId(member.uid);
                          setActiveHomeTab('profile');
                          setActiveWorkspace('home');
                        }}
                        className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                      >
                         <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white overflow-hidden border border-white/10">
                               <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#070b14]" />
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-indigo-400 font-bold text-xs truncate">{member.name}</span>
                            {member.idNum && <span className="text-[8px] text-emerald-400 font-mono">#{member.idNum}</span>}
                         </div>
                      </div>
                   ))}
                   {serverMembers.length === 0 && (
                      <span className="text-[10px] text-slate-600 italic">No members online</span>
                   )}
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
            <h3 className="text-base font-bold text-slate-200 mb-4 uppercase tracking-wider font-mono">Create a Server</h3>
            <form onSubmit={handleCreateServer} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Server Name</label>
                <input 
                  type="text" 
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="e.g. Quantitative Syndicate"
                  className="bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="uiverse-btn-primary mt-2 w-full"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      {showCreateTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#080f1e] border border-[#1e293b] rounded-xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCreateTopicModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-200 mb-4 uppercase tracking-wider font-mono">Create Public Topic</h3>
            <form onSubmit={handleCreateTopic} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Topic Name (e.g. Inflation)</label>
                <input 
                  type="text" 
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g. inflation"
                  className="bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Description</label>
                <textarea 
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="e.g. CPI reports, macro policies, and price index details..."
                  rows={2}
                  className="bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono resize-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="uiverse-btn-primary mt-2 w-full"
              >
                Create Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#080f1e] border border-[#1e293b] rounded-xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCreateCategoryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-200 mb-4 uppercase tracking-wider font-mono">Create Category</h3>
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Category Name</label>
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. CHAT CHANNELS"
                  className="bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="uiverse-btn-primary mt-2 w-full"
              >
                Create Category
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
            <h3 className="text-base font-bold text-slate-200 mb-4 uppercase tracking-wider font-mono">Create Channel</h3>
            <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Channel Name</label>
                <input 
                  type="text" 
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. trading-ideas"
                  className="bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Category</label>
                <select
                  value={newChannelCategoryId}
                  onChange={(e) => setNewChannelCategoryId(e.target.value)}
                  className="bg-black border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                >
                  <option value="">None / Uncategorized</option>
                  {categories.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="uiverse-btn-primary mt-2 w-full"
              >
                Create Channel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialModule;
