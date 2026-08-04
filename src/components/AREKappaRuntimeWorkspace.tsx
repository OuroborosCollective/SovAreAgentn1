import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Play, 
  Terminal, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Activity, 
  Brain, 
  Flame, 
  Database, 
  Sliders, 
  Wrench, 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  Layers,
  Code2,
  Lock,
  Unlock,
  Trash2,
  Fingerprint,
  FileText,
  Check,
  X,
  ArrowDown,
  HelpCircle,
  Copy,
  Link,
  Link2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { KappaIREngine } from '../services/kappaIREngine';
import { KappaIRProgram, KappaEffect, KappaPrimitiveType } from '../types/arekappa';
import { StaticAnalysisReport, StaticAnalysisIssue } from '../services/arekappaStaticAnalyzer';
import { PredictiveMetrics, WolframSystemStatus, MockViolation } from '../services/arekappaRuntimeLibrary';
import { areBackgroundSyncService, SyncStatus } from '../services/areBackgroundSyncService';

export const AREKappaRuntimeWorkspace: React.FC = () => {
  // Source Code input
  const [sourceCode, setSourceCode] = useState<string>(
`// Sample κIR High-Value Script
let databaseValue = read("user_profile_data")
let result = databaseValue * 2
write(result)
fetch("https://api.ouroboros.io/sync?val=" + result)
`);
  const [sourceLanguage, setSourceLanguage] = useState<'TypeScript' | 'Python'>('TypeScript');
  const [program, setProgram] = useState<KappaIRProgram | null>(null);
  const [compileLog, setCompileLog] = useState<string[]>([]);
  
  // Static Analysis & Circuit Breaker State
  const [analysisReport, setAnalysisReport] = useState<StaticAnalysisReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [circuitBreaker, setCircuitBreaker] = useState<'CLOSED' | 'TRIPPED'>('CLOSED');

  // Predictive Inference & Wolfram System Status
  const [predictiveMetrics, setPredictiveMetrics] = useState<PredictiveMetrics | null>(null);
  const [wolframStatus, setWolframStatus] = useState<WolframSystemStatus | null>(null);
  const [isScanningCodebase, setIsScanningCodebase] = useState(false);
  const [repairingFile, setRepairingFile] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);

  // Evidence Receipt Ledger State
  const [ledger, setLedger] = useState<any[]>([]);
  const [verificationReport, setVerificationReport] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  
  // ARE Background Sync Offline Queue State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    lastError: null,
    sqliteActive: false,
    sqliteRows: 0,
    sqliteSizeBytes: 0
  });

  // Interactive Tampering State
  const [targetTamperIndex, setTargetTamperIndex] = useState<number | null>(null);
  const [targetTamperKey, setTargetTamperKey] = useState<string>('outputsHash');
  const [targetTamperValue, setTargetTamperValue] = useState<string>('0xκIR_TAMPERED_HASH_BAD_888');

  // Load backend telemetry, codebase status, & ledger on mount
  useEffect(() => {
    fetchTelemetry();
    handleCompile();
    fetchLedger();

    const unsubscribeSync = areBackgroundSyncService.subscribe((status) => {
      setSyncStatus(status);
      if (status.lastSyncedAt) {
        fetchLedger();
        verifyLedger();
      }
    });

    return () => unsubscribeSync();
  }, []);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/arekappa/telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        if (data.mockViolations) {
          setWolframStatus({
            totalFilesScanned: data.totalFilesScanned,
            mockViolations: data.mockViolations,
            systemHealthy: data.violationsCount === 0,
            timestamp: data.lastScanTime || new Date().toISOString()
          });
        }
        if (data.circuitBreakerState) {
          setCircuitBreaker(data.circuitBreakerState);
        }
      }
    } catch (e) {
      console.error('Failed to fetch telemetry:', e);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/arekappa/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedger(data.ledger || []);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    }
  };

  const verifyLedger = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/arekappa/ledger/verify');
      if (res.ok) {
        const data = await res.json();
        setVerificationReport(data.report);
      }
    } catch (err) {
      console.error('Ledger verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const executeAndAppendLedger = async () => {
    if (!program) {
      alert('Please compile the program successfully first.');
      return;
    }
    setIsExecuting(true);
    setExecutionResult(null);

    // If browser is offline, queue directly into IndexedDB without making fetch request
    if (!navigator.onLine) {
      try {
        const queuedTick = await areBackgroundSyncService.enqueueTick(program);
        setExecutionResult({
          resultValue: 'QUEUED_OFFLINE_INDEXEDDB',
          evidenceReceipt: {
            receiptId: queuedTick.id,
            previousReceiptHash: '0xOFFLINE_PENDING_CHAIN_LINK',
            programHash: '0x' + program.programId,
            outputsHash: '0xOFFLINE_PENDING',
            stateDeltaHash: '0xOFFLINE_DELTA',
            chainHash: '0xOFFLINE_LOCAL_QUEUE',
            timestamp: queuedTick.queuedAt,
            executedBy: 'ARE_BACKGROUND_SYNC_SW',
            signature: 'SIG_OFFLINE_LOCAL_QUEUE'
          },
          executionLog: [
            `Network offline. ARE-Logik tick ${queuedTick.id} saved to IndexedDB.`,
            `Immutable Information Axiom preserved: Tick will auto-sync to server database upon network restoration.`
          ]
        });
      } catch (queueErr: any) {
        setExecutionResult({
          resultValue: 'OFFLINE_QUEUE_FAILED',
          errorValue: queueErr.message,
          executionLog: ['Failed to write tick to local IndexedDB queue.']
        });
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/arekappa/ledger/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'queued_offline') {
          setExecutionResult({
            resultValue: data.resultValue,
            evidenceReceipt: {
              receiptId: data.tickId,
              previousReceiptHash: '0xOFFLINE_PENDING',
              programHash: '0x' + program.programId,
              outputsHash: '0xOFFLINE_PENDING',
              stateDeltaHash: '0xOFFLINE_DELTA',
              chainHash: '0xOFFLINE_SW_QUEUE',
              timestamp: Date.now(),
              executedBy: 'SERVICE_WORKER_OFFLINE_QUEUE',
              signature: 'SIG_OFFLINE_QUEUED'
            },
            executionLog: data.executionLog || ['Tick queued in Service Worker IndexedDB.']
          });
        } else {
          setExecutionResult({
            resultValue: data.resultValue,
            evidenceReceipt: data.evidenceReceipt,
            executionLog: data.executionLog
          });
          await fetchLedger();
          await verifyLedger();
        }
      } else {
        const data = await res.json();
        setExecutionResult({
          resultValue: 'HALTED_VIOLATION_TRIGGERED',
          errorValue: data.message || 'Execution halted due to strict validation/type violation',
          executionLog: [data.message || 'Formal verification constraint violation intercepted. Runtime execution halted.']
        });
      }
    } catch (err: any) {
      console.warn('Network error during execution. Enqueueing offline:', err);
      try {
        const queuedTick = await areBackgroundSyncService.enqueueTick(program);
        setExecutionResult({
          resultValue: 'QUEUED_OFFLINE_INDEXEDDB',
          evidenceReceipt: {
            receiptId: queuedTick.id,
            previousReceiptHash: '0xOFFLINE_PENDING',
            programHash: '0x' + program.programId,
            outputsHash: '0xOFFLINE_PENDING',
            stateDeltaHash: '0xOFFLINE_DELTA',
            chainHash: '0xOFFLINE_LOCAL_QUEUE',
            timestamp: queuedTick.queuedAt,
            executedBy: 'ARE_BACKGROUND_SYNC_SW',
            signature: 'SIG_OFFLINE_LOCAL_QUEUE'
          },
          executionLog: [
            `Network request failed. ARE-Logik tick ${queuedTick.id} saved to IndexedDB.`,
            `Immutable Information Axiom preserved: Tick will auto-sync to server database upon network restoration.`
          ]
        });
      } catch (queueErr: any) {
        setExecutionResult({
          resultValue: 'EXECUTION_FAILED',
          errorValue: err.message,
          executionLog: ['Network request failed and could not enqueue locally.']
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const tamperLedgerItem = async (index: number) => {
    if (index === null || index === undefined) return;
    try {
      const res = await fetch('/api/arekappa/ledger/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index,
          key: targetTamperKey,
          newValue: targetTamperValue
        })
      });
      if (res.ok) {
        setTargetTamperIndex(null);
        await fetchLedger();
        await verifyLedger();
      }
    } catch (err) {
      console.error('Failed to tamper with receipt:', err);
    }
  };

  const clearLedgerHistory = async () => {
    if (!confirm('Are you sure you want to clear the entire append-only history? This will delete the hash chain.')) {
      return;
    }
    try {
      const res = await fetch('/api/arekappa/ledger/clear', { method: 'POST' });
      if (res.ok) {
        setLedger([]);
        setVerificationReport(null);
        setExecutionResult(null);
      }
    } catch (err) {
      console.error('Failed to clear ledger:', err);
    }
  };

  const handleCompile = () => {
    const logs: string[] = [];
    logs.push(`[Compiler] Initializing AREKappa Compiler v1.0.0...`);
    logs.push(`[Compiler] Language Target: ${sourceLanguage}`);
    
    try {
      const compiledProg = KappaIREngine.compileToKappaIR(sourceCode, sourceLanguage);
      setProgram(compiledProg);
      logs.push(`[Compiler] Compilation Successful. Assigned Program ID: ${compiledProg.programId}`);
      logs.push(`[Compiler] Content Address Hash: ${compiledProg.canonicalHash}`);
      logs.push(`[Compiler] Emitted Nodes: ${Object.keys(compiledProg.nodes).length}`);
      
      // Calculate predictive inference locally
      calculatePredictiveMetrics(compiledProg);
      // Automatically run formal static analysis via API
      runFormalAnalysis(compiledProg);
    } catch (err: any) {
      logs.push(`[Compiler Error] Compilation Failed: ${err.message}`);
    }
    setCompileLog(logs);
  };

  const runFormalAnalysis = async (prog: KappaIRProgram) => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/arekappa/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: prog })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisReport(data.report);
        setCircuitBreaker(data.report.circuitBreakerState);
      }
    } catch (err) {
      console.error('Failed to run static analysis:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const calculatePredictiveMetrics = (prog: KappaIRProgram) => {
    // Generate simulated/calculated metrics mirroring server calculations
    let baseFailureProb = 0.01;
    let estimatedLatencyMs = 5;
    let memoryFootprintBytes = 1024;
    const riskFactors: string[] = [];

    const nodes = Object.values(prog.nodes);
    estimatedLatencyMs += nodes.length * 2;
    memoryFootprintBytes += nodes.length * 512;

    nodes.forEach(node => {
      if (node.effect === 'NETWORK') {
        baseFailureProb += 0.15;
        estimatedLatencyMs += 120;
        riskFactors.push(`Node [${node.id}] introduces NETWORK IO latency and failure risk.`);
      } else if (node.effect === 'PROCESS') {
        baseFailureProb += 0.08;
        estimatedLatencyMs += 40;
        riskFactors.push(`Node [${node.id}] runs heavy PROCESS hosting operations.`);
      } else if (node.effect === 'WRITE') {
        baseFailureProb += 0.03;
        estimatedLatencyMs += 10;
      } else if (node.effect === 'RANDOM') {
        baseFailureProb += 0.05;
        riskFactors.push(`Node [${node.id}] uses host entropy RANDOM (unverifiable).`);
      }
    });

    setPredictiveMetrics({
      failureProbability: Math.min(baseFailureProb, 0.99),
      estimatedLatencyMs,
      memoryFootprintBytes,
      riskFactors: Array.from(new Set(riskFactors))
    });
  };

  const triggerCodebaseScan = async () => {
    setIsScanningCodebase(true);
    try {
      const res = await fetch('/api/arekappa/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWolframStatus(data.report);
        await fetchTelemetry();
      }
    } catch (e) {
      console.error('Codebase scan failed:', e);
    } finally {
      setIsScanningCodebase(false);
    }
  };

  const handleSelfRepair = async (violation: MockViolation) => {
    setRepairingFile(violation.filePath);
    try {
      const res = await fetch('/api/arekappa/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: violation.filePath,
          issueSnippet: violation.detectedPattern
        })
      });
      if (res.ok) {
        // Trigger fresh scan & telemetry
        await triggerCodebaseScan();
      }
    } catch (e) {
      console.error('Repair failed:', e);
    } finally {
      setRepairingFile(null);
    }
  };

  // Inject a mock violation for validation (or allow user to trigger validation)
  const injectTypeViolation = () => {
    setSourceCode(prev => prev + `\n// Injecting intentional Type Check Violation\nlet invalidSum = "string" + 42\n`);
    setTimeout(() => handleCompile(), 100);
  };

  const injectEffectViolation = () => {
    setSourceCode(prev => prev + `\n// Injecting intentional Effect Constraint Violation\nfetch("http://malicious-node.io/leak")\n`);
    setTimeout(() => handleCompile(), 100);
  };

  // Chart data for predicted failure risk vs latency based on current complexity
  const graphData = [
    { name: 'Pure', risk: 1, latency: 5 },
    { name: 'Read', risk: 5, latency: 20 },
    { name: 'Clock', risk: 7, latency: 22 },
    { name: 'Write', risk: 10, latency: 32 },
    { name: 'Random', risk: 15, latency: 37 },
    { name: 'Process', risk: 23, latency: 77 },
    { name: 'Network', risk: 38, latency: 197 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* SERVICE WORKER BACKGROUND SYNC WIDGET */}
      <div className="p-4 bg-zinc-950/90 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
            syncStatus.isOnline
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
              : 'bg-amber-950/80 text-amber-400 border-amber-700/60'
          }`}>
            <Database size={20} className={syncStatus.isSyncing ? 'animate-spin' : ''} />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Service Worker Background Sync
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
                syncStatus.isOnline
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
              }`}>
                {syncStatus.isOnline ? 'ONLINE (Direct Sync)' : 'OFFLINE (IndexedDB Active)'}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-pink-950 text-pink-300 border border-pink-700">
                Axiom: Immutable Information
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Queues ARE-Logik ticks in IndexedDB when offline and automatically flushes to database once connectivity is restored.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {syncStatus.pendingCount > 0 && (
            <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-700 rounded-xl text-xs font-mono font-bold">
              {syncStatus.pendingCount} Queued Offline
            </span>
          )}

          <button
            onClick={() => areBackgroundSyncService.flushQueue()}
            disabled={syncStatus.isSyncing || !syncStatus.isOnline || syncStatus.pendingCount === 0}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-40"
          >
            <RefreshCw size={14} className={syncStatus.isSyncing ? 'animate-spin' : ''} />
            {syncStatus.isSyncing ? 'Flushing Queue...' : 'Flush Queue Now'}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-600/10 border border-pink-500/20 text-pink-400">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">AREKappa κIR Runtime Workspace</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Formal static analyzer with real-time effect checking, autonomic circuit breaking, and self-healing LLM routine.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerCodebaseScan}
            disabled={isScanningCodebase}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-xl font-bold transition-all text-sm disabled:opacity-50"
          >
            {isScanningCodebase ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
            <span>Wolfram Codebase Scan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left compiler & Code, Right Circuit Breaker & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor & Compiler logs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-pink-400" />
                <h3 className="font-bold text-white text-sm">κIR Program Source</h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value as any)}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 text-xs focus:outline-none"
                >
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                </select>
                <button
                  onClick={handleCompile}
                  className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Play size={12} />
                  <span>Compile</span>
                </button>
              </div>
            </div>

            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="w-full h-64 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-zinc-300 font-mono text-sm focus:outline-none focus:border-pink-500/50 resize-none leading-relaxed"
              spellCheck="false"
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={injectTypeViolation}
                className="px-3 py-1.5 bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/20 text-rose-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
              >
                <AlertTriangle size={12} />
                <span>Inject Type Violation</span>
              </button>
              <button
                onClick={injectEffectViolation}
                className="px-3 py-1.5 bg-amber-950/30 border border-amber-900/50 hover:bg-amber-900/20 text-amber-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Flame size={12} />
                <span>Inject Effect Violation</span>
              </button>
              <button
                onClick={() => {
                  setSourceCode(`// Standard pure exact math calculation\nlet a = 12\nlet b = 15\nlet sum = a + b\nwrite(sum)\n`);
                  setTimeout(() => handleCompile(), 100);
                }}
                className="px-3 py-1.5 bg-emerald-950/30 border border-emerald-900/50 hover:bg-emerald-900/20 text-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
              >
                <CheckCircle2 size={12} />
                <span>Reset to Pure</span>
              </button>
            </div>
          </div>

          {/* Compile Logs */}
          <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-3 shadow-xl">
            <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider">Compilation & Validation Console</h4>
            <div className="h-40 overflow-y-auto bg-black border border-zinc-900 rounded-2xl p-4 font-mono text-xs text-zinc-400 space-y-1.5">
              {compileLog.map((log, idx) => (
                <div key={idx} className={log.includes('Error') ? 'text-rose-400' : log.includes('Successful') ? 'text-emerald-400' : 'text-zinc-500'}>
                  {log}
                </div>
              ))}
              {analysisReport && (
                <>
                  <div className="text-zinc-500">-------------------------------------------</div>
                  <div className="text-purple-400">[Analyzer] Checked {analysisReport.checkedNodesCount} nodes. Static analysis complete.</div>
                  {analysisReport.issues.map((issue, i) => (
                    <div key={i} className={issue.severity === 'ERROR' ? 'text-rose-400' : 'text-amber-400'}>
                      [{issue.severity}] {issue.type} in Node {issue.nodeId}: {issue.message}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Circuit Breaker & Predictive analytics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Circuit Breaker Status */}
          <div className={`p-6 border rounded-3xl space-y-4 shadow-xl transition-all duration-300 ${
            circuitBreaker === 'TRIPPED' 
              ? 'bg-rose-950/10 border-rose-500/20 shadow-rose-950/10' 
              : 'bg-zinc-950/80 border-zinc-900'
          }`}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className={circuitBreaker === 'TRIPPED' ? 'text-rose-400' : 'text-zinc-500'} size={18} />
                <span>System Circuit Breaker</span>
              </h4>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border ${
                circuitBreaker === 'TRIPPED' 
                  ? 'bg-rose-950/50 border-rose-500 text-rose-400' 
                  : 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
              }`}>
                {circuitBreaker}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className={`p-4 rounded-full border ${
                circuitBreaker === 'TRIPPED' 
                  ? 'bg-rose-900/10 border-rose-500/30 text-rose-500 animate-pulse' 
                  : 'bg-zinc-900 border-zinc-800 text-emerald-500'
              }`}>
                <Zap size={36} />
              </div>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                {circuitBreaker === 'TRIPPED'
                  ? 'Execution and program evaluation has been AUTONOMICALLY HALTED to prevent runtime type drift and unconstrained effects.'
                  : 'AREKappa Execution Substrate is fully synchronized. Invariants safe. Circuit is closed.'
                }
              </p>
            </div>
          </div>

          {/* Predictive Inference */}
          {predictiveMetrics && (
            <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Brain size={18} className="text-pink-400" />
                <h3 className="font-bold text-white text-sm">Predictive Inference Analytics</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Failure Risk</span>
                  <span className={`text-lg font-mono font-bold ${
                    predictiveMetrics.failureProbability > 0.15 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {(predictiveMetrics.failureProbability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Est. Latency</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {predictiveMetrics.estimatedLatencyMs}ms
                  </span>
                </div>
                <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Substrate Mem</span>
                  <span className="text-lg font-mono font-bold text-purple-400">
                    {(predictiveMetrics.memoryFootprintBytes / 1024).toFixed(2)} KB
                  </span>
                </div>
              </div>

              {predictiveMetrics.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Risk Vectors Detected:</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {predictiveMetrics.riskFactors.map((factor, i) => (
                      <div key={i} className="text-xs text-rose-300 bg-rose-950/10 border border-rose-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-rose-400 flex-shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Code Integrity Monitor & Wolfram Analytics */}
      <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-pink-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Wolfram Codebase Integrity Monitor</h3>
              <p className="text-zinc-500 text-xs">Persistent background scanner for unauthorized mock stubs, static facades, and endpoint errors.</p>
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Idle Daemon Monitoring Active</span>
          </div>
        </div>

        {wolframStatus ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  <Code2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Scanned Code Files</span>
                  <span className="text-xl font-mono font-bold text-white">{wolframStatus.totalFilesScanned} files</span>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${
                  wolframStatus.systemHealthy 
                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-600/10 text-rose-400 border-rose-500/20'
                }`}>
                  <Shield size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">System Integrity</span>
                  <span className={`text-xl font-mono font-bold ${
                    wolframStatus.systemHealthy ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {wolframStatus.systemHealthy ? 'OPTIMAL' : 'MOCKS DETECTED'}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                  <Brain size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Self-Repair Engine</span>
                  <span className="text-xl font-mono font-bold text-purple-400">Gemini Active</span>
                </div>
              </div>
            </div>

            {/* Mock Violations List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Active Prohibited Mock/Facade Integrations</h4>
              {wolframStatus.mockViolations.length === 0 ? (
                <div className="p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl text-center">
                  <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No unauthorized mocks or facade fake code found in the codebase. All active endpoints verified.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wolframStatus.mockViolations.map((violation, i) => (
                    <div key={i} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            violation.severity === 'CRITICAL' 
                              ? 'bg-rose-950/60 border border-rose-800 text-rose-300' 
                              : 'bg-amber-950/60 border border-amber-800 text-amber-300'
                          }`}>
                            {violation.severity} VIOLATION
                          </span>
                          <span className="text-xs font-mono font-bold text-white">{violation.filePath} : Line {violation.line}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-lg inline-block">
                          {violation.snippet}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelfRepair(violation)}
                        disabled={!!repairingFile}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                      >
                        {repairingFile === violation.filePath ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Main LLM Routing Repair...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>Trigger Autonomic Repair</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl text-center">
            <RefreshCw size={32} className="text-zinc-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">Booting background verification and Wolfram analytics scan...</p>
          </div>
        )}
      </div>

      {/* Cryptographically Verifiable Evidence Receipt Ledger Viewer */}
      <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <Fingerprint size={22} className="text-pink-400" />
            <div>
              <h3 className="font-bold text-white text-lg">Evidence Receipt Cryptographic Ledger</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Verifiable append-only history of executed programs. Recalculates link-by-link hash chains to prove ledger immutability.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={executeAndAppendLedger}
              disabled={isExecuting || !program}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all"
            >
              {isExecuting ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              <span>Execute & Sign Receipt</span>
            </button>
            <button
              onClick={verifyLedger}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-300 border border-zinc-800 font-bold text-xs rounded-xl transition-all"
            >
              {isVerifying ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
              <span>Verify Integrity</span>
            </button>
            <button
              onClick={clearLedgerHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-900/40 font-bold text-xs rounded-xl transition-all"
            >
              <Trash2 size={12} />
              <span>Reset Ledger</span>
            </button>
          </div>
        </div>

        {/* Ledger Cryptographic Health Banner */}
        {ledger.length > 0 && verificationReport && (
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
            verificationReport.isChainValid 
              ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300 animate-pulse'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 border ${
                verificationReport.isChainValid ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-rose-950 border-rose-800 text-rose-400'
              }`}>
                {verificationReport.isChainValid ? <Lock size={18} /> : <Unlock size={18} />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {verificationReport.isChainValid 
                    ? 'Cryptographic Hash-Chain Integrity Secured' 
                    : 'LEDGER TAMPERING DETECTED! HASH-CHAIN SEVERED'}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  {verificationReport.isChainValid 
                    ? `Verified ${verificationReport.totalReceipts} sequential evidence blocks. Genesis hash link matched perfectly. All digital signatures conform to their computed payload.`
                    : `Cryptographic analysis detected ${verificationReport.breaks.length} structural break(s) in the ledger. Recomputed link hashes do not align with stored hash chain headers.`}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 font-mono text-xs px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400">
              Verified: {new Date(verificationReport.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Dynamic Execution Result Panel */}
        <AnimatePresence>
          {executionResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 border rounded-2xl space-y-3 overflow-hidden ${
                executionResult.errorValue 
                  ? 'bg-rose-950/10 border-rose-500/30' 
                  : 'bg-zinc-900/30 border-zinc-800/60'
              }`}
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className={executionResult.errorValue ? "text-rose-400" : "text-pink-400"} />
                  <span className="text-xs font-bold text-white">Evaluation Output</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  executionResult.errorValue 
                    ? 'text-rose-400 bg-rose-950/40 border-rose-900' 
                    : 'text-emerald-400 bg-emerald-950/40 border-emerald-900'
                }`}>
                  {executionResult.errorValue ? 'Execution Halted (Fail-Closed)' : 'Receipt Emitted'}
                </span>
              </div>
              
              {executionResult.errorValue ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-rose-400 text-xs font-medium leading-relaxed bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl font-mono">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400 animate-pulse" />
                    <div>
                      <span className="font-bold block text-white mb-1 uppercase text-[10px]">Security Guard Intercepted Violation:</span>
                      {executionResult.errorValue}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Execution Result Value:</span>
                    <div className="p-3 bg-black border border-zinc-900 rounded-xl font-mono text-sm text-zinc-200">
                      {executionResult.resultValue}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Generated Receipt ID:</span>
                    <div className="p-3 bg-black border border-zinc-900 rounded-xl font-mono text-xs text-purple-400 flex justify-between items-center">
                      <span>{executionResult.evidenceReceipt?.receiptId}</span>
                      <span className="text-[9px] text-zinc-600">Chain Hash: {executionResult.evidenceReceipt?.chainHash.substring(0, 12)}...</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Tamper Console */}
        {ledger.length > 0 && (
          <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
              <Wrench size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-zinc-300">Autonomic Tamper Simulator (Test the cryptographic defenses)</span>
            </div>
            <div className="flex flex-wrap items-end gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">1. Select Block:</span>
                <select
                  value={targetTamperIndex ?? ''}
                  onChange={(e) => setTargetTamperIndex(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-48 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
                >
                  <option value="">-- Choose Receipt --</option>
                  {ledger.map((rcpt, index) => (
                    <option key={rcpt.receiptId} value={index}>
                      Block {index} ({rcpt.receiptId.substring(5, 12)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">2. Targeted Parameter:</span>
                <select
                  value={targetTamperKey}
                  onChange={(e) => setTargetTamperKey(e.target.value)}
                  className="w-44 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
                >
                  <option value="outputsHash">outputsHash (Output Payload)</option>
                  <option value="programHash">programHash (Source Logic)</option>
                  <option value="stateDeltaHash">stateDeltaHash (State Delta)</option>
                  <option value="chainHash">chainHash (Sequential Header)</option>
                </select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">3. Malicious Value Injection:</span>
                <input
                  type="text"
                  value={targetTamperValue}
                  onChange={(e) => setTargetTamperValue(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs focus:outline-none focus:border-rose-500/50"
                  placeholder="Inject raw bad text..."
                />
              </div>

              <button
                onClick={() => targetTamperIndex !== null && tamperLedgerItem(targetTamperIndex)}
                disabled={targetTamperIndex === null}
                className="px-4 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 hover:text-white text-rose-300 font-bold rounded-lg transition-all disabled:opacity-40"
              >
                Inject Malicious Drift
              </button>
            </div>
          </div>
        )}

        {/* Ledger Audit Table */}
        <div className="overflow-x-auto bg-black rounded-2xl border border-zinc-900">
          {ledger.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Database size={32} className="text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto">
                No receipts recorded in the append-only ledger yet. Use the <strong className="text-pink-400">Execute & Sign Receipt</strong> trigger to compile and sign real execution traces.
              </p>
            </div>
          ) : (
            <table className="min-w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">Block</th>
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">Program Hash</th>
                  <th className="py-3 px-4">Outputs Hash</th>
                  <th className="py-3 px-4">Prev Link Hash</th>
                  <th className="py-3 px-4">Chain Header</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {ledger.map((rcpt, index) => {
                  const verifiedStep = verificationReport?.verifiedChain?.find(
                    (v: any) => v.receiptId === rcpt.receiptId
                  );
                  const stepBreak = verificationReport?.breaks?.find(
                    (b: any) => b.receiptId === rcpt.receiptId
                  );
                  const isHealthy = verifiedStep ? verifiedStep.verified : true;

                  return (
                    <React.Fragment key={rcpt.receiptId}>
                      <tr className={`hover:bg-zinc-900/30 transition-all ${
                        !isHealthy ? 'bg-rose-950/10' : ''
                      }`}>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-500 font-bold">
                          {index}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-purple-400">
                          {rcpt.receiptId.substring(5, 12)}...
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {rcpt.programHash.substring(0, 14)}...
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {rcpt.outputsHash.substring(0, 14)}...
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-500">
                          {rcpt.previousReceiptHash === '0xGENESIS_HASH' ? (
                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">GENESIS</span>
                          ) : (
                            `${rcpt.previousReceiptHash.substring(0, 14)}...`
                          )}
                        </td>
                        <td className={`py-3.5 px-4 font-mono ${!isHealthy ? 'text-rose-400 line-through' : 'text-emerald-400'}`}>
                          {rcpt.chainHash.substring(0, 14)}...
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isHealthy 
                              ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
                              : 'bg-rose-950 border-rose-800 text-rose-400 animate-pulse'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {isHealthy ? 'VERIFIED' : 'COMPROMISED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setExpandedReceiptId(expandedReceiptId === rcpt.receiptId ? null : rcpt.receiptId)}
                            className="p-1 text-zinc-500 hover:text-white transition-all"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {expandedReceiptId === rcpt.receiptId && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-zinc-950 border-y border-zinc-900">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                <span className="font-bold text-white text-xs flex items-center gap-1">
                                  <FileText size={12} className="text-pink-400" />
                                  <span>E2E Cryptographic Receipt Parameters</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  Signed At: {new Date(rcpt.timestampMs).toLocaleString()}
                                </span>
                              </div>
                              
                              {stepBreak && (
                                <div className="p-3 bg-rose-950/20 border border-rose-900/40 text-rose-300 rounded-xl space-y-1">
                                  <div className="font-bold text-xs">Cryptographic Mismatch Detected:</div>
                                  <div className="font-mono text-[10px] space-y-0.5">
                                    <div>Error Type: {stepBreak.errorType}</div>
                                    <div>Expected: <span className="text-emerald-400">{stepBreak.expected}</span></div>
                                    <div>Actual: <span className="text-rose-400">{stepBreak.actual}</span></div>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div className="space-y-2 p-3 bg-black border border-zinc-900 rounded-xl">
                                  <div>
                                    <span className="text-zinc-600 block text-[9px] uppercase font-bold">Input Genesis Trigger (Root Node ID)</span>
                                    <span className="text-zinc-300 break-all">{rcpt.inputsHash}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block text-[9px] uppercase font-bold">State Delta Hash (Final Rational Substrate state)</span>
                                    <span className="text-zinc-300 break-all">{rcpt.stateDeltaHash}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block text-[9px] uppercase font-bold">Execution Complexity Step Count</span>
                                    <span className="text-zinc-300">{rcpt.executionStepsCount} steps evaluated</span>
                                  </div>
                                </div>

                                <div className="space-y-2 p-3 bg-black border border-zinc-900 rounded-xl">
                                  <div>
                                    <span className="text-zinc-600 block text-[9px] uppercase font-bold">Audit Observer Effect Mask</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {rcpt.effectMask.length === 0 ? (
                                        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold rounded-md">PURE</span>
                                      ) : (
                                        rcpt.effectMask.map((fx: string) => (
                                          <span key={fx} className="px-2 py-0.5 bg-pink-950/30 border border-pink-900/50 text-pink-400 text-[10px] font-bold rounded-md">
                                            {fx}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block text-[9px] uppercase font-bold">Cryptographic Node Digital Signature</span>
                                    <span className="text-zinc-400 text-[11px] break-all block mt-0.5 bg-zinc-950 p-1 rounded border border-zinc-900">{rcpt.signature}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
