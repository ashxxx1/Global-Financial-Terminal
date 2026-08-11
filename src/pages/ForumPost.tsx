import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeo } from "../lib/seo";
import { useAuth } from "../lib/auth";
import { isConfigured } from "../lib/firebase";
import {
  usePost, usePostComments, useMyReposts,
  addComment, deleteComment, humanForumError, timeAgo, initialsFor,
  MAX_COMMENT_CHARS, type ForumComment,
} from "../lib/forum";
import PostCard from "../components/PostCard";
import ProfileRail from "../components/ProfileRail";
import { IconTrash } from "../components/ForumIcons";

export default function ForumPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { post, loading, error } = usePost(postId);
  const { comments, loading: commentsLoading } = usePostComments(postId);
  const myReposts = useMyReposts(user?.uid);
  const [commentError, setCommentError] = useState<string | null>(null);

  useSeo({
    title: post ? `${post.authorName} on the forum` : "Post",
    description: (post?.text || "A post on the GFT Terminal community forum.").slice(0, 155),
    path: postId ? `/forum/post/${postId}` : "/forum",
    noindex: true,
  });

  async function handleDeleteComment(c: ForumComment) {
    if (!user || !post) return;
    if (!window.confirm("Delete this comment?")) return;
    setCommentError(null);
    try {
      await deleteComment(user, post.id, c.id, c.authorId);
    } catch (e) {
      setCommentError(humanForumError(e));
    }
  }

  if (!isConfigured) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 16px" }}>
        <div className="auth-banner warn">
          The forum needs a Firebase project configured — set the <code>VITE_FIREBASE_*</code> keys
          and deploy <code>firestore.rules</code> / <code>storage.rules</code>. See the README.
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 16px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to read and join the conversation.</p>
      </div>
    );
  }

  return (
    <div className="forum-wrap">
      <ProfileRail />
      <main className="forum-main" style={{ borderRight: "1px solid var(--line)" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
          <button onClick={() => navigate("/forum")} className="chip" style={{ padding: "4px 10px", cursor: "pointer" }}>
            ← Forum
          </button>
        </div>

        {loading || !postId ? (
          <div style={{ padding: 16 }}>
            <div className="skeleton" style={{ height: 90, borderRadius: 10 }} />
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}><div className="auth-banner err">{error}</div></div>
        ) : !post ? (
          <div className="empty-state" style={{ border: "none", padding: "60px 16px" }}>
            <span className="es-icon">🕳️</span>
            <div className="es-text">This post doesn't exist — it may have been deleted.</div>
          </div>
        ) : (
          <>
            <PostCard post={post} reposted={myReposts.has(post.id)} />

            <CommentComposer key={post.id} postId={post.id} />

            {commentError && <div className="auth-banner err" style={{ margin: 16 }}>{commentError}</div>}

            {commentsLoading ? (
              <div style={{ padding: 16 }}><div className="skeleton" style={{ height: 60, borderRadius: 10 }} /></div>
            ) : comments.length === 0 ? (
              <div className="empty-state" style={{ border: "none" }}>
                <span className="es-icon">💬</span>
                <div className="es-text">No replies yet — write the first one.</div>
              </div>
            ) : (
              comments.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  canDelete={user.uid === c.authorId}
                  onDelete={() => handleDeleteComment(c)}
                />
              ))
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CommentComposer({ postId }: { postId: string }) {
  const user = useAuth((s) => s.user);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;

  async function submit() {
    if (!user || !text.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      await addComment(user, postId, text);
      setText("");
    } catch (e) {
      setError(humanForumError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="composer">
      <div className="composer-row">
        {user.photoURL
          ? <img className="post-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 34, height: 34 }} />
          : <span className="post-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initialsFor(user.displayName, user.email)}</span>}
        <div className="composer-body">
          <textarea
            placeholder="Post your reply…"
            value={text}
            maxLength={MAX_COMMENT_CHARS + 100}
            onChange={(e) => setText(e.target.value)}
            rows={1}
          />
          {error && <div className="auth-banner err" style={{ marginTop: 8, fontSize: 11.5, padding: "6px 10px" }}>{error}</div>}
          <div className="composer-foot" style={{ justifyContent: "flex-end" }}>
            <button className="composer-post-btn" onClick={submit} disabled={busy || !text.trim()}>
              {busy ? "Replying…" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentRow({ comment, canDelete, onDelete }: { comment: ForumComment; canDelete: boolean; onDelete: () => void }) {
  return (
    <div className="comment-row">
      {comment.authorPhoto
        ? <img className="post-avatar" src={comment.authorPhoto} alt="" referrerPolicy="no-referrer" style={{ width: 32, height: 32 }} />
        : <span className="post-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initialsFor(comment.authorName)}</span>}
      <div className="comment-body">
        <div className="comment-head">
          <span className="comment-author">{comment.authorName}</span>
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
          {canDelete && (
            <button
              className="post-action danger"
              style={{ marginLeft: "auto", padding: "2px 6px" }}
              onClick={onDelete}
              title="Delete comment"
              aria-label="Delete comment"
            >
              <IconTrash size={12} />
            </button>
          )}
        </div>
        <p className="comment-text">{comment.text}</p>
      </div>
    </div>
  );
}
