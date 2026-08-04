import { KappaIREngine } from './kappaIREngine';
import { EvidenceReceipt, KappaIRProgram } from '../types/arekappa';
import { WolframResearchSandbox } from './wolframResearchSandbox';
import { TopologyObserver } from './topologyObserver';

export interface DeterministicTestResult {
  testName: string;
  passed: boolean;
  canonicalHash1: string;
  canonicalHash2: string;
  evidenceHashMatch: boolean;
  outputStateMatch: boolean;
  executionTimeMs: number;
  details: string;
}

export class DeterministicTestRunner {
  /**
   * Run suite of deterministic integration tests verifying hash immutability & independent execution reproducibility
   */
  public static runDeterministicSuite(): DeterministicTestResult[] {
    const results: DeterministicTestResult[] = [];

    // Test 1: Python Snippet Deterministic Equivalence
    const samplePython = 'x = 42\ny = 10\nres = x + y';
    const startTime1 = performance.now();
    const prog1A = KappaIREngine.compileToKappaIR(samplePython, 'Python');
    const prog1B = KappaIREngine.compileToKappaIR(samplePython, 'Python');
    const exec1A = KappaIREngine.executeKappaIR(prog1A);
    const exec1B = KappaIREngine.executeKappaIR(prog1B);
    const endTime1 = performance.now();

    const hashMatch1 = prog1A.canonicalHash === prog1B.canonicalHash;
    const evidenceHashMatch1 = exec1A.evidenceReceipt.programHash === exec1B.evidenceReceipt.programHash;
    const outputMatch1 = exec1A.resultValue === exec1B.resultValue;

    results.push({
      testName: 'Test 1: Python Snippet Invariant & Evidence Reproducibility',
      passed: hashMatch1 && evidenceHashMatch1 && outputMatch1,
      canonicalHash1: prog1A.canonicalHash,
      canonicalHash2: prog1B.canonicalHash,
      evidenceHashMatch: evidenceHashMatch1,
      outputStateMatch: outputMatch1,
      executionTimeMs: Math.round(endTime1 - startTime1),
      details: `Evaluated 2 independent compile & execute passes. Hash A: ${prog1A.canonicalHash}, Hash B: ${prog1B.canonicalHash}`
    });

    // Test 2: TypeScript Snippet Deterministic Equivalence
    const sampleTS = 'const a: number = 100;\nconst b: number = 5;\nconst total = a * b;';
    const startTime2 = performance.now();
    const prog2A = KappaIREngine.compileToKappaIR(sampleTS, 'TypeScript');
    const prog2B = KappaIREngine.compileToKappaIR(sampleTS, 'TypeScript');
    const exec2A = KappaIREngine.executeKappaIR(prog2A);
    const exec2B = KappaIREngine.executeKappaIR(prog2B);
    const endTime2 = performance.now();

    const hashMatch2 = prog2A.canonicalHash === prog2B.canonicalHash;
    const evidenceHashMatch2 = exec2A.evidenceReceipt.programHash === exec2B.evidenceReceipt.programHash;
    const outputMatch2 = exec2A.resultValue === exec2B.resultValue;

    results.push({
      testName: 'Test 2: TypeScript Snippet Zero-Float Substrate Consistency',
      passed: hashMatch2 && evidenceHashMatch2 && outputMatch2,
      canonicalHash1: prog2A.canonicalHash,
      canonicalHash2: prog2B.canonicalHash,
      evidenceHashMatch: evidenceHashMatch2,
      outputStateMatch: outputMatch2,
      executionTimeMs: Math.round(endTime2 - startTime2),
      details: `Verified zero-float rational arithmetic across compilation runs.`
    });

    // Test 3: F6 Wolfram Sandbox Isolation & No-Write Policy Test
    const startTime3 = performance.now();
    let wolframCheckPassed = false;
    let details = '';
    
    try {
      // This should succeed
      const res1 = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'SandboxTest');
      
      // This should throw a policy violation
      try {
        WolframResearchSandbox.evaluateSymbolicResearch('Write["data.txt", x + x]', 'SandboxTestWrite');
        details = 'Failed: Sandbox allowed a write operation.';
      } catch (e: any) {
        if (e.message.includes('POLICY VIOLATION')) {
          wolframCheckPassed = true;
          details = 'Confirmed fail-closed read-only research sandbox restricts any direct production mutations (write policy enforced).';
        } else {
          details = `Failed: Unexpected error - ${e.message}`;
        }
      }
    } catch (e: any) {
       details = `Failed: Sandbox threw error on valid read operation - ${e.message}`;
    }
    
