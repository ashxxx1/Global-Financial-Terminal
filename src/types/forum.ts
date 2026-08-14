/**
 * Forum & Profile view-layer types.
 *
 * These interfaces describe the **presentation** shape that components render.
 * The underlying Firestore documents (see lib/forum.ts) have a different,
 * flatter shape; adapter functions at the bottom of this file bridge the two.
 */

/* ═══════════════════════════════════════════════════════════════
   Core Types
   ═══════════════════════════════════════════════════════════════ */

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl?: string;
  joinedOrderNumber: number;
  joinedAt: string;
}

export interface ForumPost {
  id: string;
  author: UserProfile;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt: string;
  commentCount: number;
  repostCount: number;
  shareCount: number;
  isReposted?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   Adapters — Firestore types → view types
   ═══════════════════════════════════════════════════════════════ */

import type { ForumPost as FsPost } from "../lib/forum";

/** Derive a username from an email address.
 *  `"alex.smith@email.com"` → `"alex_smith"` */
export function usernameFromEmail(email: string | null): string {
  if (!email) return "user";
  const local = email.split("@")[0] || "user";
  return local.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
}

/** Build a minimal UserProfile from the flat author fields on a Firestore post. */
export function authorToViewProfile(
  authorId: string,
  authorName: string,
  authorPhoto: string | null,
  memberNo?: number | null,
): UserProfile {
  return {
    id: authorId,
    email: "",
    username: usernameFromEmail(authorName),
    displayName: authorName || "Anonymous",
    avatarUrl: authorPhoto || "",
    joinedOrderNumber: memberNo ?? 0,
    joinedAt: "",
  };
}

/** Convert a Firestore ForumPost to the view-layer ForumPost. */
export function toViewPost(fp: FsPost, isReposted = false): ForumPost {
  const firstMedia = fp.media[0] ?? null;
  return {
    id: fp.id,
    author: authorToViewProfile(fp.authorId, fp.authorName, fp.authorPhoto),
    content: fp.text,
    mediaUrl: firstMedia?.url,
    mediaType: firstMedia?.type,
    createdAt: fp.createdAt?.toISOString() ?? new Date().toISOString(),
    commentCount: fp.commentCount,
    repostCount: fp.repostCount,
    shareCount: 0,
    isReposted,
  };
}
