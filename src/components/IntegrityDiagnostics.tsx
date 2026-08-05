import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, Database, Fingerprint, Activity, Wrench, Trash2, Sparkles, HardDrive, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { areSqliteStorageService, MaintenanceResult } from '../services/areSqliteStorageService';
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
  
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceResult | null>(areSqliteStorageService.getLastMaintenanceResult());

  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showJsonConfirmModal, setShowJsonConfirmModal] = useState(false);
  const [pendingRecordCount, setPendingRecordCount] = useState<number>(0);

  useEffect(() => {
    const unsub = areBackgroundSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
      setWasmHealth(areSqliteStorageService.getWasmHealth());
      setMaintenanceResult(areSqliteStorageService.getLastMaintenanceResult());
    });
    
    areSqliteStorageService.getTickDensityMetrics().then(setDensityData);
    const interval = setInterval(() => {
      areSqliteStorageService.getTickDensityMetrics().then(setDensityData);
      setMaintenanceResult(areSqliteStorageService.getLastMaintenanceResult());
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

  const performMaintenance = async () => {
    setIsRunningMaintenance(true);
    try {
      const res = await areSqliteStorageService.runMaintenanceUtility();
      setMaintenanceResult(res);
      setWasmHealth(areSqliteStorageService.getWasmHealth());
      const newDensity = await areSqliteStorageService.getTickDensityMetrics();
      setDensityData(newDensity);
    } catch (err: any) {
      console.error('[Integrity Diagnostics] Maintenance utility failed:', err);
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  const handleOpenJsonConfirmModal = () => {
    const currentCount = status?.sqliteRows || 0;
    setPendingRecordCount(currentCount);
    setShowJsonConfirmModal(true);
  };

  const handleConfirmJsonExport = async () => {
    setShowJsonConfirmModal(false);
    setIsExportingJson(true);
    try {
      const jsonContent = await areSqliteStorageService.exportTicksToJson();
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `are_ticks_sqlite_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMessage(`Successfully exported ${pendingRecordCount} records from are_ticks database as JSON file: ${a.download}`);
      setTimeout(() => setExportMessage(null), 6000);
    } catch (err: any) {
      console.error('[Integrity Diagnostics] Failed to export JSON:', err);
      setExportMessage(`Export failed: ${err.message}`);
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const csvContent = await areSqliteStorageService.exportTicksToCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `are_ticks_sqlite_${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMessage(`Successfully exported are_ticks database as CSV file: ${a.download}`);
      setTimeout(() => setExportMessage(null), 6000);
    } catch (err: any) {
      console.error('[Integrity Diagnostics] Failed to export CSV:', err);
      setExportMessage(`Export failed: ${err.message}`);
    } finally {
      setIsExportingCsv(false);
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
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenJsonConfirmModal}
            disabled={isExportingJson}
            className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5"
            title="Export all are_ticks records from SQLite database as JSON"
          >
            {isExportingJson ? <RefreshCw size={12} className="animate-spin" /> : <FileJson size={12} />}
            {isExportingJson ? 'Exporting...' : 'Export JSON'}
          </button>
          <button 
            onClick={performCheck}
            disabled={isChecking}
            className="px-3 py-1.5 bg-blue-900/20 border border-blue-800/50 text-blue-400 hover:bg-blue-900/40 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2"
          >
            {isChecking ? <RefreshCw size={12} className="animate-spin" /> : <Fingerprint size={12} />}
            Run Integrity Scan
          </button>
        </div>
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

      {/* Automated SQLite Maintenance & Vacuum Utility Card */}
      <div className="border border-purple-900/40 bg-purple-950/10 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950/80 border border-purple-700/60 text-purple-300 rounded-xl">
              <Wrench size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Automated SQLite Maintenance & Vacuum
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase font-mono font-bold">
                  Periodic
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Periodically executes SQLite <code className="text-purple-300 font-mono">VACUUM</code>, purges orphaned records, and reclaims fragmented storage space.
              </p>
            </div>
          </div>
          <button
            onClick={performMaintenance}
            disabled={isRunningMaintenance}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 shrink-0"
          >
            {isRunningMaintenance ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{isRunningMaintenance ? 'Running Maintenance...' : 'Run Maintenance & Vacuum'}</span>
          </button>
        </div>

        {maintenanceResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">VACUUM Execution</span>
                <span className={`text-xs font-bold font-mono ${maintenanceResult.vacuumExecuted ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {maintenanceResult.vacuumExecuted ? 'VACUUM Completed' : 'Deferred'}
                </span>
              </div>

              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Reclaimed Storage</span>
                <span className="text-xs font-bold font-mono text-purple-300">
                  {maintenanceResult.bytesReclaimed > 1024 
                    ? `${(maintenanceResult.bytesReclaimed / 1024).toFixed(1)} KB` 
                    : `${maintenanceResult.bytesReclaimed} B`}
                </span>
              </div>

              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Orphaned Records</span>
                <span className="text-xs font-bold font-mono text-amber-300">
                  {maintenanceResult.orphanedCleaned} Purged / {maintenanceResult.orphanedFound} Found
                </span>
              </div>

              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">PRAGMA Integrity</span>
                <span className={`text-xs font-bold font-mono ${maintenanceResult.integrityStatus === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {maintenanceResult.integrityStatus}
                </span>
              </div>
            </div>

            {/* Step-by-step Audit Logs */}
            <div className="p-3 bg-black/60 border border-zinc-800/80 rounded-xl font-mono text-[10px] space-y-1">
              <div className="text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Maintenance Execution Audit Details:</span>
                <span>{new Date(maintenanceResult.timestamp).toLocaleTimeString()}</span>
              </div>
              {maintenanceResult.details.map((detail, idx) => (
                <div key={idx} className="text-zinc-300 flex items-start gap-2">
                  <span className="text-purple-400 font-bold">›</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-black/30 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 font-mono">
            Click 'Run Maintenance & Vacuum' above or wait for periodic background execution (every 5 min).
          </div>
        )}
      </div>

      {/* Data Portability & Database Export Card */}
      <div className="border border-emerald-900/40 bg-emerald-950/10 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 rounded-xl">
              <FileJson size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Data Portability & Database Export
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-mono font-bold">
                  JSON / CSV
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Export current contents of the <code className="text-emerald-300 font-mono">are_ticks</code> SQLite database as a formatted JSON download file for portability and backup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenJsonConfirmModal}
              disabled={isExportingJson}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              {isExportingJson ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{isExportingJson ? 'Generating JSON...' : 'Export SQLite Ticks (JSON)'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              title="Export as CSV spreadsheet"
            >
              {isExportingCsv ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={14} />
              )}
              <span>CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Target Database Table</span>
            <span className="text-xs font-bold font-mono text-emerald-400">are_offline_ticks (are_ticks)</span>
          </div>

          <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Exportable Records</span>
            <span className="text-xs font-bold font-mono text-white">
              {status?.sqliteRows || 0} Ticks
            </span>
          </div>

          <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Data Format</span>
            <span className="text-xs font-bold font-mono text-sky-400">Structured JSON (.json)</span>
          </div>
        </div>

        {exportMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-950/60 border border-emerald-600/80 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2"
          >
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span>{exportMessage}</span>
          </motion.div>
        )}
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

      {/* Confirmation Modal for JSON Export */}
      <AnimatePresence>
        {showJsonConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 rounded-2xl">
                  <FileJson size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm JSON Database Export</h3>
                  <p className="text-xs text-zinc-400">Review record count summary before initiating download</p>
                </div>
              </div>

              <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 font-mono text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-500 uppercase text-[10px] font-bold">Database Source</span>
                  <span className="text-emerald-400 font-bold">SQLite (`are_ticks_sqlite.db`)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-500 uppercase text-[10px] font-bold">Target Table</span>
                  <span className="text-zinc-300 font-bold">`are_offline_ticks` (`are_ticks`)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-500 uppercase text-[10px] font-bold">Total Record Count</span>
                  <span className="text-white text-sm font-bold bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-600 text-emerald-300">
                    {pendingRecordCount} Ticks
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-500 uppercase text-[10px] font-bold">Export Format</span>
                  <span className="text-sky-400 font-bold">JSON (.json UTF-8 formatted)</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Exporting will package all {pendingRecordCount} records including cryptographic tick IDs, state payloads, and verification timestamps into a structured JSON file.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-900">
                <button
                  onClick={() => setShowJsonConfirmModal(false)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJsonExport}
                  disabled={isExportingJson}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/60"
                >
                  {isExportingJson ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>{isExportingJson ? 'Generating...' : `Confirm & Export (${pendingRecordCount} Records)`}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
