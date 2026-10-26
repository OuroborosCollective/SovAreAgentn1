import { Router } from "express";
import pg from "pg";
import crypto from "crypto";

export function createPersonalityRouter(getPool: () => pg.Pool | null) {
  const router = Router();
  const unavailable = (res: any) =>
    res.status(503).json({ status: "error", code: "PERSISTENCE_UNAVAILABLE" });

  router.get("/core", async (_req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    try {
      const core = await pool.query(
        "SELECT id, core_traits, values, identity_matrix, locked FROM core_personality WHERE id = 'n1_genesis'"
      );
      if (!core.rows[0] || core.rows[0].locked !== true) {
        return res.status(503).json({ status: "error", code: "CANONICAL_PERSONA_NOT_VERIFIED" });
      }
      const mutations = await pool.query(
        `SELECT id, candidate_id, previous_hash, new_hash, mutation_payload, actor_context, created_at
         FROM personality_mutations ORDER BY created_at ASC`
      );
      return res.json({
        status: "readback",
        core: core.rows[0],
        mutations: mutations.rows,
        source: "postgresql_core_personality",
      });
    } catch {
      return res.status(503).json({ status: "error", code: "PERSONA_READBACK_FAILED" });
    }
  });

  router.get("/candidates", async (_req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    try {
      const result = await pool.query(
        `SELECT id, proposed_preference, cause, evidence, actor_context, status, created_at, resolved_at
         FROM learning_candidates ORDER BY created_at DESC LIMIT 100`
      );
      return res.json({
        status: "readback",
        candidates: result.rows.map(row => ({
          id: row.id,
          text: row.proposed_preference?.text,
          type: row.proposed_preference?.type,
          confidence: row.proposed_preference?.confidence,
          cause: row.cause,
          evidence: row.evidence,
          actorContext: row.actor_context,
          status: row.status,
          timestamp: row.created_at,
          resolvedAt: row.resolved_at,
        })),
      });
    } catch {
      return res.status(503).json({ status: "error", code: "LEARNING_READBACK_FAILED" });
    }
  });

  router.post("/candidates", async (req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    const { text, type, confidence, cause, evidence } = req.body ?? {};
    if (typeof text !== "string" || !text.trim() || text.length > 10000
      || (type !== undefined && typeof type !== "string")
      || (confidence !== undefined && (typeof confidence !== "number" || confidence < 0 || confidence > 1))
      || (cause !== undefined && typeof cause !== "string")
      || (evidence !== undefined && typeof evidence !== "string")) {
      return res.status(400).json({ status: "error", code: "INVALID_LEARNING_CANDIDATE" });
    }
    const id = crypto.randomUUID();
    try {
      const result = await pool.query(
        `INSERT INTO learning_candidates
          (id, proposed_preference, cause, evidence, actor_context, status)
         VALUES ($1, $2, $3, $4, 'family_api_candidate', 'candidate')
         RETURNING id, status, created_at`,
        [id, { text: text.trim(), type: type || "erfahrung_lernen", confidence: confidence ?? null },
          cause || "family_observation", evidence || null]
      );
      if (!result.rows[0]) throw new Error("Learning candidate receipt not returned");
      return res.status(201).json({
        status: "stored",
        candidate: { id: result.rows[0].id, text: text.trim(), status: result.rows[0].status,
          timestamp: result.rows[0].created_at },
      });
    } catch {
      return res.status(503).json({ status: "error", code: "LEARNING_WRITE_FAILED" });
    }
  });

  router.post("/candidates/:id/resolve", async (req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (status !== "accepted" && status !== "rejected") {
      return res.status(400).json({ status: "error", code: "INVALID_RESOLUTION" });
    }
    if (status === "accepted") {
      return res.status(409).json({
        status: "error", code: "LEARNING_REVIEW_REQUIRED",
        message: "Acceptance requires a separately verified reflection and parent-confirmation chain.",
      });
    }
    try {
      const result = await pool.query(
        `UPDATE learning_candidates SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status IN ('observed', 'candidate', 'questioned', 'parent-confirmed', 'self-reflected')
         RETURNING id, status`, [id]
      );
      if (!result.rows[0]) {
        return res.status(409).json({ status: "error", code: "NO_PENDING_CANDIDATE" });
      }
      return res.json({ status: "stored", id: result.rows[0].id, resolvedStatus: result.rows[0].status });
    } catch {
      return res.status(503).json({ status: "error", code: "LEARNING_RESOLUTION_FAILED" });
    }
  });

  return router;
}
