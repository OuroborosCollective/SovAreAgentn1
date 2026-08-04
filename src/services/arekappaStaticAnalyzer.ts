import { KappaIRProgram, KappaIRNode, KappaEffect, KappaPrimitiveType } from '../types/arekappa';

export interface StaticAnalysisIssue {
  nodeId: string;
  type: 'TYPE_VIOLATION' | 'EFFECT_VIOLATION' | 'DETERMINISM_VIOLATION' | 'SYNTAX_VIOLATION';
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface StaticAnalysisReport {
  isValid: boolean;
  circuitBreakerState: 'CLOSED' | 'TRIPPED';
  issues: StaticAnalysisIssue[];
  checkedNodesCount: number;
  isDeterministic: boolean;
  timestamp: string;
}

export class AREKappaStaticAnalyzer {
  /**
   * Performs formal static analysis of a κIR v1 program.
   * Trips the circuit breaker (halting execution) upon type check or critical effect violations.
   */
  public static analyze(program: KappaIRProgram): StaticAnalysisReport {
    const issues: StaticAnalysisIssue[] = [];
    let checkedNodesCount = 0;
    let isDeterministic = true;
    let circuitBreakerTripped = false;

    if (!program || program.version !== '1.0.0-κIR') {
      issues.push({
        nodeId: 'program_meta',
        type: 'SYNTAX_VIOLATION',
        severity: 'ERROR',
        message: 'Invalid κIR program version. Expected 1.0.0-κIR.'
      });
      circuitBreakerTripped = true;
    }

    if (!program.nodes || Object.keys(program.nodes).length === 0) {
      issues.push({
        nodeId: 'program_nodes',
        type: 'SYNTAX_VIOLATION',
        severity: 'ERROR',
        message: 'κIR program contains zero AST nodes.'
      });
      circuitBreakerTripped = true;
    }

    const validEffects: KappaEffect[] = ['PURE', 'READ', 'WRITE', 'NETWORK', 'CLOCK', 'RANDOM', 'PROCESS'];
    const nonDeterministicEffects: KappaEffect[] = ['NETWORK', 'CLOCK', 'RANDOM', 'PROCESS', 'READ'];
    const validPrimitiveTypes: KappaPrimitiveType[] = [
      'I64_INTEGER', 
      'RATIONAL_EXACT', 
      'BOOLEAN', 
      'STRING_CANONICAL', 
      'SUBSTRATE_ADDRESS', 
      'EVIDENCE_HASH', 
      'HYPERGRAPH_NODE'
    ];

    if (circuitBreakerTripped) {
      return {
        isValid: false,
        circuitBreakerState: 'TRIPPED',
        issues,
        checkedNodesCount,
        isDeterministic: false,
        timestamp: new Date().toISOString()
      };
    }

    // Traverse all nodes and perform type checking & effect validation
    for (const [nodeId, node] of Object.entries(program.nodes)) {
      checkedNodesCount++;

      // 1. Check basic node structure
      if (!node.id || !node.contentHash) {
        issues.push({
          nodeId: nodeId,
          type: 'SYNTAX_VIOLATION',
          severity: 'ERROR',
          message: 'Node is missing mandatory fields: id or contentHash.'
        });
        circuitBreakerTripped = true;
        continue;
      }

      // 2. Formal Type Checking
      if (!node.primitiveType || !validPrimitiveTypes.includes(node.primitiveType)) {
        issues.push({
          nodeId: node.id,
          type: 'TYPE_VIOLATION',
          severity: 'ERROR',
          message: `Type Check Violation: Node [${node.id}] has invalid or missing primitive type '${node.primitiveType}'.`
        });
        circuitBreakerTripped = true;
      }

      // 3. Effect Validation
      if (!node.effect || !validEffects.includes(node.effect)) {
        issues.push({
          nodeId: node.id,
          type: 'EFFECT_VIOLATION',
          severity: 'ERROR',
          message: `Effect Constraint Violation: Node [${node.id}] has invalid or missing effect constraints: '${node.effect}'.`
        });
        circuitBreakerTripped = true;
      }

      // 4. Determinism Check
      if (node.effect && nonDeterministicEffects.includes(node.effect)) {
        isDeterministic = false;
        issues.push({
          nodeId: node.id,
          type: 'DETERMINISM_VIOLATION',
          severity: 'WARNING',
          message: `Node [${node.id}] introduces non-deterministic effect '${node.effect}'. Execution remains valid but unverifiable.`
        });
      }

      // 5. Semantic Coherence & Child Type Consistency Check (Operator & Assignment Type Check)
      if (typeof node.value === 'string') {
        const val = node.value;

        // Zero-float check: ensure no decimal point floats in numerical literal values
        if (val.includes('.') && !val.includes('"') && !val.includes("'")) {
          issues.push({
            nodeId: node.id,
            type: 'TYPE_VIOLATION',
            severity: 'ERROR',
            message: `Zero-Float Violation in Node [${node.id}]: Value contains floating-point representation (${val}). Rational or integer types required.`
          });
          circuitBreakerTripped = true;
        }

        // Strict validation of I64_INTEGER and STRING_CANONICAL mixing
        const hasString = val.includes('"') || val.includes("'");
        const hasInteger = /\b\d+\b/.test(val);
        const hasArithmetic = /[\+\-\*\/]/.test(val);

        if (hasString && hasInteger && hasArithmetic) {
          issues.push({
            nodeId: node.id,
            type: 'TYPE_VIOLATION',
            severity: 'ERROR',
            message: `Type Check Violation: Node [${node.id}] value contains invalid mixing of STRING_CANONICAL and I64_INTEGER in operation: '${val}'.`
          });
          circuitBreakerTripped = true;
        }

        // Variable assignment strict checking
        if (node.type === 'VARIABLE' && val.includes('=')) {
          const [, rightSide] = val.split('=').map(s => s.trim());
          const isStringLiteral = rightSide.includes('"') || rightSide.includes("'");
          const isIntegerLiteral = /^\d+$/.test(rightSide);
          const isBooleanLiteral = ['true', 'false', 'True', 'False'].includes(rightSide);

          if (isStringLiteral && node.primitiveType !== 'STRING_CANONICAL') {
            issues.push({
              nodeId: node.id,
              type: 'TYPE_VIOLATION',
              severity: 'ERROR',
              message: `Type Check Violation: Variable Node [${node.id}] value is a string literal but primitive type is declared as '${node.primitiveType}'.`
            });
            circuitBreakerTripped = true;
          }
          if (isIntegerLiteral && node.primitiveType !== 'I64_INTEGER') {
            issues.push({
              nodeId: node.id,
              type: 'TYPE_VIOLATION',
              severity: 'ERROR',
              message: `Type Check Violation: Variable Node [${node.id}] value is an integer literal but primitive type is declared as '${node.primitiveType}'.`
            });
            circuitBreakerTripped = true;
          }
          if (isBooleanLiteral && node.primitiveType !== 'BOOLEAN') {
            issues.push({
              nodeId: node.id,
              type: 'TYPE_VIOLATION',
              severity: 'ERROR',
              message: `Type Check Violation: Variable Node [${node.id}] value is a boolean literal but primitive type is declared as '${node.primitiveType}'.`
            });
            circuitBreakerTripped = true;
          }
        }
      }

      if (node.type === 'OPERATOR' && typeof node.value === 'string') {
        const val = node.value;
        const arithmeticOperators = ['+', '-', '*', '/'];
        const isArithmetic = arithmeticOperators.some(op => val.includes(op));

        if (isArithmetic) {
          // Arithmetic operator expects I64_INTEGER or RATIONAL_EXACT operands
          if (node.primitiveType !== 'I64_INTEGER' && node.primitiveType !== 'RATIONAL_EXACT') {
            issues.push({
              nodeId: node.id,
              type: 'TYPE_VIOLATION',
              severity: 'ERROR',
              message: `Type Check Violation: Arithmetic Node [${node.id}] has non-numeric type '${node.primitiveType}'.`
            });
            circuitBreakerTripped = true;
          }

          // Inspect child node types if available
          if (node.children && node.children.length > 0) {
            for (const childId of node.children) {
              const childNode = program.nodes[childId];
              if (childNode) {
                if (childNode.primitiveType === 'STRING_CANONICAL' || childNode.primitiveType === 'BOOLEAN') {
                  issues.push({
                    nodeId: node.id,
                    type: 'TYPE_VIOLATION',
                    severity: 'ERROR',
                    message: `Type Mismatch: Arithmetic Node [${node.id}] references invalid child type Node [${childId}] ('${childNode.primitiveType}').`
                  });
                  circuitBreakerTripped = true;
                }
              }
            }
          }
        }
      }

      // 7. Cascading Effect propagation: Lattice-based effect verification
      const effectStrength: Record<KappaEffect, number> = {
        'PURE': 0,
        'CLOCK': 1,
        'RANDOM': 2,
        'READ': 3,
        'WRITE': 4,
        'PROCESS': 5,
        'NETWORK': 6
      };

      if (node.children && node.children.length > 0) {
        for (const childId of node.children) {
          const childNode = program.nodes[childId];
          if (childNode) {
            const parentStrength = effectStrength[node.effect] ?? 0;
            const childStrength = effectStrength[childNode.effect] ?? 0;
            if (childStrength > parentStrength) {
              issues.push({
                nodeId: node.id,
                type: 'EFFECT_VIOLATION',
                severity: 'ERROR',
                message: `Effect Leak: Node [${node.id}] with effect constraint '${node.effect}' references child Node [${childId}] with less restrictive effect constraint '${childNode.effect}'.`
              });
              circuitBreakerTripped = true;
            }
          }
        }
      }
    }

    return {
      isValid: !circuitBreakerTripped && issues.filter(i => i.severity === 'ERROR').length === 0,
      circuitBreakerState: circuitBreakerTripped ? 'TRIPPED' : 'CLOSED',
      issues,
      checkedNodesCount,
      isDeterministic,
      timestamp: new Date().toISOString()
    };
  }
}
