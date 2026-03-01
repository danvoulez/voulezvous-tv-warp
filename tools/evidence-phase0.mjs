import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(process.cwd());
const reportsDir = path.join(root, "reports");
const generatedTypesPath = path.join(root, "packages/sdk/generated/types.ts");
const openApiPath = path.join(root, "schemas/openapi/session.v1.json");
const eventsPath = path.join(root, "schemas/events/events.v1.json");
const mediaConfigPath = path.join(root, "config/media-profiles.yaml");
const modeConfigPath = path.join(root, "config/mode-manifests.yaml");
const costConfigPath = path.join(root, "config/cost-tiers.yaml");

fs.mkdirSync(reportsDir, { recursive: true });

const checks = [
  { name: "config_files_present", pass: fs.existsSync(mediaConfigPath) && fs.existsSync(modeConfigPath) && fs.existsSync(costConfigPath) },
  { name: "contracts_present", pass: fs.existsSync(openApiPath) && fs.existsSync(eventsPath) },
  { name: "contracts_baseline_present", pass: fs.existsSync(path.join(root, "contracts/openapi/session.v1.baseline.json")) && fs.existsSync(path.join(root, "contracts/events/events.v1.baseline.json")) },
  { name: "types_generated", pass: fs.existsSync(generatedTypesPath) },
  { name: "invariants_test_fixture_present", pass: fs.existsSync(path.join(root, "tests/fixtures/negative/media-profiles.invalid.yaml")) && fs.existsSync(path.join(root, "tests/fixtures/negative/events.invalid.v1.json")) },
  { name: "thumb_audio_disabled_rule_present", pass: fs.readFileSync(mediaConfigPath, "utf8").includes("enabled: false") },
  { name: "party_route_present", pass: fs.readFileSync(modeConfigPath, "utf8").includes("route: /party") },
  { name: "random_skip_min_time_present", pass: fs.readFileSync(costConfigPath, "utf8").includes("min_time_before_skip_ms: 2000") }
];

const failed = checks.filter((c) => !c.pass).map((c) => c.name);
const artifactPaths = [
  "config/media-profiles.yaml",
  "config/mode-manifests.yaml",
  "config/cost-tiers.yaml",
  "schemas/config/media-profiles.schema.v1.json",
  "schemas/config/mode-manifests.schema.v1.json",
  "schemas/config/cost-tiers.schema.v1.json",
  "schemas/openapi/session.v1.json",
  "schemas/events/events.v1.json",
  "contracts/openapi/session.v1.baseline.json",
  "contracts/events/events.v1.baseline.json",
  "packages/sdk/generated/types.ts"
];
const artifactHashes = artifactPaths.map((rel) => {
  const full = path.join(root, rel);
  const bytes = fs.readFileSync(full);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  return { path: rel, sha256 };
});
const evidence = {
  phase: "0",
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? "pass" : "fail",
  summary: {
    totalChecks: checks.length,
    passedChecks: checks.length - failed.length,
    failedChecks: failed.length
  },
  checks,
  failedChecks: failed,
  artifacts: artifactPaths,
  artifactHashes,
  commands: [
    "npm run validate:config",
    "npm run validate:contracts",
    "npm run check:contracts-drift",
    "npm run test:invariants",
    "npm run generate:types",
    "npm run check:boundaries"
  ]
};

const outputPath = path.join(reportsDir, "phase0-evidence.json");
fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2), "utf8");
console.log(`[evidence:phase0] ${evidence.status.toUpperCase()} -> reports/phase0-evidence.json`);

const txtLines = [
  "VVTV Phase 0 Evidence Report",
  `Generated: ${evidence.generatedAt}`,
  `Status: ${evidence.status.toUpperCase()}`,
  `Checks: ${evidence.summary.passedChecks}/${evidence.summary.totalChecks} passed`,
  "",
  "Checks:",
  ...evidence.checks.map((c) => `- ${c.name}: ${c.pass ? "PASS" : "FAIL"}`),
  "",
  "Artifacts (sha256):",
  ...evidence.artifactHashes.map((a) => `- ${a.path}: ${a.sha256}`)
];
const txtOutPath = path.join(reportsDir, "phase0-evidence.txt");
fs.writeFileSync(txtOutPath, txtLines.join("\n"), "utf8");
console.log("[evidence:phase0] WROTE -> reports/phase0-evidence.txt");

if (failed.length > 0) {
  process.exit(1);
}
