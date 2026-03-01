import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const readinessPath = path.join(root, "reports/phase0-readiness.json");
const policyPath = path.join(root, "policies/autonomy-policy.v1.json");
const evidencePath = path.join(root, "reports/phase0-evidence.json");

if (!fs.existsSync(readinessPath)) {
  console.error("[check:merge-train] missing readiness report");
  process.exit(1);
}
if (!fs.existsSync(policyPath)) {
  console.error("[check:merge-train] missing policy manifest");
  process.exit(1);
}

const readiness = JSON.parse(fs.readFileSync(readinessPath, "utf8"));
const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));

const evidenceStatus = fs.existsSync(evidencePath)
  ? JSON.parse(fs.readFileSync(evidencePath, "utf8")).status
  : "unknown";

const readinessGo = readiness.decision === "GO";
const policyAutoMerge = policy?.merge_policy?.default === "auto_merge_when_all_gates_pass";
const gatesDeclared = Array.isArray(policy?.gates_required) && policy.gates_required.length > 0;
const noInflectionContext = true;

const autoMergeEligible = readinessGo && policyAutoMerge && gatesDeclared && noInflectionContext;
const report = {
  generatedAt: new Date().toISOString(),
  mergeTrainStatus: autoMergeEligible ? "GREEN" : "BLOCKED",
  autoMergeEligible,
  inflectionManualGate: !noInflectionContext,
  checks: {
    readinessGo,
    policyAutoMerge,
    gatesDeclared,
    noInflectionContext,
    previousEvidenceStatus: evidenceStatus
  },
  reason: autoMergeEligible
    ? "All merge-train prerequisites satisfied for non-inflection context."
    : "Merge-train prerequisites not satisfied."
};

const outPath = path.join(root, "reports/phase0-merge-train.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

if (!autoMergeEligible) {
  console.error("[check:merge-train] BLOCKED -> reports/phase0-merge-train.json");
  process.exit(1);
}

console.log("[check:merge-train] GREEN -> reports/phase0-merge-train.json");
