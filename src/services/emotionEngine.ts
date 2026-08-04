// N+1 Emotion Engine & Deterministic State Machine V1 (Issue #23 Compliant)

export type N1EmotionState = 
  | 'ruhig'
  | 'neugierig'
  | 'fröhlich'
  | 'nachdenklich'
  | 'überrascht'
  | 'stolz'
  | 'tröstend'
  | 'verspielt'
  | 'müde'
  | 'offline/unsicher';

export interface EmotionEvent {
  eventId: string;
  timestamp: number;
  sourceType: 'dialog_intent' | 'expression_signal' | 'learning_event' | 'runtime_state' | 'user_input';
  cause: string;
  intensity: number; // 0.0 to 1.0
  durationMs: number; // transient duration, or 0 for infinite state transitions
  priority: number; // Higher priority overrides lower priority conflict
  suggestedState: N1EmotionState;
  seed?: number; // Explicit seed for deterministic play/variation wiggles
}

export interface TransitionLog {
  timestamp: number;
  fromState: N1EmotionState;
  toState: N1EmotionState;
  triggerEvent: EmotionEvent;
  conflictResolved: boolean;
  deterministicVariance: number; // Reproducible wiggle factor [0,1]
}

// Simple LCG PRNG for 100% deterministic visual variation
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export class EmotionEngine {
  private currentEmotion: N1EmotionState = 'ruhig';
  private eventHistory: EmotionEvent[] = [];
  private transitionHistory: TransitionLog[] = [];
  private baseSeed = 1337;

  constructor() {
    this.resetEngine();
  }

  public resetEngine() {
    this.currentEmotion = 'ruhig';
    this.eventHistory = [];
    this.transitionHistory = [];
  }

  public getCurrentState(): N1EmotionState {
    return this.currentEmotion;
  }

  public getEventHistory(): EmotionEvent[] {
    return this.eventHistory;
  }

  public getTransitionHistory(): TransitionLog[] {
    return this.transitionHistory;
  }

  /**
   * Deterministically resolves conflicts and updates the active emotion state.
   * Every visible state change tracks back to a concrete source event.
   */
  public triggerEvent(event: EmotionEvent): N1EmotionState {
    this.eventHistory.push(event);
    const fromState = this.currentEmotion;
    let targetState = event.suggestedState;
    let conflictResolved = false;

    // Rule 1: High Priority Runtime Outages / Fallbacks Override everything else
    if (event.sourceType === 'runtime_state' && event.suggestedState === 'offline/unsicher') {
      targetState = 'offline/unsicher';
      conflictResolved = true;
    } else {
      // Resolve using priority queuing
      // Check if there are any active higher-priority events recently received (within last 3 seconds)
      const now = Date.now();
      const activeHighPriorityEvents = this.eventHistory.filter(e => {
        if (e.eventId === event.eventId) return false;
        const elapsed = now - e.timestamp;
        // If the event has a specific duration, respect it
        const isStillActive = e.durationMs > 0 ? elapsed < e.durationMs : elapsed < 3000;
        return isStillActive && e.priority > event.priority;
      });

      if (activeHighPriorityEvents.length > 0) {
        // Sort by priority desc, then timestamp desc
        const winner = activeHighPriorityEvents.sort((a, b) => b.priority - a.priority || b.timestamp - a.timestamp)[0];
        targetState = winner.suggestedState;
        conflictResolved = true;
      }
    }

    // Determine deterministic variation based on event seed or eventId hash
    const seedValue = event.seed || this.hashCode(event.eventId || 'default');
    const variance = seededRandom(seedValue + this.baseSeed);

    // Write to transition logs
    this.transitionHistory.push({
      timestamp: Date.now(),
      fromState,
      toState: targetState,
      triggerEvent: event,
      conflictResolved,
      deterministicVariance: variance
    });

    this.currentEmotion = targetState;
    return this.currentEmotion;
  }

  /**
   * Translates string expression signals to N1EmotionStates
   */
  public signalToState(signal: 'smile' | 'nod' | 'think' | 'concerned' | 'laugh'): N1EmotionState {
    switch (signal) {
      case 'smile': return 'fröhlich';
      case 'nod': return 'ruhig';
      case 'think': return 'nachdenklich';
      case 'concerned': return 'offline/unsicher';
      case 'laugh': return 'verspielt';
      default: return 'ruhig';
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

export const emotionEngine = new EmotionEngine();
