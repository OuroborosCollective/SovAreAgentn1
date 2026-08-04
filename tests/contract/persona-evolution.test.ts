import { describe, it, expect } from 'vitest';
import { personaEvolutionService } from '../../src/services/personaEvolutionService';
import { PersonaState } from '../../src/hooks/useChildPersona';

describe('Persona Evolution Service Contract Tests', () => {
  it('should analyze linguistic patterns and return developmental stage metrics', () => {
    const mockPersonaState: PersonaState = {
      currentEmotion: 'curiosity',
      joyLevel: 0.88,
      playfulnessLevel: 0.85,
      curiosityLevel: 0.92,
      responseLatencyModifierMs: 120,
      tonePitch: 1.35,
      vectorEmbeddingNodeCount: 15,
      semanticVectorIndex: [
        {
          nodeId: 'v1',
          patternSignature: 'sig_curiosity_99',
          emotion: 'curiosity',
          confidenceWeight: 0.94,
          semanticCluster: 'discovery',
          indexedAt: Date.now()
        }
      ],
      recentTriggers: [
        { id: 'tr1', text: 'Warum funkeln Sterne?', emotion: 'curiosity', timestamp: Date.now() }
      ]
    };

    const metrics = personaEvolutionService.analyzeLinguisticEvolution(mockPersonaState);

    expect(metrics).toBeDefined();
    expect(metrics.developmentalStage).toBeDefined();
    expect(metrics.developmentalStage.stageName).toBeDefined();
    expect(metrics.vocabularyComplexityIndex).toBeGreaterThanOrEqual(0);
    expect(metrics.vocabularyComplexityIndex).toBeLessThanOrEqual(1);
    expect(metrics.dominantEmotion).toBe('curiosity');
    expect(metrics.developmentalStage.promptInstructionModifier).toBeTruthy();
    expect(metrics.developmentalStage.promptInstructionModifier.length).toBeGreaterThan(10);
  });
});
