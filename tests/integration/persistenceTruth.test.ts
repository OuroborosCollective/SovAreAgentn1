import { describe, expect, it } from "vitest";
import { once } from "node:events";
import express, { Router } from "express";
import { createMemoryRouter } from "../../src/api/memory";
import { createPrivacyRouter } from "../../src/api/privacy";
import { createPersonalityRouter } from "../../src/api/personality";

async function exercise(prefix: string, router: Router, route: string, method: "GET" | "POST" = "GET", body?: unknown) {
  const app = express();
  app.use(express.json());
  app.use(prefix, router);
  const listener = app.listen(0, "127.0.0.1");
  try {
    await once(listener, "listening");
    const address = listener.address();
    if (!address || typeof address === "string") throw new Error("No TCP listener");
    const response = await fetch(`http://127.0.0.1:${address.port}${prefix}${route}`, {
      method, headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() as any };
  } finally {
    if (listener.listening) {
      await new Promise<void>((resolve, reject) => listener.close(err => err ? reject(err) : resolve()));
    }
  }
}

describe("persistent family state never fabricates successful effects", () => {
  it("does not report empty memory as successful DB readback", async () => {
    const r = await exercise("/api/memory", createMemoryRouter(() => null), "/events");
    expect(r.status).toBe(503);
    expect(r.body.code).toBe("PERSISTENCE_UNAVAILABLE");
  });
  it("does not acknowledge memory writes without a database", async () => {
    const r = await exercise("/api/memory", createMemoryRouter(() => null), "/events", "POST",
      { title: "Family event", category: "experience", insightContent: "Observed", learnedConnection: "None" });
    expect(r.status).toBe(503);
  });
  it("does not claim a memory migration without durable writes", async () => {
    const r = await exercise("/api/memory", createMemoryRouter(() => null), "/migrate", "POST",
      { memories: [{ id: "evt-1", title: "Historic event" }] });
    expect(r.status).toBe(503);
  });
  it("does not produce a made-up optimal hash", async () => {
    const r = await exercise("/api/memory", createMemoryRouter(() => null), "/audit");
    expect(r.status).toBe(503);
    expect(r.body.hash).toBeUndefined();
  });
  it("does not fabricate consent or erase family data", async () => {
    const router = createPrivacyRouter(() => null);
    const get = await exercise("/api/privacy", router, "/consent");
    const consent = await exercise("/api/privacy", router, "/consent", "POST",
      { action: "grant", dataClass: "audio_stimmprofil" });
    const forget = await exercise("/api/privacy", router, "/forget", "POST",
      { dataClass: "audio_stimmprofil" });
    expect(get.status).toBe(503);
    expect(consent.status).toBe(503);
    expect(forget.status).toBe(501);
    expect(forget.body.deleted_items).toBeUndefined();
  });
  it("does not present example learning candidates as accepted family memories", async () => {
    const r = await exercise("/api/personality", createPersonalityRouter(() => null), "/candidates");
    expect(r.status).toBe(503);
    expect(r.body.candidates).toBeUndefined();
  });
});
