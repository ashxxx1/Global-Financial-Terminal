import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, fetchMemberNo } from "../lib/auth";
import {
  useUserPosts, useUserComments, useUserReposts,
  postPath, timeAgo, initialsFor, type ForumPost,
} from "../lib/forum";
import { useEffect } from "react";

type Tab = "posts" | "comments" | "reposts" | "media";
const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "POSTS" },
  { id: "comments", label: "COMMENTS" },
  { id: "reposts", label: "REPOSTS" },
  { id: "media", label: "MEDIA" },
];

/**
 * Sits in the lower-left of the forum page, below the header: the signed-in
 * user's own profile card, with their comments/reposts/media displayed
 * underneath it across tabs — the same shape as a Twitter/X profile page.
 */
export default function ProfileRail() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("posts");
  const [memberNo, setMemberNo] = useState<number | null>(null);

  const { posts, loading: postsLoading } = useUserPosts(user?.uid);
  const { comments, loading: commentsLoading } = useUserComments(user?.uid);
  const { reposts, loading: repostsLoading } = useUserReposts(user?.uid);

  useEffect(() => {
    fetchMemberNo().then(setMemberNo);
  }, [user?.uid]);

  if (!user) return null;
  const media = posts.filter((p) => p.media.length > 0);
  const handle = `@${(user.email ? user.email.split("@")[0] : user.uid.slice(0, 8)).replace(/[^a-z0-9_]/gi, "_").toLowerCase()}`;

  return (
    <aside className="forum-rail">
      {/* Mini banner gradient */}
      <div
        style={{
          height: 64,
          background:
            "linear-gradient(135deg, rgba(245,158,11,.08) 0%, rgba(16,185,129,.06) 40%, transparent 80%), var(--terminal-surface)",
          borderBottom: "1px solid var(--terminal-border)",
          flexShrink: 0,
        }}
      />

      <div className="profile-card" style={{ cursor: "pointer" }} onClick={() => navigate(`/user/${user.uid}`)}>
        <div style={{ marginTop: -28, position: "relative", zIndex: 2 }}>
          {user.photoURL
            ? <img className="profile-avatar-lg" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            : <span className="profile-avatar-lg">{initialsFor(user.displayName, user.email)}</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <div className="profile-name" style={{ marginTop: 0 }}>{user.displayName || handle}</div>
          {memberNo != null && (
            <span className="member-badge">#{memberNo}</span>
          )}
        </div>
        <div className="profile-handle">{handle}</div>

        <div className="profile-stats">
          <div className="profile-stat"><b>{posts.length}</b><span>Posts</span></div>
          <div className="profile-stat"><b>{reposts.length}</b><span>Reposts</span></div>
          <div className="profile-stat"><b>{comments.length}</b><span>Comments</span></div>
        </div>
      </div>

      <div className="profile-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`profile-tab${tab === t.id ? " on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="profile-feed">
        {tab === "posts" && (
          postsLoading ? <RailSkeleton /> :
          posts.length === 0 ? <RailEmpty icon="✎" text="No posts yet — say something on the feed." /> :
          posts.map((p) => (
            <button key={p.id} className="activity-row" onClick={() => navigate(postPath(p.id))}>
              <div className="activity-kind">POST{p.media.length > 0 ? " · MEDIA" : ""}</div>
              <div className="activity-text">{p.text || "(media post)"}</div>
              <div className="activity-time">{timeAgo(p.createdAt)}</div>
            </button>
          ))
        )}

        {tab === "comments" && (
          commentsLoading ? <RailSkeleton /> :
          comments.length === 0 ? <RailEmpty icon="💬" text="No comments yet." /> :
          comments.map((c) => (
            <button key={c.id} className="activity-row" onClick={() => navigate(postPath(c.postId))}>
              <div className="activity-kind">COMMENT</div>
              <div className="activity-text">{c.text}</div>
              <div className="activity-time">{timeAgo(c.createdAt)}</div>
            </button>
          ))
        )}

        {tab === "reposts" && (
          repostsLoading ? <RailSkeleton /> :
          reposts.length === 0 ? <RailEmpty icon="🔁" text="No reposts yet." /> :
          reposts.map((r) => (
            <button key={r.id} className="activity-row" onClick={() => navigate(postPath(r.postId))}>
              <div className="activity-kind">REPOST · {r.post.authorName}</div>
              <div className="activity-text">{r.post.text || "(media post)"}</div>
              <div className="activity-time">{timeAgo(r.createdAt)}</div>
            </button>
          ))
        )}

        {tab === "media" && (
          postsLoading ? <RailSkeleton /> :
          media.length === 0 ? <RailEmpty icon="🖼" text="No media yet." /> :
          <MediaGrid posts={media} onOpen={(id) => navigate(postPath(id))} />
        )}
      </div>
    </aside>
  );
}

function MediaGrid({ posts, onOpen }: { posts: ForumPost[]; onOpen: (postId: string) => void }) {
  return (
    <div className="media-tab-grid">
      {posts.flatMap((p) =>
        p.media.map((m, i) => (
          <button key={`${p.id}-${i}`} className="media-tab-cell" onClick={() => onOpen(p.id)}>
            {m.type === "video"
              ? <video src={m.url} muted />
              : <img src={m.url} alt="" loading="lazy" />}
          </button>
        )),
      )}
    </div>
  );
}

function RailEmpty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="empty-state" style={{ border: "none" }}>
      <span className="es-icon">{icon}</span>
      <div className="es-text">{text}</div>
    </div>
  );
}

function RailSkeleton() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 10 }}>
      <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: "50%", borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: "60%", borderRadius: 4 }} />
    </div>
  );
}
