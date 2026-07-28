import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Cpu, 
  Key, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { authRateLimiter, AuthRateLimiterState } from '../utils/authRateLimiter';
import { useNexusAuth } from '../hooks/useNexusAuth';

export interface NexusHealthStatusProps {
  className?: string;
  onResetShield?: () => void;
}

export interface ConnectionPingResult {
  latencyMs: number;
  status: 'ONLINE' | 'DEGRADED' | 'RATE_LIMITED' | 'OFFLINE';
  timestamp: string;
  endpoint: string;
  statusCode?: number;
}

export const NexusHealthStatus: React.FC<NexusHealthStatusProps> = ({ className = '', onResetShield }) => {
  const auth = useNexusAuth();
  const [limiterState, setLimiterState] = useState<AuthRateLimiterState>(authRateLimiter.getState());
  const [pingResult, setPingResult] = useState<ConnectionPingResult | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [autoCheckInterval, setAutoCheckInterval] = useState<boolean>(true);

  // Subscribe to AuthRateLimiter updates
  useEffect(() => {
    const unsubscribe = authRateLimiter.subscribe((newState) => {
      setLimiterState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Real-time ping function
  const runLiveHealthCheck = useCallback(async () => {
    setIsPinging(true);
    const startTime = performance.now();
    let pingStatus: 'ONLINE' | 'DEGRADED' | 'RATE_LIMITED' | 'OFFLINE' = 'OFFLINE';
    let statusCode = 0;

    try {
      const res = await fetch('/api/auth/nexus/me', { method: 'GET' });
      statusCode = res.status;
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (res.status === 429) {
        pingStatus = 'RATE_LIMITED';
        authRateLimiter.record429('/api/auth/nexus/me', '429 Rate Limit Ping');
      } else if (res.ok) {
        pingStatus = latency > 800 ? 'DEGRADED' : 'ONLINE';
      } else {
        pingStatus = 'DEGRADED';
      }

      setPingResult({
        latencyMs: latency,
        status: pingStatus,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: '/api/auth/nexus/me',
        statusCode
      });
    } catch (err) {
      const endTime = performance.now();
      setPingResult({
        latencyMs: Math.round(endTime - startTime),
        status: 'OFFLINE',
        timestamp: new Date().toLocaleTimeString(),
        endpoint: '/api/auth/nexus/me',
        statusCode: 500
      });
    } finally {
      setIsPinging(false);
    }
  }, []);

  // Periodic health check every 15 seconds if autoCheck is enabled
  useEffect(() => {
    runLiveHealthCheck();
    if (!autoCheckInterval) return;

    const interval = setInterval(() => {
      runLiveHealthCheck();
    }, 15000);

    return () => clearInterval(interval);
  }, [runLiveHealthCheck, autoCheckInterval]);

  const handleManualReset = () => {
    authRateLimiter.reset();
    if (onResetShield) onResetShield();
    runLiveHealthCheck();
  };

  // Determine overall status
  const isShieldActive = limiterState.isShielded;
  const isKeylessActive = auth.authMethod === 'KEYLESS_FREELLM_ROUTING' || auth.fallbackOccurred;

  let healthColor = 'emerald';
  let badgeLabel = 'OPTIMAL HEALTH';
  let pulseBorder = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';

  if (isShieldActive) {
    healthColor = 'purple';
    badgeLabel = 'SHIELD PROTECTED (429 COOLDOWN)';
    pulseBorder = 'border-purple-500/50 bg-purple-500/10 text-purple-400 animate-pulse';
  } else if (isKeylessActive || limiterState.consecutive429Count > 0) {
    healthColor = 'amber';
    badgeLabel = 'FAILOVER (FREELLM KEYLESS)';
    pulseBorder = 'border-amber-500/50 bg-amber-500/10 text-amber-400';
  } else if (pingResult?.status === 'OFFLINE') {
    healthColor = 'rose';
    badgeLabel = 'CONNECTION OFFLINE';
    pulseBorder = 'border-rose-500/50 bg-rose-500/10 text-rose-400';
  }

  return (
    <div className={`p-5 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background Subtle Ambient Pulse */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isShieldActive ? 'bg-purple-600' : isKeylessActive ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Activity size={18} className={isShieldActive ? 'text-purple-400' : isKeylessActive ? 'text-amber-400' : 'text-emerald-400'} />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
              isShieldActive ? 'bg-purple-400 animate-ping' : isKeylessActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
            }`} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>Nexus Health Status</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${pulseBorder}`}>
                {badgeLabel}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">Real-time OAuth session validation & 429 rate limit shield status</p>
          </div>
        </div>

        {/* Diagnostic Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={runLiveHealthCheck}
            disabled={isPinging}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-300 font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Run Live Ping Diagnostic"
          >
            <RefreshCw size={11} className={isPinging ? 'animate-spin text-purple-400' : ''} />
            <span>{isPinging ? 'Pinging...' : 'Ping Diagnostic'}</span>
          </button>

          {isShieldActive && (
            <button
              onClick={handleManualReset}
              className="px-2.5 py-1 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/50 rounded-lg text-[10px] text-purple-300 font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Reset Rate Limit Shield"
            >
              <RotateCcw size={11} />
              <span>Reset Shield</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: OAuth Session Status */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 font-medium"><Key size={11} className="text-purple-400" /> OAuth Handshake</span>
            <span className="font-mono text-[9px] text-zinc-500">Live</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            {auth.isAuthenticated ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {auth.authMethod === 'KEYLESS_FREELLM_ROUTING' ? 'Keyless OAuth' : 'Authenticated'}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-300">Unauthenticated</span>
              </>
            )}
          </div>
          <div className="text-[9px] text-zinc-400 truncate">
            {auth.nexusUser?.login ? `@${auth.nexusUser.login}` : auth.googleUser?.email ? auth.googleUser.email : 'Google Account Ready'}
          </div>
        </div>

        {/* Metric 2: Rate Limiter Shield State */}
        <div className={`p-3 rounded-2xl border space-y-1 ${
          isShieldActive 
            ? 'bg-purple-950/20 border-purple-500/40' 
            : limiterState.consecutive429Count > 0 
            ? 'bg-amber-950/20 border-amber-500/40' 
            : 'bg-zinc-900/60 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 font-medium">
              {isShieldActive ? <ShieldAlert size={11} className="text-purple-400" /> : <ShieldCheck size={11} className="text-emerald-400" />}
              Rate Limiter
            </span>
            <span className="font-mono text-[9px] text-zinc-500">
              {limiterState.consecutive429Count}/2 429s
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            {isShieldActive ? (
              <span className="text-xs font-black text-purple-300 flex items-center gap-1">
                <Clock size={12} className="animate-spin text-purple-400" />
                <span>Cooldown ({limiterState.cooldownRemainingSec}s)</span>
              </span>
            ) : limiterState.consecutive429Count > 0 ? (
              <span className="text-xs font-bold text-amber-300">
                Warning ({limiterState.consecutive429Count} 429)
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Normal / Clear
              </span>
            )}
          </div>
          <div className="text-[9px] text-zinc-400 truncate">
            {isShieldActive ? `Shielding auth service` : `Shields: ${limiterState.totalShieldedAttempts} attempts`}
          </div>
        </div>

        {/* Metric 3: Active Routing Mode */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 font-medium"><Cpu size={11} className="text-cyan-400" /> Active Route</span>
            <span className="font-mono text-[9px] text-emerald-400">FreeLLM</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Zap size={13} className="text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-white truncate">
              {auth.activeRoute || 'keller-route-01'}
            </span>
          </div>
          <div className="text-[9px] text-zinc-400 truncate">
            {auth.fallbackOccurred ? 'Failover Routing Active' : 'Primary Routing'}
          </div>
        </div>

        {/* Metric 4: Connection Ping Latency */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 font-medium"><Radio size={11} className="text-emerald-400" /> Ping Latency</span>
            <span className="font-mono text-[9px] text-zinc-500">{pingResult?.timestamp || 'Just now'}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-xs font-mono font-bold text-emerald-300">
              {pingResult?.latencyMs ?? 18} ms
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 font-mono text-zinc-400">
              HTTP {pingResult?.statusCode || 200}
            </span>
          </div>
          <div className="text-[9px] text-zinc-400 truncate">
            Endpoint: /api/auth/nexus/me
          </div>
        </div>
      </div>

      {/* Banner Notice if Shield is active */}
      {isShieldActive && (
        <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-purple-200">
          <ShieldAlert size={16} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-2">
              <span>Authentication Rate Limiter Shield Active</span>
              <span className="font-mono text-[10px] bg-purple-900/60 px-2 py-0.5 rounded text-purple-200">
                {limiterState.cooldownRemainingSec}s cooldown remaining
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 leading-relaxed">
              Consecutive HTTP 429 quota errors detected. The rate limiter is actively shielding the authentication endpoint from redundant retry loops while automatically keeping your session online via keyless FreeLLM routing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
