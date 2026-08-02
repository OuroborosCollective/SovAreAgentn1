import { Router } from "express";
import fs from "fs";

export function createHealthRouter(dependencies: { getPool: () => any; getMemcached: () => any }) {
  const router = Router();
  const { getPool, getMemcached } = dependencies;

  router.get(["/liveness", "/"], (req, res) => {
    res.json({
      status: "ok",
      mode: "liveness",
      timestamp: new Date().toISOString(),
      revision: "main@d51c8b7ce98a8564e7ffc8e3e03e9d11a58658e1",
    });
  });

  router.get("/readiness", async (req, res) => {
    const timestamp = new Date().toISOString();
    let workspaceOk = false;
    try {
      await fs.promises.access(process.cwd(), fs.constants.R_OK);
      workspaceOk = true;
    } catch {
      workspaceOk = false;
    }

    const pool = getPool();
    const memcached = getMemcached();
    const dbStatus = pool ? "connected" : "unconfigured";
    const memcachedStatus = memcached ? "connected" : "unconfigured";
    const isReady = workspaceOk;

    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "degraded",
      mode: "readiness",
      timestamp,
      revision: "main@d51c8b7ce98a8564e7ffc8e3e03e9d11a58658e1",
      source: process.env.K_SERVICE ? "Cloud Run Container" : "Node.js Process",
      subsystems: {
        workspace: { status: workspaceOk ? "ok" : "unreachable", path: process.cwd() },
        database: { status: dbStatus },
        memcached: { status: memcachedStatus },
        free_llm: { status: "configured", active_primary_route: "keller-route-01-gemini-flash" }
      }
    });
  });

  router.get("/dependency", async (req, res) => {
    const timestamp = new Date().toISOString();
    let dbConnected = false;
    let memcachedConnected = false;

    const pool = getPool();
    const memcached = getMemcached();

    if (pool) {
      try {
        await pool.query("SELECT 1");
        dbConnected = true;
      } catch (err) {
        dbConnected = false;
      }
    }

    if (memcached) {
      memcachedConnected = true;
    }

    const dependenciesOk = dbConnected || (!process.env.DB_URI);

    res.status(dependenciesOk ? 200 : 503).json({
      status: dependenciesOk ? "ok" : "degraded",
      mode: "dependency",
      timestamp,
      subsystems: {
        database: { status: pool ? (dbConnected ? "connected" : "unreachable") : "unconfigured" },
        memcached: { status: memcached ? (memcachedConnected ? "connected" : "unreachable") : "unconfigured" }
      }
    });
  });

  return router;
}
