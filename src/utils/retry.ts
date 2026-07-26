/**
 * Utility to execute a fetch request with exponential backoff retry logic.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If the response is successful, return it
      if (response.ok) {
        return response;
      }
      
      // If it's a server error (5xx), we might want to retry
      if (response.status >= 500 && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // If it's a client error (4xx) that's not 429, don't retry
      if (response.status !== 429) {
        return response;
      }
      
      // If it's 429 (Too Many Requests), retry
      throw new Error(`Rate limit exceeded: ${response.status}`);
      
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Fetch Error (${error.message}). Attempt ${attempt + 1}/${maxRetries}. Retrying in ${Math.round(delay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  
  throw lastError;
}
