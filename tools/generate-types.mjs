import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const openApiPath = path.join(root, "schemas/openapi/session.v1.json");
const eventsPath = path.join(root, "schemas/events/events.v1.json");
const outPath = path.join(root, "packages/sdk/generated/types.ts");

if (!fs.existsSync(openApiPath) || !fs.existsSync(eventsPath)) {
  console.error("[generate:types] schema files missing");
  process.exit(1);
}

const banner = `// AUTO-GENERATED FILE - DO NOT EDIT\n`;
const content = `${banner}
export type SessionMode =
  | "broadcast"
  | "party"
  | "sniffers"
  | "random"
  | "private_call"
  | "meeting"
  | "live_public"
  | "mirror";

export type SessionState = "creating" | "active" | "ending" | "ended" | "failed";

export type EventType =
  | "presence.update"
  | "session.created"
  | "match.found"
  | "chat.message"
  | "consent.request"
  | "consent.response";

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
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, "utf8");
console.log("[generate:types] OK -> packages/sdk/generated/types.ts");
