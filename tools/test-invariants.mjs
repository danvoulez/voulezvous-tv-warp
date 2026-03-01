import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runPositiveChecks() {
  const media = fs.readFileSync(path.join(root, "config/media-profiles.yaml"), "utf8");
  const modes = fs.readFileSync(path.join(root, "config/mode-manifests.yaml"), "utf8");
  const events = JSON.parse(fs.readFileSync(path.join(root, "schemas/events/events.v1.json"), "utf8"));

  assert(media.includes("thumb_low"), "thumb_low profile must exist");
  assert(media.includes("enabled: false"), "thumb_low audio must be disabled");
  assert(modes.includes("route: /party"), "party route must exist");
  assert((events.properties?.type?.enum || []).includes("consent.request"), "consent.request event must exist");
}

function runNegativeFixtureChecks() {
  const negativeMedia = fs.readFileSync(path.join(root, "tests/fixtures/negative/media-profiles.invalid.yaml"), "utf8");
  const negativeEvents = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/negative/events.invalid.v1.json"), "utf8"));

  assert(!negativeMedia.includes("enabled: false"), "negative media fixture should violate thumb audio invariant");
  assert(!(negativeEvents.properties?.type?.enum || []).includes("consent.request"), "negative events fixture should miss consent.request");
}

try {
  runPositiveChecks();
  runNegativeFixtureChecks();
  console.log("[test:invariants] OK");
} catch (err) {
  console.error(`[test:invariants] FAIL: ${err.message}`);
  process.exit(1);
}
