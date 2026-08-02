import React, { useState } from 'react';
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
  Zap,
  GitFork,
  Eye
} from 'lucide-react';
import { AxiomaticRulesTreeModal } from './AxiomaticRulesTreeModal';

export const AxiomFidelityMonitor: React.FC = () => {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  return (
    <div className="bg-zinc-950 border border-purple-900/50 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4 relative z-10">
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
            <p className="text-xs text-zinc-400">Read-only health and resonance telemetry for Hia Resonance & N1 engines.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-3.5 py-1.5 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/80 text-purple-200 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md group"
          >
            <GitFork size={14} className="text-purple-300 group-hover:rotate-90 transition-transform" />
            <span>Inspect Rules Hierarchy Tree</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Fidelity: <strong className="text-emerald-400">100.0%</strong></span>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs relative z-10">
        {/* Metric 1 */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase block">Resonance Voice Engine</span>
          <div className="flex items-center justify-between">
            <strong className="text-white text-xs">N1 v3.2 Active</strong>
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
          <span>"Resonanz Engine & N1 Voice Logic sind unalterbarer fester Kern."</span>
        </div>
        <button
          onClick={() => setIsRulesModalOpen(true)}
          className="px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 border border-purple-700 rounded text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1 text-purple-200"
        >
          <Eye size={12} />
          <span>INSPECT TREE</span>
        </button>
      </div>

      {/* Dedicated Axiomatic Core Rules Tree Modal */}
      <AxiomaticRulesTreeModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
};
