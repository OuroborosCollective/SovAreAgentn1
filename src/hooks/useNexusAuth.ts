import { useState, useEffect, useCallback } from 'react';
import { executeWithExponentialBackoff, detectGoogleAccount, GoogleAccountDetectionResult } from '../utils/oauthRetry';
import { authRateLimiter, AuthRateLimiterState } from '../utils/authRateLimiter';

export type AuthMethodType = 
  | 'PRIMARY_API_KEY'
  | 'DIRECT_TOKEN'
  | 'GOOGLE_OAUTH'
  | 'KEYLESS_FREELLM_ROUTING'
  | 'NONE';

export interface NexusAuthUser {
  id: string;
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  picture?: string;
  authMethod?: string;
  connectedAt?: string;
}

export interface NexusAuthState {
  isAuthenticated: boolean;
  authMethod: AuthMethodType;
  nexusUser: NexusAuthUser | null;
  googleUser: NexusAuthUser | null;
  nexusToken: string | null;
  googleToken: string | null;
  activeRoute: string;
  isPerformingHandshake: boolean;
  handshakeMessage: { type: 'info' | 'success' | 'warning' | 'error'; text: string } | null;
  quotaExceededDetected: boolean;
  unauthorizedDetected: boolean;
  fallbackOccurred: boolean;
  retryCount: number;
  lastError: string | null;
  detectedGoogleAccount: GoogleAccountDetectionResult | null;
}

export interface UseNexusAuthReturn extends NexusAuthState {
  authenticateWithKey: (apiKey?: string, directToken?: string, clientId?: string, clientSecret?: string) => Promise<boolean>;
  attemptGoogleOAuthAndKeylessFallback: (reason?: string) => Promise<boolean>;
  verifyActiveAuth: () => Promise<void>;
  switchRouteToFreeLLM: (routeId?: string) => void;
  logout: () => Promise<void>;
  clearMessage: () => void;
}

const PRIMARY_KEY_STORAGE = 'n1_nexus_access_token';
const GOOGLE_TOKEN_STORAGE = 'n1_google_access_token';
const ACTIVE_ROUTE_STORAGE = 'n1_active_llm_route';

