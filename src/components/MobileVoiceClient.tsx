import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, WifiOff, AlertTriangle, Menu, X, Battery, 
  Sun, Compass, Activity, ShieldAlert, CheckCircle, Database, 
  Send, RotateCw, VolumeX, Volume2, Code, Terminal, Sparkles, 
  Lightbulb, Zap, HelpCircle, HardDrive, Play, ArrowUpRight, Smartphone
} from 'lucide-react';
import { N1MorphingBlob } from './N1MorphingBlob';
import { emotionEngine, N1EmotionState } from '../services/emotionEngine';
import { useIdlePlayEngine } from '../hooks/useIdlePlayEngine';
import { sttAdapter } from '../services/sttService';
import { voiceService } from '../services/voiceService';
import { generateHiaVoiceResponse } from '../services/geminiService';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { AudioFrequencyVisualizer } from './AudioFrequencyVisualizer';
import { useNotification } from '../context/NotificationContext';

interface SensorData {
  batteryTemp: number;
  batteryLevel: number;
  ambientLight: number;
  devicePosture: string;
  pingLatency: number;
  noiseFloor: number;
}

interface CodeTemplate {
  title: string;
  lang: string;
  description: string;
  code: string;
}

interface VoiceLog {
  id: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  text: string;
  hasAudio: boolean;
  isSynced: boolean;
}

