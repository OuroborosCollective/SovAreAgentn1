import { Router } from "express";
import pg from "pg";
import crypto from "crypto";

export function createPrivacyRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  // Get consent logs
  router.get("/consent", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });
    try {
      const result = await pool.query("SELECT * FROM family_consent_logs ORDER BY created_at DESC LIMIT 100");
      res.json({ logs: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add a consent log
  router.post("/consent", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });

    const { action, actor, dataClass, granted } = req.body;
    const id = crypto.randomUUID();

    try {
      await pool.query(
        `INSERT INTO family_consent_logs (id, action, actor, data_class, granted)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, action, actor, dataClass, granted]
      );
      res.json({ status: "success", id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Handle data deletion (forgetting)
  router.post("/forget", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });

    const { dataClass, actor } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        let deleted = 0;
        
        // Remove relevant memory events by tombstoning them
        if (dataClass === 'all' || dataClass === 'dialog_context' || dataClass === 'long_term') {
            const result = await client.query(
                `UPDATE memory_events SET is_tombstone = true 
                 WHERE privacy_class = $1 OR $2 = 'all' RETURNING id`,
                [dataClass, dataClass]
            );
            deleted = result.rows.length;
        }

        // Log the forgetting action
        await client.query(
            `INSERT INTO family_consent_logs (id, action, actor, data_class, granted)
             VALUES ($1, $2, $3, $4, $5)`,
            [crypto.randomUUID(), 'forget', actor, dataClass, true]
        );
        
        await client.query("COMMIT");
        res.json({ status: "success", deleted_items: deleted });
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
