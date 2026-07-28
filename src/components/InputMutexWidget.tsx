import React, { useState, useEffect } from 'react';
import { inputMutex, MutexState, MutexTaskType } from '../utils/inputMutex';
import { voiceService } from '../services/voiceService';
import { 
  Lock, 
  Unlock, 
  Layers, 
  Mic, 
  Key, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Zap, 
  Radio, 
  Cpu
} from 'lucide-react';

export const InputMutexWidget: React.FC = () => {
  const [mutexState, setMutexState] = useState<MutexState>(inputMutex.getState());
  const [testLog, setTestLog] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = inputMutex.subscribe((state) => {
      setMutexState(state);
    });
    return unsubscribe;
  }, []);

  const addTestLog = (msg: string) => {
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Test serialized voice command
  const triggerTestVoiceCommand = (phrase: string) => {
    inputMutex.enqueue(
      `Voice Command: "${phrase}"`,
      'VOICE_COMMAND',
      async () => {
        addTestLog(`Executing serialized voice command: "${phrase}"`);
        // Force stop any active audio before starting
        voiceService.stopSpeaking();
        await voiceService.speak(`Command recognized: ${phrase}`, 'Puck', 'fröhlich', 1.15, 1.1);
        addTestLog(`Completed voice command: "${phrase}"`);
      }
    );
  };

  // Test serialized API handshake
  const triggerTestHandshake = (name: string) => {
    inputMutex.enqueue(
      `API Handshake: ${name}`,
      'API_HANDSHAKE',
      async () => {
        addTestLog(`Initiating serialized API handshake: ${name}`);
        await new Promise(resolve => setTimeout(resolve, 1200));
        addTestLog(`Completed API handshake: ${name}`);
      }
    );
  };

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Nexus Input Mutex Controller</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${
                mutexState.isLocked 
                  ? 'bg-amber-950 text-amber-300 border-amber-800' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {mutexState.isLocked ? 'MUTEX LOCKED (PROCESSING)' : 'MUTEX READY (IDLE)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict serialized FIFO queue forcing single-voice response execution & non-overlapping API handshakes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => inputMutex.purgeQueue()}
            disabled={mutexState.queue.length === 0 && !mutexState.isLocked}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Trash2 size={12} />
            <span>Purge Queue ({mutexState.queue.length})</span>
          </button>
        </div>
      </div>

      {/* Grid: Mutex Status & Active Task */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-between">
            <span>Mutex Pipeline Lock:</span>
            {mutexState.isLocked ? <Lock size={12} className="text-amber-400" /> : <Unlock size={12} className="text-emerald-400" />}
          </div>
          <div className={`text-sm font-bold ${mutexState.isLocked ? 'text-amber-300' : 'text-emerald-300'}`}>
            {mutexState.isLocked ? 'LOCKED — EXECUTION IN PROGRESS' : 'UNLOCKED — PIPELINE CLEAR'}
          </div>
        </div>

        <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-between">
            <span>Currently Active Task:</span>
            <Radio size={12} className={mutexState.activeTask ? 'text-purple-400 animate-pulse' : 'text-zinc-600'} />
          </div>
          <div className="text-xs font-bold text-purple-200 truncate">
            {mutexState.activeTask ? mutexState.activeTask.label : 'None (Idle)'}
          </div>
        </div>

        <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-between">
            <span>FIFO Queue Depth:</span>
            <Layers size={12} className="text-blue-400" />
          </div>
          <div className="text-xs font-bold text-blue-300">
            {mutexState.queue.length} Pending Tasks • {mutexState.completedCount} Completed
          </div>
        </div>
      </div>

      {/* Queue View */}
      {mutexState.queue.length > 0 && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
          <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center gap-2">
            <Layers size={12} className="text-purple-400" />
            <span>Queued Serialized Tasks ({mutexState.queue.length})</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {mutexState.queue.map((task, index) => (
              <div key={task.id} className="p-2.5 bg-black/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-300 font-bold text-[10px] flex items-center justify-center border border-purple-800">
                    #{index + 1}
                  </span>
                  <span className="text-zinc-200 font-bold">{task.label}</span>
                </div>
                <span className="text-[10px] text-zinc-500">{task.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mutex Test Controls */}
      <div className="p-4 bg-black/60 border border-zinc-800 rounded-2xl space-y-3">
        <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span>Simulate Concurrent Requests (Test Single-Voice Queueing)</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Clicking multiple buttons rapidly enqueues tasks into the Input Mutex. Notice how voice commands play strictly one after another without overlapping voices!
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => triggerTestVoiceCommand("N+1 Neural Matrix Online")}
            className="px-3 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Mic size={12} className="text-purple-400" />
            <span>Voice Command A</span>
          </button>

          <button
            onClick={() => triggerTestVoiceCommand("Kalibriere HIA Voice Modulation")}
            className="px-3 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Mic size={12} className="text-purple-400" />
            <span>Voice Command B</span>
          </button>

          <button
            onClick={() => triggerTestVoiceCommand("Nexus Sync Handshake Verified")}
            className="px-3 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Mic size={12} className="text-purple-400" />
            <span>Voice Command C</span>
          </button>

          <button
            onClick={() => triggerTestHandshake("GitHub OAuth Token Validation")}
            className="px-3 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-700 text-blue-200 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Key size={12} className="text-blue-400" />
            <span>API Handshake X</span>
          </button>
        </div>
      </div>

      {/* Real-time Mutex Log */}
      {testLog.length > 0 && (
        <div className="p-4 bg-black/90 border border-zinc-800 rounded-2xl space-y-2">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Mutex Execution Stream Log:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[10px]">
            {testLog.map((log, i) => (
              <div key={i} className="text-zinc-400 flex items-center gap-2">
                <span className="text-purple-400 font-bold">›</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