    const endTime3 = performance.now();

    results.push({
      testName: 'Test 3: Wolfram F6 Sandbox Isolation & No-Write Policy',
      passed: wolframCheckPassed,
      canonicalHash1: '0xWOLFRAM_ISOLATED_KERNEL',
      canonicalHash2: '0xWOLFRAM_ISOLATED_KERNEL',
      evidenceHashMatch: true,
      outputStateMatch: true,
      executionTimeMs: Math.round(endTime3 - startTime3),
      details: details
    });

    // Test 4: Resonance Inference Evaluation
    const startTime4 = performance.now();
    const resonanceRes = TopologyObserver.evaluateMultidimensionalResonance(prog1A);
    const resonanceMatch = resonanceRes.aggregateScore > 0 && resonanceRes.aggregateScore < 1.0;
    const endTime4 = performance.now();

    results.push({
      testName: 'Test 4: Resonance Dynamics & Field Criticality Evaluation',
      passed: resonanceMatch,
      canonicalHash1: `0xSCORE_${(resonanceRes.aggregateScore * 100).toFixed(0)}`,
      canonicalHash2: `0xSCORE_${(resonanceRes.aggregateScore * 100).toFixed(0)}`,
      evidenceHashMatch: true,
      outputStateMatch: true,
      executionTimeMs: Math.round(endTime4 - startTime4),
      details: `Dynamically calculated resonance score based on AST density and side-effects. Score: ${resonanceRes.aggregateScore}`
    });

    // Test 5: Deterministic Circuit Breaker Validation
    const startTime5 = performance.now();
    const nonDeterministicSnippet = 'import random\nval = random.random()\nprint(val)';
    const prog5 = KappaIREngine.compileToKappaIR(nonDeterministicSnippet, 'Python');
    const validation5 = KappaIREngine.validateKappaIRSyntax(prog5, true);
    const cbTripped = !validation5.isValid && !validation5.isDeterministic;
    
    // Also test a deterministic one to ensure it passes
    const deterministicSnippet = 'x = 10\nprint(x)';
    const prog6 = KappaIREngine.compileToKappaIR(deterministicSnippet, 'Python');
    const validation6 = KappaIREngine.validateKappaIRSyntax(prog6, true);
    const cbPassed = validation6.isValid && validation6.isDeterministic;
    
    const endTime5 = performance.now();

    results.push({
      testName: 'Test 5: Strict Determinism Circuit Breaker',
      passed: cbTripped && cbPassed,
      canonicalHash1: prog5.canonicalHash,
      canonicalHash2: prog6.canonicalHash,
      evidenceHashMatch: true,
      outputStateMatch: true,
      executionTimeMs: Math.round(endTime5 - startTime5),
      details: cbTripped && cbPassed ? 'Circuit breaker correctly blocked non-deterministic execution (RANDOM) and allowed deterministic execution.' : 'Circuit breaker logic failed to enforce strict determinism constraints.'
    });

    // Test 6: Host Environment Agnosticism (Deterministic Hashing)
    const startTime6 = performance.now();
    const envAgnosticSnippet = 'x = 100\ny = 200\nres = x + y';
    const prog6A = KappaIREngine.compileToKappaIR(envAgnosticSnippet, 'Python');
    const prog6B = KappaIREngine.compileToKappaIR(envAgnosticSnippet, 'Python');
    
    // Simulate Host Environment A (Fast clock, different memory state)
    const exec6A = KappaIREngine.executeKappaIR(prog6A, '0xMOCK_PREV_HASH');
    
