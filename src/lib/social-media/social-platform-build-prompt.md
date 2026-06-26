# PROMPT — Build "Confluence": Unified Feed + Server Platform (X feed + Discord servers)

Send this to your AI coding tool along with `social-platform-schema.ts` (paste its
actual content in, don't make the AI retype it from a description). This spec
covers two pillars sharing one identity system: a global public **Feed** (X-style)
and **Servers** containing **Channels** (Discord-style), with full roles,
permissions, moderation, and real-time messaging. It is long on purpose — every
section exists because leaving it out is exactly where a build like this falls
apart silently.

---

## ARCHITECTURE OVERVIEW

- One identity (`User`) powers both pillars — same login, same avatar, same handle
  everywhere.
- **Feed pillar**: posts, replies, reposts, quote-posts, likes, follows, bookmarks,
  hashtags, a Following feed and a ranked For-You feed.
- **Server pillar**: servers (communities) → categories → channels, with a full
  role/permission system, invites, threads, reactions, and moderation tools.
- **Real-time layer**: a single WebSocket connection per logged-in user, fanning
  out to typed event channels (catalog in Section 9). Nothing in this spec should
  require polling.
- **Permission checks happen server-side, always** — the client may hide a button
  it thinks the user can't use, but the server re-validates every single
  channel-affecting action against `computeEffectivePermissions()` from the schema
  file. Never trust a client-side permission check alone.
- **Soft delete is the default for anything with replies/audit value** (posts,
  messages). Hard delete is reserved for things with no downstream references
  (e.g. a reaction, a draft).

---

## MODULE A — IDENTITY & AUTH

- Username: 3–20 chars, lowercase letters/numbers/underscore, globally unique
  (case-insensitive). Enforce a cooldown on username changes (e.g. 14 days) —
  store `usernameChangedAt` and check it server-side before allowing another change.
- Display name: free text, 1–50 chars, can change anytime, no uniqueness constraint.
- Auth: email+password (hashed, never store plaintext — bcrypt/argon2) plus session
  tokens (JWT or server session, your choice) — but specify **refresh token
  rotation** so a stolen token can't be replayed indefinitely.
- Account deletion is a soft delete (`isDeleted: true`) — never hard-delete a user
  who has posts/messages, or every thread they participated in breaks. Show
  "[deleted user]" as the author wherever their content still renders.
- Suspension (`isSuspended`) blocks login and all write actions but the account
  and its content remain visible, distinct from deletion.

## MODULE B — PROFILE

- Profile page shows: avatar, banner, display name, @username, bio (280 chars),
  location, website, join date, follower/following counts, verified badge if
  `isVerified`, and a tab set: Posts / Replies / Media / Likes.
- Editing your own profile is allowed anytime except the username cooldown above.
- Viewing someone who has blocked you: profile renders but post content is hidden
  with an explicit "You're blocked" state — don't silently 404, that leaks no
  information but is a worse UX than telling the truth.

## MODULE C — GLOBAL FEED (posts)

- Post: max 280 chars, up to 4 media attachments, optional `parentPostId` (reply),
  `quotedPostId` (quote-post — content + an embedded preview of the quoted post),
  or `repostOfId` (plain repost — no content of its own).
- **Edit window**: either disallow edits entirely (X's original model) or allow
  edits only within a short window (e.g. 5 minutes) and always show an "edited"
  label with timestamp if used. Pick one and be consistent — silent edits destroy
  trust in a feed product.
- Deleting a post is a soft delete. Replies to a deleted post remain visible with
  the parent rendered as "This post was deleted."
- Liking, reposting, bookmarking: each is its own table with a unique constraint
  on (userId, postId) — a user can only like a given post once; toggling
  like/unlike must be idempotent (calling "like" twice should not double-count).
- **Following feed**: strictly reverse-chronological, only posts from accounts you
  follow (plus your own).
- **For-You feed**: ranked, not chronological. Define the ranking explicitly so
  it's not a black box even internally:
  `rankScore = w1*recency_decay + w2*log(1+likes) + w3*log(1+reposts) + w4*log(1+replies) + w5*affinity_score`
  where `recency_decay = e^(-hours_since_post / halfLife)` (halfLife ~ 6–12h) and
  `affinity_score` reflects how often the viewer has engaged with this author
  before. Document the weights as configuration, not magic numbers buried in code.
- Hashtags: extract `#tag` patterns at post-creation time, normalize to lowercase,
  upsert into the `Hashtag` table, increment `postCount`. Mentions (`@username`)
  resolve to a `Mention` row and trigger a notification — silently drop mentions
  of usernames that don't exist rather than erroring the whole post.

## MODULE D — DIRECT MESSAGES

- DM threads support both 1:1 and group (`isGroup: true`, with a `name`).
- Read receipts: track `lastReadMessageId` per participant, not a boolean — this
  is what correctly drives the unread-count badge across multiple devices/sessions.
- Blocking a user hides their DMs from your inbox but does not delete the thread
  server-side (so unblocking restores history).
- Leaving a group DM: the thread persists for remaining participants; the leaver's
  participant row is marked left, not deleted, so old messages still render their
  correct author.

## MODULE E — SERVERS (create / delete / join / discover)

- **Create**: any user can create a server. Creation auto-generates: the
  `@everyone` role (`isEveryoneRole: true`, sensible default permissions —
  VIEW_CHANNEL + SEND_MESSAGES + ADD_REACTIONS, nothing destructive), one default
  text channel (`#general`), and a `ServerMember` row for the creator with
  `ownerId` set to them.
- **The `@everyone` role can never be deleted** — only its permission bitfield can
  be edited. Enforce this in the API layer, not just the UI (hide-the-button is
  not enough).
- **Delete**: only the owner can delete a server. Deleting a server cascades:
  all channels, messages, roles, invites are removed. This is destructive and
  irreversible — require a confirmation step that makes the user type the server
  name (same UX pattern as GitHub repo deletion) before the API call fires.
- **Join**: via invite code (`ServerInvite`) or, if `isDiscoverable: true`, via a
  public directory listing. Joining creates a `ServerMember` row and assigns the
  `@everyone` role automatically.
- **Leave**: any member can leave except the owner. **The owner must transfer
  ownership before they're allowed to leave** — block the leave action with a
  clear error if `userId === server.ownerId`, don't silently leave the server
  ownerless.
- **Ownership transfer**: owner selects another member; this updates
  `server.ownerId` and writes an `AuditLogEntry` with action `ownership_transfer`.
  The new owner does not need the highest role position — ownership is a separate
  field from the role hierarchy and always outranks every role check (see
  `canManageTarget` in the schema file).
- **Banning vs kicking**: kick removes the `ServerMember` row but allows the user
  to rejoin via a new invite. Ban sets `isBanned: true` and keeps the row (so they
  cannot rejoin via any invite to that server until unbanned) — check `isBanned`
  at the join step, not just at message-send time.

## MODULE F — CATEGORIES & CHANNELS (create / delete / reorder)

- A server has zero or more `Category` rows; channels can belong to a category or
  sit uncategorized. Position is an integer used for ordering — when reordering,
  recompute positions for the full affected list, don't leave gaps that cause
  ties (ties make drag-and-drop reordering nondeterministic).
- **Create channel**: requires `MANAGE_CHANNELS`. Channel name is auto-lowercased
  and spaces converted to hyphens (Discord convention) — this is a UX nicety,
  not a hard technical requirement, but include it; it's the kind of detail users
  notice when it's missing.
- **Delete channel**: requires `MANAGE_CHANNELS`. Prefer **archive over hard
  delete** when the channel has message history — archived channels are hidden
  from the default channel list but messages remain queryable for moderation/audit.
  If the product explicitly wants hard delete, require a confirmation step and
  cascade-delete messages, threads, and pins in that channel only (never touch
  other channels).
- **Channel types**: `text`, `announcement` (only roles with `SEND_MESSAGES`
  explicitly overridden can post; default `@everyone` should deny send in this
  type at creation time), `forum` (top-level posts each start their own thread,
  no flat message list), `voice` (see Module J — flag clearly that this needs
  external infrastructure, don't attempt to build it from scratch).
- **Slow mode**: `slowModeSeconds` on the channel; enforce server-side by
  rejecting a message if `now - lastMessageTimeForThisUserInChannel < slowModeSeconds`
  — members with `MANAGE_MESSAGES` should bypass slow mode.
- **Permission overwrites**: created/edited via `ChannelPermissionOverwrite` rows,
  resolved through `computeEffectivePermissions()` from the schema file exactly as
  written — do not reimplement this logic differently per-channel-type.

## MODULE G — ROLES & PERMISSIONS

- **Create role**: requires `MANAGE_ROLES`. New roles default to position 0
  (lowest, just above `@everyone`) and zero extra permissions — never default a
  new role to anything dangerous.
- **Delete role**: requires `MANAGE_ROLES`. Deleting a role that's currently
  assigned to members must not error — just remove the `ServerMemberRole` rows
  for that role; affected members silently fall back to whatever permissions
  their remaining roles (and `@everyone`) grant.
- **Assign/remove role from a member**: requires `MANAGE_ROLES`, AND the actor's
  highest role position must be strictly above the role being assigned (you
  cannot grant a role more senior than your own) — enforce via
  `canManageTarget()`.
- **Hierarchy enforcement for kick/ban/timeout**: same `canManageTarget()` check
  — a moderator cannot kick/ban/timeout someone whose highest role outranks
  theirs, even if they technically have `KICK_MEMBERS`. The owner is always exempt
  from being targeted by anyone.
- Reorder role positions the same way as channel reordering — recompute the full
  list, no ties.

## MODULE H — MESSAGING IN CHANNELS

- Send: requires `SEND_MESSAGES` (checked via the resolved channel permission,
  not just server-level). Max 2000 chars, up to 10 media attachments (separate
  limit from posts — channels are a different surface).
- Edit: only the author, anytime, no time window restriction (unlike the feed) —
  but always show "(edited)". Delete: author OR anyone with `MANAGE_MESSAGES`;
  write an `AuditLogEntry` when a moderator deletes someone else's message
  (not when users delete their own).
- **Threads**: starting a thread from a message creates a `MessageThread` row and
  links it via `message.threadId`. Auto-archive a thread after a configurable
  inactivity window (default 24h) — archived threads are read-only but still
  visible in history, not deleted.
- **Pins**: cap at 50 pinned messages per channel (matches real-world Discord
  limits for a reason — unbounded pin lists become useless). Reject pin attempts
  past the cap with a clear error, don't silently fail.
- **Reactions**: any user with `ADD_REACTIONS` can react; store one row per
  (messageId, userId, emoji) — a user can react to the same message with
  multiple different emoji but not the same emoji twice (toggle on second click).
- **Mentions**: `@username` (notifies one user), `@role` (notifies everyone with
  that role, only if `role.isMentionable`), `@everyone`/`@here` (require
  `MENTION_EVERYONE` permission to use at all — this is one of the most abused
  permissions in real Discord servers, gate it explicitly).

## MODULE I — INVITES

- Invite codes are short random slugs, not sequential IDs (don't let invites be
  enumerable).
- `maxUses` and `expiresAt` are both optional and independent — an invite can have
  one, both, or neither.
- Using an invite increments `uses`; reject (with a clear "this invite has
  expired/reached its limit" message, not a generic error) once `uses >= maxUses`
  or `now > expiresAt`.
- Revoking an invite sets `isRevoked: true` — keep the row for audit history
  instead of deleting it.
- Creating an invite requires `CREATE_INVITE` on the target channel.

## MODULE J — VOICE CHANNELS (be honest about scope)

Real-time audio/video is a fundamentally different engineering problem from
everything else in this spec (it needs an SFU — selective forwarding unit — for
anything beyond a 1:1 call, plus STUN/TURN servers for NAT traversal). **Do not
attempt to hand-roll a custom WebRTC SFU.** Build the data model (`Channel` with
`type: 'voice'`, who's currently connected, mute/deafen state) and integrate a
managed provider (e.g. LiveKit, Agora, Daily.co, or self-hosted mediasoup if you
specifically want to self-host) for the actual media transport. Treat this as its
own phase, after everything else in this spec is working — don't let it block the
rest of the product.

## MODULE K — MODERATION

- Every kick/ban/unban/timeout/role change/channel delete writes an
  `AuditLogEntry`. Viewing the audit log requires `VIEW_AUDIT_LOG`.
- **Timeout**: a temporary, time-boxed mute — store an `timeoutUntil` timestamp on
  `ServerMember` (add this field if not already in the schema) rather than
  assigning/removing a "muted" role on a timer, which is fragile. Check
  `timeoutUntil > now` before allowing send.
- **Reports**: any user can report a post/message/user (`Report` table). Reports
  feed a moderation queue (`status: open`) — do not auto-action anything off a
  single report; that's how brigading takes down legitimate content.

## MODULE L — NOTIFICATIONS

- Generate a `Notification` row for: mentions, replies, likes, reposts, quotes,
  new followers, DMs, role assignments, channel mentions.
- Batch/group similar notifications in the UI (e.g. "Alice and 12 others liked
  your post") rather than one row per like flooding the notification list — this
  is a display concern, the underlying rows can stay one-per-event.
- Respect per-channel and per-server mute settings before pushing a notification
  — a muted channel should still log the message but must not notify.

## MODULE M — SEARCH

- Search must be permission-aware: searching messages inside a server only
  returns results from channels the searching user can currently `VIEW_CHANNEL`
  in — re-run the permission check at query time, not at index time, since
  permissions can change after a message was indexed.
- Separate search scopes: global post search, user search, server directory
  search (only servers with `isDiscoverable: true`), and in-server message search.

---

## SECTION 9 — WEBSOCKET EVENT CATALOG

One connection per session, server pushes typed events; client subscribes to
rooms it has access to (per-channel, per-server, per-DM-thread, and a personal
per-user room for notifications):

- `post:create`, `post:delete`, `post:like`, `post:repost`
- `message:create`, `message:update`, `message:delete`
- `typing:start`, `typing:stop` (channel-scoped and DM-scoped)
- `presence:update` (online/idle/dnd/offline)
- `reaction:add`, `reaction:remove`
- `channel:create`, `channel:update`, `channel:delete`
- `role:create`, `role:update`, `role:delete`
- `member:join`, `member:leave`, `member:kick`, `member:ban`
- `notification:new`

Every event payload should carry enough context (serverId/channelId/threadId) for
the client to route it without an extra fetch.

---

## SECTION 10 — BUILD ORDER (do not build out of order)

1. **Phase 1**: Module A (Auth) + Module B (Profile) + Module C (Feed, without
   ranking — chronological only at first).
2. **Phase 2**: Module E (Servers) + Module F (Channels) + Module G (Roles) with
   `computeEffectivePermissions()` wired in from day one — retrofitting permission
   checks after messaging already works is how security holes happen.
3. **Phase 3**: Module H (Channel messaging) + Module I (Invites) + real-time
   layer (Section 9).
4. **Phase 4**: Module D (DMs) + Module L (Notifications) + Module C's ranked
   For-You feed.
5. **Phase 5**: Module K (Moderation) + Module M (Search).
6. **Phase 6**: Module J (Voice) — last, and only after explicitly choosing a
   provider.

## SECTION 11 — VERIFICATION CHECKLIST (per phase, not at the end)

After each phase, before calling it done:
- [ ] Create two test users and confirm a permission-gated action correctly
      succeeds for one and is rejected for the other (e.g. a non-mod cannot
      delete someone else's channel message).
- [ ] Confirm soft-deleted content renders its placeholder, not a broken
      reference or a 500 error, anywhere it's still linked (replies to a deleted
      post, a thread on a deleted channel's archived history, etc).
- [ ] Confirm a real-time event (message send, reaction) appears on a second
      browser/session without a manual refresh.
- [ ] Re-run the Module G hierarchy checks: a lower-positioned role's member
      cannot kick/ban/assign-roles-to a higher-positioned member, even with the
      relevant base permission.
- [ ] Screenshot the actual result. Do not report a phase complete from the code
      alone — show the rendered, working behavior.
