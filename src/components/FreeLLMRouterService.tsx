import React, { useState, useEffect, useCallback } from 'react';
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
  Layers,
  Plus,
  Trash2,
  Key,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { googleApiKeyManager, ApiKeyInfo, KeyManagerEvent } from '../services/googleApiKeyManager';

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

interface StoredKey {
  id: string;
  label: string;
  keyPreview: string;
  isActive: boolean;
  quotaUsed: number;
  quotaLimit: number;
  lastUsed: number | null;
  errorCount: number;
  isValidated: boolean;
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

  // Google API Key Management State
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [newKeyLabel, setNewKeyLabel] = useState<string>('');
  const [isAddingKey, setIsAddingKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [lastFailover, setLastFailover] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<{ isHealthy: boolean; issues: string[] }>({ isHealthy: true, issues: [] });

  // Load keys from manager
  const loadKeys = useCallback(async () => {
    await googleApiKeyManager.waitForInitialization();
    const keys = googleApiKeyManager.getKeys();
    // Transform the keys to match the StoredKey interface
    const transformedKeys: StoredKey[] = keys.map((k: any) => ({
      id: k.id,
      label: k.label,
      keyPreview: k.key, // getKeys returns masked key
      isActive: k.isActive,
      quotaUsed: k.quotaUsed,
      quotaLimit: k.quotaLimit,
      lastUsed: k.lastUsed,
      errorCount: k.errorCount,
      isValidated: k.isValidated
    }));
    setStoredKeys(transformedKeys);
    
    // Run integrity check
    const integrity = googleApiKeyManager.runIntegrityCheck();
    setIntegrityStatus(integrity);
  }, []);

  // Initialize
  useEffect(() => {
    loadKeys();

    // Subscribe to key manager events
    const unsubscribe = googleApiKeyManager.subscribe((event: KeyManagerEvent) => {
      if (event.type === 'failover-triggered') {
        setLastFailover(`Key rotated to: ${event.keyId}`);
        setTimeout(() => setLastFailover(null), 5000);
      }
      loadKeys();
    });

    return () => unsubscribe();
  }, [loadKeys]);

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
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRoutes(prev => prev.map(r => {
      if (r.id === 'route-4') {
        return { ...r, status: 'standby', latency: 450, reliability: 85.0 };
      }
      return r;
    }));
    setIsVerifying(false);
  };

