import { Router } from "express";
import pg from "pg";
import crypto from "crypto";

export function createPersonalityRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  function hashContent(content: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
  }

  // Get current state
  router.get("/core", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });
    try {
      const coreRes = await pool.query("SELECT * FROM core_personality LIMIT 1");
      const mutationsRes = await pool.query("SELECT * FROM personality_mutations ORDER BY created_at ASC");
      
      let core = coreRes.rows.length > 0 ? coreRes.rows[0] : null;
      
      res.json({ core, mutations: mutationsRes.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get candidates
  router.get("/candidates", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });
    try {
      const candidates = await pool.query("SELECT * FROM learning_candidates ORDER BY created_at DESC LIMIT 50");
      res.json({ candidates: candidates.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Propose a change
  router.post("/candidates", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });

    const { proposedPreference, cause, evidence, actorContext, status } = req.body;
    const id = crypto.randomUUID();

    try {
      await pool.query(
        `INSERT INTO learning_candidates (id, proposed_preference, cause, evidence, actor_context, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, proposedPreference, cause, evidence, actorContext, status || 'observed']
      );
      res.json({ status: "success", id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resolve a candidate
  router.post("/candidates/:id/resolve", async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: "DB not available" });

    const { id } = req.params;
    const { status, actorContext } = req.body; 

    const validStates = ['observed', 'candidate', 'questioned', 'parent-confirmed', 'self-reflected', 'accepted', 'rejected', 'superseded'];
    if (!validStates.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        const candidateRes = await client.query(
          "UPDATE learning_candidates SET status = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
          [status, id]
        );

        if (candidateRes.rows.length === 0) {
          throw new Error("Candidate not found");
        }

        const candidate = candidateRes.rows[0];

        if (status === "accepted") {
          // Find previous hash
          const lastMutationRes = await client.query("SELECT new_hash FROM personality_mutations ORDER BY created_at DESC LIMIT 1");
          const previousHash = lastMutationRes.rows.length > 0 ? lastMutationRes.rows[0].new_hash : "genesis";
          
          const payload = candidate.proposed_preference;
          const newHash = hashContent({ previousHash, payload });
          
          await client.query(
            `INSERT INTO personality_mutations (id, candidate_id, previous_hash, new_hash, mutation_payload, actor_context)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [crypto.randomUUID(), candidate.id, previousHash, newHash, payload, actorContext]
          );
        }

        await client.query("COMMIT");
        res.json({ status: "success" });
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
