import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSeo } from "../lib/seo";
import { isConfigured } from "../lib/firebase";
import {
  useAuth, usePublicProfile,
  updateDisplayName, updateUsername, updateAvatarPhoto, updateBannerPhoto,
} from "../lib/auth";
import {
  useUserPosts, useUserComments, useUserReposts, useMyReposts,
  postPath, timeAgo, ordinal, initialsFor, humanForumError, type ForumPost,
} from "../lib/forum";
import PostCard from "../components/PostCard";
import { IconPencil } from "../components/ForumIcons";

type Tab = "posts" | "comments" | "reposts" | "media";
const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "comments", label: "Comments" },
  { id: "reposts", label: "Reposts" },
  { id: "media", label: "Media" },
];

/** Calendar icon for the "Joined" line */
function IconCalendar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/** Full profile page — anyone's, by uid. Posts render as the real, full-size
 *  PostCard (same component the main feed uses, no `compact`), matching
 *  "as they would appear in the forum" exactly rather than approximating it. */
export default function UserProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const me = useAuth((s) => s.user);
  const { profile, loading: profileLoading } = usePublicProfile(uid);
  const isOwn = !!me && me.uid === uid;

  const [tab, setTab] = useState<Tab>("posts");
  const { posts, loading: postsLoading } = useUserPosts(uid);
  const { comments, loading: commentsLoading } = useUserComments(uid);
  const { reposts, loading: repostsLoading } = useUserReposts(uid);
  const myReposts = useMyReposts(me?.uid);
  const media = posts.filter((p) => p.media.length > 0);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useSeo({
    title: profile?.displayName ? `${profile.displayName} (GFT)` : "Profile",
    description: "Posts, comments and reposts on GFT Terminal.",
    noindex: true,
  });

  if (!isConfigured) return null;

  if (profileLoading) {
    return (
      <div className="user-profile-page forum-theme">
        <div className="profile-banner">
          <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
        </div>
        <div style={{ padding: 16 }}>
          <div className="skeleton" style={{ width: 88, height: 88, borderRadius: "50%", marginTop: -44 }} />
          <div className="skeleton" style={{ height: 18, width: "40%", borderRadius: 6, marginTop: 16 }} />
          <div className="skeleton" style={{ height: 12, width: "25%", borderRadius: 4, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile-page forum-theme" style={{ textAlign: "center", padding: "60px 16px" }}>
        <div className="es-icon">🕳</div>
        <div className="es-text">This account doesn't exist (or was deleted).</div>
        <Link to="/forum" className="chip" style={{ marginTop: 14, display: "inline-block" }}>← Back to forum</Link>
      </div>
    );
  }

  const emailFallback = uid ? uid.slice(0, 8) : "user";
  const handle = `@${profile.username || emailFallback}`;
  const joinedTitle = profile.memberNo
    ? `${profile.displayName || handle} was the ${ordinal(profile.memberNo)} person to join GFT.`
    : undefined;

  const joinedDate = profile.createdAt
    ? profile.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  function openNameEditor() {
    setNameInput(profile!.displayName || "");
    setUsernameInput(profile!.username || emailFallback);
    setProfileError(null);
    setEditingName(true);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    try {
      if (nameInput.trim() && nameInput.trim() !== profile!.displayName) {
        await updateDisplayName(nameInput);
      }
      const clean = usernameInput.trim().toLowerCase().replace(/^@/, "");
      if (clean && clean !== (profile!.username || "")) {
        await updateUsername(clean);
      }
      setEditingName(false);
    } catch (err) {
      setProfileError(humanForumError(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    setProfileError(null);
    try {
      await updateAvatarPhoto(file);
    } catch (err) {
      setProfileError(humanForumError(err));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onPickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBanner(true);
    setProfileError(null);
    try {
      await updateBannerPhoto(file);
    } catch (err) {
      setProfileError(humanForumError(err));
    } finally {
      setUploadingBanner(false);
    }
  }

  return (
    <div className="user-profile-page forum-theme">
      {/* ── Banner ── */}
      <div className={`profile-banner${profile.bannerURL ? " has-image" : ""}`}>
        {profile.bannerURL && (
          <img src={profile.bannerURL} alt="Profile wallpaper" referrerPolicy="no-referrer" />
        )}
        {isOwn && (
          <>
            <button
              type="button"
              className="profile-banner-edit"
              title="Change wallpaper"
              aria-label="Change wallpaper"
              disabled={uploadingBanner}
              onClick={() => bannerInput.current?.click()}
            >
              <IconPencil size={15} />
            </button>
            <input ref={bannerInput} type="file" accept="image/*" hidden onChange={onPickBanner} />
          </>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="profile-card profile-card-lg">
        <div className="profile-avatar-wrap profile-avatar-wrap-lg">
          {profile.photoURL
            ? <img className="profile-avatar-lg" src={profile.photoURL} alt="" referrerPolicy="no-referrer" />
            : <span className="profile-avatar-lg">{initialsFor(profile.displayName, null)}</span>}
          {isOwn && (
            <button
              type="button"
              className="profile-avatar-edit"
              title="Change profile photo"
              aria-label="Change profile photo"
              disabled={uploadingAvatar}
              onClick={() => avatarInput.current?.click()}
            >
              <IconPencil size={16} />
            </button>
          )}
          {isOwn && (
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onPickAvatar} />
          )}
        </div>

        <div className="profile-name-row">
          <div className="profile-name profile-name-lg">{profile.displayName || handle}</div>
          {profile.memberNo != null && (
            <span className="member-badge" title={joinedTitle}>#{profile.memberNo}</span>
          )}
          {isOwn && (
            <button
              type="button"
              className="profile-edit-btn"
              title="Edit name and username"
              aria-label="Edit name and username"
              onClick={editingName ? () => setEditingName(false) : openNameEditor}
            >
              <IconPencil size={14} />
            </button>
          )}
        </div>

        {editingName ? (
          <form className="profile-edit-form" onSubmit={saveProfile}>
            <div>
              <label htmlFor="up-display-name">Display name</label>
              <input id="up-display-name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={60} autoFocus />
            </div>
            <div>
              <label htmlFor="up-username">Username</label>
              <input id="up-username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} maxLength={20} placeholder="lowercase, letters/numbers/_" />
            </div>
            {profileError && <div className="auth-banner err" style={{ fontSize: 11, padding: "6px 10px" }}>{profileError}</div>}
            <div className="profile-edit-actions">
              <button type="submit" className="btn-primary sm" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save"}</button>
              <button type="button" className="btn-ghost sm" onClick={() => setEditingName(false)} disabled={savingProfile}>Cancel</button>
            </div>
          </form>
        ) : null}

        {/* Joined date */}
        {joinedDate && (
          <div className="profile-joined">
            <IconCalendar />
            Joined {joinedDate}
          </div>
        )}

        {profileError && !editingName && (
          <div className="auth-banner err" style={{ fontSize: 11, padding: "6px 10px", marginTop: 8 }}>{profileError}</div>
        )}

        <div className="profile-stats">
          <div className="profile-stat"><b>{posts.length}</b><span>Posts</span></div>
          <div className="profile-stat"><b>{reposts.length}</b><span>Reposts</span></div>
          <div className="profile-stat"><b>{comments.length}</b><span>Comments</span></div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs profile-tabs-lg">
        {TABS.map((t) => (
          <button key={t.id} className={`profile-tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Feed ── */}
      <div className="profile-feed profile-feed-lg">
        {tab === "posts" && (
          postsLoading ? <PageSkeleton /> :
          posts.length === 0 ? <PageEmpty icon="" text={isOwn ? "No posts yet, say something on the feed." : "No posts yet."} /> :
          posts.map((p) => <PostCard key={p.id} post={p} reposted={myReposts.has(p.id)} />)
        )}

        {tab === "comments" && (
          commentsLoading ? <PageSkeleton /> :
          comments.length === 0 ? <PageEmpty icon="" text="No comments yet." /> :
          comments.map((c) => (
            <button key={c.id} className="activity-row" onClick={() => navigate(postPath(c.postId))}>
              <div className="activity-kind">COMMENT</div>
              <div className="activity-text">{c.text}</div>
              <div className="activity-time">{timeAgo(c.createdAt)}</div>
            </button>
          ))
        )}

        {tab === "reposts" && (
          repostsLoading ? <PageSkeleton /> :
          reposts.length === 0 ? <PageEmpty icon="" text="No reposts yet." /> :
          reposts.map((r) => (
            <button key={r.id} className="activity-row" onClick={() => navigate(postPath(r.postId))}>
              <div className="activity-kind">REPOST · {r.post.authorName}</div>
              <div className="activity-text">{r.post.text || "(media post)"}</div>
              <div className="activity-time">{timeAgo(r.createdAt)}</div>
            </button>
          ))
        )}

        {tab === "media" && (
          postsLoading ? <PageSkeleton /> :
          media.length === 0 ? <PageEmpty icon="" text="No media yet." /> :
          <MediaGrid posts={media} onOpen={(id) => navigate(postPath(id))} />
        )}
      </div>
    </div>
  );
}

function MediaGrid({ posts, onOpen }: { posts: ForumPost[]; onOpen: (postId: string) => void }) {
  return (
    <div className="media-tab-grid">
      {posts.flatMap((p) =>
        p.media.map((m, i) => (
          <button key={`${p.id}-${i}`} className="media-tab-cell" onClick={() => onOpen(p.id)}>
            {m.type === "video" ? <video src={m.url} muted /> : <img src={m.url} alt="" loading="lazy" />}
          </button>
        )),
      )}
    </div>
  );
}

function PageEmpty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="empty-state" style={{ border: "none", padding: "50px 16px" }}>
      <span className="es-icon">{icon}</span>
      <div className="es-text">{text}</div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 18 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 11 }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <div className="skeleton" style={{ height: 12, width: "30%", borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 12, width: "90%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
