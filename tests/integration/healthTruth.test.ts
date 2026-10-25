import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createHealthRouter } from "../../apps/backend/src/routes/health";

async function probe(path: string) {
  const app = express();
  app.use("/api/health", createHealthRouter({
    getPool: () => null,
    getMemcached: () => null,
  }));
  const listener = app.listen(0, "127.0.0.1");
  try {
    const address = listener.address();
    if (!address || typeof address === "string") throw new Error("No actual TCP listener available");
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
    return { status: response.status, body: await response.json() as Record<string, any> };
  } finally {
    await new Promise<void>((resolve, reject) =>
      listener.close(error => error ? reject(error) : resolve())
    );
  }
}

afterEach(() => vi.unstubAllEnvs());

describe("live health checks: no fictitious database or build revision", () => {
  it("does not call unconfigured database ready just because cwd exists", async () => {
    vi.stubEnv("DB_URI", "");
    vi.stubEnv("GIT_REVISION", "");
    const { status, body } = await probe("/api/health/readiness");
    expect(status).toBe(503);
    expect(body.status).not.toBe("ready");
    expect(body.subsystems.database.status).toBe("unconfigured");
    expect(body.revision).toBe("unverified");
  });

  it("does not claim a dependency is healthy when its DB client is absent", async () => {
    vi.stubEnv("DB_URI", "postgres://required-but-unreachable@db:5432/n1");
    const { status, body } = await probe("/api/health/dependency");
    expect(status).toBe(503);
    expect(body.subsystems.database.status).toBe("unconfigured");
  });

  it("reports only the exact configured build revision in liveness", async () => {
    const revision = "a".repeat(40);
    vi.stubEnv("GIT_REVISION", revision);
    const { status, body } = await probe("/api/health/liveness");
    expect(status).toBe(200);
    expect(body.revision).toBe(revision);
  });
});
