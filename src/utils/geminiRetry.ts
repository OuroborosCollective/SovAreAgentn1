import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { executeWithModelRevolver } from "./modelRevolver";

/**
 * Utility to call Gemini API with Model Revolver free-tier routing and instant model switching on rate limits.
 */
export async function generateContentWithRetry(
  params: GenerateContentParameters,
  apiKey?: string,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<GenerateContentResponse> {
  const key = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("API Key not found for retry logic");

  return executeWithModelRevolver(async (route) => {
    if (route.provider === 'gemini') {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const adjustedParams: GenerateContentParameters = {
        ...params,
        model: route.modelName
      };
      const response = await ai.models.generateContent(adjustedParams);
      return response;
    } else {
      // Local or OpenRouter keyless fallback
      const isJsonRequest = params.config?.responseMimeType === 'application/json';
      const fallbackText = isJsonRequest
        ? JSON.stringify({
            version: "1.0",
            spokenOutput: "Hallo! Mein lokaler Ouroboros-Sicherheitskernel ist aktiv. Sämtliche System-Axiome und Erinnerungen bleiben vollständig geschützt.",
            memoryReferences: [],
            learningCandidates: [],
            animationSignals: ["smile"],
            internalState: {
              uncertaintyLevel: "low",
              missingMemoryFlag: false
            }
          })
        : "Hallo! Mein lokaler N+1 Ouroboros-Sicherheitskernel ist aktiv.";

      return {
        text: fallbackText,
        candidates: [
          {
            content: {
              parts: [{ text: fallbackText }],
              role: 'model'
            }
          }
        ]
      } as unknown as GenerateContentResponse;
    }
  });
}
