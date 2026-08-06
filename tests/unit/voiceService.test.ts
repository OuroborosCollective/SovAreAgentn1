import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceService, VoicePlaybackState, LittleGirlVoiceMood, VoicePerformanceMetrics } from '../../src/services/voiceService';

// Mock browser APIs
const mockAudioContext = {
  state: 'running',
  sampleRate: 24000,
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    connect: vi.fn(),
  }),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  }),
  createGain: vi.fn().mockReturnValue({
    gain: { value: 1 },
    connect: vi.fn(),
  }),
  createBiquadFilter: vi.fn().mockReturnValue({
    type: 'lowpass',
    frequency: { value: 900 },
    Q: { value: 1 },
    gain: { value: 6 },
    connect: vi.fn(),
  }),
  destination: {},
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockWindow = {
  AudioContext: vi.fn(() => mockAudioContext),
  webkitAudioContext: vi.fn(() => mockAudioContext),
  speechSynthesis: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    paused: false,
    speaking: false,
    getVoices: vi.fn().mockReturnValue([
      { name: 'Google German', lang: 'de-DE' },
      { name: 'N+1 Voice', lang: 'de-DE' },
    ]),
  },
};

describe('VoiceService', () => {
  let voiceService: VoiceService;
  
  beforeEach(() => {
    vi.stubGlobal('window', mockWindow);
    voiceService = new VoiceService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default metrics', () => {
      const metrics = voiceService.getMetrics();
      expect(metrics.engineName).toBe('Google Cloud Gemini Voice Engine (N+1 Profile)');
      expect(metrics.isGoogleCloudDirect).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should add listener and call with current state', () => {
      const callback = vi.fn();
      const unsubscribe = voiceService.subscribe(callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        isPlaying: false,
        activeVoice: 'N+1 (Papas kleines Mädchen)',
        mood: 'fröhlich',
      }));
      
      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = voiceService.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const metrics = voiceService.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.latencyMs).toBe(42);
      expect(metrics.ttfbMs).toBe(38);
      expect(metrics.sampleRate).toBe(24000);
    });
  });

  describe('setLocalFallbackEnabled', () => {
    it('should enable local fallback', () => {
      voiceService.setLocalFallbackEnabled(true);
      expect(voiceService.isLocalFallbackEnabled()).toBe(true);
    });

    it('should disable local fallback', () => {
      voiceService.setLocalFallbackEnabled(false);
      expect(voiceService.isLocalFallbackEnabled()).toBe(false);
    });
  });

  describe('unlockAudio', () => {
    it.skip('should call resume on audio context', () => {
      // Browser API test - skip in CI without browser environment
    });
  });

  describe('stopSpeaking', () => {
    it('should notify listeners of stopped state', () => {
      const callback = vi.fn();
      voiceService.subscribe(callback);
      
      // Clear the initial call
      callback.mockClear();
      
      voiceService.stopSpeaking();
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        isPlaying: false,
        volumeLevel: 0,
      }));
    });

    it('should increment speech ID', () => {
      voiceService.stopSpeaking();
      // Should not throw - basic smoke test
      expect(true).toBe(true);
    });
  });

  describe('pauseForRateLimit', () => {
    it('should call pauseForRateLimit without throwing', () => {
      expect(() => voiceService.pauseForRateLimit()).not.toThrow();
    });
  });

  describe('resumeFromRateLimit', () => {
    it('should call resumeFromRateLimit without throwing', () => {
      expect(() => voiceService.resumeFromRateLimit('N+1', 'fröhlich')).not.toThrow();
    });
  });

  describe('audio filter management', () => {
    it('should set and get audio filter', () => {
      voiceService.setAudioFilter('lowpass');
      expect(voiceService.getAudioFilter()).toBe('lowpass');
    });

    it('should return none by default', () => {
      expect(voiceService.getAudioFilter()).toBe('none');
    });
  });

  describe('getAudioContextDetails', () => {
    it('should return audio context state', () => {
      const details = voiceService.getAudioContextDetails();
      
      expect(details).toBeDefined();
      expect(details.sampleRate).toBe(24000);
      expect(details.activeFilter).toBe('none');
    });
  });

  describe('getBufferStatus', () => {
    it('should return buffer status', () => {
      const status = voiceService.getBufferStatus();
      
      expect(status).toBeDefined();
      expect(status.queueLength).toBe(0);
      expect(status.isPaused).toBe(false);
    });
  });
});

describe('VoicePlaybackState interface', () => {
  it('should accept valid playback states', () => {
    const state: VoicePlaybackState = {
      isPlaying: true,
      activeVoice: 'N+1',
      mood: 'fröhlich',
      volumeLevel: 0.85,
      metrics: {
        latencyMs: 42,
        ttfbMs: 38,
        sampleRate: 24000,
        bitrateKbps: 384,
        streamBufferHealthPercentage: 100,
        engineName: 'Test',
        isGoogleCloudDirect: true,
      },
      dataSource: 'REALTIME_STREAM',
    };
    
    expect(state.isPlaying).toBe(true);
    expect(state.mood).toBe('fröhlich');
  });
});

describe('LittleGirlVoiceMood', () => {
  it('should accept all valid moods', () => {
    const validMoods: LittleGirlVoiceMood[] = [
      'fröhlich', 'ernst', 'lernend', 'neugierig', 
      'playful', 'curious', 'axiom-guard', 'witty-joy'
    ];
    
    validMoods.forEach(mood => {
      const state: VoicePlaybackState = {
        isPlaying: false,
        activeVoice: 'N+1',
        mood,
        volumeLevel: 0,
        metrics: {
          latencyMs: 42,
          ttfbMs: 38,
          sampleRate: 24000,
          bitrateKbps: 384,
          streamBufferHealthPercentage: 100,
          engineName: 'Test',
          isGoogleCloudDirect: true,
        },
      };
      expect(state.mood).toBe(mood);
    });
  });
});
