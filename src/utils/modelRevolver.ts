/**
 * Model Revolver & Free Tier Router for Sovereign Studio ATO
 * Replaces legacy litellm with OpenRouter free routes, rotated Gemini free-tier models,
 * and keyless fallback revolver to eliminate rate-limit wait times and enable autonomous self-healing.
 */

export interface ModelRoute {
  provider: 'gemini' | 'openrouter' | 'local';
  modelName: string;
  isFreeTier: boolean;
  priority: number;
  healthScore?: number;
}

export const FREE_TIER_REVOLVER_ROUTES: ModelRoute[] = [
  { provider: 'gemini', modelName: 'gemini-flash-latest', isFreeTier: true, priority: 1, healthScore: 100 },
  { provider: 'gemini', modelName: 'gemini-3.6-flash', isFreeTier: true, priority: 2, healthScore: 100 },
  { provider: 'gemini', modelName: 'gemini-3.1-flash-lite', isFreeTier: true, priority: 3, healthScore: 100 },
  { provider: 'gemini', modelName: 'gemini-3.1-pro-preview', isFreeTier: false, priority: 4, healthScore: 100 },
  { provider: 'local', modelName: 'n1-ouroboros-local-fallback', isFreeTier: true, priority: 5, healthScore: 100 }
];

let currentRouteIndex = 0;
export const failoverHistory: Array<{ timestamp: number; fromModel: string; toModel: string; reason: string }> = [];
const routeListeners: Set<() => void> = new Set();

export function subscribeToRoutes(callback: () => void) {
  routeListeners.add(callback);
  return () => { routeListeners.delete(callback); };
}

function notifyRouteUpdate() {
  routeListeners.forEach(cb => cb());
}

export function getNextFreeRoute(): ModelRoute {
  const route = FREE_TIER_REVOLVER_ROUTES[currentRouteIndex];
  currentRouteIndex = (currentRouteIndex + 1) % FREE_TIER_REVOLVER_ROUTES.length;
  return route;
}

export function reportRouteFailure(modelName: string, reason: string = 'Unknown Failure') {
  console.warn(`[ModelRevolver] Route failure reported for ${modelName}. Rotating to next free-tier route immediately.`);
  
  const failedRoute = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === modelName);
  if (failedRoute) {
    failedRoute.healthScore = Math.max(0, (failedRoute.healthScore || 100) - 25);
  }

  const nextRoute = FREE_TIER_REVOLVER_ROUTES[(currentRouteIndex + 1) % FREE_TIER_REVOLVER_ROUTES.length];
  
  failoverHistory.unshift({
    timestamp: Date.now(),
    fromModel: modelName,
    toModel: nextRoute.modelName,
    reason
  });
  
  if (failoverHistory.length > 20) failoverHistory.pop();
  
  currentRouteIndex = (currentRouteIndex + 1) % FREE_TIER_REVOLVER_ROUTES.length;
  notifyRouteUpdate();
}

export function reportRouteSuccess(modelName: string) {
  const route = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === modelName);
  if (route && (route.healthScore || 0) < 100) {
    route.healthScore = Math.min(100, (route.healthScore || 0) + 5);
    notifyRouteUpdate();
  }
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
      reportRouteSuccess(route.modelName);
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
        reportRouteFailure(route.modelName, 'Rate Limit (429) / Quota Exceeded');
        continue;
      } else {
        reportRouteFailure(route.modelName, error?.message || 'Unknown Failure');
        // For other errors, still try next route or throw if last attempt
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
  }

  throw lastError || new Error('All free-tier revolver routes exhausted.');
}
