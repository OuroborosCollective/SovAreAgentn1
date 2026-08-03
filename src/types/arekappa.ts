// F0 - F6 Architecture & κIR v1 Type Definitions for N+1 System

export type LayerLevel = 'F0' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';

export interface ArchitectureLayer {
  level: LayerLevel;
  name: string;
  description: string;
  immutable: boolean;
  components: string[];
  status: 'ACTIVE' | 'VERIFIED' | 'RESEARCH_LANE';
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    level: 'F0',
    name: 'Axiom Layer (Axiom Core)',
    description: 'Mathematical axioms, language & type definitions, κ-constants, and non-negotiable system invariants. Never mutated at runtime.',
    immutable: true,
    components: ['AxiomTree', 'KappaConstants', 'InvariantGuard', 'TypeRegistry'],
    status: 'VERIFIED'
  },
  {
    level: 'F1',
    name: 'Parser / Grammar Layer',
    description: 'Parser grammar definitions for Python, TypeScript, and AREKappa DSL tokenization.',
    immutable: false,
    components: ['PythonGrammar', 'TSGrammar', 'AREKappaParser'],
    status: 'ACTIVE'
  },
  {
    level: 'F2',
    name: 'Semantic Graph / AST Adapter Layer',
    description: 'Language AST to pure language-agnostic Semantic Graph translation without loss of meaning.',
    immutable: false,
    components: ['ASTAdapter', 'SemanticGraphBuilder', 'TypeInferenceEngine'],
    status: 'ACTIVE'
  },
  {
    level: 'F3',
    name: 'κIR (Intermediate Representation) Truth Engine',
    description: 'The core truth representation. Content-addressed, zero-float integer/rational substrate, content-hashed nodes.',
    immutable: true,
    components: ['KappaIRCompiler', 'NodeHasher', 'ZeroFloatSubstrate', 'CanonicalNormalizer'],
    status: 'VERIFIED'
  },
  {
    level: 'F4',
    name: 'Topology / κObserver Layer',
    description: 'Hypergraph topology analysis, drift detection, 6-dimensional resonance evaluation, and criticality threshold monitoring.',
    immutable: false,
    components: ['ErdosTopologyObserver', 'HypergraphEngine', 'MultiResonanceAnalyzer', 'DriftDetector'],
    status: 'ACTIVE'
  },
  {
    level: 'F5',
    name: 'Deterministic Runtime & Evidence Engine',
    description: 'Fail-closed pure execution runtime producing cryptographically verifiable Evidence Receipts.',
    immutable: true,
    components: ['DeterministicEvaluator', 'EvidenceReceiptGenerator', 'HashChainVerifier'],
    status: 'VERIFIED'
  },
  {
    level: 'F6',
    name: 'Research Lane (Wolfram Container)',
    description: 'Isolated research runtime with WolframEngine 14.3. Proposes new formulas, proofs, and adapters without product data write access.',
    immutable: false,
    components: ['WolframResearchContainer', 'ProofSearchEngine', 'AdapterProposalLane'],
    status: 'RESEARCH_LANE'
  }
];

export type KappaEffect = 
  | 'PURE' 
  | 'READ' 
  | 'WRITE' 
  | 'NETWORK' 
  | 'CLOCK' 
  | 'RANDOM' 
  | 'PROCESS';

export type KappaPrimitiveType = 
  | 'I64_INTEGER' 
  | 'RATIONAL_EXACT' 
  | 'BOOLEAN' 
  | 'STRING_CANONICAL' 
  | 'SUBSTRATE_ADDRESS' 
  | 'EVIDENCE_HASH'
  | 'HYPERGRAPH_NODE';

export interface KappaIRNode {
  id: string;
  type: 'LITERAL' | 'VARIABLE' | 'OPERATOR' | 'FUNCTION_CALL' | 'EFFECT_NODE' | 'PROOF_CLAIM';
  primitiveType: KappaPrimitiveType;
  effect: KappaEffect;
  value?: string | number | boolean;
  children: string[];
  contentHash: string;
  metadata?: Record<string, any>;
}

export interface KappaIRProgram {
  programId: string;
  version: '1.0.0-κIR';
  nodes: Record<string, KappaIRNode>;
  rootNodeId: string;
  canonicalHash: string;
  createdAt: string;
  targetLanguages: ('Python' | 'TypeScript' | 'Rust' | 'Go' | 'C#' | 'Java')[];
}

export interface EvidenceReceipt {
  receiptId: string;
  programHash: string;
  executionStepsCount: number;
  effectMask: KappaEffect[];
  inputsHash: string;
  outputsHash: string;
  stateDeltaHash: string;
  timestampMs: number;
  previousReceiptHash: string;
  chainHash: string;
  signature: string;
  verifiedDeterministic: boolean;
}

export interface MultidimensionalResonance {
  fieldResonance: number;      // 0.0 to 1.0
  temporalResonance: number;   // 0.0 to 1.0
  evidenceResonance: number;   // 0.0 to 1.0
  structuralResonance: number; // 0.0 to 1.0
  runtimeResonance: number;    // 0.0 to 1.0
  predictiveResonance: number; // 0.0 to 1.0
  aggregateScore: number;      // 0.0 to 1.0
  resonantHarmonyLevel: 'CRITICAL_DRIFT' | 'STABLE_HARMONY' | 'PEAK_RESONANCE';
}

export interface HypergraphEdge {
  id: string;
  sourceNodes: string[];
  targetNodes: string[];
  resonanceWeight: number;
  hyperType: 'CAUSAL' | 'EVIDENCE' | 'TYPE_CONSTRAINT' | 'TRANSFORMATION';
}

export interface HypergraphTopology {
  nodes: string[];
  edges: HypergraphEdge[];
  criticalityIndex: number;
  driftValue: number;
  hasEarlyWarning: boolean;
}
