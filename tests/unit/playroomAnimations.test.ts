import { describe, it, expect } from 'vitest';
import {
  EMOTION_COLORS,
  EMOTION_SHAPES,
  EMOTION_MOTIONS,
  LEARNING_CELEBRATIONS,
  VOICE_REACTIONS,
  LearningCelebration,
  VoiceReaction,
  N1EmotionState
} from '../../src/components/PlayroomAnimations';

describe('PlayroomAnimations - Rich Visual Effects', () => {
  describe('Emotion Colors', () => {
    it('should have colors for each emotion state', () => {
      const emotionStates: N1EmotionState[] = [
        'ruhig', 'fröhlich', 'neugierig', 'verspielt',
        'nachdenklich', 'überrascht', 'stolz', 'tröstend', 'müde', 'offline/unsicher'
      ];

      emotionStates.forEach(emotion => {
        expect(EMOTION_COLORS[emotion]).toBeDefined();
        expect(EMOTION_COLORS[emotion].length).toBeGreaterThan(0);
        EMOTION_COLORS[emotion].forEach(color => {
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });

    it('should have 4 gradient colors per emotion', () => {
      Object.values(EMOTION_COLORS).forEach(colors => {
        expect(colors.length).toBe(4);
      });
    });

    it('should have calm green colors for ruhig', () => {
      const colors = EMOTION_COLORS['ruhig'];
      expect(colors[0]).toBe('#10b981');
    });

    it('should have happy yellow/gold colors for fröhlich', () => {
      const colors = EMOTION_COLORS['fröhlich'];
      expect(colors[0]).toBe('#fbbf24');
    });
  });

  describe('Emotion Shapes', () => {
    it('should have shapes for each emotion', () => {
      const emotionStates: N1EmotionState[] = [
        'ruhig', 'fröhlich', 'neugierig', 'verspielt',
        'nachdenklich', 'überrascht', 'stolz', 'tröstend', 'müde', 'offline/unsicher'
      ];

      emotionStates.forEach(emotion => {
        expect(EMOTION_SHAPES[emotion]).toBeDefined();
        expect(EMOTION_SHAPES[emotion].length).toBeGreaterThan(0);
      });
    });

    it('should have playful shapes for fröhlich', () => {
      const shapes = EMOTION_SHAPES['fröhlich'];
      expect(shapes).toContain('star');
      expect(shapes).toContain('sparkle');
      expect(shapes).toContain('heart');
    });

    it('should have calm shapes for ruhig', () => {
      const shapes = EMOTION_SHAPES['ruhig'];
      expect(shapes).toContain('cloud');
      expect(shapes).toContain('bubble');
    });
  });

  describe('Emotion Motions', () => {
    it('should have motions for each emotion', () => {
      const emotionStates: N1EmotionState[] = [
        'ruhig', 'fröhlich', 'neugierig', 'verspielt',
        'nachdenklich', 'überrascht', 'stolz', 'tröstend', 'müde', 'offline/unsicher'
      ];

      emotionStates.forEach(emotion => {
        expect(EMOTION_MOTIONS[emotion]).toBeDefined();
        expect(EMOTION_MOTIONS[emotion].length).toBeGreaterThan(0);
      });
    });

    it('should have bounce/jump for fröhlich', () => {
      const motions = EMOTION_MOTIONS['fröhlich'];
      expect(motions).toContain('bounce');
      expect(motions).toContain('jump');
    });

    it('should have sleep for müde', () => {
      const motions = EMOTION_MOTIONS['müde'];
      expect(motions).toContain('sleep');
    });
  });

  describe('Learning Celebrations', () => {
    it('should have celebration for each learning type', () => {
      expect(LEARNING_CELEBRATIONS['aha']).toBeDefined();
      expect(LEARNING_CELEBRATIONS['correction']).toBeDefined();
      expect(LEARNING_CELEBRATIONS['repeat']).toBeDefined();
      expect(LEARNING_CELEBRATIONS['new']).toBeDefined();
    });

    it('should have aha emoji for learning', () => {
      const celebration = LEARNING_CELEBRATIONS['aha'];
      expect(celebration.emoji).toBe('💡');
    });

    it('should have valid duration for each celebration', () => {
      Object.values(LEARNING_CELEBRATIONS).forEach((celebration: LearningCelebration) => {
        expect(celebration.duration).toBeGreaterThan(0);
      });
    });
  });

  describe('Voice Reactions', () => {
    it('should have reactions for common voice interactions', () => {
      expect(VOICE_REACTIONS['greeting']).toBeDefined();
      expect(VOICE_REACTIONS['question']).toBeDefined();
      expect(VOICE_REACTIONS['happy']).toBeDefined();
    });

    it('should have happy emotion for greeting', () => {
      const reaction = VOICE_REACTIONS['greeting'];
      expect(reaction.emotion).toBe('fröhlich');
      expect(reaction.intensity).toBeGreaterThan(0.5);
    });

    it('should have valid duration for each reaction', () => {
      Object.values(VOICE_REACTIONS).forEach((reaction: VoiceReaction) => {
        expect(reaction.duration).toBeGreaterThan(0);
        expect(reaction.intensity).toBeGreaterThan(0);
        expect(reaction.intensity).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Color Psychology', () => {
    it('should use calming colors for ruhig', () => {
      const colors = EMOTION_COLORS['ruhig'];
      expect(colors[0]).toContain('10b981');
    });

    it('should use warm colors for fröhlich', () => {
      const colors = EMOTION_COLORS['fröhlich'];
      expect(colors[0]).toBe('#fbbf24');
    });

    it('should use cool colors for neugierig', () => {
      const colors = EMOTION_COLORS['neugierig'];
      expect(colors[0]).toBe('#3b82f6');
    });
  });
});
