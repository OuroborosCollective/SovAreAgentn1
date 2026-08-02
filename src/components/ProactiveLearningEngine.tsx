import React, { useState, useEffect } from 'react';
import { Brain, Search, Filter, ShieldAlert, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProactiveLearningEngine: React.FC = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/personality/candidates');
      const data = await res.json();
      if (data.candidates) setCandidates(data.candidates);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveCandidate = async (id: string, status: string) => {
    setLoading(true);
    try {
      await fetch(`/api/personality/candidates/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actorContext: 'Eltern-Bestätigung via UI' })
      });
      fetchCandidates();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-700 rounded-3xl space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Brain size={24} className="text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white">Lernzyklus & Reflexion</h2>
          <p className="text-xs text-zinc-400">Beobachtungen → Hypothesen → Familien-Bestätigung → Gedächtnis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {candidates.map((cand: any) => (
            <motion.div key={cand.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-2xl border ${cand.status === 'accepted' ? 'bg-emerald-950/20 border-emerald-900/50' : cand.status === 'rejected' ? 'bg-rose-950/20 border-rose-900/50' : 'bg-zinc-950 border-indigo-900/50'} space-y-3`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                  cand.status === 'accepted' ? 'bg-emerald-900 text-emerald-300' :
                  cand.status === 'rejected' ? 'bg-rose-900 text-rose-300' :
                  'bg-indigo-900 text-indigo-300'
                }`}>
                  Status: {cand.status}
                </span>
                <span className="text-[10px] text-zinc-500">{new Date(cand.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="text-xs text-zinc-300">
                <strong className="text-white block mb-1">Beobachtung / Ursache:</strong>
                {cand.cause}
              </div>

              <div className="text-[10px] text-zinc-400 bg-black/40 p-2 rounded">
                <strong>Vorgeschlagene Präferenz:</strong><br />
                {JSON.stringify(cand.proposed_preference)}
              </div>

              {cand.status === 'observed' || cand.status === 'candidate' ? (
                <div className="flex gap-2 pt-2 border-t border-zinc-800">
                  <button onClick={() => resolveCandidate(cand.id, 'accepted')} disabled={loading} className="flex-1 py-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 text-xs rounded-xl border border-emerald-700 flex items-center justify-center gap-1 transition-all">
                    <CheckCircle2 size={14} /> Akzeptieren
                  </button>
                  <button onClick={() => resolveCandidate(cand.id, 'rejected')} disabled={loading} className="flex-1 py-2 bg-rose-900/50 hover:bg-rose-800 text-rose-300 text-xs rounded-xl border border-rose-700 flex items-center justify-center gap-1 transition-all">
                    <XCircle size={14} /> Ablehnen
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-[10px] text-zinc-500 italic text-center">
                  Abgeschlossen ({new Date(cand.resolved_at).toLocaleTimeString()})
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {candidates.length === 0 && (
          <div className="col-span-full p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            Keine offenen Lernkandidaten gefunden.
          </div>
        )}
      </div>
    </div>
  );
};
