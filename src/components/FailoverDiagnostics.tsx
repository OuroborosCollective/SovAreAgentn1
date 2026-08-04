import React, { useState, useEffect } from 'react';
import { Activity, Server, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { FREE_TIER_REVOLVER_ROUTES, failoverHistory, subscribeToRoutes } from '../utils/modelRevolver';
import { motion, AnimatePresence } from 'framer-motion';

export const FailoverDiagnostics: React.FC = () => {
  const [routes, setRoutes] = useState(FREE_TIER_REVOLVER_ROUTES);
  const [history, setHistory] = useState(failoverHistory);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToRoutes(() => {
      setRoutes([...FREE_TIER_REVOLVER_ROUTES]);
      setHistory([...failoverHistory]);
    });
    return () => unsub();
  }, []);

  const simulateFailure = () => {
    setIsSimulating(true);
    // Simulate a failure by throwing a 429 in a mock request
    import('../utils/modelRevolver').then(({ executeWithModelRevolver }) => {
      let attempts = 0;
      executeWithModelRevolver(async () => {
        attempts++;
        if (attempts === 1) {
          throw { status: 429, message: 'Simulated Rate Limit' };
        }
        return 'success';
      }).finally(() => {
        setTimeout(() => setIsSimulating(false), 1000);
      });
    });
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/50 border border-emerald-800 text-emerald-400 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">LLM Failover Diagnostics</h2>
            <p className="text-xs text-zinc-500">Real-time route health & auto-healing monitor.</p>
          </div>
        </div>
        <button 
          onClick={simulateFailure}
          disabled={isSimulating}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2"
        >
          {isSimulating ? <RefreshCw size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
          Test Failover
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route Health Scores */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Endpoint Health</h3>
          <div className="space-y-2">
            {routes.map(route => (
              <div key={route.modelName} className="p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server size={14} className={(route.healthScore || 100) > 50 ? 'text-emerald-400' : 'text-rose-400'} />
                  <div className="text-xs font-mono text-zinc-300">{route.modelName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${(route.healthScore || 100) > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${route.healthScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono w-6 text-right text-zinc-400">{route.healthScore || 100}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failover History */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Auto-Heal Log</h3>
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 h-full min-h-[200px] max-h-[300px] overflow-y-auto space-y-2 font-mono">
            <AnimatePresence>
              {history.length === 0 ? (
                <div className="text-xs text-zinc-600 flex items-center gap-2 h-full justify-center">
                  <ShieldCheck size={16} /> All routes stable
                </div>
              ) : (
                history.map((event, i) => (
                  <motion.div 
                    key={`${event.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 border-l-2 border-amber-500 bg-amber-500/10 rounded-r-lg text-[10px] space-y-1"
                  >
                    <div className="flex justify-between text-zinc-500">
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <span className="text-amber-400">{event.reason}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="truncate max-w-[100px]" title={event.fromModel}>{event.fromModel}</span>
                      <ArrowRight size={10} className="text-zinc-500 shrink-0" />
                      <span className="text-emerald-400 truncate max-w-[100px]" title={event.toModel}>{event.toModel}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
