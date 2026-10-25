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

  it("never grants owner access merely because a signed OAuth cookie exists", () => {
    expect(resolveActorAndRole(request(undefined, { n1_sync_auth: "provider-token" })).role).toBe("family");
  });

  it("rejects unsigned Google cookies as family authentication", () => {
    expect(resolveActorAndRole(request(undefined, {}, { n1_google_auth: '{"email":"unknown@example.test"}' })).role).toBe("public");
  });

  it("rejects weak configured secrets rather than weakening the owner boundary", () => {
    vi.stubEnv("N1_ADMIN_SECRET", "weak");
    const req = { headers: { "x-admin-key": "weak" }, signedCookies: {}, cookies: {} } as any;
    expect(resolveActorAndRole(req).role).toBe("public");
  });
});
