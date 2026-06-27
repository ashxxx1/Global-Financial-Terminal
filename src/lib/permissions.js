/**
 * SOCIAL PLATFORM — CORE PERMISSION ENGINE
 */

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
  CONNECT: 1 << 13,
  SPEAK: 1 << 14,
  MUTE_MEMBERS: 1 << 15,
  DEAFEN_MEMBERS: 1 << 16,
  MOVE_MEMBERS: 1 << 17,
  MANAGE_WEBHOOKS: 1 << 18,
  VIEW_AUDIT_LOG: 1 << 19,
  CREATE_PUBLIC_THREADS: 1 << 20,
  MANAGE_THREADS: 1 << 21,
  ADMINISTRATOR: 1 << 22,
};

export const ALL_PERMISSIONS = Object.values(Permission).reduce((a, b) => a | b, 0);

export function hasPermission(effective, perm) {
  return (effective & perm) === perm;
}

export function computeEffectivePermissions(
  memberRoleIds,
  roles, // array of Role objects
  everyoneRoleId,
  channelOverwrites, // array of ChannelPermissionOverwrite objects
  memberId
) {
  let base = 0;
  for (const roleId of memberRoleIds) {
    const role = roles.find(r => r.id === roleId);
    if (role) base |= role.permissions;
  }

  if (hasPermission(base, Permission.ADMINISTRATOR)) return ALL_PERMISSIONS;

  let perms = base;

  // 1. apply @everyone overwrite
  const everyoneOverwrite = channelOverwrites.find(o => o.targetType === 'role' && o.targetId === everyoneRoleId);
  if (everyoneOverwrite) perms = (perms & ~everyoneOverwrite.deny) | everyoneOverwrite.allow;

  // 2. apply role overwrites
  const roleOverwrites = channelOverwrites.filter(
    o => o.targetType === 'role' && memberRoleIds.includes(o.targetId) && o.targetId !== everyoneRoleId
  );
  let allow = 0, deny = 0;
  for (const ow of roleOverwrites) { allow |= ow.allow; deny |= ow.deny; }
  perms = (perms & ~deny) | allow;

  // 3. apply member overwrite
  const memberOverwrite = channelOverwrites.find(o => o.targetType === 'member' && o.targetId === memberId);
  if (memberOverwrite) perms = (perms & ~memberOverwrite.deny) | memberOverwrite.allow;

  return perms;
}

export function canManageTarget(
  actorHighestPosition,
  targetHighestPosition,
  actorIsOwner
) {
  if (actorIsOwner) return true;
  return actorHighestPosition > targetHighestPosition;
}
