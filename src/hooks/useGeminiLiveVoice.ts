/**
 * useGeminiLiveVoice - React Hook for Gemini Live Voice Service
 * 
 * Provides a simple interface to the full-duplex Gemini Live voice service.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  geminiLiveVoiceService, 
  GeminiLiveConfig, 
  GeminiLiveSessionState,
  GeminiLiveEvent,
  GeminiLiveMetrics
} from '../services/geminiLiveVoiceService';

export interface UseGeminiLiveVoiceReturn {
  // Connection state
  state: GeminiLiveSessionState;
  isConnected: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  
  // Transcript
  interimTranscript: string;
  finalTranscript: string;
  
  // Metrics
  metrics: GeminiLiveMetrics;
  
  // Actions
  initialize: (config: GeminiLiveConfig) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  bargeIn: () => void;
  sendText: (text: string) => void;
  clearTranscripts: () => void;
}

export function useGeminiLiveVoice(apiKey?: string): UseGeminiLiveVoiceReturn {
  const [state, setState] = useState<GeminiLiveSessionState>('disconnected');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [metrics, setMetrics] = useState<GeminiLiveMetrics>({
    audioInputMs: 0,
    sttLatencyMs: 0,
    inferenceMs: 0,
    ttsLatencyMs: 0,
    totalRoundTripMs: 0,
    droppedFrames: 0
  });

  const eventLogRef = useRef<GeminiLiveEvent[]>([]);

  // Subscribe to service events
  useEffect(() => {
    const unsubscribe = geminiLiveVoiceService.subscribe((event: GeminiLiveEvent) => {
      eventLogRef.current = [...eventLogRef.current.slice(-99), event];
      
      switch (event.type) {
        case 'session.started':
        case 'session.ended':
        case 'session.error':
          setState(event.type === 'session.error' ? 'error' : 
                  event.data?.phase === 'connected' ? 'connected' :
                  event.type === 'session.started' ? 'connecting' : 'disconnected');
          break;
          
        case 'audio.input.start':
          setIsRecording(true);
          break;
          
        case 'audio.input.stop':
        case 'vad.speech_end':
          setIsRecording(false);
          break;
          
        case 'audio.output.start':
          setIsPlaying(true);
          break;
          
        case 'audio.output.stop':
          setIsPlaying(false);
          break;
          
        case 'transcript.interim':
          setInterimTranscript(event.data?.text || '');
          break;
          
        case 'transcript.final':
          setFinalTranscript(prev => prev + (event.data?.text || ''));
          setInterimTranscript('');
          break;
          
        case 'response.start':
          setState('thinking');
          break;
          
        case 'response.content':
          if (event.data?.hasAudio) {
            setState('speaking');
          }
          break;
          
        case 'response.end':
          setState('connected');
          break;
          
        case 'barge_in.detected':
        case 'interruption':
          setState('interrupted');
          setIsPlaying(false);
          break;
      }
    });

    // Set initial state
    setState(geminiLiveVoiceService.getState());

    // Initialize with API key if provided
    if (apiKey) {
      initialize({ apiKey });
    }

    return () => {
      unsubscribe();
    };
  }, [apiKey]);

  // Initialize service
  const initialize = useCallback((config: GeminiLiveConfig) => {
    geminiLiveVoiceService.initialize(config);
  }, []);

  // Connect to session
  const connect = useCallback(async () => {
    try {
      await geminiLiveVoiceService.connect();
    } catch (error) {
      console.error('[useGeminiLiveVoice] Connection failed:', error);
    }
  }, []);

  // Disconnect from session
  const disconnect = useCallback(async () => {
    try {
      await geminiLiveVoiceService.disconnect();
    } catch (error) {
      console.error('[useGeminiLiveVoice] Disconnect failed:', error);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    geminiLiveVoiceService.startRecording();
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    geminiLiveVoiceService.stopRecording();
  }, []);

  // Barge-in (interrupt)
  const bargeIn = useCallback(() => {
    geminiLiveVoiceService.bargeIn();
  }, []);

  // Send text input
  const sendText = useCallback((text: string) => {
    geminiLiveVoiceService.sendText(text);
  }, []);

  // Clear transcripts
  const clearTranscripts = useCallback(() => {
    geminiLiveVoiceService.clearTranscripts();
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentMetrics = geminiLiveVoiceService.getMetrics();
      setMetrics(currentMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    state,
    isConnected: state !== 'disconnected' && state !== 'error',
    isRecording,
    isPlaying,
    interimTranscript,
    finalTranscript,
    metrics,
    initialize,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    bargeIn,
    sendText,
    clearTranscripts
  };
}
