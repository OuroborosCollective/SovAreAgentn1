/**
 * Authentication Rate Limiter Utility
 * 
 * Prevents redundant OAuth & primary API key authentication attempts if consecutive
 * 429 (Too Many Requests / RESOURCE_EXHAUSTED) status codes are detected within a short window.
 * Effectively shields the authentication service and triggers automatic failover to keyless routing.
 */

export interface AuthRateLimiterConfig {
  /** Maximum consecutive 429 errors allowed before shielding (default: 2) */
  consecutiveThreshold: number;
  /** Window duration in milliseconds to evaluate consecutive 429s (default: 30000ms = 30s) */
  timeWindowMs: number;
  /** Cooldown shielding duration in milliseconds (default: 45000ms = 45s) */
  cooldownDurationMs: number;
}

export interface AuthRateLimiterState {
  isShielded: boolean;
  consecutive429Count: number;
  cooldownRemainingSec: number;
  last429Timestamp: number | null;
  total429sRecorded: number;
  totalShieldedAttempts: number;
  activeMode: 'NORMAL' | 'RATE_LIMITED' | 'SHIELD_PROTECTED_KEYLESS';
  reason: string | null;
}

export type RateLimiterListener = (state: AuthRateLimiterState) => void;

export class AuthRateLimiter {
  private config: AuthRateLimiterConfig;
  private consecutive429Count: number = 0;
  private history429Timestamps: number[] = [];
  private shieldUntilTimestamp: number | null = null;
  private total429sRecorded: number = 0;
  private totalShieldedAttempts: number = 0;
  private last429Timestamp: number | null = null;
  private listeners: Set<RateLimiterListener> = new Set();
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<AuthRateLimiterConfig> = {}) {
    this.config = {
      consecutiveThreshold: config.consecutiveThreshold ?? 2,
      timeWindowMs: config.timeWindowMs ?? 30000,
      cooldownDurationMs: config.cooldownDurationMs ?? 45000
    };

    // Start background tick for countdowns
    this.startCountdownTimer();
  }

  private startCountdownTimer() {
    if (typeof window !== 'undefined') {
      this.timerId = setInterval(() => {
        if (this.shieldUntilTimestamp !== null) {
          const now = Date.now();
          if (now >= this.shieldUntilTimestamp) {
            // Shield expired
            this.shieldUntilTimestamp = null;
            this.consecutive429Count = 0;
            this.notifyListeners();
          } else {
            // Tick update
            this.notifyListeners();
          }
        }
      }, 1000);
    }
  }

  /**
   * Subscribe to rate limiter state updates
   */
  public subscribe(listener: RateLimiterListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (e) {
        console.error('[AuthRateLimiter] Listener error:', e);
      }
    });
  }

  /**
   * Checks if an authentication attempt is allowed or if it should be shielded.
   */
  public canAttemptAuth(): boolean {
    const state = this.getState();
    if (state.isShielded) {
      this.totalShieldedAttempts++;
      this.notifyListeners();
      return false;
    }
    return true;
  }

  /**
   * Records a 429 status code or RESOURCE_EXHAUSTED error.
   */
  public record429(endpoint?: string, errorMsg?: string): AuthRateLimiterState {
    const now = Date.now();
    this.last429Timestamp = now;
    this.total429sRecorded++;

    // Filter out old timestamps outside time window
    this.history429Timestamps = this.history429Timestamps.filter(
      ts => now - ts <= this.config.timeWindowMs
    );
    this.history429Timestamps.push(now);

    this.consecutive429Count = this.history429Timestamps.length;

    // Check if threshold breached
    if (this.consecutive429Count >= this.config.consecutiveThreshold) {
      this.shieldUntilTimestamp = now + this.config.cooldownDurationMs;
      console.warn(
        `[AuthRateLimiter] Rate limit shield activated! ${this.consecutive429Count} consecutive 429s detected within ${this.config.timeWindowMs / 1000}s window. Cooldown active for ${this.config.cooldownDurationMs / 1000}s.`
      );
    }

    const state = this.getState();
    this.notifyListeners();
    return state;
  }

  /**
   * Records a successful authentication or ping. Resets consecutive counters.
   */
  public recordSuccess() {
    this.consecutive429Count = 0;
    this.history429Timestamps = [];
    if (this.shieldUntilTimestamp !== null) {
      this.shieldUntilTimestamp = null;
    }
    this.notifyListeners();
  }

  /**
   * Gets current state of the rate limiter.
   */
  public getState(): AuthRateLimiterState {
    const now = Date.now();
    const isShielded = this.shieldUntilTimestamp !== null && now < this.shieldUntilTimestamp;
    const cooldownRemainingSec = isShielded
      ? Math.max(0, Math.ceil((this.shieldUntilTimestamp! - now) / 1000))
      : 0;

    let activeMode: 'NORMAL' | 'RATE_LIMITED' | 'SHIELD_PROTECTED_KEYLESS' = 'NORMAL';
    if (isShielded) {
      activeMode = 'SHIELD_PROTECTED_KEYLESS';
    } else if (this.consecutive429Count > 0) {
      activeMode = 'RATE_LIMITED';
    }

    let reason: string | null = null;
    if (isShielded) {
      reason = `Consecutive 429 quota errors detected (${this.consecutive429Count}/${this.config.consecutiveThreshold}). Shield active for ${cooldownRemainingSec}s.`;
    } else if (this.consecutive429Count > 0) {
      reason = `Detected ${this.consecutive429Count} recent 429 error(s). Approaching rate limit threshold.`;
    }

    return {
      isShielded,
      consecutive429Count: this.consecutive429Count,
      cooldownRemainingSec,
      last429Timestamp: this.last429Timestamp,
      total429sRecorded: this.total429sRecorded,
      totalShieldedAttempts: this.totalShieldedAttempts,
      activeMode,
      reason
    };
  }

  /**
   * Manually resets rate limiter shield and counters.
   */
  public reset() {
    this.consecutive429Count = 0;
    this.history429Timestamps = [];
    this.shieldUntilTimestamp = null;
    this.notifyListeners();
  }

  /**
   * Cleans up background timer
   */
  public destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.listeners.clear();
  }
}

// Global Singleton Instance
export const authRateLimiter = new AuthRateLimiter({
  consecutiveThreshold: 2,
  timeWindowMs: 30000,
  cooldownDurationMs: 45000
});
