import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Bookmark, Share, Image as ImageIcon, Smile, MoreHorizontal, Check, Trash2, Edit2, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PostsFeed({ feedType = 'foryou', profileId = null, onProfileClick }) {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  
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

  // Load Bookmarks and Likes for the current user
  useEffect(() => {
      if (!currentUser) return;
      const q = query(collection(db, "bookmarks"), where("userId", "==", currentUser.uid));
      const unsub = onSnapshot(q, snap => {
          setBookmarkedPosts(new Set(snap.docs.map(d => d.data().postId)));
      });
      return () => unsub();
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
              setFollowingList(snap.data().followingList || []);
          }
      });
      return () => unsub();
  }, [currentUser]);

  // Load Feed
  useEffect(() => {
    let q;
    if (feedType === 'following' && followingList.length > 0) {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100));
    } else if (feedType === 'profile' && profileId) {
        q = query(collection(db, "posts"), where("authorId", "==", profileId), orderBy("createdAt", "desc"), limit(50));
    } else {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    }
    
    const unsub = onSnapshot(q, async (snap) => {
      const postsList = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let authorData = {};
        if (data.authorId) {
           const authorDoc = await getDoc(doc(db, "users", data.authorId));
           if (authorDoc.exists()) authorData = authorDoc.data();
        }
        
        let quotedData = null;
        if (data.quotedPostId) {
           const quotedDoc = await getDoc(doc(db, "posts", data.quotedPostId));
           if (quotedDoc.exists()) {
               quotedData = quotedDoc.data();
               if (quotedData.authorId) {
                   const qAuthor = await getDoc(doc(db, "users", quotedData.authorId));
                   if (qAuthor.exists()) quotedData.author = qAuthor.data();
               }
           }
        }
        
        return {
          id: docSnap.id,
          ...data,
          author: authorData,
          quotedData
        };
      }));
      
      if (feedType === 'following') {
          setPosts(postsList.filter(p => followingList.includes(p.authorId) || p.authorId === currentUser?.uid));
      } else {
          setPosts(postsList);
      }
    });
    return () => unsub();
  }, [feedType, followingList, currentUser, profileId]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && mediaUrls.length === 0 && !quoting) return;
    if (!currentUser) return;

    try {
      if (editingPost) {
          // Check 5 min window
          if (Date.now() - editingPost.createdAt > 5 * 60 * 1000) {
              alert("Edit window has passed (5 minutes).");
              setEditingPost(null);
              setInputText("");
              return;
          }
          await updateDoc(doc(db, "posts", editingPost.id), {
              content: inputText.slice(0, 280),
              editedAt: Date.now()
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
        content: inputText.slice(0, 280),
        mediaUrls: mediaUrls.slice(0, 4),
        poll: pollData,
        createdAt: Date.now(), // Store as unix timestamp for easier math
        editedAt: null,
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

      await addDoc(collection(db, "posts"), postData);

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
      const postRef = doc(db, "posts", postId);
      const newLiked = new Set(likedPosts);
      if (currentlyLiked) {
          newLiked.delete(postId);
          await updateDoc(postRef, { likeCount: increment(-1) });
      } else {
          newLiked.add(postId);
          await updateDoc(postRef, { likeCount: increment(1) });
      }
      setLikedPosts(newLiked);
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
              createdAt: Date.now()
          }).catch(console.error);
      }
      setBookmarkedPosts(newBookmarks);
  };

  const handlePlainRepost = async (post) => {
      if (!currentUser) return;
      const newReposts = new Set(repostedPosts);
      if (newReposts.has(post.id)) return; // Already reposted
      
      try {
          await addDoc(collection(db, "posts"), {
              authorId: currentUser.uid,
              content: "",
              mediaUrls: [],
              createdAt: Date.now(),
              repostOfId: post.id,
              visibility: 'public',
              isDeleted: false,
          });
          await updateDoc(doc(db, "posts", post.id), { repostCount: increment(1) });
          newReposts.add(post.id);
          setRepostedPosts(newReposts);
      } catch (err) {
          console.error("Repost failed", err);
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
      if (Date.now() - post.createdAt > 5 * 60 * 1000) {
          alert("Edit window has passed (5 minutes).");
          return;
      }
      setEditingPost(post);
      setInputText(post.content);
      // scroll to top gently
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (postId) => {
      if (window.confirm("Delete this post?")) {
          await updateDoc(doc(db, "posts", postId), { isDeleted: true });
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
          await updateDoc(doc(db, "posts", postId), {
              "poll.options": newOptions,
              "poll.totalVotes": poll.totalVotes + 1
          });
      } catch (err) {
          console.error(err);
      }
  };

  const renderContentWithTags = (content) => {
      const words = content.split(/(\s+)/);
      return words.map((w, i) => {
          if (w.startsWith('#') && w.length > 1) {
              return <span key={i} className="text-indigo-400 hover:underline cursor-pointer">{w}</span>;
          }
          if (w.startsWith('$') && w.length > 1) {
              return (
                  <span key={i} className="text-emerald-400 font-bold hover:bg-emerald-400/20 px-1 rounded cursor-pointer transition-colors" title={`View ${w} stock data`}>
                      {w}
                  </span>
              );
          }
          if (w.startsWith('@')) return <span key={i} className="text-emerald-400 hover:underline cursor-pointer">{w}</span>;
          return <span key={i}>{w}</span>;
      });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      
      {/* Composer */}
      {(!profileId || profileId === currentUser?.uid) && (
        <div className="glass-card rounded-2xl p-4 flex gap-4">
           <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
             <img src={currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`} alt="Me" className="w-full h-full object-cover" />
         </div>
         <div className="flex-1 flex flex-col">
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
               placeholder="Share analysis, charts, or macro thesis..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value.slice(0, 280))}
               className="w-full bg-transparent resize-none outline-none text-white placeholder:text-slate-500 min-h-[60px]"
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
            
            <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                <div className="flex gap-1 text-indigo-400">
                    <button onClick={() => setShowMediaInput(!showMediaInput)} className="p-2 rounded-full hover:bg-indigo-500/20 transition-colors" title="Media">
                        <ImageIcon size={18} />
                    </button>
                    <button onClick={() => setShowPollInput(!showPollInput)} className="p-2 rounded-full hover:bg-indigo-500/20 transition-colors" title="Poll">
                        <BarChart2 size={18} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-indigo-500/20 transition-colors" title="Emoji">
                        <Smile size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs ${inputText.length > 250 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {inputText.length}/280
                    </span>
                    <button 
                        onClick={handlePostSubmit}
                        disabled={!inputText.trim() && mediaUrls.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-5 py-1.5 rounded-full font-medium transition-colors text-sm"
                    >
                        Post
                    </button>
                </div>
            </div>
           </div>
        </div>
      )}

      {/* Feed List */}
      <AnimatePresence>
         {posts.map(post => {
             if (post.isDeleted) return null;
             
             // If plain repost, resolve differently in real app, simplified here
             const isRepost = !!post.repostOfId;
             const isLiked = likedPosts.has(post.id);
             const isBookmarked = bookmarkedPosts.has(post.id);
             const isReposted = repostedPosts.has(post.id);

             return (
                 <motion.div 
                     key={post.id} 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="glass-panel p-4 rounded-2xl flex gap-3 group relative"
                 >
                     <div 
                         onClick={() => onProfileClick && onProfileClick(post.authorId)}
                         className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 cursor-pointer"
                     >
                         <img src={post.author?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorId}`} alt="Author" className="w-full h-full object-cover" />
                     </div>
                     
                     <div className="flex-1 min-w-0">
                         {/* Header */}
                         <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2 truncate">
                                 <span 
                                     onClick={() => onProfileClick && onProfileClick(post.authorId)}
                                     className="font-bold text-slate-200 truncate font-display hover:underline cursor-pointer"
                                 >
                                     {post.author?.displayName || 'Unknown'}
                                 </span>
                                 {post.author?.isVerified && <Check size={14} className="text-indigo-400 bg-indigo-900/40 rounded-full p-0.5" />}
                                 <span className="text-slate-500 text-sm truncate">@{post.author?.username || 'user'}</span>
                                 <span className="text-slate-600 text-xs">·</span>
                                 <span className="text-slate-500 text-sm hover:underline cursor-pointer" title={new Date(post.createdAt).toLocaleString()}>
                                     {timeAgo(post.createdAt)}
                                     {post.editedAt && <span className="ml-1 text-[10px] text-slate-500">(edited)</span>}
                                 </span>
                             </div>
                             
                             <div className="relative group/menu">
                                 <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                     <MoreHorizontal size={16} />
                                 </button>
                                 <div className="absolute top-6 right-0 hidden group-hover/menu:flex flex-col bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-20 w-32 overflow-hidden">
                                     {currentUser?.uid === post.authorId && Date.now() - post.createdAt < 5 * 60 * 1000 && (
                                         <button onClick={() => handleEditClick(post)} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                             <Edit2 size={14}/> Edit
                                         </button>
                                     )}
                                     {currentUser?.uid === post.authorId && (
                                         <button onClick={() => handleDeleteClick(post.id)} className="text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2">
                                             <Trash2 size={14}/> Delete
                                         </button>
                                     )}
                                     <button className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                         Report
                                     </button>
                                 </div>
                             </div>
                         </div>

                         {/* Body */}
                         <div className="mt-1 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                             {renderContentWithTags(post.content)}
                         </div>

                         {/* Media Grid (1 to 4 images) */}
                         {post.mediaUrls?.length > 0 && (
                             <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden ${post.mediaUrls.length === 1 ? 'grid-cols-1' : post.mediaUrls.length === 2 ? 'grid-cols-2' : post.mediaUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                 {post.mediaUrls.map((url, i) => (
                                     <img key={i} src={url} alt="Post media" className={`w-full object-cover ${post.mediaUrls.length === 1 ? 'h-64' : 'h-32'} ${post.mediaUrls.length === 3 && i === 0 ? 'row-span-2 h-full' : ''}`} />
                                 ))}
                             </div>
                         )}
                         
                         {/* Quoted Post Box */}
                         {post.quotedData && (
                             <div className="mt-3 border border-white/10 rounded-xl p-3 bg-black/20 hover:bg-black/30 cursor-pointer transition-colors">
                                 <div className="flex items-center gap-2 mb-1">
                                     <div className="w-4 h-4 rounded-full bg-slate-800 overflow-hidden"><img src={post.quotedData.author?.photoURL || ''} alt="" className="w-full h-full object-cover"/></div>
                                     <span className="font-semibold text-slate-300 text-xs">{post.quotedData.author?.displayName}</span>
                                     <span className="text-slate-500 text-xs">@{post.quotedData.author?.username}</span>
                                 </div>
                                 <div className="text-xs text-slate-400 line-clamp-3">
                                     {post.quotedData.content}
                                 </div>
                             </div>
                         )}
                         
                         {/* Poll View */}
                         {post.poll && (
                             <div className="mt-4 flex flex-col gap-2">
                                 {post.poll.options.map((opt, i) => {
                                     const percentage = post.poll.totalVotes > 0 ? Math.round((opt.votes.length / post.poll.totalVotes) * 100) : 0;
                                     const isVoted = opt.votes.includes(currentUser?.uid);
                                     const hasVotedAny = post.poll.options.some(o => o.votes.includes(currentUser?.uid));
                                     
                                     return (
                                         <div key={i} className="relative w-full overflow-hidden rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer group" onClick={() => handleVote(post.id, post.poll, i)}>
                                             <div className="absolute top-0 left-0 h-full bg-indigo-600/30 transition-all duration-500" style={{ width: hasVotedAny ? `${percentage}%` : '0%' }}></div>
                                             <div className="relative px-3 py-2 flex justify-between items-center z-10">
                                                 <span className={`text-sm ${isVoted ? 'font-bold text-white' : 'text-slate-300'} group-hover:text-white transition-colors`}>{opt.text}</span>
                                                 {hasVotedAny && <span className="text-xs font-semibold text-slate-300">{percentage}%</span>}
                                             </div>
                                         </div>
                                     );
                                 })}
                                 <div className="text-xs text-slate-500 mt-1">{post.poll.totalVotes} votes</div>
                             </div>
                         )}

                         {/* Actions */}
                         <div className="flex justify-between items-center mt-4 text-slate-500 max-w-md">
                             <button onClick={() => setReplyingTo(post)} className="flex items-center gap-2 hover:text-indigo-400 group/btn transition-colors">
                                 <div className="p-1.5 rounded-full group-hover/btn:bg-indigo-500/20"><MessageCircle size={16} /></div>
                                 <span className="text-xs">{post.replyCount || 0}</span>
                             </button>
                             <div className="relative group/repost">
                                 <button onClick={() => handlePlainRepost(post)} className={`flex items-center gap-2 hover:text-emerald-400 group/btn transition-colors ${isReposted ? 'text-emerald-500' : ''}`}>
                                     <div className="p-1.5 rounded-full group-hover/btn:bg-emerald-500/20"><Repeat2 size={16} /></div>
                                     <span className="text-xs">{post.repostCount || 0}</span>
                                 </button>
                                 <div className="absolute top-8 left-0 hidden group-hover/repost:flex flex-col bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-10 w-32 overflow-hidden">
                                    <button onClick={() => handlePlainRepost(post)} className="text-left px-3 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"><Repeat2 size={14}/> Repost</button>
                                    <button onClick={() => setQuoting(post)} className="text-left px-3 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"><Edit2 size={14}/> Quote</button>
                                 </div>
                             </div>
                             <button onClick={() => toggleLike(post.id, isLiked)} className={`flex items-center gap-2 hover:text-pink-500 group/btn transition-colors ${isLiked ? 'text-pink-500' : ''}`}>
                                 <div className="p-1.5 rounded-full group-hover/btn:bg-pink-500/20">
                                     <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                 </div>
                                 <span className="text-xs">{post.likeCount || 0}</span>
                             </button>
                             <div className="flex items-center gap-1">
                                 <button onClick={() => toggleBookmark(post.id)} className={`p-1.5 rounded-full hover:text-indigo-400 hover:bg-indigo-500/20 transition-colors ${isBookmarked ? 'text-indigo-400' : ''}`}>
                                     <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                                 </button>
                                 <button className="p-1.5 rounded-full hover:text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                                     <Share size={16} />
                                 </button>
                             </div>
                         </div>
                     </div>
                 </motion.div>
             )
         })}
      </AnimatePresence>
    </div>
  );
}
