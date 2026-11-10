// Runs ONLY against disposable CI PostgreSQL and the real built app container.
// Explicitly marked test fixtures are not production or family evidence.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

assert.equal(process.env.N1_CI_INTEGRATION, "1", "Refuse fixture writes outside isolated CI");
const token = process.env.N1_SYNC_TOKEN;
const sha = process.env.GIT_REVISION;
assert.ok(token && token.length >= 32, "Missing temporary CI machine credential");
assert.match(sha || "", /^[0-9a-f]{40}$/i);
const base = process.env.N1_BASE_URL || "http://127.0.0.1:3000";

async function api(path, method = "GET", body) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  return { code: response.status, data: await response.json() };
}
function check(label, condition) {
  assert.ok(condition, label);
  process.stdout.write(`PASS ${label}\n`);
}
const eventId = `ci-memory-${sha.slice(0,24)}`;
const memory = await api("/api/memory/events", "POST", {
  id: eventId,
  category: "ci-regression",
  title: "CI-ONLY fixture - persistence across restart",
  insightContent: "This is a disposable integration-test receipt, not a family memory",
  learnedConnection: "PostgreSQL durable write/readback",
});
check("memory written via actual API", [200, 201].includes(memory.code) && memory.data.id === eventId);

const newCandidate = await api("/api/personality/candidates", "POST", {
  text: "CI-ONLY learning candidate (must never be silently accepted)",
  type: "ci-regression",
  confidence: 0.1,
});
check("candidate written to database", newCandidate.code === 201 && newCandidate.data.candidate?.status === "candidate");
const candidateId = newCandidate.data.candidate.id;

const deniedAcceptance = await api(`/api/personality/candidates/${candidateId}/resolve`, "POST", { status: "accepted" });
check("unreviewed learning cannot become accepted", deniedAcceptance.code === 409);
const rejection = await api(`/api/personality/candidates/${candidateId}/resolve`, "POST", { status: "rejected" });
check("rejection persisted", rejection.code === 200 && rejection.data.resolvedStatus === "rejected");

const consent = await api("/api/privacy/consent", "POST", {
  action: "revoke", dataClass: "telemetry",
  actor: "MUST_NOT_TRUST_CLIENT_SPOOFED_ACTOR",
});
check("consent revocation appended to database", consent.code === 201 && consent.data.log?.granted === false);
check("client-supplied actor not trusted", consent.data.log.actor !== "MUST_NOT_TRUST_CLIENT_SPOOFED_ACTOR");

const core = await api("/api/personality/core");
check("canonical N+1 personality comes from locked DB record",
  core.code === 200 && core.data.core?.locked === true
    && core.data.core?.identity_matrix?.name === "N+1");

process.stdout.write("Restarting real application container without resetting PostgreSQL volume\n");
execFileSync("docker", ["compose", "restart", "app"], { stdio: "inherit" });

let ready = false;
for (let i = 0; i < 45; i++) {
  try {
    const state = await api("/api/health/readiness");
    if (state.code === 200 && state.data.revision === sha
      && state.data.subsystems?.database?.status === "connected") {
      ready = true;
      break;
    }
  } catch { /* transient startup while waiting, never recorded as PASS */ }
  await new Promise(resolve => setTimeout(resolve, 1500));
}
check("same SHA, actual PostgreSQL query healthy after restart", ready);

const memories = await api("/api/memory/events");
check("memory persisted across app container restart",
  memories.code === 200 && memories.data.events.some(entry => entry.id === eventId));
const candidates = await api("/api/personality/candidates");
check("candidate persisted as rejected after restart",
  candidates.code === 200
  && candidates.data.candidates.some(c => c.id === candidateId && c.status === "rejected"));
const consents = await api("/api/privacy/consent");
check("consent revocation persisted across restart",
  consents.code === 200
  && consents.data.logs.some(c => c.id === consent.data.log.id && c.granted === false));
check("deletion request cannot fake success",
  (await api("/api/privacy/forget", "POST", { dataClass: "all" })).code === 501);
process.stdout.write(`PASS real post-restart memory, learning, consent, core receipts at ${sha}\n`);
