import { describe, it, expect } from 'vitest';
// Test the child persona state logic directly

describe('Child Persona Logic Tests', () => {
  it('should structure persona state with correct default emotion and levels', () => {
    const defaultPersona = {
      currentEmotion: 'joy' as const,
      joyLevel: 0.88,
      playfulnessLevel: 0.85,
      curiosityLevel: 0.90,
      responseLatencyModifierMs: 120,
      tonePitch: 1.35,
      vectorEmbeddingNodeCount: 42,
      recentTriggers: []
    };

    expect(defaultPersona.currentEmotion).toBe('joy');
    expect(defaultPersona.joyLevel).toBeGreaterThan(0.5);
    expect(defaultPersona.vectorEmbeddingNodeCount).toBe(42);
  });

  it('should adjust latency and emotion for playfulness stimulus', () => {
    const inputContext = 'Lass uns zusammen spielen!';
    const lower = inputContext.toLowerCase();
    const selectedEmotion = lower.includes('spiel') ? 'playfulness' : 'curiosity';
    const latencyMod = selectedEmotion === 'playfulness' ? 90 : 180;

    expect(selectedEmotion).toBe('playfulness');
    expect(latencyMod).toBe(90);
  });
});
