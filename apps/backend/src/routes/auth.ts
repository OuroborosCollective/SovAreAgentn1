import { Router } from "express";

export function createAuthRouter(dependencies: { 
  pool: any; 
  nexusSecret: string | undefined; 
  googleClientId: string | undefined; 
  freeLLMApiKey: string | undefined;
}) {
  const router = Router();
  const { pool, nexusSecret, googleClientId, freeLLMApiKey } = dependencies;

  // Nexus Config
  router.get("/nexus/config", (req, res) => {
    res.json({
      configured: !!nexusSecret,
      client_id: process.env.NEXUS_CLIENT_ID || null
    });
  });

  router.get("/nexus/url", (req, res) => {
    if (!nexusSecret) {
      return res.status(400).json({ error: "Nexus OAuth not configured" });
    }
    const clientId = process.env.NEXUS_CLIENT_ID;
    const redirectUri = process.env.NEXUS_REDIRECT_URI || 'http://localhost:3000/api/auth/nexus/callback';
    const state = Math.random().toString(36).substring(7);
    const scope = "repo,user";
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    res.json({ url: authUrl });
  });

  // Google OAuth stub
  router.get("/google/config", (req, res) => {
    res.json({
      configured: !!googleClientId,
      client_id: googleClientId || null
    });
  });

  router.get("/google/keyless", (req, res) => {
    res.json({
      keyless_active: !!freeLLMApiKey,
      free_routes: ["keller-route-01-gemini-flash"]
    });
  });

  router.get("/google/me", (req, res) => {
    res.json({
      authenticated: false,
      user: null
    });
  });

  router.get("/nexus/me", async (req, res) => {
    const token = req.cookies?.nexus_token;
    if (!token) {
      return res.json({ authenticated: false, user: null });
    }
    // We would fetch user details here using the token
    res.json({
      authenticated: true,
      user: {
        login: "n1-user",
        name: "N+1 Authenticated User"
      }
    });
  });

  return router;
}
