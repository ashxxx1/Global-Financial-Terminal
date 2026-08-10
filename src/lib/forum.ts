/**
 * forum.ts — Firestore-backed community board.
 *
 * Same philosophy as auth.ts: every Firestore/Storage call funnels through
 * here, so components never import the SDK directly. Data model:
 *
 *   forum_posts/{postId}                    — original posts (text + media)
 *   forum_posts/{postId}/comments/{id}       — replies, subcollection
 *   forum_reposts/{postId_uid}               — one doc per (post, user) repost,
 *                                               deterministic id so toggling is
 *                                               idempotent and denormalized so
 *                                               the feed never needs a 2nd read
 *
 * `commentCount` / `repostCount` on a post are denormalized counters bumped
 * with `increment()` — see firestore.rules for the (fairly tight) constraints
 * on who may touch what.
 *
 * Every read/write requires a signed-in user. This app is already sign-in
 * gated by default (see lib/auth.ts `authRequired`), so this doesn't open a
 * new public surface — it just matches the rest of the schema.
 */
import { useEffect, useMemo, useState } from "react";
import {
  collection, collectionGroup, doc, addDoc, setDoc, deleteDoc, updateDoc,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, increment,
  Timestamp, type DocumentData,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Profile } from "./auth";
import { track } from "./analytics";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface ForumMedia {
  url: string;
  /** Storage path — kept so a post delete can also clean up the file. */
  path: string;
  type: "image" | "video";
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  text: string;
  media: ForumMedia[];
  createdAt: Date | null;
  commentCount: number;
  repostCount: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  text: string;
  createdAt: Date | null;
}

export interface ForumRepost {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  createdAt: Date | null;
  /** Snapshot of the original post at repost time, so the feed renders it
   *  without a second read — and it still displays fine even if the original
   *  is later deleted. */
  post: {
    authorId: string;
    authorName: string;
    authorPhoto: string | null;
    text: string;
    media: ForumMedia[];
  };
}

/** One row in the merged home timeline — either a fresh post or a repost of
 *  one, ordered by whichever action is being timestamped. `post` is always a
 *  fully-formed ForumPost so the renderer can treat both kinds uniformly;
 *  for reposts it's the live doc when available (fresh counts), falling
 *  back to the repost's own snapshot (e.g. the original was deleted). */
export type FeedEntry =
  | { kind: "post"; time: number; post: ForumPost }
  | { kind: "repost"; time: number; post: ForumPost; repost: ForumRepost };

/* ═══════════════════════════════════════════════════════════════
   Internal helpers
   ═══════════════════════════════════════════════════════════════ */

function requireDb() {
  if (!db) throw new Error("Firestore isn't configured for this build — add your VITE_FIREBASE_* keys.");
  return db;
}

function requireStorage() {
  if (!storage) throw new Error("Media storage isn't configured for this build.");
  return storage;
}

function displayNameFor(user: Profile): string {
  return user.displayName || (user.email ? user.email.split("@")[0] : "") || "Anonymous";
}

/** Matches the initials logic in TopNav's AccountChip, generalized to any
 *  name/email pair so post/comment/profile avatars fall back consistently. */
