import { Router } from "express";
import fs from "fs";

type ProbeStatus = "connected" | "unreachable" | "unconfigured";

function measuredRevision(): string {
  const revision = process.env.GIT_REVISION;
  return revision && /^[0-9a-f]{40}$/i.test(revision) ? revision : "unverified";
}

async function probeDatabase(pool: any): Promise<ProbeStatus> {
  if (!pool || typeof pool.query !== "function") return "unconfigured";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Query an actual database connection; constructing a Pool is not evidence.
    await Promise.race([
      Promise.resolve().then(() => pool.query("SELECT 1 AS probe")),
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("database probe deadline exceeded")), 2500);
      }),
    ]);
    return "connected";
  } catch {
    return "unreachable";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function createHealthRouter(dependencies: { getPool: () => any; getMemcached: () => any }) {
  const router = Router();

  router.get(["/liveness", "/"], (_req, res) => {
    res.json({
      status: "ok", mode: "liveness",
      timestamp: new Date().toISOString(), revision: measuredRevision(),
    });
  });

  router.get("/readiness", async (_req, res) => {
    const timestamp = new Date().toISOString();
    let workspaceOk = false;
    try {
      await fs.promises.access(process.cwd(), fs.constants.R_OK);
      workspaceOk = true;
    } catch {
      workspaceOk = false;
    }

    const databaseStatus = await probeDatabase(dependencies.getPool());
    const revision = measuredRevision();
    const isReady = workspaceOk && databaseStatus === "connected" && revision !== "unverified";
    const memcachedConfigured = Boolean(dependencies.getMemcached());
    const llmConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.FREE_LLM_API_KEY);
    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "degraded",
      mode: "readiness",
      timestamp, revision,
      source: "local_process_checks",
      subsystems: {
        workspace: { status: workspaceOk ? "ok" : "unreachable" },
        database: { status: databaseStatus },
        memcached: { status: memcachedConfigured ? "configured_unverified" : "unconfigured" },
        free_llm: { status: llmConfigured ? "configured_unverified" : "unconfigured" },
      },
    });
  });

  router.get("/dependency", async (_req, res) => {
    const databaseStatus = await probeDatabase(dependencies.getPool());
    const dependenciesOk = databaseStatus === "connected";
    res.status(dependenciesOk ? 200 : 503).json({
      status: dependenciesOk ? "ok" : "degraded",
      mode: "dependency",
      timestamp: new Date().toISOString(),
      revision: measuredRevision(),
      subsystems: {
        database: { status: databaseStatus },
        memcached: {
          status: dependencies.getMemcached() ? "configured_unverified" : "unconfigured",
        },
      },
    });
  });

  return router;
}
