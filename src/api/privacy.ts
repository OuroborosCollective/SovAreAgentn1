import { Router } from "express";
import pg from "pg";

export function createPrivacyRouter(getPool: () => pg.Pool | null) {
  const router = Router();

  let privacyLogs = [
    {
      id: "priv-log-1",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      action: "EINGEWILLIGT",
      dataClass: "audio_stimmprofil",
      actor: "Papa (UI)"
    },
    {
      id: "priv-log-2",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      action: "EINGEWILLIGT",
      dataClass: "erinnerungen_gedaechtnis",
      actor: "Mama (UI)"
    }
  ];

  // GET /api/privacy/consent
  router.get("/consent", (req, res) => {
    res.json({ logs: privacyLogs });
  });

  // POST /api/privacy/consent
  router.post("/consent", (req, res) => {
    try {
      const { action, dataClass, actor } = req.body;
      const newLog = {
        id: `priv-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: action || "EINGEWILLIGT",
        dataClass: dataClass || "system_insight",
        actor: actor || "User (UI)"
      };

      privacyLogs.unshift(newLog);
      return res.json({ status: "success", log: newLog });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // POST /api/privacy/forget
  router.post("/forget", (req, res) => {
    try {
      const { dataClass, actor } = req.body;
      
      // Filter out or log forgetting event
      const forgetLog = {
        id: `priv-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "GELÖSCHT / VERGESSEN",
        dataClass: dataClass || "all",
        actor: actor || "Parent (UI)"
      };

      privacyLogs.unshift(forgetLog);

      // Simulate deletion count
      let deletedCount = 3;
      if (dataClass === "audio_stimmprofil") {
        deletedCount = 1;
      } else if (dataClass === "erinnerungen_gedaechtnis") {
        deletedCount = 12;
      }

      return res.json({ 
        status: "success", 
        deleted_items: deletedCount,
        dataClass,
        message: `Erfolgreich gelöscht: ${deletedCount} Einträge.`
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}