export function initialsFor(name: string | null, email?: string | null): string {
  return (name || email || "?")
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function authorFields(user: Profile) {
  return { authorId: user.uid, authorName: displayNameFor(user), authorPhoto: user.photoURL };
}

function toDate(v: unknown): Date | null {
  return v instanceof Timestamp ? v.toDate() : null;
}

function toPost(id: string, data: DocumentData): ForumPost {
  return {
    id,
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "Anonymous",
    authorPhoto: data.authorPhoto ?? null,
    text: data.text ?? "",
    media: Array.isArray(data.media) ? data.media : [],
    createdAt: toDate(data.createdAt),
    commentCount: typeof data.commentCount === "number" ? data.commentCount : 0,
    repostCount: typeof data.repostCount === "number" ? data.repostCount : 0,
  };
}

function toComment(id: string, postId: string, data: DocumentData): ForumComment {
  return {
    id,
    postId,
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "Anonymous",
    authorPhoto: data.authorPhoto ?? null,
    text: data.text ?? "",
    createdAt: toDate(data.createdAt),
  };
}

function toRepost(id: string, data: DocumentData): ForumRepost {
  const p = (data.post ?? {}) as Record<string, unknown>;
  return {
    id,
    postId: data.postId ?? "",
    userId: data.userId ?? "",
    userName: data.userName ?? "Anonymous",
    userPhoto: data.userPhoto ?? null,
    createdAt: toDate(data.createdAt),
    post: {
      authorId: (p.authorId as string) ?? "",
      authorName: (p.authorName as string) ?? "Anonymous",
      authorPhoto: (p.authorPhoto as string | null) ?? null,
      text: (p.text as string) ?? "",
      media: Array.isArray(p.media) ? (p.media as ForumMedia[]) : [],
    },
  };
}

const byNewest = <T extends { createdAt: Date | null }>(a: T, b: T): number =>
  (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

/** Firebase error codes aren't user-facing copy — translate the common ones. */
export function humanForumError(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  const map: Record<string, string> = {
    "permission-denied": "Permission denied — try signing out and back in.",
    "storage/unauthorized": "Upload was rejected. Make sure Storage is enabled and storage.rules is deployed.",
    "storage/unknown": "Media storage isn't set up for this project yet — enable Storage in the Firebase console.",
    "storage/object-not-found": "That file no longer exists.",
    "storage/canceled": "Upload cancelled.",
    unavailable: "Network problem — check your connection and try again.",
  };
  return map[code] || (err instanceof Error ? err.message : "Something went wrong. Try again.");
}

/* ═══════════════════════════════════════════════════════════════
   Links
   ═══════════════════════════════════════════════════════════════ */

export function postPath(postId: string): string {
  return `/forum/post/${postId}`;
}

/** Full shareable URL, honouring the GitHub Pages base path the same way
 *  App.tsx's router basename does. */
export function postShareUrl(postId: string): string {
  if (typeof window === "undefined") return postPath(postId);
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${window.location.origin}${base}${postPath(postId)}`;
}

export function timeAgo(date: Date | null): string {
  if (!date) return "now";
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════════════════════════
   Media upload
   ═══════════════════════════════════════════════════════════════ */

export const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
export const MAX_MEDIA_ITEMS = 4;

export async function uploadForumMedia(user: Profile, file: File): Promise<ForumMedia> {
  const bucket = requireStorage();
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isImage && !isVideo) throw new Error("Only images and videos are supported.");
  if (file.size > MAX_MEDIA_BYTES) throw new Error("Files must be under 15MB.");
  const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().slice(0, 8);
  const path = `forum_media/${user.uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const fileRef = storageRef(bucket, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  return { url, path, type: isVideo ? "video" : "image" };
}

/* ═══════════════════════════════════════════════════════════════
   Actions
   ═══════════════════════════════════════════════════════════════ */

export const MAX_POST_CHARS = 2000;
export const MAX_COMMENT_CHARS = 1000;

export async function createPost(user: Profile, text: string, media: ForumMedia[]): Promise<string> {
  const database = requireDb();
  const trimmed = text.trim();
  if (!trimmed && media.length === 0) throw new Error("Write something or attach media first.");
  if (trimmed.length > MAX_POST_CHARS) throw new Error(`Keep it under ${MAX_POST_CHARS} characters.`);
  const created = await addDoc(collection(database, "forum_posts"), {
    ...authorFields(user),
    text: trimmed,
    media,
    createdAt: serverTimestamp(),
    commentCount: 0,
    repostCount: 0,
  });
  track("forum_post_created", { hasMedia: media.length > 0 });
  return created.id;
}

export async function deletePost(user: Profile, post: ForumPost): Promise<void> {
  const database = requireDb();
  if (post.authorId !== user.uid) throw new Error("You can only delete your own posts.");
  await deleteDoc(doc(database, "forum_posts", post.id));
  // Best-effort cleanup — a stray file must never block the delete the user
  // asked for, so failures here are swallowed.
  const bucket = storage;
  if (bucket && post.media.length > 0) {
    await Promise.all(post.media.map((m) => deleteObject(storageRef(bucket, m.path)).catch(() => {})));
  }
  track("forum_post_deleted", {});
}

export async function addComment(user: Profile, postId: string, text: string): Promise<void> {
  const database = requireDb();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write a comment first.");
  if (trimmed.length > MAX_COMMENT_CHARS) throw new Error(`Keep comments under ${MAX_COMMENT_CHARS} characters.`);
  await addDoc(collection(database, "forum_posts", postId, "comments"), {
    ...authorFields(user),
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "forum_posts", postId), { commentCount: increment(1) }).catch(() => {});
  track("forum_comment_added", { postId });
}

export async function deleteComment(user: Profile, postId: string, commentId: string, authorId: string): Promise<void> {
  const database = requireDb();
  if (authorId !== user.uid) throw new Error("You can only delete your own comments.");
  await deleteDoc(doc(database, "forum_posts", postId, "comments", commentId));
  await updateDoc(doc(database, "forum_posts", postId), { commentCount: increment(-1) }).catch(() => {});
  track("forum_comment_deleted", { postId });
}

export async function repost(user: Profile, post: ForumPost): Promise<void> {
  const database = requireDb();
  const id = `${post.id}_${user.uid}`;
  await setDoc(doc(database, "forum_reposts", id), {
    postId: post.id,
    userId: user.uid,
    userName: displayNameFor(user),
    userPhoto: user.photoURL,
    createdAt: serverTimestamp(),
    post: {
      authorId: post.authorId,
      authorName: post.authorName,
      authorPhoto: post.authorPhoto,
      text: post.text,
      media: post.media,
    },
  });
  await updateDoc(doc(database, "forum_posts", post.id), { repostCount: increment(1) }).catch(() => {});
  track("forum_post_reposted", { postId: post.id });
}

export async function unrepost(user: Profile, postId: string): Promise<void> {
  const database = requireDb();
  await deleteDoc(doc(database, "forum_reposts", `${postId}_${user.uid}`));
  await updateDoc(doc(database, "forum_posts", postId), { repostCount: increment(-1) }).catch(() => {});
  track("forum_post_unreposted", { postId });
}

/* ═══════════════════════════════════════════════════════════════
   Live subscriptions
   ═══════════════════════════════════════════════════════════════ */

/** Merged home timeline: recent posts + recent reposts, sorted by whichever
 *  action happened most recently (a repost bumps content back to the top,
 *  same as the platforms this is modelled on). No pagination yet — a single
 *  bounded page is plenty until the board has real volume. */
export function useForumFeed(take = 60): { entries: FeedEntry[]; loading: boolean; error: string | null } {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [reposts, setReposts] = useState<ForumRepost[]>([]);
  const [postsReady, setPostsReady] = useState(false);
  const [repostsReady, setRepostsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) { setPostsReady(true); return; }
    const q = query(collection(db, "forum_posts"), orderBy("createdAt", "desc"), limit(take));
    return onSnapshot(
      q,
      (snap) => { setPosts(snap.docs.map((d) => toPost(d.id, d.data()))); setPostsReady(true); },
      (err) => { setError(humanForumError(err)); setPostsReady(true); },
    );
  }, [take]);

  useEffect(() => {
    if (!db) { setRepostsReady(true); return; }
    const q = query(collection(db, "forum_reposts"), orderBy("createdAt", "desc"), limit(take));
    return onSnapshot(
      q,
      (snap) => { setReposts(snap.docs.map((d) => toRepost(d.id, d.data()))); setRepostsReady(true); },
      (err) => { setError(humanForumError(err)); setRepostsReady(true); },
    );
  }, [take]);

  const entries = useMemo<FeedEntry[]>(() => {
    const postById = new Map(posts.map((p) => [p.id, p] as const));
    const fromPosts: FeedEntry[] = posts.map((post) => ({
      kind: "post", post, time: post.createdAt?.getTime() ?? Date.now(),
    }));
    const fromReposts: FeedEntry[] = reposts.map((repost) => {
      const live = postById.get(repost.postId);
      const post: ForumPost = live ?? {
        id: repost.postId,
        authorId: repost.post.authorId,
        authorName: repost.post.authorName,
        authorPhoto: repost.post.authorPhoto,
        text: repost.post.text,
        media: repost.post.media,
        createdAt: repost.createdAt,
        commentCount: 0,
        repostCount: 0,
      };
      return { kind: "repost", post, repost, time: repost.createdAt?.getTime() ?? Date.now() };
    });
    return [...fromPosts, ...fromReposts].sort((a, b) => b.time - a.time);
  }, [posts, reposts]);

  return { entries, loading: !postsReady || !repostsReady, error };
}

/** Single post, live — backs the permalink page. */
export function usePost(postId: string | undefined): { post: ForumPost | null; loading: boolean; error: string | null } {
  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !postId) { setLoading(false); return; }
    setLoading(true);
    return onSnapshot(
      doc(db, "forum_posts", postId),
      (snap) => { setPost(snap.exists() ? toPost(snap.id, snap.data()) : null); setLoading(false); },
      (err) => { setError(humanForumError(err)); setLoading(false); },
    );
  }, [postId]);

  return { post, loading, error };
}

