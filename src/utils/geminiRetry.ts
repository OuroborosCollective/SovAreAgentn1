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
  if (typeof window !== 'undefined' && window.aistudio) {
      try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
              await window.aistudio.openSelectKey();
          }
      } catch (e) {
          // Ignore window.aistudio if not available in container runtime
      }
  }
  const key = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("API Key not found for retry logic");

  return executeWithModelRevolver(async (route) => {
    const ai = new GoogleGenAI({ apiKey: key });
    const adjustedParams: GenerateContentParameters = {
      ...params,
      model: route.modelName
    };
    const response = await ai.models.generateContent(adjustedParams);
    return response;
  });
}
