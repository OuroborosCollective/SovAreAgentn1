/**
 * Gemini Live Voice Service - Full-Duplex Voice Interface
 * 
 * Provides true bidirectional audio streaming using Google Gemini Live API.
 * Features:
 * - WebSocket-based real-time communication
 * - Simultaneous audio input/output
 * - Native barge-in support
 * - Voice Activity Detection (VAD)
 * - Automatic audio chunk streaming
 */

import { GoogleGenAI, Live, LiveServerMessage, LiveClientContent, LiveClientRealtimeInput, Modality } from '@google/genai';

export type GeminiLiveSessionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'interrupted' 
  | 'error';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  voiceName?: string;
  languageCode?: string;
  systemInstruction?: string;
  enableBargeIn?: boolean;
  vadEnabled?: boolean;
  vadThreshold?: number;
  audioSampleRate?: number;
}

export interface GeminiLiveMetrics {
  audioInputMs: number;
  sttLatencyMs: number;
  inferenceMs: number;
  ttsLatencyMs: number;
  totalRoundTripMs: number;
  droppedFrames: number;
}

export type GeminiLiveEventType = 
  | 'session.started'
  | 'session.ended'
  | 'session.error'
  | 'audio.input.start'
  | 'audio.input.stop'
  | 'audio.output.start'
  | 'audio.output.stop'
  | 'transcript.interim'
  | 'transcript.final'
  | 'response.start'
  | 'response.content'
  | 'response.end'
  | 'barge_in.detected'
  | 'vad.speech_start'
  | 'vad.speech_end'
  | 'interruption';

export interface GeminiLiveEvent {
  type: GeminiLiveEventType;
  timestamp: number;
  data?: any;
}

type GeminiLiveEventListener = (event: GeminiLiveEvent) => void;

const DEFAULT_CONFIG: Partial<GeminiLiveConfig> = {
  model: 'gemini-2.0-flash-exp',
  voiceName: 'Puck',
  languageCode: 'de-DE',
  enableBargeIn: true,
  vadEnabled: true,
  vadThreshold: 0.5,
  audioSampleRate: 16000
};

export class GeminiLiveVoiceService {
  private static instance: GeminiLiveVoiceService | null = null;
  
  private ai: GoogleGenAI | null = null;
  private live: Live | null = null;
  private config: GeminiLiveConfig | null = null;
  private session: any = null;
  
  private state: GeminiLiveSessionState = 'disconnected';
  private listeners: Set<GeminiLiveEventListener> = new Set();
  private metrics: GeminiLiveMetrics = {
    audioInputMs: 0,
    sttLatencyMs: 0,
    inferenceMs: 0,
    ttsLatencyMs: 0,
    totalRoundTripMs: 0,
    droppedFrames: 0
  };

  // Audio handling
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private isRecording: boolean = false;
  
  // Playback handling
  private audioBufferQueue: AudioBuffer[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;
  
  // Transcript state
  private interimTranscript: string = '';
  private finalTranscript: string = '';

  private constructor() {}

  public static resetInstance(): void {
    GeminiLiveVoiceService.instance = null;
  }

  public static getInstance(): GeminiLiveVoiceService {
    if (!GeminiLiveVoiceService.instance) {
      GeminiLiveVoiceService.instance = new GeminiLiveVoiceService();
    }
    return GeminiLiveVoiceService.instance;
  }

  /**
   * Initialize the service with API key
   */
  public initialize(config: GeminiLiveConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config } as GeminiLiveConfig;
    this.ai = new GoogleGenAI({ apiKey: this.config.apiKey });
    this.live = this.ai.live as Live;
    
    this.emit('session.ended', { message: 'Service initialized' });
  }

