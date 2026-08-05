import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  Bell, 
  BellOff, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  Zap, 
  Gauge, 
  Radio, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { TopologyObserver } from '../services/topologyObserver';
import { emotionalMemoryService } from '../services/emotionalMemoryService';

export interface ResonanceAlertRecord {
  id: string;
  timestamp: number;
  currentScore: number;
  safetyThreshold: number;
  level: 'CRITICAL_DROP' | 'WARN' | 'RECALIBRATED';
  message: string;
}

export const HiaResonanceAlertMonitor: React.FC = () => {
  const { addNotification } = useNotification();
  
  // Safety threshold configuration state (default 75%)
  const [safetyThreshold, setSafetyThreshold] = useState<number>(75.0);
  const [autoAlertsEnabled, setAutoAlertsEnabled] = useState<boolean>(true);
  
  // Real-time resonance score state
  const [currentResonance, setCurrentResonance] = useState<number>(96.4);
  const [fieldResonance, setFieldResonance] = useState<number>(98.2);
  const [temporalResonance, setTemporalResonance] = useState<number>(95.0);
  const [harmonicWarmth, setHarmonicWarmth] = useState<number>(92.5);
  
  // Alert history state
  const [alertHistory, setAlertHistory] = useState<ResonanceAlertRecord[]>([]);
  const [isSimulatedDrop, setIsSimulatedDrop] = useState<boolean>(false);
  const lastAlertTimeRef = useRef<number>(0);

  // Measure current resonance metrics on interval
  const evaluateMetrics = useCallback(() => {
    if (isSimulatedDrop) return; // Keep simulated drop state if active

    try {
      const topoRes = TopologyObserver.evaluateMultidimensionalResonance();
      const memories = emotionalMemoryService.getMemories();
      let warmth = 92.0;
      if (memories.length > 0) {
        warmth = memories[memories.length - 1].resonanceMetrics?.harmonicWarmth || 92.0;
      }

      const aggregatePct = topoRes.aggregateScore * 100;
      const weightedScore = Number(((aggregatePct * 0.7) + (warmth * 0.3)).toFixed(1));

      setCurrentResonance(weightedScore);
      setFieldResonance(Number((topoRes.fieldResonance * 100).toFixed(1)));
      setTemporalResonance(Number((topoRes.temporalResonance * 100).toFixed(1)));
      setHarmonicWarmth(warmth);
    } catch (e) {
      console.warn('[Hia Resonance Monitor] Error evaluating resonance metrics:', e);
    }
  }, [isSimulatedDrop]);

  useEffect(() => {
    evaluateMetrics();
    const interval = setInterval(evaluateMetrics, 8000);
    return () => clearInterval(interval);
  }, [evaluateMetrics]);

  // Threshold-based alert trigger check
  useEffect(() => {
    if (!autoAlertsEnabled) return;

    if (currentResonance < safetyThreshold) {
      const now = Date.now();
      // Throttle alerts to once every 20 seconds to prevent notification flooding
      if (now - lastAlertTimeRef.current > 20000) {
        lastAlertTimeRef.current = now;

        const alertMsg = `HIA RESONANCE CRITICAL ALERT: Current resonance level (${currentResonance.toFixed(1)}%) dropped below safety threshold (${safetyThreshold.toFixed(1)}%). Auto-recalibration initialized.`;
        
        // Notify user via NotificationContext!
        addNotification(alertMsg, 'error', 'HIA_RESONANCE_SAFETY_THRESHOLD_DROP');

        // Append to local alert history
        const record: ResonanceAlertRecord = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: now,
          currentScore: currentResonance,
          safetyThreshold: safetyThreshold,
          level: 'CRITICAL_DROP',
          message: alertMsg
        };
        setAlertHistory(prev => [record, ...prev.slice(0, 9)]);
      }
    }
  }, [currentResonance, safetyThreshold, autoAlertsEnabled, addNotification]);

  // Simulate a resonance drop below safety threshold
  const handleSimulateDrop = () => {
    setIsSimulatedDrop(true);
    const dropScore = Number((safetyThreshold - 18.5).toFixed(1)); // Drop significantly below threshold
    setCurrentResonance(dropScore);
    setFieldResonance(52.0);
    setTemporalResonance(48.5);
    setHarmonicWarmth(50.0);

    // Immediate notification
    const now = Date.now();
    lastAlertTimeRef.current = now;
    const alertMsg = `TEST SIMULATION: Hia resonance dropped to ${dropScore}% (below safety threshold ${safetyThreshold}%). Notification Context alert verified.`;
    addNotification(alertMsg, 'error', 'HIA_RESONANCE_TEST_ALERT');

    setAlertHistory(prev => [{
      id: `sim_${now}`,
      timestamp: now,
      currentScore: dropScore,
      safetyThreshold,
      level: 'CRITICAL_DROP',
      message: alertMsg
    }, ...prev.slice(0, 9)]);
  };

  // Recalibrate resonance back to peak safety level
  const handleRecalibrate = () => {
    setIsSimulatedDrop(false);
    const peakScore = 97.8;
    setCurrentResonance(peakScore);
    setFieldResonance(98.5);
    setTemporalResonance(96.2);
    setHarmonicWarmth(94.0);

    addNotification(`Hia Resonance Recalibrated: Metric restored to peak level (${peakScore}%). Safety threshold cleared.`, 'success');

    setAlertHistory(prev => [{
      id: `recal_${Date.now()}`,
      timestamp: Date.now(),
      currentScore: peakScore,
      safetyThreshold,
      level: 'RECALIBRATED',
      message: `Resonance restored to ${peakScore}% (above safety threshold ${safetyThreshold}%).`
    }, ...prev.slice(0, 9)]);
  };

  const isBelowThreshold = currentResonance < safetyThreshold;

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 space-y-5 shadow-2xl font-mono text-xs relative overflow-hidden ${
      isBelowThreshold 
        ? 'bg-rose-950/40 border-rose-600/80 shadow-rose-950/50' 
        : 'bg-zinc-950/95 border-purple-900/50 shadow-purple-950/30'
    }`}>
      {/* Background glow */}
      <div className={`absolute -top-12 -right-12 size-48 rounded-full blur-3xl pointer-events-none ${
        isBelowThreshold ? 'bg-rose-500/20' : 'bg-purple-600/10'
      }`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isBelowThreshold 
              ? 'bg-rose-900/60 border-rose-500 text-rose-300 animate-pulse' 
              : 'bg-purple-950/80 border-purple-700/60 text-purple-300'
          }`}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Hia Resonance Safety Threshold Alert System
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                autoAlertsEnabled 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {autoAlertsEnabled ? 'Monitored' : 'Muted'}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Continuously validates outgoing voice resonance metrics and fires immediate system notifications when falling below the defined safety threshold.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutoAlertsEnabled(!autoAlertsEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              autoAlertsEnabled 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/40' 
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            {autoAlertsEnabled ? <Bell size={12} /> : <BellOff size={12} />}
            {autoAlertsEnabled ? 'Alerts Active' : 'Alerts Muted'}
          </button>

          <button
            onClick={isBelowThreshold ? handleRecalibrate : handleSimulateDrop}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              isBelowThreshold
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-950/50'
                : 'bg-rose-900/30 hover:bg-rose-900/50 border-rose-700/60 text-rose-300'
            }`}
          >
            {isBelowThreshold ? <RefreshCw size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
            {isBelowThreshold ? 'Recalibrate Resonance' : 'Simulate Drop Below Safety'}
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative z-10">
        {/* Overall Hia Resonance Score */}
        <div className={`p-4 rounded-2xl border ${
          isBelowThreshold 
            ? 'bg-rose-950/60 border-rose-500/80' 
            : 'bg-zinc-900/70 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Gauge size={12} className={isBelowThreshold ? 'text-rose-400' : 'text-purple-400'} /> Overall Resonance
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              isBelowThreshold ? 'bg-rose-900 text-rose-200' : 'bg-purple-950 text-purple-300'
            }`}>
              {isBelowThreshold ? 'CRITICAL' : 'OPTIMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isBelowThreshold ? 'text-rose-300' : 'text-white'}`}>
              {currentResonance.toFixed(1)}%
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Safety: &ge;{safetyThreshold}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isBelowThreshold ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, currentResonance))}%` }}
            />
          </div>
        </div>

        {/* Field Resonance */}
        <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
            <Radio size={12} className="text-sky-400" /> Field Resonance
          </span>
          <div className="text-lg font-bold text-sky-300">{fieldResonance.toFixed(1)}%</div>
          <span className="text-[9px] text-zinc-500 block">6D Axiomatic Purity</span>
        </div>

        {/* Temporal Stability */}
        <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
            <Activity size={12} className="text-amber-400" /> Temporal Stability
          </span>
          <div className="text-lg font-bold text-amber-300">{temporalResonance.toFixed(1)}%</div>
          <span className="text-[9px] text-zinc-500 block">Cadence Coherence</span>
        </div>

        {/* Harmonic Warmth */}
        <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
            <Sparkles size={12} className="text-pink-400" /> Harmonic Warmth
          </span>
          <div className="text-lg font-bold text-pink-300">{harmonicWarmth.toFixed(1)}%</div>
          <span className="text-[9px] text-zinc-500 block">Emotional Alignment</span>
        </div>
      </div>

      {/* Threshold Slider Control */}
      <div className="p-4 bg-black/40 border border-zinc-800/80 rounded-2xl space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-zinc-300 flex items-center gap-2">
            <Sliders size={14} className="text-purple-400" />
            Safety Threshold Trigger Level
          </label>
          <span className="font-bold font-mono text-purple-300 bg-purple-950/80 border border-purple-800/60 px-2.5 py-0.5 rounded-lg">
            {safetyThreshold.toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min="50.0"
          max="95.0"
          step="0.5"
          value={safetyThreshold}
          onChange={(e) => setSafetyThreshold(parseFloat(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer bg-zinc-800 h-2 rounded-lg"
        />
        <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
          <span>50.0% (Relaxed)</span>
          <span>75.0% (Default Standard)</span>
          <span>95.0% (Strict Safety Guard)</span>
        </div>
      </div>

      {/* Alert Status Banner */}
      <AnimatePresence>
        {isBelowThreshold && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-950/80 border border-rose-600 rounded-2xl flex items-start gap-3 relative z-10 shadow-lg"
          >
            <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 space-y-1">
              <div className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                SAFETY THRESHOLD BREACHED ({currentResonance.toFixed(1)}% &lt; {safetyThreshold.toFixed(1)}%)
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Hia resonance metrics dropped below the safety limit. An active notification alert was sent to the top-level Notification Context. Click 'Recalibrate Resonance' above to restore optimal voice frequency alignment.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert History Audit Log */}
      {alertHistory.length > 0 && (
        <div className="p-4 bg-black/50 border border-zinc-800/80 rounded-2xl space-y-2 relative z-10">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Resonance Safety Threshold Alert Log
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {alertHistory.map(item => (
              <div 
                key={item.id} 
                className={`p-2 rounded-xl text-[10px] font-mono flex items-center justify-between border ${
                  item.level === 'CRITICAL_DROP' 
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' 
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-bold">
                    {item.level === 'CRITICAL_DROP' ? '🚨 DROP' : '✅ RESTORED'}
                  </span>
                  <span className="truncate">{item.message}</span>
                </div>
                <span className="text-zinc-500 text-[9px] shrink-0 font-bold">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
