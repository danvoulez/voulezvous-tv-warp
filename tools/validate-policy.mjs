import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const policyPath = path.join(root, "policies/autonomy-policy.v1.json");

if (!fs.existsSync(policyPath)) {
  console.error("[validate:policy] policy file missing");
  process.exit(1);
}

const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));

if (policy.version !== "v1") {
  console.error("[validate:policy] version must be v1");
  process.exit(1);
}
if (policy.execution_mode !== "continuous_24_7_autonomous") {
  console.error("[validate:policy] execution_mode must be continuous_24_7_autonomous");
  process.exit(1);
}
if (policy?.merge_policy?.default !== "auto_merge_when_all_gates_pass") {
  console.error("[validate:policy] merge_policy.default must enforce auto-merge-on-gates");
  process.exit(1);
}
const manualList = policy?.merge_policy?.manual_required_for || [];
const requiredManualClasses = [
  "first_production_exposure_per_major_flow",
  "consent_auth_moderation_isolation_changes",
  "high_critical_override_changes",
  "first_rollout_new_autonomous_policy_engine",
  "incident_mode_or_rollback_policy_change"
];
for (const cls of requiredManualClasses) {
  if (!manualList.includes(cls)) {
    console.error(`[validate:policy] missing manual inflection class: ${cls}`);
    process.exit(1);
  }
}
if (policy.dead_man_switch_required !== true) {
  console.error("[validate:policy] dead_man_switch_required must be true");
  process.exit(1);
}
const gates = policy.gates_required || [];
for (const gate of ["validate_policy", "contracts_drift", "invariants", "evidence"]) {
  if (!gates.includes(gate)) {
    console.error(`[validate:policy] gates_required missing: ${gate}`);
    process.exit(1);
  }
}

console.log("[validate:policy] OK");
