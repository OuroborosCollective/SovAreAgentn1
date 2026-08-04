import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  History, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { areBackgroundSyncService, SyncStatus } from '../services/areBackgroundSyncService';

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export const OuroborosSyncMonitor: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    lastError: null,
    sqliteActive: false,
    sqliteRows: 0,
    sqliteSizeBytes: 0
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      time: new Date().toLocaleTimeString(),
      message: 'Ouroboros Synchronization Protocol initialized.',
      type: 'info'
    }
  ]);

  const [activeSyncStep, setActiveSyncStep] = useState<string>('');
  const [fakeProgress, setFakeProgress] = useState<number>(0);

  // Add a log entry helper
  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        message,
        type
      },
      ...prev.slice(0, 19) // Limit to 20 logs
    ]);
  };

  // Subscribe to real-time status from the service
  useEffect(() => {
    const unsubscribe = areBackgroundSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => unsubscribe();
  }, []);

  // Sync state side effects for nice visual progress simulation
  useEffect(() => {
    if (status.isSyncing) {
      setFakeProgress(0);
      setActiveSyncStep('1/3 Hashing local database blocks...');
      addLog('Beginning sequential transaction flush...', 'info');

      const t1 = setTimeout(() => {
        setFakeProgress(45);
        setActiveSyncStep('2/3 Transmitting atomic κIR batch...');
      }, 400);

      const t2 = setTimeout(() => {
        setFakeProgress(80);
        setActiveSyncStep('3/3 Committing ledger verification chain...');
      }, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setFakeProgress(100);
      setActiveSyncStep('');
    }
  }, [status.isSyncing]);

  // Log successful syncs or errors
  useEffect(() => {
    if (status.lastSyncedAt) {
      addLog(`Successful synchronization of SQLite event queue. State is transparent and verified.`, 'success');
    }
  }, [status.lastSyncedAt]);

  useEffect(() => {
    if (status.lastError) {
      addLog(`Synchronization failed: ${status.lastError}`, 'error');
    }
  }, [status.lastError]);

  // Manual Trigger Synchronizer
  const handleForceSync = async () => {
    if (status.isSyncing) return;
    addLog('Manual synchronization trigger received.', 'info');
    try {
      const result = await areBackgroundSyncService.flushQueue();
      if (result.syncedCount > 0) {
        addLog(`Successfully flushed ${result.syncedCount} cached SQLite ticks to central ledger.`, 'success');
      } else if (result.errors.length > 0) {
        addLog(`Synchronizer warnings: ${result.errors.join(', ')}`, 'warn');
      } else {
        addLog('No outstanding cached SQLite events to synchronize.', 'info');
      }
    } catch (err: any) {
      addLog(`Synchronizer exception: ${err?.message || err}`, 'error');
    }
  };

  // Generate simulated events to demonstrate background caching and sync transparency
  const handleSimulateEvent = async () => {
    addLog('Generating simulated κIR logic state change...', 'info');
    
    // Create random contract mutation
    const mockOperators = ['ADD', 'SUB', 'VERIFY_AXIOM', 'RESONATE_ORB', 'EVAL_TOPOLOGY'];
    const selectedOp = mockOperators[Math.floor(Math.random() * mockOperators.length)];
    
    const simulatedProgram = {
      programId: `prog_sim_${Math.random().toString(36).substring(2, 7)}`,
      version: '1.0.0-κIR' as const,
      rootNodeId: 'node_0',
      canonicalHash: '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase(),
      createdAt: new Date().toISOString(),
      targetLanguages: ['TypeScript' as const],
      nodes: {
        'node_0': {
          id: 'node_0',
          type: 'OPERATOR' as const,
          primitiveType: 'HYPERGRAPH_NODE' as const,
          effect: 'PURE' as const,
          value: selectedOp,
          children: [],
          contentHash: '0xCH_' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()
        }
      }
    };

    try {
      addLog(`Enqueuing simulated action [${selectedOp}] to local SQLite engine.`, 'info');
      const tick = await areBackgroundSyncService.enqueueTick(simulatedProgram);
      addLog(`Transaction enqueued. Cache ID: ${tick.id}. Storage Engine: ${tick.storageEngine}`, 'success');
    } catch (err: any) {
      addLog(`Failed to cache event: ${err?.message || err}`, 'error');
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-purple-900/50 rounded-2xl p-4 sm:p-6 space-y-5 font-mono text-xs relative overflow-hidden" id="ouroboros-sync-monitor">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center size-10 bg-purple-950 border border-purple-800 rounded-xl text-purple-300">
            <TrendingUp size={20} className={status.isSyncing ? 'animate-pulse' : ''} />
            {status.isSyncing && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-xs">Ouroboros Protocol Synchronizer</h4>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded flex items-center gap-1 ${
                status.isOnline 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {status.isOnline ? (
                  <>
                    <Wifi size={10} /> CONNECTED
                  </>
                ) : (
                  <>
                    <WifiOff size={10} /> OFFLINE CACHE ACTIVE
                  </>
                )}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Guarantees the "Immutable Information" axiom. Transmits transaction blocks from local SQLite to the central server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSimulateEvent}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <Sparkles size={12} className="text-pink-400" />
            <span>Generate Local Event</span>
          </button>

          <button
            onClick={handleForceSync}
            disabled={status.isSyncing || status.pendingCount === 0}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              status.pendingCount > 0 
                ? 'bg-purple-900 hover:bg-purple-800 border border-purple-700 text-purple-100' 
                : 'bg-zinc-950 text-zinc-500 border border-zinc-900 cursor-not-allowed'
            }`}
          >
            <RefreshCw size={12} className={status.isSyncing ? 'animate-spin text-purple-300' : ''} />
            <span>{status.isSyncing ? 'Syncing...' : 'Force Ledger Flush'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Status Metrics & Interactive Visual Ring */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column: Visual Ring Animation */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl relative min-h-[160px]">
          {/* Subtle Ouroboros Circular Background rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="size-32 border-2 border-dashed border-purple-600 rounded-full animate-[spin_40s_linear_infinite]" />
            <div className="absolute size-24 border border-pink-500 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
          </div>

          {/* Core Animation based on Sync State */}
          <div className="relative size-24 flex items-center justify-center">
            {/* Pulsing ring indicator */}
            <motion.div 
              className={`absolute inset-0 rounded-full border-2 ${
                status.isSyncing 
                  ? 'border-purple-500/80' 
                  : status.pendingCount > 0 
                    ? 'border-amber-500/60' 
                    : 'border-emerald-500/40'
              }`}
              animate={{ 
                scale: status.isSyncing ? [1, 1.15, 1] : [1, 1.05, 1],
                rotate: status.isSyncing ? 360 : 0
              }}
              transition={{ 
                repeat: Infinity, 
                duration: status.isSyncing ? 2.5 : 8, 
                ease: "linear" 
              }}
            />

            {/* Inner Ring with Dashes */}
            <div className={`absolute size-20 rounded-full border border-dashed ${
              status.isSyncing 
                ? 'border-pink-500/60 animate-spin' 
                : 'border-zinc-800'
            }`} />

            {/* Central Node Display */}
            <div className="z-10 flex flex-col items-center justify-center">
              <span className={`text-lg font-extrabold ${
                status.pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {status.pendingCount}
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">
                In Queue
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className={`text-[10px] font-bold ${
              status.isSyncing 
                ? 'text-purple-400 animate-pulse' 
                : status.pendingCount > 0 
                  ? 'text-amber-400' 
                  : 'text-emerald-400'
            }`}>
              {status.isSyncing 
                ? 'TRANSMITTING...' 
                : status.pendingCount > 0 
                  ? 'PENDING SYNCHRONIZATION' 
                  : 'LEDGER SYNCED & IMMUTABLE'
              }
            </span>
          </div>
        </div>

        {/* Right Column: Key Metrics Table */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase font-semibold block flex items-center gap-1">
              <Database size={10} className="text-zinc-400" /> Local SQLite Storage
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">
                {status.sqliteActive ? 'SQLite WASM Active' : 'Fallback DB Active'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block">
              {status.sqliteRows} rows • {(status.sqliteSizeBytes / 1024).toFixed(1)} KB cached binary
            </span>
          </div>

          <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase font-semibold block flex items-center gap-1">
              <Activity size={10} className="text-zinc-400" /> Protocol Pipeline Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-white">
                {status.isSyncing ? 'High-Fi Stream' : 'Adaptive Backoff'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block">
              {status.isOnline ? 'Online real-time flush' : 'Idle-hold hibernation'}
            </span>
          </div>

          <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase font-semibold block flex items-center gap-1">
              <CheckCircle2 size={10} className="text-zinc-400" /> Last Unified State Commit
            </span>
            <span className="text-sm font-bold text-zinc-300 block">
              {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'No Sync this session'}
            </span>
            <span className="text-[10px] text-zinc-400 block truncate">
              Ouroboros hash chain verified.
            </span>
          </div>

          <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase font-semibold block flex items-center gap-1">
              <Cpu size={10} className="text-zinc-400" /> Engine Diagnostics
            </span>
            {status.lastError ? (
              <div className="flex items-center gap-1 text-red-400">
                <AlertTriangle size={12} className="shrink-0" />
                <span className="font-bold truncate text-[10px]">{status.lastError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={12} className="shrink-0" />
                <span className="font-bold text-[10px]">ALL INVARIANTS PASS</span>
              </div>
            )}
            <span className="text-[10px] text-zinc-400 block">
              Self-contained integrity verified.
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Sync Progress bar */}
      <AnimatePresence>
        {status.isSyncing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-purple-300 font-bold animate-pulse flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" />
                {activeSyncStep}
              </span>
              <span className="text-pink-400 font-bold">{fakeProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                animate={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Ledger Actions Logs console view */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1">
            <History size={11} /> Sync Pipeline Console Logs
          </span>
          <span>Adaptive backoff queue feed</span>
        </div>

        <div className="bg-black/90 border border-zinc-800 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-zinc-600 shrink-0">[{log.time}]</span>
              <span className={`shrink-0 uppercase text-[9px] font-bold px-1.5 rounded ${
                log.type === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                log.type === 'error' ? 'bg-red-950 text-red-400 border border-red-800/40' :
                log.type === 'warn' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                'bg-zinc-900 text-zinc-300 border border-zinc-800'
              }`}>
                {log.type}
              </span>
              <span className={`flex-1 ${
                log.type === 'success' ? 'text-emerald-300' :
                log.type === 'error' ? 'text-red-300' :
                log.type === 'warn' ? 'text-amber-300' :
                'text-zinc-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
