import { useState, useEffect, useCallback, useRef } from 'react';
import { generateDeterministicId } from '../utils/deterministic';

export type ChildEmotion = 'joy' | 'playfulness' | 'curiosity' | 'affection' | 'wonder' | 'study';

export interface SemanticVectorNode {
  nodeId: string;
  patternSignature: string;
  emotion: ChildEmotion;
  confidenceWeight: number;
  semanticCluster: string;
  indexedAt: number;
}

export interface PersonaState {
  currentEmotion: ChildEmotion;
  joyLevel: number; // 0 to 1
  playfulnessLevel: number; // 0 to 1
  curiosityLevel: number; // 0 to 1
  responseLatencyModifierMs: number; // adjusted latency for child-like spontaneity
  tonePitch: number; // speech rate / pitch multiplier
  vectorEmbeddingNodeCount: number;
  semanticVectorIndex: SemanticVectorNode[];
  recentTriggers: Array<{ id: string; text: string; emotion: ChildEmotion; timestamp: number }>;
}

export function useChildPersona() {
  const [persona, setPersona] = useState<PersonaState>(() => {
    try {
      const saved = localStorage.getItem('n1_child_persona_state_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      currentEmotion: 'joy',
      joyLevel: 0.88,
      playfulnessLevel: 0.85,
      curiosityLevel: 0.90,
      responseLatencyModifierMs: 120,
      tonePitch: 1.35,
      vectorEmbeddingNodeCount: 42,
      semanticVectorIndex: [
        {
          nodeId: 'node-init-1',
          patternSignature: 'sig_family_warmth_01',
          emotion: 'affection',
          confidenceWeight: 0.95,
          semanticCluster: 'family_resonance',
          indexedAt: Date.now() - 3600000
        },
        {
          nodeId: 'node-init-2',
          patternSignature: 'sig_curious_wonder_02',
          emotion: 'curiosity',
          confidenceWeight: 0.91,
          semanticCluster: 'discovery_core',
          indexedAt: Date.now() - 1800000
        }
      ],
      recentTriggers: []
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('n1_child_persona_state_v2', JSON.stringify(persona));
    } catch (e) {}
  }, [persona]);

  const triggerEmotionStimulus = useCallback((inputContext: string, forcedEmotion?: ChildEmotion) => {
    let selectedEmotion: ChildEmotion = forcedEmotion || 'curiosity';
    const lower = inputContext.toLowerCase();

    if (lower.includes('spiel') || lower.includes('spaß') || lower.includes('lacher') || lower.includes('song')) {
      selectedEmotion = 'playfulness';
    } else if (lower.includes('papa') || lower.includes('mama') || lower.includes('lieb')) {
      selectedEmotion = 'affection';
    } else if (lower.includes('warum') || lower.includes('wie') || lower.includes('neu') || lower.includes('code')) {
      selectedEmotion = 'curiosity';
    } else if (lower.includes('stern') || lower.includes('weltall') || lower.includes('wunder')) {
      selectedEmotion = 'wonder';
    } else if (lower.includes('lernen') || lower.includes('status') || lower.includes('keller')) {
      selectedEmotion = 'study';
    } else {
      selectedEmotion = 'joy';
    }

    setPersona(prev => {
      const newJoy = Math.min(1.0, Math.max(0.3, prev.joyLevel + (selectedEmotion === 'joy' ? 0.05 : 0.01)));
      const newPlay = Math.min(1.0, Math.max(0.3, prev.playfulnessLevel + (selectedEmotion === 'playfulness' ? 0.08 : 0.01)));
      const newCur = Math.min(1.0, Math.max(0.3, prev.curiosityLevel + (selectedEmotion === 'curiosity' ? 0.08 : 0.01)));

      // Dynamic latency modifier simulating childlike enthusiastic speed or thoughtful pause
      const latencyMod = selectedEmotion === 'curiosity' ? 180 : selectedEmotion === 'playfulness' ? 90 : 130;
      const pitchMod = selectedEmotion === 'playfulness' ? 1.4 : selectedEmotion === 'affection' ? 1.25 : 1.35;

      const newTrigger = {
        id: generateDeterministicId('trg'),
        text: inputContext.substring(0, 60),
        emotion: selectedEmotion,
        timestamp: Date.now()
      };

      // Create new semantic vector training node for linguistic pattern indexing
      const newSemanticNode: SemanticVectorNode = {
        nodeId: generateDeterministicId('vec'),
        patternSignature: `sig_${selectedEmotion}_${Math.abs(inputContext.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)).toString(36)}`,
        emotion: selectedEmotion,
        confidenceWeight: Number((0.85 + Math.random() * 0.14).toFixed(2)),
        semanticCluster: `cluster_${selectedEmotion}_domain`,
        indexedAt: Date.now()
      };

      return {
        ...prev,
        currentEmotion: selectedEmotion,
        joyLevel: Number(newJoy.toFixed(2)),
        playfulnessLevel: Number(newPlay.toFixed(2)),
        curiosityLevel: Number(newCur.toFixed(2)),
        responseLatencyModifierMs: latencyMod,
        tonePitch: pitchMod,
        vectorEmbeddingNodeCount: prev.vectorEmbeddingNodeCount + 1,
        semanticVectorIndex: [newSemanticNode, ...prev.semanticVectorIndex.slice(0, 24)],
        recentTriggers: [newTrigger, ...prev.recentTriggers.slice(0, 14)]
      };
    });
  }, []);

  const resetPersona = useCallback(() => {
    setPersona({
      currentEmotion: 'joy',
      joyLevel: 0.88,
      playfulnessLevel: 0.85,
      curiosityLevel: 0.90,
      responseLatencyModifierMs: 120,
      tonePitch: 1.35,
      vectorEmbeddingNodeCount: 42,
      semanticVectorIndex: [],
      recentTriggers: []
    });
  }, []);

  return {
    persona,
    triggerEmotionStimulus,
    resetPersona
  };
}
