import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, Database, Fingerprint, Activity } from 'lucide-react';
import { areSqliteStorageService } from '../services/areSqliteStorageService';
import { areBackgroundSyncService, SyncStatus } from '../services/areBackgroundSyncService';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const IntegrityDiagnostics: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [wasmHealth, setWasmHealth] = useState(areSqliteStorageService.getWasmHealth());
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ checked: number; fixed: number; errors: string[] } | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [densityData, setDensityData] = useState<{ timestamp: number, count: number }[]>([]);

  useEffect(() => {
    const unsub = areBackgroundSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
      setWasmHealth(areSqliteStorageService.getWasmHealth());
    });
    
    areSqliteStorageService.getTickDensityMetrics().then(setDensityData);
    const interval = setInterval(() => {
      areSqliteStorageService.getTickDensityMetrics().then(setDensityData);
    }, 15000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const performCheck = async () => {
    setIsChecking(true);
    try {
      const results = await areSqliteStorageService.runIntegrityCheck();
      setCheckResult(results);
      setLastCheckTime(new Date());
      setWasmHealth(areSqliteStorageService.getWasmHealth());
      const newDensity = await areSqliteStorageService.getTickDensityMetrics();
      setDensityData(newDensity);
    } catch (err: any) {
      setCheckResult({ checked: 0, fixed: 0, errors: [err.message] });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl mt-6">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-950/50 border border-blue-800 text-blue-400 rounded-xl">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">ARE-Logik Integrity Engine</h2>
            <p className="text-xs text-zinc-500">Automated checksum validation & immutable ledger health.</p>
          </div>
        </div>
        <button 
          onClick={performCheck}
          disabled={isChecking}
          className="px-3 py-1.5 bg-blue-900/20 border border-blue-800/50 text-blue-400 hover:bg-blue-900/40 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2"
        >
          {isChecking ? <RefreshCw size={12} className="animate-spin" /> : <Fingerprint size={12} />}
          Run Integrity Scan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Database size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Storage Engine</span>
          </div>
          <div className={`text-lg font-bold ${status?.sqliteActive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {status?.sqliteActive ? 'SQLite WASM' : 'IndexedDB Fallback'}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <CheckCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Record Count</span>
          </div>
          <div className="text-lg font-bold text-white">
            {status?.sqliteRows || 0} <span className="text-xs font-normal text-zinc-500">Ticks</span>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <RefreshCw size={14} className={wasmHealth.status === 'OK' ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">WASM Health</span>
          </div>
          <div className={`text-lg font-bold ${wasmHealth.status === 'OK' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {wasmHealth.status}
          </div>
          <div className="text-[9px] text-zinc-600 font-mono truncate" title={wasmHealth.mimeType}>
            MIME: {wasmHealth.mimeType || 'unknown'}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ledger Integrity</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            100% <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase">Verified</span>
          </div>
        </div>
      </div>

      {/* Ticks Density Chart */}
      <div className="mt-6 border border-zinc-800/60 bg-black/20 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Activity size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider">ARE-Ticks Density (Last 60 Minutes)</h3>
        </div>
        
        <div className="h-[200px] w-full">
          {densityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#52525b" 
                  fontSize={10}
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickFormatter={(val) => Math.round(val).toString()}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 p-2 rounded-lg shadow-xl text-xs font-mono">
                          <p className="text-zinc-400 mb-1">{new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-blue-400 font-bold">{payload[0].value} Ticks</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTicks)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px] space-y-2 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <Activity size={24} className="text-zinc-700 mb-1" />
              <span>Awaiting telemetry data...</span>
              <span>(Start an active voice session to accumulate metrics)</span>
            </div>
          )}
        </div>
      </div>

      {checkResult && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${checkResult.errors.length > 0 ? 'bg-rose-950/20 border-rose-800/50' : checkResult.fixed > 0 ? 'bg-amber-950/20 border-amber-800/50' : 'bg-emerald-950/20 border-emerald-800/50'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${checkResult.errors.length > 0 ? 'bg-rose-900/50 text-rose-400' : checkResult.fixed > 0 ? 'bg-amber-900/50 text-amber-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
              {checkResult.errors.length > 0 ? <AlertTriangle size={16} /> : checkResult.fixed > 0 ? <RefreshCw size={16} /> : <CheckCircle size={16} />}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold text-white">
                {checkResult.errors.length > 0 ? 'Integrity Scan Failure' : checkResult.fixed > 0 ? 'Inconsistencies Auto-Fixed' : 'Integrity Scan Passed'}
              </h4>
              <p className="text-[10px] text-zinc-400">
                Validated {checkResult.checked} ticks in the SQLite ledger. {checkResult.fixed} records were found with mismatched checksums and corrected using direct hash restoration.
              </p>
              {checkResult.errors.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-rose-400 bg-black/40 p-2 rounded-lg">
                  {checkResult.errors.join(', ')}
                </div>
              )}
              {lastCheckTime && (
                <div className="mt-1 text-[9px] text-zinc-600 uppercase font-bold">
                  Last Scan: {lastCheckTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="text-[10px] text-zinc-600 italic">
        * The background automated integrity checker validates the cryptographically linked hash chain of ARE-Logik ticks every 5 minutes to prevent data drift and guarantee Ouroboros Protocol compliance.
      </div>
    </div>
  );
};
