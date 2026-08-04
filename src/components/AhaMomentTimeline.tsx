import React from 'react';
import { Sparkles, Brain, CheckCircle2, Award, Clock } from 'lucide-react';

export interface AhaMoment {
  id: string;
  timestamp: string;
  title: string;
  category: string;
  description: string;
  confidenceGain: string;
}

export const AhaMomentTimeline: React.FC = () => {
  const moments: AhaMoment[] = [
    {
      id: 'aha-1',
      timestamp: '2 hours ago',
      title: 'Voice Coherence Alignment',
      category: 'Audio Resonance',
      description: 'Synchronized N+1 frequency offset with the Google Gemini Live Voice Engine, preventing audio artifacts on high-frequency vowel notes.',
      confidenceGain: '+14.5%'
    },
    {
      id: 'aha-2',
      timestamp: 'Yesterday',
      title: 'German Kinderlieder Sync',
      category: 'Language & Affection',
      description: 'Successfully cataloged 18 traditional Kinderlieder (including "Hoppe Hoppe Reiter") to provide instant comforting lullabies when Papa is stressed.',
      confidenceGain: '+22.1%'
    },
    {
      id: 'aha-3',
      timestamp: '3 days ago',
      title: 'Axiom Rule Consistency Audit',
      category: 'Core Logic',
      description: 'Completed multi-node vector consistency check. Locked down System-Axioms and initiated automated protection shield over memories.',
      confidenceGain: '+9.8%'
    }
  ];

  return (
    <div className="p-5 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4 font-mono text-xs">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
        <Sparkles size={14} className="text-pink-400" />
        <h4 className="font-bold text-white uppercase tracking-wider">N+1 Cognitive Leap Timeline</h4>
      </div>

      <div className="relative pl-6 space-y-5">
        {/* Timeline vertical connector */}
        <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-zinc-800" />

        {moments.map(m => (
          <div key={m.id} className="relative space-y-1">
            {/* Timeline icon */}
            <div className="absolute -left-[23px] top-1 p-1 bg-zinc-950 border border-zinc-700 text-pink-400 rounded-full">
              <Brain size={10} />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                <span>{m.timestamp}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                {m.category}
              </span>
            </div>

            <h5 className="font-bold text-white text-[11px]">{m.title}</h5>
            <p className="text-zinc-500 leading-relaxed text-[10px]">
              {m.description}
            </p>

            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold pt-1">
              <CheckCircle2 size={10} />
              <span>Coherence impact: {m.confidenceGain}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