export function usePostComments(postId: string | undefined): { comments: ForumComment[]; loading: boolean } {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !postId) { setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "forum_posts", postId, "comments"), orderBy("createdAt", "asc"));
    return onSnapshot(
      q,
      (snap) => { setComments(snap.docs.map((d) => toComment(d.id, postId, d.data()))); setLoading(false); },
      () => setLoading(false),
    );
  }, [postId]);

  return { comments, loading };
}

/** Post ids the current user has reposted — drives the repost button's toggle
 *  state across the whole app, not just whatever's in the visible feed page. */
export function useMyReposts(uid: string | undefined): Set<string> {
  const [mine, setMine] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!db || !uid) { setMine(new Set()); return; }
    const q = query(collection(db, "forum_reposts"), where("userId", "==", uid));
    return onSnapshot(q, (snap) => {
      setMine(new Set(snap.docs.map((d) => (d.data().postId as string) ?? "")));
    }, () => {});
  }, [uid]);

  return mine;
}

/** Posts authored by one user — powers both the "Posts" and "Media" profile
 *  tabs (media is just this, filtered client-side). */
export function useUserPosts(uid: string | undefined): { posts: ForumPost[]; loading: boolean } {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) { setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "forum_posts"), where("authorId", "==", uid));
    return onSnapshot(
      q,
      (snap) => { setPosts(snap.docs.map((d) => toPost(d.id, d.data())).sort(byNewest)); setLoading(false); },
      () => setLoading(false),
    );
  }, [uid]);

  return { posts, loading };
}

/** Comments authored by one user, across every post — a collection-group
 *  query filtered by a single equality clause only, so it needs no manual
 *  composite index. The parent post id is read off the doc path rather than
 *  stored redundantly on the comment. */
export function useUserComments(uid: string | undefined): { comments: ForumComment[]; loading: boolean } {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) { setLoading(false); return; }
    setLoading(true);
    const q = query(collectionGroup(db, "comments"), where("authorId", "==", uid));
    return onSnapshot(
      q,
      (snap) => {
        setComments(
          snap.docs
            .map((d) => toComment(d.id, d.ref.parent.parent?.id ?? "", d.data()))
            .sort(byNewest),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  return { comments, loading };
}

export function useUserReposts(uid: string | undefined): { reposts: ForumRepost[]; loading: boolean } {
  const [reposts, setReposts] = useState<ForumRepost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) { setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "forum_reposts"), where("userId", "==", uid));
    return onSnapshot(
      q,
      (snap) => { setReposts(snap.docs.map((d) => toRepost(d.id, d.data())).sort(byNewest)); setLoading(false); },
      () => setLoading(false),
    );
  }, [uid]);

  return { reposts, loading };
}
