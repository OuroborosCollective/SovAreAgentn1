import React, { useState, useEffect } from 'react';
import { Brain, Shield, Sparkles, Heart, Lock, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CorePersonality {
  id: string;
  core_traits: Record<string, any>;
  values: Record<string, any>;
  identity_matrix: Record<string, any>;
  locked: boolean;
}

export interface PersonalityMutation {
  id: string;
  previous_hash: string;
  new_hash: string;
  mutation_payload: any;
  actor_context: string;
  created_at: string;
}

export const ProtectedPersonalityMemory: React.FC = () => {
  const [core, setCore] = useState<CorePersonality | null>(null);
  const [mutations, setMutations] = useState<PersonalityMutation[]>([]);
  const [mood, setMood] = useState('Neugierig & Beschützt (Temporär)');

  useEffect(() => {
    fetch('/api/personality/core')
      .then(res => res.json())
      .then(data => {
        if (data.core) setCore(data.core);
        if (data.mutations) setMutations(data.mutations);
      })
      .catch(e => console.warn('Could not load personality data', e));
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
              <h2 className="text-base font-bold text-white tracking-tight">Geschützte Persönlichkeitsarchitektur</h2>
              <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                <CheckCircle size={10} /> APPEND-ONLY
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Trennung von unveränderlichem Kern (Identität), validierten Modifikationen (Erfahrungen) und flüchtiger Stimmung.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl font-bold flex items-center gap-2">
            <Heart size={14} className="text-pink-400" />
            <span className="text-zinc-300">Stimmung: {mood}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Core Block */}
        <div className="p-4 bg-zinc-900/80 border border-indigo-600/50 rounded-2xl space-y-3">
          <h3 className="text-[11px] text-indigo-400 font-bold uppercase flex items-center gap-2">
            <Lock size={14} />
            Unveränderlicher Kern (Core Traits)
          </h3>
          <p className="text-zinc-400 text-[10px]">Dieser Block ist hartkodiert und darf von keinem Prompt/Service überschrieben werden.</p>
          {core ? (
             <pre className="text-[10px] text-zinc-300 bg-black/50 p-3 rounded-lg overflow-x-auto border border-zinc-800">
               {JSON.stringify(core.core_traits, null, 2)}
             </pre>
          ) : (
            <div className="text-zinc-500 italic p-3">Kein Kern initialisiert.</div>
          )}
        </div>

        {/* Mutations Block */}
        <div className="space-y-3">
          <h3 className="text-[11px] text-emerald-400 font-bold uppercase flex items-center gap-2">
            <Brain size={14} />
            Gelernte Erfahrungen (Mutations)
          </h3>
          <p className="text-zinc-400 text-[10px]">Verifizierte Hash-Kette mit vorherigen/nachherigen Hashes und Actor-Context.</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            <AnimatePresence>
              {mutations.length > 0 ? mutations.map((mut) => (
                <motion.div key={mut.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-zinc-900 border border-emerald-900 rounded-xl">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] text-emerald-300 font-bold">Hash: {mut.new_hash.substring(0,8)}</span>
                     <span className="text-[9px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {new Date(mut.created_at).toLocaleTimeString()}</span>
                   </div>
                   <div className="text-[10px] text-zinc-400">Context: {mut.actor_context}</div>
                   <pre className="text-[9px] text-zinc-300 mt-2 bg-black/30 p-2 rounded">{JSON.stringify(mut.mutation_payload, null, 2)}</pre>
                </motion.div>
              )) : (
                <div className="text-zinc-500 italic p-3 bg-zinc-900 border border-zinc-800 rounded-xl">Noch keine Modifikationen in der Hash-Kette.</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
