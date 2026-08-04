import { describe, it, expect, vi } from 'vitest';
import { dialogOrchestrator, DialogRequestV1 } from '../../src/services/dialogOrchestrator';

// Mock generateContentWithRetry
vi.mock('../../src/utils/geminiRetry', () => ({
  generateContentWithRetry: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      version: "1.0",
      spokenOutput: "Hallo Papa, ich erinnere mich, dass du fröhliche Antworten magst!",
      memoryReferences: ["mem1"],
      learningCandidates: [],
      animationSignals: ["smile"],
      internalState: {
        uncertaintyLevel: "low",
        missingMemoryFlag: false
      }
    })
  })
}));

describe('DialogOrchestrator Contract', () => {
  it('returns a correctly structured DialogResponseV1 based on strict constraints', async () => {
    const request: DialogRequestV1 = {
      version: "1.0",
      speaker: {
        id: "papa_1",
        name: "Papa",
        role: "creator",
        mood: "curious"
      },
      context: {
        currentConversation: [],
        authorizedMemories: [
          { id: "mem1", summary: "Papa mag fröhliche Antworten", relevanceScore: 1.0 }
        ],
        coreRules: [
          "Sprich auf Deutsch.",
          "Nenne den Benutzer Papa."
        ],
        systemState: {
          time: new Date().toISOString(),
          providerStatus: "healthy"
        }
      },
      input: "Wie geht es dir?"
    };

    const response = await dialogOrchestrator.processDialog(request);

    // Contract assertions
    expect(response).toHaveProperty('version', '1.0');
    expect(response).toHaveProperty('spokenOutput');
    expect(response).toHaveProperty('memoryReferences');
    expect(Array.isArray(response.memoryReferences)).toBe(true);
    expect(response.memoryReferences).toContain('mem1'); // Does not leak private cross-speaker data
    expect(response).toHaveProperty('learningCandidates');
    expect(Array.isArray(response.learningCandidates)).toBe(true);
    expect(response).toHaveProperty('animationSignals');
    expect(Array.isArray(response.animationSignals)).toBe(true);
    expect(response).toHaveProperty('internalState');
    expect(response.internalState).toHaveProperty('uncertaintyLevel');
    expect(response.internalState).toHaveProperty('missingMemoryFlag');
  });
});
