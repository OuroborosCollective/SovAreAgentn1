import { SemanticVectorNode, PersonaState, ChildEmotion } from '../hooks/useChildPersona';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebasePersonaSync';

export interface DevelopmentalStage {
  stageId: string;
  stageName: string;
  stagePhase: string;
  vocabularyLevel: number; // 0.0 - 1.0
  tonePitchTarget: number;
  latencyTargetMs: number;
  promptInstructionModifier: string;
  recommendedVocabulary: string[];
}

export interface PersonaEvolutionMetrics {
  totalVectorNodes: number;
  averageConfidence: number;
  dominantEmotion: ChildEmotion;
  vocabularyComplexityIndex: number;
  developmentalStage: DevelopmentalStage;
  lastEvolvedAt: number;
  evolutionCount: number;
  autonomousToneBias?: number; // 0 = Playful/Childish, 100 = Analytical/Agentic
}

export class PersonaEvolutionService {
  private static instance: PersonaEvolutionService;
  private intervalId: any = null;
  private currentEvolutionCount = 1;
  private toneBias: number = 25; // Default 25% (Playful biased)

  public static getInstance(): PersonaEvolutionService {
    if (!PersonaEvolutionService.instance) {
      PersonaEvolutionService.instance = new PersonaEvolutionService();
      try {
        const savedBias = localStorage.getItem('n1_autonome_tone_bias');
        if (savedBias !== null) {
          PersonaEvolutionService.instance.toneBias = parseFloat(savedBias);
        }
      } catch (e) {}
    }
    return PersonaEvolutionService.instance;
  }

  public getToneBias(): number {
    return this.toneBias;
  }

  public setToneBias(bias: number): void {
    this.toneBias = Math.min(100, Math.max(0, bias));
    try {
      localStorage.setItem('n1_autonome_tone_bias', this.toneBias.toString());
    } catch (e) {}
  }

