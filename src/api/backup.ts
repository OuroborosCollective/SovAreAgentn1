import { Router } from "express";
import pg from "pg";
import crypto from "crypto";

export function createBackupRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  function generateChecksum(data: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  // Create an encrypted backup (mock encryption for demo: base64 encoding payload)
  router.get("/export", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });
    
    try {
      const coreRes = await pool.query("SELECT * FROM core_personality LIMIT 1");
      const mutationsRes = await pool.query("SELECT * FROM personality_mutations ORDER BY created_at ASC");
      const eventsRes = await pool.query("SELECT * FROM memory_events WHERE is_tombstone = false");

      const exportData = {
        schema_version: "1.0",
        timestamp: new Date().toISOString(),
        core: coreRes.rows.length > 0 ? coreRes.rows[0] : null,
        mutations: mutationsRes.rows,
        events: eventsRes.rows
      };

      const checksum = generateChecksum(exportData);
      
      const manifest = {
        checksum,
        schema_version: "1.0",
        data: Buffer.from(JSON.stringify(exportData)).toString('base64')
      };

      res.json(manifest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Restore from encrypted backup
  router.post("/restore", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });

    const { manifest } = req.body;
    if (!manifest || !manifest.checksum || !manifest.data) {
        return res.status(400).json({ error: "Invalid backup manifest" });
    }

    try {
      const decodedData = JSON.parse(Buffer.from(manifest.data, 'base64').toString('utf8'));
      
      const calculatedChecksum = generateChecksum(decodedData);
      if (calculatedChecksum !== manifest.checksum) {
          return res.status(400).json({ error: "Backup corrupted: Checksum mismatch" });
      }

      if (decodedData.schema_version !== "1.0") {
          return res.status(400).json({ error: "Unsupported schema version" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // Restore events
        let restoredEvents = 0;
        if (decodedData.events && Array.isArray(decodedData.events)) {
            for (const event of decodedData.events) {
                const result = await client.query(
                    `INSERT INTO memory_events 
                     (id, content_hash, source, time_certainty, privacy_class, payload, is_tombstone)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (content_hash) DO NOTHING
                     RETURNING id`,
                    [event.id, event.content_hash, event.source, event.time_certainty, event.privacy_class, event.payload, event.is_tombstone]
                );
                if (result.rows.length > 0) restoredEvents++;
            }
        }
        
        await client.query("COMMIT");
        res.json({ status: "success", restored_events: restoredEvents, checksum: calculatedChecksum });
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
