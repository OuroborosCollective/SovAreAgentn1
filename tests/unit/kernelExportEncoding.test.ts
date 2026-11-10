import { describe, expect, it } from 'vitest';
import { WolframResearchSandbox } from '../../src/services/wolframResearchSandbox';

describe('legacy kernel export uses data literals, not code interpolation', () => {
  it('round-trips backslashes, quotes, newlines and controls in the exported literal', () => {
    const source = 'x\\";\n\r\t\\u000a';
    const result = WolframResearchSandbox.evaluateSymbolicResearch(source, 'EncodingTest');
    const match = result.exportedKernelModule.match(/String expression = (.*);/);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1])).toBe(result.canonicalAST);
  });
  it('rejects a module name that can break out of a declaration or comment', () => {
    expect(() => WolframResearchSandbox.evaluateSymbolicResearch('1+1', 'Bad\nclass Injected {}'))
      .toThrow(/MODULE_NAME/);
  });
  it('does not label a local example as a verified external Wolfram kernel execution', () => {
    const result = WolframResearchSandbox.evaluateSymbolicResearch('1+1', 'Example');
    expect(result.status).toBe('SIMULATED');
    expect(result.runtimeRevision).toBe('unverified');
  });
});