  /**
   * Connect to Gemini Live API and start session
   */
  public async connect(): Promise<void> {
    if (!this.live || !this.config) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (this.state !== 'disconnected') {
      console.warn('[GeminiLive] Already connected or connecting');
      return;
    }

    this.setState('connecting');
    this.emit('session.started', { phase: 'connecting' });

    try {
      // Initialize audio context
      await this.initializeAudio();
      
      // Create Live session with callbacks
      this.session = await this.live.connect({
        model: this.config.model || 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            console.log('[GeminiLive] WebSocket connected');
            this.setState('connected');
            this.emit('session.started', { phase: 'connected' });
          },
          
          onmessage: (e: LiveServerMessage) => {
            this.handleServerMessage(e);
          },
          
          onerror: (e: any) => {
            console.error('[GeminiLive] WebSocket error:', e);
            this.setState('error');
            this.emit('session.error', { error: e });
          },
          
          onclose: () => {
            console.log('[GeminiLive] WebSocket closed');
            this.setState('disconnected');
            this.emit('session.ended', { reason: 'closed' });
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName || 'Puck'
              }
            }
          },
          systemInstruction: this.config.systemInstruction ? {
            parts: [{ text: this.config.systemInstruction }]
          } : undefined
        }
      });

    } catch (error: any) {
      console.error('[GeminiLive] Connection failed:', error);
      this.setState('error');
      this.emit('session.error', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize audio input/output
   */
  private async initializeAudio(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: this.config?.audioSampleRate || 16000,
          channelCount: 1
        }
      });

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.config?.audioSampleRate || 16000
      });

      // Create audio processor for streaming
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.audioProcessor.onaudioprocess = (e: any) => {
        if (this.isRecording && this.session) {
          const inputData = e.inputBuffer.getChannelData(0);
          this.sendAudioChunk(inputData);
        }
      };

      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      console.log('[GeminiLive] Audio initialized');
    } catch (error) {
      console.error('[GeminiLive] Audio initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle incoming server messages
   */
  private handleServerMessage(message: LiveServerMessage): void {
    const startTime = Date.now();

    // Handle transcription (STT)
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        // Text transcription
        if (part.text) {
          if (message.serverContent.turnComplete) {
            this.finalTranscript += part.text;
            this.emit('transcript.final', { text: part.text, full: this.finalTranscript });
            this.metrics.sttLatencyMs = Date.now() - startTime;
          } else {
            this.interimTranscript = part.text;
            this.emit('transcript.interim', { text: part.text });
          }
        }

        // Audio response
        if (part.inlineData) {
          this.setState('speaking');
          this.emit('response.content', { hasAudio: true });
          this.playAudioChunk(part.inlineData.data, part.inlineData.mimeType);
        }
      }
    }

    // Handle turn completion
    if (message.serverContent?.turnComplete) {
      this.setState('connected');
      this.emit('response.end', {});
      this.metrics.totalRoundTripMs = Date.now() - startTime;
    }

    // Handle setup completion
    if (message.setupComplete) {
      console.log('[GeminiLive] Setup complete, starting session...');
      this.setState('listening');
      this.startRecording();
    }

    // Handle session resumption
    if (message.sessionResumptionUpdate) {
      console.log('[GeminiLive] Session resumed');
    }
  }

  /**
   * Send audio chunk to server
   */
  private sendAudioChunk(audioData: Float32Array): void {
    if (!this.session) return;

    try {
      // Convert Float32 to Int16 PCM
      const pcmData = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        const val = audioData[i] * 32767;
        pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(val)));
      }

      // Convert to base64
      const base64Audio = this.arrayBufferToBase64(pcmData.buffer);

      const realtimeInput: LiveClientRealtimeInput = {
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm'
        }
      };

      this.session.send({ realtimeInput });
    } catch (error) {
      console.error('[GeminiLive] Failed to send audio:', error);
      this.metrics.droppedFrames++;
    }
  }

  /**
   * Play audio chunk from server
   */
  private async playAudioChunk(base64Data: string, mimeType: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode based on mime type
      let audioBuffer: AudioBuffer;
      
      if (mimeType.includes('pcm') || mimeType.includes('wav')) {
        audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      } else {
        // For other formats, use raw PCM
        audioBuffer = this.audioContext.createBuffer(1, bytes.length / 2, 16000);
        const channelData = audioBuffer.getChannelData(0);
        const int16Data = new Int16Array(bytes.buffer);
        for (let i = 0; i < int16Data.length; i++) {
          channelData[i] = int16Data[i] / 32768;
        }
      }

      this.audioBufferQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('[GeminiLive] Audio playback error:', error);
    }
  }

  /**
   * Play next audio buffer in queue
   */
  private playNextInQueue(): void {
    if (!this.audioContext || this.audioBufferQueue.length === 0 || !this.session) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buffer = this.audioBufferQueue.shift()!;
    
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.audioContext.destination);
    
    this.emit('audio.output.start', { duration: buffer.duration });

    this.currentSource.onended = () => {
      this.currentSource = null;
      if (this.session) {
        this.playNextInQueue();
      } else {
        this.isPlaying = false;
        this.setState('listening');
        this.emit('audio.output.stop', {});
      }
    };

    this.currentSource.start();
  }

  /**
   * Start recording audio
   */
  public startRecording(): void {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.emit('audio.input.start', {});
    this.emit('vad.speech_start', {});
  }

  /**
   * Stop recording audio
   */
  public stopRecording(): void {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    this.emit('audio.input.stop', {});
    this.emit('vad.speech_end', {});
  }

  /**
   * Trigger barge-in (interrupt current response)
   */
  public async bargeIn(): Promise<void> {
    if (this.state !== 'speaking') return;

    console.log('[GeminiLive] Barge-in triggered');
    
    // Stop current playback
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    
    // Clear audio queue
    this.audioBufferQueue = [];
    this.isPlaying = false;
    
    // Stop recording if active, then restart
    this.stopRecording();
    
    this.setState('interrupted');
    this.emit('barge_in.detected', {});
    
    // Brief pause then resume listening
    setTimeout(() => {
      if (this.session) {
        this.setState('listening');
        this.startRecording();
      }
    }, 100);
  }

  /**
   * Send text input (alternative to audio)
   */
  public sendText(text: string): void {
    if (!this.session) return;

    const content: LiveClientContent = {
      turns: [{
        role: 'user',
        parts: [{ text }]
      }]
    };

    this.session.send({ clientContent: content });
    this.setState('thinking');
    this.emit('response.start', { type: 'text' });
  }

  /**
   * Disconnect from Gemini Live API
   */
  public async disconnect(): Promise<void> {
    console.log('[GeminiLive] Disconnecting...');
    
    this.stopRecording();
    
    if (this.session) {
      try {
        this.session.close();
      } catch (e) {}
      this.session = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.setState('disconnected');
    this.emit('session.ended', { reason: 'manual_disconnect' });
  }

  /**
   * Subscribe to service events
   */
  public subscribe(listener: GeminiLiveEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event to all listeners
   */
  private emit(type: GeminiLiveEventType, data?: any): void {
    const event: GeminiLiveEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('[GeminiLive] Listener error:', e);
      }
    });
  }

  /**
   * Update state and emit state change
   */
  private setState(state: GeminiLiveSessionState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit(state as any, { previousState: this.state });
    }
  }

  /**
   * Get current session state
   */
  public getState(): GeminiLiveSessionState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): GeminiLiveMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current transcripts
   */
  public getTranscripts(): { interim: string; final: string } {
    return {
      interim: this.interimTranscript,
      final: this.finalTranscript
    };
  }

  /**
   * Clear transcripts
   */
  public clearTranscripts(): void {
    this.interimTranscript = '';
    this.finalTranscript = '';
  }

  /**
   * Check if service is ready
   */
  public isReady(): boolean {
    return this.state !== 'disconnected' && this.state !== 'error';
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  }
}

// Singleton export
export const geminiLiveVoiceService = GeminiLiveVoiceService.getInstance();