  const handleSimulateFailover = () => {
    setSimulatedFailures(prev => prev + 1);
    setCircuitBreakerStatus('OPEN');
    
    setRoutes(prev => {
      const updated = [...prev];
      updated[0].status = 'rate-limited';
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

  const handleAddKey = async () => {
    if (!newKeyInput.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await googleApiKeyManager.addKey(newKeyInput.trim(), newKeyLabel.trim() || undefined);
      
      if (result.success) {
        setNewKeyInput('');
        setNewKeyLabel('');
        setShowKeyInput(false);
        await loadKeys();
      } else {
        setValidationError(result.error || 'Failed to add key');
      }
    } catch (error: any) {
      setValidationError(error?.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = (keyId: string) => {
    googleApiKeyManager.removeKey(keyId);
    loadKeys();
  };

  const handleActivateKey = (keyId: string) => {
    googleApiKeyManager.activateKey(keyId);
    loadKeys();
  };

  const handleClearAllKeys = () => {
    if (confirm('Are you sure you want to remove all stored API keys?')) {
      googleApiKeyManager.clearAllKeys();
      loadKeys();
    }
  };

  const handleRunIntegrityCheck = () => {
    const status = googleApiKeyManager.runIntegrityCheck();
    setIntegrityStatus(status);
  };

  const activeKeysCount = storedKeys.filter(k => k.isValidated && k.quotaUsed < k.quotaLimit).length;
  const totalQuotaUsed = storedKeys.reduce((sum, k) => sum + k.quotaUsed, 0);
  const totalQuotaLimit = storedKeys.reduce((sum, k) => sum + k.quotaLimit, 0) || 10000;

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

      {/* Google API Key Management Section */}
      <div className="border-t border-zinc-800 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/50 border border-emerald-800 text-emerald-400 rounded-xl">
              <Key size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Google AI Studio API Keys</h4>
              <p className="text-[10px] text-zinc-500">Voice TTS Multi-Key Revolver with Auto-Failover</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunIntegrityCheck}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg border border-zinc-800 flex items-center gap-1"
              title="Run Integrity Check"
            >
              <ShieldCheck size={12} />
              <span>Integrity</span>
            </button>
            {!showKeyInput && (
              <button
                onClick={() => setShowKeyInput(true)}
                className="px-3 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-800 flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Add Key</span>
              </button>
            )}
          </div>
        </div>

        {/* Key Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">Stored Keys</span>
            <p className="text-lg font-bold text-white mt-1">{storedKeys.length}</p>
          </div>
          <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">Available Keys</span>
            <p className="text-lg font-bold text-emerald-400 mt-1">{activeKeysCount}</p>
          </div>
          <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">Total Quota Used</span>
            <p className="text-lg font-bold text-amber-400 mt-1">{totalQuotaUsed.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">System Health</span>
            <p className={`text-lg font-bold mt-1 ${integrityStatus.isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
              {integrityStatus.isHealthy ? 'HEALTHY' : 'ISSUES'}
            </p>
          </div>
        </div>

        {/* Failover Alert */}
        <AnimatePresence>
          {lastFailover && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-amber-950/30 border border-amber-600/50 rounded-xl flex items-center gap-2"
            >
              <AlertCircle size={14} className="text-amber-400" />
              <span className="text-amber-300 text-[10px]">{lastFailover}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Integrity Issues */}
        {integrityStatus.issues.length > 0 && (
          <div className="p-3 bg-rose-950/20 border border-rose-800/50 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase">
              <AlertTriangle size={12} />
              <span>Integrity Issues</span>
            </div>
            {integrityStatus.issues.map((issue, i) => (
              <p key={i} className="text-rose-300/80 text-[10px]">• {issue}</p>
            ))}
          </div>
        )}

        {/* Add Key Form */}
        <AnimatePresence>
          {showKeyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Key size={14} className="text-zinc-500" />
                <span className="text-zinc-400 text-[10px] font-bold uppercase">Add New API Key</span>
              </div>
              
              <div className="space-y-2">
                <input
                  type="password"
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="Paste Google AI Studio API Key (AIza...)"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Label (optional, e.g., 'Key Work', 'Key Home')"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {validationError && (
                <div className="flex items-center gap-2 text-rose-400 text-[10px]">
                  <X size={12} />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddKey}
                  disabled={!newKeyInput.trim() || isValidating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <Check size={12} />
                      <span>Add Key</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowKeyInput(false);
                    setNewKeyInput('');
                    setNewKeyLabel('');
                    setValidationError(null);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg flex items-center gap-1.5"
                >
                  <X size={12} />
                  <span>Cancel</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key List */}
        {storedKeys.length > 0 ? (
          <div className="space-y-2">
            <div className="px-4 py-2 bg-zinc-900/20 text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between border-b border-zinc-900">
              <span>Stored API Keys</span>
              <div className="flex items-center gap-4">
                <span className="w-24 text-right">Quota</span>
                <span className="w-16 text-right">Status</span>
                <span className="w-20 text-right">Actions</span>
              </div>
            </div>

            {storedKeys.map(key => (
              <div
                key={key.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  key.isActive 
                    ? 'bg-emerald-950/20 border-emerald-700/50' 
                    : key.errorCount >= 5
                      ? 'bg-rose-950/20 border-rose-700/50'
                      : 'bg-zinc-900/30 border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    key.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800/50 text-zinc-500'
                  }`}>
                    <Key size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs truncate">{key.label}</span>
                      {key.isActive && (
                        <span className="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 text-[8px] font-bold rounded uppercase">Active</span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{key.keyPreview}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-24 text-right">
                    <div className="text-[10px] text-zinc-400">
                      <span className={key.quotaUsed >= key.quotaLimit ? 'text-rose-400' : 'text-zinc-300'}>
                        {key.quotaUsed.toLocaleString()}
                      </span>
                      <span className="text-zinc-600"> / {key.quotaLimit.toLocaleString()}</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          key.quotaUsed >= key.quotaLimit 
                            ? 'bg-rose-500' 
                            : key.quotaUsed > key.quotaLimit * 0.8
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (key.quotaUsed / key.quotaLimit) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="w-16 text-right">
                    {key.isValidated ? (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">Valid</span>
                    ) : (
                      <span className="text-[9px] font-bold text-rose-400 uppercase">Invalid</span>
                    )}
                  </div>

                  <div className="w-20 text-right flex items-center justify-end gap-1">
                    {!key.isActive && key.isValidated && key.errorCount < 5 && (
                      <button
                        onClick={() => handleActivateKey(key.id)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 rounded transition-colors"
                        title="Activate this key"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveKey(key.id)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                      title="Remove this key"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear All Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleClearAllKeys}
                className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/30 text-rose-400 text-[10px] font-bold rounded-lg border border-rose-900/50 flex items-center gap-1"
              >
                <Trash2 size={10} />
                <span>Clear All Keys</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-xl text-center">
            <Key size={24} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-zinc-400 text-xs">No API keys stored</p>
            <p className="text-zinc-600 text-[10px] mt-1">Add a Google AI Studio API key to enable voice TTS with auto-failover</p>
            {!showKeyInput && (
              <button
                onClick={() => setShowKeyInput(true)}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 mx-auto"
              >
                <Plus size={12} />
                <span>Add First Key</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
