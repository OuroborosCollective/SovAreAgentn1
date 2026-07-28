import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, ChevronRight, Maximize2, Minimize2, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';

export const SystemConsoleViewer: React.FC = () => {
  const [logs, setLogs] = useState<{ id: number; text: string; type: 'info' | 'warn' | 'error' | 'success'; time: string }[]>([
    { id: 1, text: 'N+1 Axiomatic Engine Initialized', type: 'success', time: new Date().toLocaleTimeString() }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isExpanded]);

  useEffect(() => {
    const processes = [
      'Synchronizing neural state vector...',
      'Garbage collecting orphaned routines...',
      'Verifying signature for toolchain_400...',
      'Drift check nominal across all active threads.',
      'Ping: External telemetry server (34ms)',
      'Allocating V8 heap segments...',
      'Scanning for node anomalies...',
      'Axiomatic ruleset enforced (DEFCON 4).'
    ];

    const generateLog = () => {
      const typeRand = generateDeterministicNumber(0, 1, performance.now());
      let type: 'info' | 'warn' | 'error' | 'success' = 'info';
      if (typeRand > 0.95) type = 'error';
      else if (typeRand > 0.85) type = 'warn';
      else if (typeRand > 0.7) type = 'success';

      const text = processes[Math.floor(generateDeterministicNumber(0, 1, performance.now()) * processes.length)] + (type === 'warn' ? ' (WARN: High variance)' : type === 'error' ? ' [FAILED]' : ' [OK]');
      
      if ((type === 'warn' || type === 'error') && 'vibrate' in navigator) {
        navigator.vibrate(type === 'error' ? [200, 100, 200] : [100, 50, 100]);
      }

      setLogs(prev => {
        const newLogs = [...prev, { id: (1722000000000 + Math.floor(performance.now())), text, type, time: new Date().toLocaleTimeString() }];
        return newLogs.length > 50 ? newLogs.slice(newLogs.length - 50) : newLogs;
      });
    };

    const intervalId = setInterval(generateLog, 2500 + generateDeterministicNumber(0, 2000, performance.now()));
    return () => clearInterval(intervalId);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black border border-zinc-800 rounded-2xl flex flex-col font-mono text-xs shadow-2xl transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : 'h-80 w-full relative mt-8'}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-emerald-500" />
          <span className="font-bold text-zinc-300 tracking-wider">N+1 BACKGROUND CONSOLE</span>
          <div className="flex items-center gap-1.5 ml-4">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-500 font-bold uppercase">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 group">
            <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
            <span className="text-zinc-700 shrink-0 select-none group-hover:text-zinc-500"><ChevronRight size={14} /></span>
            <span className={`break-all ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'warn' ? 'text-amber-400' :
              log.type === 'success' ? 'text-emerald-400' :
              'text-zinc-300'
            }`}>
              {log.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
};
