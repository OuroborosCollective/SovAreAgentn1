import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveActorAndRole } from "../../src/lib/serverSecurity";

const request = (authorization?: string, signedCookies: Record<string, string> = {}, cookies: Record<string, string> = {}) =>
  ({ headers: authorization ? { authorization } : {}, signedCookies, cookies }) as any;

afterEach(() => vi.unstubAllEnvs());

describe("authorization truth boundary (issue #5 regression)", () => {
  it("rejects arbitrary long bearer credentials, including fake GitHub tokens", () => {
    vi.stubEnv("N1_SYNC_TOKEN", "genuine-owner-" + "a".repeat(48));
    expect(resolveActorAndRole(request("Bearer attacker-controlled-credential")).role).toBe("public");
    expect(resolveActorAndRole(request("token attacker-controlled-credential")).role).toBe("public");
  });

  it("does not treat an unverified bearer as a family identity", () => {
    expect(resolveActorAndRole(request("Bearer some-random-user-token")).role).toBe("public");
  });

  it("allows only the exact configured owner credential", () => {
    const secret = "owner-" + "s".repeat(48);
    vi.stubEnv("N1_SYNC_TOKEN", secret);
    expect(resolveActorAndRole(request("Bearer " + secret)).role).toBe("owner-admin");
    expect(resolveActorAndRole(request("Bearer " + secret + "x")).role).toBe("public");
  });

  it("requires the dedicated configured admin secret, never a cookie signing key", () => {
    const signingKey = "cookie-" + "c".repeat(48);
    vi.stubEnv("N1_COOKIE_SECRET", signingKey);
    vi.stubEnv("N1_ADMIN_SECRET", "admin-" + "d".repeat(48));
    const make = (value: string) => ({ headers: { "x-admin-key": value }, signedCookies: {}, cookies: {} }) as any;
    expect(resolveActorAndRole(make(signingKey)).role).toBe("public");
    expect(resolveActorAndRole(make("admin-" + "d".repeat(48))).role).toBe("owner-admin");
  });

  it("never grants family or owner access merely because a raw signed OAuth token exists", () => {
    expect(resolveActorAndRole(request(undefined, { n1_sync_auth: "provider-token" })).role).toBe("public");
  });

  it("rejects unsigned Google cookies as family authentication", () => {
    expect(resolveActorAndRole(request(undefined, {}, { n1_google_auth: '{"email":"unknown@example.test"}' })).role).toBe("public");
  });

  it("rejects old raw-token signed cookies even if the user had once logged in", () => {
    vi.stubEnv("N1_FAMILY_GITHUB_IDS", "1001");
    expect(resolveActorAndRole(request(undefined, { n1_sync_auth: "gho_old_browser_token" })).role).toBe("public");
  });

  it("requires an allowlisted GitHub provider identity in the versioned signed session", () => {
    vi.stubEnv("N1_FAMILY_GITHUB_IDS", "1001,1002");
    const signedCookie = JSON.stringify({ version: 2, githubId: "1001", token: "gho_" + "t".repeat(30) });
    const actor = resolveActorAndRole(request(undefined, { n1_sync_auth: signedCookie }));
    expect(actor.role).toBe("family");
    expect(actor.actor).toBe("GitHubFamilyUser:1001");
  });

  it("denies revoked and unlisted signed family identities", () => {
    const cookie = JSON.stringify({ version: 2, githubId: "4444", token: "gho_" + "t".repeat(30) });
    vi.stubEnv("N1_FAMILY_GITHUB_IDS", "1001");
    expect(resolveActorAndRole(request(undefined, { n1_sync_auth: cookie })).role).toBe("public");
    vi.stubEnv("N1_FAMILY_GITHUB_IDS", "");
    expect(resolveActorAndRole(request(undefined, { n1_sync_auth: cookie })).role).toBe("public");
  });

  it("rejects a v2 cookie with no usable provider token", () => {
    vi.stubEnv("N1_FAMILY_GITHUB_IDS", "1001");
    const cookie = JSON.stringify({ version: 2, githubId: "1001", token: "" });
    expect(resolveActorAndRole(request(undefined, { n1_sync_auth: cookie })).role).toBe("public");
  });

  it("rejects weak configured secrets rather than weakening the owner boundary", () => {
    vi.stubEnv("N1_ADMIN_SECRET", "weak");
    const req = { headers: { "x-admin-key": "weak" }, signedCookies: {}, cookies: {} } as any;
    expect(resolveActorAndRole(req).role).toBe("public");
  });
});
