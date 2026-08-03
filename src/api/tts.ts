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
      const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-live-preview",
          contents: [{ parts: [{ text: `[Voice directive: ${mood || 'fröhlich'}] ${text}` }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName === "N+1" ? "Aoede" : "Aoede", // mapping to actual gemini voices
                }
              }
            }
          }
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
         return res.json({ status: "success", audio: base64Audio });
      } else {
         return res.status(500).json({ error: "No audio generated" });
      }
    } catch (error: any) {
      console.error("[TTS API] Error generating audio:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  return router;
}
