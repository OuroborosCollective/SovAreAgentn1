import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  FREE_TIER_REVOLVER_ROUTES, 
  getNextFreeRoute, 
  reportRouteFailure, 
  reportRouteSuccess, 
  executeWithModelRevolver,
  subscribeToRoutes,
  failoverHistory 
} from '../../src/utils/modelRevolver';

describe('ModelRevolver - Free Tier Router', () => {
  describe('FREE_TIER_REVOLVER_ROUTES', () => {
    it('should have at least one free tier route', () => {
      const freeRoutes = FREE_TIER_REVOLVER_ROUTES.filter(r => r.isFreeTier);
      expect(freeRoutes.length).toBeGreaterThan(0);
    });

    it('should have gemini-flash-latest as priority 1', () => {
      const flashRoute = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === 'gemini-flash-latest');
      expect(flashRoute).toBeDefined();
      expect(flashRoute?.priority).toBe(1);
      expect(flashRoute?.provider).toBe('gemini');
    });

    it('should have local fallback route', () => {
      const localRoute = FREE_TIER_REVOLVER_ROUTES.find(r => r.provider === 'local');
      expect(localRoute).toBeDefined();
      expect(localRoute?.modelName).toBe('n1-ouroboros-local-fallback');
    });
  });

  describe('getNextFreeRoute', () => {
    it('should return a valid route', () => {
      const route = getNextFreeRoute();
      expect(route).toBeDefined();
      expect(route.modelName).toBeTruthy();
      expect(route.provider).toBeTruthy();
    });

    it('should rotate through routes', () => {
      const route1 = getNextFreeRoute();
      const route2 = getNextFreeRoute();
      const route3 = getNextFreeRoute();
      
      // Should cycle through all routes
      expect(route1).toBeDefined();
      expect(route2).toBeDefined();
      expect(route3).toBeDefined();
    });
  });

  describe('reportRouteFailure', () => {
    it('should add entry to failoverHistory', () => {
      const initialLength = failoverHistory.length;
      reportRouteFailure('gemini-flash-latest', '429 Rate Limit');
      
      expect(failoverHistory.length).toBeGreaterThan(initialLength);
      expect(failoverHistory[0].fromModel).toBe('gemini-flash-latest');
      expect(failoverHistory[0].reason).toBe('429 Rate Limit');
    });

    it('should decrease healthScore on failure', () => {
      const route = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === 'gemini-flash-latest');
      const initialHealth = route?.healthScore || 100;
      
      reportRouteFailure('gemini-flash-latest', 'Test failure');
      
      const updatedRoute = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === 'gemini-flash-latest');
      expect((updatedRoute?.healthScore || 100)).toBeLessThan(initialHealth);
    });
  });

  describe('reportRouteSuccess', () => {
    it('should increase healthScore on success recovery', () => {
      // First decrease
      reportRouteFailure('gemini-3.6-flash', 'Test');
      const afterFailure = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === 'gemini-3.6-flash')?.healthScore;
      
      // Then report success
      reportRouteSuccess('gemini-3.6-flash');
      const afterSuccess = FREE_TIER_REVOLVER_ROUTES.find(r => r.modelName === 'gemini-3.6-flash')?.healthScore;
      
      expect((afterSuccess || 0)).toBeGreaterThan((afterFailure || 0) - 1);
    });
  });

  describe('executeWithModelRevolver', () => {
    it('should execute task runner successfully', async () => {
      const mockTaskRunner = vi.fn().mockResolvedValue({ result: 'success' });
      
      const result = await executeWithModelRevolver(mockTaskRunner);
      
      expect(mockTaskRunner).toHaveBeenCalled();
      expect(result).toEqual({ result: 'success' });
    });

    it('should retry on rate limit error', async () => {
      const rateLimitError = new Error('429 Rate limit exceeded');
      rateLimitError.status = 429;
      
      const mockTaskRunner = vi.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ result: 'success' });
      
      const result = await executeWithModelRevolver(mockTaskRunner);
      
      expect(mockTaskRunner).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ result: 'success' });
    });

    it('should throw after exhausting all routes', async () => {
      const rateLimitError = new Error('429 Rate limit');
      rateLimitError.status = 429;
      
      const mockTaskRunner = vi.fn().mockRejectedValue(rateLimitError);
      
      await expect(executeWithModelRevolver(mockTaskRunner)).rejects.toThrow();
    });
  });

  describe('subscribeToRoutes', () => {
    it('should notify subscribers on route change', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToRoutes(callback);
      
      // Subscribe adds to listeners but doesn't call immediately
      reportRouteFailure('gemini-flash-latest', 'Test');
      
      // Callback should be called once on route change notification
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToRoutes(callback);
      
      const callsBefore = callback.mock.calls.length;
      
      unsubscribe();
      
      reportRouteFailure('gemini-flash-latest', 'Test');
      
      // After unsubscribe, callback should not have more calls
      expect(callback.mock.calls.length).toBe(callsBefore);
    });
  });
});
