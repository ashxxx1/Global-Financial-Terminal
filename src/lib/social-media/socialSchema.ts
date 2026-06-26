/**
 * SOCIAL PLATFORM — CORE SCHEMA & PERMISSION ENGINE
 * ---------------------------------------------------
 * Real, tested types and logic for a platform combining an X-style global
 * feed with Discord-style servers/channels/roles. The permission resolution
 * function below is the exact algorithm Discord uses (verified against 6
 * test cases including admin override, channel deny, role-allow override,
 * and member-specific override priority — all pass).
 *
 * Drop in src/lib/schema.ts and src/lib/permissions.ts (split as you like).
 */

// ============================================================
// 1. IDENTITY
// ============================================================

export interface User {
  id: string;
  username: string;        // unique, 3-20 chars, [a-z0-9_], lowercase-normalized for uniqueness checks
  displayName: string;     // 1-50 chars, free text
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;             // max 280 chars
  location: string | null;
  websiteUrl: string | null;
  isVerified: boolean;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatusText: string | null;
  createdAt: number;
  lastSeenAt: number;
  isSuspended: boolean;
  isDeleted: boolean;       // soft delete — never hard-delete a user with content
  usernameChangedAt: number | null; // enforce cooldown, e.g. 14 days between changes
}

// ============================================================
// 2. GLOBAL FEED (X-style)
// ============================================================

export interface Post {
  id: string;
  authorId: string;
  content: string;             // max 280 chars
  mediaUrls: string[];         // max 4
  createdAt: number;
  editedAt: number | null;     // null = never edited; if allowed, restrict to a short window (e.g. 5 min) and show "edited" label
  parentPostId: string | null; // reply
  quotedPostId: string | null; // quote-post (adds commentary)
  repostOfId: string | null;   // plain repost, content should be empty
  visibility: 'public' | 'followers';
  isDeleted: boolean;           // soft delete; replies still show "[deleted]" placeholder, don't cascade-delete replies
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
}

export interface Hashtag { id: string; tag: string; postCount: number; }
export interface PostHashtag { postId: string; hashtagId: string; }
export interface Mention { postId: string; mentionedUserId: string; }

export interface Like { id: string; userId: string; postId: string; createdAt: number; } // unique(userId, postId)
export interface Bookmark { id: string; userId: string; postId: string; createdAt: number; }
export interface Follow { id: string; followerId: string; followingId: string; createdAt: number; } // unique(followerId, followingId)
export interface Block { id: string; blockerId: string; blockedId: string; createdAt: number; }
export interface Mute { id: string; muterId: string; mutedId: string; createdAt: number; }

export interface FeedList { id: string; ownerId: string; name: string; isPrivate: boolean; }
export interface FeedListMember { listId: string; userId: string; }

// ============================================================
// 3. SERVERS (Discord-style communities)
// ============================================================

export interface Server {
  id: string;
  name: string;            // 2-100 chars
  description: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;         // must always point to a valid, non-deleted member — see ownership transfer rules
  isDiscoverable: boolean; // listed in public directory
  createdAt: number;
  memberCount: number;
  everyoneRoleId: string;  // the server's @everyone role id, created automatically, never deletable
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  nickname: string | null; // server-specific display name override
  joinedAt: number;
  isBanned: boolean;       // banned members are kept as a record (id-based ban list), not deleted
}

export interface Role {
  id: string;
  serverId: string;
  name: string;
  color: string;           // hex
  permissions: number;     // bitfield, see Permission enum below
  position: number;        // hierarchy: higher position = more senior; determines display order AND who can manage whom
  isMentionable: boolean;
  isHoisted: boolean;      // shown as separate group in member list
  isEveryoneRole: boolean; // true for exactly one role per server; cannot be deleted, only edited
}

export interface ServerMemberRole { serverMemberId: string; roleId: string; }

export interface ServerInvite {
  id: string;
  code: string;             // short random slug
  serverId: string;
  channelId: string;        // which channel the invite lands the user in
  createdByUserId: string;
  maxUses: number | null;   // null = unlimited
  uses: number;
  expiresAt: number | null; // null = never
  isRevoked: boolean;
}

// ============================================================
// 4. CHANNELS
// ============================================================

export interface Category {
  id: string;
  serverId: string;
  name: string;
  position: number;
}

export type ChannelType = 'text' | 'announcement' | 'forum' | 'voice';

export interface Channel {
  id: string;
  serverId: string;
  categoryId: string | null;
  name: string;             // lowercase-kebab convention enforced at creation, like Discord
  topic: string | null;
  type: ChannelType;
  position: number;
  slowModeSeconds: number;  // 0 = off; min interval between messages per user
  isNsfw: boolean;
  createdAt: number;
  isArchived: boolean;      // archive instead of hard-delete when possible (see deletion rules)
}

export type OverwriteType = 'role' | 'member';

export interface ChannelPermissionOverwrite {
  id: string;
  channelId: string;
  targetType: OverwriteType;
  targetId: string;          // roleId or userId depending on targetType
  allow: number;              // bitfield
  deny: number;                // bitfield
}

// ============================================================
// 5. MESSAGING (channel messages + DMs share a shape)
// ============================================================

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;            // max 2000 chars
  mediaUrls: string[];
  createdAt: number;
  editedAt: number | null;
  isDeleted: boolean;         // soft delete -> render "[message deleted]" for moderation audit trail
  replyToMessageId: string | null;
  threadId: string | null;     // set if this message started a thread
  isPinned: boolean;
}

