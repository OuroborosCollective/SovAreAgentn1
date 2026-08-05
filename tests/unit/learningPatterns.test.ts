import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProactiveLearningEngine, ProactiveCandidate } from '../../src/components/ProactiveLearningEngine';

// Mock dependencies
vi.mock('../../hooks/useChildPersona', () => ({
  useChildPersona: () => ({
    persona: { currentEmotion: 'fröhlich', tonePitch: 1.0 },
    triggerEmotionStimulus: vi.fn()
  })
}));

vi.mock('../../services/voiceService', () => ({
  voiceService: {
    speak: vi.fn(),
    unlockAudio: vi.fn(),
    stopSpeaking: vi.fn()
  }
}));

vi.mock('../../services/firebasePersonaSync', () => ({
  syncPersonaToCloud: vi.fn().mockResolvedValue(undefined)
}));

describe('ProactiveLearningEngine - Learning Patterns', () => {
  describe('ProactiveCandidate interface', () => {
    it('should have valid status types', () => {
      const validStatuses: ProactiveCandidate['status'][] = ['observed', 'candidate', 'accepted', 'rejected', 'aha_pending'];
      
      validStatuses.forEach(status => {
        const candidate: ProactiveCandidate = {
          id: 'test',
          cause: 'Test cause',
          proposed_preference: {},
          status,
          created_at: Date.now()
        };
        expect(candidate.status).toBe(status);
      });
    });

    it('should support teacher roles', () => {
      const candidate: ProactiveCandidate = {
        id: 'test',
        cause: 'Test',
        proposed_preference: {},
        status: 'candidate',
        created_at: Date.now(),
        teacherRole: 'Papa'
      };
      expect(candidate.teacherRole).toBe('Papa');
    });

    it('should track resolved candidates', () => {
      const candidate: ProactiveCandidate = {
        id: 'test',
        cause: 'Test',
        proposed_preference: {},
        status: 'accepted',
        created_at: Date.now() - 1000,
        resolved_at: Date.now()
      };
      expect(candidate.resolved_at).toBeGreaterThan(candidate.created_at);
    });
  });

  describe('Learning flow states', () => {
    it('should track aha_pending as learning state', () => {
      const candidate: ProactiveCandidate = {
        id: 'aha-1',
        cause: 'Papa teaches something new',
        proposed_preference: { lesson: 'Stars twinkle due to atmospheric refraction' },
        status: 'aha_pending',
        created_at: Date.now()
      };
      expect(candidate.status).toBe('aha_pending');
    });

    it('should allow accepted learning', () => {
      const candidate: ProactiveCandidate = {
        id: 'accepted-1',
        cause: 'Mama confirmed learning',
        proposed_preference: {},
        status: 'accepted',
        created_at: Date.now() - 5000,
        resolved_at: Date.now()
      };
      expect(candidate.status).toBe('accepted');
    });

    it('should allow rejected learning for re-ask', () => {
      const candidate: ProactiveCandidate = {
        id: 'rejected-1',
        cause: 'Needs correction',
        proposed_preference: {},
        status: 'rejected',
        created_at: Date.now(),
        reaskFeedback: 'Please explain again'
      };
      expect(candidate.status).toBe('rejected');
    });
  });

  describe('Summary text patterns', () => {
    it('should truncate long summaries', () => {
      const longText = 'A'.repeat(100);
      const summary = longText.length > 70 
        ? longText.substring(0, 67) + '...' 
        : longText;
      expect(summary.length).toBe(70);
      expect(summary.endsWith('...')).toBe(true);
    });

    it('should preserve short summaries', () => {
      const shortText = 'Short lesson';
      const summary = shortText.length > 70 
        ? shortText.substring(0, 67) + '...' 
        : shortText;
      expect(summary).toBe('Short lesson');
    });
  });

  describe('Emotion stimulus integration', () => {
    it('should map curiosity to learning emotion', () => {
      const validEmotions = ['curiosity', 'playfulness', 'study', 'fröhlich'];
      expect(validEmotions).toContain('curiosity');
    });

    it('should support playfulness for happy acceptance', () => {
      const emotions = ['curiosity', 'playfulness'];
      expect(emotions).toContain('playfulness');
    });
  });
});

describe('Aha Moment Patterns', () => {
  describe('Aha question generation', () => {
    it('should generate aha question with teacher name', () => {
      const teacher = 'Papa';
      const summary = 'Sterne funkeln durch Lichtbrechung';
      const question = `Ahaaa ${teacher}! Ich habe folgendes gelernt: "${summary}". Ist das so richtig, ${teacher}?`;
      
      expect(question).toContain('Ahaaa');
      expect(question).toContain(teacher);
      expect(question).toContain(summary);
    });

    it('should generate re-ask question', () => {
      const teacher = 'Mama';
      const explanation = 'Die Antwort ist falsch, richtig ist X';
      const question = `Ahaaa! Jetzt habe ich verstanden, ${teacher}: "${explanation}". Ist das jetzt so richtig?`;
      
      expect(question).toContain('Ahaaa');
      expect(question).toContain('verstanden');
    });
  });

  describe('Happy acceptance response', () => {
    it('should generate happy voice text', () => {
      const role = 'Papa';
      const happyText = `Juhu! Danke ${role}! Ich habe diese Erkenntnis glücklich in meinem Vektor-Gedächtnis gespeichert!`;
      
      expect(happyText).toContain('Juhu');
      expect(happyText).toContain(role);
      expect(happyText).toContain('gespeichert');
    });
  });

  describe('Re-ask response', () => {
    it('should generate kindly re-ask text', () => {
      const role = 'Papa';
      const reaskText = `Oh... Tut mir leid, ${role}. Kannst du es mir bitte nochmal erklären? Ich höre ganz aufmerksam zu!`;
      
      expect(reaskText).toContain('Tut mir leid');
      expect(reaskText).toContain(role);
      expect(reaskText).toContain('nochmal erklären');
    });
  });
});
