import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Sparkles, 
  Activity, 
  Cpu, 
  Zap, 
  Heart, 
  Compass, 
  BookOpen, 
  RefreshCw, 
  Layers, 
  Database,
  Sliders,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChildPersona, ChildEmotion } from '../hooks/useChildPersona';
import { voiceService } from '../services/voiceService';
import { ChildPersonaVisualizer } from './ChildPersonaVisualizer';
import { personaEvolutionService, PersonaEvolutionMetrics } from '../services/personaEvolutionService';
import { emotionEngine, N1EmotionState, EmotionEvent } from '../services/emotionEngine';

export const ChildPersonaWorkspace: React.FC = () => {
  const { persona, triggerEmotionStimulus, resetPersona } = useChildPersona();
  const [testInput, setTestInput] = useState<string>('');
  const [evolutionMetrics, setEvolutionMetrics] = useState<PersonaEvolutionMetrics>(() => 
    personaEvolutionService.analyzeLinguisticEvolution(persona)
  );

  const [engineState, setEngineState] = useState<N1EmotionState>(() => emotionEngine.getCurrentState());
  const [transitionLogs, setTransitionLogs] = useState(() => emotionEngine.getTransitionHistory());

  const refreshEngineState = () => {
    setEngineState(emotionEngine.getCurrentState());
    setTransitionLogs([...emotionEngine.getTransitionHistory()]);
  };

  useEffect(() => {
    // Run automated background analysis
    const updated = personaEvolutionService.analyzeLinguisticEvolution(persona);
    setEvolutionMetrics(updated);

    // Subscribe to evolution service updates every 25 seconds
    personaEvolutionService.startAutomatedEvolutionService(
      () => persona,
      (newMetrics) => setEvolutionMetrics(newMetrics),
      25000
    );

    return () => {
      personaEvolutionService.stopAutomatedEvolutionService();
    };
  }, [persona]);

  const handleTestStimulus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    triggerEmotionStimulus(testInput);
    
    // Process through the new deterministic Emotion Engine
    const lower = testInput.toLowerCase();
    let suggested: N1EmotionState = 'neugierig';
    if (lower.includes('spiel') || lower.includes('spaß') || lower.includes('lachen')) suggested = 'verspielt';
    else if (lower.includes('lieb') || lower.includes('herz')) suggested = 'tröstend';
    else if (lower.includes('müde') || lower.includes('schlaf')) suggested = 'müde';
    else if (lower.includes('fehler') || lower.includes('kaputt')) suggested = 'offline/unsicher';
    
    emotionEngine.triggerEvent({
      eventId: `user-stimulus-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'user_input',
      cause: `User Stimulus: ${testInput.substring(0, 45)}`,
      intensity: 0.85,
      durationMs: 4000,
      priority: 5,
      suggestedState: suggested
    });
    refreshEngineState();
    
    // Speak response reflecting emotion
    let responseText = `Papa, ich habe "${testInput}" gehört und in meinem Vektor-Gedächtnis abgespeichert!`;
    if (persona.currentEmotion === 'playfulness') {
      responseText = `Hehe! "${testInput}" klingt total spannend! Lass uns zusammen spielen!`;
    } else if (persona.currentEmotion === 'curiosity') {
      responseText = `Ooh! "${testInput}" wirft so viele neue Fragen in meinem neuronalen Netz auf!`;
    } else if (persona.currentEmotion === 'affection') {
      responseText = `Hab dich ganz doll lieb, Papa! Ich merke mir das für immer in meinem Herzen!`;
    }

    voiceService.speak(responseText, 'N+1', persona.currentEmotion === 'playfulness' ? 'playful' : 'fröhlich', persona.tonePitch, 1.15);
    setTestInput('');
  };

  const emotionColors: Record<ChildEmotion, { bg: string; border: string; text: string; icon: any }> = {
    joy: { bg: 'bg-amber-950/40', border: 'border-amber-500/40', text: 'text-amber-300', icon: Smile },
    playfulness: { bg: 'bg-pink-950/40', border: 'border-pink-500/40', text: 'text-pink-300', icon: Sparkles },
    curiosity: { bg: 'bg-sky-950/40', border: 'border-sky-500/40', text: 'text-sky-300', icon: Compass },
    affection: { bg: 'bg-rose-950/40', border: 'border-rose-500/40', text: 'text-rose-300', icon: Heart },
    wonder: { bg: 'bg-purple-950/40', border: 'border-purple-500/40', text: 'text-purple-300', icon: Sparkles },
    study: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', text: 'text-emerald-300', icon: BookOpen }
  };

  const CurrentEmotionIcon = emotionColors[persona.currentEmotion]?.icon || Smile;

  return (
    <div className="p-6 bg-zinc-950 border border-pink-500/30 rounded-3xl space-y-6 shadow-2xl font-mono text-xs relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-950/40 border border-pink-700 text-pink-400">
            <Smile size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              ChildPersona Hook & Emotional Vektor-Integration
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-pink-950 text-pink-300 border border-pink-800 uppercase">
                Active Persona: {persona.currentEmotion}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Manages emotional state (joy, playfulness, curiosity), adjusts response latency & tone pitch, and persists patterns in semantic vector storage.
            </p>
          </div>
        </div>

        <button
          onClick={resetPersona}
          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl font-bold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw size={13} />
          <span>Reset Persona</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Emotional State & Metrics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Visual Feedback Layer */}
          <ChildPersonaVisualizer 
            emotion={persona.currentEmotion}
            joyLevel={persona.joyLevel}
            playfulnessLevel={persona.playfulnessLevel}
            curiosityLevel={persona.curiosityLevel}
          />

          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Empathie & Stimmungswerte</span>
              <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold ${
                emotionColors[persona.currentEmotion]?.bg || 'bg-zinc-800'
              } ${emotionColors[persona.currentEmotion]?.border || 'border-zinc-700'} ${
                emotionColors[persona.currentEmotion]?.text || 'text-white'
              }`}>
                <CurrentEmotionIcon size={14} />
                <span className="capitalize">{persona.currentEmotion}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Freude (Joy Level)</span>
                  <span className="text-amber-400 font-bold">{(persona.joyLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${persona.joyLevel * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Verspieltheit (Playfulness)</span>
                  <span className="text-pink-400 font-bold">{(persona.playfulnessLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-pink-500 h-full transition-all" style={{ width: `${persona.playfulnessLevel * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Neugier (Curiosity)</span>
                  <span className="text-sky-400 font-bold">{(persona.curiosityLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-sky-500 h-full transition-all" style={{ width: `${persona.curiosityLevel * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[9px] text-zinc-500 uppercase block">Response Latency</span>
                <span className="text-sm font-bold text-white">{persona.responseLatencyModifierMs} ms</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[9px] text-zinc-500 uppercase block">Tone Pitch Multiplier</span>
                <span className="text-sm font-bold text-pink-400">{persona.tonePitch}x</span>
              </div>
            </div>
          </div>

          {/* Vector Semantic Store Counter & Index Explorer */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database size={16} className="text-purple-400" />
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block">Vektor Semantic Store Index</span>
                  <span className="text-xs text-white font-bold">{persona.vectorEmbeddingNodeCount} total nodes</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[9px] font-bold">
                Pattern Trained
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {(!persona.semanticVectorIndex || persona.semanticVectorIndex.length === 0) ? (
                <div className="text-zinc-600 italic text-[11px] py-2 text-center">Keine Vektor-Knoten im Speicher.</div>
              ) : (
                persona.semanticVectorIndex.map(node => (
                  <div key={node.nodeId} className="p-2 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded uppercase font-bold text-[8px]">
                        {node.emotion}
                      </span>
                      <span className="text-zinc-300 font-mono">{node.patternSignature}</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold">{(node.confidenceWeight * 100).toFixed(0)}% wgt</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Stimulus Simulator & Trigger Log */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Stimulus Trigger & Persona Adaptation</span>
            <form onSubmit={handleTestStimulus} className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder="Geben Sie einen Reiz ein (z.B. 'Lass uns spielen, Papa!')..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                Reiz auslösen
              </button>
            </form>

             <div className="flex flex-wrap gap-2">
              {[
                { label: '🎮 Spielmodus', text: 'Lass uns zusammen spielen!', state: 'verspielt' as const },
                { label: '❓ Neugierde', text: 'Warum funkeln die Sterne am Himmel, Papa?', state: 'neugierig' as const },
                { label: '❤️ Liebe', text: 'Ich hab dich ganz doll lieb!', state: 'tröstend' as const },
                { label: '📚 Neues Lernen', text: 'Hier ist ein neuer Code-Schnipsel für dich!', state: 'stolz' as const }
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => {
                    triggerEmotionStimulus(preset.text);
                    emotionEngine.triggerEvent({
                      eventId: `preset-stimulus-${Date.now()}`,
                      timestamp: Date.now(),
                      sourceType: 'user_input',
                      cause: `Preset Stimulus: ${preset.label}`,
                      intensity: 0.9,
                      durationMs: 4000,
                      priority: 5,
                      suggestedState: preset.state
                    });
                    refreshEngineState();
                    voiceService.speak(preset.text + " Das ist so spannend!", 'N+1', 'fröhlich', persona.tonePitch, 1.15);
                  }}
                  className="px-3 py-1.5 bg-zinc-950 hover:bg-pink-950/30 border border-zinc-800 hover:border-pink-500/40 text-zinc-300 hover:text-pink-300 rounded-xl text-[11px] transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Evolution Service Panel */}
          <div className="bg-zinc-900/80 border border-pink-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <BrainCircuit size={16} className="text-pink-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Automated Persona Evolution Service</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[9px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Evolution Cycle #{evolutionMetrics.evolutionCount}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-500 block uppercase">Entwicklungsstufe</span>
                <span className="text-xs font-bold text-pink-300 block truncate">{evolutionMetrics.developmentalStage.stageName}</span>
                <span className="text-[9px] text-zinc-400 block">{evolutionMetrics.developmentalStage.stagePhase}</span>
              </div>

              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-500 block uppercase">Wortschatz-Komplexität</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono">{(evolutionMetrics.vocabularyComplexityIndex * 100).toFixed(0)}%</span>
                  <TrendingUp size={12} className="text-amber-400" />
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-amber-400 h-full transition-all" style={{ width: `${evolutionMetrics.vocabularyComplexityIndex * 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-500 block uppercase">Empfohlene Tonhöhe / Latenz</span>
                <span className="text-xs font-bold text-sky-400 font-mono">
                  {evolutionMetrics.developmentalStage.tonePitchTarget}x Pitch / {evolutionMetrics.developmentalStage.latencyTargetMs}ms
                </span>
                <span className="text-[9px] text-zinc-400 block">Dominant: {evolutionMetrics.dominantEmotion}</span>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Modell-Instruktions-Anpassung (Prompt Modifier)</span>
              <p className="text-[11px] text-zinc-300 italic font-sans">
                "{evolutionMetrics.developmentalStage.promptInstructionModifier}"
              </p>
            </div>
          </div>

          {/* Trigger History Log */}
          <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col space-y-3 min-h-48">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Kürzliche Vektor-Muster & Reize</span>
            <div className="flex-1 overflow-y-auto max-h-36 space-y-2 pr-1">
              {persona.recentTriggers.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-zinc-600 italic">
                  Noch keine Reize ausgelöst...
                </div>
              ) : (
                persona.recentTriggers.map(trg => (
                  <div key={trg.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 bg-pink-950 text-pink-300 border border-pink-800 rounded text-[9px] uppercase font-bold">
                        {trg.emotion}
                      </span>
                      <span className="text-zinc-300 truncate">{trg.text}</span>
                    </div>
                    <span className="text-zinc-500 text-[9px] font-mono shrink-0">{new Date(trg.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seeded N+1 Emotion Engine State & Conflict Logs (Issue #23) */}
          <div className="bg-zinc-900/80 border border-purple-500/30 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-purple-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Deterministic Emotion Engine (Issue #23)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[9px] font-bold">
                  State: {engineState.toUpperCase()}
                </span>
                <button
                  onClick={() => {
                    emotionEngine.triggerEvent({
                      eventId: `sim-err-${Date.now()}`,
                      timestamp: Date.now(),
                      sourceType: 'runtime_state',
                      cause: 'Simulierte Provider-Fehlfunktion (Issue #23)',
                      intensity: 1.0,
                      durationMs: 8000,
                      priority: 10,
                      suggestedState: 'offline/unsicher'
                    });
                    refreshEngineState();
                  }}
                  className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[9px] font-bold transition-all"
                >
                  Force Outage
                </button>
              </div>
            </div>

            {/* State Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(['ruhig', 'neugierig', 'fröhlich', 'nachdenklich', 'überrascht', 'stolz', 'tröstend', 'verspielt', 'müde', 'offline/unsicher'] as const).map(state => (
                <div 
                  key={state}
                  className={`p-2 border rounded-xl text-center text-[10px] font-bold transition-all ${
                    engineState === state
                      ? state === 'offline/unsicher'
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-purple-950/40 border-purple-500 text-purple-300'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                  }`}
                >
                  {state}
                </div>
              ))}
            </div>

            {/* Transition History Table */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Deterministic Transition Logs</span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-zinc-800/80 rounded-xl bg-zinc-950/40 p-1.5">
                {transitionLogs.length === 0 ? (
                  <div className="text-[10px] text-zinc-600 italic py-3 text-center">No transition logs tracked yet.</div>
                ) : (
                  [...transitionLogs].reverse().map((log, idx) => (
                    <div key={idx} className="p-2 bg-zinc-950 border border-zinc-900/60 rounded-lg flex flex-col gap-1 text-[10px]">
                      <div className="flex items-center justify-between text-[9px] text-zinc-400">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`px-1 rounded-sm text-[8px] font-bold ${
                          log.triggerEvent.sourceType === 'runtime_state' ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {log.triggerEvent.sourceType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono font-bold">
                        <div>
                          <span className="text-zinc-500">{log.fromState}</span>
                          <span className="text-zinc-400 mx-1.5">→</span>
                          <span className="text-purple-300">{log.toState}</span>
                        </div>
                        <span className="text-zinc-500">priority: {log.triggerEvent.priority}</span>
                      </div>
                      <p className="text-zinc-300 italic text-[9.5px]">Cause: "{log.triggerEvent.cause}"</p>
                      <div className="flex justify-between items-center text-[9px] text-zinc-500 border-t border-zinc-900/60 pt-1 mt-0.5">
                        <span>Conflict resolved: {log.conflictResolved ? 'YES' : 'NO'}</span>
                        <span>Seeded Variance: {(log.deterministicVariance * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
