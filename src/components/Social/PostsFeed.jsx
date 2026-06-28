import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove, where, deleteDoc, setDoc } from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Bookmark, Share, Image as ImageIcon, Smile, MoreHorizontal, Check, Trash2, Edit2, BarChart2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cashtag from "./Cashtag";
import UserMention from "./UserMention";

export default function PostsFeed({ feedType = 'foryou', profileId = null, onProfileClick, searchQuery = "", tabFilter = "posts" }) {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingList, setFollowingList] = useState([]);
  const [myUsername, setMyUsername] = useState("");
  
  // Composer state
  const [inputText, setInputText] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaInput, setMediaInput] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showPollInput, setShowPollInput] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  
  // Interactions
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [repostedPosts, setRepostedPosts] = useState(new Set());
  const [postLimit, setPostLimit] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Bookmarks, Likes, and Reposts for the current user
  useEffect(() => {
      if (!currentUser) return;
      
      const qBookmarks = query(collection(db, "bookmarks"), where("userId", "==", currentUser.uid));
      const unsubBookmarks = onSnapshot(qBookmarks, snap => {
          setBookmarkedPosts(new Set(snap.docs.map(d => d.data().postId)));
      }, err => console.error("Bookmarks sync error:", err));

      const qLikes = query(collection(db, "likes"), where("userId", "==", currentUser.uid));
      const unsubLikes = onSnapshot(qLikes, snap => {
          setLikedPosts(new Set(snap.docs.map(d => d.data().postId)));
      }, err => console.error("Likes sync error:", err));

      const qReposts = query(
          collection(db, "social_posts"),
          where("authorId", "==", currentUser.uid),
          where("isDeleted", "==", false)
      );
      const unsubReposts = onSnapshot(qReposts, snap => {
          const repostedIds = snap.docs
              .map(d => d.data().repostOfId)
              .filter(id => !!id);
          setRepostedPosts(new Set(repostedIds));
      }, err => console.error("Reposts sync error:", err));

      return () => {
          unsubBookmarks();
          unsubLikes();
          unsubReposts();
      };
  }, [currentUser]);

  // Replying & Quoting
  const [replyingTo, setReplyingTo] = useState(null);
  const [quoting, setQuoting] = useState(null);
  
  // Editing
  const [editingPost, setEditingPost] = useState(null);

  // Load Current User's Following List for Feed filtering
  useEffect(() => {
      if (!currentUser) return;
      const unsub = onSnapshot(doc(db, "users", currentUser.uid), snap => {
          if (snap.exists()) {
              const data = snap.data();
              setFollowingList(data.followingList || []);
              setMyUsername((data.username || "").toLowerCase());
          }
      });
      return () => unsub();
  }, [currentUser]);

  const hydratePost = async (docSnap) => {
        const data = docSnap.data ? docSnap.data() : docSnap;
        const id = docSnap.id || data.id;
        let authorData = {};
        if (data.authorId) {
           const authorDoc = await getDoc(doc(db, "users", data.authorId));
           if (authorDoc.exists()) authorData = authorDoc.data();
        }
        let quotedData = null;
        if (data.quotedPostId) {
           const quotedDoc = await getDoc(doc(db, "social_posts", data.quotedPostId));
           if (quotedDoc.exists()) {
               quotedData = { id: quotedDoc.id, ...quotedDoc.data() };
               if (quotedData.authorId) {
                   const qAuthor = await getDoc(doc(db, "users", quotedData.authorId));
                   if (qAuthor.exists()) quotedData.author = qAuthor.data();
               }
           }
        }
        let repostedData = null;
        if (data.repostOfId) {
            const repostDoc = await getDoc(doc(db, "social_posts", data.repostOfId));
            if (repostDoc.exists()) {
                repostedData = { id: repostDoc.id, ...repostDoc.data() };
                if (repostedData.authorId) {
                    const rAuthor = await getDoc(doc(db, "users", repostedData.authorId));
                    if (rAuthor.exists()) repostedData.author = rAuthor.data();
                }
            }
        }
        let parentData = null;
        if (data.parentPostId) {
            const parentDoc = await getDoc(doc(db, "social_posts", data.parentPostId));
            if (parentDoc.exists()) {
                parentData = { id: parentDoc.id, ...parentDoc.data() };
                if (parentData.authorId) {
                    const pAuthor = await getDoc(doc(db, "users", parentData.authorId));
                    if (pAuthor.exists()) parentData.author = pAuthor.data();
                }
            }
        }
        return { id, ...data, author: authorData, quotedData, repostedData, parentData };
  };

  const applyFeedFilters = (postsList) => {
      let filtered = postsList.filter(p => !p.isDeleted);
      if (feedType === 'following') {
          filtered = filtered.filter(p => followingList.includes(p.authorId) || p.authorId === currentUser?.uid);
      } else if (feedType === 'communities') {
          filtered = filtered.filter(p => (p.tags || []).length > 0);
      } else if (feedType === 'lists') {
          filtered = filtered.filter(p => followingList.includes(p.authorId));
      } else if (feedType === 'mentions' && currentUser) {
          const handles = [myUsername, currentUser.email?.split('@')[0]?.toLowerCase()].filter(Boolean);
          filtered = filtered.filter(p => {
              const text = (p.content || p.text || '').toLowerCase();
              return handles.some(h => text.includes(`@${h}`));
          });
      }
      if (profileId) {
          if (tabFilter === 'replies') filtered = filtered.filter(p => p.parentPostId && p.authorId === profileId);
          else if (tabFilter === 'media') filtered = filtered.filter(p => (p.mediaUrls || []).length > 0);
          else if (tabFilter === 'likes') filtered = filtered.filter(p => likedPosts.has(p.id));
          else filtered = filtered.filter(p => p.authorId === profileId && !p.repostOfId);
      }
      if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter(p =>
              (p.content || p.text || '').toLowerCase().includes(q) ||
              (p.author?.username || '').toLowerCase().includes(q) ||
              (p.author?.displayName || '').toLowerCase().includes(q) ||
              (p.tags || []).some(t => t.toLowerCase().includes(q))
          );
      }
      return filtered;
  };

  // Load Feed
  useEffect(() => {
    if (!currentUser && (feedType === 'bookmarks' || feedType === 'following')) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let unsub = () => {};

    const loadBookmarkedPosts = async () => {
        const qBookmarks = query(collection(db, "bookmarks"), where("userId", "==", currentUser.uid));
        unsub = onSnapshot(qBookmarks, async (snap) => {
            const postIds = snap.docs.map(d => d.data().postId);
            if (!isMounted) return;
            if (postIds.length === 0) { setPosts([]); setIsLoading(false); return; }
            const postsList = (await Promise.all(postIds.map(async (id) => {
                const postDoc = await getDoc(doc(db, "social_posts", id));
                if (!postDoc.exists()) return null;
                return hydratePost(postDoc);
            }))).filter(Boolean);
            postsList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
            setPosts(applyFeedFilters(postsList));
            setIsLoading(false);
        });
    };

    if (feedType === 'bookmarks' && currentUser) {
        loadBookmarkedPosts();
        return () => { isMounted = false; unsub(); };
    }

    let q;
    if (profileId && tabFilter === 'likes') {
        const qLikes = query(collection(db, "likes"), where("userId", "==", profileId));
        unsub = onSnapshot(qLikes, async (snap) => {
            const postIds = snap.docs.map(d => d.data().postId);
            if (!isMounted) return;
            const postsList = (await Promise.all(postIds.map(async (id) => {
                const postDoc = await getDoc(doc(db, "social_posts", id));
                if (!postDoc.exists()) return null;
                return hydratePost(postDoc);
            }))).filter(Boolean);
            postsList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
            setPosts(applyFeedFilters(postsList));
            setIsLoading(false);
        });
        return () => { isMounted = false; unsub(); };
    }

    if (profileId) {
        q = query(collection(db, "social_posts"), where("authorId", "==", profileId), orderBy("createdAtMs", "desc"), limit(postLimit));
    } else if (feedType === 'following' && currentUser) {
        q = query(collection(db, "social_posts"), orderBy("createdAtMs", "desc"), limit(postLimit * 3));
    } else {
        q = query(collection(db, "social_posts"), orderBy("createdAtMs", "desc"), limit(postLimit));
    }

    unsub = onSnapshot(q, async (snap) => {
      const postsList = await Promise.all(snap.docs.map(hydratePost));
      if (!isMounted) return;
      setPosts(applyFeedFilters(postsList));
      setIsLoading(false);
    });
    return () => {
        isMounted = false;
        unsub();
    };
  }, [feedType, followingList, currentUser, profileId, postLimit, searchQuery, bookmarkedPosts, tabFilter, myUsername, likedPosts]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && mediaUrls.length === 0 && !quoting) return;
    if (!currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingPost) {
          // Check 5 min window
          if (Date.now() - editingPost.createdAtMs > 5 * 60 * 1000) {
              alert("Edit window has passed (5 minutes).");
              setEditingPost(null);
              setInputText("");
              return;
          }
          await updateDoc(doc(db, "social_posts", editingPost.id), {
              content: inputText.slice(0, 280), text: inputText.slice(0, 280),
              editedAtMs: Date.now()
          });
          setEditingPost(null);
          setInputText("");
          return;
      }

      const tags = inputText.match(/#[\w]+/g)?.map(t => t.toLowerCase()) || [];
      
      let pollData = null;
      if (showPollInput && pollOptions.filter(o => o.trim()).length >= 2) {
          pollData = {
              options: pollOptions.filter(o => o.trim()).map(text => ({ text, votes: [] })),
              totalVotes: 0
          };
      }

      const postData = {
        authorId: currentUser.uid,
        content: inputText.slice(0, 280), text: inputText.slice(0, 280),
        mediaUrls: mediaUrls.slice(0, 4),
        poll: pollData,
        createdAtMs: Date.now(), // Store as unix timestamp for easier math
        editedAtMs: null,
        parentPostId: replyingTo ? replyingTo.id : null,
        quotedPostId: quoting ? quoting.id : null,
        repostOfId: null,
        visibility: 'public',
        isDeleted: false,
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
        viewCount: 0,
        tags
      };

      const newPostRef = await addDoc(collection(db, "social_posts"), postData);

      if (replyingTo) {
          await updateDoc(doc(db, "social_posts", replyingTo.id), {
              replyCount: increment(1)
          });
      }
      if (quoting) {
          await updateDoc(doc(db, "social_posts", quoting.id), {
              quoteCount: increment(1)
          });
      }

      // Reset state
      setInputText("");
      setMediaUrls([]);
      setShowMediaInput(false);
      setMediaInput("");
      setShowPollInput(false);
      setPollOptions(["", ""]);
      setReplyingTo(null);
      setQuoting(null);
    } catch (err) {
      console.error("Failed to post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addMediaUrl = () => {
      if (mediaInput.trim() && mediaUrls.length < 4) {
          setMediaUrls([...mediaUrls, mediaInput.trim()]);
          setMediaInput("");
      }
  };

  const toggleLike = async (postId, currentlyLiked) => {
      if (!currentUser) return;
      const postRef = doc(db, "social_posts", postId);
      const likeId = `${currentUser.uid}_${postId}`;
      const likeRef = doc(db, "likes", likeId);
      const newLiked = new Set(likedPosts);
      
      try {
          if (currentlyLiked) {
              newLiked.delete(postId);
              setLikedPosts(new Set(newLiked));
              await deleteDoc(likeRef);
              await updateDoc(postRef, { likeCount: increment(-1) });
          } else {
              newLiked.add(postId);
              setLikedPosts(new Set(newLiked));
              await setDoc(likeRef, {
                  userId: currentUser.uid,
                  postId: postId,
                  createdAtMs: Date.now()
              });
              await updateDoc(postRef, { likeCount: increment(1) });
          }
      } catch (err) {
          console.error("Like toggle failed:", err);
          // Revert local state
          if (currentlyLiked) {
              newLiked.add(postId);
          } else {
              newLiked.delete(postId);
          }
          setLikedPosts(new Set(newLiked));
      }
  };
  
  const toggleBookmark = async (postId) => {
      if (!currentUser) return;
      // Because we don't know the doc ID, we query it, or just use a deterministic ID
      const bookmarkId = `${currentUser.uid}_${postId}`;
      const bookmarkRef = doc(db, "bookmarks", bookmarkId);
      
      const newBookmarks = new Set(bookmarkedPosts);
      if (newBookmarks.has(postId)) {
          newBookmarks.delete(postId);
          await deleteDoc(bookmarkRef).catch(console.error);
      } else {
          newBookmarks.add(postId);
          await setDoc(bookmarkRef, {
              userId: currentUser.uid,
              postId: postId,
              createdAtMs: Date.now()
          }).catch(console.error);
      }
      setBookmarkedPosts(newBookmarks);
  };

  const handlePlainRepost = async (post) => {
      if (!currentUser) return;
      const newReposts = new Set(repostedPosts);
      if (newReposts.has(post.id)) return; // Already reposted
      
      try {
          await addDoc(collection(db, "social_posts"), {
              authorId: currentUser.uid,
              content: "",
              text: "",
              mediaUrls: [],
              createdAtMs: Date.now(),
              repostOfId: post.id,
              visibility: 'public',
              isDeleted: false,
              likeCount: 0,
              repostCount: 0,
              replyCount: 0,
              quoteCount: 0,
              viewCount: 0,
          });
          await updateDoc(doc(db, "social_posts", post.id), { repostCount: increment(1) });
          newReposts.add(post.id);
          setRepostedPosts(new Set(newReposts));
      } catch (err) {
          console.error("Repost failed", err);
      }
  };

  const handleShare = async (postId) => {
      const url = `${window.location.origin}?post=${postId}`;
      try {
          if (navigator.share) {
              await navigator.share({ title: "Global Financial Terminal", url });
          } else {
              await navigator.clipboard.writeText(url);
              alert("Link copied to clipboard");
          }
      } catch (err) {
          if (err?.name !== "AbortError") console.error(err);
      }
  };

  const timeAgo = (timestamp) => {
      if (!timestamp) return "";
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
  };
  
  const handleEditClick = (post) => {
      if (Date.now() - post.createdAtMs > 5 * 60 * 1000) {
          alert("Edit window has passed (5 minutes).");
          return;
      }
      setEditingPost(post);
      setInputText((post.content || post.text));
      // scroll to top gently
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (postId) => {
      if (window.confirm("Delete this post?")) {
          await updateDoc(doc(db, "social_posts", postId), { isDeleted: true });
      }
  };

  const handleVote = async (postId, poll, optionIndex) => {
      if (!currentUser || !poll) return;
      
      // Check if already voted
      const hasVoted = poll.options.some(o => o.votes.includes(currentUser.uid));
      if (hasVoted) return; // Prevent double vote for now
      
      const newOptions = [...poll.options];
      newOptions[optionIndex].votes.push(currentUser.uid);
      
      try {
          await updateDoc(doc(db, "social_posts", postId), {
              "poll.options": newOptions,
              "poll.totalVotes": poll.totalVotes + 1
          });
      } catch (err) {
          console.error(err);
      }
  };

  const renderContentWithTags = (content) => {
      if (!content) return null;
      const words = content.split(/(\s+)/);
      return words.map((w, i) => {
          if (w.startsWith('#') && w.length > 1) {
              return <span key={i} className="gft-tag">{w}</span>;
          }
          if (w.startsWith('$') && w.length > 1) {
              // Strip $ from symbol
              return <Cashtag key={i} symbol={w.slice(1).replace(/[^a-zA-Z0-9]/g, '')} />;
          }
          if (w.startsWith('@') && w.length > 1) {
              // Strip @ from username
              return <UserMention key={i} username={w.slice(1).replace(/[^a-zA-Z0-9_]/g, '')} />;
          }
          return <span key={i}>{w}</span>;
      });
  };

  return (
    <div className="flex flex-col pb-20">
      
      {(!profileId || profileId === currentUser?.uid) && (
        <div className="gft-composer">
           <div className="gft-composer-avatar">
             <img src={currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`} alt="Me" className="w-full h-full object-cover" />
         </div>
         <div className="gft-composer-body">
            {editingPost && (
                <div className="text-xs text-amber-400 mb-2 flex justify-between items-center bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                   <span>Editing post (5 min window)</span>
                   <button onClick={() => { setEditingPost(null); setInputText(""); }} className="hover:text-white"><X size={14} /></button>
                </div>
            )}
            {(replyingTo || quoting) && !editingPost && (
                <div className="text-xs text-indigo-400 mb-2 flex justify-between items-center bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                   <span>{replyingTo ? `Replying to @${replyingTo.author?.username}` : `Quoting @${quoting.author?.username}`}</span>
                   <button onClick={() => { setReplyingTo(null); setQuoting(null); }} className="hover:text-white"><X size={14} /></button>
                </div>
            )}
            
            <textarea 
               placeholder="What's happening in the markets?"
               value={inputText}
               onChange={(e) => setInputText(e.target.value.slice(0, 280))}
               rows={3}
            />
            
            {/* Media Previews */}
            {mediaUrls.length > 0 && (
                <div className="flex gap-2 my-2 overflow-x-auto pb-2 custom-scrollbar">
                    {mediaUrls.map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 group">
                            <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                            <button onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                    ))}
                </div>
            )}

            {showMediaInput && mediaUrls.length < 4 && (
                <div className="flex gap-2 my-2">
                    <input type="text" value={mediaInput} onChange={e => setMediaInput(e.target.value)} placeholder="Paste image URL..." className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1 text-sm outline-none focus:border-indigo-500" />
                    <button onClick={addMediaUrl} className="bg-white/10 px-3 py-1 rounded-md text-sm hover:bg-white/20">Add</button>
                </div>
            )}
            
            {/* Poll Input */}
            {showPollInput && (
                <div className="flex flex-col gap-2 my-2 bg-white/5 p-3 rounded-xl border border-white/10">
                    {pollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={opt} 
                                onChange={e => {
                                    const newOpts = [...pollOptions];
                                    newOpts[i] = e.target.value;
                                    setPollOptions(newOpts);
                                }} 
                                placeholder={`Choice ${i+1}`} 
                                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-500 text-white" 
                            />
                            {i >= 2 && (
                                <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                            )}
                        </div>
                    ))}
                    {pollOptions.length < 4 && (
                        <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-indigo-400 text-xs text-left w-fit hover:underline mt-1">+ Add choice</button>
                    )}
                </div>
            )}
            
            <div className="gft-composer-actions">
                <div className="flex gap-1">
                    <button type="button" onClick={() => setShowMediaInput(!showMediaInput)} className="gft-icon-btn" title="Media">
                        <ImageIcon size={18} />
                    </button>
                    <button type="button" onClick={() => setShowPollInput(!showPollInput)} className="gft-icon-btn" title="Poll">
                        <BarChart2 size={18} />
                    </button>
                    <button type="button" className="gft-icon-btn" title="Emoji">
                        <Smile size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span style={{ fontSize: "12px", color: inputText.length > 250 ? "var(--gft-accent)" : "var(--gft-text-soft)" }}>
                        {inputText.length}/280
                    </span>
                    <button 
                        type="button"
                        onClick={handlePostSubmit}
                        disabled={(!inputText.trim() && mediaUrls.length === 0) || isSubmitting}
                        className="gft-btn-primary flex items-center justify-center min-w-[72px]"
                    >
                        {isSubmitting ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span> : 'Post'}
                    </button>
                </div>
            </div>
          </div>
       </div>
       )}
       
       {/* Divider */}
       <div className="h-2 bg-white/[0.02]"></div>
      
      {isLoading ? (
          <div className="flex flex-col">
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border-b border-white/5 flex gap-3">
                      <div className="w-10 h-10 rounded-full skeleton flex-shrink-0"></div>
                      <div className="flex-1">
                          <div className="flex gap-2 mb-2">
                              <div className="w-24 h-4 skeleton"></div>
                              <div className="w-16 h-4 skeleton"></div>
                          </div>
                          <div className="w-full h-16 skeleton mb-2"></div>
                          <div className="w-3/4 h-4 skeleton"></div>
                          <div className="flex gap-6 mt-4">
                              <div className="w-10 h-4 skeleton"></div>
                              <div className="w-10 h-4 skeleton"></div>
                              <div className="w-10 h-4 skeleton"></div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      ) : posts.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
              No posts found. Start following people or share your own thoughts!
          </div>
      ) : (
      <AnimatePresence>
         {posts.map(post => {
             if (post.isDeleted) return null;
             
             // If plain repost, we display the original post but wrap it with a "reposted by" header
             const isRepost = !!post.repostOfId;
             const displayPost = isRepost && post.repostedData ? post.repostedData : post;
             const isLiked = likedPosts.has(displayPost.id);
             const isBookmarked = bookmarkedPosts.has(displayPost.id);
             const isReposted = repostedPosts.has(displayPost.id);

             return (
                 <motion.div 
                     key={post.id} 
                     initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                     animate={{ opacity: 1, scale: 1, y: 0 }} 
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                     className="gft-post group relative"
                 >
                     {/* Repost Header */}
                     {isRepost && (
                         <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1 ml-10">
                             <Repeat2 size={12} />
                             <span>{post.author?.displayName} reposted</span>
                         </div>
                     )}

                     <div className="gft-post-header">
                         <div 
                             onClick={() => onProfileClick && onProfileClick(displayPost.authorId)}
                             className="gft-post-avatar cursor-pointer mt-0.5"
                         >
                             <img src={displayPost.author?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayPost.authorId}`} alt="Author" className="w-full h-full object-cover" />
                         </div>
                         
                         <div className="flex-1 min-w-0">
                         {/* Header */}
                         <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2 truncate">
                                 <span 
                                     onClick={() => onProfileClick && onProfileClick(displayPost.authorId)}
                                     className="font-bold text-slate-200 truncate font-display hover:underline cursor-pointer"
                                 >
                                     {displayPost.author?.displayName || 'Unknown'}
                                 </span>
                                 {displayPost.author?.isVerified && <Check size={14} className="text-indigo-400 bg-indigo-900/40 rounded-full p-0.5" />}
                                 <span className="text-slate-500 text-sm truncate">@{displayPost.author?.username || 'user'}</span>
                                 <span className="text-slate-600 text-xs">·</span>
                                 <span className="text-slate-500 text-sm hover:underline cursor-pointer" title={new Date(displayPost.createdAtMs).toLocaleString()}>
                                     {timeAgo(displayPost.createdAtMs)}
                                     {displayPost.editedAtMs && <span className="ml-1 text-[10px] text-slate-500">(edited)</span>}
                                 </span>
                             </div>
                             
                             <div className="relative group/menu">
                                 <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                     <MoreHorizontal size={16} />
                                 </button>
                                 <div className="absolute top-6 right-0 hidden group-hover/menu:flex flex-col bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-20 w-32 overflow-hidden">
                                     {currentUser?.uid === displayPost.authorId && Date.now() - displayPost.createdAtMs < 5 * 60 * 1000 && (
                                         <button onClick={() => handleEditClick(displayPost)} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                             <Edit2 size={14}/> Edit
                                         </button>
                                     )}
                                     {currentUser?.uid === displayPost.authorId && (
                                         <button onClick={() => handleDeleteClick(displayPost.id)} className="text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2">
                                             <Trash2 size={14}/> Delete
                                         </button>
                                     )}
                                     <button className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                         Report
                                     </button>
                                 </div>
                             </div>
                         </div>

                         {/* Reply Header */}
                         {displayPost.parentData && (
                             <div className="flex items-center gap-1 text-slate-500 text-xs mt-1 mb-1">
                                 <span>Replying to</span>
                                 <span className="text-indigo-400 hover:underline cursor-pointer">@{displayPost.parentData.author?.username}</span>
                             </div>
                         )}

                         {/* Body */}
                         <div className="gft-post-body mt-1">
                             {renderContentWithTags((displayPost.content || displayPost.text))}
                         </div>

                         {/* Media Grid (1 to 4 images) */}
                         {displayPost.mediaUrls?.length > 0 && (
                             <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden ${displayPost.mediaUrls.length === 1 ? 'grid-cols-1' : displayPost.mediaUrls.length === 2 ? 'grid-cols-2' : displayPost.mediaUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                 {displayPost.mediaUrls.map((url, i) => (
                                     <img key={i} src={url} alt="Post media" className={`w-full object-cover ${displayPost.mediaUrls.length === 1 ? 'h-64' : 'h-32'} ${displayPost.mediaUrls.length === 3 && i === 0 ? 'row-span-2 h-full' : ''}`} />
                                 ))}
                             </div>
                         )}
                         
                         {/* Quoted Post Box */}
                         {displayPost.quotedData && (
                             <div className="mt-3 border border-white/10 rounded-xl p-3 bg-black/20 hover:bg-black/30 cursor-pointer transition-colors">
                                 <div className="flex items-center gap-2 mb-1">
                                     <div className="w-4 h-4 rounded-full bg-slate-800 overflow-hidden"><img src={displayPost.quotedData.author?.photoURL || ''} alt="" className="w-full h-full object-cover"/></div>
                                     <span className="font-semibold text-slate-300 text-xs">{displayPost.quotedData.author?.displayName}</span>
                                     <span className="text-slate-500 text-xs">@{displayPost.quotedData.author?.username}</span>
                                 </div>
                                 <div className="text-xs text-slate-400 line-clamp-3">
                                     {displayPost.quotedData.content}
                                 </div>
                             </div>
                         )}
                         
                         {/* Poll View */}
                         {displayPost.poll && (
                             <div className="mt-4 flex flex-col gap-2">
                                 {displayPost.poll.options.map((opt, i) => {
                                     const percentage = displayPost.poll.totalVotes > 0 ? Math.round((opt.votes.length / displayPost.poll.totalVotes) * 100) : 0;
                                     const isVoted = opt.votes.includes(currentUser?.uid);
                                     const hasVotedAny = displayPost.poll.options.some(o => o.votes.includes(currentUser?.uid));
                                     
                                     return (
                                         <div key={i} className="relative w-full overflow-hidden rounded-lg border transition-colors cursor-pointer group" style={{ borderColor: "var(--gft-border)" }} onClick={() => handleVote(displayPost.id, displayPost.poll, i)}>
                                             <div className="absolute top-0 left-0 h-full bg-indigo-600/30 transition-all duration-500" style={{ width: hasVotedAny ? `${percentage}%` : '0%' }}></div>
                                             <div className="relative px-3 py-2 flex justify-between items-center z-10">
                                                 <span className={`text-sm ${isVoted ? 'font-bold text-white' : 'text-slate-300'} group-hover:text-white transition-colors`}>{opt.text}</span>
                                                 {hasVotedAny && <span className="text-xs font-semibold text-slate-300">{percentage}%</span>}
                                             </div>
                                         </div>
                                     );
                                 })}
                                 <div className="text-xs mt-1" style={{ color: "var(--gft-text-soft)" }}>{displayPost.poll.totalVotes} votes</div>
                             </div>
                         )}

                         {/* Actions */}
                         <div className="gft-post-actions">
                             <button type="button" onClick={(e) => { e.stopPropagation(); setReplyingTo(displayPost); setQuoting(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="gft-post-action">
                                 <MessageCircle size={16} />
                                 <span>{displayPost.replyCount || 0}</span>
                             </button>
                             <div className="relative group/repost">
                                 <button type="button" className={`gft-post-action ${isReposted ? 'reposted' : ''}`}>
                                     <Repeat2 size={16} />
                                     <span>{displayPost.repostCount || 0}</span>
                                 </button>
                                 <div className="absolute top-full left-0 mt-1 hidden group-hover/repost:flex flex-col rounded-lg shadow-xl z-20 w-32 overflow-hidden border border-[var(--gft-border)]" style={{ background: "var(--gft-elevated)" }}>
                                    <button type="button" onClick={() => handlePlainRepost(displayPost)} className="text-left px-3 py-2 text-xs hover:bg-[var(--gft-hover)] flex items-center gap-2"><Repeat2 size={14}/> Repost</button>
                                    <button type="button" onClick={() => { setQuoting(displayPost); setReplyingTo(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-left px-3 py-2 text-xs hover:bg-[var(--gft-hover)] flex items-center gap-2"><Edit2 size={14}/> Quote</button>
                                 </div>
                             </div>
                             <button type="button" onClick={() => toggleLike(displayPost.id, isLiked)} className={`gft-post-action ${isLiked ? 'liked' : ''}`}>
                                 <Heart size={16} className={isLiked ? "fill-current" : ""} />
                                 <span>{displayPost.likeCount || 0}</span>
                             </button>
                             <button type="button" className="gft-post-action">
                                 <BarChart2 size={16} />
                                 <span>{displayPost.viewCount || 0}</span>
                             </button>
                             <button type="button" onClick={() => toggleBookmark(displayPost.id)} className={`gft-post-action ${isBookmarked ? 'bookmarked' : ''}`}>
                                 <Bookmark size={16} className={isBookmarked ? "fill-current" : ""} />
                             </button>
                             <button type="button" onClick={() => handleShare(displayPost.id)} className="gft-post-action">
                                 <Share size={16} />
                             </button>
                         </div>
                     </div>
                     </div>
                 </motion.div>
             )
         })}
      </AnimatePresence>
      )}
      
      {!isLoading && posts.length >= postLimit && (
          <button 
              onClick={() => setPostLimit(prev => prev + 20)}
              className="w-full mt-4 py-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
              Load More
          </button>
      )}
    </div>
  );
}
