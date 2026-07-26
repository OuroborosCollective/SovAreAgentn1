import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

/**
 * Utility to call Gemini API with exponential backoff retry logic.
 */
export async function generateContentWithRetry(
  params: GenerateContentParameters,
  apiKey?: string,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<GenerateContentResponse> {
  if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
          await window.aistudio.openSelectKey();
      }
  }
  const key = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("API Key not found for retry logic");
  
  const ai = new GoogleGenAI({ apiKey: key });
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429), Service Unavailable (503), or Deadline Exceeded (timeout)
      const isRetryable = 
        error.message?.includes('429') || 
        error.status === 'RESOURCE_EXHAUSTED' ||
        error.message?.includes('503') ||
        error.status === 'UNAVAILABLE' ||
        error.message?.includes('Deadline expired') ||
        error.status === 'DEADLINE_EXCEEDED';
      
      if (isRetryable && attempt < maxRetries) {
        // Extract retry delay if available, otherwise use exponential backoff
        let delay = initialDelay * Math.pow(2, attempt);
        
        // Try to parse the suggested retry delay from the error message if it exists
        const retryMatch = error.message?.match(/retry in ([\d.]+)s/);
        if (retryMatch) {
            delay = (parseFloat(retryMatch[1]) + 1) * 1000; // Add 1s buffer
        }

        console.warn(`Gemini API Error (${error.status || error.message}). Attempt ${attempt + 1}/${maxRetries}. Retrying in ${Math.round(delay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}
