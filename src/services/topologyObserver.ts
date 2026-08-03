import { 
  MultidimensionalResonance, 
  HypergraphTopology, 
  HypergraphEdge,
  KappaIRProgram
} from '../types/arekappa';

export class TopologyObserver {
  /**
   * Evaluate 6-dimensional resonance scores for the given program or state
   */
  public static evaluateMultidimensionalResonance(
    program?: KappaIRProgram,
    driftValue: number = 0.02
  ): MultidimensionalResonance {
    // Determine resonance metrics deterministically based on actual program structure when available
    
    let fieldResonance = 0.98;
    let temporalResonance = 0.96;
    let evidenceResonance = 0.95;
    let structuralResonance = 0.94;
    let runtimeResonance = 0.99;
    let predictiveResonance = 0.92;

    if (program && program.nodes) {
      const nodeCount = Object.keys(program.nodes).length;
      let pureNodes = 0;
      let ioNodes = 0;
      let complexityDepth = 0;

      Object.values(program.nodes).forEach(node => {
        if (node.effect === 'PURE') pureNodes++;
        if (node.effect === 'NETWORK' || node.effect === 'WRITE' || node.effect === 'READ') ioNodes++;
        complexityDepth += (node.children || []).length;
      });

      // Pure functions have higher field resonance (less side effects = higher predictability)
      const purityRatio = nodeCount > 0 ? pureNodes / nodeCount : 1;
      fieldResonance = Math.min(1.0, 0.70 + (purityRatio * 0.30));
      
      // I/O density affects temporal resonance (waiting on external I/O = drift)
      const ioRatio = nodeCount > 0 ? ioNodes / nodeCount : 0;
      temporalResonance = Math.max(0.60, 1.0 - (ioRatio * 0.40));
      
      // Evidence resonance increases with verifiable deterministic nodes
      evidenceResonance = program.canonicalHash ? 1.0 : 0.8;
      
      // Structural resonance affected by complexity (higher interconnectedness = more rigid = lower resonance if too high)
      structuralResonance = Math.max(0.70, 0.99 - (complexityDepth * 0.01));
      
      // Predictive Resonance (the confidence interval of next-state derivation)
      predictiveResonance = Math.min(1.0, (fieldResonance * 0.6) + (structuralResonance * 0.4));
    }

    // Apply baseline environmental drift
    fieldResonance = Math.max(0.01, fieldResonance - driftValue * 0.5);
    temporalResonance = Math.max(0.01, temporalResonance - driftValue * 0.2);
    structuralResonance = Math.max(0.01, structuralResonance - driftValue * 0.4);
    predictiveResonance = Math.max(0.01, predictiveResonance - driftValue * 0.6);

    const aggregateScore = Number((
      (fieldResonance + temporalResonance + evidenceResonance + structuralResonance + runtimeResonance + predictiveResonance) / 6
    ).toFixed(4));

    let resonantHarmonyLevel: 'CRITICAL_DRIFT' | 'STABLE_HARMONY' | 'PEAK_RESONANCE' = 'PEAK_RESONANCE';
    if (aggregateScore < 0.75) {
      resonantHarmonyLevel = 'CRITICAL_DRIFT';
    } else if (aggregateScore < 0.92) {
      resonantHarmonyLevel = 'STABLE_HARMONY';
    }

    return {
      fieldResonance,
      temporalResonance,
      evidenceResonance,
      structuralResonance,
      runtimeResonance,
      predictiveResonance,
      aggregateScore,
      resonantHarmonyLevel
    };
  }

  /**
   * Build hypergraph topology representation and evaluate criticality & drift
   */
  public static buildHypergraphTopology(program?: KappaIRProgram): HypergraphTopology {
    let nodeIds = ['f0_axiom', 'f1_grammar', 'f2_ast', 'f3_kir', 'f4_observer', 'f5_runtime', 'f6_wolfram'];
    const edges: HypergraphEdge[] = [];

    if (program && program.nodes) {
      // Create actual topology from program AST relationships
      nodeIds = Object.keys(program.nodes);
      
      Object.values(program.nodes).forEach(node => {
        if (node.children && node.children.length > 0) {
          edges.push({
            id: `edge_${node.id}_children`,
            sourceNodes: [node.id],
            targetNodes: node.children,
            resonanceWeight: node.effect === 'PURE' ? 1.0 : 0.85,
            hyperType: 'CAUSAL'
          });
        }
      });
    } else {
      // Default abstract architecture topology
      edges.push(
        {
          id: 'edge_f0_f3',
          sourceNodes: ['f0_axiom', 'f1_grammar'],
          targetNodes: ['f3_kir'],
          resonanceWeight: 0.99,
          hyperType: 'TYPE_CONSTRAINT'
        },
        {
          id: 'edge_ast_kir',
          sourceNodes: ['f2_ast'],
          targetNodes: ['f3_kir'],
          resonanceWeight: 0.97,
          hyperType: 'TRANSFORMATION'
        },
        {
          id: 'edge_kir_runtime',
          sourceNodes: ['f3_kir'],
          targetNodes: ['f5_runtime', 'f4_observer'],
          resonanceWeight: 1.0,
          hyperType: 'CAUSAL'
        },
        {
          id: 'edge_wolfram_research',
          sourceNodes: ['f6_wolfram'],
          targetNodes: ['f0_axiom', 'f3_kir'],
          resonanceWeight: 0.95,
          hyperType: 'EVIDENCE'
        }
      );
    }

    const { aggregateScore } = this.evaluateMultidimensionalResonance(program);
    
    // Criticality is inverse to aggregate resonance
    const criticalityIndex = 1.0 - aggregateScore; 
    const driftValue = 0.015;
    const hasEarlyWarning = criticalityIndex > 0.25;

    return {
      nodes: nodeIds,
      edges,
      criticalityIndex,
      driftValue,
      hasEarlyWarning
    };
  }
}
