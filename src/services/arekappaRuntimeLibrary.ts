import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { KappaIRProgram, KappaIRNode } from '../types/arekappa';

export interface PredictiveMetrics {
  failureProbability: number; // 0.0 to 1.0
  estimatedLatencyMs: number;
  memoryFootprintBytes: number;
  riskFactors: string[];
}

export interface MockViolation {
  filePath: string;
  detectedPattern: string;
  line: number;
  snippet: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface WolframSystemStatus {
  totalFilesScanned: number;
  mockViolations: MockViolation[];
  systemHealthy: boolean;
  timestamp: string;
}

export class AREKappaRuntimeLibrary {
  private static ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  /**
   * Predictive Inference: Calculates the failure probability, estimated latency, 
   * and memory footprint of a compiled κIR program based on node densities and effects.
   */
  public static predictMetrics(program: KappaIRProgram): PredictiveMetrics {
    let baseFailureProb = 0.01; // 1% default safe pure probability
    let estimatedLatencyMs = 5; // 5ms baseline
    let memoryFootprintBytes = 1024; // 1KB baseline
    const riskFactors: string[] = [];

    const nodes = Object.values(program.nodes);
    const nodeCount = nodes.length;

    estimatedLatencyMs += nodeCount * 2; // +2ms per AST node
    memoryFootprintBytes += nodeCount * 512; // +512 bytes per node representation

    nodes.forEach(node => {
      switch (node.effect) {
        case 'NETWORK':
          baseFailureProb += 0.15; // +15% failure risk for network dependency
          estimatedLatencyMs += 120; // +120ms network delay
          riskFactors.push(`Node [${node.id}] introduces NETWORK IO latency and reliability risks.`);
          break;
        case 'PROCESS':
          baseFailureProb += 0.08;
          estimatedLatencyMs += 40;
          riskFactors.push(`Node [${node.id}] performs heavy host PROCESS operations.`);
          break;
        case 'WRITE':
          baseFailureProb += 0.03;
          estimatedLatencyMs += 10;
          memoryFootprintBytes += 256;
          break;
        case 'READ':
          baseFailureProb += 0.04;
          estimatedLatencyMs += 15;
          break;
        case 'CLOCK':
          baseFailureProb += 0.02;
          riskFactors.push(`Node [${node.id}] accesses host CLOCK (non-deterministic source).`);
          break;
        case 'RANDOM':
          baseFailureProb += 0.05;
          riskFactors.push(`Node [${node.id}] relies on host entropy RANDOM (unverifiable).`);
          break;
        default:
          break;
      }

      // Check primitive types complexity
      if (node.primitiveType === 'HYPERGRAPH_NODE') {
        memoryFootprintBytes += 4096; // +4KB for hypergraph references
        estimatedLatencyMs += 5;
      }
    });

    // Constrain probability
    const failureProbability = Math.min(Number(baseFailureProb.toFixed(3)), 0.99);

    return {
      failureProbability,
      estimatedLatencyMs,
      memoryFootprintBytes,
      riskFactors: Array.from(new Set(riskFactors))
    };
  }

  /**
   * Wolfram Analytics Module: Scans the workspace directory to verify system function sanity
   * and find "not allowed mock, stub or Facade fake function integrations".
   */
  public static runWolframSystemScan(): WolframSystemStatus {
    const violations: MockViolation[] = [];
    let fileCount = 0;

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (['node_modules', 'dist', '.git', '.cache', 'ssl', 'build'].includes(entry.name)) {
            continue;
          }
          walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            fileCount++;
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              
              lines.forEach((line, index) => {
                const lowerLine = line.toLowerCase();
                // Flag explicit mocks, stubs, fakes, or static dummy arrays as facade violations
                const isMockKeyword = 
                  lowerLine.includes('mockdata') || 
                  lowerLine.includes('fakeuser') ||
                  lowerLine.includes('mockendpoint') ||
                  lowerLine.includes('dummy_data') ||
                  lowerLine.includes('class fakeservice') ||
                  lowerLine.includes('const getmock') ||
                  (lowerLine.includes('return [') && lowerLine.includes('mock')) ||
                  (lowerLine.includes('facade') && lowerLine.includes('mock'));

                if (isMockKeyword && !fullPath.includes('arekappaRuntimeLibrary') && !fullPath.includes('arekappaBackgroundService')) {
                  violations.push({
                    filePath: path.relative(process.cwd(), fullPath),
                    detectedPattern: line.trim(),
                    line: index + 1,
                    snippet: line.trim().substring(0, 100),
                    severity: lowerLine.includes('critical') || lowerLine.includes('endpoint') ? 'CRITICAL' : 'WARNING'
                  });
                }
              });
            } catch (err) {
              console.warn(`[Wolfram Analytics] Unable to read file ${fullPath}:`, err);
            }
          }
        }
      }
    };

    walk(path.join(process.cwd(), 'src'));

    return {
      totalFilesScanned: fileCount,
      mockViolations: violations,
      systemHealthy: violations.length === 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Invokes Gemini-3.6-flash (the smallest capable LLM model for accurate coding action) 
   * to devise a repair patch and rewrite the flagged file to eliminate the mock.
   */
  public static async executeGeminiSelfRepair(filePath: string, issueSnippet: string): Promise<{ success: boolean; error?: string; repairedCode?: string }> {
    const absolutePath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    try {
      const originalCode = fs.readFileSync(absolutePath, 'utf-8');
      
      const repairPrompt = `
        You are the AREKappa Self-Repair Autonomic Engine.
        We detected a prohibited "mock stub, fake data, or facade function integration" violation in the file: ${filePath}
        
        Violation details: ${issueSnippet}

        The goal is to eliminate this fake facade and replace it with a real, robust, production-ready full-stack integration (e.g. querying a real database, calling a live service, or performing the proper state calculations), whilst preserving all TypeScript types and exact function signatures so the rest of the application builds successfully.

        Original File Content:
        \`\`\`typescript
        ${originalCode}
        \`\`\`

        Instructions:
        1. Rewrite the code to eliminate the fake, mock, or stub behavior.
        2. Replace mock static data arrays with real dynamic database state getters, parameter calculations, or actual functional logic.
        3. Do NOT change public exports, function signatures, props types, or class names so we do not break dependents.
        4. Do NOT output markdown explanations or talking. Output ONLY the raw updated typescript file content, with no markdown wrappers or quotes.
      `;

      // Use gemini-flash-latest as instructed (smallest capable model for coding actions)
      const response = await this.ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: repairPrompt,
      });

      let repairedCode = response.text || "";
      // Clean up potential markdown wrapper returned by model
      if (repairedCode.startsWith('```')) {
        repairedCode = repairedCode.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }

      if (repairedCode && repairedCode.trim().length > 10) {
        fs.writeFileSync(absolutePath, repairedCode, 'utf-8');
        return { success: true, repairedCode };
      } else {
        throw new Error("Model returned empty or invalid repaired code.");
      }
    } catch (err: any) {
      console.error(`[Gemini Self-Repair] Failed to repair ${filePath}:`, err);
      return { success: false, error: err.message || 'Unknown repair failure' };
    }
  }
}
