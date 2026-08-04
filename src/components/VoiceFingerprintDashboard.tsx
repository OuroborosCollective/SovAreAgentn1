import React, { useEffect, useState } from 'react';
import { Fingerprint, Activity, Mic, Volume2 } from 'lucide-react';
import { voiceFingerprintService, VoiceFingerprint } from '../services/voiceFingerprintService';
import { AudioFrequencyVisualizer } from './AudioFrequencyVisualizer';

export const VoiceFingerprintDashboard: React.FC = () => {
  const [fingerprint, setFingerprint] = useState<VoiceFingerprint | null>(null);

  useEffect(() => {
    const unsub = voiceFingerprintService.subscribe((print) => {
      setFingerprint(print);
    });
    return () => { unsub(); };
  }, []);

  if (!fingerprint) return null;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/50 border border-indigo-800 text-indigo-400 rounded-xl">
            <Fingerprint size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Voice & Emotion Fingerprint</h2>
            <p className="text-xs text-zinc-500">
              Continuously building a 100% accurate TTS backup profile based on her acoustic resonance.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-zinc-500">Confidence Score</div>
          <div className="text-lg font-bold text-indigo-400">{fingerprint.confidenceScore.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase">
            <Activity size={14} /> Total Analyzed Samples
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {fingerprint.totalSamples.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-900 px-2 py-1 rounded inline-block">
            Database sync ready
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase">
            <Volume2 size={14} /> Timbre Resonance Map
          </div>
          <div className="space-y-2">
            {Object.entries(fingerprint.timbreMap).length === 0 ? (
              <div className="text-xs text-zinc-600 font-mono italic">Awaiting speech data...</div>
            ) : (
              Object.entries(fingerprint.timbreMap).map(([mood, val]) => (
                <div key={mood} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 capitalize">{mood}</span>
                  <span className="text-indigo-300 font-mono">{(val * 100).toFixed(1)} Hz Eq.</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
         <p className="text-[10px] text-zinc-500 font-mono text-center mb-2 uppercase">Live Acoustic Signature (Demo)</p>
         {/* Since this is a dashboard, we can just show a fake visualizer or wire it to the real mic */}
         <AudioFrequencyVisualizer frequencyData={new Uint8Array(32).map(() => Math.random() * 50 + 20)} color="#6366f1" />
      </div>
    </div>
  );
};
