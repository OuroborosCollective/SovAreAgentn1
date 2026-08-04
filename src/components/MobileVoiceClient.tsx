import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, WifiOff, AlertTriangle } from 'lucide-react';
import { N1MorphingBlob } from './N1MorphingBlob';
import { emotionEngine, N1EmotionState } from '../services/emotionEngine';
import { useIdlePlayEngine } from '../hooks/useIdlePlayEngine';
import { sttAdapter } from '../services/sttService';
import { voiceService } from '../services/voiceService';
import { generateHiaVoiceResponse } from '../services/geminiService';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { AudioFrequencyVisualizer } from './AudioFrequencyVisualizer';

export const MobileVoiceClient: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('online');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [engineState, setEngineState] = useState<N1EmotionState>(() => emotionEngine.getCurrentState());
  
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

  const requestMicAndStart = async () => {
    try {
      // First time request
      if (hasMicPermission === null) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicPermission(true);
      }
      
      voiceService.unlockAudio(); // Important for iOS/mobile web
      voiceService.stopSpeaking();
      
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
      setErrorMessage('Microphone access denied. Please allow in settings.');
    }
  };

  const handleFinalTranscript = async (text: string) => {
    sttAdapter.stop();
    setIsListening(false);
    setIsThinking(true);
    setTranscript(text);
    
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

  const isDark = engineState === 'müde' || engineState === 'nachdenklich' || engineState === 'offline/unsicher';

  return (
    <div className={`fixed inset-0 flex flex-col transition-colors duration-1000 ${isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'}`}>
      
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <div className="font-mono text-xs font-bold opacity-50 uppercase tracking-widest">N+1 Core</div>
        
        <div className="flex items-center gap-2">
          {connectionStatus === 'offline' && <WifiOff size={16} className="text-rose-500" />}
          {errorMessage && <AlertTriangle size={16} className="text-amber-500" />}
          {isThinking && <span className="text-[10px] font-bold animate-pulse">THINKING...</span>}
        </div>
      </div>

      {/* Main Avatar / Blob Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <N1MorphingBlob 
          emotion={engineState}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
          isListening={isListening}
          idleMotif={idleState.isActive ? idleState.currentMotif : null}
          seedVariance={idleState.isActive ? (idleState.seed % 100) / 100 : 0.5}
        />

        {/* Transient transcript display */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 max-w-[80%] text-center"
            >
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'} italic`}>
                "{transcript}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error message display */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-24 bg-rose-500/10 text-rose-500 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-8 pb-4 w-full">
         <AudioFrequencyVisualizer frequencyData={frequencyData} color={isDark ? '#ec4899' : '#3b82f6'} />
      </div>

      {/* Bottom Control Bar */}
      <div className="p-8 pb-12 flex justify-center items-center">
        <button
          onClick={isListening ? stopListening : requestMicAndStart}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isListening 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/50 scale-110' 
              : isDark 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                : 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200'
          }`}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
      </div>

    </div>
  );
};
