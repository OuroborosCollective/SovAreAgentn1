import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

// Server-side key management for automatic failover
interface ServerKeyEntry {
  id: string;
  key: string;
  label: string;
  usageCount: number;
  isActive: boolean;
}

const serverKeyStore: Map<string, ServerKeyEntry> = new Map();
let currentActiveKey: { key: string; id: string } | null = null;

/**
 * Get an API key, trying the current one first, then rotating if needed
 */
function getAvailableApiKey(): string | null {
  // First, check environment variables
  const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (envKey) return envKey;

  // Then check server-side key store
  if (currentActiveKey) {
    const entry = serverKeyStore.get(currentActiveKey.id);
    if (entry && entry.usageCount < 10000) {
      return currentActiveKey.key;
    }
  }

  // Find a key with remaining quota
  const availableKeys = Array.from(serverKeyStore.values())
    .filter(k => k.usageCount < 10000)
    .sort((a, b) => a.usageCount - b.usageCount);

  if (availableKeys.length > 0) {
    const nextKey = availableKeys[0];
    currentActiveKey = { key: nextKey.key, id: nextKey.id };
    return nextKey.key;
  }

  return null;
}

/**
 * Record usage for the current key
 */
function recordKeyUsage(): void {
  if (currentActiveKey) {
    const entry = serverKeyStore.get(currentActiveKey.id);
    if (entry) {
      entry.usageCount++;
      console.log(`[TTS API] Key usage recorded: ${entry.label} (${entry.usageCount}/10000)`);
    }
  }
}

/**
 * Add a key to the server-side store
 */
export function addServerKey(key: string, label?: string): { success: boolean; id?: string; error?: string } {
  if (!key.startsWith('AIza')) {
    return { success: false, error: 'Invalid API key format' };
  }

  // Check for duplicate
  for (const [id, entry] of serverKeyStore) {
    if (entry.key === key) {
      return { success: false, error: 'Key already exists' };
    }
  }

  const id = `server_key_${Date.now()}`;
  serverKeyStore.set(id, {
    id,
    key,
    label: label || `Server Key ${serverKeyStore.size + 1}`,
    usageCount: 0,
    isActive: serverKeyStore.size === 0
  });

  if (serverKeyStore.size === 1) {
    currentActiveKey = { key, id };
  }

  return { success: true, id };
}

/**
 * Remove a key from the server-side store
 */
export function removeServerKey(id: string): boolean {
  const deleted = serverKeyStore.delete(id);
  if (deleted && currentActiveKey?.id === id) {
    // Pick a new active key
    const first = serverKeyStore.values().next().value;
    if (first) {
      currentActiveKey = { key: first.key, id: first.id };
    } else {
      currentActiveKey = null;
    }
  }
  return deleted;
}

/**
 * Get all server-side keys (metadata only)
 */
export function getServerKeys(): Array<{ id: string; label: string; usageCount: number; isActive: boolean }> {
  return Array.from(serverKeyStore.values()).map(k => ({
    id: k.id,
    label: k.label,
    usageCount: k.usageCount,
    isActive: k.id === currentActiveKey?.id
  }));
}

export function createTtsRouter() {
  const router = Router();
  router.post("/", async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      const { text, voiceName, mood } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = getAvailableApiKey();
      if (!apiKey) {
         return res.status(200).json({ 
           status: "fallback", 
           audio: null, 
           contentType: "audio/wav", 
           message: "No TTS API keys configured. Please add a Google AI Studio API key.",
           error: "NO_API_KEY"
         });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let response: any = null;
      let lastError: string | null = null;
      const ttsModels = ["gemini-flash-latest"];

      for (const modelName of ttsModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text }] }],
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
          
          // Success - record usage and rotate if needed
          recordKeyUsage();
          
          const audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          const mimeType = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";
          if (audio) {
            return res.json({ 
              status: "success", 
              audio, 
              contentType: mimeType,
              keyRotated: false
            });
          }
        } catch (e: any) {
          const errMsg = e?.message || String(e);
          lastError = errMsg;
          
          if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
            console.warn(`[TTS API] Key quota exceeded. Attempting rotation.`);
            
            // Rotate to next available key
            const nextKey = getAvailableApiKey();
            if (nextKey && nextKey !== apiKey) {
              console.log(`[TTS API] Rotated to new API key`);
              continue; // Retry with new key
            } else {
              return res.status(200).json({ 
                status: "fallback", 
                audio: null, 
                contentType: "audio/wav", 
                message: "All API keys have exceeded quota. Using client speech synthesis fallback.",
                error: "QUOTA_EXCEEDED",
                allKeysExhausted: true
              });
            }
          } else {
            console.warn(`[TTS API] Model ${modelName} audio notice:`, errMsg);
          }
        }
      }

      // Return 200 with fallback audio: null so client voiceService transitions seamlessly to Web Speech API
      return res.status(200).json({ 
        status: "fallback", 
        audio: null, 
        contentType: "audio/wav", 
        message: lastError || "Server audio generation unavailable; using client speech synthesis fallback."
      });
    } catch (error: any) {
      console.error("[TTS API] Error in TTS endpoint:", error);
      return res.status(200).json({ 
        status: "fallback", 
        audio: null, 
        contentType: "audio/wav", 
        message: error.message 
      });
    }
  });

  // Endpoint to check key status
  router.get("/keys", (_req, res) => {
    res.json({
      status: "success",
      hasEnvKey: !!(process.env.API_KEY || process.env.GEMINI_API_KEY),
      serverKeyCount: serverKeyStore.size,
      currentKeyActive: !!currentActiveKey,
      keys: getServerKeys()
    });
  });

  // Endpoint to add a key
  router.post("/keys", (req, res) => {
    const { key, label } = req.body;
    if (!key) {
      return res.status(400).json({ status: "error", error: "key is required" });
    }
    
    const result = addServerKey(key, label);
    if (result.success) {
      res.status(201).json({ status: "success", id: result.id });
    } else {
      res.status(400).json({ status: "error", error: result.error });
    }
  });

  // Endpoint to remove a key
  router.delete("/keys/:id", (req, res) => {
    const { id } = req.params;
    if (removeServerKey(id)) {
      res.json({ status: "success" });
    } else {
      res.status(404).json({ status: "error", error: "Key not found" });
    }
  });

  return router;
}
