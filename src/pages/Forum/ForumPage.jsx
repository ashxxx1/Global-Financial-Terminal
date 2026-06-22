import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FORUM_CATEGORIES, FORUM_THREADS, getTrendingThreads, getUserById } from "../../data/forumData";
import ThreadCard from "../../components/Forum/ThreadCard";
import ForumSidebar from "../../components/Forum/ForumSidebar";
import CreateThreadModal from "../../components/Forum/CreateThreadModal";

export default function ForumPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [threads, setThreads] = useState(FORUM_THREADS);
  const trending = getTrendingThreads(5);

  function handleNewThread(thread) {
    setThreads((prev) => [thread, ...prev]);
    setCreateOpen(false);
  }

  return (
    <div className="forum-page">
      <div className="forum-page__header">
        <div className="forum-page__header-content">
          <div className="forum-page__title-block">
            <div className="forum-page__breadcrumb">
              <Link to="/" className="forum-page__breadcrumb-link">← Terminal</Link>
              <span className="forum-page__breadcrumb-sep">/</span>
              <span>Community Forum</span>
            </div>
            <h1 className="forum-page__title">💬 GlobalFin Community</h1>
            <p className="forum-page__subtitle">
              Institutional-grade market analysis, trade ideas, and macro research — from the community.
            </p>
          </div>
          <button className="forum-page__new-thread-btn" onClick={() => setCreateOpen(true)}>
            <span>+</span> New Thread
          </button>
        </div>

        {/* Stats row */}
        <div className="forum-page__stats">
          {[
            { label: "Threads", val: threads.length + 42 },
            { label: "Members", val: "1,847" },
            { label: "Posts Today", val: "234" },
            { label: "Online Now", val: "89" },
          ].map((s) => (
            <div key={s.label} className="forum-page__stat">
              <span className="forum-page__stat-val">{s.val}</span>
              <span className="forum-page__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="forum-page__body">
        <div className="forum-page__main">
          {/* Categories */}
          <div className="forum-page__categories-section">
            <div className="forum-page__section-title">Browse Categories</div>
            <div className="forum-page__categories-grid">
              {FORUM_CATEGORIES.map((cat) => (
                <Link key={cat.id} to={`/forum/${cat.id}`} className="forum-category-card">
                  <div className="forum-category-card__icon" style={{ color: cat.color }}>{cat.icon}</div>
                  <div className="forum-category-card__info">
                    <div className="forum-category-card__name">{cat.label}</div>
                    <div className="forum-category-card__desc">{cat.description}</div>
                  </div>
                  <div className="forum-category-card__count" style={{ color: cat.color }}>{cat.count}</div>
                  <div className="forum-category-card__arrow">→</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Hot threads */}
          <div className="forum-page__hot-section">
            <div className="forum-page__section-title">
              🔥 Trending Now
              <Link to="/forum/all" className="forum-page__see-all">See all →</Link>
            </div>
            <div className="forum-page__threads">
              {threads.filter((t) => t.hot).map((t) => (
                <ThreadCard key={t.id} thread={t} />
              ))}
            </div>
          </div>

          {/* Recent */}
          <div className="forum-page__recent-section">
            <div className="forum-page__section-title">Recent Discussions</div>
            <div className="forum-page__threads">
              {threads.filter((t) => !t.hot).slice(0, 5).map((t) => (
                <ThreadCard key={t.id} thread={t} />
              ))}
            </div>
          </div>
        </div>

        <ForumSidebar threads={threads} />
      </div>

      {createOpen && (
        <CreateThreadModal onClose={() => setCreateOpen(false)} onSubmit={handleNewThread} />
      )}
    </div>
  );
}
