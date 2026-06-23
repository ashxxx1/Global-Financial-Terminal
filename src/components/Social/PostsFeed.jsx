import { useState, useEffect } from "react";
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

export default function PostsFeed() {
  const { currentUser, userProfileData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [inputText, setInputText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [showMediaFields, setShowMediaFields] = useState(false);

  // Comments state
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");

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
    if (!openCommentsPostId) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, "post_comments"),
      where("postId", "==", openCommentsPostId),
      orderBy("createdAt", "asc")
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
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"
        }));
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
    const parts = text.split(/(\$[A-Z]{1,5})/g);
    return parts.map((part, i) => {
      if (/^\$[A-Z]{1,5}$/.test(part)) {
        return <StockMention key={i} symbol={part.slice(1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="posts-feed">
      {/* Post Composer */}
      <form className="posts-feed__composer" onSubmit={handlePostSubmit}>
        <textarea
          className="posts-feed__input"
          placeholder="Share analysis, charts, or macro thesis... Use $TICKER to tag assets."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
        />
        {showMediaFields && (
          <div className="posts-feed__media-inputs" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <input
              type="text"
              placeholder="Paste Image URL (e.g. Unsplash chart link)..."
              value={imageURL}
              onChange={(e) => setImageURL(e.target.value)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 12px", color: "#fff", outline: "none", fontSize: "11px" }}
            />
            <input
              type="text"
              placeholder="Paste Video URL (e.g. .mp4 file link)..."
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 12px", color: "#fff", outline: "none", fontSize: "11px" }}
            />
          </div>
        )}
        <div className="posts-feed__composer-actions">
          <button
            type="button"
            className={`posts-feed__tool-btn ${showMediaFields ? "active" : ""}`}
            onClick={() => setShowMediaFields(!showMediaFields)}
          >
            🖼️ Attach Photo/Video
          </button>
          <button type="submit" className="posts-feed__submit-btn" disabled={!inputText.trim() && !imageURL.trim() && !videoURL.trim()}>
            Post →
          </button>
        </div>
      </form>

      {/* Feed Cards */}
      <div className="posts-feed__list">
        {posts.length === 0 ? (
          <div className="posts-feed__empty" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📰</span>
            <p style={{ fontSize: "13px" }}>No posts yet. Start the conversation!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isLiked = post.likedBy?.includes(currentUser?.uid);
            const isDisliked = post.dislikedBy?.includes(currentUser?.uid);

            return (
              <div key={post.id} className="post-card" style={{ marginBottom: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 16 }}>
                {/* Author Metadata */}
                <div className="post-card__header">
                  <div className="post-card__avatar">
                    {post.authorAvatar && (post.authorAvatar.startsWith("http") || post.authorAvatar.includes("/") || post.authorAvatar.startsWith("data:")) ? (
                      <img src={post.authorAvatar} alt={post.authorName} className="post-card__avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      post.authorAvatar || "T"
                    )}
                  </div>
                  <div className="post-card__author-info">
                    <div className="post-card__author-name">
                      {post.authorName}
                      {post.authorIdNum && <span style={{ fontSize: 10, color: "var(--accent-green)", marginLeft: 6 }}>#ID {post.authorIdNum}</span>}
                      {post.authorUsername && <span className="post-card__author-handle" style={{ fontSize: 10, color: "var(--text-secondary)", marginLeft: 6 }}>@{post.authorUsername}</span>}
                    </div>
                    <div className="post-card__author-rep">{post.authorRep}</div>
                  </div>
                  <span className="post-card__time">{post.time}</span>
                </div>

                {/* Body Content */}
                <div className="post-card__body">
                  <p>{renderPostText(post.text)}</p>
                  
                  {/* Photo Attachment */}
                  {post.imageURL && (
                    <img
                      src={post.imageURL}
                      alt="Shared Chart Analysis"
                      className="post-card__image"
                      style={{ width: "100%", borderRadius: 8, marginTop: 8, maxHeight: 320, objectFit: "cover" }}
                    />
                  )}

                  {/* Video Attachment */}
                  {post.videoURL && (
                    <video
                      src={post.videoURL}
                      controls
                      className="post-card__video"
                      style={{ width: "100%", borderRadius: 8, marginTop: 8, maxHeight: 320, background: "#000" }}
                    />
                  )}

                  {/* Nested Repost */}
                  {post.repostedFrom && post.repostedFromData && (
                    <div className="repost-box" style={{ marginTop: 10, padding: 12, border: "1px solid var(--border-subtle)", borderRadius: 8, background: "rgba(255,255,255,0.015)" }}>
                      <div className="repost-box__header" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card)", fontSize: 8 }}>
                          {post.repostedFromData.authorAvatar && (post.repostedFromData.authorAvatar.startsWith("http") || post.repostedFromData.authorAvatar.includes("/")) ? (
                            <img src={post.repostedFromData.authorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            post.repostedFromData.authorAvatar || "T"
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{post.repostedFromData.authorName}</span>
                        {post.repostedFromData.authorIdNum && <span style={{ fontSize: 9, color: "var(--accent-green)" }}>#ID {post.repostedFromData.authorIdNum}</span>}
                        {post.repostedFromData.authorUsername && <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>@{post.repostedFromData.authorUsername}</span>}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>{post.repostedFromData.text}</p>
                    </div>
                  )}
                </div>

                {/* Feed Actions */}
                <div className="post-card__footer" style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  <button
                    className="post-card__action-btn"
                    style={{ background: "transparent", border: "none", color: openCommentsPostId === post.id ? "var(--accent-blue)" : "var(--text-secondary)", cursor: "pointer", fontSize: "11px" }}
                    onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                  >
                    💬 {post.commentCount || 0} Replies
                  </button>

                  <button
                    className="post-card__action-btn"
                    style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "11px" }}
                    onClick={() => handleRepost(post)}
                  >
                    🔁 {post.repostCount || 0} Reposts
                  </button>

                  <button
                    className="post-card__action-btn"
                    style={{ background: "transparent", border: "none", color: isLiked ? "var(--accent-green)" : "var(--text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: isLiked ? "bold" : "normal" }}
                    onClick={() => handleLike(post)}
                  >
                    ❤️ {post.likes || 0} Likes
                  </button>

                  <button
                    className="post-card__action-btn"
                    style={{ background: "transparent", border: "none", color: isDisliked ? "var(--accent-red)" : "var(--text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: isDisliked ? "bold" : "normal" }}
                    onClick={() => handleDislike(post)}
                  >
                    👎 {post.dislikes || 0} Dislikes
                  </button>
                </div>

                {/* Inline comments thread */}
                {openCommentsPostId === post.id && (
                  <div className="comments-thread" style={{ marginTop: 12, paddingLeft: 24, borderLeft: "2px solid var(--border-subtle)" }}>
                    {/* List */}
                    <div className="comments-list" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      {comments.map((comment) => (
                        <div key={comment.id} className="comment-item" style={{ padding: "6px 0" }}>
                          <div className="comment-item__header" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card)", fontSize: 7 }}>
                              {comment.authorAvatar && (comment.authorAvatar.startsWith("http") || comment.authorAvatar.includes("/")) ? (
                                <img src={comment.authorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                comment.authorAvatar || "T"
                              )}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>{comment.authorName}</span>
                            {comment.authorIdNum && <span style={{ fontSize: 9, color: "var(--accent-green)" }}>#ID {comment.authorIdNum}</span>}
                            {comment.authorUsername && <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>@{comment.authorUsername}</span>}
                            <span style={{ fontSize: 8, color: "var(--text-muted)", marginLeft: "auto" }}>{comment.time}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>{comment.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Composer */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id)} style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "6px 10px", color: "#fff", outline: "none", fontSize: "11px" }}
                      />
                      <button type="submit" style={{ padding: "6px 12px", background: "var(--accent-green-dim)", border: "1px solid var(--border-accent)", borderRadius: 4, color: "var(--accent-green)", fontSize: "10px", fontWeight: "600", cursor: "pointer" }} disabled={!commentInput.trim()}>
                        Reply
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
