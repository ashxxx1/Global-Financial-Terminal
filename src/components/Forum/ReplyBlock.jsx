import { useState } from "react";
import { getUserById } from "../../data/forumData";
import StockMention from "./StockMention";

function renderBody(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\$[A-Z]{1,5})/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (/^\$[A-Z]{1,5}$/.test(part)) {
            return <StockMention key={j} symbol={part.slice(1)} />;
          }
          let html = part.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
          return <span key={j} dangerouslySetInnerHTML={{ __html: html }} />;
        })}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ReplyBlock({ reply, childReplies = [], votes, onVote }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [children, setChildren] = useState(childReplies);
  const user = getUserById(reply.author);
  const myVote = votes[reply.id] || 0;
  const badgeColor = user?.badge === "Analyst" ? "var(--accent-blue)" : user?.badge === "Bull" ? "var(--accent-green)" : "var(--accent-red)";

  function submitChildReply() {
    if (!replyText.trim()) return;
    setChildren((c) => [...c, {
      id: "cr_" + Date.now(),
      author: "u1",
      body: replyText.trim(),
      upvotes: 0,
      createdAt: new Date().toISOString(),
      parentId: reply.id,
    }]);
    setReplyText("");
    setShowReplyForm(false);
  }

  return (
    <div className="reply-block">
      <div className="reply-block__main">
        <div className="reply-block__avatar" style={{ background: `${badgeColor}22`, borderColor: badgeColor }}>
          {user?.avatar || "?"}
        </div>
        <div className="reply-block__content">
          <div className="reply-block__meta">
            <span className="reply-block__name">{user?.name || "Member"}</span>
            {user?.badge && (
              <span className="reply-block__badge" style={{ color: badgeColor, borderColor: badgeColor }}>{user.badge}</span>
            )}
            <span className="reply-block__time">{formatTimeAgo(reply.createdAt)}</span>
          </div>
          <div className="reply-block__body">{renderBody(reply.body)}</div>
          <div className="reply-block__actions">
            <button
              className={`reply-block__vote ${myVote === 1 ? "active-up" : ""}`}
              onClick={() => onVote(reply.id, 1)}
            >▲ {reply.upvotes + myVote}</button>
            <button
              className={`reply-block__vote ${myVote === -1 ? "active-down" : ""}`}
              onClick={() => onVote(reply.id, -1)}
            >▼</button>
            <button className="reply-block__reply-btn" onClick={() => setShowReplyForm((v) => !v)}>
              ↩ Reply
            </button>
          </div>

          {showReplyForm && (
            <div className="reply-block__compose">
              <textarea
                className="reply-block__compose-input"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add your response…"
                rows={3}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="reply-block__cancel" onClick={() => setShowReplyForm(false)}>Cancel</button>
                <button className="reply-block__submit" onClick={submitChildReply} disabled={!replyText.trim()}>Reply</button>
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div className="reply-block__children">
              {children.map((child) => (
                <ReplyBlock key={child.id} reply={child} childReplies={[]} votes={votes} onVote={onVote} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
