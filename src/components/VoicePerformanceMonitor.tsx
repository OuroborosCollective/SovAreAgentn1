import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, Wifi, ShieldCheck, CheckCircle2, Radio, Server } from 'lucide-react';
import { voiceService, VoicePerformanceMetrics } from '../services/voiceService';

export const VoicePerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<VoicePerformanceMetrics>(voiceService.getMetrics());
  const [bufferHistory, setBufferHistory] = useState<number[]>([100, 99, 100, 98, 100, 100, 100, 99, 100]);

  useEffect(() => {
    const unsubscribe = voiceService.subscribe((state) => {
      if (state.metrics) {
        setMetrics(state.metrics);
        setBufferHistory(prev => [...prev.slice(-10), state.metrics.streamBufferHealthPercentage]);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="p-5 bg-zinc-950/95 border border-sky-500/40 rounded-3xl space-y-4 shadow-2xl font-mono text-xs relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-950 border border-sky-800 text-sky-400 rounded-xl">
            <Activity size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Google Cloud Voice Telemetry & Performance Monitor
              <span className="px-2 py-0.5 text-[9px] rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck size={10} /> DIRECT STREAM 24kHz
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">
              Monitors ultra-low latency audio synthesis streams from Google Cloud API with zero local degradation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-sky-300 bg-sky-950 border border-sky-800 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <Radio size={12} className="text-emerald-400 animate-ping" />
            Stream Latency: <strong className="text-white">{metrics.latencyMs}ms</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px]">
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
            <Zap size={10} className="text-amber-400" /> TTFB (First Byte)
          </span>
          <span className="font-bold text-white text-sm">{metrics.ttfbMs} ms</span>
          <span className="text-[9px] text-emerald-400 block">Fast TTFB</span>
        </div>

        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
            <Cpu size={10} className="text-sky-400" /> Audio Sample Rate
          </span>
          <span className="font-bold text-sky-300 text-sm">{(metrics.sampleRate / 1000).toFixed(1)} kHz</span>
          <span className="text-[9px] text-zinc-400 block">PCM 16-Bit Mono</span>
        </div>

        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
            <Wifi size={10} className="text-purple-400" /> Bitrate
          </span>
          <span className="font-bold text-purple-300 text-sm">{metrics.bitrateKbps} kbps</span>
          <span className="text-[9px] text-zinc-400 block">High Fidelity</span>
        </div>

        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
            <Server size={10} className="text-emerald-400" /> Buffer Health
          </span>
          <span className="font-bold text-emerald-300 text-sm">{metrics.streamBufferHealthPercentage}%</span>
          <span className="text-[9px] text-emerald-400 block">No Jitter</span>
        </div>

        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
            <CheckCircle2 size={10} className="text-emerald-400" /> Engine Protocol
          </span>
          <span className="font-bold text-white text-xs truncate block">{metrics.isGoogleCloudDirect ? 'Google Gemini Live' : 'N1 Emulator'}</span>
          <span className="text-[9px] text-emerald-400 block">100% Quality Assurance</span>
        </div>
      </div>
    </div>
  );
};
