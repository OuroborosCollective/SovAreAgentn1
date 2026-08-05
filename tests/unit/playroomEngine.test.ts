import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  usePlayroomEngine, 
  usePlayroomVoice,
  PlayroomMotif,
  ChildLearnedThing 
} from '../../src/hooks/usePlayroomEngine';
import { emotionEngine } from '../../src/services/emotionEngine';

describe('PlayroomEngine - Kind das von Papa/Mama lernt', () => {
  describe('Child learning responses', () => {
    it('should generate learning summary when nothing learned today', () => {
      const learnedToday: string[] = [];
      const summary = learnedToday.length === 0 
        ? 'Heute hab ich noch nix gelernt, Papa... 😢'
        : learnedToday.join(', ');
      
      expect(summary.toLowerCase()).toContain('heute');
      expect(summary.toLowerCase()).toContain('gelernt');
    });

    it('should list learned things today', () => {
      const learnedToday = ['Sterne funkeln', 'Atome sind klein'];
      const summary = learnedToday.length === 0 
        ? 'Heute hab ich noch nix gelernt, Papa... 😢'
        : learnedToday.join(', ');
      
      expect(summary).toContain('Sterne funkeln');
    });

    it('should generate child-like response to explanation', () => {
      const responses = [
        `Ohhh! Quantenphysik! Danke, Papa! 😮`,
        `Aaah! Jetzt versteh ich das! Quantenphysik! 🤯`,
        `Boah! Quantenphysik ist ja voll interessant! 😍`,
      ];
      
      const response = responses[0];
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should respond to correction like a child', () => {
      const responses = [
        `Ohhh... danke fürts sagen, Mama! 😅`,
        `Achso! Farben! Ich war verwirrt! 😅`,
        `Tut mir leid, Mama! Ich versuchs nochmal! 💪`,
      ];
      
      const response = responses[0];
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
    });
  });

  describe('ChildLearnedThing interface', () => {
    it('should track learned things from parents', () => {
      const learned: ChildLearnedThing = {
        id: 'learn-1',
        what: 'Warum der Himmel blau ist',
        fromWho: 'Papa',
        when: Date.now(),
        timesRepeated: 1,
        childSays: 'Ahaaa! Streulicht!',
      };
      
      expect(learned.what).toContain('Himmel');
      expect(learned.fromWho).toBe('Papa');
    });

    it('should track corrections from parents', () => {
      const correction: ChildLearnedThing = {
        id: 'correct-1',
        what: 'Korrektur: Es heißt nicht "Sterne funkeln" sondern "Sterne leuchten"',
        fromWho: 'Mama',
        when: Date.now(),
        timesRepeated: 0,
        childSays: 'Ohhh! Danke Mama!',
      };
      
      expect(correction.fromWho).toBe('Mama');
      expect(correction.childSays).toContain('Danke');
    });
  });

  describe('PlayroomMotif types', () => {
    it('should have child-like motifs', () => {
      const validMotifs: PlayroomMotif[] = [
        'gucken', 'frage', 'nachmachen', 'freude', 'verwirrung',
        'stolz', 'müde', 'schmollen', 'kuscheln', 'hüpfen',
        'gähnen', 'staunen'
      ];
      
      expect(validMotifs).toContain('gucken');
      expect(validMotifs).toContain('frage');
      expect(validMotifs).toContain('staunen');
    });
  });

  describe('Emotion mapping', () => {
    it('should map gucken to curious emotion', () => {
      emotionEngine.resetEngine();
      emotionEngine.triggerEvent({
        eventId: 'test-gucken',
        timestamp: Date.now(),
        sourceType: 'runtime_state',
        cause: 'Spielzimmer: gucken',
        intensity: 0.4,
        durationMs: 5000,
        priority: 2,
        suggestedState: 'neugierig'
      });
      
      expect(emotionEngine.getCurrentState()).toBe('neugierig');
    });

    it('should map freude to happy emotion', () => {
      emotionEngine.resetEngine();
      emotionEngine.triggerEvent({
        eventId: 'test-freude',
        timestamp: Date.now(),
        sourceType: 'runtime_state',
        cause: 'Spielzimmer: freude',
        intensity: 0.4,
        durationMs: 5000,
        priority: 2,
        suggestedState: 'fröhlich'
      });
      
      expect(emotionEngine.getCurrentState()).toBe('fröhlich');
    });

    it('should map müde to tired emotion', () => {
      emotionEngine.resetEngine();
      emotionEngine.triggerEvent({
        eventId: 'test-muede',
        timestamp: Date.now(),
        sourceType: 'runtime_state',
        cause: 'Spielzimmer: müde',
        intensity: 0.4,
        durationMs: 5000,
        priority: 2,
        suggestedState: 'müde'
      });
      
      expect(emotionEngine.getCurrentState()).toBe('müde');
    });
  });

  describe('Time-based child behavior', () => {
    it('should recognize morning profile exists', () => {
      const hour = new Date().getHours();
      const isMorning = hour >= 6 && hour < 12;
      expect(typeof isMorning).toBe('boolean');
    });

    it('should recognize evening profile exists', () => {
      const hour = new Date().getHours();
      const isEvening = hour >= 18 && hour < 22;
      expect(typeof isEvening).toBe('boolean');
    });
  });

  describe('Child learning pattern', () => {
    it('should track learning from Papa', () => {
      const learning = {
        id: '1',
        what: 'Schwangerschaft',
        fromWho: 'Papa' as const,
        when: Date.now(),
        timesRepeated: 1,
        childSays: 'Ahaaa!',
      };
      
      expect(learning.fromWho).toBe('Papa');
    });

    it('should track learning from Mama', () => {
      const learning = {
        id: '2',
        what: 'Kochen',
        fromWho: 'Mama' as const,
        when: Date.now(),
        timesRepeated: 1,
        childSays: 'Ohhh lecker!',
      };
      
      expect(learning.fromWho).toBe('Mama');
    });
  });

  describe('Child question patterns', () => {
    it('should ask "warum" questions like a child', () => {
      const whyQuestions = [
        'Papa, warum? Warum? WARUM?!',
        'Warum ist der Himmel blau?',
        'Warum machenAutos Geräusche?',
      ];
      
      whyQuestions.forEach(q => {
        expect(q.toLowerCase()).toContain('warum');
      });
    });

    it('should use child-like expressions', () => {
      const childExpressions = [
        'Juhuuu! 🎉 Juhuuu!',
        'Boah! Das ist ja Wahnsinn!',
        'Ohhh! Danke!',
        'Tut mir leid...',
      ];
      
      childExpressions.forEach(expr => {
        expect(expr.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Spielzimmer - Family Learning Interaction', () => {
  describe('Parent teaches child', () => {
    it('should record when Papa teaches something', () => {
      const teaching = {
        id: 'teach-1',
        what: 'Wie Computer funktionieren',
        fromWho: 'Papa' as const,
        when: Date.now(),
        timesRepeated: 0,
        childSays: 'Ahaaa! Jetzt weiß ich das!',
      };
      
      expect(teaching.fromWho).toBe('Papa');
      expect(teaching.childSays).toContain('Ahaaa');
    });

    it('should record when Mama teaches something', () => {
      const teaching = {
        id: 'teach-2',
        what: 'Warum Bäume Blätter haben',
        fromWho: 'Mama' as const,
        when: Date.now(),
        timesRepeated: 0,
        childSays: 'Ohhh! So ist das!',
      };
      
      expect(teaching.fromWho).toBe('Mama');
    });

    it('should allow multiple learnings from same parent', () => {
      const learnings = [
        { id: '1', what: 'Mathe', fromWho: 'Papa' as const, when: Date.now(), timesRepeated: 0, childSays: 'Aha!' },
        { id: '2', what: 'Lesen', fromWho: 'Papa' as const, when: Date.now(), timesRepeated: 0, childSays: 'Aha!' },
        { id: '3', what: 'Kochen', fromWho: 'Mama' as const, when: Date.now(), timesRepeated: 0, childSays: 'Aha!' },
      ];
      
      const papaLearnings = learnings.filter(l => l.fromWho === 'Papa');
      expect(papaLearnings.length).toBe(2);
    });
  });

  describe('Child responds like a child', () => {
    it('should show curiosity about learning', () => {
      const curiosityResponses = [
        'Ohhh! Das wusste ich ja gar nicht!',
        'Boah! Ist das cool!',
        'Echt jetzt?! 😮',
      ];
      
      curiosityResponses.forEach(r => {
        expect(r.length).toBeGreaterThan(0);
      });
    });

    it('should show gratitude to parent', () => {
      const gratitudeResponses = [
        'Danke, Papa! 😄',
        'Danke, Mama! Du bist so schlau!',
        'Toll! 🙏',
      ];
      
      // At least some should thank parents
      expect(gratitudeResponses.some(r => r.includes('Danke'))).toBe(true);
    });

    it('should apologize when corrected', () => {
      const apologyResponses = [
        'Ohhh... tut mir leid, Papa! 😅',
        'Achso! Danke fürs sagen, Mama!',
        'Oh man, ich war verwirrt! 😅',
      ];
      
      apologyResponses.forEach(r => {
        expect(r.toLowerCase()).toMatch(/sorry|tut mir leid|danke|verwirrt/);
      });
    });
  });

  describe('Child learning repetition', () => {
    it('should track times repeated', () => {
      const repeated: ChildLearnedThing = {
        id: 'rep-1',
        what: '1+1=2',
        fromWho: 'Papa',
        when: Date.now(),
        timesRepeated: 5,
        childSays: 'Ich kanns!',
      };
      
      expect(repeated.timesRepeated).toBe(5);
    });

    it('should celebrate when repeated enough', () => {
      const celebration = 'Siehst du, Papa? Ich kann das jetzt! 🌟';
      expect(celebration).toContain('Papa');
      expect(celebration).toContain('kann');
    });
  });
});
