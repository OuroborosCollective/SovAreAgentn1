// Performs actual HTTP requests to the started N+1 container and real PostgreSQL.
// No injected server, fake credentials, or synthetic health values are accepted.
import assert from "node:assert/strict";

const baseUrl = process.env.N1_BASE_URL || "http://127.0.0.1:3000";
const sha = process.env.GIT_REVISION;
assert.match(sha || "", /^[a-f0-9]{40}$/i, "GIT_REVISION must be the actual 40-digit commit SHA");

async function request(route, init = {}) {
  const response = await fetch(new URL(route, baseUrl), {
    ...init,
    signal: AbortSignal.timeout(10000),
  });
  const bodyText = await response.text();
  let body;
  try { body = JSON.parse(bodyText); }
  catch { body = bodyText; }
  return { status: response.status, body, headers: response.headers };
}
function verify(label, actual, expected) {
  assert.equal(actual, expected, `${label}: expected ${expected}, received ${actual}`);
  process.stdout.write(`PASS ${label}\n`);
}

const live = await request("/api/health/liveness");
verify("actual HTTP liveness", live.status, 200);
verify("liveness revision is running commit", live.body.revision, sha);

const ready = await request("/api/health/readiness");
verify("actual HTTP readiness with database", ready.status, 200);
verify("readiness is measured, not merely present", ready.body.status, "ready");
verify("readiness revision is running commit", ready.body.revision, sha);
verify("readiness DB query ran", ready.body.subsystems?.database?.status, "connected");

const dependency = await request("/api/health/dependency");
verify("real dependency HTTP probe", dependency.status, 200);
verify("real dependency DB query ran", dependency.body.subsystems?.database?.status, "connected");

verify("deny unknown API route", (await request("/api/this-path-does-not-exist")).status, 403);
verify("deny anonymous family endpoint", (await request("/api/nexus/status")).status, 401);
verify("deny arbitrary token as owner", (await request("/api/audit/logs", {
  headers: { authorization: "Bearer totally-invented-owner-secret-which-is-long-enough" },
})).status, 401);
verify("deny unsigned Google family cookie", (await request("/api/nexus/status", {
  headers: { cookie: 'n1_google_auth=%7B%22email%22%3A%22owner%40example.test%22%7D' },
})).status, 401);

const fakeGoogle = await request("/api/auth/google/keyless");
verify("keyless fake provider rejected", fakeGoogle.status, 501);
assert.equal(fakeGoogle.headers.get("set-cookie"), null, "Fake Google login must not issue a session");

verify("unbound OAuth code exchange forbidden", (await request("/api/auth/nexus/handshake", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "unbound-code" }),
})).status, 501);

const provider = await request("/api/auth/google/me");
verify("unverified Google session not authenticated", provider.body.authenticated, false);

verify("anonymous unrestricted SQL blocked", (await request("/api/db/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "DROP TABLE users" }),
})).status, 401);

// Real HTTP regression: a browser's simple form POST must be denied before
// RBAC or state-changing handlers, even when CORS would merely hide the reply.
const offsitePost = await request("/api/memory/events", {
  method: "POST",
  headers: {
    Origin: "https://untrusted-attacker.example.invalid",
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: "title=untrusted"
});
verify("deny off-site form POST before auth", offsitePost.status, 403);
verify("denied origin has explicit error code", offsitePost.body.code, "CROSS_ORIGIN_WRITE_FORBIDDEN");

const opaqueOriginPost = await request("/api/privacy/forget", {
  method: "POST",
  headers: { Origin: "null", "Content-Type": "application/x-www-form-urlencoded" },
  body: "scope=all"
});
verify("deny opaque Origin mutation", opaqueOriginPost.status, 403);
verify("opaque Origin denial code", opaqueOriginPost.body.code, "CROSS_ORIGIN_WRITE_FORBIDDEN");

const sameOriginPost = await request("/api/memory/events", {
  method: "POST",
  headers: {
    Origin: new URL(baseUrl).origin,
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: "title=without-auth"
});
verify("own Origin stays under real family auth gate", sameOriginPost.status, 401);

const suffixOriginPost = await request("/api/memory/events", {
  method: "POST",
  headers: {
    Origin: "https://127.0.0.1.attacker.example.invalid",
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: "title=host-suffix"
});
verify("deny host-suffix Origin", suffixOriginPost.status, 403);

process.stdout.write(`All live N+1 boundary probes passed for commit ${sha}\n`);
