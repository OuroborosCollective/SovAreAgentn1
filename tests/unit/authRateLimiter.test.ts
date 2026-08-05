import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthRateLimiter, AuthRateLimiterState } from '../../src/utils/authRateLimiter';

describe('AuthRateLimiter', () => {
  let rateLimiter: AuthRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new AuthRateLimiter({
      consecutiveThreshold: 2,
      timeWindowMs: 30000,
      cooldownDurationMs: 45000
    });
  });

  afterEach(() => {
    rateLimiter.destroy();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default config values when no config provided', () => {
      const defaultLimiter = new AuthRateLimiter();
      expect(defaultLimiter).toBeDefined();
      defaultLimiter.destroy();
    });

    it('should accept custom consecutiveThreshold', () => {
      const customLimiter = new AuthRateLimiter({ consecutiveThreshold: 5 });
      expect(customLimiter).toBeDefined();
      customLimiter.destroy();
    });

    it('should accept custom timeWindowMs', () => {
      const customLimiter = new AuthRateLimiter({ timeWindowMs: 60000 });
      expect(customLimiter).toBeDefined();
      customLimiter.destroy();
    });

    it('should accept custom cooldownDurationMs', () => {
      const customLimiter = new AuthRateLimiter({ cooldownDurationMs: 60000 });
      expect(customLimiter).toBeDefined();
      customLimiter.destroy();
    });
  });

  describe('getState', () => {
    it('should return initial state with isShielded false', () => {
      const state = rateLimiter.getState();
      expect(state.isShielded).toBe(false);
    });

    it('should return initial consecutive429Count of 0', () => {
      const state = rateLimiter.getState();
      expect(state.consecutive429Count).toBe(0);
    });

    it('should return initial cooldownRemainingSec of 0', () => {
      const state = rateLimiter.getState();
      expect(state.cooldownRemainingSec).toBe(0);
    });

    it('should return NORMAL activeMode initially', () => {
      const state = rateLimiter.getState();
      expect(state.activeMode).toBe('NORMAL');
    });

    it('should have null reason initially', () => {
      const state = rateLimiter.getState();
      expect(state.reason).toBeNull();
    });

    it('should have zero total429sRecorded initially', () => {
      const state = rateLimiter.getState();
      expect(state.total429sRecorded).toBe(0);
    });

    it('should have zero totalShieldedAttempts initially', () => {
      const state = rateLimiter.getState();
      expect(state.totalShieldedAttempts).toBe(0);
    });
  });

  describe('canAttemptAuth', () => {
    it('should return true when not shielded', () => {
      expect(rateLimiter.canAttemptAuth()).toBe(true);
    });

    it('should return false when shielded', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(1000);
      
      expect(rateLimiter.canAttemptAuth()).toBe(false);
    });

    it('should increment totalShieldedAttempts when shielded and called', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(1000);
      
      rateLimiter.canAttemptAuth();
      const state = rateLimiter.getState();
      
      expect(state.totalShieldedAttempts).toBe(1);
    });
  });

  describe('record429', () => {
    it('should increment consecutive429Count', () => {
      rateLimiter.record429();
      const state = rateLimiter.getState();
      expect(state.consecutive429Count).toBe(1);
    });

    it('should set last429Timestamp', () => {
      const beforeTime = Date.now();
      rateLimiter.record429();
      const afterTime = Date.now();
      
      const state = rateLimiter.getState();
      expect(state.last429Timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(state.last429Timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should increment total429sRecorded', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      
      const state = rateLimiter.getState();
      expect(state.total429sRecorded).toBe(2);
    });

    it('should not shield after first 429 (below threshold)', () => {
      rateLimiter.record429();
      const state = rateLimiter.getState();
      
      expect(state.isShielded).toBe(false);
      expect(state.activeMode).toBe('RATE_LIMITED');
    });

    it('should shield after reaching consecutive threshold', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      const state = rateLimiter.getState();
      expect(state.isShielded).toBe(true);
      expect(state.activeMode).toBe('SHIELD_PROTECTED_KEYLESS');
    });

    it('should return state after recording', () => {
      const returnedState = rateLimiter.record429();
      expect(returnedState.consecutive429Count).toBe(1);
    });

    it('should set reason when approaching threshold', () => {
      rateLimiter.record429();
      const state = rateLimiter.getState();
      
      expect(state.reason).toContain('1 recent 429 error');
    });

    it('should set detailed reason when shielded', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      const state = rateLimiter.getState();
      expect(state.reason).toContain('Consecutive 429 quota errors detected');
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive429Count to 0', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      rateLimiter.recordSuccess();
      
      const state = rateLimiter.getState();
      expect(state.consecutive429Count).toBe(0);
    });

    it('should clear shield', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      expect(rateLimiter.getState().isShielded).toBe(true);
      
      rateLimiter.recordSuccess();
      
      expect(rateLimiter.getState().isShielded).toBe(false);
    });

    it('should reset activeMode to NORMAL', () => {
      rateLimiter.record429();
      rateLimiter.recordSuccess();
      
      const state = rateLimiter.getState();
      expect(state.activeMode).toBe('NORMAL');
    });

    it('should clear reason', () => {
      rateLimiter.record429();
      rateLimiter.recordSuccess();
      
      const state = rateLimiter.getState();
      expect(state.reason).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset consecutive429Count to 0', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      rateLimiter.reset();
      
      const state = rateLimiter.getState();
      expect(state.consecutive429Count).toBe(0);
    });

    it('should clear shield', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      expect(rateLimiter.getState().isShielded).toBe(true);
      
      rateLimiter.reset();
      
      expect(rateLimiter.getState().isShielded).toBe(false);
    });

    it('should not clear last429Timestamp (only consecutive429Count and history are cleared)', () => {
      rateLimiter.record429();
      rateLimiter.reset();
      
      const state = rateLimiter.getState();
      // Note: last429Timestamp is NOT cleared by reset() - this is intentional
      // The reset clears the tracking of 429s but preserves the timestamp of the last one
      expect(state.last429Timestamp).not.toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should call listener immediately with current state', () => {
      const listener = vi.fn();
      rateLimiter.subscribe(listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        isShielded: false,
        consecutive429Count: 0
      }));
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = rateLimiter.subscribe(listener);
      
      unsubscribe();
      
      rateLimiter.record429();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should call listener on state changes', () => {
      const listener = vi.fn();
      rateLimiter.subscribe(listener);
      
      rateLimiter.record429();
      
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('cooldown timing', () => {
    it('should calculate correct cooldownRemainingSec when shielded', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      const state = rateLimiter.getState();
      expect(state.cooldownRemainingSec).toBe(45); // 45000ms = 45s
    });

    it('should track that client is shielded after reaching threshold', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      const state = rateLimiter.getState();
      expect(state.isShielded).toBe(true);
      expect(state.activeMode).toBe('SHIELD_PROTECTED_KEYLESS');
    });

    it('should clear shield when manually reset', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      vi.advanceTimersByTime(100);
      
      expect(rateLimiter.getState().isShielded).toBe(true);
      
      rateLimiter.reset();
      
      expect(rateLimiter.getState().isShielded).toBe(false);
    });

    it('should reset consecutive429Count when manually reset', () => {
      rateLimiter.record429();
      rateLimiter.record429();
      
      expect(rateLimiter.getState().consecutive429Count).toBe(2);
      
      rateLimiter.reset();
      
      expect(rateLimiter.getState().consecutive429Count).toBe(0);
    });
  });
});
