import { describe, it, expect, beforeEach } from 'vitest';
import { 
  EmotionEngine, 
  emotionEngine, 
  seededRandom,
  N1EmotionState 
} from '../../src/services/emotionEngine';

describe('EmotionEngine - Deterministic State Machine', () => {
  let engine: EmotionEngine;

  beforeEach(() => {
    engine = new EmotionEngine();
  });

  describe('seededRandom', () => {
    it('should produce deterministic values', () => {
      const val1 = seededRandom(12345);
      const val2 = seededRandom(12345);
      expect(val1).toBe(val2);
    });

    it('should produce values between 0 and 1', () => {
      const val = seededRandom(42);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });

    it('should produce different values for different seeds', () => {
      const val1 = seededRandom(100);
      const val2 = seededRandom(200);
      expect(val1).not.toBe(val2);
    });
  });

  describe('getCurrentState', () => {
    it('should return initial state as ruhig', () => {
      expect(engine.getCurrentState()).toBe('ruhig');
    });
  });

  describe('triggerEvent', () => {
    it('should transition to suggested state', () => {
      const event = {
        eventId: 'test-1',
        timestamp: Date.now(),
        sourceType: 'user_input' as const,
        cause: 'Test event',
        intensity: 0.8,
        durationMs: 5000,
        priority: 5,
        suggestedState: 'fröhlich' as N1EmotionState
      };

      const newState = engine.triggerEvent(event);
      expect(newState).toBe('fröhlich');
    });

    it('should override with high priority runtime_state', () => {
      // First set a different state
      engine.triggerEvent({
        eventId: 'low-priority',
        timestamp: Date.now(),
        sourceType: 'user_input',
        cause: 'User happy',
        intensity: 0.5,
        durationMs: 0,
        priority: 3,
        suggestedState: 'fröhlich'
      });

      // Then trigger high priority offline state
      const offlineEvent = {
        eventId: 'high-priority',
        timestamp: Date.now(),
        sourceType: 'runtime_state' as const,
        cause: 'Network offline',
        intensity: 1.0,
        durationMs: 0,
        priority: 10,
        suggestedState: 'offline/unsicher' as N1EmotionState
      };

      const newState = engine.triggerEvent(offlineEvent);
      expect(newState).toBe('offline/unsicher');
    });

    it('should respect event duration', () => {
      const event = {
        eventId: 'timed-event',
        timestamp: Date.now(),
        sourceType: 'dialog_intent',
        cause: 'Brief excitement',
        intensity: 0.6,
        durationMs: 1000, // 1 second
        priority: 5,
        suggestedState: 'überrascht' as N1EmotionState
      };

      const newState = engine.triggerEvent(event);
      expect(newState).toBe('überrascht');
    });

    it('should log transitions', () => {
      engine.triggerEvent({
        eventId: 'transition-test',
        timestamp: Date.now(),
        sourceType: 'user_input',
        cause: 'Test',
        intensity: 0.7,
        durationMs: 0,
        priority: 4,
        suggestedState: 'neugierig'
      });

      const history = engine.getTransitionHistory();
      expect(history.length).toBe(1);
      expect(history[0].fromState).toBe('ruhig');
      expect(history[0].toState).toBe('neugierig');
    });
  });

  describe('signalToState', () => {
    it('should map smile to fröhlich', () => {
      expect(engine.signalToState('smile')).toBe('fröhlich');
    });

    it('should map nod to ruhig', () => {
      expect(engine.signalToState('nod')).toBe('ruhig');
    });

    it('should map think to nachdenklich', () => {
      expect(engine.signalToState('think')).toBe('nachdenklich');
    });

    it('should map concerned to offline/unsicher', () => {
      expect(engine.signalToState('concerned')).toBe('offline/unsicher');
    });

    it('should map laugh to verspielt', () => {
      expect(engine.signalToState('laugh')).toBe('verspielt');
    });
  });

  describe('getEventHistory', () => {
    it('should track all events', () => {
      engine.triggerEvent({
        eventId: 'event-1',
        timestamp: Date.now(),
        sourceType: 'user_input',
        cause: 'First',
        intensity: 0.5,
        durationMs: 0,
        priority: 3,
        suggestedState: 'fröhlich'
      });

      engine.triggerEvent({
        eventId: 'event-2',
        timestamp: Date.now(),
        sourceType: 'dialog_intent',
        cause: 'Second',
        intensity: 0.6,
        durationMs: 0,
        priority: 4,
        suggestedState: 'neugierig'
      });

      const history = engine.getEventHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('resetEngine', () => {
    it('should reset to initial state', () => {
      engine.triggerEvent({
        eventId: 'change-state',
        timestamp: Date.now(),
        sourceType: 'user_input',
        cause: 'Change',
        intensity: 0.8,
        durationMs: 0,
        priority: 5,
        suggestedState: 'stolz'
      });

      engine.resetEngine();

      expect(engine.getCurrentState()).toBe('ruhig');
      expect(engine.getEventHistory().length).toBe(0);
      expect(engine.getTransitionHistory().length).toBe(0);
    });
  });

  describe('singleton instance', () => {
    it('should export singleton emotionEngine', () => {
      expect(emotionEngine).toBeDefined();
      expect(emotionEngine.getCurrentState()).toBeDefined();
    });
  });
});
