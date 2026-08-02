import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  Key, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  LogOut, 
  Globe, 
  Sparkles, 
  User, 
  Layers,
  Zap,
  Terminal,
  ShieldAlert,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { executeWithExponentialBackoff, detectGoogleAccount, GoogleAccountDetectionResult } from '../utils/oauthRetry';
import { useNexusAuth } from '../hooks/useNexusAuth';
import { NexusHealthStatus } from './NexusHealthStatus';

export interface NexusAuthProps {
  onAuthSuccess?: (token: string, user: any) => void;
}

export interface OAuthSessionState {
  nexusToken: string | null;
  nexusUser: any | null;
  googleUser: any | null;
  googleToken: string | null;
}

export const NexusAuth: React.FC<NexusAuthProps> = ({ onAuthSuccess }) => {
  // Config & Credentials State
  const [nexusConfig, setNexusConfig] = useState<{
    configured: boolean;
    clientId: string | null;
    rawClientId: string;
    hasSecret: boolean;
    hasToken: boolean;
    redirectUri: string;
  }>({
    configured: false,
    clientId: null,
    rawClientId: '',
    hasSecret: false,
    hasToken: false,
    redirectUri: window.location.origin + '/api/auth/nexus/callback'
  });

  const [googleConfig, setGoogleConfig] = useState<{
    configured: boolean;
    clientId: string | null;
    redirectUri: string;
  }>({
    configured: false,
    clientId: null,
    redirectUri: window.location.origin + '/api/auth/google/callback'
  });

  // User input overrides for custom OAuth credentials
  const [customOAuthId, setCustomOAuthId] = useState('');
  const [customOAuthSecret, setCustomOAuthSecret] = useState('');
  const [customDirectToken, setCustomDirectToken] = useState('');

  // Active Session State
  const [sessionState, setSessionState] = useState<OAuthSessionState>({
    nexusToken: localStorage.getItem('n1_nexus_access_token') || null,
    nexusUser: null,
    googleUser: null,
    googleToken: localStorage.getItem('n1_google_access_token') || null
  });

  // Exponential Backoff Retry & Google Account Auto-Detection State
  const [retryInfo, setRetryInfo] = useState<{
    active: boolean;
    attempt: number;
    maxRetries: number;
    delayMs: number;
    errorMsg: string;
  } | null>(null);

  const [detectedGoogleAccount, setDetectedGoogleAccount] = useState<GoogleAccountDetectionResult | null>(null);
  const [showGoogleFallbackConfirmation, setShowGoogleFallbackConfirmation] = useState(false);
  const [autoFallbackEnabled, setAutoFallbackEnabled] = useState(true);

  // UI state
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isPerformingHandshake, setIsPerformingHandshake] = useState(false);
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [handshakeMessage, setHandshakeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load configuration and check existing sessions
  useEffect(() => {
    fetchConfigs();
    checkExistingSessions();

    // Listener for popup OAuth postMessage callbacks
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, provider } = event.data;
        if (provider === 'github' || !provider) {
          setSessionState(prev => ({ ...prev, nexusToken: 'cookie_session_active', nexusUser: user }));
          setHandshakeMessage({ type: 'success', text: `Nexus OAuth Handshake Successful! Connected as @${user.login || 'User'}` });
          if (onAuthSuccess) onAuthSuccess('cookie_session_active', user);
        }
      } else if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { user } = event.data;
        setSessionState(prev => ({ ...prev, googleUser: user, googleToken: 'cookie_session_active' }));
        setHandshakeMessage({ type: 'success', text: `Google OAuth Handshake Successful! Connected as ${user.email}` });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchConfigs = async () => {
    setIsLoadingConfig(true);
    try {
      const [nexusRes, googleRes] = await Promise.all([
        fetch('/api/auth/nexus/config'),
        fetch('/api/auth/google/config')
      ]);

      if (nexusRes.ok) {
        const data = await nexusRes.json();
        setNexusConfig(data);
        if (data.rawClientId) setCustomOAuthId(data.rawClientId);
      }
      if (googleRes.ok) {
        const gData = await googleRes.json();
        setGoogleConfig(gData);
      }
    } catch (e) {
      console.error('Failed to load OAuth configs:', e);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const checkExistingSessions = async () => {
    try {
      const [nexusMe, googleMe, googleInfo] = await Promise.all([
        fetch('/api/auth/nexus/me'),
        fetch('/api/auth/google/me'),
        detectGoogleAccount()
      ]);

      setDetectedGoogleAccount(googleInfo);

      if (nexusMe.ok) {
        const data = await nexusMe.json();
        if (data.authenticated) {
          setSessionState(prev => ({ ...prev, nexusUser: data.user }));
        }
      }

      if (googleMe.ok) {
        const gData = await googleMe.json();
        if (gData.authenticated) {
          setSessionState(prev => ({ ...prev, googleUser: gData.user, googleToken: 'google_oauth_active' }));
        }
      }
    } catch (e) {
      console.error('Session check failed:', e);
    }
  };

  // Method 1: Initiate Nexus Popup OAuth Flow
  const handleInitiateNexusOAuth = async () => {
    setIsPerformingHandshake(true);
    setHandshakeMessage({ type: 'info', text: 'Initiating Nexus OAuth Handshake via popup window...' });

    const idToUse = customOAuthId.trim() || nexusConfig.rawClientId;

    try {
      const urlRes = await fetch(`/api/auth/nexus/url?client_id=${encodeURIComponent(idToUse)}`);
      const data = await urlRes.json();

      if (data.status === 'success' && data.url) {
        const popup = window.open(
          data.url,
          'nexus_oauth_popup',
          'width=620,height=720,status=no,toolbar=no,menubar=no'
        );

        if (!popup) {
          setHandshakeMessage({ type: 'error', text: 'Popup blocked by browser! Please allow popups for this applet domain.' });
        }
      } else {
        throw new Error(data.message || 'Failed to construct Nexus OAuth authorization URL');
      }
    } catch (err: any) {
      setHandshakeMessage({ type: 'error', text: `OAuth Error: ${err.message}` });
    } finally {
      setIsPerformingHandshake(false);
    }
  };

  // Method 1 Alternative: Perform direct API exchange handshake with exponential backoff auto-retry
  const handleDirectExchangeHandshake = async () => {
    setIsPerformingHandshake(true);
    setHandshakeMessage(null);
    setRetryInfo(null);
    setShowGoogleFallbackConfirmation(false);

    try {
      await executeWithExponentialBackoff(
        async (attempt) => {
          const res = await fetch('/api/auth/nexus/handshake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: customOAuthId.trim(),
              clientSecret: customOAuthSecret.trim(),
              directToken: customDirectToken.trim()
            })
          });

          const result = await res.json();

          if (result.status === 'success') {
            setSessionState(prev => ({ ...prev, nexusToken: 'cookie_session_active', nexusUser: result.user }));
            setHandshakeMessage({
              type: 'success',
              text: `Direct Handshake Successful! Session authenticated in HttpOnly cookie for @${result.user.login}.`
            });
            if (onAuthSuccess) onAuthSuccess('cookie_session_active', result.user);
            return result;
          } else {
            throw new Error(result.message || 'Handshake failed');
          }
        },
        {
          maxRetries: 4,
          baseDelayMs: 1000,
          onRetry: (attempt, maxRetries, delayMs, error) => {
            setRetryInfo({
              active: true,
              attempt,
              maxRetries,
              delayMs,
              errorMsg: error.message
            });
            setHandshakeMessage({
              type: 'info',
              text: `[Exponential Backoff Auto-Retry ${attempt}/${maxRetries}] Connection attempt failed (${error.message}). Retrying in ${Math.round(delayMs / 1000)}s without user intervention...`
            });
          }
        }
      );
    } catch (err: any) {
      setHandshakeMessage({
        type: 'error',
        text: `Handshake failed after 4 retries: ${err.message}`
      });

      // Google Account connection detection
      const googleInfo = await detectGoogleAccount();
      setDetectedGoogleAccount(googleInfo);
      if (googleInfo.detected) {
        setShowGoogleFallbackConfirmation(true);
        if (autoFallbackEnabled && !sessionState.googleUser) {
          handleGoogleKeylessConnect();
        }
      }
    } finally {
      setIsPerformingHandshake(false);
      setRetryInfo(null);
    }
  };

  // Method 2: Google OAuth Keyless Connection
  const handleGoogleKeylessConnect = async () => {
    setIsPerformingHandshake(true);
    setHandshakeMessage({ type: 'info', text: 'Performing Google OAuth Identity Handshake...' });

    try {
      const res = await fetch('/api/auth/google/keyless');
      const data = await res.json();

      if (data.status === 'success') {
        localStorage.setItem('n1_google_access_token', data.accessToken);
        setSessionState(prev => ({ ...prev, googleUser: data.user, googleToken: data.accessToken }));
        setHandshakeMessage({
          type: 'success',
          text: `Google OAuth Connected! Authenticated user ${data.user.email} without requiring manual key input.`
        });
        setShowGoogleFallbackConfirmation(false);
      } else {
        throw new Error('Google OAuth handshake failed');
      }
    } catch (e: any) {
      setHandshakeMessage({ type: 'error', text: `Google OAuth Error: ${e.message}` });
    } finally {
      setIsPerformingHandshake(false);
    }
  };

  // Disconnect Nexus Session
  const handleDisconnectNexus = async () => {
    await fetch('/api/auth/nexus/logout', { method: 'POST' });
    localStorage.removeItem('n1_nexus_access_token');
    setSessionState(prev => ({ ...prev, nexusToken: null, nexusUser: null }));
    setHandshakeMessage({ type: 'info', text: 'Nexus OAuth session disconnected.' });
  };

  // Disconnect Google Session
  const handleDisconnectGoogle = async () => {
    await fetch('/api/auth/google/logout', { method: 'POST' });
    localStorage.removeItem('n1_google_access_token');
    setSessionState(prev => ({ ...prev, googleToken: null, googleUser: null }));
    setHandshakeMessage({ type: 'info', text: 'Google OAuth session disconnected.' });
  };

  // Test Token Verification with Exponential Backoff
  const handleTestTokenConnection = async () => {
    setIsTestingToken(true);
    setRetryInfo(null);

    try {
      await executeWithExponentialBackoff(
        async (attempt) => {
          const res = await fetch('/api/nexus/repos');
          const data = await res.json();
          if (data.status === 'success') {
            setHandshakeMessage({
              type: 'success',
              text: `Token Validated! Successfully fetched ${data.repos.length} remote repositories from Nexus API.`
            });
            return data;
          } else {
            throw new Error(data.message || 'Failed to fetch repositories');
          }
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (attempt, maxRetries, delayMs, error) => {
            setRetryInfo({
              active: true,
              attempt,
              maxRetries,
              delayMs,
              errorMsg: error.message
            });
            setHandshakeMessage({
              type: 'info',
              text: `[Exponential Backoff Auto-Retry ${attempt}/${maxRetries}] Connection failed (${error.message}). Retrying in ${Math.round(delayMs / 1000)}s...`
            });
          }
        }
      );
    } catch (e: any) {
      setHandshakeMessage({ type: 'error', text: `Token Test Failed after retries: ${e.message}` });
      const googleInfo = await detectGoogleAccount();
      setDetectedGoogleAccount(googleInfo);
      if (googleInfo.detected) {
        setShowGoogleFallbackConfirmation(true);
      }
    } finally {
      setIsTestingToken(false);
      setRetryInfo(null);
    }
  };

  const copyToClipboard = (text: string, type: 'uri' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'uri') {
      setCopiedRedirectUri(true);
      setTimeout(() => setCopiedRedirectUri(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="p-5 bg-gradient-to-r from-purple-950/60 via-zinc-950 to-indigo-950/60 border border-purple-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Nexus & Multi-Method OAuth Manager</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-900/80 text-purple-200 border border-purple-700 rounded-md font-bold">
                SYSTEM AUTH ENGINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Secure OAuth handshake utilizing <code className="text-purple-300">N1_OAUTH_ID</code> & <code className="text-purple-300">N1_OAUTH_SECRET</code>, with Google OAuth fallback for keyless connection.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
          <div className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
            nexusConfig.configured || sessionState.nexusUser
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}>
            <GitBranch size={12} />
            <span>NEXUS OAUTH: {sessionState.nexusUser ? 'CONNECTED' : nexusConfig.configured ? 'CONFIGURED' : 'UNKEYED'}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
            sessionState.googleUser
              ? 'bg-blue-950 text-blue-300 border-blue-800'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}>
            <Globe size={12} />
            <span>GOOGLE OAUTH: {sessionState.googleUser ? 'CONNECTED' : 'KEYLESS READY'}</span>
          </div>
        </div>
      </div>

      {/* Visual Real-Time Nexus Health Status Indicator */}
      <NexusHealthStatus />

      {/* Handshake Notification Message */}
      {handshakeMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono transition-all ${
          handshakeMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : handshakeMessage.type === 'error'
            ? 'bg-rose-950/80 border-rose-700 text-rose-200'
            : 'bg-purple-950/80 border-purple-700 text-purple-200'
        }`}>
          <div className="flex items-center gap-2">
            {handshakeMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {handshakeMessage.type === 'error' && <ShieldAlert size={16} className="text-rose-400 shrink-0" />}
            {handshakeMessage.type === 'info' && <RefreshCw size={16} className="text-purple-400 animate-spin shrink-0" />}
            <span>{handshakeMessage.text}</span>
          </div>
          <button 
            onClick={() => setHandshakeMessage(null)}
            className="text-zinc-400 hover:text-white text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* EXPONENTIAL BACKOFF RETRY MONITOR */}
      {retryInfo?.active && (
        <div className="p-4 bg-amber-950/70 border border-amber-600/60 rounded-2xl flex items-center justify-between text-xs font-mono text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <RotateCcw size={18} className="text-amber-400 animate-spin" />
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>EXPONENTIAL BACKOFF AUTO-RETRY IN PROGRESS</span>
                <span className="px-2 py-0.5 bg-amber-900 text-amber-300 border border-amber-700 rounded text-[10px]">
                  ATTEMPT {retryInfo.attempt} / {retryInfo.maxRetries}
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Transient exception: "{retryInfo.errorMsg}". Retrying in {Math.round(retryInfo.delayMs / 1000)}s without user intervention...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE ACCOUNT DETECTION & KEYLESS FALLBACK CONFIRMATION CARD */}
      {(showGoogleFallbackConfirmation || (detectedGoogleAccount?.detected && !sessionState.nexusUser && !sessionState.googleUser)) && (
        <div className="p-5 bg-gradient-to-r from-blue-950/80 via-zinc-950 to-indigo-950/80 border border-blue-500/50 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 border border-blue-400/40 text-blue-300 rounded-2xl animate-pulse">
                <UserCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Google Account Connection Detected</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-900 text-blue-200 border border-blue-600 rounded font-bold">
                    KEYLESS FALLBACK READY
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Active Google Account <strong className="text-blue-300 font-mono">{detectedGoogleAccount?.userEmail || 'Rastamanweeste@gmail.com'}</strong> detected. Connect using this account instead of the API key / OAuth ID connection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleGoogleKeylessConnect}
                disabled={isPerformingHandshake}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/40"
              >
                <CheckCircle2 size={14} />
                <span>Confirm Google Login ({detectedGoogleAccount?.userEmail || 'Rastamanweeste@gmail.com'})</span>
              </button>

              <button
                onClick={() => setShowGoogleFallbackConfirmation(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-900/50 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-blue-400" />
              <span>Keyless Authentication: No manual API key or OAuth ID required.</span>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer select-none text-blue-300">
              <input
                type="checkbox"
                checked={autoFallbackEnabled}
                onChange={e => setAutoFallbackEnabled(e.target.checked)}
                className="rounded border-blue-600 text-blue-600 focus:ring-0"
              />
              <span>Auto-fallback to Google account on API key failure</span>
            </label>
          </div>
        </div>
      )}

      {/* Main 2-Column Auth Methods Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= METHOD 1: NEXUS / GITHUB OAUTH HANDSHAKE ================= */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <GitBranch size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Method 1: Nexus / GitHub OAuth</h3>
                <p className="text-[11px] text-zinc-400">Uses N1_OAUTH_ID & N1_OAUTH_SECRET for OAuth Handshake</p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold">
              METHOD 1
            </span>
          </div>

          {/* Active Connected Nexus Session */}
          {sessionState.nexusUser ? (
            <div className="p-4 bg-zinc-900/80 border border-purple-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={sessionState.nexusUser.avatar_url || 'https://github.com/identicons/n1.png'} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-xl border border-purple-500/40"
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{sessionState.nexusUser.name || sessionState.nexusUser.login}</span>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">@{sessionState.nexusUser.login} • ID: {sessionState.nexusUser.id}</div>
                  </div>
                </div>

                <button
                  onClick={handleDisconnectNexus}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <LogOut size={12} />
                  <span>Disconnect</span>
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-black/50 rounded-lg">
                  <span className="text-zinc-500 block">PUBLIC REPOS:</span>
                  <span className="text-purple-300 font-bold">{sessionState.nexusUser.public_repos ?? 'Active'}</span>
                </div>
                <div className="p-2 bg-black/50 rounded-lg">
                  <span className="text-zinc-500 block">OAUTH SCOPE:</span>
                  <span className="text-emerald-300 font-bold">repo, user</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Configuration Status Fields */}
              <div className="p-4 bg-black/60 border border-zinc-800 rounded-2xl space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">N1_OAUTH_ID Status:</span>
                  {nexusConfig.configured || customOAuthId ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Configured ({customOAuthId ? customOAuthId.slice(0, 6) + '...' : nexusConfig.clientId})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle size={12} /> Missing in .env
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">N1_OAUTH_SECRET Status:</span>
                  {nexusConfig.hasSecret || customOAuthSecret ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Loaded (Encrypted)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle size={12} /> Missing in .env
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-900 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-between">
                    <span>OAuth Redirect URI:</span>
                    <button
                      onClick={() => copyToClipboard(nexusConfig.redirectUri, 'uri')}
                      className="text-purple-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedRedirectUri ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      <span>{copiedRedirectUri ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-purple-300 break-all select-all">{nexusConfig.redirectUri}</div>
                </div>
              </div>

              {/* Input Overrides for OAuth Client Credentials */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Custom OAuth Credentials Override (Optional):</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Overrides .env values</span>
                </div>

                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={customOAuthId}
                    onChange={e => setCustomOAuthId(e.target.value)}
                    placeholder="N1_OAUTH_ID (e.g. Ov23azXXXXXXXXXX)"
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="password"
                    value={customOAuthSecret}
                    onChange={e => setCustomOAuthSecret(e.target.value)}
                    placeholder="N1_OAUTH_SECRET (e.g. 8f9a2b3c...)"
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="password"
                    value={customDirectToken}
                    onChange={e => setCustomDirectToken(e.target.value)}
                    placeholder="Or paste Direct Access Token (ghp_...)"
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Action Handshake Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleInitiateNexusOAuth}
                  disabled={isPerformingHandshake || (!nexusConfig.configured && !customOAuthId)}
                  className="w-full sm:w-1/2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPerformingHandshake ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                  <span>Popup OAuth Handshake</span>
                </button>

                <button
                  onClick={handleDirectExchangeHandshake}
                  disabled={isPerformingHandshake || (!customDirectToken && (!customOAuthId || !customOAuthSecret))}
                  className="w-full sm:w-1/2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Key size={14} className="text-purple-400" />
                  <span>Direct Token Exchange</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= METHOD 2: GOOGLE OAUTH LOGIN (KEYLESS) ================= */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-purple-500/20 text-blue-400 rounded-xl">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Method 2: Google OAuth Login</h3>
                <p className="text-[11px] text-zinc-400">Zero-Key / Keyless OAuth Connection Alternative</p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded font-bold">
              NO KEY NEEDED
            </span>
          </div>

          {/* Connected Google Session */}
          {sessionState.googleUser ? (
            <div className="p-4 bg-zinc-900/80 border border-blue-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-base">
                    {sessionState.googleUser.name ? sessionState.googleUser.name.charAt(0) : 'G'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{sessionState.googleUser.name || 'Google Account'}</span>
                      <CheckCircle2 size={14} className="text-blue-400" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">{sessionState.googleUser.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleDisconnectGoogle}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <LogOut size={12} />
                  <span>Disconnect</span>
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-black/50 rounded-lg">
                  <span className="text-zinc-500 block">AUTH METHOD:</span>
                  <span className="text-blue-300 font-bold">Keyless Google OAuth</span>
                </div>
                <div className="p-2 bg-black/50 rounded-lg">
                  <span className="text-zinc-500 block">CONNECTED:</span>
                  <span className="text-emerald-300 font-bold">Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-black/60 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-400" />
                  <span>Keyless Google Identity Connection</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  If you don't have a GitHub <code className="text-purple-300">N1_OAUTH_ID</code> or secret key available, use Google OAuth for instant authentication without needing manual key input.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Target Google Identity:</span>
                  <span className="text-blue-300 font-bold">Rastamanweeste@gmail.com</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Key Setup Required:</span>
                  <span className="text-emerald-400 font-bold">NONE (0 Keys)</span>
                </div>
              </div>

              <button
                onClick={handleGoogleKeylessConnect}
                disabled={isPerformingHandshake}
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {isPerformingHandshake ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
                <span>Connect via Google OAuth (1-Click Keyless)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM STATE AUTH TOKEN MANAGER */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2.5">
            <Lock size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">System State Token Store & Diagnostics</h3>
          </div>

          <button
            onClick={handleTestTokenConnection}
            disabled={isTestingToken || (!sessionState.nexusToken && !sessionState.nexusUser)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isTestingToken ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} className="text-amber-400" />}
            <span>Test API Remote Connection</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
              <span>Nexus Access Token State:</span>
              {sessionState.nexusToken && (
                <button
                  onClick={() => copyToClipboard(sessionState.nexusToken!, 'token')}
                  className="text-purple-300 hover:text-white flex items-center gap-1"
                >
                  {copiedToken ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                </button>
              )}
            </div>
            <div className="text-purple-200/90 font-bold break-all">
              {sessionState.nexusToken ? `${sessionState.nexusToken.slice(0, 16)}...${sessionState.nexusToken.slice(-8)}` : 'No Token Stored in System State'}
            </div>
          </div>

          <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
            <div className="text-[10px] text-zinc-500 uppercase">Google OAuth Session State:</div>
            <div className="text-blue-300 font-bold break-all">
              {sessionState.googleUser ? `ACTIVE_SESSION (${sessionState.googleUser.email})` : 'No Google OAuth Session Active'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
