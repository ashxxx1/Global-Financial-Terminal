import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FORUM_CATEGORIES, FORUM_THREADS, getThreadsByCategory } from "../../data/forumData";
import ThreadCard from "../../components/Forum/ThreadCard";
import ForumSidebar from "../../components/Forum/ForumSidebar";
import CreateThreadModal from "../../components/Forum/CreateThreadModal";

const SORT_OPTIONS = [
  { id: "hot", label: "🔥 Hot" },
  { id: "new", label: "🕒 New" },
  { id: "top", label: "⬆️ Top" },
];

export default function ForumCategory() {
  const { categoryId } = useParams();
  const [sort, setSort] = useState("hot");
  const [createOpen, setCreateOpen] = useState(false);
  const [extra, setExtra] = useState([]);

  const category = categoryId === "all" ? {
    id: "all",
    label: "All Discussions",
    icon: "💬",
    description: "Browse all topics and discussions across all categories",
    color: "var(--accent-green)",
    count: FORUM_THREADS.length
  } : FORUM_CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="forum-page">
        <div className="forum-page__header" style={{ padding: "40px" }}>
          <h1 style={{ color: "var(--text-primary)" }}>Category not found</h1>
          <Link to="/forum" className="forum-page__breadcrumb-link">← Back to Forum</Link>
        </div>
      </div>
    );
  }

  let threads = [...extra, ...(categoryId === "all" ? FORUM_THREADS : getThreadsByCategory(categoryId))];
  if (sort === "hot") threads = threads.sort((a, b) => (b.upvotes + b.replyCount * 3) - (a.upvotes + a.replyCount * 3));
  else if (sort === "new") threads = threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === "top") threads = threads.sort((a, b) => b.upvotes - a.upvotes);

  function handleNewThread(thread) {
    setExtra((e) => [{ ...thread, categoryId }, ...e]);
    setCreateOpen(false);
  }

  return (
    <div className="forum-page">
      <div className="forum-page__header">
        <div className="forum-page__header-content">
          <div className="forum-page__title-block">
            <div className="forum-page__breadcrumb">
              <Link to="/" className="forum-page__breadcrumb-link">Terminal</Link>
              <span className="forum-page__breadcrumb-sep">/</span>
              <Link to="/forum" className="forum-page__breadcrumb-link">Forum</Link>
              <span className="forum-page__breadcrumb-sep">/</span>
              <span>{category.label}</span>
            </div>
            <h1 className="forum-page__title" style={{ color: category.color }}>
              {category.icon} {category.label}
            </h1>
            <p className="forum-page__subtitle">{category.description}</p>
          </div>
          <button className="forum-page__new-thread-btn" onClick={() => setCreateOpen(true)}>
            + New Thread
          </button>
        </div>
      </div>

      <div className="forum-page__body">
        <div className="forum-page__main">
          <div className="forum-category__sort-bar">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={`forum-category__sort-btn ${sort === s.id ? "active" : ""}`}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
            <span className="forum-category__count">{threads.length} threads</span>
          </div>

          <div className="forum-page__threads">
            {threads.length === 0 ? (
              <div className="forum-page__empty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>{category.icon}</div>
                <div style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 8 }}>No threads yet</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 20 }}>Be the first to start a discussion in {category.label}</div>
                <button className="forum-page__new-thread-btn" onClick={() => setCreateOpen(true)}>+ Start First Thread</button>
              </div>
            ) : (
              threads.map((t) => <ThreadCard key={t.id} thread={t} />)
            )}
          </div>
        </div>
        <ForumSidebar threads={FORUM_THREADS} />
      </div>

      {createOpen && (
        <CreateThreadModal
          onClose={() => setCreateOpen(false)}
          onSubmit={handleNewThread}
          defaultCategory={categoryId}
        />
      )}
    </div>
  );
}
