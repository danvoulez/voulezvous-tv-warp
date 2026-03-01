import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());

const currentOpenApiPath = path.join(root, "schemas/openapi/session.v1.json");
const baselineOpenApiPath = path.join(root, "contracts/openapi/session.v1.baseline.json");
const currentEventsPath = path.join(root, "schemas/events/events.v1.json");
const baselineEventsPath = path.join(root, "contracts/events/events.v1.baseline.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function normalize(obj) {
  if (Array.isArray(obj)) return obj.map(normalize);
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        acc[k] = normalize(obj[k]);
        return acc;
      }, {});
  }
  return obj;
}

function deepEqual(a, b) {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function hasPathRemovalOrRename(currentPaths = {}, baselinePaths = {}) {
  const baselineKeys = new Set(Object.keys(baselinePaths));
  const currentKeys = new Set(Object.keys(currentPaths));
  for (const key of baselineKeys) {
    if (!currentKeys.has(key)) return true;
  }
  return false;
}

function hasEventRemoval(currentEnum = [], baselineEnum = []) {
  const currentSet = new Set(currentEnum);
  for (const ev of baselineEnum) {
    if (!currentSet.has(ev)) return true;
  }
  return false;
}

const curOpen = readJson(currentOpenApiPath);
const baseOpen = readJson(baselineOpenApiPath);
const curEvt = readJson(currentEventsPath);
const baseEvt = readJson(baselineEventsPath);

const openSame = deepEqual(curOpen, baseOpen);
const evtSame = deepEqual(curEvt, baseEvt);
const hasAnyDrift = !(openSame && evtSame);

const openBreaking = hasPathRemovalOrRename(curOpen.paths, baseOpen.paths);
const curEnum = curEvt?.properties?.type?.enum || [];
const baseEnum = baseEvt?.properties?.type?.enum || [];
const evtBreaking = hasEventRemoval(curEnum, baseEnum);
const breaking = openBreaking || evtBreaking;

const curVersion = curOpen?.info?.version;
const baseVersion = baseOpen?.info?.version;
const versionBumped = curVersion !== baseVersion;

if (hasAnyDrift && breaking && !versionBumped) {
  console.error("[check:contracts-drift] Breaking contract change detected without explicit version bump");
  console.error(`[check:contracts-drift] baseline version=${baseVersion} current version=${curVersion}`);
  process.exit(1);
}

console.log(`[check:contracts-drift] OK (drift=${hasAnyDrift ? "yes" : "no"}, breaking=${breaking ? "yes" : "no"}, versionBumped=${versionBumped ? "yes" : "no"})`);
