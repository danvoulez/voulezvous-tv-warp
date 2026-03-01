import fs from "node:fs";
import path from "node:path";

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
  { name: "types_generated", pass: fs.existsSync(generatedTypesPath) },
  { name: "thumb_audio_disabled_rule_present", pass: fs.readFileSync(mediaConfigPath, "utf8").includes("enabled: false") },
  { name: "party_route_present", pass: fs.readFileSync(modeConfigPath, "utf8").includes("route: /party") },
  { name: "random_skip_min_time_present", pass: fs.readFileSync(costConfigPath, "utf8").includes("min_time_before_skip_ms: 2000") }
];

const failed = checks.filter((c) => !c.pass).map((c) => c.name);
const evidence = {
  phase: "0",
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? "pass" : "fail",
  checks,
  failedChecks: failed,
  artifacts: [
    "config/media-profiles.yaml",
    "config/mode-manifests.yaml",
    "config/cost-tiers.yaml",
    "schemas/openapi/session.v1.json",
    "schemas/events/events.v1.json",
    "packages/sdk/generated/types.ts"
  ],
  commands: [
    "npm run validate:config",
    "npm run validate:contracts",
    "npm run generate:types",
    "npm run check:boundaries"
  ]
};

const outputPath = path.join(reportsDir, "phase0-evidence.json");
fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2), "utf8");
console.log(`[evidence:phase0] ${evidence.status.toUpperCase()} -> reports/phase0-evidence.json`);

if (failed.length > 0) {
  process.exit(1);
}
