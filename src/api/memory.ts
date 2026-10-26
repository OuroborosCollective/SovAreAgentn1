import { Router } from "express";
import pg from "pg";
import crypto from "crypto";

function unavailable(res: any) {
  return res.status(503).json({ status: "error", code: "PERSISTENCE_UNAVAILABLE" });
}

function stableHash(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function createMemoryRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  router.get("/events", async (_req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    try {
      const result = await pool.query(
        `SELECT id, created_at AS timestamp, payload
         FROM memory_events WHERE is_tombstone = FALSE
         ORDER BY created_at DESC LIMIT 100`
      );
      return res.json({ status: "readback", events: result.rows.map(row => ({
        id: row.id, timestamp: row.timestamp, ...row.payload,
      })) });
    } catch (error) {
      console.error("[Memory API] Readback query failed");
      return res.status(503).json({ status: "error", code: "PERSISTENCE_QUERY_FAILED" });
    }
  });

  router.post("/events", async (req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    const body = req.body ?? {};
    const { id, category, title, insightContent, learnedConnection } = body;
    if (typeof title !== "string" || !title.trim() || title.length > 1000
      || typeof category !== "string" || category.length > 80
      || typeof insightContent !== "string" || insightContent.length > 20000
      || (learnedConnection !== undefined && typeof learnedConnection !== "string")) {
      return res.status(400).json({ status: "error", code: "INVALID_MEMORY_EVENT" });
    }
    if (id !== undefined && (typeof id !== "string" || !id || id.length > 128)) {
      return res.status(400).json({ status: "error", code: "INVALID_MEMORY_ID" });
    }

    const eventId = id || crypto.randomUUID();
    const payload = { category, title: title.trim(), insightContent, learnedConnection: learnedConnection || "" };
    const contentHash = stableHash(payload);
    try {
      const stored = await pool.query(
        `INSERT INTO memory_events
          (id, content_hash, source, time_certainty, privacy_class, payload)
         VALUES ($1, $2, 'family_api', 'server_observed', 'long_term', $3)
         ON CONFLICT (content_hash) DO NOTHING RETURNING id`,
        [eventId, contentHash, payload]
      );
      const persistedId = stored.rows[0]?.id
        || (await pool.query("SELECT id FROM memory_events WHERE content_hash = $1", [contentHash])).rows[0]?.id;
      if (!persistedId) throw new Error("Persisted memory id unavailable");
      return res.status(stored.rowCount ? 201 : 200).json({
        status: "stored", id: persistedId, deduplicated: !stored.rowCount,
        hash: contentHash, source: "memory_events",
      });
    } catch (error) {
      console.error("[Memory API] Durable write failed");
      return res.status(503).json({ status: "error", code: "PERSISTENCE_WRITE_FAILED" });
    }
  });

  router.post("/migrate", async (req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    const memories = req.body?.memories;
    if (!Array.isArray(memories) || memories.length > 100
      || memories.some(m => !m || typeof m.id !== "string" || !m.id
        || m.id.length > 128 || typeof m.title !== "string" || !m.title)) {
      return res.status(400).json({ status: "error", code: "INVALID_MIGRATION_EVENTS" });
    }

    const client = await pool.connect().catch(() => null);
    if (!client) return unavailable(res);
    try {
      await client.query("BEGIN");
      let inserted = 0;
      for (const memory of memories) {
        const payload = {
          category: String(memory.category || "legacy"),
          title: memory.title,
          insightContent: String(memory.insightContent || ""),
          learnedConnection: String(memory.learnedConnection || ""),
          sourceTimestamp: typeof memory.timestamp === "string" ? memory.timestamp : null,
        };
        const hash = stableHash({ id: memory.id, payload });
        const result = await client.query(
          `INSERT INTO memory_events
            (id, content_hash, source, time_certainty, privacy_class, payload)
           VALUES ($1, $2, 'family_legacy_import', 'source_unverified', 'long_term', $3)
           ON CONFLICT (content_hash) DO NOTHING RETURNING id`,
          [memory.id, hash, payload]
        );
        inserted += result.rowCount || 0;
      }
      await client.query("COMMIT");
      return res.json({ status: "stored", inserted, deduplicated: memories.length - inserted });
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* original failure preserved */ }
      console.error("[Memory API] Transactional migration failed");
      return res.status(503).json({ status: "error", code: "MIGRATION_FAILED" });
    } finally {
      client.release();
    }
  });

  router.get("/audit", async (_req, res) => {
    const pool = getPool();
    if (!pool) return unavailable(res);
    try {
      const result = await pool.query("SELECT COUNT(*)::int AS event_count FROM memory_events");
      return res.json({
        status: "measured", source: "memory_events",
        eventCount: Number(result.rows[0].event_count),
        checkedAt: new Date().toISOString(),
        scope: "row_count_only", // Does not claim semantic coherence or cryptographic history validation.
      });
    } catch {
      return res.status(503).json({ status: "error", code: "PERSISTENCE_QUERY_FAILED" });
    }
  });

  return router;
}
