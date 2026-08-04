import { describe, it, expect } from 'vitest';
import { EmotionEngine, EmotionEvent, seededRandom } from '../../src/services/emotionEngine';

describe('N+1 EmotionEngine (Issue #23 Contract)', () => {
  it('transition model maintains correct current state and records transition details', () => {
    const engine = new EmotionEngine();
    expect(engine.getCurrentState()).toBe('ruhig');

    const event: EmotionEvent = {
      eventId: 'evt-1',
      timestamp: Date.now(),
      sourceType: 'user_input',
      cause: 'Papa fragt nach Sternen',
      intensity: 0.9,
      durationMs: 0,
      priority: 4,
      suggestedState: 'neugierig'
    };

    const nextState = engine.triggerEvent(event);
    expect(nextState).toBe('neugierig');
    expect(engine.getCurrentState()).toBe('neugierig');
    expect(engine.getTransitionHistory()).toHaveLength(1);
    expect(engine.getTransitionHistory()[0].fromState).toBe('ruhig');
    expect(engine.getTransitionHistory()[0].toState).toBe('neugierig');
  });

  it('same event sequence produces the exact same deterministic states and variances (seed test)', () => {
    const sequence: EmotionEvent[] = [
      { eventId: 'evt-a', timestamp: Date.now(), sourceType: 'dialog_intent', cause: 'Story', intensity: 0.8, durationMs: 0, priority: 3, suggestedState: 'fröhlich', seed: 42 },
      { eventId: 'evt-b', timestamp: Date.now(), sourceType: 'expression_signal', cause: 'Laugh', intensity: 0.95, durationMs: 0, priority: 6, suggestedState: 'verspielt', seed: 99 }
    ];

    const engineA = new EmotionEngine();
    const engineB = new EmotionEngine();

    sequence.forEach(evt => engineA.triggerEvent(evt));
    sequence.forEach(evt => engineB.triggerEvent(evt));

    expect(engineA.getCurrentState()).toBe(engineB.getCurrentState());
    expect(engineA.getTransitionHistory()[0].deterministicVariance).toBe(engineB.getTransitionHistory()[0].deterministicVariance);
    expect(engineA.getTransitionHistory()[1].deterministicVariance).toBe(engineB.getTransitionHistory()[1].deterministicVariance);
  });

  it('offline/error states override lower priority states and are displayed honestly', () => {
    const engine = new EmotionEngine();

    // Trigger high-intensity playful event
    engine.triggerEvent({
      eventId: 'evt-play',
      timestamp: Date.now(),
      sourceType: 'dialog_intent',
      cause: 'Joke',
      intensity: 0.9,
      durationMs: 0,
      priority: 4,
      suggestedState: 'verspielt'
    });
    expect(engine.getCurrentState()).toBe('verspielt');

    // Trigger a network / provider failing event with top priority
    engine.triggerEvent({
      eventId: 'evt-err',
      timestamp: Date.now(),
      sourceType: 'runtime_state',
      cause: 'Provider rate limited 429',
      intensity: 1.0,
      durationMs: 0,
      priority: 10,
      suggestedState: 'offline/unsicher'
    });

    expect(engine.getCurrentState()).toBe('offline/unsicher');
  });

  it('conflicts are resolved using priority queues correctly', () => {
    const engine = new EmotionEngine();
    const now = Date.now();

    // Trigger a high priority event (Aha-moment)
    engine.triggerEvent({
      eventId: 'evt-aha',
      timestamp: now,
      sourceType: 'learning_event',
      cause: 'New pattern indexed',
      intensity: 0.8,
      durationMs: 5000, // active for 5 seconds
      priority: 8,
      suggestedState: 'stolz'
    });

    expect(engine.getCurrentState()).toBe('stolz');

    // Trigger a lower priority event during the active duration of the high priority one
    engine.triggerEvent({
      eventId: 'evt-chat',
      timestamp: now + 500,
      sourceType: 'dialog_intent',
      cause: 'Friendly chatter',
      intensity: 0.5,
      durationMs: 0,
      priority: 4,
      suggestedState: 'fröhlich'
    });

    // Should remain 'stolz' because the active event is higher priority (8 > 4)
    expect(engine.getCurrentState()).toBe('stolz');
  });
});
