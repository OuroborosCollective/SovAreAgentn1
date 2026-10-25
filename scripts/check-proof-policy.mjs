// Static regression guard: this complements, never replaces, real runtime probes.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const workflow = read(".github/workflows/n1-ci.yml");
const pkg = JSON.parse(read("package.json"));
const rbac = read("src/lib/serverSecurity.ts");
const health = read("apps/backend/src/routes/health.ts");
const server = read("server.ts");
const violations = [];

function requireFact(condition, message) {
  if (!condition) violations.push(message);
}

requireFact(!/Secret Scan \(Placeholder\)|SAST \(Placeholder\)|Container Scan \(Placeholder\)/i.test(workflow),
  "CI may not report placeholder scanners as passed");
requireFact(!/run:\s*echo ["']?(secret scan|sast|container scan) passed/i.test(workflow),
  "CI must execute actual security scanners");
requireFact(!/\bnpm publish\b|\bdocker push\b/.test(workflow),
  "Unapproved CI may not publish N+1 artifacts");
requireFact(!/\|\|\s*true/.test(pkg.scripts.lint || ""),
  "Lint/typechecks must not suppress failures");
requireFact(!/headerToken\.length\s*>=\s*8/.test(rbac),
  "Length alone must not grant owner privileges");
requireFact(!/req\.cookies\?\.n1_google_auth/.test(rbac),
  "Unsigned Google cookies must not authenticate family members");
requireFact(!/googleUser.*KEYLESS_GOOGLE_OAUTH_HANDSHAKE/.test(server),
  "Keyless authentication must not mint fabricated users");
requireFact(!/main@d51c8b7ce98a8564e7ffc8e3e03e9d11a58658e1/.test(health),
  "Health must report the live runtime revision, not a historical hardcoded SHA");
requireFact(workflow.includes("test-runtime-truth.mjs"),
  "CI must execute real HTTP and database probes");
requireFact(workflow.includes("trivy-action") && workflow.includes("gitleaks-action"),
  "CI must execute real container and secret scanners");

const fakeTests = [
  "tests/contract/auth.test.ts",
  "tests/contract/memory.test.ts",
  "tests/contract/learning.test.ts",
  "tests/contract/provider-adapter.test.ts",
  "tests/unit/dummy.test.ts",
  "tests/integration/dummy.test.ts",
];
for (const file of fakeTests) {
  if (existsSync(join(root, file)) && /expect\(true\)\.toBe\(true\)/.test(read(file))) {
    violations.push(`${file} is a vacuous contract, not a behavioral test`);
  }
}

if (violations.length) {
  for (const violation of violations) process.stderr.write(`FAIL: ${violation}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("PASS: static evidence policy; does not imply runtime verification\n");
}
