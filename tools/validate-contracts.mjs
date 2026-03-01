import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const openApiPath = path.join(root, "schemas/openapi/session.v1.json");
const eventsPath = path.join(root, "schemas/events/events.v1.json");

const openApiRaw = fs.readFileSync(openApiPath, "utf8");
const eventsRaw = fs.readFileSync(eventsPath, "utf8");

let openApi;
let events;

try {
  openApi = JSON.parse(openApiRaw);
} catch (e) {
  console.error("[validate:contracts] invalid JSON in openapi schema");
  process.exit(1);
}

try {
  events = JSON.parse(eventsRaw);
} catch (e) {
  console.error("[validate:contracts] invalid JSON in events schema");
  process.exit(1);
}

if (openApi.openapi !== "3.0.3") {
  console.error("[validate:contracts] openapi version must be 3.0.3");
  process.exit(1);
}

const requiredPaths = ["/sessions", "/sessions/transition"];
for (const p of requiredPaths) {
  if (!openApi.paths || !openApi.paths[p]) {
    console.error(`[validate:contracts] required path missing: ${p}`);
    process.exit(1);
  }
}

const requiredEvents = [
  "presence.update",
  "session.created",
  "match.found",
  "chat.message",
  "consent.request",
  "consent.response"
];

const enumEvents = events?.properties?.type?.enum || [];
for (const ev of requiredEvents) {
  if (!enumEvents.includes(ev)) {
    console.error(`[validate:contracts] required event missing: ${ev}`);
    process.exit(1);
  }
}

console.log("[validate:contracts] OK");
