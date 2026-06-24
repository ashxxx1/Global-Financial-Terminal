import { useState, useEffect } from "react";
import { MessageSquare, Heart, Repeat2, MoreHorizontal, Image, ThumbsDown } from "lucide-react";
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
  where
} from "firebase/firestore";
import StockMention from "../Forum/StockMention";
 
export function SocialFeed() {
  const { currentUser, userProfileData } = useAuth();
  const [activeTab, setActiveTab] = useState('For You');
  
  const [posts, setPosts] = useState([]);
  const [inputText, setInputText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [showMediaFields, setShowMediaFields] = useState(false);
 
  // Comments state
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [prevCommentsPostId, setPrevCommentsPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");
 
  if (openCommentsPostId !== prevCommentsPostId) {
    setPrevCommentsPostId(openCommentsPostId);
    setComments([]);
  }

  // Load Feed Posts
  useEffect(() => {
    const q = query(
      collection(db, "social_posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          authorName: doc.data().authorName,
          authorUsername: doc.data().authorUsername || "",
          authorAvatar: doc.data().authorAvatar,
          authorRep: doc.data().authorRep,
          authorIdNum: doc.data().authorIdNum || null,
          text: doc.data().text,
          imageURL: doc.data().imageURL,
          videoURL: doc.data().videoURL || null,
          likes: doc.data().likes || 0,
          likedBy: doc.data().likedBy || [],
          dislikes: doc.data().dislikes || 0,
          dislikedBy: doc.data().dislikedBy || [],
          repostCount: doc.data().repostCount || 0,
          repostedFrom: doc.data().repostedFrom || null,
          repostedFromData: doc.data().repostedFromData || null,
          commentCount: doc.data().commentCount || 0,
          tags: doc.data().tags || [],
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString() : "Just now"
        }));
        setPosts(list);
      } else {
        setPosts([]);
      }
    }, (err) => {
      console.error("Firestore listener error:", err);
      setPosts([]);
    });

    return () => unsub();
  }, []);

  // Load Comments for Open Post
  useEffect(() => {
    if (!openCommentsPostId) return;

    const q = query(
      collection(db, "post_comments"),
      where("postId", "==", openCommentsPostId)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          authorName: doc.data().authorName,
          authorUsername: doc.data().authorUsername || "",
          authorAvatar: doc.data().authorAvatar,
          authorIdNum: doc.data().authorIdNum || null,
          text: doc.data().text,
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
  }, [openCommentsPostId]);

  // Handle Post Submit
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imageURL.trim() && !videoURL.trim()) return;

    const postContent = inputText;
    const postImg = imageURL;
    const postVid = videoURL;

    setInputText("");
    setImageURL("");
    setVideoURL("");
    setShowMediaFields(false);

    // Extract tags
    const tags = postContent.split(/\s+/).filter(w => w.startsWith("$") || w.startsWith("#")).map(w => w.toUpperCase());

    if (currentUser) {
      try {
        await addDoc(collection(db, "social_posts"), {
          authorName: userProfileData?.displayName || currentUser.displayName || "Trader",
          authorUsername: userProfileData?.username || "",
          authorAvatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          authorRep: userProfileData?.reputation || "Analyst",
          authorIdNum: userProfileData?.idNum || null,
          text: postContent,
          imageURL: postImg || null,
          videoURL: postVid || null,
          likes: 0,
          likedBy: [],
          dislikes: 0,
          dislikedBy: [],
          repostCount: 0,
          repostedFrom: null,
          repostedFromData: null,
          commentCount: 0,
          tags,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to add post to Firestore:", err);
      }
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
        const updateData = {
          likedBy: arrayUnion(currentUser.uid),
          likes: increment(1)
        };
        if (hasDisliked) {
          updateData.dislikedBy = arrayRemove(currentUser.uid);
          updateData.dislikes = increment(-1);
        }
        await updateDoc(postRef, updateData);
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  // Handle Dislikes
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
        const updateData = {
          dislikedBy: arrayUnion(currentUser.uid),
          dislikes: increment(1)
        };
        if (hasLiked) {
          updateData.likedBy = arrayRemove(currentUser.uid);
          updateData.likes = increment(-1);
        }
        await updateDoc(postRef, updateData);
      }
    } catch (err) {
      console.error("Dislike toggle failed:", err);
    }
  };

  // Handle Reposts
  const handleRepost = async (post) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "social_posts"), {
        authorName: userProfileData?.displayName || currentUser.displayName || "Trader",
        authorUsername: userProfileData?.username || "",
        authorAvatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        authorRep: userProfileData?.reputation || "Analyst",
        authorIdNum: userProfileData?.idNum || null,
        text: `Reposted:`,
        imageURL: null,
        videoURL: null,
        likes: 0,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        repostCount: 0,
        repostedFrom: post.id,
        repostedFromData: {
          text: post.text,
          authorName: post.authorName,
          authorUsername: post.authorUsername,
          authorAvatar: post.authorAvatar,
          authorIdNum: post.authorIdNum
        },
        tags: [],
        createdAt: serverTimestamp()
      });

      const originalRef = doc(db, "social_posts", post.id);
      await updateDoc(originalRef, {
        repostCount: increment(1)
      });
    } catch (err) {
      console.error("Repost failed:", err);
    }
  };

  // Handle Comment Submit
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;

    const text = commentInput;
    setCommentInput("");

    try {
      await addDoc(collection(db, "post_comments"), {
        postId,
        authorName: userProfileData?.displayName || currentUser.displayName || "Trader",
        authorUsername: userProfileData?.username || "",
        authorAvatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        authorIdNum: userProfileData?.idNum || null,
        authorUid: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });

      const postRef = doc(db, "social_posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });
    } catch (err) {
      console.error("Comment submission failed:", err);
    }
  };

  const renderPostText = (text) => {
    if (!text) return "";
    const parts = text.split(/(\$[A-Z]{1,5})/g);
    return parts.map((part, i) => {
      if (/^\$[A-Z]{1,5}$/.test(part)) {
        return <StockMention key={i} symbol={part.slice(1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent text-slate-100">
      {/* Header */}
      <div className="flex flex-col border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="px-4 py-3 flex justify-between items-center">
          <h2 className="text-[16px] font-bold tracking-wide">FlowDesk</h2>
          <MoreHorizontal className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex w-full">
          <button 
            onClick={() => setActiveTab('For You')}
            className="flex-1 py-3 text-[13px] font-bold text-center hover:bg-white/5 transition-colors relative cursor-pointer"
          >
            <span className={activeTab === 'For You' ? 'text-slate-100' : 'text-slate-500'}>For you</span>
            {activeTab === 'For You' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('Following')}
            className="flex-1 py-3 text-[13px] font-bold text-center hover:bg-white/5 transition-colors relative cursor-pointer"
          >
            <span className={activeTab === 'Following' ? 'text-slate-100' : 'text-slate-500'}>Following</span>
            {activeTab === 'Following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
          </button>
        </div>
      </div>

      {/* Compose Box */}
      <form onSubmit={handlePostSubmit} className="p-4 border-b border-white/5 flex gap-3 flex-col">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
            {userProfileData?.photoURL ? (
              <img src={userProfileData.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sm">ME</span>
            )}
          </div>
          <div className="flex-1">
             <textarea 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Share analysis, charts, or macro thesis... Use $TICKER to tag assets." 
               className="w-full bg-transparent border-none text-[15px] outline-none placeholder:text-slate-500 font-medium py-1.5 resize-none"
               rows={2}
               maxLength={280}
             />
          </div>
        </div>

        {showMediaFields && (
          <div className="flex flex-col gap-2 p-3 bg-white/5 rounded border border-white/5 ml-13">
             <input 
               type="text" 
               value={imageURL}
               onChange={(e) => setImageURL(e.target.value)}
               placeholder="Paste analysis image URL..." 
               className="w-full bg-transparent border-none outline-none text-xs text-slate-300 placeholder:text-slate-600"
             />
             <input 
               type="text" 
               value={videoURL}
               onChange={(e) => setVideoURL(e.target.value)}
               placeholder="Paste analysis video URL (.mp4)..." 
               className="w-full bg-transparent border-none outline-none text-xs text-slate-300 placeholder:text-slate-600"
             />
          </div>
        )}

        <div className="flex justify-between items-center ml-13 mt-1">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setShowMediaFields(!showMediaFields)}
              className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
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
            disabled={!inputText.trim() && !imageURL.trim() && !videoURL.trim()}
            className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-full text-[13px] transition-colors shadow-[0_0_10px_rgba(99,102,241,0.3)] cursor-pointer"
          >
            Post
          </button>
        </div>
      </form>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {posts.map(post => {
          const isLiked = post.likedBy?.includes(currentUser?.uid);
          const isDisliked = post.dislikedBy?.includes(currentUser?.uid);

          return (
            <div key={post.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 flex-col">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {post.authorAvatar && (post.authorAvatar.startsWith("http") || post.authorAvatar.includes("/") || post.authorAvatar.startsWith("data:")) ? (
                    <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-slate-300">{post.authorAvatar || "T"}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[14px]">
                    <span className="font-bold text-slate-100 hover:underline">{post.authorName}</span>
                    {post.authorIdNum && <span className="text-[10px] text-emerald-400 font-mono font-bold">#{post.authorIdNum}</span>}
                    {post.authorUsername && <span className="text-slate-500 text-xs">@{post.authorUsername}</span>}
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 text-xs">{post.time}</span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-snug text-slate-200">
                    {renderPostText(post.text)}
                  </p>

                  {/* Media attachments */}
                  {post.imageURL && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-white/5 max-h-[300px]">
                      <img src={post.imageURL} alt="Shared Chart Analysis" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {post.videoURL && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-white/5 max-h-[300px] bg-black">
                      <video src={post.videoURL} controls className="w-full h-full" />
                    </div>
                  )}

                  {/* Repost container */}
                  {post.repostedFrom && post.repostedFromData && (
                    <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-1.5">
                       <div className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden">
                             {post.repostedFromData.authorAvatar && (post.repostedFromData.authorAvatar.startsWith("http") || post.repostedFromData.authorAvatar.includes("/")) ? (
                                <img src={post.repostedFromData.authorAvatar} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <span>{post.repostedFromData.authorAvatar || "T"}</span>
                             )}
                          </div>
                          <span className="font-bold text-slate-300">{post.repostedFromData.authorName}</span>
                          {post.repostedFromData.authorIdNum && <span className="text-[9px] text-emerald-400 font-bold">#{post.repostedFromData.authorIdNum}</span>}
                          {post.repostedFromData.authorUsername && <span className="text-slate-500 text-[10px]">@{post.repostedFromData.authorUsername}</span>}
                       </div>
                       <p className="text-xs text-slate-400 leading-normal">{post.repostedFromData.text}</p>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex justify-between items-center mt-4 text-slate-500 max-w-[85%]">
                    <button 
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                      className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${openCommentsPostId === post.id ? "text-indigo-400" : "hover:text-indigo-400"}`}
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-indigo-500/10 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-[12px]">{post.commentCount}</span>
                    </button>
                    <button 
                      onClick={() => handleRepost(post)}
                      className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                      <span className="text-[12px]">{post.repostCount}</span>
                    </button>
                    <button 
                      onClick={() => handleLike(post)}
                      className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${isLiked ? "text-rose-400 font-bold" : "hover:text-rose-400"}`}
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-rose-500/10 transition-colors">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="text-[12px]">{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleDislike(post)}
                      className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${isDisliked ? "text-amber-500 font-bold" : "hover:text-amber-500"}`}
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-amber-500/10 transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </div>
                      <span className="text-[12px]">{post.dislikes}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline comments thread */}
              {openCommentsPostId === post.id && (
                <div className="mt-3 pl-4 border-l border-white/10 ml-10 flex flex-col gap-3">
                   {/* Comments List */}
                   <div className="flex flex-col gap-2.5">
                     {comments.map((comment) => (
                       <div key={comment.id} className="text-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                             <div className="w-4.5 h-4.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-400 overflow-hidden">
                                {comment.authorAvatar && (comment.authorAvatar.startsWith("http") || comment.authorAvatar.includes("/")) ? (
                                  <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{comment.authorAvatar || "T"}</span>
                                )}
                             </div>
                             <span className="font-bold text-slate-300">{comment.authorName}</span>
                             {comment.authorIdNum && <span className="text-[8px] text-emerald-400 font-bold">#{comment.authorIdNum}</span>}
                             {comment.authorUsername && <span className="text-slate-500 text-[9px]">@{comment.authorUsername}</span>}
                             <span className="text-slate-600 text-[9px] ml-auto">{comment.time}</span>
                          </div>
                          <p className="text-slate-400 pl-6">{comment.text}</p>
                       </div>
                     ))}
                     {comments.length === 0 && (
                       <p className="text-xs text-slate-600 italic pl-6">No replies yet.</p>
                     )}
                   </div>

                   {/* Comment Composer */}
                   <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2 items-center">
                     <input 
                       type="text"
                       value={commentInput}
                       onChange={(e) => setCommentInput(e.target.value)}
                       placeholder="Write a reply..."
                       className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs outline-none text-slate-200"
                     />
                     <button 
                       type="submit" 
                       disabled={!commentInput.trim()}
                       className="px-3 py-1 bg-indigo-500 text-white rounded-full text-[11px] font-bold hover:bg-indigo-600 disabled:opacity-50 cursor-pointer"
                     >
                       Reply
                     </button>
                   </form>
                </div>
              )}
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-mono text-[12px] tracking-wider">
             NO POSTS IN FLOW.
          </div>
        )}
      </div>
    </div>
  );
}
export default SocialFeed;
