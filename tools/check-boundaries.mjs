import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const mustExist = [
  "packages/schemas",
  "packages/domain",
  "packages/core",
  "packages/config",
  "packages/sdk",
  "packages/ui-kit",
  "apps/web",
  "services/session-orchestrator",
  "lab"
];

for (const rel of mustExist) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`[check:boundaries] missing directory: ${rel}`);
    process.exit(1);
  }
}

console.log("[check:boundaries] OK");
