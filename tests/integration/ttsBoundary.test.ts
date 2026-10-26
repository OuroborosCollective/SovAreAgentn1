import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "../helpers/actualHttpRequest";
import { createTtsRouter } from "../../src/api/tts";

// Real TCP transport into the actual TTS router. An external provider is
// intentionally NOT mocked or asserted active in these unavailable-path tests.
afterEach(() => vi.unstubAllEnvs());

describe("TTS provider-unavailable boundary over HTTP", () => {
  it("rejects an invalid audio request before calling any provider", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("API_KEY", "");
    const app = express();
    app.use(express.json());
    app.use("/api/tts", createTtsRouter());
    const response = await request(app).post("/api/tts").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Text is required");
  });

  it("must never label absent provider audio as successful synthesis", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("API_KEY", "");
    const app = express();
    app.use(express.json());
    app.use("/api/tts", createTtsRouter());
    const response = await request(app).post("/api/tts").send({ text: "CI fixture" });
    expect(response.body.status).not.toBe("success");
    expect(response.body.audio).toBeNull();
    expect(response.body.error).toBe("NO_API_KEY");
  });
});
