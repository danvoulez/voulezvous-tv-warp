import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const requiredFiles = [
  "config/media-profiles.yaml",
  "config/mode-manifests.yaml",
  "config/cost-tiers.yaml",
  "schemas/openapi/session.v1.json",
  "schemas/events/events.v1.json",
  "policies/autonomy-policy.v1.json",
  "packages/sdk/generated/types.ts"
];

const missing = requiredFiles.filter((rel) => !fs.existsSync(path.join(root, rel)));
const ready = missing.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  decision: ready ? "GO" : "NO_GO",
  reason: ready ? "All required phase0 readiness artifacts are present." : "Missing required readiness artifacts.",
  requiredArtifacts: requiredFiles,
  missingArtifacts: missing
};

const outDir = path.join(root, "reports");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "phase0-readiness.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

if (!ready) {
  console.error("[check:release-readiness] NO_GO -> reports/phase0-readiness.json");
  process.exit(1);
}

console.log("[check:release-readiness] GO -> reports/phase0-readiness.json");
