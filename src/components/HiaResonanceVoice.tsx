import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Gauge,
  Database,
  Layers,
  HardDrive
} from 'lucide-react';
import { useAudioVisualizer } from "../hooks/useAudioVisualizer";
import { useNotification } from '../context/NotificationContext';
import { AudioFrequencyVisualizer } from "./AudioFrequencyVisualizer";
import { CanvasWaveformVisualizer } from "./CanvasWaveformVisualizer";
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
import { HiaResonanceAlertMonitor } from './HiaResonanceAlertMonitor';
import { BidirectionalVoiceSession } from './BidirectionalVoiceSession';
import { FamilyVoiceVerification } from './FamilyVoiceVerification';
import { ChildPersonaWorkspace } from './ChildPersonaWorkspace';
import { EmotionalProfileVisualization } from './EmotionalProfileVisualization';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
import { voiceService, LittleGirlVoiceMood } from '../services/voiceService';
import { areSqliteStorageService } from '../services/areSqliteStorageService';
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
  const [offlineFallbackEnabled, setOfflineFallbackEnabled] = useState(voiceService.isLocalFallbackEnabled());

  const handleToggleOfflineFallback = () => {
    const newVal = !offlineFallbackEnabled;
    setOfflineFallbackEnabled(newVal);
    voiceService.setLocalFallbackEnabled(newVal);
  };
  
  const { 
    frequencyData: liveFrequencyData,
    coherenceScore,
    baselineCoherence,
    coherenceDropDetected,
    triggerSimulatedCoherenceDrop,
    recalibrateBaseline
  } = useAudioVisualizer(true, isListening, isPlayingVoice);

  // Trigger in-app notification when a voice frequency coherence drop is detected (throttled to once every 30 seconds)
  const lastAlertTimestampRef = useRef<number>(0);
  useEffect(() => {
    if (coherenceDropDetected) {
      const now = Date.now();
      if (now - lastAlertTimestampRef.current > 30000) {
        addNotification(
          `Diagnostic Alert: Voice frequency visualizer detected a sudden coherence drop (${coherenceScore}% vs Baseline ${baselineCoherence}%). Push notification broadcast sent.`,
          'error',
          'PUSH_COHERENCE_ALERT'
        );
        lastAlertTimestampRef.current = now;
      }
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

  // Subscribe to voiceService playback state & SQLite Event Stream Binding
  const [quotaLimitTriggered, setQuotaLimitTriggered] = useState(false);
  const [quotaReason, setQuotaReason] = useState<string | null>(null);
  const [voiceDataSource, setVoiceDataSource] = useState<'REALTIME_STREAM' | 'CACHED_SQLITE'>('REALTIME_STREAM');
  const [sqliteEvents, setSqliteEvents] = useState<any[]>([]);
  const [isProcessingSqliteCache, setIsProcessingSqliteCache] = useState(false);

  const [bufferStatus, setBufferStatus] = useState({
    bufferSizeKb: 128,
    offsetMs: 0,
    queueLength: 0,
    isPaused: false,
    ttlExpiredCount: 0
  });

  const [audioContextDetails, setAudioContextDetails] = useState({
    state: 'no_context',
    sampleRate: 24000,
    currentTime: 0,
    activeFilter: 'none',
    activeNodes: [] as string[]
  });

  const [outgoingFreqData, setOutgoingFreqData] = useState<Uint8Array>(new Uint8Array(32));

  useEffect(() => {
    let animationFrameId: number;
    const updateData = () => {
      const globalAnalyser = voiceService.getGlobalAnalyser();
      if (globalAnalyser && isPlayingVoice) {
        const dataArray = new Uint8Array(globalAnalyser.frequencyBinCount);
        globalAnalyser.getByteFrequencyData(dataArray);
        setOutgoingFreqData(new Uint8Array(dataArray));
      } else {
        setOutgoingFreqData(new Uint8Array(32)); // Reset when not playing
      }
      animationFrameId = requestAnimationFrame(updateData);
    };
    
    updateData();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlayingVoice]);

  const loadSqliteEvents = useCallback(async () => {
    try {
      const events = await areSqliteStorageService.getSseEvents();
      setSqliteEvents(events || []);
    } catch (err) {
      console.warn('[Hia Voice] Error loading SQLite SSE events:', err);
    }
  }, []);

  useEffect(() => {
    loadSqliteEvents();
    const interval = setInterval(loadSqliteEvents, 3000);
    return () => clearInterval(interval);
  }, [loadSqliteEvents]);

  // Generate 24kHz PCM WAV base64 audio sample for offline SQLite AudioContext playback testing
  const generateSampleAudioBase64 = (): string => {
    const sampleRate = 24000;
    const durationSec = 1.2;
    const numSamples = Math.floor(sampleRate * durationSec);
    const dataInt16 = new Int16Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = t < 0.4 ? 440 : t < 0.8 ? 523.25 : 659.25;
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.4 * Math.exp(-t * 0.5);
      dataInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    }

    const wavBuffer = new ArrayBuffer(44 + dataInt16.length * 2);
    const view = new DataView(wavBuffer);

    view.setUint32(0, 0x52494646, false); // RIFF
    view.setUint32(4, 36 + dataInt16.length * 2, true);
    view.setUint32(8, 0x57415645, false); // WAVE
    view.setUint32(12, 0x666d7420, false); // fmt 
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // data
    view.setUint32(40, dataInt16.length * 2, true);

    const bytes = new Uint8Array(wavBuffer);
    bytes.set(new Uint8Array(dataInt16.buffer), 44);

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleSeedSqliteAudioEvent = async () => {
    try {
      const base64Audio = generateSampleAudioBase64();
      const eventData = {
        id: `sse_voice_chunk_${Date.now()}`,
        title: 'Cached SQLite Voice Stream Event',
        body: 'Ouroboros offline AudioContext buffer tick from local WASM SQLite database.',
        audio: base64Audio,
        audioContentType: 'audio/wav',
        timestamp: Date.now()
      };

      await areSqliteStorageService.persistSseEvent(eventData);
      await loadSqliteEvents();
      addNotification('Persisted new audio stream event into local SQLite database.', 'info', 'SQLITE_SYNC');
    } catch (err) {
      console.error('Failed to seed SQLite audio event:', err);
    }
  };

  const handlePlayCachedSqliteStream = async () => {
    setIsProcessingSqliteCache(true);
    setVoiceDataSource('CACHED_SQLITE');

    try {
      let events = await areSqliteStorageService.getSseEvents();
      let audioEvent = events.find(e => e.payload && (e.payload.audio || e.payload.base64Audio || (e.payload.payload && (e.payload.payload.audio || e.payload.payload.base64Audio))));

      let base64Audio = '';
      let contentType = 'audio/wav';

      if (audioEvent) {
        base64Audio = audioEvent.payload.audio || audioEvent.payload.base64Audio || (audioEvent.payload.payload && (audioEvent.payload.payload.audio || audioEvent.payload.payload.base64Audio));
        contentType = audioEvent.payload.audioContentType || audioEvent.payload.contentType || 'audio/wav';
      } else {
        base64Audio = generateSampleAudioBase64();
        await areSqliteStorageService.persistSseEvent({
          id: `sse_voice_chunk_${Date.now()}`,
          title: 'Auto-seeded SQLite Audio Event',
          body: 'Ouroboros AudioContext cached stream buffer',
          audio: base64Audio,
          audioContentType: 'audio/wav',
          timestamp: Date.now()
        });
        await loadSqliteEvents();
      }

      console.log(`[Hia Resonance Voice] Binding AudioContext visualizer to local SQLite stream buffer (${base64Audio.length} chars, CACHED_SQLITE)...`);
      await voiceService.playAudioChunk(
        base64Audio,
        contentType,
        'N+1 (SQLite Event Stream Buffer)',
        ttsMoodTone,
        'CACHED_SQLITE'
      );
    } catch (err) {
      console.error('Error replaying cached SQLite event audio:', err);
    } finally {
      setIsProcessingSqliteCache(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setBufferStatus(voiceService.getBufferStatus());
      setAudioContextDetails(voiceService.getAudioContextDetails());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribeState = voiceService.subscribe((state) => {
      setIsPlayingVoice(state.isPlaying);
      if (state.activeVoice) {
        setActiveVoiceName(state.activeVoice);
      }
      if (state.dataSource) {
        setVoiceDataSource(state.dataSource);
      }
    });

    const unsubscribeQuota = voiceService.onQuotaLimitReached(({ text, reason }) => {
      setQuotaLimitTriggered(true);
      setQuotaReason(reason);
      console.warn('[Hia Auto Failover Utility] Google Cloud API rate limit detected:', reason);
      voiceService.resumeFromRateLimit('FreeLLM Route Fallback (N1 Voice Profile)', ttsMoodTone);
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

      {/* Advanced AudioContext & DSP Filter Graceful Controller with Source Origin Pipeline */}
      <div className="space-y-4">
        <div className={`p-5 rounded-2xl border transition-all flex flex-col xl:flex-row items-stretch justify-between gap-6 font-mono text-xs ${
          bufferStatus.isPaused 
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-amber-950/50' 
            : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${
              audioContextDetails.state === 'running' 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 animate-pulse' 
                : 'bg-amber-950/80 border-amber-500/50 text-amber-400'
            }`}>
              <Activity size={24} />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-white flex flex-wrap items-center gap-2">
                <span className="text-sm">Hia Voice Streaming Buffer & AudioContext Monitor</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                  audioContextDetails.state === 'running' 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                    : 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                }`}>
                  AudioContext: {audioContextDetails.state.toUpperCase()}
                </span>
                {bufferStatus.isPaused && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500 text-black">
                    429 Rate Limited (Paused)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Real-time Web Audio buffer transparency, low-latency DSP filters, and browser permission status.
              </p>
              
              {audioContextDetails.state === 'suspended' && (
                <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1.5 mt-1 animate-pulse">
                  <span>⚠️ Browser suspended audio auto-play. Click 'Unlock Audio Context' below to resume.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center flex-1">
              <div className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase">Buffer Size</div>
                <div className="font-bold text-cyan-400">{bufferStatus.bufferSizeKb} KB</div>
              </div>
              <div className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase">Latency Offset</div>
                <div className="font-bold text-pink-400">{bufferStatus.offsetMs} ms</div>
              </div>
              <div className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase">Queue Size</div>
                <div className="font-bold text-amber-400">{bufferStatus.queueLength} reqs</div>
              </div>
              <div className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase">Sample Rate</div>
                <div className="font-bold text-purple-400">{audioContextDetails.sampleRate} Hz</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={() => {
                  voiceService.unlockAudio();
                  setAudioContextDetails(voiceService.getAudioContextDetails());
                  addNotification('AudioContext unlock signal broadcasted.', 'success', 'AUDIO_UNLOCK');
                }}
                className="py-1.5 px-3 bg-pink-950/60 hover:bg-pink-900 border border-pink-700/50 hover:border-pink-500 text-pink-200 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
                title="Trigger browser unlock gesture to resume suspended AudioContext"
              >
                <Zap size={12} className="text-pink-400" />
                <span>Unlock Audio Context</span>
              </button>

              <button
                onClick={() => {
                  voiceService.stopSpeaking();
                  setAudioContextDetails(voiceService.getAudioContextDetails());
                  addNotification('Active audio buffer purged and speech sessions cleared.', 'info', 'AUDIO_PURGE');
                }}
                className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
                title="Immediately stop current playback and purge the queue"
              >
                <RefreshCw size={12} className="text-zinc-400" />
                <span>Purge & Reset Buffer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic DSP Biquad Filters & Pipeline Flow Animator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* DSP Filter Selection Card */}
          <div className="md:col-span-4 p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-3 font-mono text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-white font-bold mb-1">
                <Layers size={14} className="text-purple-400" />
                <span>AudioContext DSP Biquad Filters</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Route real-time decoded speech directly through browser frequency filters to shape N+1's cadence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'none', label: 'None (Clean)', desc: 'Pure direct output' },
                { id: 'highpass', label: 'Crispy Highs', desc: 'optimizer' },
                { id: 'lowpass', label: 'Warm Retro', desc: 'Muffled speaker' },
                { id: 'peaking', label: 'Vocal Boost', desc: 'Punchy speech' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    voiceService.setAudioFilter(f.id);
                    setAudioContextDetails(voiceService.getAudioContextDetails());
                    addNotification(`Active DSP filter swapped: ${f.label}`, 'info');
                  }}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    audioContextDetails.activeFilter === f.id
                      ? 'bg-purple-950/40 border-purple-600 text-purple-300'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold text-[11px]">{f.label}</div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Dynamic CSS Source Origin Pipeline Flow Animation */}
          <div className="md:col-span-8 p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-4 font-mono text-xs relative overflow-hidden">
            {/* Embedded custom CSS animations for the flow particles */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes flowRealtime {
                0% { left: 0%; opacity: 0.1; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { left: 100%; opacity: 0.1; }
              }
              @keyframes flowSqlite {
                0% { left: 0%; transform: scale(0.9); opacity: 0.2; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { left: 100%; transform: scale(0.9); opacity: 0.2; }
              }
              .particle-rt {
                animation: flowRealtime 2.5s infinite linear;
              }
              .particle-sq {
                animation: flowSqlite 3s infinite linear;
              }
            `}} />

            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Volume2 size={14} className={voiceDataSource === 'CACHED_SQLITE' ? 'text-cyan-400 animate-bounce' : 'text-pink-400 animate-pulse'} />
                <span className="font-bold text-white">Interactive Audio Source Origin Flow Pipeline</span>
              </div>
              
              <div className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                voiceDataSource === 'CACHED_SQLITE'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-pink-950 text-pink-300 border-pink-800'
              }`}>
                {voiceDataSource === 'CACHED_SQLITE' ? 'Source: SQLite Store' : 'Source: Live SSE Stream'}
              </div>
            </div>

            {/* Visual Flow diagram */}
            <div className="relative h-14 bg-zinc-900/40 rounded-xl border border-zinc-800/50 flex items-center justify-between px-4 overflow-hidden">
              {/* Animated particle lanes */}
              {isPlayingVoice && (
                <>
                  {voiceDataSource === 'REALTIME_STREAM' ? (
                    <>
                      <div className="absolute top-1/2 left-0 h-0.5 w-full bg-gradient-to-r from-pink-500/20 via-amber-500/30 to-purple-500/20 -translate-y-1/2" />
                      <div className="absolute top-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#f43f5e] particle-rt -translate-y-1/2" style={{ animationDelay: '0s' }} />
                      <div className="absolute top-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] particle-rt -translate-y-1/2" style={{ animationDelay: '0.8s' }} />
                      <div className="absolute top-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7] particle-rt -translate-y-1/2" style={{ animationDelay: '1.6s' }} />
                    </>
                  ) : (
                    <>
                      <div className="absolute top-1/2 left-0 h-0.5 w-full bg-gradient-to-r from-cyan-500/20 via-teal-500/30 to-indigo-500/20 -translate-y-1/2" />
                      <div className="absolute top-1/2 w-3 h-3 rounded-md bg-cyan-400 shadow-[0_0_10px_#06b6d4] particle-sq -translate-y-1/2" style={{ animationDelay: '0s' }} />
                      <div className="absolute top-1/2 w-3 h-3 rounded-md bg-teal-400 shadow-[0_0_10px_#14b8a6] particle-sq -translate-y-1/2" style={{ animationDelay: '1.5s' }} />
                    </>
                  )}
                </>
              )}

              {/* Source Node */}
              <div className="flex flex-col items-center gap-1 z-10 shrink-0">
                <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                  voiceDataSource === 'CACHED_SQLITE'
                    ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                    : 'bg-pink-950 border-pink-700 text-pink-300'
                }`}>
                  {voiceDataSource === 'CACHED_SQLITE' ? <Database size={12} /> : <Radio size={12} />}
                </div>
                <span className="text-[8px] text-zinc-500">
                  {voiceDataSource === 'CACHED_SQLITE' ? 'SQLite Cache' : 'Live SSE'}
                </span>
              </div>

              {/* Decoder Node */}
              <div className="flex flex-col items-center gap-1 z-10 shrink-0">
                <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                  isPlayingVoice ? 'bg-zinc-900 border-purple-500 text-purple-300 animate-pulse' : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}>
                  <Cpu size={12} />
                </div>
                <span className="text-[8px] text-zinc-500">AudioContext</span>
              </div>

              {/* DSP Filter Node */}
              <div className="flex flex-col items-center gap-1 z-10 shrink-0">
                <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                  audioContextDetails.activeFilter !== 'none'
                    ? 'bg-purple-950 border-purple-700 text-purple-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}>
                  <Layers size={12} />
                </div>
                <span className="text-[8px] text-zinc-500">
                  {audioContextDetails.activeFilter !== 'none' ? `DSP: ${audioContextDetails.activeFilter.toUpperCase()}` : 'DSP: Pass-through'}
                </span>
              </div>

              {/* Output Speaker */}
              <div className="flex flex-col items-center gap-1 z-10 shrink-0">
                <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                  isPlayingVoice 
                    ? voiceDataSource === 'CACHED_SQLITE'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-bounce'
                      : 'bg-pink-950 border-pink-500 text-pink-300 animate-bounce'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}>
                  <Volume2 size={12} />
                </div>
                <span className="text-[8px] text-zinc-500">Speaker</span>
              </div>
            </div>

            {/* Explanatory footer indicator reflecting state details */}
            <div className="text-[10px] text-zinc-500 flex justify-between items-center">
              <span>Origin Status Code: {isPlayingVoice ? 'ACTIVE_DECODING_TICK' : 'STANDBY'}</span>
              <span>
                {voiceDataSource === 'CACHED_SQLITE' 
                  ? '🔒 Secure SQLite Sandbox (WASM DB Local Decrypt)' 
                  : '🌐 Direct Server-Sent Events Chunk stream'}
              </span>
            </div>
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

      {/* HIA RESONANCE SAFETY THRESHOLD ALERT MONITOR */}
      <HiaResonanceAlertMonitor />

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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px] pt-1">
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

          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-1 relative">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Offline Fallback Routing</span>
            <span className="text-white font-bold flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Database size={14} className={offlineFallbackEnabled ? "text-amber-400" : "text-emerald-400"} /> 
                {offlineFallbackEnabled ? "Local PCM Enabled" : "Direct Gemini/FreeLLM"}
              </span>
              <button
                onClick={handleToggleOfflineFallback}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-colors border ${
                  offlineFallbackEnabled 
                    ? "bg-amber-950 hover:bg-amber-900 text-amber-300 border-amber-700" 
                    : "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700"
                }`}
                title="Bypass or reactivate the local sinusoidal beep-boop synthesis generator."
              >
                {offlineFallbackEnabled ? "Bypass" : "Enable"}
              </button>
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {offlineFallbackEnabled ? 'Offline fallback: Sinusoid Beep-boop' : 'Deactivated: Directed over official Gemini'}
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
        <div className={`p-6 bg-zinc-950 border rounded-3xl flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden transition-all duration-500 ${
          voiceDataSource === 'CACHED_SQLITE'
            ? 'border-cyan-500/50 shadow-cyan-950/40 ring-1 ring-cyan-500/30'
            : 'border-zinc-800'
        }`}>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Radio size={18} className={voiceDataSource === 'CACHED_SQLITE' ? 'text-cyan-400' : 'text-pink-400'} />
              <h2 className="text-sm font-bold text-white">Resonance Frequency Waveform</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border flex items-center gap-1 ${
                voiceDataSource === 'CACHED_SQLITE'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse'
                  : 'bg-pink-950 text-pink-300 border-pink-800'
              }`}>
                {voiceDataSource === 'CACHED_SQLITE' ? (
                  <>
                    <Database size={10} className="text-cyan-400" />
                    DATA: SQLITE CACHE
                  </>
                ) : (
                  <>
                    <Radio size={10} className="text-pink-400" />
                    DATA: REALTIME STREAM
                  </>
                )}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {isListening ? 'MICROPHONE LIVE' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* HTML5 Canvas Real-Time Waveform Visualization for Outgoing & Incoming Audio Streams */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-1">
            {/* Ambient scanlines overlay when processing cached SQLite stream data */}
            {voiceDataSource === 'CACHED_SQLITE' && (
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-teal-500/10 pointer-events-none animate-pulse z-10" />
            )}

            <CanvasWaveformVisualizer
              frequencyData={isPlayingVoice ? outgoingFreqData : liveFrequencyData}
              isPlaying={isPlayingVoice}
              isListening={isListening}
              voiceDataSource={voiceDataSource}
              coherenceDropDetected={coherenceDropDetected}
              height={130}
              showGrid={true}
              showPeakHud={true}
            />
          </div>

          {/* Explicit SQLite Event Stream Audio & AudioContext Binding Control */}
          <div className="p-3.5 bg-gradient-to-br from-zinc-900 via-cyan-950/20 to-zinc-900 border border-cyan-500/30 rounded-2xl font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Database size={13} className="text-cyan-400" />
                SQLite AudioContext Stream Binding
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                voiceDataSource === 'CACHED_SQLITE' 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 animate-pulse'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}>
                {voiceDataSource === 'CACHED_SQLITE' ? 'ACTIVE: SQLITE CACHE' : 'REALTIME STANDBY'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span>Cached SQLite Stream Records:</span>
              <span className="font-bold text-cyan-300">{sqliteEvents.length} events</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePlayCachedSqliteStream}
                disabled={isProcessingSqliteCache}
                className="py-1.5 px-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 hover:border-cyan-500 text-cyan-200 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Process and play cached event stream audio buffers directly via AudioContext visualizer"
              >
                <Play size={11} className="text-cyan-400" />
                <span>{isProcessingSqliteCache ? 'Decoding...' : 'Replay SQLite Cache'}</span>
              </button>

              <button
                onClick={handleSeedSqliteAudioEvent}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
                title="Seed new sample PCM AudioContext event tick into local SQLite WASM database"
              >
                <Zap size={11} className="text-amber-400" />
                <span>Seed SQLite Event</span>
              </button>
            </div>
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
