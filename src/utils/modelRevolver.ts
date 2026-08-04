/**
 * Model Revolver & Free Tier Router for Sovereign Studio ATO
 * Replaces legacy litellm with OpenRouter free routes, rotated Gemini free-tier models,
 * and keyless fallback revolver to eliminate rate-limit wait times and enable autonomous self-healing.
 */

export interface ModelRoute {
  provider: 'gemini' | 'openrouter';
  modelName: string;
  isFreeTier: boolean;
  priority: number;
}

export const FREE_TIER_REVOLVER_ROUTES: ModelRoute[] = [
  { provider: 'gemini', modelName: 'gemini-2.5-flash', isFreeTier: true, priority: 1 },
  { provider: 'gemini', modelName: 'gemini-flash-latest', isFreeTier: true, priority: 2 },
  { provider: 'gemini', modelName: 'gemini-2.0-flash', isFreeTier: true, priority: 3 },
  { provider: 'gemini', modelName: 'gemini-1.5-flash', isFreeTier: true, priority: 4 },
  { provider: 'openrouter', modelName: 'openrouter/auto', isFreeTier: true, priority: 5 },
  { provider: 'openrouter', modelName: 'deepseek/deepseek-chat:free', isFreeTier: true, priority: 6 }
];

let currentRouteIndex = 0;

export function getNextFreeRoute(): ModelRoute {
  const route = FREE_TIER_REVOLVER_ROUTES[currentRouteIndex];
  currentRouteIndex = (currentRouteIndex + 1) % FREE_TIER_REVOLVER_ROUTES.length;
  return route;
}

export function reportRouteFailure(modelName: string) {
  console.warn(`[ModelRevolver] Route failure reported for ${modelName}. Rotating to next free-tier route immediately.`);
  currentRouteIndex = (currentRouteIndex + 1) % FREE_TIER_REVOLVER_ROUTES.length;
}

export async function executeWithModelRevolver(
  taskRunner: (route: ModelRoute) => Promise<any>
): Promise<any> {
  const maxAttempts = FREE_TIER_REVOLVER_ROUTES.length;
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const route = getNextFreeRoute();
    try {
      console.log(`[ModelRevolver] Executing with route: ${route.provider}/${route.modelName} (attempt ${attempt + 1}/${maxAttempts})`);
      const result = await taskRunner(route);
      return result;
    } catch (error: any) {
      lastError = error;
      const isRateLimit = 
        error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('resource_exhausted') ||
        error?.message?.includes('Quota exceeded') ||
        error?.message?.includes('rate limit');

      if (isRateLimit) {
        console.warn(`[ModelRevolver] Quota/Rate limit encountered on ${route.modelName}. Switching model route instantly with zero wait time.`);
        reportRouteFailure(route.modelName);
        continue;
      } else {
        // For other errors, still try next route or throw if last attempt
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
  }

  throw lastError || new Error('All free-tier revolver routes exhausted.');
}
