export type UserFlags = {
  is_new_account: boolean;
  is_quarantined: boolean;
  is_banned: boolean;
};

export type AuthContext = {
  user_id: string;
  session_id: string;
  flags: UserFlags;
};

export function canAccessPresence(ctx: AuthContext): boolean {
  return !ctx.flags.is_banned;
}

export function canAccessChat(ctx: AuthContext): boolean {
  return !ctx.flags.is_banned;
}

export function canAccessRandom(ctx: AuthContext): boolean {
  if (ctx.flags.is_banned) return false;
  if (ctx.flags.is_quarantined) return false;
  return true;
}
