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
} from "firebase/firestore";
import StockMention from "../Forum/StockMention";

// Initial mock feed updates
const MOCK_SOCIAL_POSTS = [
  {
    id: "sp1",
    authorName: "GlobeMacro",
    authorAvatar: "GM",
    authorRep: "Macro Strategist",
    text: "EUR/GBP testing support at 0.8420. Yield spreads between Bunds and Gilts suggest a minor consolidation is incoming. Watch the upcoming manufacturing prints.",
    imageURL: null,
    likes: 24,
    tags: ["EURGBP", "MACRO"],
    time: "2 hours ago"
  },
  {
    id: "sp2",
    authorName: "AlexTrade",
    authorAvatar: "AT",
    authorRep: "Senior Analyst",
    text: "Decent coiling pattern forming on $NVDA daily chart. Bollinger bands are tightening to historical levels — expect a high-velocity expansion by Wednesday.",
    imageURL: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60",
    likes: 47,
    tags: ["$NVDA", "SEMIS"],
    time: "4 hours ago"
  }
];

export default function PostsFeed() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [inputText, setInputText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [showImgField, setShowImgField] = useState(false);
  const [likesCount, setLikesCount] = useState({});

  useEffect(() => {
    if (!currentUser) {
      setPosts(MOCK_SOCIAL_POSTS);
      return;
    }

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
          authorAvatar: doc.data().authorAvatar,
          authorRep: doc.data().authorRep,
          text: doc.data().text,
          imageURL: doc.data().imageURL,
          likes: doc.data().likes || 0,
          tags: doc.data().tags || [],
          time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString() : "Just now"
        }));
        setPosts(list);
      } else {
        setPosts(MOCK_SOCIAL_POSTS);
      }
    }, () => {
      setPosts(MOCK_SOCIAL_POSTS);
    });

    return () => unsub();
  }, [currentUser]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const postContent = inputText;
    const postImg = imageURL;
    setInputText("");
    setImageURL("");
    setShowImgField(false);

    // Extract tags
    const tags = postContent.split(/\s+/).filter(w => w.startsWith("$") || w.startsWith("#")).map(w => w.toUpperCase());

    if (currentUser) {
      try {
        await addDoc(collection(db, "social_posts"), {
          authorName: currentUser.displayName || "Trader",
          authorAvatar: (currentUser.displayName || "T")[0],
          authorRep: "Member",
          text: postContent,
          imageURL: postImg || null,
          likes: 0,
          tags,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to add post to Firestore:", err);
      }
    } else {
      // Mock simulator append
      setPosts((prev) => [
        {
          id: "sp_sim_" + Date.now(),
          authorName: "You",
          authorAvatar: "U",
          authorRep: "Retail Trader",
          text: postContent,
          imageURL: postImg || null,
          likes: 0,
          tags,
          time: "Just now"
        },
        ...prev
      ]);
    }
  };

  const handleLike = (id) => {
    setLikesCount((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
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
          placeholder="Share your technical analysis, trade alerts, or macro thesis... Use $TICKER to tag assets."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
        />
        {showImgField && (
          <input
            type="text"
            className="posts-feed__img-input"
            placeholder="Paste analysis chart URL (e.g. Unsplash, TradingView link)..."
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
          />
        )}
        <div className="posts-feed__composer-actions">
          <button
            type="button"
            className={`posts-feed__tool-btn ${showImgField ? "active" : ""}`}
            onClick={() => setShowImgField(!showImgField)}
          >
            🖼️ Attach Chart URL
          </button>
          <button type="submit" className="posts-feed__submit-btn" disabled={!inputText.trim()}>
            Publish Post →
          </button>
        </div>
      </form>

      {/* Feed Cards */}
      <div className="posts-feed__list">
        {posts.map((post) => {
          const totalLikes = post.likes + (likesCount[post.id] || 0);
          return (
            <div key={post.id} className="post-card">
              <div className="post-card__header">
                <div className="post-card__avatar">{post.authorAvatar}</div>
                <div className="post-card__author-info">
                  <div className="post-card__author-name">{post.authorName}</div>
                  <div className="post-card__author-rep">{post.authorRep}</div>
                </div>
                <span className="post-card__time">{post.time}</span>
              </div>
              <div className="post-card__body">
                <p>{renderPostText(post.text)}</p>
                {post.imageURL && (
                  <img
                    src={post.imageURL}
                    alt="Shared Chart Analysis"
                    className="post-card__image"
                  />
                )}
              </div>
              <div className="post-card__footer">
                <button className="post-card__like-btn" onClick={() => handleLike(post.id)}>
                  ❤️ {totalLikes} Likes
                </button>
                <div className="post-card__tags">
                  {post.tags?.map((t) => (
                    <span key={t} className="post-card__tag-chip">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
