import { describe, it, expect, vi } from 'vitest';
import { executeWithModelRevolver, getNextFreeRoute, reportRouteFailure, subscribeToRoutes } from '../../src/utils/modelRevolver';

describe('ModelRevolver Autoheal & Failover', () => {
  it('should execute successfully on first try if no rate limit', async () => {
    const mockTask = vi.fn().mockResolvedValue('success');
    
    const result = await executeWithModelRevolver(mockTask);
    
    expect(result).toBe('success');
    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it('should autoheal and failover to next route on 429 rate limit error', async () => {
    let attempts = 0;
    const mockTask = vi.fn().mockImplementation(async (route) => {
      attempts++;
      if (attempts === 1) {
        throw { status: 429, message: 'Quota exceeded' };
      }
      return 'success_on_fallback';
    });
    
    const result = await executeWithModelRevolver(mockTask);
    
    expect(result).toBe('success_on_fallback');
    expect(mockTask).toHaveBeenCalledTimes(2);
  });

  it('should exhaust routes and throw if all fail with 429', async () => {
    const mockTask = vi.fn().mockImplementation(async () => {
      throw { status: 429, message: 'Quota exceeded' };
    });
    
    await expect(executeWithModelRevolver(mockTask)).rejects.toThrow();
  });
});

