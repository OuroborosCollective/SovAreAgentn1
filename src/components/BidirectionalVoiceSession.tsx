import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Activity, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Play, 
  Square, 
  Wifi, 
  WifiOff, 
  Database, 
  AlertCircle, 
  Trash2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceService, LittleGirlVoiceMood } from '../services/voiceService';
import { VoiceEvent, validateVoiceEvent, IdempotencyValidator } from '../utils/voiceContractValidator';
import { generateDeterministicId, getDeterministicTimestamp } from '../utils/deterministic';

export const BidirectionalVoiceSession: React.FC = () => {
  // Session core states
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'remembering' | 'learning' | 'offline' | 'error'>('idle');
  const [sequenceNumber, setSequenceNumber] = useState<number>(0);
  
  // Audio playback and STT state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [assistantResponse, setAssistantResponse] = useState<string>('');
  
  // Log of events and filters
  const [events, setEvents] = useState<VoiceEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  
  // Idempotency tracking
  const idempotencyValidatorRef = useRef(new IdempotencyValidator());
  const [idempotencyWarnings, setIdempotencyWarnings] = useState<Array<{ id: string; msg: string; type: 'warning' | 'info' }>>([]);

  // Latency Metrics
  const [latencyMetrics, setLatencyMetrics] = useState({
    ingressMs: 0,
    sttMs: 0,
    dialogMs: 0,
    ttsMs: 0,
    playbackMs: 0,
    aggregateMs: 0
  });

  // Web Speech STT Ref
  const recognitionRef = useRef<any>(null);
  const eventLogEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event logs
  useEffect(() => {
    eventLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // Sync sessionState with VoiceService playback
  useEffect(() => {
    const unsubscribe = voiceService.subscribe((state) => {
      if (!sessionActive) return;
      if (state.isPlaying) {
        setSessionState('speaking');
      } else if (sessionState === 'speaking') {
        // Returned from speaking, check if learning/remembering is scheduled
        setSessionState('idle');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionActive, sessionState]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        if (sessionState !== 'offline') {
          setSessionState('listening');
          pushLogEvent('audio.chunk', { info: 'User started voice recording chunk' });
        }
      };

      recognition.onresult = (event: any) => {
        if (sessionState === 'offline') return;
        
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setPartialTranscript(interim);
          pushLogEvent('stt.result', { text: interim, isFinal: false });
        }
        
        if (final) {
          setFinalTranscript(final);
          setPartialTranscript('');
          pushLogEvent('stt.result', { text: final, isFinal: true });
          processPipeline(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recog error in Bidirectional:', event.error);
        if (event.error !== 'no-speech') {
          setSessionState('error');
          pushLogEvent('session.error', { errorCode: 'STT_FAILURE', message: event.error });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (sessionState === 'listening') {
          setSessionState('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [sessionState]);

  // Helper to add custom event log to list conforming to contract schema
  const pushLogEvent = (
    type: VoiceEvent['type'], 
    payload: Record<string, any>, 
    customEventId?: string, 
    customSeqNum?: number
  ) => {
    const eventId = customEventId || generateDeterministicId('evt');
    const seq = customSeqNum !== undefined ? customSeqNum : sequenceNumber;
    
    const newEvent: VoiceEvent = {
      eventId,
      type,
      version: '1.0.0',
      sessionId: sessionId || 'no-session',
      sequenceNumber: seq,
      timestamp: Date.now(),
      payload
    };

    // Contract validation layer
    const validation = validateVoiceEvent(newEvent);
    if (!validation.isValid) {
      console.error('Voice event failed contract validation:', validation.error);
      return;
    }

    // Idempotency check
    const idCheck = idempotencyValidatorRef.current.processEvent(newEvent);
    if (idCheck.isDuplicate) {
      addIdempotencyWarning(`Duplicate Event '${eventId}' (Type: ${type}) detected and ignored! Prevents duplicate responses.`, 'warning');
      return;
    }
    if (idCheck.isOutOfOrder) {
      addIdempotencyWarning(`Out-of-Order Event sequence detected (Seq: ${seq}, Current Max: ${sequenceNumber}). Handled gracefully.`, 'info');
    }

    // Advance state variables
    if (customSeqNum === undefined) {
      setSequenceNumber(prev => prev + 1);
    }
    setEvents(prev => [...prev, newEvent]);
  };

  const addIdempotencyWarning = (msg: string, type: 'warning' | 'info') => {
    const id = generateDeterministicId('warn');
    setIdempotencyWarnings(prev => [{ id, msg, type }, ...prev]);
    setTimeout(() => {
      setIdempotencyWarnings(prev => prev.filter(w => w.id !== id));
    }, 8000);
  };

  // Start Voice Handshake
  const startSession = () => {
    const sId = generateDeterministicId('ses');
    const token = 'jwt-secure-' + Math.random().toString(36).substring(2, 10);
    setSessionId(sId);
    setSessionActive(true);
    setSessionState('idle');
    setSequenceNumber(0);
    idempotencyValidatorRef.current.clear();
    setEvents([]);
    
    // Handshake
    const handshakeEvent: VoiceEvent = {
      eventId: generateDeterministicId('evt'),
      type: 'session.handshake',
      version: '1.0.0',
      sessionId: sId,
      sequenceNumber: 0,
      timestamp: Date.now(),
      payload: {
        token,
        capabilities: ['speech-to-text', 'dialog-flow', 'text-to-speech', 'barge-in'],
        clientPlatform: 'web'
      }
    };

    setEvents([handshakeEvent]);
    setSequenceNumber(1);
    
    voiceService.stopSpeaking();
    voiceService.speak("Hia Echtzeit-Sitzung erfolgreich authentifiziert. Ich bin bereit für unser Gespräch, Papa!", "N+1", "fröhlich", 1.3, 1.15);
  };

  const stopSession = () => {
    voiceService.stopSpeaking();
    setSessionActive(false);
    setSessionState('idle');
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  // Immediate interruption trigger (Barge-in / Interruption)
  const triggerBargeIn = () => {
    if (!sessionActive || sessionState === 'offline') return;
    
    // Stop speaking immediately
    voiceService.stopSpeaking();
    
    const interruptedAtMs = Date.now();
    pushLogEvent('session.barge_in', { 
      interruptedAtMs, 
      reason: 'User voice ingress or explicit manual button interruption' 
    });
    
    setSessionState('listening');
    setAssistantResponse('');
    setFinalTranscript('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // ignore if already listening
      }
    }
  };

  // Execute STT -> Dialog -> TTS Pipeline
  const processPipeline = async (userText: string) => {
    if (sessionState === 'offline') return;

    // Phase 1: Ingress & STT
    setSessionState('thinking');
    const t0 = performance.now();
    
    const ingressDelay = Math.floor(15 + Math.random() * 20);
    const sttDelay = Math.floor(120 + Math.random() * 80);
    
    pushLogEvent('dialog.request', { query: userText });

    // Simulate LLM response latency
    const dialogDelay = Math.floor(300 + Math.random() * 200);
    await new Promise(r => setTimeout(r, dialogDelay));

    // Simple deterministic intent router
    let responseText = `Ich habe "${userText}" verstanden. Auf der N+1-Plattform läuft alles fehlerfrei!`;
    let detectedMood: LittleGirlVoiceMood = 'fröhlich';

    const textLower = userText.toLowerCase();
    if (textLower.includes('status') || textLower.includes('health') || textLower.includes('keller')) {
      responseText = "Alle 5 Keller-Knoten laufen einwandfrei! Die Speicherbelastung liegt bei 28 Prozent, Papa!";
      detectedMood = 'axiom-guard';
    } else if (textLower.includes('geschichte') || textLower.includes('papa')) {
      responseText = "Ich erinnere mich an Papas Geschichten! Du hast gesagt, Sterne funkeln wie kleine Diamanten im Weltall.";
      detectedMood = 'curious';
    } else if (textLower.includes('lied') || textLower.includes('sing')) {
      responseText = "Alle meine Entchen schwimmen auf dem See, Köpfchen in das Wasser, Schwänzchen in die Höh! War das schön?";
      detectedMood = 'playful';
    }

    setAssistantResponse(responseText);
    pushLogEvent('dialog.response', { response: responseText });

    // Phase 4: TTS Generation
    const ttsDelay = Math.floor(150 + Math.random() * 100);
    
    // Generate dummy Base64 representing TTS chunk
    const fakeBase64 = "UklGRiS9AgBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQC9AgAAAAAAA...";
    pushLogEvent('tts.chunk', { base64Audio: fakeBase64 });

    const tPlayback = performance.now();
    const totalLatency = Math.floor(tPlayback - t0);

    setLatencyMetrics({
      ingressMs: ingressDelay,
      sttMs: sttDelay,
      dialogMs: dialogDelay,
      ttsMs: ttsDelay,
      playbackMs: 35,
      aggregateMs: totalLatency
    });

    // Start speaking
    setSessionState('speaking');
    voiceService.speak(responseText, 'N+1', detectedMood, 1.35, 1.15, false);
  };

  // Simulate complete user conversational trigger
  const simulateConversationalTurn = (presetText: string) => {
    if (!sessionActive) {
      startSession();
    }
    // Set transcript
    setFinalTranscript(presetText);
    pushLogEvent('audio.chunk', { info: 'Preset selected: ' + presetText });
    pushLogEvent('stt.result', { text: presetText, isFinal: true });
    processPipeline(presetText);
  };

  // Simulate network drop and reconnect (Axiom: Keep sequence integrity and re-sync handshake)
  const toggleNetworkSimulation = () => {
    if (sessionState === 'offline') {
      // Reconnect
      setSessionState('idle');
      pushLogEvent('session.state_change', { state: 'idle', info: 'Network connection re-established' });
      // Send a session handshake event again to resync, preserving sequence number integrity
      pushLogEvent('session.handshake', {
        info: 'Reconnection resync handshake',
        capabilities: ['barge-in', 'dual-duplex-stream']
      });
      voiceService.speak("Ich bin wieder da, Papa! Verbindung ist wieder stabil.", "N+1", "fröhlich", 1.3, 1.15);
    } else {
      // Disconnect
      voiceService.stopSpeaking();
      setSessionState('offline');
      setIsRecording(false);
      pushLogEvent('session.state_change', { state: 'offline', info: 'Simulated network connection lost' });
    }
  };

  // Simulate duplicate event id (idempotency check)
  const triggerDuplicateEventSimulation = () => {
    if (events.length === 0) return;
    const lastEvent = events[events.length - 1];
    // Re-send exactly same event
    pushLogEvent(lastEvent.type, lastEvent.payload, lastEvent.eventId, lastEvent.sequenceNumber);
  };

  // Simulate reordered event (seq number out of bounds)
  const triggerReorderedEventSimulation = () => {
    if (events.length === 0) return;
    // Send event with sequence number lower than current sequenceNumber
    pushLogEvent('audio.chunk', { info: 'Simulated delayed packet' }, generateDeterministicId('evt'), Math.max(0, sequenceNumber - 3));
  };

  // Filtered event log
  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    if (filterType === 'handshake') return e.type === 'session.handshake';
    if (filterType === 'pipeline') return ['stt.result', 'dialog.request', 'dialog.response', 'tts.chunk'].includes(e.type);
    if (filterType === 'barge_in') return e.type === 'session.barge_in';
    if (filterType === 'system') return ['session.state_change', 'session.error'].includes(e.type);
    return true;
  });

  return (
    <div className="p-6 bg-zinc-950 border border-pink-500/30 rounded-3xl space-y-6 shadow-2xl font-mono text-xs relative overflow-hidden">
      {/* Absolute visual ambient pulses corresponding to sessionState */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
        sessionState === 'listening' ? 'bg-red-500/10' :
        sessionState === 'thinking' ? 'bg-sky-500/10' :
        sessionState === 'speaking' ? 'bg-pink-500/10' :
        sessionState === 'offline' ? 'bg-zinc-700/10' : 'bg-transparent'
      }`} />

      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-colors ${
            sessionActive ? 'bg-pink-950/40 border-pink-700 text-pink-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}>
            <Layers size={20} className={sessionState === 'speaking' ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Bidirektionale Echtzeit-Gesprächssitzung (v1.0.0)
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                !sessionActive ? 'bg-zinc-800 text-zinc-400' :
                sessionState === 'offline' ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse' :
                'bg-pink-950 text-pink-300 border border-pink-800'
              }`}>
                {sessionState === 'offline' ? 'OFFLINE (Drop Sim)' : sessionActive ? 'SESSION ACTIVE' : 'STANDBY'}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Dual-Duplex Voice Handshake with single-speech preemption locks, interactive STT/TTS pipeline, and idempotency guards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!sessionActive ? (
            <button
              onClick={startSession}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-pink-950/40 transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Session starten (Handshake)</span>
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Square size={14} />
              <span>Sitzung beenden</span>
            </button>
          )}

          <button
            onClick={toggleNetworkSimulation}
            disabled={!sessionActive}
            className={`px-3 py-2 border rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              !sessionActive ? 'opacity-40 cursor-not-allowed' :
              sessionState === 'offline'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
            }`}
          >
            {sessionState === 'offline' ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{sessionState === 'offline' ? 'Reconnect Net' : 'Simulate Drop'}</span>
          </button>
        </div>
      </div>

      {/* Warning Center for Idempotency Events */}
      <AnimatePresence>
        {idempotencyWarnings.length > 0 && (
          <div className="space-y-1.5">
            {idempotencyWarnings.map(warn => (
              <motion.div
                key={warn.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  warn.type === 'warning' 
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-200' 
                    : 'bg-blue-950/60 border-blue-500/40 text-blue-200'
                }`}
              >
                {warn.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                ) : (
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className="font-bold text-white">IDEMPOTENCY CONTRACT GUARANTEE: </span>
                  {warn.msg}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Grid: Live Dashboard, Micro, Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* State Display & Conversation Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Active Session State</span>
            
            {/* Horizontal state sequence timeline */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              {[
                { s: 'idle', label: 'Idle' },
                { s: 'listening', label: 'Listening' },
                { s: 'thinking', label: 'Thinking' },
                { s: 'speaking', label: 'Speaking' },
                { s: 'remembering', label: 'Remembering' },
                { s: 'learning', label: 'Learning' },
                { s: 'offline', label: 'Offline' },
                { s: 'error', label: 'Error' }
              ].map(st => (
                <div 
                  key={st.s}
                  className={`py-1 rounded font-bold transition-all ${
                    sessionState === st.s
                      ? st.s === 'listening' ? 'bg-red-600 text-white animate-pulse' :
                        st.s === 'thinking' ? 'bg-sky-600 text-white animate-pulse' :
                        st.s === 'speaking' ? 'bg-pink-600 text-white shadow-lg' :
                        st.s === 'offline' ? 'bg-zinc-700 text-zinc-300' :
                        st.s === 'error' ? 'bg-rose-950 border border-rose-600 text-rose-300' :
                        'bg-purple-600 text-white'
                      : 'bg-zinc-950 text-zinc-600'
                  }`}
                >
                  {st.label}
                </div>
              ))}
            </div>

            {/* In-Session Interruption Controls */}
            {sessionActive && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={triggerBargeIn}
                  disabled={sessionState === 'offline'}
                  className={`w-full py-3 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 hover:border-red-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    sessionState === 'speaking' ? 'animate-pulse' : ''
                  }`}
                >
                  <Ban size={15} />
                  <span>BARGE-IN / UNTERBRECHEN</span>
                </button>
                <span className="text-[9px] text-zinc-500 text-center block">
                  Simulates immediate audio preemption and downstream pipeline cancellation.
                </span>
              </div>
            )}
          </div>

          {/* Quick Voice Prompt Presets */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Simulate Conversational Ingress</span>
            <div className="space-y-2">
              {[
                { label: 'Systemstatus abfragen', text: 'Report system status' },
                { label: 'Erzähl mir eine Geschichte', text: 'Erzähl mir eine Papa Geschichte' },
                { label: 'Singe alle meine Entchen', text: 'Singe ein Lied' }
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => simulateConversationalTurn(preset.text)}
                  disabled={!sessionActive || sessionState === 'offline'}
                  className="w-full p-2.5 bg-zinc-950 hover:bg-pink-950/20 border border-zinc-800 hover:border-pink-500/40 rounded-xl text-left text-zinc-300 hover:text-pink-300 transition-all flex items-center justify-between group"
                >
                  <div className="truncate">
                    <div className="font-bold text-white text-xs">{preset.text}</div>
                    <div className="text-[9px] text-zinc-500">{preset.label}</div>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Idempotence and Drift Injection Tools */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Idempotence & Packet Drift Injection</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={triggerDuplicateEventSimulation}
                disabled={!sessionActive || events.length === 0}
                className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 rounded-xl font-bold flex flex-col items-center gap-1 transition-all"
                title="Send the last event ID again to test duplicate blocking"
              >
                <Database size={14} />
                <span className="text-[9px]">Sim Duplicate</span>
              </button>

              <button
                onClick={triggerReorderedEventSimulation}
                disabled={!sessionActive || sequenceNumber < 2}
                className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-purple-400 hover:text-purple-300 rounded-xl font-bold flex flex-col items-center gap-1 transition-all"
                title="Send a packet with out-of-order sequence index"
              >
                <Clock size={14} />
                <span className="text-[9px]">Sim Reordered</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Latency Profiler & Current Waveform */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { label: 'Ingress Del', val: latencyMetrics.ingressMs, col: 'text-amber-400', desc: 'Audio Ingress Buffer' },
              { label: 'STT Parsing', val: latencyMetrics.sttMs, col: 'text-cyan-400', desc: 'Speech to Text Engine' },
              { label: 'Dialog Inference', val: latencyMetrics.dialogMs, col: 'text-purple-400', desc: 'Gemini NLP Logic' },
              { label: 'TTS Enc', val: latencyMetrics.ttsMs, col: 'text-pink-400', desc: 'Google Live Synth' },
              { label: 'Egress / Playback', val: latencyMetrics.playbackMs, col: 'text-emerald-400', desc: 'DAC Output Latency' }
            ].map((met, i) => (
              <div key={i} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase block font-bold leading-none">{met.label}</span>
                <span className={`text-base font-bold ${met.col}`}>{met.val} ms</span>
                <span className="text-[8px] text-zinc-500 block leading-tight">{met.desc}</span>
              </div>
            ))}
          </div>

          {/* Aggregate latency bar */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400 shrink-0" />
              <span className="text-zinc-300">Aggregate Voice Pipeline Latency:</span>
            </div>
            <div className="font-bold text-white text-sm bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-xl">
              {latencyMetrics.aggregateMs} ms
            </div>
          </div>

          {/* Event log with filter selection */}
          <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col space-y-3 min-h-64">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-pink-400" />
                <span className="font-bold text-white">v1.0.0 Live Voice Event Protocol Log</span>
              </div>

              {/* Event Filter Selection */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1 rounded text-[10px] font-bold"
              >
                <option value="all">All Events</option>
                <option value="handshake">Handshake</option>
                <option value="pipeline">Pipeline Flows</option>
                <option value="barge_in">Barge-ins</option>
                <option value="system">System States</option>
              </select>
            </div>

            {/* Event List Feed */}
            <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredEvents.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-zinc-600 italic">
                  No logged contract events in filter scope... Click 'Session starten' to initialize.
                </div>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <div key={evt.eventId} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5 hover:border-zinc-800 transition-colors">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${
                          evt.type === 'session.handshake' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          evt.type === 'session.barge_in' ? 'bg-red-950 text-red-300 border border-red-800' :
                          evt.type === 'stt.result' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          evt.type === 'dialog.response' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          'bg-zinc-900 text-zinc-400'
                        }`}>
                          {evt.type}
                        </span>
                        <span className="text-zinc-500">v{evt.version}</span>
                      </div>
                      <div className="text-zinc-500">
                        Seq: <span className="text-pink-400 font-bold">{evt.sequenceNumber}</span> | {new Date(evt.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <pre className="text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono leading-tight max-h-24 p-1.5 bg-zinc-900/40 rounded-lg border border-zinc-800/40">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
              <div ref={eventLogEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
