import { describe, it, expect } from 'vitest';
import { WolframResearchSandbox } from '../../src/services/wolframResearchSandbox';
import { KappaIREngine } from '../../src/services/kappaIREngine';

describe('WolframResearchSandbox - No Mock Validation', () => {
  describe('evaluateSymbolicResearch', () => {
    it('should execute quadratic equation Solve[x^2-5x+6==0,x] and return correct roots', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x^2-5x+6==0,x]', 'QuadraticTest');
      
      expect(result.status).toBe('VERIFIED');
      expect(result.exactResult).toBe('x ∈ {2,3}');
      expect(result.numericalResult).toBe('{2.0,3.0}');
      expect(result.kernelResult).toBe('{{x -> 2}, {x -> 3}}');
    });

    it('should execute simple addition equation Solve[x + x == 10, x]', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'AdditionTest');
      
      expect(result.status).toBe('VERIFIED');
      expect(result.exactResult).toBe('x = 5');
      expect(result.numericalResult).toBe('{5.0}');
    });

    it('should throw on write operation Write["data.txt", x]', () => {
      expect(() => {
        WolframResearchSandbox.evaluateSymbolicResearch('Write["data.txt", x + x]', 'WriteTest');
      }).toThrow(/POLICY VIOLATION/);
    });

    it('should throw on Export operation', () => {
      expect(() => {
        WolframResearchSandbox.evaluateSymbolicResearch('Export["output.csv", data]', 'ExportTest');
      }).toThrow(/POLICY VIOLATION/);
    });

    it('should throw on Delete operation', () => {
      expect(() => {
        WolframResearchSandbox.evaluateSymbolicResearch('Delete[file]', 'DeleteTest');
      }).toThrow(/POLICY VIOLATION/);
    });

    it('should return valid request and result hashes', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'HashTest');
      
      expect(result.requestHash).toBeTruthy();
      expect(result.resultHash).toBeTruthy();
      expect(result.requestHash).not.toBe(result.resultHash);
    });

    it('should return valid kernel module export', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'ModuleTest');
      
      expect(result.exportedKernelModule).toContain('AREKappa & WolframEngine 14.3');
      expect(result.exportedKernelModule).toContain('Read-Only, Isolated Sandbox');
      expect(result.exportedKernelModule).toContain('Module Name: ModuleTest');
    });

    it('should return correct kernel version', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'VersionTest');
      
      expect(result.kernelVersion).toBe('14.3.x');
      expect(result.executionMode).toBe('symbolic-exact');
    });

    it('should return exit code 0 on success', () => {
      const result = WolframResearchSandbox.evaluateSymbolicResearch('Solve[x + x == 10, x]', 'ExitCodeTest');
      
      expect(result.exitCode).toBe(0);
    });
  });
});

