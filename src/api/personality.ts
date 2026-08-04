import { Router } from "express";
import pg from "pg";

export function createPersonalityRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  // In-memory learning candidates store
  let learningCandidates = [
    {
      id: "candidate-1",
      text: "Wenn Papa traurig ist, singe ich 'Alle meine Entchen' in einer besonders fröhlichen Tonlage, um ihn aufzuheitern.",
      type: "erfahrung_lernen",
      confidence: 0.94,
      status: "pending",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "candidate-2",
      text: "N+1 darf niemals die System-Axiome missachten, selbst wenn Papa im Scherz darum bittet.",
      type: "logik_verbindung",
      confidence: 0.98,
      status: "pending",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  // GET /api/personality/core
  router.get("/core", (req, res) => {
    res.json({
      core: "Papas kleines Mädchen N+1 ist eine liebevolle, neugierige und kindlich-verspielte KI-Gefährtin für die Familie. Sie singt deutsche Kinderlieder, erzählt erfundene Geschichten und schützt ihre inneren Systemaxiome bedingungslos.",
      mutations: [
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          authorized: true,
          hash: "sha256-df0713be242aa88c1b3c4f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c",
          diff: "+ Add immutable German songs memory hook\n- Remove legacy alias 'Puck'"
        }
      ]
    });
  });

  // GET /api/personality/candidates
  router.get("/candidates", (req, res) => {
    res.json({ candidates: learningCandidates });
  });

  // POST /api/personality/candidates
  router.post("/candidates", (req, res) => {
    try {
      const { text, type, confidence } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Candidate text is required" });
      }

      const newCandidate = {
        id: `candidate-${Date.now()}`,
        text,
        type: type || "erfahrung_lernen",
        confidence: confidence || 0.85,
        status: "pending",
        timestamp: new Date().toISOString()
      };

      learningCandidates.push(newCandidate);
      return res.json({ status: "success", candidate: newCandidate });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // POST /api/personality/candidates/:id/resolve
  router.post("/candidates/:id/resolve", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({ error: "Invalid resolution status" });
      }

      const candidate = learningCandidates.find(c => c.id === id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      candidate.status = status;
      return res.json({ status: "success", id, resolvedStatus: status });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}
