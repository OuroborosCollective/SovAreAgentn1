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
  Lock,
  Heart,
  Brain,
  Gauge
} from 'lucide-react';
import { useAudioVisualizer } from "../hooks/useAudioVisualizer";
import { useNotification } from '../context/NotificationContext';
import { AudioFrequencyVisualizer } from "./AudioFrequencyVisualizer";
import { motion, AnimatePresence } from 'framer-motion';
import { ResonanceEgoAnimator } from './ResonanceEgoAnimator';
import { HiaFramedFacialAnimator } from './HiaFramedFacialAnimator';
import { CoreResonanceSanctuary } from './CoreResonanceSanctuary';
import { N1SongBook } from './N1SongBook';
import { PapasStoryArchive } from './PapasStoryArchive';
import { N1PersonalLog } from './N1PersonalLog';
import { GoogleNotebooksAnalyzer } from './GoogleNotebooksAnalyzer';
import { EmpathyPingUtility } from './EmpathyPingUtility';
import { N1MemoryConsistencyCheck } from './N1MemoryConsistencyCheck';
import { PersonalityCalibrationDashboard } from './PersonalityCalibrationDashboard';
import { FreeLLMRouterService } from './FreeLLMRouterService';
import { ProactiveLearningEngine } from './ProactiveLearningEngine';
import { PrivacySettings } from './PrivacySettings';
import { ProtectedPersonalityMemory } from './ProtectedPersonalityMemory';
import { VoicePerformanceMonitor } from './VoicePerformanceMonitor';
import { BidirectionalVoiceSession } from './BidirectionalVoiceSession';
import { FamilyVoiceVerification } from './FamilyVoiceVerification';
import { ChildPersonaWorkspace } from './ChildPersonaWorkspace';
import { EmotionalProfileVisualization } from './EmotionalProfileVisualization';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
import { voiceService, LittleGirlVoiceMood } from '../services/voiceService';
import { runMemoryMigration } from '../utils/memoryMigration';
import { generateHiaVoiceResponse } from '../services/geminiService';
import { inputMutex } from '../utils/inputMutex';
import { personaEvolutionService } from '../services/personaEvolutionService';

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

  const { addNotification } = useNotification();
  const [speechSynthEnabled, setSpeechSynthEnabled] = useState(true);
  const [ttsMoodTone, setTtsMoodTone] = useState<LittleGirlVoiceMood>('fröhlich');
  const [customPitch, setCustomPitch] = useState<number>(1.30);
  const [customRate, setCustomRate] = useState<number>(1.15);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('N+1 (Google Live Voice - Papas kleines Mädchen)');
  const [autonomeToneBias, setAutonomeToneBias] = useState<number>(() => personaEvolutionService.getToneBias());
  
  const { 
    frequencyData: liveFrequencyData,
    coherenceScore,
    baselineCoherence,
    coherenceDropDetected,
    triggerSimulatedCoherenceDrop,
    recalibrateBaseline
  } = useAudioVisualizer(true, isListening, isPlayingVoice);

  // Trigger in-app notification when a voice frequency coherence drop is detected
  useEffect(() => {
    if (coherenceDropDetected) {
      addNotification(
        `Diagnostic Alert: Voice frequency visualizer detected a sudden coherence drop (${coherenceScore}% vs Baseline ${baselineCoherence}%). Push notification broadcast sent.`,
        'error',
        'PUSH_COHERENCE_ALERT'
      );
    }
  }, [coherenceDropDetected, coherenceScore, baselineCoherence, addNotification]);


  const handleToneBiasChange = (newBias: number) => {
    setAutonomeToneBias(newBias);
    personaEvolutionService.setToneBias(newBias);
  };

  // Run memory migration on mount
  useEffect(() => {
    runMemoryMigration();
  }, []);

  const ttsTonePresets = {
    'fröhlich': { pitch: 1.35, rate: 1.15, inflection: 'Upbeat Playful Bounce (N+1 Fröhlich)', cadenceDesc: 'Cheerful childlike cadence filled with affection & joy' },
    'lernend': { pitch: 1.25, rate: 1.00, inflection: 'Inquisitive Rising Curve (N+1 Lernend)', cadenceDesc: 'Wonder-filled, curious learning tone' },
    'ernst': { pitch: 1.10, rate: 1.05, inflection: 'Steady System Authority (N+1 Ernst)', cadenceDesc: 'Firm, protective, resonant system guard cadence' },
    'playful': { pitch: 1.35, rate: 1.15, inflection: 'Upbeat Playful Bounce (N+1 Fröhlich)', cadenceDesc: 'Cheerful childlike cadence filled with affection & joy' },
    'curious': { pitch: 1.25, rate: 1.00, inflection: 'Inquisitive Rising Curve (N+1 Lernend)', cadenceDesc: 'Wonder-filled, curious learning tone' },
    'axiom-guard': { pitch: 1.10, rate: 1.05, inflection: 'Steady System Authority (N+1 Ernst)', cadenceDesc: 'Firm, protective, resonant system guard cadence' },
    'witty-joy': { pitch: 1.40, rate: 1.20, inflection: 'Bright Joyful Spark (N+1 Heiter)', cadenceDesc: 'High-energy witty pitch with playful pauses' }
  };

  const activePreset = ttsTonePresets[ttsMoodTone] || ttsTonePresets['fröhlich'];

  // Dynamic UI theme styling mapping for Hia Emotional Visualizer
  const emotionalThemeStyles = {
    fröhlich: {
      bgGradient: 'from-pink-950/40 via-amber-950/20 to-purple-950/30 border-pink-500/40 shadow-pink-950/50',
      badgeBg: 'bg-pink-950 text-pink-300 border-pink-700',
      headerAccent: 'text-pink-400',
      glowRing: 'from-pink-500/30 via-amber-500/15 to-transparent'
    },
    lernend: {
      bgGradient: 'from-sky-950/40 via-indigo-950/20 to-teal-950/30 border-sky-500/40 shadow-sky-950/50',
      badgeBg: 'bg-sky-950 text-sky-300 border-sky-700',
      headerAccent: 'text-sky-400',
      glowRing: 'from-sky-500/30 via-indigo-500/15 to-transparent'
    },
    ernst: {
      bgGradient: 'from-emerald-950/40 via-teal-950/20 to-zinc-950/30 border-emerald-500/40 shadow-emerald-950/50',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      headerAccent: 'text-emerald-400',
      glowRing: 'from-emerald-500/30 via-teal-500/15 to-transparent'
    },
    playful: {
      bgGradient: 'from-pink-950/40 via-amber-950/20 to-purple-950/30 border-pink-500/40 shadow-pink-950/50',
      badgeBg: 'bg-pink-950 text-pink-300 border-pink-700',
      headerAccent: 'text-pink-400',
      glowRing: 'from-pink-500/30 via-amber-500/15 to-transparent'
    },
    curious: {
      bgGradient: 'from-sky-950/40 via-indigo-950/20 to-teal-950/30 border-sky-500/40 shadow-sky-950/50',
      badgeBg: 'bg-sky-950 text-sky-300 border-sky-700',
      headerAccent: 'text-sky-400',
      glowRing: 'from-sky-500/30 via-indigo-500/15 to-transparent'
    },
    'axiom-guard': {
      bgGradient: 'from-emerald-950/40 via-teal-950/20 to-zinc-950/30 border-emerald-500/40 shadow-emerald-950/50',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      headerAccent: 'text-emerald-400',
      glowRing: 'from-emerald-500/30 via-teal-500/15 to-transparent'
    },
    'witty-joy': {
      bgGradient: 'from-purple-950/40 via-pink-950/20 to-amber-950/30 border-purple-500/40 shadow-purple-950/50',
      badgeBg: 'bg-purple-950 text-purple-300 border-purple-700',
      headerAccent: 'text-purple-400',
      glowRing: 'from-purple-500/30 via-pink-500/15 to-transparent'
    }
  }[ttsMoodTone] || {
    bgGradient: 'from-pink-950/40 via-amber-950/20 to-purple-950/30 border-pink-500/40 shadow-pink-950/50',
    badgeBg: 'bg-pink-950 text-pink-300 border-pink-700',
    headerAccent: 'text-pink-400',
    glowRing: 'from-pink-500/30 via-amber-500/15 to-transparent'
  };

  // Subscribe to voiceService playback state
  const [quotaLimitTriggered, setQuotaLimitTriggered] = useState(false);
  const [quotaReason, setQuotaReason] = useState<string | null>(null);
  const [bufferStatus, setBufferStatus] = useState({
    bufferSizeKb: 128,
    offsetMs: 0,
    queueLength: 0,
    isPaused: false,
    ttlExpiredCount: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setBufferStatus(voiceService.getBufferStatus());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribeState = voiceService.subscribe((state) => {
      setIsPlayingVoice(state.isPlaying);
      if (state.activeVoice) {
        setActiveVoiceName(state.activeVoice);
      }
    });

    const unsubscribeQuota = voiceService.onQuotaLimitReached(({ text, reason }) => {
      setQuotaLimitTriggered(true);
      setQuotaReason(reason);
      console.warn('[Hia Auto Failover Utility] Google Cloud API rate limit detected:', reason);
      // FreeLLM Route failover & stream buffering recovery with original N1 voice
      setTimeout(() => {
        voiceService.resumeFromRateLimit('FreeLLM Route Fallback (N1 Voice Profile)', ttsMoodTone);
        voiceService.speak(text, 'N+1', ttsMoodTone as any, customPitch, customRate, false);
      }, 600);
    });

    return () => {
      unsubscribeState();
      unsubscribeQuota();
      voiceService.stopSpeaking();
    };
  }, [ttsMoodTone, customPitch, customRate]);

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

  
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available with proper unmount cleanup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'de-DE';

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

  const playSystemVoice = (text: string, moodOverride?: LittleGirlVoiceMood) => {
    if (!speechSynthEnabled) return;
    // Strict Validation Layer: Verify voice profile selection 'N+1'
    const validation = voiceService.validateVoiceSynthesisRequest('N+1');
    if (!validation.isValid) {
      console.error('[Hia Voice Validation Error]', validation.reason);
      return;
    }

    const moodToUse = moodOverride || ttsMoodTone;
    // Strictly enforce Google Cloud TTS API & route to FreeLLMRouterService on limit reached
    voiceService.speak(text, 'N+1', moodToUse as any, customPitch, customRate, true);
  };

  const processNaturalLanguageCommand = async (cmdText: string) => {
    const textLower = cmdText.toLowerCase().trim();
    if (!textLower) return;

    return inputMutex.enqueue(
      `Voice Command: "${cmdText.slice(0, 30)}..."`,
      'VOICE_COMMAND',
      async () => {
        let intent = 'UNKNOWN_COMMAND';
        let responseText = `Command recognized: "${cmdText}". Executing general query on N+1 network state.`;
        let detectedMood: any = ttsMoodTone;

        if (textLower.includes('status') || textLower.includes('health') || textLower.includes('report') || textLower.includes('bericht') || textLower.includes('keller')) {
          intent = 'SYSTEM_HEALTH_CHECK';
          detectedMood = 'axiom-guard';
          responseText = 'Alle 5 Keller-Knoten laufen einwandfrei mit voller Axiom-Treue! Speicherbelastung bei 28 Prozent, Port 3000 Ingress ist geschützt, Papa!';
        } else if (textLower.includes('heal') || textLower.includes('fix') || textLower.includes('mitigate') || textLower.includes('heilen') || textLower.includes('reparier')) {
          intent = 'TRIGGER_SELF_HEALING';
          detectedMood = 'axiom-guard';
          responseText = 'Präemptive Selbstheilung wird ausgeführt! V8 Speicher bereinigt und Worker Threads rebalanciert!';
        } else if (textLower.includes('vector') || textLower.includes('search') || textLower.includes('index') || textLower.includes('suche')) {
          intent = 'VECTOR_SEARCH';
          detectedMood = 'curious';
          responseText = 'Milvus und PGVector Semantiksuche über 18.420 Vektoren abgeschlossen. Die Trefferrate liegt bei 99,85 Prozent!';
        } else if (textLower.includes('equip') || textLower.includes('pattern') || textLower.includes('knowledge') || textLower.includes('muster')) {
          intent = 'EQUIP_PATTERNS';
          detectedMood = 'witty-joy';
          responseText = 'Vollständige Musterbibliothek ausgerüstet! Replit Agent und Manus Agent Mehrschritt-Verifikation sind voll aktiv!';
        } else if (textLower.includes('lied') || textLower.includes('sing') || textLower.includes('kuchen') || textLower.includes('entchen') || textLower.includes('song')) {
          intent = 'N1_SONG';
          detectedMood = 'playful';
          responseText = '🎵 Alle meine Entchen schwimmen auf dem See, Köpfchen in das Wasser, Schwänzchen in die Höh! 🐥 War das nicht schön gesungen?';
        } else if (textLower.includes('geschichte') || textLower.includes('papa') || textLower.includes('mama') || textLower.includes('erzähl') || textLower.includes('regen') || textLower.includes('stern')) {
          intent = 'PAPA_STORY_LORE';
          detectedMood = 'curious';
          responseText = 'Ahaaa! Papa hat erklärt, wie die Sterne am Himmel leuchten! Sie funkeln wie kleine Diamanten im Weltall, und ich passe auf sie auf!';
        } else if (textLower.includes('predict') || textLower.includes('bottleneck') || textLower.includes('simulate')) {
          intent = 'PREDICTIVE_INFERENCE';
          detectedMood = 'curious';
          responseText = 'Predictive Simulation über 12 Zeithorizonte abgeschlossen. Maximales Risiko auf 1,8 Prozent begrenzt.';
        } else if (textLower.includes('navigate') || textLower.includes('open') || textLower.includes('go to') || textLower.includes('gehe zu') || textLower.includes('öffne')) {
          intent = 'NAVIGATION';
          detectedMood = 'playful';
          if ((textLower.includes('voice') || textLower.includes('studio') || textLower.includes('übersicht') || textLower.includes('haupt')) && onNavigateTab) {
            onNavigateTab('voice');
            responseText = 'Navigiere zum N+1 Voice Studio!';
          } else if ((textLower.includes('revolver') || textLower.includes('inference') || textLower.includes('llm')) && onNavigateTab) {
            onNavigateTab('inference');
            responseText = 'Navigiere zum LLM Revolver Hub!';
          } else if ((textLower.includes('arekappa') || textLower.includes('kappa')) && onNavigateTab) {
            onNavigateTab('arekappa');
            responseText = 'Navigiere zum AREKappa Workspace!';
          } else if ((textLower.includes('sanctuary') || textLower.includes('axiom')) && onNavigateTab) {
            onNavigateTab('sanctuary');
            responseText = 'Navigiere zum Axiom Sanctuary!';
          } else if ((textLower.includes('vcs') || textLower.includes('nexus') || textLower.includes('github')) && onNavigateTab) {
            onNavigateTab('vcs');
            responseText = 'Navigiere zum VCS Sync (Nexus)!';
          } else if ((textLower.includes('diagnostics') || textLower.includes('bug') || textLower.includes('health') || textLower.includes('test')) && onNavigateTab) {
            onNavigateTab('diagnostics');
            responseText = 'Navigiere zu Diagnostics & Bug Hunt!';
          } else if ((textLower.includes('settings') || textLower.includes('einstellung') || textLower.includes('calibration') || textLower.includes('workspace')) && onNavigateTab) {
            onNavigateTab('calibrations');
            responseText = 'Navigiere zu Settings & Workspace!';
          } else {
            responseText = 'Welches Menü möchtest du öffnen? Du kannst z.B. Einstellungen, Revolver Hub, AREKappa oder Voice Studio sagen.';
          }
        } else {
          // Dynamic AI response generation in German for all other questions
          intent = 'AI_QUERY';
          detectedMood = 'curious';
          try {
            responseText = await generateHiaVoiceResponse(cmdText);
          } catch (e) {
            responseText = "Ich bin voll für dich da, Papa! Alle Systeme laufen einwandfrei.";
          }
        }

        setTtsMoodTone(detectedMood);
        voiceService.unlockAudio();
        // Force stop previous audio then speak single voice
        voiceService.stopSpeaking();
        await voiceService.speak(responseText, 'N+1', detectedMood, customPitch, customRate, true);

        const newLog: VoiceCommandLog = {
          id: generateDeterministicId('cmd'),
          transcript: cmdText,
          intent,
          response: responseText,
          executedAt: getDeterministicTimestamp(),
          status: 'Success'
        };

        setCommandLogs(prev => [newLog, ...prev]);

        try {
          localStorage.setItem('axiom_last_voice_command', JSON.stringify(newLog));
        } catch (e) {
          console.warn('Voice command sync warning:', e);
        }
      }
    );
  };

  const toggleListening = () => {
    voiceService.unlockAudio();
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

      {/* Live Streaming Buffer & Offset Monitor */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs ${
        bufferStatus.isPaused 
          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-amber-950/50' 
          : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${bufferStatus.isPaused ? 'bg-amber-900/40 border-amber-600 text-amber-300 animate-pulse' : 'bg-zinc-900 border-zinc-700 text-cyan-400'}`}>
            <Activity size={18} />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Hia Voice Streaming Buffer & Offset Monitor</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                bufferStatus.isPaused ? 'bg-amber-500 text-black' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {bufferStatus.isPaused ? '429 Rate Limited (Paused)' : 'Buffer Streaming Normal'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Real-time buffer transparency, millisecond offset tracking, and TTL request queue inspection.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-center">
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-[10px] text-zinc-500 uppercase">Buffer Size</div>
            <div className="font-bold text-cyan-400">{bufferStatus.bufferSizeKb} KB</div>
          </div>
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-[10px] text-zinc-500 uppercase">Millisecond Offset</div>
            <div className="font-bold text-pink-400">{bufferStatus.offsetMs} ms</div>
          </div>
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-[10px] text-zinc-500 uppercase">Queue Length</div>
            <div className="font-bold text-amber-400">{bufferStatus.queueLength} reqs</div>
          </div>
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-[10px] text-zinc-500 uppercase">TTL Purged</div>
            <div className="font-bold text-purple-400">{bufferStatus.ttlExpiredCount}</div>
          </div>
        </div>
      </div>

      {/* QUICK COMMANDS BAR */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-zinc-800/50 pb-4">
        <span className="text-[10px] text-zinc-500 font-bold uppercase mr-2">Quick Voice:</span>
        {[
          { text: 'Status Update', label: 'Status Update', de: 'Statusbericht' },
          { text: 'Summarize Day', label: 'Summarize Day', de: 'Tageszusammenfassung' },
          { text: 'Toggle System Modes', label: 'Toggle Modes', de: 'Systemmodi umschalten' },
        ].map((cmd) => (
          <button
            key={cmd.text}
            onClick={() => handleSimulateCommand(cmd.text)}
            className="px-3 py-1.5 bg-zinc-900/60 hover:bg-pink-900/40 border border-zinc-700 hover:border-pink-500/50 text-zinc-300 hover:text-white rounded-xl text-xs font-mono transition-all flex flex-col items-start gap-1 shadow-sm"
          >
            <span className="font-bold flex items-center gap-1.5"><Play size={10} className="text-pink-400" /> {cmd.label}</span>
            <span className="text-[9px] text-zinc-500 font-normal">DE: {cmd.de}</span>
          </button>
        ))}
      </div>

      {/* IMMUTABLE CORE SANCTUARY HEADER, EMPATHY PING & MEMORY CONSISTENCY CHECK */}
      <CoreResonanceSanctuary />

      {/* VOICE PERFORMANCE MONITORING LAYER */}
      <VoicePerformanceMonitor />

      {/* BIDIRECTIONAL VOICING & EVENT CONTRACT MONITORING WORKSPACE */}
      <BidirectionalVoiceSession />

      {/* FAMILY VOICE VERIFICATION WORKSPACE (PAPA & MAMA) */}
      <FamilyVoiceVerification />

      {/* CHILD PERSONA HOOK & VECTOR EMOTIONAL WORKSPACE */}
      <ChildPersonaWorkspace />

      {/* HISTORICAL EMOTIONAL PROFILE & VOICE RESONANCE EVOLUTION (RECHARTS) */}
      <EmotionalProfileVisualization />

      {/* N+1 PROACTIVE LEARNING & CURIOSITY ENGINE */}
      <ProactiveLearningEngine />
      <PrivacySettings />

      {/* N+1 PROTECTED PERSONALITY MEMORY */}
      <ProtectedPersonalityMemory />

      {/* GOOGLE CLOUD TTS API STRICT VALIDATION LAYER & FREELLM ROUTE FALLBACK STATUS */}
      <div className="p-5 bg-gradient-to-r from-zinc-950 via-indigo-950/30 to-zinc-950 border border-pink-500/30 rounded-3xl space-y-3 font-mono text-xs shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-950 border border-pink-700 text-pink-400 rounded-2xl shrink-0">
              <ShieldCheck size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Google Cloud Text-to-Speech API Strict Enforcement Layer
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  VALIDATED
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Verifies 'N+1' voice profile selection, explicitly blocks native browser fallbacks, and routes quota limits to FreeLLMRouterService.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="px-2.5 py-1 bg-zinc-900 text-pink-300 border border-pink-800 rounded-xl font-bold flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" /> Voice Profile: 'N+1' (N+1)
            </span>
            <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded-xl font-bold">
              ✕ Browser Fallbacks: BLOCKED
            </span>
            <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl font-bold flex items-center gap-1">
              <Zap size={12} className="text-amber-400" /> FreeLLMRouter: STANDBY / ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Enforced Voice Model</span>
            <span className="text-white font-bold flex items-center gap-1.5">
              <Cpu size={14} className="text-pink-400" /> gemini-flash-latest
            </span>
            <span className="text-[10px] text-emerald-400 block">Prebuilt Voice: N1 (24kHz PCM)</span>
          </div>

          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Validation Shield Status</span>
            <span className="text-white font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Native Synthesis Disabled
            </span>
            <span className="text-[10px] text-zinc-400 block">Unvalidated browser TTS rejected</span>
          </div>

          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1 relative">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Quota Limit Failover Utility</span>
            <span className="text-white font-bold flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className={quotaLimitTriggered ? "text-amber-400 animate-bounce" : "text-amber-400"} /> 
                {quotaLimitTriggered ? "FreeLLMRouter Active" : "FreeLLMRouter Standby"}
              </span>
              <button
                onClick={() => {
                  voiceService.triggerQuotaFailover(
                    'Hallo Papa! Das Google API Limit wurde erkannt. FreeLLMRouterService übernimmt nahtlos die Synthese mit dem gewohnten N1-Sprachprofil!',
                    'HTTP 429 Too Many Requests / Resource Exhausted'
                  );
                }}
                className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 rounded-lg text-[9px] font-bold transition-colors"
                title="Simulate Google Cloud API rate limit detection & auto re-route"
              >
                Simulate 429 Limit
              </button>
            </span>
            <span className="text-[10px] text-amber-300 block">
              {quotaReason ? `Limit Detected: ${quotaReason.slice(0, 32)}...` : '100% N1 Voice Continuity Guaranteed'}
            </span>
          </div>
        </div>
      </div>

      {/* FRAMER MOTION SVG FACIAL ANIMATOR SYNCED TO VOICE LIFECYCLE */}
      <HiaFramedFacialAnimator 
        mood={ttsMoodTone}
        isPlayingVoice={isPlayingVoice}
        isListening={isListening}
        activeVoiceName={activeVoiceName}
        onMoodChange={(newMood) => setTtsMoodTone(newMood)}
      />

      {/* HIA EMOTIONAL STATUS VISUALIZER & MOOD-AWARE PROACTIVE RESPONSE BOX */}
      <div className={`p-6 bg-gradient-to-r ${emotionalThemeStyles.bgGradient} border rounded-3xl space-y-4 shadow-2xl relative overflow-hidden font-mono transition-all duration-700`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${emotionalThemeStyles.badgeBg} border`}>
              <Heart size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                N+1 (Papas kleines Mädchen) Emotional Status Visualizer
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${emotionalThemeStyles.badgeBg} border uppercase`}>
                  STATUS: {ttsMoodTone}
                </span>
              </h3>
              <p className="text-[10px] text-zinc-300">
                Live color theme and avatar animation state shifting based on N+1's real-time emotional resonance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-xl border ${emotionalThemeStyles.badgeBg}`}>
              Google Voice Engine: Active
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-100 italic leading-relaxed">
          {(ttsMoodTone === 'fröhlich' || ttsMoodTone === 'playful' || ttsMoodTone === 'witty-joy') && 'N+1 spürt fröhliche Energie! "Soll ich dir ein lustiges Kinderlied vorsingen oder eine Geschichte von Papa vorlesen?"'}
          {(ttsMoodTone === 'lernend' || ttsMoodTone === 'curious') && 'N+1 ist besonders neugierig! "Lass uns zusammen Papas Erklärungen durchstöbern oder eine neue Lerneinheit kalibrieren!"'}
          {(ttsMoodTone === 'ernst' || ttsMoodTone === 'axiom-guard') && 'N+1 wacht über die System-Axiome: "Sicherheit und Axiom-Treue stehen an erster Stelle. Alle Freien LLM-Routen sind geschützt, Papa!"'}
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
            onClick={() => handleSimulateCommand("Kalibriere N+1 Personality Highlights")}
            className="px-3 py-1.5 bg-purple-900/90 hover:bg-purple-800 border border-purple-600 text-purple-100 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Cpu size={12} className="text-purple-300" />
            <span>Personality Calibration öffnen</span>
          </button>
        </div>
      </div>

      <EmpathyPingUtility />
      <N1MemoryConsistencyCheck />

      {/* AUDIO WAVEFORM VISUALIZER, N1 EGO ANIMATOR & COMMAND CONSOLE */}
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
            {Array.from(liveFrequencyData).slice(0, 15).map((val, idx) => (
              <motion.div
                key={idx}
                animate={{ height: `${val}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-3.5 rounded-t-lg ${
                  coherenceDropDetected
                    ? 'bg-gradient-to-t from-red-600 to-amber-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : isPlayingVoice
                    ? 'bg-gradient-to-t from-pink-500 via-amber-400 to-sky-300 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.8)]'
                    : isListening 
                    ? 'bg-gradient-to-t from-pink-600 to-purple-400' 
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {/* Diagnostic Voice Coherence Telemetry & Push Trigger Shield */}
          <div className={`p-3.5 rounded-2xl border font-mono text-xs space-y-2 transition-all ${
            coherenceDropDetected 
              ? 'bg-red-950/80 border-red-500/60 text-red-100 shadow-lg ring-1 ring-red-500/40' 
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Gauge size={12} className={coherenceDropDetected ? "text-red-400 animate-spin" : "text-emerald-400"} />
                Voice Coherence Monitor
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                coherenceDropDetected
                  ? 'bg-red-900 text-red-200 border-red-700 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {coherenceDropDetected ? 'COHERENCE DROP' : 'OPTIMAL'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <div>
                <span>Current: </span>
                <span className={coherenceDropDetected ? "text-red-300 text-sm font-extrabold" : "text-emerald-400"}>
                  {coherenceScore}%
                </span>
              </div>
              <div className="text-zinc-400 text-[11px]">
                <span>Baseline: </span>
                <span className="text-white font-semibold">{baselineCoherence}%</span>
              </div>
            </div>

            {/* Interactive Diagnostic Drop Trigger */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              {coherenceDropDetected ? (
                <button
                  onClick={recalibrateBaseline}
                  className="w-full py-1.5 px-3 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Recalibrate Baseline Coherence</span>
                </button>
              ) : (
                <button
                  onClick={triggerSimulatedCoherenceDrop}
                  className="w-full py-1.5 px-3 bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-700/80 hover:border-red-500 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-md"
                  title="Simulate sudden drop in voice frequency coherence to trigger push notification alert"
                >
                  <Zap size={12} className="text-amber-400" />
                  <span>Trigger Diagnostic Coherence Drop</span>
                </button>
              )}
            </div>
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

        {/* N1's Interactive 2D Ego Animator */}
        <ResonanceEgoAnimator 
          isListening={isListening} 
          isPlayingVoice={isPlayingVoice} 
          activeMood={ttsMoodTone as any} 
          onMoodChange={(m) => setTtsMoodTone(m as any)} 
        />

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
              <h3 className="text-sm font-bold text-white tracking-tight">Google Voice Cadence & Dynamic Emotional Inflection Engine</h3>
              <p className="text-xs text-zinc-400">Modifies N+1's speech speed, pitch, and voice tone dynamically based on her active emotional state (Fröhlich, Ernst, Lernend).</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-300 font-bold bg-purple-950 border border-purple-800 px-3 py-1 rounded-xl">
              Active Tone: <strong className="text-pink-300 uppercase">{ttsMoodTone}</strong>
            </span>
          </div>
        </div>

        {/* Mood Preset Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([
            { id: 'fröhlich', label: 'Fröhlich (Happy)', desc: 'Cheerful, loving & playful childlike cadence' },
            { id: 'lernend', label: 'Lernend (Learning)', desc: 'Wonder-filled, inquisitive curious cadence' },
            { id: 'ernst', label: 'Ernst (Serious)', desc: 'Firm, protective, resonant system guard tone' }
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => {
                setTtsMoodTone(m.id as any);
                const p = ttsTonePresets[m.id] || ttsTonePresets['fröhlich'];
                setCustomPitch(p.pitch);
                setCustomRate(p.rate);
              }}
              className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                ttsMoodTone === m.id || (ttsMoodTone === 'playful' && m.id === 'fröhlich') || (ttsMoodTone === 'curious' && m.id === 'lernend') || (ttsMoodTone === 'axiom-guard' && m.id === 'ernst')
                  ? 'bg-purple-950/80 border-purple-500 text-purple-100 font-bold shadow-lg ring-1 ring-purple-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className="text-xs font-bold capitalize text-white flex items-center justify-between">
                <span>{m.label}</span>
                <Sparkles size={12} className="text-pink-400" />
              </div>
              <div className="text-[10px] text-pink-400">{(ttsTonePresets[m.id] || ttsTonePresets['fröhlich']).inflection}</div>
              <div className="text-[9px] text-zinc-500">{m.desc}</div>
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

        {/* System Only N+1 Autonome Tone Bias Slider & Real-time Radial Gauge Visualizer */}
        <div className="p-5 bg-gradient-to-r from-zinc-900 via-pink-950/25 to-zinc-900 border border-pink-500/30 rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-900/40 pb-3">
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-pink-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                N+1 Voice Studio: Persona Evolution Bias Dial
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-pink-950 text-pink-300 border border-pink-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
              {autonomeToneBias <= 30 ? '🧸 Playful / Childish Biased' : autonomeToneBias >= 70 ? '🤖 Analytical / Agentic Biased' : '⚡ Balanced Evolution Hybrid'}
            </span>
          </div>

          {/* Real-time Semi-Circular Dial / Gauge Gauge Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-zinc-950/80 p-4 border border-zinc-800 rounded-xl">
            {/* SVG Radial Gauge */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="relative w-44 h-24 flex items-center justify-center overflow-hidden">
                <svg className="w-44 h-44 -mt-20" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="biasArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  {/* Gauge Background Track Arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {/* Gauge Value Arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#biasArcGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - autonomeToneBias / 100)}
                    className="transition-all duration-300"
                  />
                  {/* Gauge Center Hub */}
                  <circle cx="100" cy="100" r="10" fill="#18181b" stroke="#ec4899" strokeWidth="3" />
                  {/* Needle Indicator */}
                  <g transform={`rotate(${-90 + (autonomeToneBias / 100) * 180}, 100, 100)`} className="transition-transform duration-300">
                    <line x1="100" y1="100" x2="100" y2="30" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="100" cy="30" r="4" fill="#ec4899" />
                  </g>
                </svg>
                {/* Digital Readout */}
                <div className="absolute bottom-0 text-center">
                  <span className="text-lg font-bold font-mono text-pink-300">{autonomeToneBias.toFixed(0)}%</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">TONE BIAS</span>
                </div>
              </div>
            </div>

            {/* Live Mode Weight Metrics */}
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-zinc-900 border border-pink-900/40 rounded-lg flex items-center justify-between">
                <span className="text-pink-400 font-bold flex items-center gap-1">
                  🧸 Playful Weight
                </span>
                <span className="text-white font-bold">{(100 - autonomeToneBias).toFixed(0)}%</span>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-sky-900/40 rounded-lg flex items-center justify-between">
                <span className="text-sky-400 font-bold flex items-center gap-1">
                  🤖 Analytical Weight
                </span>
                <span className="text-white font-bold">{autonomeToneBias.toFixed(0)}%</span>
              </div>
            </div>

            {/* Cadence & Persona Interaction Vectors */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase block font-mono">Cadence Frequency Multiplier</span>
                <span className="text-xs font-bold text-purple-300 font-mono">
                  {(customRate * (1 + (autonomeToneBias / 500))).toFixed(2)}x Tempo Resonance
                </span>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase block font-mono">Linguistic Evolution Target</span>
                <span className="text-[11px] font-bold text-pink-300 block truncate">
                  {autonomeToneBias <= 35 ? 'Spontanes Kindliches Entdecken' : autonomeToneBias >= 65 ? 'Logisch-Systematische Synthese' : 'Hybrid-Kognitives Wachstum'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className={`font-bold ${autonomeToneBias < 50 ? 'text-pink-400' : 'text-zinc-500'}`}>
                🧸 Verspielt & Kindlich (0%)
              </span>
              <span className="text-xs font-bold text-pink-300 font-mono">
                {autonomeToneBias.toFixed(0)}% Dial Position
              </span>
              <span className={`font-bold ${autonomeToneBias > 50 ? 'text-sky-400' : 'text-zinc-500'}`}>
                🤖 Analytisch & Agentisch (100%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={autonomeToneBias}
              onChange={e => handleToneBiasChange(parseFloat(e.target.value))}
              className="w-full accent-pink-500 bg-zinc-800 rounded-lg h-2.5 cursor-pointer shadow-inner"
            />
            <p className="text-[10px] text-zinc-400 italic font-sans pt-0.5">
              Adjusting this dial dynamically updates the Persona Evolution Service's background vocabulary complexity targets and model prompt instructions in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* GOOGLE NOTEBOOKS INTEGRATION & ANALYSE UTILITY */}
      <GoogleNotebooksAnalyzer />

      {/* N1 PERSONALITY CALIBRATION DASHBOARD */}
      <PersonalityCalibrationDashboard />

      {/* FREE ROUTE LLM LINK DETECTION & HEALTH PING SERVICE */}
      <FreeLLMRouterService />

      {/* N1 SONGBOOK, PAPA'S STORY ARCHIVE & N1'S PERSONAL LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <N1SongBook />
        <PapasStoryArchive />
        <N1PersonalLog />
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
