import { useState } from "react";
import { FORUM_CATEGORIES } from "../../data/forumData";

export default function CreateThreadModal({ onClose, onSubmit, defaultCategory }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(defaultCategory || FORUM_CATEGORIES[0].id);
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 10) { setError("Title must be at least 10 characters."); return; }
    if (body.trim().length < 30) { setError("Body must be at least 30 characters."); return; }
    const tagArray = tags.split(",").map((t) => t.trim().toUpperCase().replace(/[^A-Z0-9$]/g, "")).filter(Boolean).slice(0, 8);
    onSubmit({
      id: "t_new_" + Date.now(),
      categoryId: category,
      title: title.trim(),
      body: body.trim(),
      author: "u1",
      upvotes: 0,
      downvotes: 0,
      replyCount: 0,
      views: 1,
      createdAt: new Date().toISOString(),
      tags: tagArray,
      pinned: false,
      hot: false,
      replies: [],
    });
  }

  return (
    <div className="create-thread-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-thread-modal">
        <div className="create-thread-modal__header">
          <span className="create-thread-modal__title">+ New Thread</span>
          <button className="create-thread-modal__close" onClick={onClose}>✕</button>
        </div>

        <form className="create-thread-modal__form" onSubmit={handleSubmit}>
          <div className="create-thread-modal__field">
            <label className="create-thread-modal__label">Category</label>
            <select
              className="create-thread-modal__select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {FORUM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="create-thread-modal__field">
            <label className="create-thread-modal__label">Thread Title</label>
            <input
              className="create-thread-modal__input"
              placeholder="Be specific — e.g. 'Long $AAPL — AI supercycle justifies premium valuation'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
            <span className="create-thread-modal__char-count">{title.length}/150</span>
          </div>

          <div className="create-thread-modal__field">
            <label className="create-thread-modal__label">Analysis / Body</label>
            <div className="create-thread-modal__toolbar">
              <button type="button" className="create-thread-modal__toolbar-btn" onClick={() => setBody((b) => b + "**bold**")}>B</button>
              <button type="button" className="create-thread-modal__toolbar-btn italic" onClick={() => setBody((b) => b + "*italic*")}>I</button>
              <button type="button" className="create-thread-modal__toolbar-btn code" onClick={() => setBody((b) => b + "`code`")}>{"<>"}</button>
              <span className="create-thread-modal__toolbar-hint">Use $TICKER for stock mentions</span>
            </div>
            <textarea
              className="create-thread-modal__textarea"
              placeholder="Share your analysis, trade thesis, or market view. Use **bold**, *italic*, $TICKER for highlights…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
            />
          </div>

          <div className="create-thread-modal__field">
            <label className="create-thread-modal__label">Tags (comma-separated)</label>
            <input
              className="create-thread-modal__input"
              placeholder="e.g. $AAPL, TECH, EARNINGS, LONG"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <span className="create-thread-modal__hint">Up to 8 tags. Prefix tickers with $ for auto-linking.</span>
          </div>

          {error && <div className="create-thread-modal__error">{error}</div>}

          <div className="create-thread-modal__actions">
            <button type="button" className="create-thread-modal__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="create-thread-modal__submit">
              Publish Thread →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