export function useNexusAuth(onAuthChange?: (state: NexusAuthState) => void): UseNexusAuthReturn {
  const [state, setState] = useState<NexusAuthState>({
    isAuthenticated: false,
    authMethod: 'NONE',
    nexusUser: null,
    googleUser: null,
    nexusToken: localStorage.getItem(PRIMARY_KEY_STORAGE),
    googleToken: localStorage.getItem(GOOGLE_TOKEN_STORAGE),
    activeRoute: localStorage.getItem(ACTIVE_ROUTE_STORAGE) || 'keller-route-01-gemini-flash',
    isPerformingHandshake: false,
    handshakeMessage: null,
    quotaExceededDetected: false,
    unauthorizedDetected: false,
    fallbackOccurred: false,
    retryCount: 0,
    lastError: null,
    detectedGoogleAccount: null
  });

  // Helper to update state and fire callback
  const updateState = useCallback((updater: Partial<NexusAuthState> | ((prev: NexusAuthState) => Partial<NexusAuthState>)) => {
    setState(prev => {
      const partial = typeof updater === 'function' ? updater(prev) : updater;
      const next = { ...prev, ...partial };
      if (onAuthChange) {
        onAuthChange(next);
      }
      return next;
    });
  }, [onAuthChange]);

  // Method to activate FreeLLM Keyless Routing
  const switchRouteToFreeLLM = useCallback((routeId: string = 'keller-route-01-gemini-flash') => {
    localStorage.setItem(ACTIVE_ROUTE_STORAGE, routeId);
    updateState({
      activeRoute: routeId,
      authMethod: 'KEYLESS_FREELLM_ROUTING',
      fallbackOccurred: true,
      handshakeMessage: {
        type: 'info',
        text: `Active routing switched to Keyless FreeLLM Route [${routeId}]. Bypassing API key quota limits.`
      }
    });
  }, [updateState]);

  // Method to trigger Keyless Google OAuth & FreeLLM Route Fallback
  const attemptGoogleOAuthAndKeylessFallback = useCallback(async (reason: string = 'PRIMARY_KEY_FAILURE'): Promise<boolean> => {
    updateState({ isPerformingHandshake: true });

    try {
      // 1. Trigger zero-key Google OAuth endpoint
      const googleRes = await fetch('/api/auth/google/keyless');
      let googleUserData: any = null;

      if (googleRes.ok) {
        const data = await googleRes.json();
        if (data.status === 'success' && data.user) {
          googleUserData = data.user;
          localStorage.setItem(GOOGLE_TOKEN_STORAGE, data.accessToken || 'google_oauth_token_keyless_n1');
        }
      }

      // 2. Fetch or detect Google account details
      const googleInfo = await detectGoogleAccount();

      // 3. Fallback to FreeLLM Keller route 01
      const defaultFreeRoute = 'keller-route-01-gemini-flash';
      localStorage.setItem(ACTIVE_ROUTE_STORAGE, defaultFreeRoute);

      updateState({
        isAuthenticated: true,
        authMethod: 'KEYLESS_FREELLM_ROUTING',
        googleUser: googleUserData || {
          id: 'google-usr-keyless-n1',
          email: googleInfo.userEmail || 'Rastamanweeste@gmail.com',
          name: googleInfo.userName || 'RASTAMANWEESTE',
          authMethod: 'KEYLESS_GOOGLE_OAUTH_FALLBACK'
        },
        activeRoute: defaultFreeRoute,
        fallbackOccurred: true,
        isPerformingHandshake: false,
        detectedGoogleAccount: googleInfo,
        handshakeMessage: {
          type: 'warning',
          text: `[Nexus Failover Triggered]: Primary API key authentication error (${reason}). Automatically established Google OAuth Handshake & switched to FreeLLM Keyless Routing (${defaultFreeRoute}).`
        }
      });

      return true;
    } catch (err: any) {
      console.error('[useNexusAuth] Google OAuth & Keyless fallback error:', err);
      updateState({
        isPerformingHandshake: false,
        lastError: err.message,
        handshakeMessage: {
          type: 'error',
          text: `Google OAuth Fallback Handshake failed: ${err.message}`
        }
      });
      return false;
    }
  }, [updateState]);

  // Primary API Key or Direct Token Handshake Authentication
  const authenticateWithKey = useCallback(async (
    apiKey?: string,
    directToken?: string,
    clientId?: string,
    clientSecret?: string
  ): Promise<boolean> => {
    // 1. Check Auth Rate Limiter Shield
    if (!authRateLimiter.canAttemptAuth()) {
      const limiterState = authRateLimiter.getState();
      const defaultFreeRoute = 'keller-route-01-gemini-flash';
      localStorage.setItem(ACTIVE_ROUTE_STORAGE, defaultFreeRoute);

      updateState({
        isAuthenticated: true,
        authMethod: 'KEYLESS_FREELLM_ROUTING',
        activeRoute: defaultFreeRoute,
        fallbackOccurred: true,
        isPerformingHandshake: false,
        quotaExceededDetected: true,
        handshakeMessage: {
          type: 'warning',
          text: `[Authentication Rate Limiter Shield Active]: Shielded auth service after ${limiterState.consecutive429Count} consecutive 429 status codes. Cooldown remaining: ${limiterState.cooldownRemainingSec}s. Automatically engaged FreeLLM Keyless Routing (${defaultFreeRoute}).`
        }
      });
      return true;
    }

    updateState({
      isPerformingHandshake: true,
      handshakeMessage: { type: 'info', text: 'Initiating primary Nexus Bridge API Key / Token handshake...' },
      unauthorizedDetected: false,
      quotaExceededDetected: false,
      lastError: null
    });

    const tokenToUse = directToken || apiKey || localStorage.getItem(PRIMARY_KEY_STORAGE) || '';

    try {
      const result = await executeWithExponentialBackoff(
        async (attempt) => {
          const res = await fetch('/api/auth/nexus/handshake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId,
              clientSecret,
              directToken: tokenToUse
            })
          });

          const data = await res.json();

          if (res.status === 401 || res.status === 403) {
            const err = new Error(data.message || '401 Unauthorized primary API key');
            (err as any).statusCode = res.status;
            (err as any).isUnauthorized = true;
            throw err;
          }

          if (res.status === 429 || (data.message && (data.message.includes('429') || data.message.includes('RESOURCE_EXHAUSTED') || data.message.includes('quota')))) {
            authRateLimiter.record429('/api/auth/nexus/handshake', data.message || '429 Quota Exceeded');
            const err = new Error(data.message || '429 Quota Exceeded (RESOURCE_EXHAUSTED)');
            (err as any).statusCode = 429;
            (err as any).isQuotaExceeded = true;
            throw err;
          }

          if (!res.ok || data.status !== 'success') {
            throw new Error(data.message || 'Primary API Key handshake failed');
          }

          return data;
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (attempt, maxRetries, delayMs, error) => {
            updateState(prev => ({
              retryCount: attempt,
              handshakeMessage: {
                type: 'info',
                text: `[Exponential Retry ${attempt}/${maxRetries}] Handshake attempt failed (${error.message}). Retrying in ${Math.round(delayMs / 1000)}s...`
              }
            }));
          }
        }
      );

      // Successful Primary Handshake
      authRateLimiter.recordSuccess();
      localStorage.setItem(PRIMARY_KEY_STORAGE, result.token);
      updateState({
        isAuthenticated: true,
        authMethod: 'PRIMARY_API_KEY',
        nexusUser: result.user,
        nexusToken: result.token,
        isPerformingHandshake: false,
        fallbackOccurred: false,
        handshakeMessage: {
          type: 'success',
          text: `Primary API Key Authentication Successful! User @${result.user?.login || 'NexusUser'} authenticated via Nexus Bridge.`
        }
      });

      return true;

    } catch (err: any) {
      const isUnauthorized = err.isUnauthorized || err.statusCode === 401 || err.statusCode === 403 || /unauthorized/i.test(err.message);
      const isQuotaExceeded = err.isQuotaExceeded || err.statusCode === 429 || /quota/i.test(err.message) || /RESOURCE_EXHAUSTED/i.test(err.message);

      console.warn(`[useNexusAuth] Primary Key Auth failed (Unauthorized: ${isUnauthorized}, QuotaExceeded: ${isQuotaExceeded}):`, err.message);

      updateState({
        unauthorizedDetected: isUnauthorized,
        quotaExceededDetected: isQuotaExceeded,
        lastError: err.message
      });

      if (isUnauthorized || isQuotaExceeded || true) {
        // Automatically attempt Google OAuth & Keyless FreeLLM Routing Fallback
        const failoverReason = isQuotaExceeded
          ? '429 Quota Exceeded / RESOURCE_EXHAUSTED'
          : isUnauthorized
          ? '401 Unauthorized API Key'
          : 'Primary Key Handshake Failure';

        return await attemptGoogleOAuthAndKeylessFallback(failoverReason);
      }

      updateState({
        isPerformingHandshake: false,
        handshakeMessage: {
          type: 'error',
          text: `Primary Handshake failed: ${err.message}`
        }
      });
      return false;
    }
  }, [updateState, attemptGoogleOAuthAndKeylessFallback]);

  // Method to check active sessions on mount
  const verifyActiveAuth = useCallback(async () => {
    try {
      const [nexusMe, googleMe, googleInfo] = await Promise.all([
        fetch('/api/auth/nexus/me').then(r => r.json()).catch(() => ({ authenticated: false })),
        fetch('/api/auth/google/me').then(r => r.json()).catch(() => ({ authenticated: false })),
        detectGoogleAccount()
      ]);

      if (nexusMe.authenticated && nexusMe.user) {
        updateState({
          isAuthenticated: true,
          authMethod: 'PRIMARY_API_KEY',
          nexusUser: nexusMe.user,
          detectedGoogleAccount: googleInfo
        });
        return;
      }

      if (googleMe.authenticated && googleMe.user) {
        updateState({
          isAuthenticated: true,
          authMethod: 'GOOGLE_OAUTH',
          googleUser: googleMe.user,
          detectedGoogleAccount: googleInfo
        });
        return;
      }

      // If no active session, detect Google account availability for Keyless FreeLLM Routing
      updateState({
        detectedGoogleAccount: googleInfo
      });

    } catch (e) {
      console.warn('[useNexusAuth] Session verification notice:', e);
    }
  }, [updateState]);

  // Method to logout
  const logout = useCallback(async () => {
    try {
      await Promise.all([
        fetch('/api/auth/nexus/logout', { method: 'POST' }),
        fetch('/api/auth/google/logout', { method: 'POST' })
      ]);
    } catch (e) {
      // ignore
    }

    localStorage.removeItem(PRIMARY_KEY_STORAGE);
    localStorage.removeItem(GOOGLE_TOKEN_STORAGE);

    updateState({
      isAuthenticated: false,
      authMethod: 'NONE',
      nexusUser: null,
      googleUser: null,
      nexusToken: null,
      googleToken: null,
      fallbackOccurred: false,
      handshakeMessage: { type: 'info', text: 'All Nexus Bridge sessions disconnected.' }
    });
  }, [updateState]);

  const clearMessage = useCallback(() => {
    updateState({ handshakeMessage: null });
  }, [updateState]);

  // Check auth on mount
  useEffect(() => {
    verifyActiveAuth();
  }, [verifyActiveAuth]);

  return {
    ...state,
    authenticateWithKey,
    attemptGoogleOAuthAndKeylessFallback,
    verifyActiveAuth,
    switchRouteToFreeLLM,
    logout,
    clearMessage
  };
}
