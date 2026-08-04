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
         return res.status(200).json({ status: "fallback", audio: null, message: "TTS API key not configured on server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      let response: any = null;
      const ttsModels = ["gemini-flash-latest"];

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
            console.warn(`[TTS API] Model ${modelName} audio notice:`, errMsg);
          }
        }
      }

      // Return 200 with fallback audio: null so client voiceService transitions seamlessly to Web Speech API
      return res.status(200).json({ status: "fallback", audio: null, message: "Server audio generation unavailable; using client speech synthesis fallback." });
    } catch (error: any) {
      console.error("[TTS API] Error in TTS endpoint:", error);
      return res.status(200).json({ status: "fallback", audio: null, message: error.message });
    }
  });
  return router;
}
