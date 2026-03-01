import fs from "node:fs";
import path from "node:path";
import {
  parseBearerToken,
  decodeAuthToken,
  buildAuthContext,
  assertFlagAccess
} from "../services/auth/auth-middleware.mjs";

const root = path.resolve(process.cwd());

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function encode(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function run() {
  const validPayload = {
    user_id: "u_123",
    session_id: "s_123",
    flags: {
      is_new_account: true,
      is_quarantined: false,
      is_banned: false
    }
  };
  const token = encode(validPayload);
  const header = `Bearer ${token}`;

  assert(parseBearerToken(header) === token, "bearer token parse failed");
  const decoded = decodeAuthToken(token);
  assert(decoded?.user_id === "u_123", "decode user_id failed");
  assert(decoded?.session_id === "s_123", "decode session_id failed");
  assert(decoded?.flags?.is_new_account === true, "decode flags failed");

  const ctxResult = buildAuthContext(header);
  assert(ctxResult.ok === true, "buildAuthContext should succeed");
  assert(assertFlagAccess(ctxResult.context, "presence").allowed === true, "presence should be allowed");
  assert(assertFlagAccess(ctxResult.context, "chat").allowed === true, "chat should be allowed");
  assert(assertFlagAccess(ctxResult.context, "random_match").allowed === true, "random should be allowed");

  const quarantinedPayload = {
    ...validPayload,
    flags: { ...validPayload.flags, is_quarantined: true }
  };
  const qCtx = buildAuthContext(`Bearer ${encode(quarantinedPayload)}`);
  assert(qCtx.ok === true, "quarantine context should decode");
  const qRandom = assertFlagAccess(qCtx.context, "random_match");
  assert(qRandom.allowed === false && qRandom.reason === "quarantined_random_restricted", "quarantine random restriction failed");

  const bannedPayload = {
    ...validPayload,
    flags: { ...validPayload.flags, is_banned: true }
  };
  const bCtx = buildAuthContext(`Bearer ${encode(bannedPayload)}`);
  assert(bCtx.ok === true, "banned context should decode");
  const bPresence = assertFlagAccess(bCtx.context, "presence");
  assert(bPresence.allowed === false && bPresence.reason === "banned", "banned restriction failed");

  const invalid = buildAuthContext("Bearer not-valid-base64");
  assert(invalid.ok === false, "invalid token should fail");

  const report = {
    generatedAt: new Date().toISOString(),
    decision: "GO",
    requiredContextFields: ["user_id", "session_id", "flags.is_new_account", "flags.is_quarantined", "flags.is_banned"],
    checks: [
      "bearer_parse",
      "token_decode",
      "context_build",
      "presence_guard",
      "chat_guard",
      "random_guard",
      "quarantine_random_restriction",
      "banned_restriction",
      "invalid_token_rejected"
    ]
  };
  const outPath = path.join(root, "reports/phase0-auth-baseline.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log("[test:auth-baseline] OK -> reports/phase0-auth-baseline.json");
}

try {
  run();
} catch (err) {
  console.error(`[test:auth-baseline] FAIL: ${err.message}`);
  process.exit(1);
}
