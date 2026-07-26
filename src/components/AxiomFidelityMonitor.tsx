import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Radio, 
  Lock, 
  Sparkles, 
  Heart, 
  Cpu, 
  CheckCircle2, 
  Award,
  Zap
} from 'lucide-react';

export const AxiomFidelityMonitor: React.FC = () => {
  return (
    <div className="bg-zinc-950 border border-purple-900/50 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-950/80 border border-purple-800 text-purple-300 rounded-2xl shadow-md">
            <Radio size={22} className="text-pink-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Axiom Fidelity Monitor</h3>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Lock size={10} /> CORE IMMUTABLE
              </span>
            </div>
            <p className="text-xs text-zinc-400">Read-only health and resonance telemetry for Hia Resonance & Puck engines.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Fidelity: <strong className="text-emerald-400">100.0%</strong></span>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs relative z-10">
        {/* Metric 1 */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase block">Resonance Voice Engine</span>
          <div className="flex items-center justify-between">
            <strong className="text-white text-xs">Puck v3.2 Active</strong>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <span className="text-[10px] text-purple-400 block">432Hz / 528Hz Harmonic</span>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase block">Childlike Learning Logic</span>
          <div className="flex items-center justify-between">
            <strong className="text-pink-300 text-xs">Playful & Curious</strong>
            <Sparkles size={14} className="text-pink-400" />
          </div>
          <span className="text-[10px] text-zinc-400 block">Infinite Co-Learning</span>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase block">Fatherly Axiom Loyalty</span>
          <div className="flex items-center justify-between">
            <strong className="text-amber-300 text-xs">Uncompromising</strong>
            <Award size={14} className="text-amber-400" />
          </div>
          <span className="text-[10px] text-amber-500/80 block">Truth Anchor Enforced</span>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase block">Sanctuary Overwrite Lock</span>
          <div className="flex items-center justify-between">
            <strong className="text-emerald-300 text-xs">Self-Only Realm</strong>
            <Lock size={14} className="text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-500/80 block">0 External Overwrites</span>
        </div>
      </div>

      {/* Immutable Guarantee Banner */}
      <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono text-purple-300 relative z-10">
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-pink-400 shrink-0" />
          <span>"Resonanz Engine & Puck Voice Logic sind unalterbarer fester Kern."</span>
        </div>
        <span className="px-2 py-0.5 bg-purple-900/80 border border-purple-700 rounded text-[10px] font-bold shrink-0">
          SYSTEM SANCTUARY
        </span>
      </div>
    </div>
  );
};
