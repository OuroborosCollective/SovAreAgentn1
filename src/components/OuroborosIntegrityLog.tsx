import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, History, Shield, Brain, ArrowRight } from 'lucide-react';
import { generateDeterministicId } from '../utils/deterministic';

interface IntegrityLogItem {
  id: string;
  timestamp: string;
  action: string;
  type: 'adjustment' | 'override' | 'reinforcement';
  description: string;
  impactScore: number;
}

const INITIAL_LOGS: IntegrityLogItem[] = [
  {
    id: generateDeterministicId('log'),
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleString('de-DE'),
    action: 'Habar/Gramar Weight Rebalance',
    type: 'adjustment',
    description: 'Autonomous shift: Increased Habar dialectical weight by 4.2% to accommodate context-heavy queries.',
    impactScore: 0.82
  },
  {
    id: generateDeterministicId('log'),
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleString('de-DE'),
    action: 'Axiomatic Boundary Enforcement',
    type: 'override',
    description: 'Constraint triggered: Prevented recursive loop in semantic graph. Rule 3 (Synergistic Balance) enforced.',
    impactScore: 0.99
  },
  {
    id: generateDeterministicId('log'),
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleString('de-DE'),
    action: 'Vector Drift Realignment',
    type: 'reinforcement',
    description: 'Re-aligned stray concept nodes closer to primary axiomatic core vector cluster.',
    impactScore: 0.65
  }
];

export const OuroborosIntegrityLog: React.FC = () => {
  const [logs, setLogs] = useState<IntegrityLogItem[]>(INITIAL_LOGS);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History size={20} className="text-emerald-400" />
            Ouroboros Integrity Log
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Chronological history of autonomous self-learning adjustments and axiomatic constraint overrides.
          </p>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {logs.map((log) => (
          <div key={log.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {log.type === 'adjustment' && <Brain size={14} className="text-indigo-400" />}
                {log.type === 'override' && <ShieldAlert size={14} className="text-amber-400" />}
                {log.type === 'reinforcement' && <Shield size={14} className="text-emerald-400" />}
                <span className={`text-xs font-bold uppercase ${
                  log.type === 'adjustment' ? 'text-indigo-400' :
                  log.type === 'override' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {log.action}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</span>
            </div>
            
            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
              {log.description}
            </p>
            
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Impact Score</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className={`h-full ${log.impactScore > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${log.impactScore * 100}%` }}
                  />
                </div>
                <span className={log.impactScore > 0.8 ? 'text-amber-400' : 'text-emerald-400'}>
                  {log.impactScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
