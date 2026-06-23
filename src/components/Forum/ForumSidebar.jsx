import { useState } from "react";
import { Link } from "react-router-dom";
import { getTrendingThreads, FORUM_CATEGORIES, FORUM_USERS } from "../../data/forumData";

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ForumSidebar({ threads }) {
  const trending = getTrendingThreads(5);

  return (
    <aside className="forum-sidebar">
      {/* Trending */}
      <div className="forum-sidebar__card">
        <div className="forum-sidebar__section-title">🔥 Trending</div>
        {trending.map((t, i) => {
          const cat = FORUM_CATEGORIES.find((c) => c.id === t.categoryId);
          return (
            <Link key={t.id} to={`/forum/thread/${t.id}`} className="forum-sidebar__trending-item">
              <span className="forum-sidebar__trending-rank">{i + 1}</span>
              <div className="forum-sidebar__trending-info">
                <div className="forum-sidebar__trending-title">{t.title.slice(0, 62)}{t.title.length > 62 ? "…" : ""}</div>
                <div className="forum-sidebar__trending-meta">
                  {cat && <span style={{ color: cat.color }}>{cat.icon}</span>}
                  <span>▲ {t.upvotes}</span>
                  <span>💬 {t.replyCount}</span>
                  <span>{formatTimeAgo(t.createdAt)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Categories quick nav */}
      <div className="forum-sidebar__card">
        <div className="forum-sidebar__section-title">Categories</div>
        {FORUM_CATEGORIES.map((cat) => (
          <Link key={cat.id} to={`/forum/${cat.id}`} className="forum-sidebar__cat-item">
            <span className="forum-sidebar__cat-icon">{cat.icon}</span>
            <span className="forum-sidebar__cat-label">{cat.label}</span>
            <span className="forum-sidebar__cat-count" style={{ color: cat.color }}>{cat.count}</span>
          </Link>
        ))}
      </div>

      {/* Top contributors */}
      <div className="forum-sidebar__card">
        <div className="forum-sidebar__section-title">Top Contributors</div>
        {FORUM_USERS.sort((a, b) => b.posts - a.posts).slice(0, 5).map((u) => {
          const badgeColor = u.badge === "Analyst" ? "var(--accent-blue)" : u.badge === "Bull" ? "var(--accent-green)" : "var(--accent-red)";
          return (
            <div key={u.id} className="forum-sidebar__contributor">
              <div className="forum-sidebar__contributor-avatar" style={{ background: `${badgeColor}22`, borderColor: badgeColor }}>
                {u.avatar}
              </div>
              <div className="forum-sidebar__contributor-info">
                <div className="forum-sidebar__contributor-name">{u.name}</div>
                <div className="forum-sidebar__contributor-role">{u.role}</div>
              </div>
              <div className="forum-sidebar__contributor-posts">{u.posts} posts</div>
            </div>
          );
        })}
      </div>

      {/* Market disclaimer */}
      <div className="forum-sidebar__disclaimer">
        ⚠️ Community opinions are for educational purposes only. Not financial advice. Always conduct your own research before making investment decisions.
      </div>
    </aside>
  );
}
