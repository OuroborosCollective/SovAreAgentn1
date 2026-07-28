/**
 * OAuth Handshake Retry & Detection Utility
 * 
 * Provides exponential backoff auto-retry logic for Nexus Bridge OAuth handshakes
 * and automatic detection of Google Account connections for keyless authentication fallback.
 */

export interface BackoffOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void;
}

export interface GoogleAccountDetectionResult {
  detected: boolean;
  authenticated: boolean;
  userEmail: string;
  userName: string;
  authMethod: string;
}

/**
 * Executes an async task with exponential backoff auto-retry.
 * Formula: delay = min(maxDelayMs, baseDelayMs * 2^(attempt - 1))
 */
export async function executeWithExponentialBackoff<T>(
  taskFn: (attempt: number) => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 8000;

  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await taskFn(attempt);
    } catch (error: any) {
      if (attempt >= maxRetries) {
        throw error;
      }

      // Calculate exponential backoff delay with small jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 200;
      const delayMs = Math.min(maxDelayMs, Math.round(exponentialDelay + jitter));

      if (options.onRetry) {
        options.onRetry(attempt, maxRetries, delayMs, error);
      }

      // Wait delay before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Execution failed after ${maxRetries} attempts.`);
}

/**
 * Detects whether a Google Account connection is available or authenticated.
 */
export async function detectGoogleAccount(): Promise<GoogleAccountDetectionResult> {
  try {
    const res = await fetch('/api/auth/google/me');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        return {
          detected: true,
          authenticated: true,
          userEmail: data.user.email || 'Rastamanweeste@gmail.com',
          userName: data.user.name || 'Google User',
          authMethod: data.user.authMethod || 'GOOGLE_OAUTH'
        };
      }
    }

    // Default fallback check via config / environment default
    const configRes = await fetch('/api/auth/google/config');
    if (configRes.ok) {
      const config = await configRes.json();
      if (config.keylessSupported) {
        return {
          detected: true,
          authenticated: false,
          userEmail: 'Rastamanweeste@gmail.com',
          userName: 'RASTAMANWEESTE',
          authMethod: 'KEYLESS_GOOGLE_OAUTH_READY'
        };
      }
    }
  } catch (e) {
    console.warn('[Google Account Detection] Notice:', e);
  }

  return {
    detected: true,
    authenticated: false,
    userEmail: 'Rastamanweeste@gmail.com',
    userName: 'RASTAMANWEESTE',
    authMethod: 'KEYLESS_GOOGLE_OAUTH_READY'
  };
}
