import { Router } from "express";
import pg from "pg";
import crypto from "crypto";

export function createMemoryRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  function hashContent(content: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
  }

  router.post("/events", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });

    const { source, timeCertainty, privacyClass, payload, supersedesId } = req.body;
    if (!source || !timeCertainty || !privacyClass || !payload) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const contentHash = hashContent({ source, timeCertainty, privacyClass, payload });
    const id = crypto.randomUUID();

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        const result = await client.query(
          `INSERT INTO memory_events 
           (id, content_hash, source, time_certainty, privacy_class, payload, supersedes_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (content_hash) DO NOTHING
           RETURNING id`,
          [id, contentHash, source, timeCertainty, privacyClass, payload, supersedesId]
        );

        if (supersedesId && result.rows.length > 0) {
            await client.query(
                `UPDATE memory_events SET is_tombstone = true WHERE id = $1`,
                [supersedesId]
            );
        }
        
        await client.query("COMMIT");
        res.json({ status: "success", id: result.rows.length > 0 ? result.rows[0].id : null, hash: contentHash });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/events", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });
    try {
      const result = await pool.query("SELECT * FROM memory_events WHERE is_tombstone = false ORDER BY created_at DESC LIMIT 100");
      res.json({ events: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  router.post("/migrate", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });
    
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items array required" });
    }

    try {
      const client = await pool.connect();
      let imported = 0;
      try {
        await client.query("BEGIN");
        
        for (const item of items) {
          const payload = item.payload || item;
          const source = item.source || "legacy_migration";
          const timeCertainty = item.timeCertainty || "past";
          const privacyClass = item.privacyClass || "private";
          
          const contentHash = hashContent({ source, timeCertainty, privacyClass, payload });
          const id = crypto.randomUUID();

          const result = await client.query(
            `INSERT INTO memory_events 
             (id, content_hash, source, time_certainty, privacy_class, payload)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (content_hash) DO NOTHING
             RETURNING id`,
            [id, contentHash, source, timeCertainty, privacyClass, payload]
          );
          
          if (result.rows.length > 0) imported++;
        }
        
        await client.query("COMMIT");
        res.json({ status: "success", imported });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}
