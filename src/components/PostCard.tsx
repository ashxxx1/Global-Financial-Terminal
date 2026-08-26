import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  type ForumPost, type ForumMedia,
  deletePost, repost, unrepost, humanForumError, postPath, postShareUrl, timeAgo, initialsFor,
} from "../lib/forum";
import { track } from "../lib/analytics";
import { IconComment, IconRepost, IconShare, IconTrash, IconClose } from "./ForumIcons";

interface PostCardProps {
  post: ForumPost;
  /** Has the current user already reposted this post? Lifted to the parent
   *  (a single useMyReposts subscription) rather than queried per-card. */
  reposted: boolean;
  /** Set when this card is being rendered as someone's repost in the feed. */
  repostedBy?: { uid: string; name: string } | null;
}

/** 1 image → wide hero. 2/4 → even grid. 3 → one wide top + two below. */
function mediaLayout(index: number, total: number): React.CSSProperties {
  if (total === 1) return { aspectRatio: "16/9" };
  if (total === 3 && index === 0) return { gridColumn: "1 / -1", aspectRatio: "16/9" };
  return { aspectRatio: "1" };
}

/** Derive handle from author name: "Alex Smith" → "@alex_smith" */
function deriveHandle(name: string): string {
  return "@" + name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

export default function PostCard({ post, reposted, repostedBy }: PostCardProps) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [busyRepost, setBusyRepost] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<ForumMedia | null>(null);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxItem(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxItem]);

  const isOwn = user?.uid === post.authorId;
  const goToPost = () => navigate(postPath(post.id));
  const goToProfile = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/user/${post.authorId}`); };

  async function handleRepost(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user || isOwn || busyRepost) return;
    setBusyRepost(true); setError(null);
    try {
      if (reposted) await unrepost(user, post.id);
      else await repost(user, post);
    } catch (err) {
      setError(humanForumError(err));
    } finally {
      setBusyRepost(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user || deleting) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true); setError(null);
    try {
      await deletePost(user, post);
    } catch (err) {
      setError(humanForumError(err));
      setDeleting(false);
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const shareData = {
      title: `${post.authorName} on GFT Terminal`,
      text: post.text ? post.text.slice(0, 140) : "Check out this post on GFT Terminal",
      url: postShareUrl(post.id),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        track("shared", { method: "native", surface: "forum_post", path: window.location.pathname });
        return;
      } catch {
        // cancelled or unsupported target — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      track("shared", { method: "clipboard", surface: "forum_post", path: window.location.pathname });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing more we can do silently */
    }
  }

  if (deleting) return null; // optimistic; the live listener confirms moments later

  const handle = deriveHandle(post.authorName);

  return (
    <article className="post-card">
      {repostedBy && (
        <div className="repost-flag">
          <IconRepost size={13} />
          {repostedBy.uid === user?.uid ? "You reposted" : `${repostedBy.name} reposted`}
        </div>
      )}
      <div className="post-row">
        {post.authorPhoto
          ? <img className="post-avatar" src={post.authorPhoto} alt="" referrerPolicy="no-referrer" onClick={goToProfile} />
          : <span className="post-avatar" onClick={goToProfile}>{initialsFor(post.authorName)}</span>}

        <div className="post-body">
          <div className="post-head">
            <span className="post-author" onClick={goToProfile} style={{ cursor: "pointer" }}>
              {post.authorName}
            </span>
            <button
              className="post-time"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
              onClick={(e) => { e.stopPropagation(); goToPost(); }}
            >
              {timeAgo(post.createdAt)}
            </button>
            {isOwn && (
              <button className="post-action danger post-delete" onClick={handleDelete} title="Delete post" aria-label="Delete post">
                <IconTrash size={13} />
              </button>
            )}
          </div>

          {post.text && <p className="post-text">{post.text}</p>}

          {post.media.length > 0 && (
            <div className="post-media" style={{ gridTemplateColumns: post.media.length === 1 ? "1fr" : "1fr 1fr" }}>
              {post.media.map((m, i) => (
                <div
                  key={i}
                  className="post-media-item"
                  style={mediaLayout(i, post.media.length)}
                  onClick={(e) => { e.stopPropagation(); setLightboxItem(m); }}
                >
                  {m.type === "video"
                    ? <video src={m.url} muted playsInline />
                    : <img src={m.url} alt="" loading="lazy" />}
                </div>
              ))}
            </div>
          )}

          <div className="post-actions">
            <button className="post-action" onClick={(e) => { e.stopPropagation(); goToPost(); }} title="Comment">
              <IconComment /> {post.commentCount > 0 ? post.commentCount : ""}
            </button>
            <button
              className={`post-action repost${reposted ? " on" : ""}`}
              onClick={handleRepost}
              disabled={!user || isOwn || busyRepost}
              title={isOwn ? "You can't repost your own post" : reposted ? "Undo repost" : "Repost"}
            >
              <IconRepost /> {post.repostCount > 0 ? post.repostCount : ""}
            </button>
            <button className="post-action" onClick={handleShare} title="Share" aria-label="Share post">
              {copied ? <span className="share-copied">Copied ✓</span> : <IconShare />}
            </button>
          </div>

          {error && <div className="auth-banner err" style={{ marginTop: 8, fontSize: 11.5, padding: "6px 10px" }}>{error}</div>}
        </div>
      </div>

      {lightboxItem && (
        <div className="lightbox" onClick={() => setLightboxItem(null)}>
          <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); setLightboxItem(null); }} aria-label="Close">
            <IconClose size={18} />
          </button>
          {lightboxItem.type === "video"
            ? <video src={lightboxItem.url} controls autoPlay onClick={(e) => e.stopPropagation()} />
            : <img src={lightboxItem.url} alt="" onClick={(e) => e.stopPropagation()} />}
        </div>
      )}
    </article>
  );
}
