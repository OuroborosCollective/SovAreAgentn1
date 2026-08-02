import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Bug, 
  Cpu, 
  Activity, 
  Zap, 
  Radio,
  Server,
  Layers,
  Check,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { runCompleteRuntimeValidation, ValidationTestResult } from '../utils/runtimeValidator';
import { validationTriageManager, TriageFailureEvent } from '../utils/validationTriage';
import { voiceService } from '../services/voiceService';

export interface SystemValidationTestbedProps {
  onSendToBugHunt?: () => void;
}

export const SystemValidationTestbed: React.FC<SystemValidationTestbedProps> = ({ onSendToBugHunt }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationTestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [triageFailures, setTriageFailures] = useState<TriageFailureEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'triage'>('tests');

  useEffect(() => {
    const unsubscribe = validationTriageManager.subscribe((events) => {
      setTriageFailures([...events]);
    });
    // Run initial test suite on mount
    handleRunTestbed();
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRunTestbed = async () => {
    setIsRunning(true);
    try {
      const report = await runCompleteRuntimeValidation();
      setResults(report.results);
      setSummary({
        total: report.totalTests,
        passed: report.passCount,
        failed: report.failCount
      });
      setLastRunTime(new Date().toLocaleTimeString());

      // Run triage capture check
      await validationTriageManager.runAndCaptureFailures();
    } catch (err) {
      console.error('[SystemValidationTestbed]: Error executing testbed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunStressAndTriage = async () => {
    setIsRunning(true);
    voiceService.pauseForRateLimit();
    setTimeout(() => {
      voiceService.resumeFromRateLimit('N1 (Stress-Test)', 'lernend');
    }, 1500);

    await handleRunTestbed();
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 rounded-2xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>System Validation Testbed & Auto-Triage Engine</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                Deterministic Non-Mocked Runtime
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Executes real-time integration checks across all endpoints, voice synthesis buffers, and router logic blocks. Failure events are automatically captured and routed to the SystemBugHunt healing protocol.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTestbed}
            disabled={isRunning}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
          >
            {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            <span>{isRunning ? 'Running Diagnostics...' : 'Execute Testbed'}</span>
          </button>

          <button
            onClick={handleRunStressAndTriage}
            disabled={isRunning}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-900/20"
          >
            <Zap size={14} />
            <span>429 Stress & Triage Simulation</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Total Validation Checks</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{summary ? summary.total : 0}</div>
          </div>
          <div className="p-3 bg-zinc-800 text-cyan-400 rounded-xl">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Passed Integrity Checks</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{summary ? summary.passed : 0}</div>
          </div>
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Captured Failures / Triage</div>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{summary ? summary.failed : 0}</div>
          </div>
          <div className="p-3 bg-amber-950/80 border border-amber-800 text-amber-400 rounded-xl">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Last Test Execution</div>
            <div className="text-sm font-bold text-purple-300 mt-1.5 font-mono flex items-center gap-1.5">
              <Clock size={14} className="text-purple-400" />
              <span>{lastRunTime || 'Never'}</span>
            </div>
          </div>
          <div className="p-3 bg-purple-950/80 border border-purple-800 text-purple-400 rounded-xl">
            <Cpu size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tests' 
              ? 'bg-emerald-600 text-black shadow-md' 
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Runtime Test Results ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('triage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'triage' 
              ? 'bg-emerald-600 text-black shadow-md' 
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          <Bug size={14} />
          <span>Auto-Triage & BugHunt Queue ({triageFailures.length})</span>
        </button>

        {onSendToBugHunt && (
          <button
            onClick={onSendToBugHunt}
            className="ml-auto px-4 py-2 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Terminal size={14} />
            <span>Open Full BugHunt Module</span>
          </button>
        )}
      </div>

      {/* Tab Content: Runtime Tests */}
      {activeTab === 'tests' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Non-Mocked Service & Endpoint Validation Logs
          </div>
          {results.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              No validation tests executed yet. Click "Execute Testbed" above.
            </div>
          ) : (
            results.map((test, index) => (
              <div 
                key={index}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  test.success 
                    ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' 
                    : 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border mt-0.5 ${
                    test.success 
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' 
                      : 'bg-amber-950/80 border-amber-600 text-amber-300 animate-pulse'
                  }`}>
                    {test.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{test.testName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 uppercase">
                        {test.category}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono bg-black/40 p-2 rounded-xl border border-zinc-800/80">
                      {test.details}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right self-end md:self-center">
                  <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-xs text-cyan-400">
                    {test.latencyMs} ms
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                    test.success 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-amber-500 text-black font-extrabold'
                  }`}>
                    {test.success ? 'PASSED' : 'FAILED / TRIAGED'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Auto-Triage & BugHunt Queue */}
      {activeTab === 'triage' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Captured Failure Events & SystemBugHunt Healing Protocols
            </div>
            {triageFailures.length > 0 && (
              <button
                onClick={() => validationTriageManager.clearEvents()}
                className="text-[11px] text-zinc-400 hover:text-red-400 underline transition-all"
              >
                Clear Triage Log
              </button>
            )}
          </div>

          {triageFailures.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3">
              <ShieldCheck size={32} className="text-emerald-500/60" />
              <div>
                <div className="font-bold text-white text-sm">No Active Triage Failures Recorded</div>
                <div className="text-xs text-zinc-400 mt-1">All service endpoints and logic blocks are operating within nominal health parameters.</div>
              </div>
            </div>
          ) : (
            triageFailures.map((item) => (
              <div 
                key={item.id}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-300 mt-0.5">
                    <Bug size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{item.testName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                        {item.assignedErrorCategory}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono">
                      {item.details}
                    </div>
                    <div className="text-[11px] text-cyan-400 mt-1.5 flex items-center gap-2">
                      <span className="font-bold text-zinc-500 uppercase">Repair Routine:</span>
                      <span className="bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded text-cyan-200">{item.repairRoutine}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span className="text-[10px] font-mono text-zinc-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <div className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1.5">
                    <Radio size={12} className="animate-pulse" />
                    <span>Routed to BugHunt</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