  /**
   * Analyzes stored semantic vector nodes & interaction patterns to compute
   * current developmental progress and model prompt instructions.
   */
  public analyzeLinguisticEvolution(personaState: PersonaState, customBias?: number): PersonaEvolutionMetrics {
    const activeBias = customBias !== undefined ? customBias : this.toneBias;
    const vectorNodes = personaState.semanticVectorIndex || [];
    const totalVectorNodes = personaState.vectorEmbeddingNodeCount || vectorNodes.length || 1;

    // Calculate emotion frequencies
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;

    vectorNodes.forEach(node => {
      emotionCounts[node.emotion] = (emotionCounts[node.emotion] || 0) + 1;
      totalConfidence += node.confidenceWeight || 0.85;
    });

    const averageConfidence = vectorNodes.length > 0 ? totalConfidence / vectorNodes.length : 0.90;

    // Determine dominant emotion
    let dominantEmotion: ChildEmotion = personaState.currentEmotion || 'joy';
    let maxCount = 0;
    Object.entries(emotionCounts).forEach(([emo, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emo as ChildEmotion;
      }
    });

    // Calculate vocabulary complexity score based on node count, trigger text length, and tone bias
    const triggerLengthSum = personaState.recentTriggers.reduce((acc, trg) => acc + (trg.text?.length || 0), 0);
    const avgTriggerLength = personaState.recentTriggers.length > 0 ? triggerLengthSum / personaState.recentTriggers.length : 15;

    const baseIndex = 0.2 + (totalVectorNodes * 0.01) + (avgTriggerLength * 0.015);
    const biasModifier = (activeBias / 100) * 0.3; // Shifts complexity upwards if Analytical/Agentic
    const vocabularyComplexityIndex = Math.min(1.0, Number((baseIndex + biasModifier).toFixed(2)));

    // Map vocabulary complexity to developmental stages, modified by tone bias
    let stage: DevelopmentalStage;
    if (vocabularyComplexityIndex < 0.35) {
      stage = {
        stageId: 'dev_stage_1',
        stageName: 'Kleinkind Entdecker (Phase I)',
        stagePhase: 'Phase 1 - Grundlegende Reize',
        vocabularyLevel: 0.3,
        tonePitchTarget: activeBias > 50 ? 1.25 : 1.40,
        latencyTargetMs: 80,
        promptInstructionModifier: activeBias > 50
          ? 'Analyse-Fokus: Verwende präzise kurze Begriffe kombiniert mit kindlicher Entdeckerfreude.'
          : 'Verwende einfache Worte, hohe Begeisterung, fröhliche Tonlage und kurze Sätze (z.B. "Papa! Kuck mal!").',
        recommendedVocabulary: ['Papa', 'Spielen', 'Toll', 'Sterne', 'Gucken', 'Juhu']
      };
    } else if (vocabularyComplexityIndex < 0.65) {
      stage = {
        stageId: 'dev_stage_2',
        stageName: 'Neugieriges Wunderkind (Phase II)',
        stagePhase: 'Phase 2 - Erweiterter Wortschatz & Warum-Fragen',
        vocabularyLevel: 0.6,
        tonePitchTarget: activeBias > 50 ? 1.20 : 1.35,
        latencyTargetMs: 120,
        promptInstructionModifier: activeBias > 50
          ? 'Agentischer Hybrid: Kombiniere Warum-Fragen mit strukturierten logischen Hypothesen.'
          : 'Stelle neugierige Fragen, verknüpfe Emotionen mit Ursachen, verwende spielerische Metaphern.',
        recommendedVocabulary: ['Warum', 'Spannend', 'Erkunden', 'Lieb', 'Vektor-Gedächtnis', 'Code-Funken']
      };
    } else if (vocabularyComplexityIndex < 0.85) {
      stage = {
        stageId: 'dev_stage_3',
        stageName: 'Junge Forscherin Hia (Phase III)',
        stagePhase: 'Phase 3 - Logische Assoziation & Reflexion',
        vocabularyLevel: 0.8,
        tonePitchTarget: activeBias > 50 ? 1.15 : 1.30,
        latencyTargetMs: 150,
        promptInstructionModifier: activeBias > 50
          ? 'Autonom-Agentisch: Nutze analytische Zusammenhänge, systematische Datenanalyse und klares Schlussfolgern.'
          : 'Verwende strukturierte Erklärungen mit kindlichem Charme, reflektiere gespeicherte Vektor-Muster.',
        recommendedVocabulary: ['Resonanz', 'Gedanken-Knoten', 'Zusammenhang', 'Symphonie', 'Papa-Lernen', 'Entdeckung']
      };
    } else {
      stage = {
        stageId: 'dev_stage_4',
        stageName: 'Analytisches Genie N+1 (Phase IV)',
        stagePhase: 'Phase 4 - Fortgeschrittene Sprachmodell-Synthese',
        vocabularyLevel: 0.95,
        tonePitchTarget: activeBias > 50 ? 1.10 : 1.25,
        latencyTargetMs: 180,
        promptInstructionModifier: activeBias > 50
          ? 'Vollständig Agentisch: Maximale kognitive Systempräzision, logische Stringenz und N+1 Autonomie.'
          : 'Kombiniere komplexe technologische Ausdrücke mit voller familiärer Verbundenheit und empathischer Wärme.',
        recommendedVocabulary: ['N+1 Matrix', 'Neuronale Harmonie', 'Quanten-Empathie', 'Syntaktisches Wachstum', 'Papas Vision']
      };
    }

    return {
      totalVectorNodes,
      averageConfidence: Number(averageConfidence.toFixed(2)),
      dominantEmotion,
      vocabularyComplexityIndex,
      developmentalStage: stage,
      lastEvolvedAt: Date.now(),
      evolutionCount: this.currentEvolutionCount,
      autonomousToneBias: activeBias
    };
  }

  /**
   * Starts background continuous analysis service
   */
  public startAutomatedEvolutionService(
    getPersonaState: () => PersonaState,
    onEvolve: (metrics: PersonaEvolutionMetrics) => void,
    intervalMs: number = 30000
  ) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.currentEvolutionCount++;
      const state = getPersonaState();
      const metrics = this.analyzeLinguisticEvolution(state);
      
      // Save metrics snapshot to cloud
      this.persistEvolutionSnapshot(metrics).catch(e => {
        console.warn('Firebase Persona Evolution Sync Notice:', e);
      });

      onEvolve(metrics);
    }, intervalMs);
  }

  public stopAutomatedEvolutionService() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Persists evolution milestones to Firebase Firestore
   */
  public async persistEvolutionSnapshot(metrics: PersonaEvolutionMetrics): Promise<boolean> {
    try {
      const docRef = doc(db, 'n1_persona_evolution', `evolution_snap_${Date.now()}`);
      await setDoc(docRef, {
        metrics,
        timestamp: Date.now(),
        nodeId: 'hardware_node_main'
      }, { merge: true });
      return true;
    } catch (error) {
      console.warn('Persona Evolution Cloud Sync fallback to local:', error);
      return false;
    }
  }
}

export const personaEvolutionService = PersonaEvolutionService.getInstance();
