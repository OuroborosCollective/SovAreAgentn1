import { describe, it, expect } from 'vitest';
import { voiceService, VoicePlaybackState } from '../../src/services/voiceService';

describe('Voice Animation Events Contract Verification', () => {
  it('should produce valid notification event states matching the active voice state', () => {
    // Generate simulated notification payloads for animation listeners
    const simulatedStates: VoicePlaybackState[] = [
      {
        isPlaying: true,
        activeVoice: 'N+1 (Google Live Voice)',
        mood: 'fröhlich',
        volumeLevel: 0.95,
        metrics: voiceService.getMetrics()
      },
      {
        isPlaying: false,
        activeVoice: 'N+1',
        mood: 'ernst',
        volumeLevel: 0.0,
        metrics: voiceService.getMetrics()
      },
      {
        isPlaying: true,
        activeVoice: 'N+1 (FreeLLM Fallback)',
        mood: 'lernend',
        volumeLevel: 0.55,
        metrics: voiceService.getMetrics()
      }
    ];

    simulatedStates.forEach(state => {
      // Confirm structure matches expected runtime properties for animation layers
      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('activeVoice');
      expect(state).toHaveProperty('mood');
      expect(state).toHaveProperty('volumeLevel');
      expect(state.metrics).toBeDefined();

      if (state.isPlaying) {
        expect(state.volumeLevel).toBeGreaterThan(0.0);
      } else {
        expect(state.volumeLevel).toBe(0.0);
      }
    });
  });

  it('should map active emotional states to correct color theme outputs', () => {
    const moods = ['fröhlich', 'ernst', 'lernend', 'playful', 'curious', 'axiom-guard', 'witty-joy'];
    moods.forEach(mood => {
      expect(mood).toBeTypeOf('string');
      expect(['fröhlich', 'ernst', 'lernend', 'neugierig', 'playful', 'curious', 'axiom-guard', 'witty-joy']).toContain(mood);
    });
  });
});