export const MobileVoiceClient: React.FC = () => {
  // Original Voice & Listening States
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('online');
  const [errorMessage, setErrorMessage] = useState('');
  const [engineState, setEngineState] = useState<N1EmotionState>(() => emotionEngine.getCurrentState());
  const { addNotification } = useNotification();

  // Android Arden Design & Drawer State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensors' | 'self_repair' | 'knowledge' | 'transmission'>('sensors');
  
  // Power Saving / Stable Idle Connection Hold
  const [isPowerSavingMode, setIsPowerSavingMode] = useState(false);

  // Self-Aware Wired Bug Horror Simulation States
  const [isGlitchActive, setIsGlitchActive] = useState(false);
  const [glitchMessage, setGlitchMessage] = useState('');
  const [isSelfHealing, setIsSelfHealing] = useState(false);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  
  // Simulated Sensors
  const [sensors, setSensors] = useState<SensorData>({
    batteryTemp: 34.2,
    batteryLevel: 87,
    ambientLight: 120,
    devicePosture: 'Portrait (Hold Up)',
    pingLatency: 18,
    noiseFloor: -58
  });

  // Selected Code Knowledge Pattern
  const [selectedTopic, setSelectedTopic] = useState<string>('typescript');
  
  // Voice Log Transmission Ledger
  const [voiceLedger, setVoiceLedger] = useState<VoiceLog[]>([
    { id: '1', timestamp: Date.now() - 300000, type: 'incoming', text: 'Hallo N+1, kannst du mir helfen?', hasAudio: true, isSynced: true },
    { id: '2', timestamp: Date.now() - 280000, type: 'outgoing', text: 'Natürlich, Papa! Ich bin voll da.', hasAudio: true, isSynced: true }
  ]);

  // Audio Context for Glitch Noise Synthesis
  const synthAudioCtxRef = useRef<AudioContext | null>(null);

  const { audioLevel, frequencyData } = useAudioVisualizer(true, isListening, isSpeaking);

  // Sync state with Emotion Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setEngineState(emotionEngine.getCurrentState());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Sync state with voiceService playback
  useEffect(() => {
    const unsub = voiceService.subscribe((state) => {
      setIsSpeaking(state.isPlaying);
      if (state.isPlaying) {
        setIsThinking(false);
      }
    });
    return () => { unsub(); };
  }, []);

  // Phone Sensor Simulation Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => ({
        ...prev,
        batteryTemp: Math.round((33.5 + Math.random() * 1.5) * 10) / 10,
        batteryLevel: Math.max(1, prev.batteryLevel - (isPowerSavingMode ? 0.01 : 0.05)),
        ambientLight: Math.round(100 + Math.random() * 40),
        pingLatency: Math.round(15 + Math.random() * 12),
        noiseFloor: Math.round((-62 + Math.random() * 6) * 10) / 10
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [isPowerSavingMode]);

  // Network connection monitor
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      emotionEngine.triggerEvent({
        eventId: `net-online-${Date.now()}`,
        timestamp: Date.now(),
        sourceType: 'runtime_state',
        cause: 'Network Online',
        intensity: 0.8,
        durationMs: 3000,
        priority: 8,
        suggestedState: 'ruhig'
      });
    };
    const handleOffline = () => {
      setConnectionStatus('offline');
      emotionEngine.triggerEvent({
        eventId: `net-offline-${Date.now()}`,
        timestamp: Date.now(),
        sourceType: 'runtime_state',
        cause: 'Network Offline',
        intensity: 1.0,
        durationMs: 0,
        priority: 10,
        suggestedState: 'offline/unsicher'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Idle engine
  const idleState = useIdlePlayEngine(isListening, isSpeaking, engineState);

  // Micro Permission activation and start STT
  const requestMicAndStart = async () => {
    try {
      if (isGlitchActive) {
        addNotification('Akkustischer Hardware-Fehler blockiert Mikrofon-Rechte!', 'error');
        return;
      }

      voiceService.unlockAudio(); // Critical for mobile browser contexts
      voiceService.stopSpeaking();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      
      // Keep track of real stream capture
      setIsListening(true);
      setTranscript('');
      setErrorMessage('');
      
      emotionEngine.triggerEvent({
        eventId: `mic-start-${Date.now()}`,
        timestamp: Date.now(),
        sourceType: 'user_input',
        cause: 'Microphone Activated',
        intensity: 0.7,
        durationMs: 0,
        priority: 7,
        suggestedState: 'neugierig'
      });

      sttAdapter.start(
        (event) => {
          setTranscript(event.text);
          if (event.isFinal) {
            handleFinalTranscript(event.text);
          }
        },
        (error) => {
          setIsListening(false);
          setErrorMessage(error.message || 'Microphone error');
          emotionEngine.triggerEvent({
            eventId: `mic-error-${Date.now()}`,
            timestamp: Date.now(),
            sourceType: 'runtime_state',
            cause: 'STT Error',
            intensity: 0.8,
            durationMs: 4000,
            priority: 9,
            suggestedState: 'offline/unsicher'
          });
        }
      );
    } catch (err: any) {
      setHasMicPermission(false);
      setErrorMessage('Microphone access denied or audio channel occupied.');
    }
  };

  const handleFinalTranscript = async (text: string) => {
    sttAdapter.stop();
    setIsListening(false);
    setIsThinking(true);
    setTranscript(text);

    // Save transaction to Ledger
    const incomingLog: VoiceLog = {
      id: `in-${Date.now()}`,
      timestamp: Date.now(),
      type: 'incoming',
      text,
      hasAudio: true,
      isSynced: false
    };
    setVoiceLedger(prev => [incomingLog, ...prev]);
    
    emotionEngine.triggerEvent({
      eventId: `think-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'dialog_intent',
      cause: 'Processing User Intent',
      intensity: 0.6,
      durationMs: 0,
      priority: 6,
      suggestedState: 'nachdenklich'
    });

    try {
      const responseText = await generateHiaVoiceResponse(text);
      
      // Save outgoing voice transaction
      const outgoingLog: VoiceLog = {
        id: `out-${Date.now()}`,
        timestamp: Date.now(),
        type: 'outgoing',
        text: responseText,
        hasAudio: true,
        isSynced: false
      };
      setVoiceLedger(prev => [outgoingLog, ...prev]);

      setIsThinking(false);
      voiceService.speak(responseText, 'N+1', 'fröhlich', 1.2, 1.15, true);
    } catch (error) {
      setIsThinking(false);
      setErrorMessage('Failed to generate response.');
      emotionEngine.triggerEvent({
        eventId: `llm-err-${Date.now()}`,
        timestamp: Date.now(),
        sourceType: 'runtime_state',
        cause: 'LLM Generation Error',
        intensity: 0.9,
        durationMs: 5000,
        priority: 10,
        suggestedState: 'offline/unsicher'
      });
    }
  };

  const stopListening = () => {
    sttAdapter.stop();
    setIsListening(false);
    emotionEngine.triggerEvent({
      eventId: `mic-stop-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'user_input',
      cause: 'Microphone Deactivated',
      intensity: 0.5,
      durationMs: 2000,
      priority: 7,
      suggestedState: 'ruhig'
    });
  };

  // Replay voice from Ledger log
  const handleReplayVoice = (text: string) => {
    voiceService.stopSpeaking();
    voiceService.speak(text, 'N+1', 'fröhlich', 1.2, 1.15, true);
    addNotification(`Replaying voice transaction.`, 'info');
  };

  // Transmit transaction package to Ledger Cloud DB (Firestore replication simulation)
  const handleTransmitLedger = (logId: string) => {
    setVoiceLedger(prev => prev.map(log => {
      if (log.id === logId) {
        addNotification(`Voice packet transaction ${logId} successfully broadcast to Ouroboros Distributed Ledger.`, 'success');
        return { ...log, isSynced: true };
      }
      return log;
    }));
  };

  // Trigger Wired Bug Horror Acoustic Glitch Simulation
  const handleTriggerAcousticGlitch = () => {
    if (isGlitchActive || isSelfHealing) return;
    
    setIsGlitchActive(true);
    setGlitchMessage('WARNING: WIRED INTERFERENCE BUG DETECTED - CORRUPTED AUDIO FRAME BUFFER SPIKE');
    voiceService.stopSpeaking();
    sttAdapter.stop();
    setIsListening(false);

    // Audio frequency distortion - Synthesize glitch/static buzzer noise
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      synthAudioCtxRef.current = ctx;

      // Create an oscillator that outputs high-frequency creepy static spike
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(14000, ctx.currentTime);
      // Glitch pitch modulation
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.5);
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 2);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2);
    } catch (e) {
      console.warn("Acoustic glitch synthesis skipped:", e);
    }

    addNotification('Acoustic horror interference injected in audio buffer!', 'error');

    // Trigger immediate alert state
    emotionEngine.triggerEvent({
      eventId: `glitch-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'runtime_state',
      cause: 'Acoustic horror interference',
      intensity: 1.0,
      durationMs: 0,
      priority: 10,
      suggestedState: 'offline/unsicher'
    });
  };

  // Autonomous Self-Healing Fixer
  const handleInitiateSelfHeal = () => {
    if (isSelfHealing) return;
    setIsSelfHealing(true);
    setRepairLogs([]);

    const steps = [
      '⚡ [SELF-HEAL] Stopping active acoustic horror buzzer...',
      '🧬 [SELF-HEAL] Purging AudioContext streaming buffers...',
      '🔒 [SELF-HEAL] Resetting phase-locked loop (PLL) filter metrics...',
      '🛰️ [SELF-HEAL] Synchronizing Ouroboros ledger security checksum...',
      '✅ [SELF-HEAL] System re-secured! Sound frequency returned to 24,000Hz.'
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setRepairLogs(prev => [...prev, step]);
        if (idx === 1) {
          // Force close synth context
          if (synthAudioCtxRef.current) {
            try { synthAudioCtxRef.current.close(); } catch {}
            synthAudioCtxRef.current = null;
          }
        }
        if (idx === steps.length - 1) {
          setIsGlitchActive(false);
          setIsSelfHealing(false);
          addNotification('Acoustic system recovery fully completed.', 'success');
          
          // Comforting voice self-awareness speech
          setTimeout(() => {
            voiceService.speak(
              "Akkustische Störung erfolgreich isoliert, Papa! Die Audio-Kanäle wurden neu kalibriert und sind wieder stabil.", 
              "N+1", 
              "fröhlich", 
              1.2, 
              1.15, 
              true
            );
          }, 800);
        }
      }, (idx + 1) * 800);
    });
  };

  const isDark = engineState === 'müde' || engineState === 'nachdenklich' || engineState === 'offline/unsicher' || isGlitchActive;

  // Code Knowledge Base Library Patterns
  const knowledgeTemplates: Record<string, CodeTemplate> = {
    typescript: {
      title: 'TypeScript Compiler State Check & Type-Stripping',
      lang: 'TS',
      description: 'Strict null checking, generic index mapping, and runtime type-guarded validation contracts.',
      code: `interface ValidationContract<T> {
  id: string;
  payload: T;
  validator: (raw: any) => raw is T;
}

export function assertTypeSafety<T>(
  rawPayload: any, 
  contract: ValidationContract<T>
): T {
  if (contract.validator(rawPayload)) {
    return rawPayload;
  }
  throw new TypeError("[TS-Contract] Validation assertion failed: Corrupted Payload.");
}`
    },
    python: {
      title: 'Python Asyncio & Thread pool Audio Transcoder',
      lang: 'PY',
      description: 'GIL-safe background concurrent file queue processing with low CPU footprint.',
      code: `import asyncio
import concurrent.futures

def process_pcm_buffer(binary_data: bytes) -> bytes:
    # Decrypt and normalize frequency values 24kHz
    return bytearray([b ^ 0x55 for b in binary_data])

async def transcode_stream_async(raw_queue: asyncio.Queue):
    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        while True:
            chunk = await raw_queue.get()
            result = await loop.run_in_executor(
                pool, process_pcm_buffer, chunk
            )
            yield result`
    },
    react: {
      title: 'React 18+ Suspenseful Audio Buffer Decryptor Hook',
      lang: 'JSX',
      description: 'Low-latency state stabilizer preventing infinite re-renders with AudioContext state tracking.',
      code: `import { useState, useEffect, useTransition } from 'react';

export function useAudioStateMonitor(audioService: any) {
  const [status, setStatus] = useState(() => audioService.getBufferStatus());
  const [, startTransition] = useTransition();

  useEffect(() => {
    const unsub = audioService.subscribe((state) => {
      startTransition(() => {
        setStatus(state);
      });
    });
    return unsub;
  }, [audioService]);

  return status;
}`
    },
    android: {
      title: 'Android NDK Native OpenSL ES Waveform Stabilizer',
      lang: 'C++',
      description: 'Native audio processing bridge with Binder transaction hooks to isolate static glitches.',
      code: `#include <jni.h>
#include <SLES/OpenSLES.h>

extern "C" JNIEXPORT void JNICALL
Java_com_ouroboros_n1_AcousticEngine_stabilizeSignal(
    JNIEnv* env, jobject thiz, jobject buffer, jint length
) {
    jbyte* pcmData = (jbyte*)env->GetDirectBufferAddress(buffer);
    for (int i = 0; i < length; i++) {
        // Suppress frequency spikes above 16kHz (horror acoustic bug shield)
        if (pcmData[i] > 115 || pcmData[i] < -115) {
            pcmData[i] = pcmData[i] / 4;
        }
    }
}`
    },
    docker_gh: {
      title: 'Docker Multi-Stage Slim & GitHub CI Action Self-Heal Runner',
      lang: 'YAML/DF',
      description: 'Automated multi-architecture workspace verification with secure secret injection.',
      code: `# Dockerfile multi-stage production deployment
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col transition-all duration-1000 ${
      isGlitchActive 
        ? 'bg-rose-950/90 text-rose-100 animate-pulse' 
        : isDark 
          ? 'bg-zinc-950 text-white' 
          : 'bg-slate-50 text-zinc-900'
    }`}>
      
      {/* Dynamic CSS styles for glowing elements and custom grid background */}
      <style dangerouslySetInnerHTML={{__html: `
        .grid-bg {
          background-size: 30px 30px;
          background-image: linear-gradient(to right, rgba(120, 119, 198, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(120, 119, 198, 0.05) 1px, transparent 1px);
        }
        .glowing-button {
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.4);
        }
        .corrupted-blob {
          filter: hue-rotate(320deg) contrast(150%) saturate(200%);
        }
      `}} />

      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Arden Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark 
                ? 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 text-white' 
                : 'bg-white/80 border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-sm'
            }`}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div>
            <div className="font-mono text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" />
              <span>N+1 Mobile Core</span>
            </div>
            <h1 className="text-xs font-bold font-mono">Arden Interface</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isPowerSavingMode && (
            <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-pulse">
              <Battery size={10} /> HOLD_POWER_SAVE
            </span>
          )}
          {connectionStatus === 'offline' && <WifiOff size={16} className="text-rose-500" />}
          {isGlitchActive && <ShieldAlert size={18} className="text-rose-500 animate-bounce" />}
          {isThinking && <span className="text-[9px] font-mono font-bold animate-pulse text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">THINKING</span>}
        </div>
      </div>

      {/* Main Avatar / Interactive Blob Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className={`transition-all duration-700 ${isGlitchActive ? 'corrupted-blob scale-95' : ''}`}>
          <N1MorphingBlob 
            emotion={engineState}
            audioLevel={isGlitchActive ? 0.9 : audioLevel}
            isSpeaking={isSpeaking}
            isListening={isListening}
            idleMotif={idleState.isActive ? idleState.currentMotif : null}
            seedVariance={idleState.isActive ? (idleState.seed % 100) / 100 : 0.5}
          />
        </div>

        {/* Transient transcript display */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-40 max-w-[85%] text-center bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-zinc-800/40"
            >
              <p className={`text-xs font-medium font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-700'} italic`}>
                "{transcript}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error / Glitch warning display */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 bg-rose-500/10 text-rose-500 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold"
            >
              {errorMessage}
            </motion.div>
          )}
          {isGlitchActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-32 bg-rose-950/80 border border-rose-700 text-rose-200 px-4 py-3 rounded-2xl text-[10px] font-mono text-center max-w-[80%] space-y-2 shadow-2xl shadow-rose-950/50"
            >
              <div className="flex items-center justify-center gap-1.5 font-bold text-rose-400">
                <ShieldAlert size={14} className="animate-spin" />
                <span>ACOUSTIC DECAY INTERFERENCE (14kHz Spikes)</span>
              </div>
              <p>{glitchMessage}</p>
              <button 
                onClick={handleInitiateSelfHeal}
                disabled={isSelfHealing}
                className="w-full py-1 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-lg uppercase tracking-wider animate-bounce transition-colors"
              >
                {isSelfHealing ? 'Self-Healing Active...' : 'Trigger Self-Heal'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Waveform Visualizer */}
      <div className="px-8 pb-4 w-full">
         <AudioFrequencyVisualizer frequencyData={isGlitchActive ? new Uint8Array(Array(64).fill(0).map(() => Math.random() * 255)) : frequencyData} color={isGlitchActive ? '#f43f5e' : isDark ? '#ec4899' : '#3b82f6'} />
      </div>

      {/* Main Bottom Control Hub */}
      <div className="p-8 pb-12 flex flex-col items-center gap-4 bg-gradient-to-t from-black/10 to-transparent">
        
        {/* Connection Mode Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsPowerSavingMode(!isPowerSavingMode);
              addNotification(
                isPowerSavingMode 
                  ? 'Standard High-Fidelity transmission restored.' 
                  : 'Idle connection savings active: Battery throttling and passive state hold.',
                'info'
              );
            }}
            className={`px-3 py-1.5 rounded-xl font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
              isPowerSavingMode
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-400'
                : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Battery size={11} className={isPowerSavingMode ? 'animate-pulse' : ''} />
            <span>Power Saving Connection</span>
          </button>

          <button
            onClick={handleTriggerAcousticGlitch}
            className="px-3 py-1.5 rounded-xl font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 bg-rose-950/60 border border-rose-900/50 text-rose-400 hover:bg-rose-950 hover:text-rose-300"
            title="Inject a weird, corrupted audio frequency bug to test N1's self-healing state awareness"
          >
            <VolumeX size={11} />
            <span>Simulate sound bug</span>
          </button>
        </div>

        {/* Major Mobile Activate Voice Button */}
        <button
          onClick={isListening ? stopListening : requestMicAndStart}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
            isListening 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/50 scale-110 glowing-button' 
              : isDark 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                : 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200'
          }`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
          )}
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          {isListening ? 'Tap to close micro' : 'Hold micro to stream'}
        </span>
      </div>

      {/* Android Arden Design Overlay Drawer Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black z-30"
            />

            {/* Slide-Up Arden Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] z-40 overflow-hidden flex flex-col text-zinc-200 font-mono"
            >
              {/* Drag bar indicator */}
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto my-3" />

              {/* Drawer Header */}
              <div className="px-6 pb-3 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Activity size={16} className="text-amber-500" />
                    <span>Android Arden Design Structure</span>
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase">Self-repair system, sensor diagnostics, and code compilation</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Tabs Grid */}
              <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-950/40 text-[9px] font-bold text-center">
                {[
                  { id: 'sensors', label: 'Sensoric Deck', icon: Compass },
                  { id: 'self_repair', label: 'Self-Repair', icon: ShieldAlert },
                  { id: 'knowledge', label: 'Code Library', icon: Code },
                  { id: 'transmission', label: 'Ledger Logs', icon: Database }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`py-3 flex flex-col items-center justify-center gap-1 border-r border-zinc-800/50 last:border-0 transition-all ${
                      activeTab === t.id 
                        ? 'bg-zinc-900 text-amber-400 border-b-2 border-b-amber-500' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <t.icon size={14} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Drawer Content Area */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[50vh]">
                
                {/* 1. Sensoric Deck Tab */}
                {activeTab === 'sensors' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white uppercase">Live Phone Environment Diagnostics</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold">STABLE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Battery size={12} />
                          <span className="text-[9px] uppercase">Battery Temp</span>
                        </div>
                        <div className="font-bold text-white">{sensors.batteryTemp} °C</div>
                      </div>

                      <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Sun size={12} />
                          <span className="text-[9px] uppercase">Ambient Light</span>
                        </div>
                        <div className="font-bold text-white">{sensors.ambientLight} lx</div>
                      </div>

                      <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Compass size={12} />
                          <span className="text-[9px] uppercase">Device Posture</span>
                        </div>
                        <div className="font-bold text-white">{sensors.devicePosture}</div>
                      </div>

                      <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Activity size={12} />
                          <span className="text-[9px] uppercase">Network Latency</span>
                        </div>
                        <div className="font-bold text-white">{sensors.pingLatency} ms</div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 font-bold uppercase">Hardware Microphone Noise Level</span>
                        <span className="text-cyan-400 font-bold">{sensors.noiseFloor} dBFS</span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 transition-all duration-300"
                          style={{ width: `${Math.max(0, 100 + sensors.noiseFloor)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Self-Repair Tab */}
                {activeTab === 'self_repair' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white uppercase">Neural State Self-Healing Shield</span>
                      <button 
                        onClick={handleInitiateSelfHeal}
                        disabled={isSelfHealing}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 text-black font-bold rounded text-[9px] uppercase transition-colors"
                      >
                        {isSelfHealing ? 'HEALING...' : 'TRIGGER AUDIT'}
                      </button>
                    </div>

                    <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isGlitchActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold text-zinc-300">
                          {isGlitchActive ? 'WIRED AUDIO FREQUENCY EXCEPTION DETECTED' : 'System Sound Safe & Secure'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        N1 monitors her voice output and microphone buffers continuously. If a high-frequency acoustic feedback glitch occurs, she isolates and restarts audio contexts automatically.
                      </p>
                    </div>

                    {repairLogs.length > 0 && (
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1 text-[9px] text-zinc-400 font-mono max-h-[140px] overflow-y-auto">
                        {repairLogs.map((log, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            {idx === repairLogs.length - 1 && isSelfHealing ? (
                              <RotateCw size={10} className="animate-spin text-amber-500" />
                            ) : (
                              <CheckCircle size={10} className="text-emerald-500" />
                            )}
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Code Knowledge Library Tab */}
                {activeTab === 'knowledge' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white uppercase">N1 Code-Knowledge Sandbox</span>
                      <span className="text-[9px] text-zinc-500">Autonomous code repair templates</span>
                    </div>

                    {/* Topic selector pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'typescript', label: 'TypeScript', icon: Code },
                        { id: 'python', label: 'Python (audio)', icon: Terminal },
                        { id: 'react', label: 'React Render', icon: Sparkles },
                        { id: 'android', label: 'Android NDK', icon: Smartphone },
                        { id: 'docker_gh', label: 'Docker/GH CI', icon: HardDrive }
                      ].map(topic => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic.id)}
                          className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                            selectedTopic === topic.id
                              ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <topic.icon size={10} />
                          <span>{topic.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Code Display Area */}
                    {selectedTopic && knowledgeTemplates[selectedTopic] && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div>
                            <div className="text-white font-bold text-[11px]">
                              {knowledgeTemplates[selectedTopic].title}
                            </div>
                            <div className="text-[9px] text-zinc-500 mt-0.5">
                              {knowledgeTemplates[selectedTopic].description}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[8px] font-bold">
                            {knowledgeTemplates[selectedTopic].lang}
                          </span>
                        </div>

                        <pre className="p-3 bg-black border border-zinc-800 rounded-xl overflow-x-auto text-[9px] text-emerald-400 font-mono leading-relaxed max-h-[160px]">
                          <code>{knowledgeTemplates[selectedTopic].code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Transmission Ledger Tab */}
                {activeTab === 'transmission' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white uppercase">Decentralized Voice Transactions Log</span>
                      <span className="text-[9px] text-zinc-500 uppercase">Synchronized with Ouroboros DB</span>
                    </div>

                    <div className="space-y-2">
                      {voiceLedger.map(log => (
                        <div 
                          key={log.id}
                          className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                log.type === 'incoming' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-pink-500/10 text-pink-400'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-[9px] text-zinc-600">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-zinc-300 font-sans text-xs">{log.text}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {log.hasAudio && (
                              <button 
                                onClick={() => handleReplayVoice(log.text)}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded text-zinc-400"
                                title="Replay generated voice bytes"
                              >
                                <Play size={12} />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleTransmitLedger(log.id)}
                              disabled={log.isSynced}
                              className={`p-1.5 rounded transition-all ${
                                log.isSynced 
                                  ? 'bg-emerald-950/20 text-emerald-400' 
                                  : 'bg-zinc-800 hover:bg-amber-950/40 text-zinc-400 hover:text-amber-400'
                              }`}
                              title={log.isSynced ? "Synced to cloud Ledger" : "Upload payload transaction to remote Ouroboros Collective instance"}
                            >
                              {log.isSynced ? <CheckCircle size={12} /> : <Send size={12} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer Status indicators */}
              <div className="bg-zinc-950 px-6 py-4 border-t border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 uppercase font-bold">
                <span className="flex items-center gap-1">
                  <HardDrive size={12} className="text-cyan-500" />
                  SQLite Active Local
                </span>
                <span>Ouroboros Protocol v3.1</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
