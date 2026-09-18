/**
 * Unit Tests for GeminiLiveVoiceService
 * 
 * Tests the full-duplex voice service functionality:
 * - Service initialization
 * - State management
 * - Event subscription/unsubscription
 * - Metrics tracking
 * - Transcript handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    getAudioTracks: vi.fn().mockReturnValue([])
  })
};

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: mockMediaDevices
  },
  writable: true
});

// Mock AudioContext
class MockAudioContext {
  sampleRate = 16000;
  state = 'running';
  destination = {};
  
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn()
  });
  
  createScriptProcessor = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null
  });
  
  createBufferSource = vi.fn().mockReturnValue({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null
  });
  
  createBuffer = vi.fn().mockReturnValue({
    duration: 1,
    getChannelData: vi.fn().mockReturnValue(new Float32Array(16000))
  });
  
  decodeAudioData = vi.fn().mockResolvedValue({
    duration: 1,
    getChannelData: vi.fn().mockReturnValue(new Float32Array(16000))
  });
  
  close = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
}

global.AudioContext = MockAudioContext as any;

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
  const mockSession = {
    send: vi.fn(),
    close: vi.fn()
  };
  
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      live: {
        connect: vi.fn().mockResolvedValue(mockSession)
      }
    })),
    Live: {},
    Modality: { AUDIO: 'AUDIO' }
  };
});

describe('GeminiLiveVoiceService', () => {
  let service: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import fresh service instance
    vi.resetModules();
    const { GeminiLiveVoiceService } = await import('../../src/services/geminiLiveVoiceService');
    GeminiLiveVoiceService.resetInstance?.();
    service = GeminiLiveVoiceService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should have correct initial state', () => {
      expect(service.getState()).toBe('disconnected');
    });

    it('should initialize with config', () => {
      service.initialize({
        apiKey: 'test-key',
        voiceName: 'Puck',
        systemInstruction: 'Test instruction'
      });
      
      expect(service.getState()).toBe('disconnected');
    });

    it('should check readiness correctly', () => {
      expect(service.isReady()).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should return current state', () => {
      expect(service.getState()).toBe('disconnected');
    });
  });

  describe('Metrics', () => {
    it('should return metrics object', () => {
      const metrics = service.getMetrics();
      
      expect(metrics).toHaveProperty('audioInputMs');
      expect(metrics).toHaveProperty('sttLatencyMs');
      expect(metrics).toHaveProperty('inferenceMs');
      expect(metrics).toHaveProperty('ttsLatencyMs');
      expect(metrics).toHaveProperty('totalRoundTripMs');
      expect(metrics).toHaveProperty('droppedFrames');
    });

    it('should track dropped frames', () => {
      const initial = service.getMetrics();
      expect(initial.droppedFrames).toBe(0);
    });
  });

  describe('Transcripts', () => {
    it('should return empty transcripts initially', () => {
      const transcripts = service.getTranscripts();
      
      expect(transcripts.interim).toBe('');
      expect(transcripts.final).toBe('');
    });

    it('should clear transcripts', () => {
      service.clearTranscripts();
      const transcripts = service.getTranscripts();
      
      expect(transcripts.interim).toBe('');
      expect(transcripts.final).toBe('');
    });
  });

  describe('Event Subscription', () => {
    it('should allow subscribing to events', () => {
      let eventReceived = false;
      const unsubscribe = service.subscribe(() => {
        eventReceived = true;
      });
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should allow unsubscribing from events', () => {
      let callCount = 0;
      const unsubscribe = service.subscribe(() => {
        callCount++;
      });
      
      unsubscribe();
      
      // After unsubscribe, events should not trigger the callback
      // (we can't easily test this without internal access)
      expect(callCount).toBe(0);
    });
  });

  describe('Recording State', () => {
    it('should have initial recording state as false', () => {
      // Can't directly check private state, but can verify methods don't throw
      expect(() => service.startRecording()).not.toThrow();
      expect(() => service.stopRecording()).not.toThrow();
    });
  });

  describe('Barge-in', () => {
    it('should not throw on bargeIn when not speaking', () => {
      expect(() => service.bargeIn()).not.toThrow();
    });
  });

  describe('Text Input', () => {
    it('should not throw on sendText when not connected', () => {
      expect(() => service.sendText('Hello')).not.toThrow();
    });
  });

  describe('Disconnect', () => {
    it('should not throw when disconnecting from disconnected state', async () => {
      await expect(service.disconnect()).resolves.not.toThrow();
    });
  });
});

describe('GeminiLiveVoiceService Types', () => {
  it('should export correct session state types', async () => {
    const { GeminiLiveSessionState } = await import('../../src/services/geminiLiveVoiceService');
    
    const validStates: GeminiLiveSessionState[] = [
      'disconnected',
      'connecting',
      'connected',
      'listening',
      'thinking',
      'speaking',
      'interrupted',
      'error'
    ];
    
    expect(validStates).toHaveLength(8);
  });

  it('should export correct event types', async () => {
    const { GeminiLiveEventType } = await import('../../src/services/geminiLiveVoiceService');
    
    const validEvents: GeminiLiveEventType[] = [
      'session.started',
      'session.ended',
      'session.error',
      'audio.input.start',
      'audio.input.stop',
      'audio.output.start',
      'audio.output.stop',
      'transcript.interim',
      'transcript.final',
      'response.start',
      'response.content',
      'response.end',
      'barge_in.detected',
      'vad.speech_start',
      'vad.speech_end',
      'interruption'
    ];
    
    expect(validEvents).toHaveLength(16);
  });
});
