import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const files = [
  "config/media-profiles.yaml",
  "config/mode-manifests.yaml",
  "config/cost-tiers.yaml",
  "schemas/config/media-profiles.schema.v1.json",
  "schemas/config/mode-manifests.schema.v1.json",
  "schemas/config/cost-tiers.schema.v1.json"
];

for (const rel of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`[validate:config] missing file: ${rel}`);
    process.exit(1);
  }
}
const media = fs.readFileSync(path.join(root, "config/media-profiles.yaml"), "utf8");
const modes = fs.readFileSync(path.join(root, "config/mode-manifests.yaml"), "utf8");
const cost = fs.readFileSync(path.join(root, "config/cost-tiers.yaml"), "utf8");
const mediaSchema = JSON.parse(fs.readFileSync(path.join(root, "schemas/config/media-profiles.schema.v1.json"), "utf8"));
const modeSchema = JSON.parse(fs.readFileSync(path.join(root, "schemas/config/mode-manifests.schema.v1.json"), "utf8"));
const costSchema = JSON.parse(fs.readFileSync(path.join(root, "schemas/config/cost-tiers.schema.v1.json"), "utf8"));

if (!mediaSchema?.properties?.profiles?.required?.includes("thumb_low")) {
  console.error("[validate:config] media-profiles schema must require thumb_low");
  process.exit(1);
}
if (!modeSchema?.properties?.modes?.required?.includes("party")) {
  console.error("[validate:config] mode-manifests schema must require party");
  process.exit(1);
}
if (!costSchema?.properties?.tiers?.required?.includes("COST_LOW")) {
  console.error("[validate:config] cost-tiers schema must require COST_LOW");
  process.exit(1);
}

function findLine(lines, pattern) {
  return lines.findIndex((l) => l.includes(pattern));
}

const mediaLines = media.split("\n");
const thumbIdx = findLine(mediaLines, "thumb_low:");
const callRandomIdx = findLine(mediaLines, "call_random_fast:");
if (thumbIdx < 0) {
  console.error("[validate:config] thumb_low profile missing");
  process.exit(1);
}
if (callRandomIdx < 0) {
  console.error("[validate:config] call_random_fast profile missing");
  process.exit(1);
}
const thumbSegment = mediaLines.slice(thumbIdx, callRandomIdx > thumbIdx ? callRandomIdx : thumbIdx + 20).join("\n");
if (!thumbSegment.includes("audio:") || !thumbSegment.includes("enabled: false")) {
  console.error("[validate:config] thumb_low must define audio.enabled=false");
  process.exit(1);
}

const modeLines = modes.split("\n");
const broadcastIdx = findLine(modeLines, "broadcast:");
const partyIdx = findLine(modeLines, "party:");
const randomIdx = findLine(modeLines, "random:");
if (broadcastIdx < 0 || partyIdx < 0 || randomIdx < 0) {
  console.error("[validate:config] broadcast/party/random mode definitions are required");
  process.exit(1);
}
const broadcastSegment = modeLines.slice(broadcastIdx, partyIdx).join("\n");
if (!broadcastSegment.includes("route: /") || !broadcastSegment.includes("required_capabilities")) {
  console.error("[validate:config] broadcast mode must define route and required_capabilities");
  process.exit(1);
}
const partySegment = modeLines.slice(partyIdx, randomIdx).join("\n");
if (!partySegment.includes("route: /party") || !partySegment.includes("required_capabilities")) {
  console.error("[validate:config] party mode must define route and required_capabilities");
  process.exit(1);
}

const costLines = cost.split("\n");
const lowIdx = findLine(costLines, "COST_LOW:");
const quarantineIdx = findLine(costLines, "QUARANTINE:");
if (lowIdx < 0 || quarantineIdx < 0) {
  console.error("[validate:config] COST_LOW and QUARANTINE tiers are required");
  process.exit(1);
}
const lowSegment = costLines.slice(lowIdx, quarantineIdx).join("\n");
if (!lowSegment.includes("min_time_before_skip_ms: 2000")) {
  console.error("[validate:config] COST_LOW.random.min_time_before_skip_ms must be 2000");
  process.exit(1);
}
const quarantineSegment = costLines.slice(quarantineIdx).join("\n");
if (!quarantineSegment.includes("min_time_before_skip_ms: 2000")) {
  console.error("[validate:config] QUARANTINE.random.min_time_before_skip_ms must be 2000");
  process.exit(1);
}

console.log("[validate:config] OK");
