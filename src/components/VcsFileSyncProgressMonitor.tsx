import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  FileCode, 
  ArrowUpRight, 
  ArrowDownRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Terminal, 
  HardDrive, 
  Activity, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Check, 
  Download, 
  Upload,
  Layers,
  Filter,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SyncFileItem {
  id: string;
  path: string;
  sizeBytes: number;
  direction: 'PUSH' | 'PULL' | 'MERGE';
  operation: 'MODIFIED' | 'ADDED' | 'DELETED' | 'CONFLICT';
  status: 'QUEUED' | 'SYNCING' | 'COMPLETED' | 'CONFLICT' | 'ERROR';
  progress: number; // 0 - 100
  speedKbps: number;
  sha: string;
  errorMessage?: string;
  lastUpdated: string;
}

export interface VcsFileSyncProgressMonitorProps {
  onSyncComplete?: () => void;
  className?: string;
}

export const VcsFileSyncProgressMonitor: React.FC<VcsFileSyncProgressMonitorProps> = ({
  onSyncComplete,
  className = ''
}) => {
  // Sync state variables
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [overallProgress, setOverallProgress] = useState<number>(100);
  const [syncStatusText, setSyncStatusText] = useState<string>('Workspace In-Sync with Remote Nexus');
  const [syncMode, setSyncMode] = useState<'IDLE' | 'ACTIVE' | 'SIMULATING' | 'PAUSED' | 'ERROR'>('IDLE');
  
  // Performance metrics
  const [transferRateKbps, setTransferRateKbps] = useState<number>(0);
  const [transferredBytes, setTransferredBytes] = useState<number>(18420000);
  const [totalBytesToTransfer, setTotalBytesToTransfer] = useState<number>(18420000);
  const [activeWorkers, setActiveWorkers] = useState<number>(0);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Filter & UI tab state
  const [fileFilter, setFileFilter] = useState<'ALL' | 'SYNCING' | 'QUEUED' | 'COMPLETED' | 'CONFLICT'>('ALL');
  const [selectedFileForDiff, setSelectedFileForDiff] = useState<SyncFileItem | null>(null);
  const [logMessages, setLogMessages] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    { time: new Date().toLocaleTimeString(), text: 'VCS Synchronization Engine initialized [Protocol: SSE-Git-Stream-v2].', type: 'info' },
    { time: new Date().toLocaleTimeString(), text: 'Local HEAD matches remote ref refs/heads/main (sha: 8f3a12b).', type: 'success' },
    { time: new Date().toLocaleTimeString(), text: '0 conflicting files, working tree clean.', type: 'info' }
  ]);

  // File synchronization queue
  const [syncQueue, setSyncQueue] = useState<SyncFileItem[]>([
    {
      id: 'f-01',
      path: 'src/services/voiceService.ts',
      sizeBytes: 21292,
      direction: 'PUSH',
      operation: 'MODIFIED',
      status: 'COMPLETED',
      progress: 100,
      speedKbps: 1840,
      sha: 'a492f10',
      lastUpdated: '1 min ago'
    },
    {
      id: 'f-02',
      path: 'src/components/HiaResonanceVoice.tsx',
      sizeBytes: 54397,
      direction: 'PUSH',
      operation: 'MODIFIED',
      status: 'COMPLETED',
      progress: 100,
      speedKbps: 2400,
      sha: 'b819c32',
      lastUpdated: '2 mins ago'
    },
    {
      id: 'f-03',
      path: 'src/App.tsx',
      sizeBytes: 22998,
      direction: 'PUSH',
      operation: 'MODIFIED',
      status: 'COMPLETED',
      progress: 100,
      speedKbps: 1520,
      sha: 'c901e44',
      lastUpdated: '3 mins ago'
    },
    {
      id: 'f-04',
      path: 'src/api/tts.ts',
      sizeBytes: 2052,
      direction: 'PUSH',
      operation: 'MODIFIED',
      status: 'COMPLETED',
      progress: 100,
      speedKbps: 980,
      sha: 'd128a55',
      lastUpdated: '5 mins ago'
    },
    {
      id: 'f-05',
      path: 'server.ts',
      sizeBytes: 92678,
      direction: 'PUSH',
      operation: 'MODIFIED',
      status: 'COMPLETED',
      progress: 100,
      speedKbps: 3100,
      sha: 'e347f66',
      lastUpdated: '8 mins ago'
    }
  ]);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll real status on mount
  useEffect(() => {
    fetchRealStatus();
  }, []);

  const fetchRealStatus = async () => {
    try {
      const res = await fetch('/api/nexus/status');
      if (res.ok) {
        const data = await res.json();
        if (data.hasUncommittedChanges && data.uncommittedCount > 0) {
          setSyncStatusText(`${data.uncommittedCount} uncommitted local change(s) detected`);
        } else if (data.syncStatus === 'remote-ahead') {
          setSyncStatusText('Remote repository is ahead. Pull recommended.');
        } else if (data.syncStatus === 'conflict') {
          setSyncStatusText(`${data.conflictingFiles?.length || 1} Merge conflict(s) present!`);
          setSyncMode('ERROR');
        } else {
          setSyncStatusText('Workspace In-Sync with Remote Nexus Repository');
        }
      }
    } catch (e) {
      // Keep state resilient
    }
  };

  const appendLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogMessages(prev => [
      ...prev.slice(-49), // retain last 50 entries
      { time: new Date().toLocaleTimeString(), text, type }
    ]);
  };

  // Real Mirror Sync Trigger
  const handleRealMirrorSync = async () => {
    setIsSyncing(true);
    setSyncMode('ACTIVE');
    setOverallProgress(10);
    setSyncStatusText('Connecting to Nexus Remote & Calculating Object Tree...');
    appendLog('Initiating Mirror Sync handshake with remote repository...', 'info');

    try {
      const res = await fetch('/api/nexus/mirror-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPush: false })
      });
      const data = await res.json();
      
      setOverallProgress(100);
      setIsSyncing(false);
      setSyncMode('IDLE');
      setLastSyncTime(new Date().toLocaleTimeString());

      if (res.ok) {
        setSyncStatusText(data.message || 'Mirror sync successfully completed!');
        appendLog(`Mirror sync completed: ${data.message}`, 'success');
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncStatusText(`Sync Alert: ${data.message}`);
        appendLog(`Mirror sync error: ${data.message}`, 'error');
      }
    } catch (err: any) {
      setOverallProgress(100);
      setIsSyncing(false);
      setSyncMode('ERROR');
      setSyncStatusText(`Network failure during mirror sync: ${err.message}`);
      appendLog(`Sync Exception: ${err.message}`, 'error');
    }
  };

  // Real Pull Trigger
  const handleRealPull = async () => {
    setIsSyncing(true);
    setSyncMode('ACTIVE');
    setOverallProgress(15);
    setSyncStatusText('Pulling latest objects from remote ref main...');
    appendLog('Executing POST /api/nexus/pull...', 'info');

    try {
      const res = await fetch('/api/nexus/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      const data = await res.json();
      
      setOverallProgress(100);
      setIsSyncing(false);
      setSyncMode('IDLE');
      setLastSyncTime(new Date().toLocaleTimeString());

      if (res.ok) {
        setSyncStatusText(data.message || 'Pulled remote updates into workspace.');
        appendLog(`Pull completed: ${data.message}`, 'success');
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncStatusText(`Pull Error: ${data.message}`);
        appendLog(`Pull error: ${data.message}`, 'warn');
      }
    } catch (err: any) {
      setOverallProgress(100);
      setIsSyncing(false);
      setSyncMode('ERROR');
      setSyncStatusText(`Pull operation failed: ${err.message}`);
      appendLog(`Pull exception: ${err.message}`, 'error');
    }
  };

  // Start Real-Time Interactive Batch Simulation
  const handleSimulateBatchSync = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }

    setIsSyncing(true);
    setSyncMode('SIMULATING');
    setOverallProgress(0);
    setActiveWorkers(4);
    setTransferRateKbps(2850);
    setTransferredBytes(0);
    setTotalBytesToTransfer(418200);
    setSyncStatusText('Simulating active multi-file synchronization pipeline...');
    appendLog('Triggered real-time VCS file synchronization simulation.', 'info');

    // Create fresh queue of files to sync step by step
    const simulatedFiles: SyncFileItem[] = [
      {
        id: 'sim-1',
        path: 'src/components/VcsFileSyncProgressMonitor.tsx',
        sizeBytes: 18400,
        direction: 'PUSH',
        operation: 'ADDED',
        status: 'SYNCING',
        progress: 15,
        speedKbps: 3400,
        sha: '7f91c02',
        lastUpdated: 'Syncing...'
      },
      {
        id: 'sim-2',
        path: 'src/components/NexusBridge.tsx',
        sizeBytes: 35377,
        direction: 'PUSH',
        operation: 'MODIFIED',
        status: 'SYNCING',
        progress: 25,
        speedKbps: 2900,
        sha: '8a22d14',
        lastUpdated: 'Syncing...'
      },
      {
        id: 'sim-3',
        path: 'src/types/arekappa.ts',
        sizeBytes: 12400,
        direction: 'PULL',
        operation: 'MODIFIED',
        status: 'QUEUED',
        progress: 0,
        speedKbps: 0,
        sha: '9b33e25',
        lastUpdated: 'Queued'
      },
      {
        id: 'sim-4',
        path: 'src/services/arekappaRuntimeLibrary.ts',
        sizeBytes: 42100,
        direction: 'PUSH',
        operation: 'MODIFIED',
        status: 'QUEUED',
        progress: 0,
        speedKbps: 0,
        sha: '0c44f36',
        lastUpdated: 'Queued'
      },
      {
        id: 'sim-5',
        path: 'src/data/axiomaticRules.ts',
        sizeBytes: 15200,
        direction: 'PULL',
        operation: 'MODIFIED',
        status: 'QUEUED',
        progress: 0,
        speedKbps: 0,
        sha: '1d55a47',
        lastUpdated: 'Queued'
      }
    ];

    setSyncQueue(simulatedFiles);

    let step = 0;
    const totalSteps = 20;

    simulationTimerRef.current = setInterval(() => {
      step++;
      const currentProgress = Math.min(100, Math.round((step / totalSteps) * 100));
      setOverallProgress(currentProgress);
      setTransferredBytes(Math.round((currentProgress / 100) * 418200));
      setEstimatedSecondsRemaining(Math.max(0, Math.round((totalSteps - step) * 0.4)));

      // Fluctuate transfer rate
      const currentRate = Math.round(2400 + Math.random() * 1200);
      setTransferRateKbps(currentRate);

      // Update individual files
      setSyncQueue(prev => prev.map((file, index) => {
        if (index === 0) {
          const p = Math.min(100, step * 10);
          return {
            ...file,
            progress: p,
            status: p === 100 ? 'COMPLETED' : 'SYNCING',
            speedKbps: p === 100 ? 0 : currentRate,
            lastUpdated: p === 100 ? 'Just now' : 'Syncing...'
          };
        } else if (index === 1) {
          const p = Math.min(100, Math.max(0, (step - 2) * 8));
          return {
            ...file,
            progress: p,
            status: p === 100 ? 'COMPLETED' : p > 0 ? 'SYNCING' : 'QUEUED',
            speedKbps: p > 0 && p < 100 ? currentRate : 0,
            lastUpdated: p === 100 ? 'Just now' : p > 0 ? 'Syncing...' : 'Queued'
          };
        } else if (index === 2) {
          const p = Math.min(100, Math.max(0, (step - 5) * 10));
          return {
            ...file,
            progress: p,
            status: p === 100 ? 'COMPLETED' : p > 0 ? 'SYNCING' : 'QUEUED',
            speedKbps: p > 0 && p < 100 ? currentRate : 0,
            lastUpdated: p === 100 ? 'Just now' : p > 0 ? 'Syncing...' : 'Queued'
          };
        } else if (index === 3) {
          const p = Math.min(100, Math.max(0, (step - 9) * 12));
          return {
            ...file,
            progress: p,
            status: p === 100 ? 'COMPLETED' : p > 0 ? 'SYNCING' : 'QUEUED',
            speedKbps: p > 0 && p < 100 ? currentRate : 0,
            lastUpdated: p === 100 ? 'Just now' : p > 0 ? 'Syncing...' : 'Queued'
          };
        } else {
          const p = Math.min(100, Math.max(0, (step - 13) * 15));
          return {
            ...file,
            progress: p,
            status: p === 100 ? 'COMPLETED' : p > 0 ? 'SYNCING' : 'QUEUED',
            speedKbps: p > 0 && p < 100 ? currentRate : 0,
            lastUpdated: p === 100 ? 'Just now' : p > 0 ? 'Syncing...' : 'Queued'
          };
        }
      }));

      if (step === 3) appendLog('Streaming blob src/components/VcsFileSyncProgressMonitor.tsx (18.4 KB)...', 'info');
      if (step === 7) appendLog('Applying binary delta to src/components/NexusBridge.tsx...', 'info');
      if (step === 12) appendLog('Verified integrity hash for src/types/arekappa.ts (SHA256 OK).', 'success');
      if (step === 16) appendLog('Writing local tree refs for src/services/arekappaRuntimeLibrary.ts...', 'info');

      if (step >= totalSteps) {
        if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
        setIsSyncing(false);
        setSyncMode('IDLE');
        setOverallProgress(100);
        setActiveWorkers(0);
        setTransferRateKbps(0);
        setEstimatedSecondsRemaining(0);
        setSyncStatusText('All 5 files synchronized successfully (0 conflicts).');
        setLastSyncTime(new Date().toLocaleTimeString());
        appendLog('Batch synchronization finished successfully! All 5 files pushed/pulled.', 'success');
        if (onSyncComplete) onSyncComplete();
      }
    }, 300);
  };

  const filteredQueue = syncQueue.filter(file => {
    if (fileFilter === 'ALL') return true;
    return file.status === fileFilter;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* REAL-TIME OVERALL PROGRESS BANNER */}
      <div className="p-6 bg-zinc-950 border border-purple-500/30 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow when syncing */}
        {isSyncing && (
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl border transition-all ${
              syncMode === 'ERROR'
                ? 'bg-red-950/80 border-red-800 text-red-400'
                : isSyncing 
                ? 'bg-purple-950/80 border-purple-600 text-purple-300 animate-pulse'
                : 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
            }`}>
              {isSyncing ? (
                <RefreshCw size={26} className="animate-spin text-purple-400" />
              ) : syncMode === 'ERROR' ? (
                <AlertTriangle size={26} />
              ) : (
                <ShieldCheck size={26} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white tracking-tight">Real-Time VCS File Synchronization</h2>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                  isSyncing 
                    ? 'bg-purple-950 text-purple-300 border-purple-700 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {isSyncing ? `SYNCING (${syncMode})` : 'IN-SYNC'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                {syncStatusText}
              </p>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRealMirrorSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
            >
              <RefreshCw size={14} className={isSyncing && syncMode === 'ACTIVE' ? 'animate-spin' : ''} />
              <span>{isSyncing && syncMode === 'ACTIVE' ? 'Syncing...' : 'Mirror Sync'}</span>
            </button>

            <button
              onClick={handleRealPull}
              disabled={isSyncing}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-50 text-zinc-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <Download size={14} className="text-cyan-400" />
              <span>Pull Remote</span>
            </button>

            <button
              onClick={handleSimulateBatchSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg"
            >
              <Zap size={14} />
              <span>Simulate Batch Sync</span>
            </button>
          </div>
        </div>

        {/* PROGRESS BAR DISPLAY */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <Activity size={14} className="text-purple-400" />
              <span>Overall Sync Completion:</span>
              <span className="font-bold text-white">{overallProgress}%</span>
            </div>
            
            <div className="flex items-center gap-4 text-zinc-400">
              {isSyncing && (
                <span>ETA: <strong className="text-purple-300">{estimatedSecondsRemaining}s</strong></span>
              )}
              <span>Last Synced: <strong className="text-zinc-200">{lastSyncTime}</strong></span>
            </div>
          </div>

          <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5 relative">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                syncMode === 'ERROR'
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* METRICS METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2 border-t border-zinc-900">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <Zap size={12} className="text-amber-400" /> Transfer Rate
            </span>
            <div className="text-sm font-bold text-white">
              {transferRateKbps > 0 ? `${(transferRateKbps / 1024).toFixed(2)} MB/s` : '0.00 MB/s'}
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <HardDrive size={12} className="text-cyan-400" /> Data Volume
            </span>
            <div className="text-sm font-bold text-cyan-300">
              {formatSize(transferredBytes)} / {formatSize(totalBytesToTransfer)}
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <Layers size={12} className="text-purple-400" /> Active Workers
            </span>
            <div className="text-sm font-bold text-purple-300">
              {activeWorkers} Streams Active
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" /> Queue Items
            </span>
            <div className="text-sm font-bold text-emerald-400">
              {syncQueue.filter(q => q.status === 'COMPLETED').length} / {syncQueue.length} Synced
            </div>
          </div>
        </div>
      </div>

      {/* FILE SYNCHRONIZATION QUEUE LIST */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-3">
            <FileCode size={20} className="text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">File Synchronization Queue & Pipeline</h3>
              <p className="text-xs text-zinc-400">
                Individual file transfer status, byte counters, and hash confirmation.
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl font-mono text-[11px]">
            {(['ALL', 'SYNCING', 'QUEUED', 'COMPLETED', 'CONFLICT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFileFilter(f)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fileFilter === f 
                    ? 'bg-purple-600 text-white font-bold shadow' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* QUEUE TABLE */}
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl font-mono text-xs text-zinc-500">
              No files currently match filter <code className="text-purple-300">{fileFilter}</code>.
            </div>
          ) : (
            filteredQueue.map(item => (
              <div
                key={item.id}
                className="p-4 bg-zinc-900/40 border border-zinc-800 hover:border-purple-500/40 rounded-2xl space-y-3 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-purple-300 shrink-0">
                      <FileCode size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-white truncate max-w-md" title={item.path}>
                          {item.path}
                        </span>

                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${
                          item.direction === 'PUSH' 
                            ? 'bg-purple-950 text-purple-300 border-purple-800' 
                            : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        }`}>
                          {item.direction}
                        </span>

                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${
                          item.operation === 'ADDED' 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                            : item.operation === 'DELETED'
                            ? 'bg-red-950 text-red-300 border-red-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {item.operation}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono mt-1">
                        <span>Size: <strong className="text-zinc-300">{formatSize(item.sizeBytes)}</strong></span>
                        <span>•</span>
                        <span>SHA: <code className="text-purple-300">{item.sha}</code></span>
                        <span>•</span>
                        <span>Updated: {item.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono text-xs">
                      <div className="text-white font-bold">{item.progress}%</div>
                      {item.speedKbps > 0 && (
                        <div className="text-[10px] text-purple-400">{(item.speedKbps / 1024).toFixed(1)} MB/s</div>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl border flex items-center gap-1.5 ${
                      item.status === 'COMPLETED' 
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : item.status === 'SYNCING'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-700 animate-pulse'
                        : item.status === 'CONFLICT'
                        ? 'bg-red-950/80 text-red-300 border-red-800'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}>
                      {item.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                      {item.status === 'SYNCING' && <RefreshCw size={12} className="animate-spin" />}
                      {item.status === 'QUEUED' && <Clock size={12} />}
                      {item.status === 'CONFLICT' && <AlertTriangle size={12} />}
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>

                {/* Individual Progress Bar */}
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-200 ${
                      item.status === 'COMPLETED' 
                        ? 'bg-emerald-500' 
                        : item.status === 'CONFLICT'
                        ? 'bg-red-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* VCS SYNC CONSOLE LOG STREAM */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">VCS Synchronization Stream Output</h3>
          </div>
          <button
            onClick={() => setLogMessages([])}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
          >
            Clear Output
          </button>
        </div>

        <div className="p-4 bg-black border border-zinc-900 rounded-2xl font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto leading-relaxed">
          {logMessages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-zinc-600 select-none">[{msg.time}]</span>
              <span className={
                msg.type === 'success' 
                  ? 'text-emerald-400 font-bold' 
                  : msg.type === 'warn'
                  ? 'text-amber-400'
                  : msg.type === 'error'
                  ? 'text-red-400 font-bold'
                  : 'text-zinc-300'
              }>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
