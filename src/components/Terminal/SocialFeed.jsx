import { useState, useEffect } from "react";
import { MessageSquare, Heart, Repeat2, Image, Edit2, Check, X, Bookmark, Ban, ThumbsDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  where,
  getDocs
} from "firebase/firestore";

const getCurrentTime = () => Date.now();
import StockMention from "../Forum/StockMention";

export function SocialFeed({ onViewProfile, userIdFilter = null, tabFilter = "posts", activeTopicFilter = null, onClearTopicFilter = null }) {
  const { currentUser, userProfileData } = useAuth();
  const [activeTab, setActiveTab] = useState("For You"); // "For You" or "Following"
  
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [inputText, setInputText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [showMediaFields, setShowMediaFields] = useState(false);

  // Edit post state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editInputText, setEditInputText] = useState("");

  // Comments state
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [prevCommentsPostId, setPrevCommentsPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  if (openCommentsPostId !== prevCommentsPostId) {
    setPrevCommentsPostId(openCommentsPostId);
    setComments([]);
  }

  // Load follows list to filter Following feed
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "follows"), where("followerId", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs.map(doc => doc.data().followingId);
      setFollowingIds([...ids, currentUser.uid]); // include self
    });
    return () => unsub();
  }, [currentUser]);

  // Load Feed Posts
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "social_posts"),
      orderBy("createdAtMs", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          authorId: doc.data().authorId || "",
          authorName: doc.data().authorName,
          authorUsername: doc.data().authorUsername || "",
          authorAvatar: doc.data().authorAvatar,
          text: doc.data().text || "",
          imageURL: doc.data().imageURL || null,
          mediaUrls: doc.data().mediaUrls || [],
          likes: doc.data().likes || 0,
          likedBy: doc.data().likedBy || [],
          dislikes: doc.data().dislikes || 0,
          dislikedBy: doc.data().dislikedBy || [],
          authorIdNum: doc.data().authorIdNum || null,
          repostCount: doc.data().repostCount || 0,
          repostOfId: doc.data().repostOfId || null,
          quotedPostId: doc.data().quotedPostId || null,
          repostedFromData: doc.data().repostedFromData || null,
          quotedPostData: doc.data().quotedPostData || null,
          commentCount: doc.data().commentCount || 0,
          tags: doc.data().tags || [],
          isDeleted: doc.data().isDeleted || false,
          editedAt: doc.data().editedAt || null,
          createdAtMs: doc.data().createdAtMs || (doc.data().createdAt ? doc.data().createdAt.seconds * 1000 : Date.now()),
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString() : "Just now"
        }));
        setPosts(list);
      } else {
        setPosts([]);
      }
    }, (err) => {
      console.error("Firestore feed listener error:", err);
    });

    return () => unsub();
  }, [currentUser]);

  // Load Comments for Open Post
  useEffect(() => {
    if (!openCommentsPostId || !currentUser) return;

    const q = query(
      collection(db, "post_comments"),
      where("postId", "==", openCommentsPostId)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          authorId: doc.data().authorId || "",
          authorName: doc.data().authorName,
          authorUsername: doc.data().authorUsername || "",
          authorAvatar: doc.data().authorAvatar,
          text: doc.data().text || "",
          isDeleted: doc.data().isDeleted || false,
          createdAt: doc.data().createdAt,
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"
        }));
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tA - tB;
        });
        setComments(list);
      } else {
        setComments([]);
      }
    }, (err) => {
      console.error("Comments query error:", err);
    });

    return () => unsub();
  }, [openCommentsPostId, currentUser]);

  // Handle Post Submit with Mentions, Hashtags, Reposts & Quotes
  const handlePostSubmit = async (e, repostOfId = null, quotedPostId = null, quotedPostData = null) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !imageURL.trim() && !repostOfId && !quotedPostId) return;

    const postContent = inputText;
    const postImg = imageURL;

    setInputText("");
    setImageURL("");
    setShowMediaFields(false);

    if (!currentUser) return;

    // Extract tags: #tag
    const tags = postContent.split(/\s+/).filter(w => w.startsWith("#")).map(w => w.toLowerCase());
    
    // Normalise and upsert Hashtags & Topics
    for (const tag of tags) {
      const cleanTag = tag.slice(1).replace(/[^a-z0-9]/g, '');
      if (cleanTag) {
        try {
          const tagSnap = await getDocs(query(collection(db, "hashtags"), where("tag", "==", cleanTag)));
          if (tagSnap.empty) {
            await addDoc(collection(db, "hashtags"), { tag: cleanTag, postCount: 1 });
          } else {
            const tagRef = doc(db, "hashtags", tagSnap.docs[0].id);
            await updateDoc(tagRef, { postCount: increment(1) });
          }

          // Real-time integration: also update social_topics collection count if topic matches
          const topicSnap = await getDocs(query(collection(db, "social_topics"), where("name", "==", cleanTag)));
          if (!topicSnap.empty) {
            const topicRef = doc(db, "social_topics", topicSnap.docs[0].id);
            await updateDoc(topicRef, { postCount: increment(1) });
          }
        } catch (err) {
          console.error("Failed to upsert hashtag:", err);
        }
      }
    }

    // Resolve mentions: @username
    const mentions = postContent.split(/\s+/).filter(w => w.startsWith("@")).map(w => w.toLowerCase().slice(1).replace(/[^a-z0-9_]/g, ''));
    const resolvedMentions = [];

    for (const mention of mentions) {
      if (mention) {
        try {
          const userSnap = await getDocs(query(collection(db, "users"), where("username", "==", mention)));
          if (!userSnap.empty) {
            const targetUser = userSnap.docs[0].data();
            resolvedMentions.push(targetUser.id || targetUser.uid);
            
            // Add notification
            await addDoc(collection(db, "notifications"), {
              userId: targetUser.id || targetUser.uid,
              type: "mention",
              sourceId: currentUser.uid,
              isRead: false,
              createdAt: Date.now()
            });
          }
        } catch (err) {
          console.error("Mention resolution failed:", err);
        }
      }
    }

    try {
      await addDoc(collection(db, "social_posts"), {
        authorId: currentUser.uid,
        authorName: userProfileData?.displayName || currentUser.displayName || "Trader",
        authorUsername: userProfileData?.username || "",
        authorIdNum: userProfileData?.idNum || null,
        authorAvatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        text: postContent,
        imageURL: postImg || null,
        mediaUrls: postImg ? [postImg] : [],
        likes: 0,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        repostCount: 0,
        repostOfId,
        quotedPostId,
        quotedPostData,
        commentCount: 0,
        tags,
        isDeleted: false,
        editedAt: null,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to add post to Firestore:", err);
    }
  };

  // Handle Likes
  const handleLike = async (post) => {
    if (!currentUser) return;
    const postRef = doc(db, "social_posts", post.id);
    const hasLiked = post.likedBy?.includes(currentUser.uid);
    const hasDisliked = post.dislikedBy?.includes(currentUser.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUser.uid),
          likes: increment(-1)
        });
      } else {
        const updates = {
          likedBy: arrayUnion(currentUser.uid),
          likes: increment(1)
        };
        if (hasDisliked) {
          updates.dislikedBy = arrayRemove(currentUser.uid);
          updates.dislikes = increment(-1);
        }
        await updateDoc(postRef, updates);

        // Trigger notification
        if (post.authorId !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: post.authorId,
            type: "like",
            sourceId: post.id,
            isRead: false,
            createdAt: Date.now()
          });
        }
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  const handleDislike = async (post) => {
    if (!currentUser) return;
    const postRef = doc(db, "social_posts", post.id);
    const hasLiked = post.likedBy?.includes(currentUser.uid);
    const hasDisliked = post.dislikedBy?.includes(currentUser.uid);

    try {
      if (hasDisliked) {
        await updateDoc(postRef, {
          dislikedBy: arrayRemove(currentUser.uid),
          dislikes: increment(-1)
        });
      } else {
        const updates = {
          dislikedBy: arrayUnion(currentUser.uid),
          dislikes: increment(1)
        };
        if (hasLiked) {
          updates.likedBy = arrayRemove(currentUser.uid);
          updates.likes = increment(-1);
        }
        await updateDoc(postRef, updates);
      }
    } catch (err) {
      console.error("Dislike toggle failed:", err);
    }
  };

  // Handle Repost (Idempotent check + post creation)
  const handleRepost = async (post) => {
    if (!currentUser) return;
    
    // Check if already reposted
    try {
      const qSnap = await getDocs(
        query(
          collection(db, "social_posts"),
          where("authorId", "==", currentUser.uid),
          where("repostOfId", "==", post.id)
        )
      );
      if (!qSnap.empty) return; // already reposted

      await handlePostSubmit(null, post.id, null, {
        text: post.text,
        authorName: post.authorName,
        authorUsername: post.authorUsername,
        authorAvatar: post.authorAvatar,
        authorId: post.authorId
      });

      const originalRef = doc(db, "social_posts", post.id);
      await updateDoc(originalRef, {
        repostCount: increment(1)
      });

      // Notification
      if (post.authorId !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: post.authorId,
          type: "repost",
          sourceId: post.id,
          isRead: false,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Repost failed:", err);
    }
  };

  // Handle Quote Post Submit
  const handleQuoteSubmit = (post) => {
    if (!inputText.trim()) return;
    handlePostSubmit(null, null, post.id, {
      text: post.text,
      authorName: post.authorName,
      authorUsername: post.authorUsername,
      authorAvatar: post.authorAvatar,
      authorId: post.authorId
    });
  };

  // Handle Edit Post
  const handleEditPost = async (post) => {
    if (!editInputText.trim()) return;
    const postRef = doc(db, "social_posts", post.id);
    try {
      await updateDoc(postRef, {
        text: editInputText,
        editedAt: Date.now()
      });
      setEditingPostId(null);
    } catch (err) {
      console.error("Failed to edit post:", err);
    }
  };

  // Handle Soft Delete Post
  const handleDeletePost = async (postId) => {
    const postRef = doc(db, "social_posts", postId);
    try {
      await updateDoc(postRef, {
        isDeleted: true
      });
    } catch (err) {
      console.error("Failed to soft-delete post:", err);
    }
  };

  // Handle Comment Submit
  const handleCommentSubmit = async (e, postId, postAuthorId) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;

    const text = commentInput;
    setCommentInput("");

    try {
      await addDoc(collection(db, "post_comments"), {
        postId,
        authorId: currentUser.uid,
        authorName: userProfileData?.displayName || currentUser.displayName || "Trader",
        authorUsername: userProfileData?.username || "",
        authorAvatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        text,
        isDeleted: false,
        createdAt: serverTimestamp()
      });

      const postRef = doc(db, "social_posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });

      // Notify original post author
      if (postAuthorId !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: postAuthorId,
          type: "reply",
          sourceId: postId,
          isRead: false,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Comment submission failed:", err);
    }
  };

  // Render clickable handle/ticker markers
  const renderPostText = (text) => {
    if (!text) return "";
    const parts = text.split(/(\$[A-Z]{1,5}|@[a-zA-Z0-9_]{3,20}|#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (/^\$[A-Z]{1,5}$/.test(part)) {
        return <StockMention key={i} symbol={part.slice(1)} />;
      }
      if (/^@[a-zA-Z0-9_]{3,20}$/.test(part)) {
        // Resolve mention lookup on click
        return (
          <span 
            key={i} 
            onClick={async (e) => {
              e.stopPropagation();
              const qSnap = await getDocs(query(collection(db, "users"), where("username", "==", part.slice(1).toLowerCase())));
              if (!qSnap.empty) {
                onViewProfile(qSnap.docs[0].id || qSnap.docs[0].data().uid);
              }
            }}
            className="text-indigo-400 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      if (/^#[a-zA-Z0-9_]+$/.test(part)) {
        return (
          <span key={i} className="text-amber-500 font-bold">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Filter and rank displayed posts
  const displayedPosts = posts.filter(post => {
    // If filtering by a public topic (hashtag)
    if (activeTopicFilter) {
      const matchText = `#${activeTopicFilter.toLowerCase()}`;
      return post.text?.toLowerCase().includes(matchText);
    }

    // 1. If viewing a specific user's profile tab
    if (userIdFilter) {
      if (post.authorId !== userIdFilter) return false;
      if (tabFilter === "posts") return !post.parentPostId && !post.repostOfId;
      if (tabFilter === "replies") return !!post.parentPostId;
      if (tabFilter === "media") return !!post.imageURL || post.mediaUrls?.length > 0;
      if (tabFilter === "likes") return post.likedBy?.includes(userIdFilter);
      return true;
    }
    
    // 2. If chronological following feed filter
    if (activeTab === "Following") {
      return followingIds.includes(post.authorId);
    }
    
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent text-slate-100 font-sans" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      
      {/* Header Tabs (Hidden on Profile view) */}
      {!userIdFilter && (
        <div className="flex flex-col border-b border-white/5 bg-black/45 backdrop-blur-md shrink-0">
          <div className="px-4 py-3 flex justify-between items-center border-b border-white/5">
            <h2 className="text-[14px] font-bold tracking-widest text-slate-200 font-mono uppercase">FlowDesk</h2>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex w-full">
            <button 
              onClick={() => setActiveTab("For You")}
              className="flex-1 py-3.5 text-[12px] font-bold text-center hover:bg-white/5 transition-colors relative cursor-pointer font-mono tracking-wider uppercase"
            >
              <span className={activeTab === "For You" ? "text-slate-100 font-bold" : "text-slate-500"}>For you</span>
              {activeTab === "For You" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
            </button>
            <button 
              onClick={() => setActiveTab("Following")}
              className="flex-1 py-3.5 text-[12px] font-bold text-center hover:bg-white/5 transition-colors relative cursor-pointer font-mono tracking-wider uppercase"
            >
              <span className={activeTab === "Following" ? "text-slate-100 font-bold" : "text-slate-500"}>Following</span>
              {activeTab === "Following" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
            </button>
          </div>
        </div>
      )}

      {/* Active Topic Filter Header */}
      {activeTopicFilter && (
        <div className="p-3 bg-indigo-500/10 border-b border-indigo-500/20 flex justify-between items-center px-4 shrink-0 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Filtered Topic:</span>
            <span className="text-xs font-bold text-[#e2e8f0] bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">#{activeTopicFilter}</span>
          </div>
          {onClearTopicFilter && (
            <button 
              onClick={onClearTopicFilter}
              className="text-[9px] font-bold text-slate-400 hover:text-white font-mono uppercase cursor-pointer bg-white/5 border border-white/10 px-2 py-0.5 rounded transition-all"
            >
              Clear Filter ✕
            </button>
          )}
        </div>
      )}

      {/* Compose Box (Hidden on profile unless it's own profile) */}
      {(!userIdFilter || userIdFilter === currentUser?.uid) && (
        <form onSubmit={(e) => handlePostSubmit(e)} className="premium-compose-container mb-4 flex gap-3 flex-col shrink-0">
          <div className="flex gap-3">
            <div 
              onClick={() => onViewProfile(currentUser?.uid)}
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
            >
              {userProfileData?.photoURL ? (
                <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm text-slate-300">ME</span>
              )}
            </div>
            <div className="flex-1">
               <textarea 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="Share analysis, charts, or macro thesis... Use $TICKER, @username, #tag" 
                 className="premium-textarea"
                 rows={2}
                 maxLength={280}
               />
            </div>
          </div>

          {showMediaFields && (
            <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/5 ml-13 animate-in fade-in duration-200">
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={imageURL}
                   onChange={(e) => setImageURL(e.target.value)}
                   placeholder="Paste analysis image URL or Base64 data..." 
                   className="flex-1 bg-transparent border-none outline-none text-[11px] text-slate-300 placeholder:text-slate-600 font-mono"
                 />
                 <label className="px-3 py-1 bg-slate-800 border border-white/10 rounded text-[10px] font-bold font-mono hover:bg-slate-700 cursor-pointer flex items-center justify-center text-indigo-400">
                   UPLOAD FILE
                   <input
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = () => setImageURL(reader.result);
                         reader.readAsDataURL(file);
                       }
                     }}
                   />
                 </label>
               </div>
               {imageURL && (
                 <div className="relative mt-2 w-32 h-20 rounded border border-white/15 overflow-hidden group">
                   <img src={imageURL} alt="Preview" className="w-full h-full object-cover" />
                   <button 
                     type="button" 
                     onClick={() => setImageURL("")}
                     className="absolute top-1 right-1 bg-black/70 hover:bg-black p-0.5 rounded-full text-rose-400 hover:text-white cursor-pointer"
                   >
                     <X className="w-3.5 h-3.5" />
                   </button>
                 </div>
               )}
            </div>
          )}

          <div className="flex justify-between items-center ml-13 mt-1">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setShowMediaFields(!showMediaFields)}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer font-mono uppercase tracking-wider"
              >
                <Image className="w-4 h-4" />
                Add Media
              </button>
              <span className={`text-[10px] font-mono ${inputText.length > 250 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                {inputText.length}/280
              </span>
            </div>
            <button 
              type="submit"
              disabled={!inputText.trim() && !imageURL.trim()}
              className="uiverse-btn-primary"
            >
              Post
            </button>
          </div>
        </form>
      )}

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {displayedPosts.map(post => {
          const isLiked = post.likedBy?.includes(currentUser?.uid);
          const isAuthor = post.authorId === currentUser?.uid;
          
          // 5-minute edit window verification
          const canEdit = isAuthor && (getCurrentTime() - post.createdAtMs < 5 * 60 * 1000) && !post.isDeleted;

          if (post.isDeleted) {
            return (
              <div key={post.id} className="p-4 border-b border-white/5 flex items-center gap-3 bg-[#0a0f1d]/20">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-slate-700" />
                </div>
                <div className="text-xs font-mono text-slate-600 italic">
                  [This post was deleted by the author]
                </div>
              </div>
            );
          }

          const isEditing = editingPostId === post.id;

          return (
            <div key={post.id} className="social-card-premium mb-4 flex gap-3 flex-col">
              <div className="flex gap-3">
                <div 
                  onClick={() => onViewProfile(post.authorId)}
                  className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                >
                  {post.authorAvatar && (post.authorAvatar.startsWith("http") || post.authorAvatar.includes("/") || post.authorAvatar.startsWith("data:")) ? (
                    <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-slate-300">{post.authorAvatar || "T"}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  
                  {/* Header Row */}
                  <div className="flex items-center justify-between text-[13px] relative">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span onClick={() => onViewProfile(post.authorId)} className="font-bold text-slate-200 hover:underline cursor-pointer">{post.authorName}</span>
                      {post.authorUsername && <span onClick={() => onViewProfile(post.authorId)} className="text-slate-500 text-xs cursor-pointer">@{post.authorUsername}</span>}
                      {post.authorIdNum && <span className="text-[10px] text-emerald-400 font-mono font-bold">#{post.authorIdNum}</span>}
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 text-xs">{post.time}</span>
                      {post.editedAt && <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/5">(edited)</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && !isEditing && (
                        <button 
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditInputText(post.text);
                          }}
                          title="Edit Post (5m window)"
                          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAuthor && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete Post"
                          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content / Edit Form */}
                  {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2 p-2 bg-white/5 rounded border border-white/5">
                      <textarea 
                        value={editInputText}
                        onChange={(e) => setEditInputText(e.target.value)}
                        className="w-full bg-transparent border-none text-xs outline-none text-slate-200 font-mono py-1 resize-none"
                        rows={2}
                        maxLength={280}
                      />
                      <div className="flex justify-end gap-2.5">
                        <button 
                          onClick={() => setEditingPostId(null)}
                          className="p-1 text-[10px] font-mono font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> CANCEL
                        </button>
                        <button 
                          onClick={() => handleEditPost(post)}
                          className="p-1 text-[10px] font-mono font-bold text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> SAVE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-200 break-words">
                      {renderPostText(post.text)}
                    </p>
                  )}

                  {/* Image attachment */}
                  {post.imageURL && !isEditing && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/5 max-h-[300px]">
                      <img src={post.imageURL} alt="Shared chart analysis" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Repost block */}
                  {post.repostOfId && post.repostedFromData && (
                    <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1.5 hover:border-white/10 transition-colors">
                       <div className="flex items-center gap-2 text-xs">
                          <div 
                            onClick={(e) => { e.stopPropagation(); onViewProfile(post.repostedFromData.authorId); }}
                            className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden cursor-pointer"
                          >
                             {post.repostedFromData.authorAvatar && (post.repostedFromData.authorAvatar.startsWith("http") || post.repostedFromData.authorAvatar.includes("/")) ? (
                                <img src={post.repostedFromData.authorAvatar} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <span>{post.repostedFromData.authorAvatar || "T"}</span>
                             )}
                          </div>
                          <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.repostedFromData.authorId); }} className="font-bold text-slate-300 hover:underline cursor-pointer">{post.repostedFromData.authorName}</span>
                          {post.repostedFromData.authorUsername && <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.repostedFromData.authorId); }} className="text-slate-500 text-[10px] cursor-pointer">@{post.repostedFromData.authorUsername}</span>}
                       </div>
                       <p className="text-xs text-slate-400 leading-relaxed break-words">{renderPostText(post.repostedFromData.text)}</p>
                    </div>
                  )}

                  {/* Quote post block */}
                  {post.quotedPostId && post.quotedPostData && (
                    <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1.5 hover:border-white/10 transition-colors">
                       <div className="flex items-center gap-2 text-xs">
                          <div 
                            onClick={(e) => { e.stopPropagation(); onViewProfile(post.quotedPostData.authorId); }}
                            className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden cursor-pointer"
                          >
                             {post.quotedPostData.authorAvatar && (post.quotedPostData.authorAvatar.startsWith("http") || post.quotedPostData.authorAvatar.includes("/")) ? (
                                <img src={post.quotedPostData.authorAvatar} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <span>{post.quotedPostData.authorAvatar || "T"}</span>
                             )}
                          </div>
                          <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.quotedPostData.authorId); }} className="font-bold text-slate-300 hover:underline cursor-pointer">{post.quotedPostData.authorName}</span>
                          {post.quotedPostData.authorUsername && <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.quotedPostData.authorId); }} className="text-slate-500 text-[10px] cursor-pointer">@{post.quotedPostData.authorUsername}</span>}
                       </div>
                       <p className="text-xs text-slate-400 leading-relaxed break-words">{renderPostText(post.quotedPostData.text)}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  {!isEditing && (
                    <div className="flex justify-between items-center mt-4 text-slate-500 max-w-[85%]">
                      <button 
                        onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                        className={`card-action-btn comment ${openCommentsPostId === post.id ? "active" : ""}`}
                        title="Comment"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[12px]">{post.commentCount}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleRepost(post)}
                        className="card-action-btn repost"
                        title="Repost"
                      >
                        <Repeat2 className="w-4 h-4" />
                        <span className="text-[12px]">{post.repostCount}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleLike(post)}
                        className={`card-action-btn like ${isLiked ? "active" : ""}`}
                        title="Like"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-[12px]">{post.likes}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleDislike(post)}
                        className={`card-action-btn dislike ${post.dislikedBy?.includes(currentUser?.uid) ? "active" : ""}`}
                        title="Dislike"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-[12px]">{post.dislikes || 0}</span>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          const quoteText = prompt("Enter quoted comments:");
                          if (quoteText) {
                            setInputText(quoteText);
                            handleQuoteSubmit(post);
                          }
                        }}
                        className="card-action-btn quote"
                        title="Quote Post"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">Quote</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline comments thread */}
              {openCommentsPostId === post.id && (
                <div className="mt-3 pl-4 border-l border-white/10 ml-10 flex flex-col gap-3">
                   <div className="flex flex-col gap-2.5">
                     {comments.map((comment) => (
                       <div key={comment.id} className="text-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                             <div 
                               onClick={() => onViewProfile(comment.authorId)}
                               className="w-4.5 h-4.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-400 overflow-hidden cursor-pointer"
                             >
                                {comment.authorAvatar && (comment.authorAvatar.startsWith("http") || comment.authorAvatar.includes("/")) ? (
                                  <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{comment.authorAvatar || "T"}</span>
                                )}
                             </div>
                             <span onClick={() => onViewProfile(comment.authorId)} className="font-bold text-slate-300 hover:underline cursor-pointer">{comment.authorName}</span>
                             {comment.authorUsername && <span onClick={() => onViewProfile(comment.authorId)} className="text-slate-500 text-[9px] cursor-pointer">@{comment.authorUsername}</span>}
                             <span className="text-slate-600 text-[9px] ml-auto">{comment.time}</span>
                          </div>
                          <p className="text-slate-400 pl-6 break-words">{comment.text}</p>
                       </div>
                     ))}
                     {comments.length === 0 && (
                       <p className="text-xs text-slate-600 italic pl-6">No replies yet.</p>
                     )}
                   </div>
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id, post.authorId)} className="flex gap-2.5 items-center mt-1">
                      <input 
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs outline-none text-slate-200 focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all duration-200 font-mono"
                      />
                      <button 
                        type="submit" 
                        disabled={!commentInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold hover:shadow-[0_0_12px_rgba(99,102,241,0.4)] disabled:opacity-50 transition-all duration-200 cursor-pointer font-mono uppercase tracking-wider shrink-0"
                      >
                        Reply
                      </button>
                    </form>
                </div>
              )}
            </div>
          );
        })}
        {displayedPosts.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-mono text-[12px] tracking-wider">
             NO POSTS IN FLOW.
          </div>
        )}
      </div>
    </div>
  );
}
export default SocialFeed;
