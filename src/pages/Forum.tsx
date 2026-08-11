import { useSeo } from "../lib/seo";
import { useAuth } from "../lib/auth";
import { isConfigured } from "../lib/firebase";
import { useForumFeed, useMyReposts } from "../lib/forum";
import ForumComposer from "../components/ForumComposer";
import ProfileRail from "../components/ProfileRail";
import PostCard from "../components/PostCard";

export default function Forum() {
  useSeo({
    title: "Forum",
    description: "Post, repost, comment, and discuss the markets with the GFT Terminal community.",
    path: "/forum",
    noindex: true,
  });

  const user = useAuth((s) => s.user);
  const { entries, loading, error } = useForumFeed();
  const myReposts = useMyReposts(user?.uid);

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
        <div className="label" style={{ marginBottom: 8, color: "var(--faint)" }}>FORUM</div>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to read and join the conversation.</p>
      </div>
    );
  }

  return (
    <div className="forum-wrap">
      <ProfileRail />
      <main className="forum-main">
        <ForumComposer />

        {error && <div className="auth-banner err" style={{ margin: 16 }}>{error}</div>}

        {loading ? (
          <FeedSkeleton />
        ) : entries.length === 0 ? (
          <div className="empty-state" style={{ border: "none", padding: "60px 16px" }}>
            <span className="es-icon">🗣</span>
            <div className="es-text">Nobody's posted yet — be the first.</div>
          </div>
        ) : (
          entries.map((entry) => (
            <PostCard
              key={entry.kind === "post" ? `p-${entry.post.id}` : `r-${entry.repost.id}`}
              post={entry.post}
              reposted={myReposts.has(entry.post.id)}
              repostedBy={entry.kind === "repost" ? { uid: entry.repost.userId, name: entry.repost.userName } : null}
            />
          ))
        )}
      </main>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 18 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 11 }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <div className="skeleton" style={{ height: 12, width: "30%", borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 12, width: "90%", borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
