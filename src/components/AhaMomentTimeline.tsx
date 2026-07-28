import React, { useState, useEffect } from 'react';
import { History, Sparkles, BookOpen, Clock, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AhaMoment {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
}

export const AhaMomentTimeline: React.FC = () => {
  const [moments, setMoments] = useState<AhaMoment[]>([]);

  useEffect(() => {
    // Load moments from localStorage ('n1_knowledge_db_items')
    const loadMoments = () => {
      try {
        const data = localStorage.getItem('n1_knowledge_db_items');
        if (data) {
          const parsed = JSON.parse(data) as AhaMoment[];
          const aha = parsed.filter(item => item.id.startsWith('aha-lingua') || item.category === 'LinguaHabar Patterns');
          setMoments(aha.reverse());
        }
      } catch (e) {
        console.error("Failed to load aha moments");
      }
    };
    
    loadMoments();
    // Setting up a basic interval to refresh moments if updated by LinguaHabarEngine
    const interval = setInterval(loadMoments, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Aha-Moment Timeline
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Historical semantic patterns archived by the LinguaHabar Engine.
          </p>
        </div>
        <div className="bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20 text-xs font-bold font-mono">
          {moments.length} Patterns Archived
        </div>
      </div>

      <div className="relative pl-6 space-y-8 max-h-[500px] overflow-y-auto pr-2 pb-4">
        {/* Timeline Line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-zinc-800" />

        <AnimatePresence>
          {moments.length === 0 ? (
            <div className="text-zinc-500 text-sm font-mono flex items-center gap-2 pt-4">
              <BookOpen size={16} />
              No aha-moments archived yet. Generate paths in the LinguaHabar Engine to populate this timeline.
            </div>
          ) : (
            moments.map((moment, i) => (
              <motion.div 
                key={moment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[29px] top-1.5 size-3 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] border-2 border-zinc-950" />
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-amber-500/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <BrainCircuit size={16} className="text-amber-400" />
                      {moment.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                      <Clock size={10} />
                      {new Date(moment.date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                    {moment.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
