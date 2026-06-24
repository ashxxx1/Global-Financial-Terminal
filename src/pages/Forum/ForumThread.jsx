import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getThreadById, getUserById, FORUM_CATEGORIES } from "../../data/forumData";
import { useAuth } from "../../contexts/AuthContext";
import ReplyBlock from "../../components/Forum/ReplyBlock";
import StockMention from "../../components/Forum/StockMention";

function renderBody(text) {
  // Convert markdown-ish formatting to JSX
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
    // Italic
    line = line.replace(/\*(.*?)\*/g, (_, t) => `<em>${t}</em>`);
    // Stock tickers
    const parts = line.split(/(\$[A-Z]{1,5})/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (/^\$[A-Z]{1,5}$/.test(part)) {
            return <StockMention key={j} symbol={part.slice(1)} />;
          }
          return <span key={j} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function UserBadge({ userId, authorUser }) {
  const user = authorUser || getUserById(userId);
  if (!user) return <span className="forum-thread__author">Unknown</span>;
  const badgeColor = user.badge === "Analyst" ? "var(--accent-blue)" : user.badge === "Bull" ? "var(--accent-green)" : "var(--accent-red)";
  return (
    <div className="forum-thread__user">
      <div className="forum-thread__avatar" style={{ background: `linear-gradient(135deg, ${badgeColor}33, ${badgeColor}66)`, borderColor: badgeColor }}>
        {user.avatar && (user.avatar.startsWith("http") || user.avatar.includes("/") || user.avatar.startsWith("data:")) ? (
          <img src={user.avatar} alt={user.name} className="forum-thread__avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          user.avatar || "T"
        )}
      </div>
      <div>
        <div className="forum-thread__user-name">{user.name}</div>
        <div className="forum-thread__user-role" title={user.role}>{user.role}</div>
      </div>
      <span className="forum-thread__badge" style={{ color: badgeColor, borderColor: badgeColor }}>{user.badge}</span>
    </div>
  );
}

export default function ForumThread() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(() => {
    const t = getThreadById(threadId);
    return t ? { ...t, upvotes: t.upvotes, replies: [...(t.replies || [])] } : null;
  });
  const [replyText, setReplyText] = useState("");
  const [votes, setVotes] = useState({});
  const { currentUser, userProfileData } = useAuth();

  if (!thread) {
    return (
      <div className="forum-page" style={{ padding: "60px 40px" }}>
        <h2 style={{ color: "var(--text-primary)" }}>Thread not found</h2>
        <Link to="/forum" style={{ color: "var(--accent-green)" }}>← Back to Forum</Link>
      </div>
    );
  }

  const cat = FORUM_CATEGORIES.find((c) => c.id === thread.categoryId);

  function handleVote(id, dir) {
    setVotes((v) => {
      const cur = v[id] || 0;
      const next = cur === dir ? 0 : dir;
      return { ...v, [id]: next };
    });
    if (id === "thread") {
      setThread((t) => ({ ...t, upvotes: t.upvotes + (votes[id] === dir ? -dir : dir) }));
    }
  }

  function submitReply() {
    if (!replyText.trim()) return;
    const newReply = {
      id: "r_new_" + Date.now(),
      threadId: thread.id,
      author: currentUser?.uid || "u1",
      authorUser: currentUser ? {
        id: currentUser.uid,
        name: userProfileData?.displayName || currentUser.displayName || "AlphaTrader",
        avatar: userProfileData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        badge: userProfileData?.reputation || "Analyst",
        role: userProfileData?.bio || "Institutional macro research & active swing trading.",
      } : null,
      body: replyText.trim(),
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
      parentId: null,
    };
    setThread((t) => ({ ...t, replies: [...(t.replies || []), newReply], replyCount: (t.replyCount || 0) + 1 }));
    setReplyText("");
  }

  const topReplies = (thread.replies || []).filter((r) => !r.parentId);
  const childReplies = (thread.replies || []).filter((r) => r.parentId);

  return (
    <div className="forum-page">
      <div className="forum-page__header" style={{ paddingBottom: 20 }}>
        <div className="forum-page__breadcrumb">
          <Link to="/" className="forum-page__breadcrumb-link">Terminal</Link>
          <span className="forum-page__breadcrumb-sep">/</span>
          <Link to="/forum" className="forum-page__breadcrumb-link">Forum</Link>
          {cat && <>
            <span className="forum-page__breadcrumb-sep">/</span>
            <Link to={`/forum/${cat.id}`} className="forum-page__breadcrumb-link">{cat.label}</Link>
          </>}
        </div>
      </div>

      <div className="forum-page__body">
        <div className="forum-page__main">
          {/* Thread post */}
          <article className="forum-thread__article">
            {thread.pinned && <div className="forum-thread__pinned-badge">📌 Pinned</div>}
            {thread.hot && <div className="forum-thread__hot-badge">🔥 Hot</div>}

            <div className="forum-thread__tags">
              {thread.tags?.map((tag) => (
                <span key={tag} className="forum-thread__tag">{tag}</span>
              ))}
            </div>

            <h1 className="forum-thread__title">{thread.title}</h1>

            <div className="forum-thread__meta">
              <UserBadge userId={thread.author} authorUser={thread.authorUser} />
              <span className="forum-thread__date">{new Date(thread.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="forum-thread__views">👁 {thread.views?.toLocaleString()} views</span>
            </div>

            <div className="forum-thread__body">
              {renderBody(thread.body)}
            </div>

            <div className="forum-thread__actions">
              <div className="forum-thread__vote-block">
                <button
                  className={`forum-thread__vote-btn up ${votes.thread === 1 ? "active" : ""}`}
                  onClick={() => handleVote("thread", 1)}
                >▲</button>
                <span className="forum-thread__vote-count">{thread.upvotes + (votes.thread || 0)}</span>
                <button
                  className={`forum-thread__vote-btn down ${votes.thread === -1 ? "active" : ""}`}
                  onClick={() => handleVote("thread", -1)}
                >▼</button>
              </div>
              <span className="forum-thread__reply-count">💬 {thread.replyCount} replies</span>
              <button className="forum-thread__share-btn">🔗 Share</button>
            </div>
          </article>

          {/* Replies */}
          <div className="forum-thread__replies-section">
            <div className="forum-thread__replies-title">
              Replies <span className="forum-thread__replies-count">({topReplies.length})</span>
            </div>

            {topReplies.map((reply) => (
              <ReplyBlock
                key={reply.id}
                reply={reply}
                childReplies={childReplies.filter((r) => r.parentId === reply.id)}
                votes={votes}
                onVote={handleVote}
              />
            ))}
          </div>

          {/* Reply composer */}
          <div className="forum-thread__compose">
            <div className="forum-thread__compose-title">Add Your Analysis</div>
            <textarea
              className="forum-thread__compose-input"
              placeholder="Share your analysis, counterpoint, or insights… Use **bold**, *italic*, $TICKER for stock mentions."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={5}
            />
            <div className="forum-thread__compose-actions">
              <span className="forum-thread__compose-hint">Supports **bold**, *italic*, $TICKER symbols</span>
              <button
                className="forum-thread__submit-btn"
                onClick={submitReply}
                disabled={!replyText.trim()}
              >
                Post Reply →
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="forum-sidebar forum-thread__sidebar">
          <div className="forum-sidebar__section-title">Thread Info</div>
          <div className="forum-sidebar__info-row"><span>Category</span><span style={{ color: cat?.color }}>{cat?.icon} {cat?.label}</span></div>
          <div className="forum-sidebar__info-row"><span>Upvotes</span><span style={{ color: "var(--accent-green)" }}>▲ {thread.upvotes + (votes.thread || 0)}</span></div>
          <div className="forum-sidebar__info-row"><span>Replies</span><span>{thread.replyCount}</span></div>
          <div className="forum-sidebar__info-row"><span>Views</span><span>{thread.views?.toLocaleString()}</span></div>
          <div className="forum-sidebar__info-row"><span>Posted</span><span>{new Date(thread.createdAt).toLocaleDateString()}</span></div>

          {thread.tags?.length > 0 && (
            <>
              <div className="forum-sidebar__section-title" style={{ marginTop: 20 }}>Tagged Assets</div>
              <div className="forum-thread__tags" style={{ padding: "8px 0" }}>
                {thread.tags.map((tag) => (
                  <span key={tag} className="forum-thread__tag">{tag}</span>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
