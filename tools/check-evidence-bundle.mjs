import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());

const requiredArtifacts = [
  { name: "ci_links", path: "evidence/ci-links.txt" },
  { name: "invariant_proof_report", path: "evidence/invariant-proof-report.txt" },
  { name: "slo_latency_snapshot", path: "evidence/slo-latency-snapshot.txt" },
  { name: "incident_rollback_drill", path: "evidence/incident-rollback-drill.txt" },
  { name: "release_approver_signoff", path: "evidence/release-approver-signoff.txt" }
];

const checks = requiredArtifacts.map((item) => ({
  name: item.name,
  path: item.path,
  present: fs.existsSync(path.join(root, item.path))
}));

const presentCount = checks.filter((c) => c.present).length;
const completenessPercent = Math.round((presentCount / checks.length) * 100);
const decision = completenessPercent === 100 ? "GO" : "NO_GO";

const report = {
  generatedAt: new Date().toISOString(),
  decision,
  completenessPercent,
  requiredArtifacts: checks,
  missing: checks.filter((c) => !c.present).map((c) => c.path)
};

const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
const outPath = path.join(reportsDir, "phase0-evidence-bundle.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

if (decision !== "GO") {
  console.error("[check:evidence-bundle] NO_GO -> reports/phase0-evidence-bundle.json");
  process.exit(1);
}

console.log("[check:evidence-bundle] GO -> reports/phase0-evidence-bundle.json");