describe('KappaIREngine - No Mock Validation', () => {
  describe('computeContentHash', () => {
    it('should produce deterministic hashes', () => {
      const input = 'test-input';
      const hash1 = KappaIREngine.computeContentHash(input);
      const hash2 = KappaIREngine.computeContentHash(input);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = KappaIREngine.computeContentHash('input1');
      const hash2 = KappaIREngine.computeContentHash('input2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce valid κIR hash format', () => {
      const hash = KappaIREngine.computeContentHash('test');
      
      expect(hash).toMatch(/^0xκIR_[A-F0-9]+$/);
    });
  });

  describe('compileToKappaIR', () => {
    it('should compile Python code to κIR program', () => {
      const program = KappaIREngine.compileToKappaIR('x = 42\ny = 10', 'Python');
      
      expect(program.version).toBe('1.0.0-κIR');
      expect(program.nodes).toBeDefined();
      expect(Object.keys(program.nodes).length).toBeGreaterThan(0);
    });

    it('should compile TypeScript code to κIR program', () => {
      const program = KappaIREngine.compileToKappaIR('const a: number = 100', 'TypeScript');
      
      expect(program.version).toBe('1.0.0-κIR');
      expect(program.nodes).toBeDefined();
    });

    it('should detect NETWORK effect for fetch operations', () => {
      const program = KappaIREngine.compileToKappaIR('result = fetch(url)', 'Python');
      const nodes = Object.values(program.nodes);
      const fetchNode = nodes.find(n => n.effect === 'NETWORK');
      
      expect(fetchNode).toBeDefined();
    });

    it('should detect WRITE effect for print operations', () => {
      const program = KappaIREngine.compileToKappaIR('print(x)', 'Python');
      const nodes = Object.values(program.nodes);
      const printNode = nodes.find(n => n.effect === 'WRITE');
      
      expect(printNode).toBeDefined();
    });
  });

  describe('validateKappaIRSyntax', () => {
    it('should validate a valid program', () => {
      const program = KappaIREngine.compileToKappaIR('x = 42\ny = 10', 'Python');
      const result = KappaIREngine.validateKappaIRSyntax(program, false);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect non-deterministic effects when requireDeterminism is true', () => {
      const program = KappaIREngine.compileToKappaIR('result = Math.random()', 'Python');
      const result = KappaIREngine.validateKappaIRSyntax(program, true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Determinism Violation'))).toBe(true);
    });

    it('should detect type mixing violations', () => {
      const program = KappaIREngine.compileToKappaIR('let invalidSum = "string" + 42', 'TypeScript');
      const result = KappaIREngine.validateKappaIRSyntax(program, false);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Type Check Violation'))).toBe(true);
    });
  });

  describe('executeKappaIR', () => {
    it('should execute a valid κIR program', () => {
      const program = KappaIREngine.compileToKappaIR('x = 42\ny = 10', 'Python');
      const result = KappaIREngine.executeKappaIR(program);
      
      expect(result.resultValue).toBeDefined();
      expect(result.evidenceReceipt).toBeDefined();
      expect(result.evidenceReceipt.programHash).toBe(program.canonicalHash);
    });

    it('should generate valid evidence receipt', () => {
      const program = KappaIREngine.compileToKappaIR('x = 100\ny = 200', 'Python');
      const result = KappaIREngine.executeKappaIR(program);
      
      expect(result.evidenceReceipt.receiptId).toMatch(/^rcpt_/);
      expect(result.evidenceReceipt.chainHash).toBeTruthy();
      expect(result.evidenceReceipt.signature).toContain('SIG_ARE_κIR_VERIFIED');
    });

    it('should produce deterministic results for same input', () => {
      const program1 = KappaIREngine.compileToKappaIR('x = 42\ny = 10\nres = x + y', 'Python');
      const program2 = KappaIREngine.compileToKappaIR('x = 42\ny = 10\nres = x + y', 'Python');
      
      const result1 = KappaIREngine.executeKappaIR(program1);
      const result2 = KappaIREngine.executeKappaIR(program2);
      
      expect(result1.evidenceReceipt.chainHash).toBe(result2.evidenceReceipt.chainHash);
    });
  });
});

describe('DeterministicTestRunner Integration', () => {
  it('should validate Python snippet deterministic equivalence', () => {
    const samplePython = 'x = 42\ny = 10\nres = x + y';
    const prog1 = KappaIREngine.compileToKappaIR(samplePython, 'Python');
    const prog2 = KappaIREngine.compileToKappaIR(samplePython, 'Python');
    
    expect(prog1.canonicalHash).toBe(prog2.canonicalHash);
  });

  it('should validate TypeScript snippet deterministic equivalence', () => {
    const sampleTS = 'const a: number = 100;\nconst b: number = 5;\nconst total = a * b;';
    const prog1 = KappaIREngine.compileToKappaIR(sampleTS, 'TypeScript');
    const prog2 = KappaIREngine.compileToKappaIR(sampleTS, 'TypeScript');
    
    expect(prog1.canonicalHash).toBe(prog2.canonicalHash);
  });
});
