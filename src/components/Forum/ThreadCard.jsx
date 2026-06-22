import { useState } from "react";
import { Link } from "react-router-dom";
import { FORUM_CATEGORIES, getUserById } from "../../data/forumData";

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ThreadCard({ thread }) {
  const [votes, setVotes] = useState(0);
  const user = getUserById(thread.author);
  const cat = FORUM_CATEGORIES.find((c) => c.id === thread.categoryId);

  return (
    <Link to={`/forum/thread/${thread.id}`} className="thread-card">
      <div className="thread-card__left">
        <div className="thread-card__vote-block">
          <button
            className="thread-card__vote-btn"
            onClick={(e) => { e.preventDefault(); setVotes((v) => v + 1); }}
          >▲</button>
          <span className="thread-card__vote-count">{thread.upvotes + votes}</span>
        </div>
      </div>

      <div className="thread-card__body">
        <div className="thread-card__meta">
          {cat && (
            <span className="thread-card__category" style={{ color: cat.color, borderColor: cat.color + "44" }}>
              {cat.icon} {cat.label}
            </span>
          )}
          {thread.pinned && <span className="thread-card__badge pinned">📌 Pinned</span>}
          {thread.hot && <span className="thread-card__badge hot">🔥 Hot</span>}
        </div>

        <h3 className="thread-card__title">{thread.title}</h3>

        <p className="thread-card__preview">
          {thread.body.slice(0, 160).replace(/\*\*/g, "").replace(/\*/g, "")}…
        </p>

        <div className="thread-card__tags">
          {thread.tags?.slice(0, 5).map((tag) => (
            <span key={tag} className="thread-card__tag">{tag}</span>
          ))}
        </div>

        <div className="thread-card__footer">
          {user && (
            <div className="thread-card__author">
              <div className="thread-card__avatar">{user.avatar}</div>
              <span className="thread-card__author-name">{user.name}</span>
              <span className="thread-card__author-role">{user.role}</span>
            </div>
          )}
          <div className="thread-card__stats">
            <span className="thread-card__stat">💬 {thread.replyCount}</span>
            <span className="thread-card__stat">👁 {thread.views?.toLocaleString()}</span>
            <span className="thread-card__time">{formatTimeAgo(thread.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
