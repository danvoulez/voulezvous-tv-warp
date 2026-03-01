import fs from "node:fs";
import path from "node:path";
import {
  resetGuardState,
  enforceServerCaps,
  enforceCreateQuota,
  evaluateCircuitBreaker
} from "../services/guards/runtime-guards.mjs";

const root = path.resolve(process.cwd());

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  resetGuardState();

  const capsOk = enforceServerCaps({ requestedTiles: 6, maxTiles: 12 });
  assert(capsOk.allowed === true, "caps should allow within range");

  const capsBlocked = enforceServerCaps({ requestedTiles: 13, maxTiles: 12 });
  assert(capsBlocked.allowed === false && capsBlocked.reason === "tile_cap_exceeded", "caps must block over limit");

  const quota1 = enforceCreateQuota({
    userId: "u1",
    ip: "127.0.0.1",
    maxPerUser: 2,
    maxPerIp: 3
  });
  assert(quota1.allowed === true, "first quota call should pass");
  const quota2 = enforceCreateQuota({
    userId: "u1",
    ip: "127.0.0.1",
    maxPerUser: 2,
    maxPerIp: 3
  });
  assert(quota2.allowed === true, "second quota call should pass");
  const quota3 = enforceCreateQuota({
    userId: "u1",
    ip: "127.0.0.1",
    maxPerUser: 2,
    maxPerIp: 3
  });
  assert(quota3.allowed === false && quota3.reason === "user_quota_exceeded", "user quota should block");

  const breakerNo = evaluateCircuitBreaker({
    errorRate: 0.01,
    estimatedEgressGbPerHour: 0.5,
    thresholds: { maxErrorRate: 0.05, maxEstimatedEgressGbPerHour: 1.0 }
  });
  assert(breakerNo.triggered === false, "breaker should not trigger below thresholds");

  const breakerYes = evaluateCircuitBreaker({
    errorRate: 0.07,
    estimatedEgressGbPerHour: 0.5,
    thresholds: { maxErrorRate: 0.05, maxEstimatedEgressGbPerHour: 1.0 }
  });
  assert(
    breakerYes.triggered === true && breakerYes.forcedProfile === "thumb_low",
    "breaker should trigger and force constrained profile"
  );

  const report = {
    generatedAt: new Date().toISOString(),
    decision: "GO",
    checks: [
      "server_caps_enforced",
      "quota_enforced",
      "circuit_breaker_non_trigger_path",
      "circuit_breaker_trigger_path"
    ],
    circuitBreakerTriggered: true
  };
  const outPath = path.join(root, "reports/phase0-runtime-guards.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log("[test:runtime-guards] OK -> reports/phase0-runtime-guards.json");
}

try {
  run();
} catch (err) {
  console.error(`[test:runtime-guards] FAIL: ${err.message}`);
  process.exit(1);
}