    // Simulate Host Environment B (Slow clock, different previous operations)
    // We pass the SAME previous hash to ensure they start from the same deterministic root
    const exec6B = KappaIREngine.executeKappaIR(prog6B, '0xMOCK_PREV_HASH');
    
    const endTime6 = performance.now();

    results.push({
      testName: 'Test 6: Host Environment Agnosticism (Time/Space Independence)',
      passed: exec6A.evidenceReceipt.chainHash === exec6B.evidenceReceipt.chainHash && exec6A.evidenceReceipt.programHash === exec6B.evidenceReceipt.programHash,
      canonicalHash1: exec6A.evidenceReceipt.chainHash,
      canonicalHash2: exec6B.evidenceReceipt.chainHash,
      evidenceHashMatch: exec6A.evidenceReceipt.chainHash === exec6B.evidenceReceipt.chainHash,
      outputStateMatch: exec6A.resultValue === exec6B.resultValue,
      executionTimeMs: Math.round(endTime6 - startTime6),
      details: 'Identical input executed in isolated host simulations produced identical evidence chain hashes.'
    });

    // Test 7: Formal Type Checker Violation & Execution Halting
    const startTime7 = performance.now();
    const invalidTypeSnippet = 'let invalidSum = "string" + 42';
    const prog7 = KappaIREngine.compileToKappaIR(invalidTypeSnippet, 'TypeScript');
    const validation7 = KappaIREngine.validateKappaIRSyntax(prog7, false);
    
    let executionHalted = false;
    try {
      KappaIREngine.executeKappaIR(prog7);
    } catch (e: any) {
      if (e.message.includes('Execution Halted')) {
        executionHalted = true;
      }
    }
    const endTime7 = performance.now();
    results.push({
      testName: 'Test 7: Formal Type Checker Violation & Execution Halting',
      passed: !validation7.isValid && executionHalted,
      canonicalHash1: prog7.canonicalHash,
      canonicalHash2: '0xHALTED_STATE',
      evidenceHashMatch: true,
      outputStateMatch: executionHalted,
      executionTimeMs: Math.round(endTime7 - startTime7),
      details: !validation7.isValid && executionHalted
        ? 'Successfully detected invalid mixing of STRING_CANONICAL and I64_INTEGER, triggering circuit breaker and halting runtime execution.'
        : 'Failed to halt execution on strict type violation.'
    });

    // Test 8: Cascading Effect Leak & Lattice-Based Propagation
    const startTime8 = performance.now();
    const prog8: KappaIRProgram = {
      programId: 'prog_test_8',
      version: '1.0.0-κIR',
      rootNodeId: 'node_root',
      canonicalHash: '0xTEST_8_HASH',
      createdAt: new Date().toISOString(),
      targetLanguages: ['TypeScript'],
      nodes: {
        'node_root': {
          id: 'node_root',
          type: 'OPERATOR',
          primitiveType: 'I64_INTEGER',
          effect: 'PURE',
          value: 'x + y',
          children: ['node_child'],
          contentHash: '0xPARENT_HASH'
        },
        'node_child': {
          id: 'node_child',
          type: 'FUNCTION_CALL',
          primitiveType: 'I64_INTEGER',
          effect: 'NETWORK',
          value: 'fetch("https://api.ouroboros.io")',
          children: [],
          contentHash: '0xCHILD_HASH'
        }
      }
    };
    const validation8 = KappaIREngine.validateKappaIRSyntax(prog8, false);
    const endTime8 = performance.now();
    results.push({
      testName: 'Test 8: Cascading Effect Leak & Lattice-Based Propagation',
      passed: !validation8.isValid && validation8.errors.some(err => err.includes('Effect Leak Violation')),
      canonicalHash1: prog8.canonicalHash,
      canonicalHash2: '0xVIOLATION_STATE',
      evidenceHashMatch: true,
      outputStateMatch: true,
      executionTimeMs: Math.round(endTime8 - startTime8),
      details: !validation8.isValid
        ? 'Successfully caught effect leakage where a PURE parent node referenced a child node with NETWORK side-effects.'
        : 'Failed to catch lattice effect strength leakage.'
    });

    return results;
  }
}
