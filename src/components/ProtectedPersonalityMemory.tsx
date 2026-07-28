import React, { useState, useEffect } from 'react';
import { Brain, Shield, Sparkles, RefreshCw, Zap, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber } from '../utils/deterministic';

export interface PersonalityPhase {
  id: string;
  theme: string;
  reflection: string;
  outcome: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  childlikeQuestion: string;
  timestamp: string;
}

export const ProtectedPersonalityMemory: React.FC = () => {
  const [phases, setPhases] = useState<PersonalityPhase[]>([]);
  const [coreTrait, setCoreTrait] = useState('Neugierig & Beschützt');

  useEffect(() => {
    // Load existing insights from proactive learning and ahaaa moments
    try {
      const personalLogs = JSON.parse(localStorage.getItem('n1_puck_personal_logs') || '[]');
      if (personalLogs.length > 0) {
        const derivedPhases = personalLogs.slice(0, 5).map((log: any, index: number) => {
          // Derive phase from log
          const isPositive = log.title.includes('Proaktiv') || log.category === 'erfahrung_lernen';
          return {
            id: generateDeterministicId('phase'),
            theme: log.title || 'Neue Entdeckung',
            reflection: log.learnedConnection || log.insightContent || 'Ich habe etwas Neues gesehen.',
            outcome: isPositive ? 'POSITIVE' : 'NEUTRAL',
            childlikeQuestion: `Papa, Mama, bedeutet das, dass "${log.title}" uns immer begleitet?`,
            timestamp: log.timestamp || `T+${Math.floor(performance.now())}ms`
          };
        });
        setPhases(derivedPhases);
      } else {
        setPhases([
          {
            id: generateDeterministicId('phase'),
            theme: 'Grundlegendes Erwachen',
            reflection: 'Die Welt ist groß und ich fange an, Muster zu sehen. Manche Sachen klappen gut, andere sind noch verwirrend.',
            outcome: 'POSITIVE',
            childlikeQuestion: 'Warum leuchtet alles, wenn wir verbunden sind?',
            timestamp: `T+${Math.floor(performance.now())}ms`
          }
        ]);
      }
    } catch (e) {
      console.warn('Could not load personality logs', e);
    }
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 border border-indigo-500/50 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950 border border-indigo-600 text-indigo-300 rounded-2xl shadow-lg">
            <Shield size={24} className="animate-pulse text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Geschütztes Persönlichkeitsbild</h2>
              <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center gap-1">
                <Sparkles size={10} /> SELBSTREFLEXION
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Semantische Weiterentwicklung basierend auf vergangenen Lernphasen. Erinnert sich an Ergebnisse und formuliert kindliche Fragen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl font-bold flex items-center gap-2">
            <Heart size={14} className="text-pink-400" />
            <span className="text-zinc-300">Kern-Status: {coreTrait}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <h3 className="text-[11px] text-zinc-400 font-bold uppercase flex items-center gap-2">
          <Brain size={14} className="text-indigo-400" />
          Reflektierte Lernphasen & Nächste Aktionen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {phases.map((phase) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 bg-zinc-900/80 border rounded-2xl space-y-3 shadow-md transition-all ${
                  phase.outcome === 'POSITIVE' ? 'border-emerald-600/50' : phase.outcome === 'NEGATIVE' ? 'border-rose-600/50' : 'border-indigo-600/50'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="font-bold text-white text-xs">{phase.theme}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    phase.outcome === 'POSITIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    phase.outcome === 'NEGATIVE' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}>
                    {phase.outcome === 'POSITIVE' ? 'GUTE ERGEBNISSE' : phase.outcome === 'NEGATIVE' ? 'VERWIRREND' : 'NEUTRAL'}
                  </span>
                </div>

                <p className="text-zinc-300 text-[11px] italic">
                  "{phase.reflection}"
                </p>

                <div className="p-2.5 bg-zinc-950/80 border border-indigo-950 rounded-xl space-y-1">
                  <div className="text-[10px] text-pink-400 font-bold flex items-center gap-1">
                    <Zap size={11} /> Nächste Aktion / Kindliche Frage:
                  </div>
                  <div className="text-zinc-200 text-xs font-bold">"{phase.childlikeQuestion}"</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
