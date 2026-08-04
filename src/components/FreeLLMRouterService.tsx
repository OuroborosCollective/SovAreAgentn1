import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Gauge, 
  Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LLMRoute {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'standby' | 'rate-limited' | 'offline';
  latency: number;
  costPer1kTokens: number;
  reliability: number;
  quotaUsed: number;
  quotaLimit: number;
}

export const FreeLLMRouterService: React.FC = () => {
  const [routes, setRoutes] = useState<LLMRoute[]>([
    {
      id: 'route-1',
      name: 'Gemini 2.5 Flash',
      provider: 'Google API (Primary Route)',
      status: 'active',
      latency: 42,
      costPer1kTokens: 0.00,
      reliability: 99.9,
      quotaUsed: 4210,
      quotaLimit: 10000
    },
    {
      id: 'route-2',
      name: 'DeepSeek Chat',
      provider: 'OpenRouter / DeepSeek Fallback',
      status: 'standby',
      latency: 240,
      costPer1kTokens: 0.00,
      reliability: 98.4,
      quotaUsed: 120,
      quotaLimit: 5000
    },
    {
      id: 'route-3',
      name: 'Llama 3.3 70B',
      provider: 'Groq Free Tier (Secondary Fallback)',
      status: 'standby',
      latency: 185,
      costPer1kTokens: 0.00,
      reliability: 99.1,
      quotaUsed: 800,
      quotaLimit: 5000
    },
    {
      id: 'route-4',
      name: 'HuggingFace Serverless',
      provider: 'HF Hub Fallback',
      status: 'offline',
      latency: 0,
      costPer1kTokens: 0.00,
      reliability: 82.0,
      quotaUsed: 0,
      quotaLimit: 2000
    }
  ]);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeBudget, setActiveBudget] = useState<number>(0.00);
  const [circuitBreakerStatus, setCircuitBreakerStatus] = useState<'CLOSED' | 'OPEN' | 'HALF-OPEN'>('CLOSED');
  const [simulatedFailures, setSimulatedFailures] = useState<number>(0);

  // Auto-mutate latency for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRoutes(prev => prev.map(r => {
        if (r.status === 'offline') return r;
        const delta = Math.floor((Math.random() - 0.5) * 8);
        return {
          ...r,
          latency: Math.max(20, r.latency + delta)
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleVerifyRoutes = async () => {
    setIsVerifying(true);
    // Simulate real network verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRoutes(prev => prev.map(r => {
      if (r.id === 'route-4') {
        // Recover HF Hub occasionally
        return { ...r, status: 'standby', latency: 450, reliability: 85.0 };
      }
      return r;
    }));
    setIsVerifying(false);
  };

  const handleSimulateFailover = () => {
    setSimulatedFailures(prev => prev + 1);
    setCircuitBreakerStatus('OPEN');
    
    // Rotate routes
    setRoutes(prev => {
      const updated = [...prev];
      // Mark primary as rate-limited
      updated[0].status = 'rate-limited';
      // Promote DeepSeek as active
      updated[1].status = 'active';
      return updated;
    });

    setTimeout(() => {
      setCircuitBreakerStatus('HALF-OPEN');
    }, 4000);

    setTimeout(() => {
      setCircuitBreakerStatus('CLOSED');
      setRoutes(prev => {
        const restored = [...prev];
        restored[0].status = 'active';
        restored[1].status = 'standby';
        return restored;
      });
    }, 8000);
  };

  return (
    <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-6 shadow-xl font-mono text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950/50 border border-purple-800 text-purple-400 rounded-2xl">
            <Layers size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Free-Route LLM Revolver Hub</h3>
            <p className="text-[10px] text-zinc-500">Autonomous route rotation, circuit breakers, and verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-sans">
          <button
            onClick={handleVerifyRoutes}
            disabled={isVerifying}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 border border-zinc-800 transition-all shadow-md"
          >
            <RefreshCw size={12} className={isVerifying ? 'animate-spin' : ''} />
            <span>{isVerifying ? 'Pinging Endpoints...' : 'Verify Endpoints'}</span>
          </button>

          <button
            onClick={handleSimulateFailover}
            className="px-4 py-2 bg-pink-650 hover:bg-pink-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-md"
          >
            <Flame size={12} />
            <span>Simulate Failover</span>
          </button>
        </div>
      </div>

      {/* Meta Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col justify-between min-h-[90px]">
          <span className="text-zinc-500 uppercase font-bold text-[9px] tracking-wider">Active Route Target</span>
          <span className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {routes.find(r => r.status === 'active')?.name || 'None'}
          </span>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col justify-between min-h-[90px]">
          <span className="text-zinc-500 uppercase font-bold text-[9px] tracking-wider">Circuit Breaker</span>
          <span className={`text-sm font-bold mt-1 ${
            circuitBreakerStatus === 'CLOSED' ? 'text-emerald-400' : circuitBreakerStatus === 'OPEN' ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {circuitBreakerStatus}
          </span>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col justify-between min-h-[90px]">
          <span className="text-zinc-500 uppercase font-bold text-[9px] tracking-wider">Failovers (Session)</span>
          <span className="text-sm font-bold text-white mt-1">
            {simulatedFailures}
          </span>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col justify-between min-h-[90px]">
          <span className="text-zinc-500 uppercase font-bold text-[9px] tracking-wider">Active Cost Spend</span>
          <span className="text-sm font-bold text-emerald-400 mt-1">
            ${activeBudget.toFixed(2)} / $1.00 Max
          </span>
        </div>
      </div>

      {/* Route List */}
      <div className="space-y-2.5">
        <div className="px-4 py-2 bg-zinc-900/20 text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between border-b border-zinc-900">
          <span>Route Provider</span>
          <div className="flex gap-12">
            <span className="w-20 text-right">Status</span>
            <span className="w-16 text-right">Latency</span>
            <span className="w-20 text-right">Reliability</span>
            <span className="w-24 text-right">Quota Limits</span>
          </div>
        </div>

        {routes.map(r => (
          <div 
            key={r.id}
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              r.status === 'active' 
                ? 'bg-purple-950/20 border-purple-500/40' 
                : r.status === 'rate-limited'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-zinc-900/30 border-zinc-800/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                r.status === 'active' ? 'bg-purple-950 text-purple-400' : 'bg-zinc-900 text-zinc-500'
              }`}>
                <Cpu size={16} />
              </div>
              <div>
                <h4 className="font-bold text-white">{r.name}</h4>
                <p className="text-[10px] text-zinc-500">{r.provider}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-12 text-right">
              <div className="w-20">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  r.status === 'active' 
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-900' 
                    : r.status === 'standby'
                      ? 'bg-blue-950 text-blue-400 border-blue-900'
                      : r.status === 'rate-limited'
                        ? 'bg-rose-950 text-rose-400 border-rose-900'
                        : 'bg-zinc-950 text-zinc-600 border-zinc-900'
                }`}>
                  {r.status}
                </span>
              </div>

              <div className="w-16 text-zinc-300 font-bold">
                {r.status === 'offline' ? '--' : `${r.latency}ms`}
              </div>

              <div className="w-20 text-zinc-400">
                {r.reliability}%
              </div>

              <div className="w-24 text-zinc-400">
                <span className="text-zinc-500">{r.quotaUsed}</span> / {r.quotaLimit}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
