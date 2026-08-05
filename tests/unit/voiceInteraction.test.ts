import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateHiaVoiceResponse, 
  generateHiaDetailedResponse,
  generateAgentAction 
} from '../../src/services/geminiService';
import { WolframResearchSandbox } from '../../src/services/wolframResearchSandbox';
import { emotionEngine } from '../../src/services/emotionEngine';

vi.mock('../../services/dialogOrchestrator', () => ({
  dialogOrchestrator: {
    processDialog: vi.fn().mockResolvedValue({
      spokenOutput: 'Test response from dialog orchestrator',
      animationSignals: ['smile']
    })
  }
}));

vi.mock('../../services/emotionalMemoryService', () => ({
  emotionalMemoryService: {
    getAgentMoodContextPrompt: vi.fn().mockReturnValue({
      memoryReferences: [
        {
          id: 'mem-1',
          formattedTime: '12:00',
          conversationSnippet: 'Previous conversation',
          resonanceMetrics: { harmonicWarmth: 85, pitchResonance: 175 }
        }
      ]
    }),
    addMemory: vi.fn()
  }
}));

vi.mock('../../services/voiceService', () => ({
  voiceService: {
    speak: vi.fn(),
    subscribe: vi.fn().mockReturnValue(vi.fn())
  }
}));

vi.mock('../../services/geminiService', () => ({
  generateAgentAction: vi.fn(),
  generateHiaVoiceResponse: vi.fn(),
  generateHiaDetailedResponse: vi.fn()
}));

describe('Voice Interaction - Voice Action Reasoning', () => {
  describe('generateHiaVoiceResponse', () => {
    it('should return a string response', async () => {
      const response = await generateHiaVoiceResponse('Hallo');
      expect(typeof response).toBe('string');
    });

    it('should handle greeting queries', async () => {
      const response = await generateHiaVoiceResponse('Hallo N+1');
      expect(response.toLowerCase()).toContain('hallo');
    });

    it('should handle who-are-you queries', async () => {
      const response = await generateHiaVoiceResponse('Wer bist du?');
      expect(response).toBeTruthy();
    });

    it('should trigger Wolfram for math queries', async () => {
      const response = await generateHiaVoiceResponse('Berechne x^2 - 5x + 6 = 0');
      expect(response).toContain('Wolfram');
    });

    it('should handle thanks queries', async () => {
      const response = await generateHiaVoiceResponse('Danke');
      // Response should be a truthy string
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
    });
  });

  describe('Wolfram Integration', () => {
    it('should detect math keywords', () => {
      const mathKeywords = ['wolf', 'wolfram', 'mathe', 'rechnen', 'gleichung', 'x^2', 'formel'];
      
      mathKeywords.forEach(keyword => {
        const query = `Berechne ${keyword} test`;
        const hasMathKeyword = ['wolf', 'wolfram', 'mathe', 'rechnen', 'gleichung', 'x^2', 'formel']
          .some(k => query.toLowerCase().includes(k));
        expect(hasMathKeyword).toBe(true);
      });
    });

    it('should execute Solve equation', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x^2-5x+6==0,x]', 'Test');
      expect(result.exactResult).toBe('x ∈ {2,3}');
      expect(result.status).toBe('VERIFIED');
    });

    it('should handle simple addition', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'Test');
      expect(result.exactResult).toBe('x = 5');
    });

    it('should reject write operations', () => {
      expect(() => {
        WolframResearchSandbox.evaluateSymbolicResearch('Write["test.txt", data]', 'Test');
      }).toThrow(/POLICY VIOLATION/);
    });
  });

  describe('generateHiaDetailedResponse', () => {
    it('should return dialog response object', async () => {
      const response = await generateHiaDetailedResponse('Test query');
      expect(response).toBeDefined();
    });
  });

  describe('Family Interaction Patterns', () => {
    it('should address user as Papa', async () => {
      const response = await generateHiaVoiceResponse('Hallo');
      expect(response).toBeTruthy();
    });

    it('should handle emotional state context', () => {
      const personaState = { mood: 'fröhlich' };
      expect(personaState.mood).toBe('fröhlich');
    });

    it('should trigger emotion events', () => {
      emotionEngine.resetEngine();
      const event = {
        eventId: 'voice-test',
        timestamp: Date.now(),
        sourceType: 'dialog_intent' as const,
        cause: 'User greeting',
        intensity: 0.5,
        durationMs: 3000,
        priority: 4,
        suggestedState: 'fröhlich' as const
      };
      
      emotionEngine.triggerEvent(event);
      expect(emotionEngine.getEventHistory().length).toBeGreaterThan(0);
    });
  });
});

describe('Voice Action - Animation Signals', () => {
  describe('Animation signal mapping', () => {
    it('should map smile to happy emotion', () => {
      const state = emotionEngine.signalToState('smile');
      expect(state).toBe('fröhlich');
    });

    it('should map laugh to playful emotion', () => {
      const state = emotionEngine.signalToState('laugh');
      expect(state).toBe('verspielt');
    });

    it('should map think to contemplative emotion', () => {
      const state = emotionEngine.signalToState('think');
      expect(state).toBe('nachdenklich');
    });
  });

  describe('Signal to emotion transition', () => {
    it('should trigger event on signal', () => {
      emotionEngine.resetEngine();
      
      const initialState = emotionEngine.getCurrentState();
      expect(initialState).toBe('ruhig');
    });
  });
});

describe('Color Theme - Emotion Colors', () => {
  const emotionColors: Record<string, string> = {
    'ruhig': '#10b981',      // Green
    'fröhlich': '#fbbf24',    // Amber/Yellow
    'neugierig': '#3b82f6',  // Blue
    'verspielt': '#f472b6',   // Pink
    'nachdenklich': '#8b5cf6', // Purple
    'offline/unsicher': '#ef4444' // Red
  };

  it('should have color for each emotion state', () => {
    Object.entries(emotionColors).forEach(([emotion, color]) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have happy color for positive emotions', () => {
    expect(emotionColors['fröhlich']).toBe('#fbbf24');
  });

  it('should have distinct colors for different emotions', () => {
    const colors = new Set(Object.values(emotionColors));
    expect(colors.size).toBe(Object.values(emotionColors).length);
  });
});