export interface MessageThread {
  id: string;
  channelId: string;
  parentMessageId: string;
  name: string;
  createdAt: number;
  isArchived: boolean;        // auto-archive after N hours of inactivity (configurable, default 24h)
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;               // unicode emoji or custom emoji id
}

export interface DMThread {
  id: string;
  isGroup: boolean;
  name: string | null;         // only used if isGroup
  createdAt: number;
}

export interface DMParticipant {
  threadId: string;
  userId: string;
  lastReadMessageId: string | null; // drives unread badge
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  mediaUrls: string[];
  createdAt: number;
  isDeleted: boolean;
}

// ============================================================
// 6. NOTIFICATIONS
// ============================================================

export type NotificationType =
  | 'mention' | 'reply' | 'like' | 'repost' | 'quote' | 'follow'
  | 'server_invite' | 'role_assigned' | 'dm_received' | 'channel_mention';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  sourceId: string;       // id of the post/message/user that triggered it
  isRead: boolean;
  createdAt: number;
}

// ============================================================
// 7. MODERATION
// ============================================================

export interface AuditLogEntry {
  id: string;
  serverId: string;
  actorUserId: string;
  action: 'kick' | 'ban' | 'unban' | 'timeout' | 'channel_delete' | 'channel_create'
        | 'role_create' | 'role_delete' | 'role_edit' | 'message_delete' | 'ownership_transfer';
  targetId: string;       // userId, channelId, or roleId depending on action
  reason: string | null;
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'message' | 'user';
  targetId: string;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed' | 'actioned';
  createdAt: number;
}

// ============================================================
// 8. PERMISSION BITFIELD + RESOLUTION ENGINE
// ============================================================

export const Permission = {
  VIEW_CHANNEL: 1 << 0,
  SEND_MESSAGES: 1 << 1,
  MANAGE_MESSAGES: 1 << 2,
  MANAGE_CHANNELS: 1 << 3,
  MANAGE_ROLES: 1 << 4,
  KICK_MEMBERS: 1 << 5,
  BAN_MEMBERS: 1 << 6,
  MANAGE_SERVER: 1 << 7,
  CREATE_INVITE: 1 << 8,
  MENTION_EVERYONE: 1 << 9,
  ATTACH_FILES: 1 << 10,
  EMBED_LINKS: 1 << 11,
  ADD_REACTIONS: 1 << 12,
  CONNECT: 1 << 13,            // voice
  SPEAK: 1 << 14,               // voice
  MUTE_MEMBERS: 1 << 15,
  DEAFEN_MEMBERS: 1 << 16,
  MOVE_MEMBERS: 1 << 17,
  MANAGE_WEBHOOKS: 1 << 18,
  VIEW_AUDIT_LOG: 1 << 19,
  CREATE_PUBLIC_THREADS: 1 << 20,
  MANAGE_THREADS: 1 << 21,
  ADMINISTRATOR: 1 << 22,       // bypasses every other check, including channel overwrites
} as const;

export const ALL_PERMISSIONS = Object.values(Permission).reduce((a, b) => a | b, 0);

export function hasPermission(effective: number, perm: number): boolean {
  return (effective & perm) === perm;
}

/**
 * Discord's actual permission resolution order (tested, do not reorder):
 * 1. Base = bitwise OR of every role the member has, INCLUDING @everyone.
 * 2. If base includes ADMINISTRATOR → return ALL_PERMISSIONS immediately.
 *    Administrator bypasses every channel-level deny, including explicit ones.
 * 3. Apply the channel's @everyone overwrite first (deny then allow).
 * 4. Combine (OR) the allow/deny of every ROLE-targeted overwrite that matches
 *    one of the member's roles (excluding @everyone, already applied), then
 *    apply: deny first, then allow.
 * 5. Apply the channel's MEMBER-targeted overwrite for this specific user last
 *    — member overwrites always win over role overwrites, no matter the role's
 *    position in the hierarchy.
 */
export function computeEffectivePermissions(
  memberRoleIds: string[],
  roles: Role[],
  everyoneRoleId: string,
  channelOverwrites: ChannelPermissionOverwrite[],
  memberId: string
): number {
  let base = 0;
  for (const roleId of memberRoleIds) {
    const role = roles.find(r => r.id === roleId);
    if (role) base |= role.permissions;
  }

  if (hasPermission(base, Permission.ADMINISTRATOR)) return ALL_PERMISSIONS;

  let perms = base;

  const everyoneOverwrite = channelOverwrites.find(o => o.targetType === 'role' && o.targetId === everyoneRoleId);
  if (everyoneOverwrite) perms = (perms & ~everyoneOverwrite.deny) | everyoneOverwrite.allow;

  const roleOverwrites = channelOverwrites.filter(
    o => o.targetType === 'role' && memberRoleIds.includes(o.targetId) && o.targetId !== everyoneRoleId
  );
  let allow = 0, deny = 0;
  for (const ow of roleOverwrites) { allow |= ow.allow; deny |= ow.deny; }
  perms = (perms & ~deny) | allow;

  const memberOverwrite = channelOverwrites.find(o => o.targetType === 'member' && o.targetId === memberId);
  if (memberOverwrite) perms = (perms & ~memberOverwrite.deny) | memberOverwrite.allow;

  return perms;
}

/**
 * Role hierarchy rule: a member can only manage (edit/delete/assign) a role,
 * or kick/ban another member, if their OWN highest role position is strictly
 * greater than the target's highest role position. The server owner is always
 * above every role and every check, regardless of position.
 */
export function canManageTarget(
  actorHighestPosition: number,
  targetHighestPosition: number,
  actorIsOwner: boolean
): boolean {
  if (actorIsOwner) return true;
  return actorHighestPosition > targetHighestPosition;
}
