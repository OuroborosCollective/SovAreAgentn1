import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

export function createTtsRouter() {
  const router = Router();
  router.post("/", async (req, res) => {
    try {
      const { text, voiceName, mood } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(503).json({ error: "TTS provider API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      let response: any = null;
      const ttsModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      let lastError: any = null;

      for (const modelName of ttsModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: text }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: (voiceName && voiceName !== "N+1") ? voiceName : "Puck",
                  }
                }
              }
            }
          });
          const audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audio) {
            return res.json({ status: "success", audio });
          }
        } catch (e: any) {
          const errMsg = e?.message || String(e);
          if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            console.warn(`[TTS API] Model ${modelName} rate limited (429).`);
          } else {
            console.warn(`[TTS API] Model ${modelName} unavailable:`, errMsg);
          }
          lastError = e;
        }
      }

      return res.status(500).json({ error: lastError?.message || "No audio generated from TTS models" });
    } catch (error: any) {
      console.error("[TTS API] Error generating audio:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  return router;
}
