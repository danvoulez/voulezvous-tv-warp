export function parseBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== "string") return null;
  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function decodeAuthToken(token) {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    const required = ["user_id", "session_id", "flags"];
    for (const key of required) {
      if (!(key in parsed)) return null;
    }
    const flags = parsed.flags || {};
    return {
      user_id: String(parsed.user_id),
      session_id: String(parsed.session_id),
      flags: {
        is_new_account: Boolean(flags.is_new_account),
        is_quarantined: Boolean(flags.is_quarantined),
        is_banned: Boolean(flags.is_banned)
      }
    };
  } catch {
    return null;
  }
}

export function buildAuthContext(authHeader) {
  const token = parseBearerToken(authHeader);
  if (!token) return { ok: false, code: "missing_or_invalid_bearer" };
  const ctx = decodeAuthToken(token);
  if (!ctx) return { ok: false, code: "invalid_token_payload" };
  return { ok: true, context: ctx };
}

export function assertFlagAccess(authContext, capability) {
  const flags = authContext?.flags || {};
  if (flags.is_banned) return { allowed: false, reason: "banned" };
  if (flags.is_quarantined && capability === "random_match") {
    return { allowed: false, reason: "quarantined_random_restricted" };
  }
  return { allowed: true };
}
