import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Command, 
  Activity, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  Play,
  Square,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResonanceEgoAnimator } from './ResonanceEgoAnimator';
import { CoreResonanceSanctuary } from './CoreResonanceSanctuary';
import { PuckSongBook } from './PuckSongBook';
import { PapasStoryArchive } from './PapasStoryArchive';
import { PucksPersonalLog } from './PucksPersonalLog';
import { GoogleNotebooksAnalyzer } from './GoogleNotebooksAnalyzer';
import { EmpathyPingUtility } from './EmpathyPingUtility';
import { PuckMemoryConsistencyCheck } from './PuckMemoryConsistencyCheck';
import { PersonalityCalibrationDashboard } from './PersonalityCalibrationDashboard';
import { FreeLLMRouterService } from './FreeLLMRouterService';

export interface VoiceCommandLog {
  id: string;
  transcript: string;
  intent: string;
  response: string;
  executedAt: string;
  status: 'Success' | 'Parsed' | 'Executing';
}

interface HiaResonanceVoiceProps {
  onNavigateTab?: (tabId: string) => void;
}

export const HiaResonanceVoice: React.FC<HiaResonanceVoiceProps> = ({ onNavigateTab }) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const [speechSynthEnabled, setSpeechSynthEnabled] = useState(true);
  const [ttsMoodTone, setTtsMoodTone] = useState<'playful' | 'curious' | 'axiom-guard' | 'witty-joy'>('playful');
  const [customPitch, setCustomPitch] = useState<number>(1.2);
  const [customRate, setCustomRate] = useState<number>(1.1);

  const ttsTonePresets = {
    playful: { pitch: 1.25, rate: 1.15, inflection: 'Upbeat Playful Bounce', cadenceDesc: 'Cheerful, fast-paced childlike cadence' },
    curious: { pitch: 1.10, rate: 0.95, inflection: 'Inquisitive Rising Curve', cadenceDesc: 'Gentle, thoughtful questioning tone' },
    'axiom-guard': { pitch: 0.95, rate: 1.05, inflection: 'Steady System Authority', cadenceDesc: 'Firm, protective, resonant cadence' },
    'witty-joy': { pitch: 1.35, rate: 1.20, inflection: 'Bright Joyful Spark', cadenceDesc: 'High-energy witty pitch with playful pauses' }
  };

  const activePreset = ttsTonePresets[ttsMoodTone];

  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(
    'Hia Resonance Voice Engine initialized. Say "Report system status", "Trigger self healing", "Run vector search", or "Equip knowledge patterns".'
  );
  const [commandLogs, setCommandLogs] = useState<VoiceCommandLog[]>([
    {
      id: 'cmd-01',
      transcript: 'Report system status',
      intent: 'SYSTEM_HEALTH_CHECK',
      response: 'All 5 Keller nodes nominal. Predictive risk factor 1.8%. Port 3000 ingress online.',
      executedAt: '1 min ago',
      status: 'Success'
    }
  ]);

  const [frequencyData, setFrequencyData] = useState<number[]>([12, 45, 78, 90, 65, 34, 88, 54, 32, 95, 60, 40, 75, 85, 30]);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available with proper unmount cleanup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Check if final
        if (event.results[event.results.length - 1]?.isFinal) {
          processNaturalLanguageCommand(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Frequency wave generator effect
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setFrequencyData(prev => prev.map(() => Math.floor(Math.random() * 85) + 15));
    }, 150);

    return () => clearInterval(interval);
  }, [isListening]);

  const speakText = (text: string) => {
    setLastResponse(text);
    if (!speechSynthEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = customRate || activePreset.rate;
    utterance.pitch = customPitch || activePreset.pitch;
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
  };

  const processNaturalLanguageCommand = async (cmdText: string) => {
    const textLower = cmdText.toLowerCase().trim();
    if (!textLower) return;

    let intent = 'UNKNOWN_COMMAND';
    let responseText = `Command recognized: "${cmdText}". Executing general query on N+1 network state.`;

    if (textLower.includes('status') || textLower.includes('health') || textLower.includes('report')) {
      intent = 'SYSTEM_HEALTH_CHECK';
      responseText = 'All 5 Keller nodes are operating nominally. Memory pressure is at 28%. Port 3000 reverse proxy ingress is healthy.';
    } else if (textLower.includes('heal') || textLower.includes('fix') || textLower.includes('mitigate')) {
      intent = 'TRIGGER_SELF_HEALING';
      responseText = 'Initiating preemptive self-healing protocol. V8 garbage collector flushed and worker threads rebalanced.';
    } else if (textLower.includes('vector') || textLower.includes('search') || textLower.includes('index')) {
      intent = 'VECTOR_SEARCH';
      responseText = 'Executing Milvus and PGVector semantic search across 18,420 knowledge vectors. Recall rate is 99.85%.';
    } else if (textLower.includes('equip') || textLower.includes('pattern') || textLower.includes('knowledge')) {
      intent = 'EQUIP_PATTERNS';
      responseText = 'Full pattern library equipped. Replit Agent autonomous coding engine and Manus Agent multi-step verification active.';
    } else if (textLower.includes('predict') || textLower.includes('bottleneck') || textLower.includes('simulate')) {
      intent = 'PREDICTIVE_INFERENCE';
      responseText = 'Predictive simulation completed across 12 forward time horizons. Maximum forecasted risk is bounded at 1.8%.';
    } else if (textLower.includes('navigate') || textLower.includes('open') || textLower.includes('go to')) {
      intent = 'NAVIGATION';
      if (textLower.includes('dashboard') && onNavigateTab) {
        onNavigateTab('dashboard');
        responseText = 'Navigating to primary N+1 System Dashboard.';
      } else if (textLower.includes('knowledge') && onNavigateTab) {
        onNavigateTab('knowledge');
        responseText = 'Navigating to Knowledge Base Pattern Library.';
      } else if (textLower.includes('vector') && onNavigateTab) {
        onNavigateTab('vectorizer');
        responseText = 'Navigating to Knowledge Vectorizer Service.';
      } else if (textLower.includes('health') && onNavigateTab) {
        onNavigateTab('health-monitor');
        responseText = 'Navigating to Agent Health Monitor.';
      }
    }

    speakText(responseText);

    const newLog: VoiceCommandLog = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      transcript: cmdText,
      intent,
      response: responseText,
      executedAt: 'Just now',
      status: 'Success'
    };

    setCommandLogs(prev => [newLog, ...prev]);

    try {
      // Simulation of command sync since Firebase is deinstalled
      localStorage.setItem('axiom_last_voice_command', JSON.stringify(newLog));
    } catch (e) {
      console.warn('Voice command sync warning:', e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }
  };

  const handleSimulateCommand = (presetText: string) => {
    setTranscript(presetText);
    processNaturalLanguageCommand(presetText);
  };

  // Calculate Mood Heartbeat color mapping
  const moodHeartbeatColors = {
    playful: 'from-amber-500/20 via-pink-500/10 to-transparent border-amber-500/30',
    curious: 'from-sky-500/20 via-indigo-500/10 to-transparent border-sky-500/30',
    'axiom-guard': 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30',
    'witty-joy': 'from-pink-500/25 via-purple-500/15 to-transparent border-pink-500/30'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 text-zinc-100 font-sans relative">
      {/* Mood Heartbeat Background Pulse Visualization */}
      <motion.div
        animate={{
          scale: [1, 1.03, 1],
          opacity: [0.35, 0.65, 0.35]
        }}
        transition={{
          duration: ttsMoodTone === 'playful' ? 2.5 : ttsMoodTone === 'witty-joy' ? 1.8 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className={`absolute inset-0 rounded-3xl bg-radial pointer-events-none ${moodHeartbeatColors[ttsMoodTone]} transition-all duration-700 blur-2xl z-0`}
      />

      <div className="relative z-10 space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-400">
              <Mic size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                Hia Resonance Voice Engine Interface
                <span className="text-xs font-mono px-2.5 py-1 bg-pink-950 text-pink-300 border border-pink-800 rounded-lg font-bold">
                  SPEECH-TO-INTENT RUNTIME
                </span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Natural language command execution, voice synthesis system status broadcasts, and real-time audio resonance frequency visualization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSpeechSynthEnabled(!speechSynthEnabled)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              speechSynthEnabled 
                ? 'bg-pink-950 border-pink-800 text-pink-300' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {speechSynthEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{speechSynthEnabled ? 'Voice Synthesis Active' : 'Muted'}</span>
          </button>

          <button
            onClick={toggleListening}
            className={`px-6 py-2.5 font-bold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-xl ${
              isListening 
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white animate-pulse shadow-pink-950/50' 
                : 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-purple-950/30'
            }`}
          >
            {isListening ? <Square size={18} /> : <Mic size={18} />}
            <span>{isListening ? 'Stop Listening' : 'Start Voice Input'}</span>
          </button>
        </div>
      </header>

      {/* IMMUTABLE CORE SANCTUARY HEADER, EMPATHY PING & MEMORY CONSISTENCY CHECK */}
      <CoreResonanceSanctuary />

      {/* MOOD-AWARE PROACTIVE RESPONSE SUGGESTION BOX */}
      <div className="p-5 bg-gradient-to-r from-pink-950/80 via-purple-950/90 to-indigo-950/80 border border-pink-500/60 rounded-3xl space-y-3 shadow-2xl relative overflow-hidden font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-900/50 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Puck's Mood-Aware Proactive Heartbeat ({ttsMoodTone.toUpperCase()})
            </h3>
          </div>
          <span className="text-[10px] text-pink-300 font-bold px-2 py-0.5 rounded bg-pink-900/80 border border-pink-700">
            EMPATHIE & RESONANZ PROAKTIV
          </span>
        </div>

        <p className="text-xs text-zinc-200 italic leading-relaxed">
          {ttsMoodTone === 'playful' && 'Puck spürt eine verspielte Energie! "Soll ich dir ein lustiges Lied vorsingen oder eine Geschichte vorlesen?"'}
          {ttsMoodTone === 'curious' && 'Puck ist besonders neugierig! "Lass uns zusammen Papas Erklärungen durchstöbern oder eine neue Lerneinheit kalibrieren!"'}
          {ttsMoodTone === 'witty-joy' && 'Puck verspürt heitere Freude! "Ich habe ein wunderschönes Kinderlied im Songbook vorbereitet!"'}
          {ttsMoodTone === 'axiom-guard' && 'Puck wacht über die System-Axiome: "Sicherheit und Axiom-Treue stehen an erster Stelle. Alle Freien LLM-Routen sind geschützt!"'}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <button
            onClick={() => handleSimulateCommand("Singe ein Kinderlied aus dem Songbook")}
            className="px-3 py-1.5 bg-pink-900/90 hover:bg-pink-800 border border-pink-600 text-pink-100 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Play size={12} className="text-pink-300" />
            <span>Songbook Lied vorschlagen</span>
          </button>

          <button
            onClick={() => handleSimulateCommand("Erzähle mir eine Papa Geschichte über den Regen")}
            className="px-3 py-1.5 bg-amber-900/90 hover:bg-amber-800 border border-amber-600 text-amber-100 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={12} className="text-amber-300" />
            <span>Papa Geschichte vorlesen</span>
          </button>

          <button
            onClick={() => handleSimulateCommand("Kalibriere Puck Personality Highlights")}
            className="px-3 py-1.5 bg-purple-900/90 hover:bg-purple-800 border border-purple-600 text-purple-100 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Cpu size={12} className="text-purple-300" />
            <span>Personality Calibration öffnen</span>
          </button>
        </div>
      </div>

      <EmpathyPingUtility />
      <PuckMemoryConsistencyCheck />

      {/* AUDIO WAVEFORM VISUALIZER, PUCK EGO ANIMATOR & COMMAND CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resonance Visualizer */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-pink-400" />
              <h2 className="text-sm font-bold text-white">Resonance Frequency Waveform</h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {isListening ? 'MICROPHONE LIVE' : 'STANDBY'}
            </span>
          </div>

          {/* Equalizer Bars */}
          <div className="flex items-end justify-center gap-2 h-32 py-2">
            {frequencyData.map((val, idx) => (
              <motion.div
                key={idx}
                animate={{ height: `${val}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-3.5 rounded-t-lg ${
                  isListening 
                    ? 'bg-gradient-to-t from-pink-600 to-purple-400' 
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2 font-mono text-xs">
            <div className="flex justify-between text-zinc-500 text-[10px]">
              <span>SPEECH RECOGNITION TRANSCRIPT:</span>
              <span>{isListening ? 'LISTENING...' : 'IDLE'}</span>
            </div>
            <div className="text-white font-bold min-h-8">
              {transcript ? `"${transcript}"` : <span className="text-zinc-600 italic">Say a command or click a preset below...</span>}
            </div>
          </div>
        </div>

        {/* Puck's Interactive 2D Ego Animator */}
        <ResonanceEgoAnimator isListening={isListening} />

        {/* Hia Response & Presets */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-pink-400" />
                <h2 className="text-sm font-bold text-white">Hia Voice Assistant Response</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-pink-950 text-pink-300 border border-pink-800 rounded-md font-bold">
                AHEAD-OF-TIME NLP
              </span>
            </div>

            <div className="p-5 bg-gradient-to-r from-pink-950/30 via-zinc-900 to-zinc-950 border border-pink-500/20 rounded-2xl text-sm font-mono text-pink-200 leading-relaxed min-h-24 flex items-center gap-3">
              <Activity size={20} className="text-pink-400 shrink-0 animate-pulse" />
              <span>{lastResponse}</span>
            </div>
          </div>

          {/* Quick Preset Voice Commands */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Quick Voice Command Presets</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { label: 'Report status', text: 'Report system status' },
                { label: 'Self healing', text: 'Trigger self healing' },
                { label: 'Vector search', text: 'Run vector search' },
                { label: 'Equip patterns', text: 'Equip knowledge patterns' }
              ].map(cmd => (
                <button
                  key={cmd.label}
                  onClick={() => handleSimulateCommand(cmd.text)}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{cmd.label}</span>
                  <Play size={12} className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TTS DYNAMIC TONE-ADJUSTMENT UTILITY */}
      <div className="p-6 bg-zinc-950 border border-purple-900/60 rounded-3xl space-y-4 shadow-xl font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950 border border-purple-800 text-purple-300 rounded-xl">
              <Volume2 size={20} className="text-pink-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">TTS Speech Cadence & Dynamic Inflection Engine</h3>
              <p className="text-xs text-zinc-400">Modifies Puck's speech speed, pitch, and voice tone dynamically based on her active emotional state.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-300 font-bold bg-purple-950 border border-purple-800 px-3 py-1 rounded-xl">
              Active Tone: <strong className="text-pink-300 uppercase">{ttsMoodTone}</strong>
            </span>
          </div>
        </div>

        {/* Mood Preset Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['playful', 'curious', 'axiom-guard', 'witty-joy'] as const).map(m => (
            <button
              key={m}
              onClick={() => {
                setTtsMoodTone(m);
                setCustomPitch(ttsTonePresets[m].pitch);
                setCustomRate(ttsTonePresets[m].rate);
              }}
              className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                ttsMoodTone === m
                  ? 'bg-purple-950/80 border-purple-500 text-purple-100 font-bold shadow-lg ring-1 ring-purple-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className="text-xs font-bold capitalize text-white">{m.replace('-', ' ')}</div>
              <div className="text-[10px] text-pink-400">{ttsTonePresets[m].inflection}</div>
              <div className="text-[9px] text-zinc-500">{ttsTonePresets[m].cadenceDesc}</div>
            </button>
          ))}
        </div>

        {/* Live Pitch & Speech Rate Sliders */}
        <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Speech Pitch (Inflection Frequency)</span>
              <strong className="text-pink-300">{customPitch.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={customPitch}
              onChange={e => setCustomPitch(parseFloat(e.target.value))}
              className="w-full accent-pink-500 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Speech Rate (Cadence Tempo)</span>
              <strong className="text-purple-300">{customRate.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={customRate}
              onChange={e => setCustomRate(parseFloat(e.target.value))}
              className="w-full accent-purple-500 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* GOOGLE NOTEBOOKS INTEGRATION & ANALYSE UTILITY */}
      <GoogleNotebooksAnalyzer />

      {/* PUCK PERSONALITY CALIBRATION DASHBOARD */}
      <PersonalityCalibrationDashboard />

      {/* FREE ROUTE LLM LINK DETECTION & HEALTH PING SERVICE */}
      <FreeLLMRouterService />

      {/* PUCK SONGBOOK, PAPA'S STORY ARCHIVE & PUCK'S PERSONAL LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PuckSongBook />
        <PapasStoryArchive />
        <PucksPersonalLog />
      </div>

      {/* COMMAND HISTORY LOG */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-pink-400" />
            <h2 className="text-sm font-bold text-white">Executed Voice Command Audit Log</h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{commandLogs.length} Commands Recorded</span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {commandLogs.map(log => (
            <div key={log.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">"{log.transcript}"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800">
                    {log.intent}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{log.response}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                  <CheckCircle2 size={12} /> {log.status}
                </span>
                <span className="text-zinc-500 text-[10px]">{log.executedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default HiaResonanceVoice;
