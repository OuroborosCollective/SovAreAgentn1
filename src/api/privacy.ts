import { Router } from "express";
import pg from "pg";
import crypto from "crypto";
import { resolveActorAndRole } from "../lib/serverSecurity";

export function createPrivacyRouter(getPool: () => pg.Pool | null) {
  const router = Router();
  const unavailable = (res: any) =>
    res.status(503).json({ status: "error", code: "PERSISTENCE_UNAVAILABLE" });

  router.get("/consent", async (_req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    try {
      const result = await pool.query(
        `SELECT id, created_at AS timestamp, action, actor, data_class AS "dataClass", granted
         FROM family_consent_logs ORDER BY created_at DESC LIMIT 100`
      );
      return res.json({ status: "readback", logs: result.rows });
    } catch {
      return res.status(503).json({ status: "error", code: "CONSENT_READBACK_FAILED" });
    }
  });

  router.post("/consent", async (req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    const role = resolveActorAndRole(req);
    if (role.role !== "family" && role.role !== "owner-admin") {
      return res.status(401).json({ status: "error", code: "VERIFIED_FAMILY_SESSION_REQUIRED" });
    }
    const { action, dataClass } = req.body ?? {};
    const dataClasses = new Set([
      "audio_stimmprofil", "erinnerungen_gedaechtnis",
      "dialog_context", "telemetry",
    ]);
    if (!["grant", "revoke"].includes(action) || !dataClasses.has(dataClass)) {
      return res.status(400).json({ status: "error", code: "INVALID_CONSENT_REQUEST" });
    }
    // The actor records the authenticated route class; never trust a client-supplied name.
    const id = crypto.randomUUID();
    try {
      const result = await pool.query(
        `INSERT INTO family_consent_logs
           (id, action, actor, data_class, granted)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, action, actor, data_class AS "dataClass", granted, created_at AS timestamp`,
        [id, action, role.actor, dataClass, action === "grant"]
      );
      if (!result.rows[0]) throw new Error("Consent receipt not returned");
      return res.status(201).json({ status: "stored", log: result.rows[0] });
    } catch {
      return res.status(503).json({ status: "error", code: "CONSENT_WRITE_FAILED" });
    }
  });

  router.post("/forget", (_req, res) => {
    // A log entry, tombstone, or arbitrary counter is NOT proof of deletion.
    // Enable only after physical DB/media deletion, backup propagation and
    // post-deletion readback have been implemented and tested.
    return res.status(501).json({ status: "error", code: "VERIFIED_DELETION_UNAVAILABLE" });
  });

  return router;
}
