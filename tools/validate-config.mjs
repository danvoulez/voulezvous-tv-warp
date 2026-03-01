import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const files = [
  "config/media-profiles.yaml",
  "config/mode-manifests.yaml",
  "config/cost-tiers.yaml"
];

for (const rel of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`[validate:config] missing file: ${rel}`);
    process.exit(1);
  }
}

const media = fs.readFileSync(path.join(root, "config/media-profiles.yaml"), "utf8");
if (!media.includes("thumb_low")) {
  console.error("[validate:config] thumb_low profile missing");
  process.exit(1);
}
if (!media.includes("audio:\n      enabled: false")) {
  console.error("[validate:config] thumb_low must have audio disabled");
  process.exit(1);
}
if (!media.includes("call_random_fast")) {
  console.error("[validate:config] call_random_fast profile missing");
  process.exit(1);
}

const modes = fs.readFileSync(path.join(root, "config/mode-manifests.yaml"), "utf8");
if (!modes.includes("party") || !modes.includes("/party")) {
  console.error("[validate:config] party route definition missing");
  process.exit(1);
}
if (!modes.includes("broadcast") || !modes.includes("route: /")) {
  console.error("[validate:config] broadcast route definition missing");
  process.exit(1);
}
if (!modes.includes("required_capabilities")) {
  console.error("[validate:config] required_capabilities missing in mode manifest");
  process.exit(1);
}

const cost = fs.readFileSync(path.join(root, "config/cost-tiers.yaml"), "utf8");
if (!cost.includes("min_time_before_skip_ms: 2000")) {
  console.error("[validate:config] min_time_before_skip_ms must be present");
  process.exit(1);
}
if (!cost.includes("COST_LOW") || !cost.includes("QUARANTINE")) {
  console.error("[validate:config] COST_LOW and QUARANTINE tiers are required");
  process.exit(1);
}

console.log("[validate:config] OK");
