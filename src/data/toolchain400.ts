import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
export interface ToolDefinition {
  id: string;
  name: string;
  category: 'SQL & Database' | 'System Integration' | 'Code & Syntax Repair' | 'AI & Heuristics' | 'Docker & Runtime' | 'Security & Network' | 'Data & Performance';
  description: string;
  endpoint: string;
  method: 'POST' | 'GET' | 'PUT';
  parameters: string[];
  executionTimeMs: number;
  tags: string[];
  autoRepairable: boolean;
}

const CATEGORIES: ToolDefinition['category'][] = [
  'SQL & Database',
  'System Integration',
  'Code & Syntax Repair',
  'AI & Heuristics',
  'Docker & Runtime',
  'Security & Network',
  'Data & Performance'
];

const SQL_TEMPLATES = [
  'Query Syntax Auto-Corrector',
  'Index Cardinality Optimizer',
  'Deadlock Resolver & Lock Guard',
  'Constraint Violation Sanitizer',
  'Foreign Key Cascade Validator',
  'Prepared Statement Escaper',
  'Column Type Mismatch Converter',
  'Connection Pool Leak Detector',
  'Migration Drift Harmonizer',
  'Slow Query Profiler & Rewriter',
  'ORM Schema Dither Synchronizer',
  'WAL Log Truncation Trigger',
  'Transaction Isolation Level Asserter',
  'Partition Key Rebalancer',
  'Read-Replica Lag Compensator',
  'Full-Text Search Index Rebuilder',
  'JSONB Path Query Auto-Indexer',
  'Recursive CTE Cycle Guard',
  'Sequence Reset & Gap Healer',
  'View Materialization Flusher'
];

const SYSTEM_TEMPLATES = [
  'API Gateway Route Auto-Registrar',
  'Webhook Handshake Verifier',
  'CORS Preflight Header Injector',
  'Rate Limit Backoff Throttler',
  'IPC Socket Re-binder',
  'Service Mesh Proxy Refresher',
  'Event Bus Channel Re-subscriber',
  'gRPC Proto Def Synchronizer',
  'Kafka Partition Re-balancer',
  'OAuth Token Auto-Renewer',
  'GraphQL Schema Stitcher',
  'TLS Certificate Chain Validator',
  'DNS Resolution Cache Purger',
  'Load Balancer Health Probe',
  'Microservice Heartbeat Sentinel',
  'PubSub Dead Letter Drainer',
  'Circuit Breaker Tripper & Reset',
  'HTTP/2 Multiplexing Tuning',
  'RPC Payload Compressor',
  'Edge Function Warmup Pinger'
];

const CODE_REPAIR_TEMPLATES = [
  'AST Syntax Tree Auto-Fixer',
  'Type Stripping Enforcer',
  'Unused Import Pruner',
  'Dangling Promise Catch Injector',
  'Nullish Coalescing Guard',
  'Memory Leak Observer',
  'Cyclomatic Complexity Reducer',
  'Variable Shadowing Disambiguator',
  'Regex Backtracking Guard',
  'Event Listener Detacher',
  'Closure Leak Neutralizer',
  'Infinite Loop Break Injector',
  'Deprecated API Replacer',
  'Strict Null Check Adapter',
  'Async/Await Race Preventer',
  'Module ESM Path Resolver',
  'Symbol Collision Resolver',
  'CSS Selector Scoper',
  'DOM Mutation Observer Throttler',
  'Garbage Collection Trigger'
];

const AI_HEURISTIC_TEMPLATES = [
  'Prompt Context Window Pruner',
  'Token Queue Priority Scheduler',
  'Hallucination Log Filter',
  'Embeddings Vector Re-indexer',
  'Temperature Dynamic Calibrator',
  'Agent Heuristic Loop Guard',
  'Multi-Agent Consensus Arbiter',
  'Reasoning Chain Truncator',
  'Semantic Memory Recaller',
  'Zero-Shot Fallback Generator',
  'Few-Shot Prompt Synthesizer',
  'LLM Latency Predictor',
  'Tool Call Schema Validator',
  'Feedback Loop Reward Tuner',
  'Context Cache Pre-warmer',
  'Safety Guardrail Evaluator',
  'Token Cost Budgeting Engine',
  'Self-Correction Reflection Loop',
  'Agent Skill Vector Matcher',
  'Prompt Drift Monitor'
];

const DOCKER_RUNTIME_TEMPLATES = [
  'Container Health Check Probe',
  'Port Forwarding Re-mapper',
  'Volume Mount Sync Guard',
  'Process PID 1 Signal Handler',
  'Resource Memory Limit Tuner',
  'Image Layer Cache Purger',
  'Docker Network Bridge Re-connector',
  'Environment Secret Injector',
  'Multi-Stage Build Optimizer',
  'Container Restart Loop Breaker',
  'Container Log File Rotator',
  'Daemon Socket Permission Fixer',
  'Alpine Package Dependency Resolver',
  'Cgroup V2 Limit Inspector',
  'Container DNS Resolver Fix',
  'IPC Namespace Isolation Guard',
  'Tmpfs Buffer Allocator',
  'Docker Compose Service Scaler',
  'Entrypoint Shell Escaper',
  'Container Idle Timeout Saver'
];

const SECURITY_TEMPLATES = [
  'SQL Injection Payload Sanitizer',
  'XSS Header Content-Security Guard',
  'CSRF Token Auto-Rotator',
  'Bearer JWT Signature Validator',
  'Rate Limit IP Firewall Rule',
  'Secrets Leakage AST Scanner',
  'Dependency Vulnerability Patcher',
  'Encryption Key Rotator',
  'Audit Trail Tamper Verifier',
  'RBAC Privilege Evaluator',
  'Input Serialization Validator',
  'Replay Attack Nonce Checker',
  'Subresource Integrity Injector',
  'Password Hash Upgrade Engine',
  'Brute Force Threshold Guard',
  'TLS Cipher Suite Hardener',
  'Session Hijack Invalidator',
  'API Key Scope Scrubber',
  'Sandbox Isolation Barrier',
  'Security Audit Log Exporter'
];

const DATA_PERF_TEMPLATES = [
  'High-Frequency Memory Scavenger',
  'Garbage Collection Heap Compact',
  'Key-Value Cache Invalidator',
  'B-Tree Index Fragmentation Healer',
  'Gzip Stream Compression Tuner',
  'Large Payload Chunk Splice',
  'Data Pipeline Throughput Booster',
  'WebSocket Frame Buffer Tuner',
  'Array Buffer Memory Allocator',
  'Delta Sync Differential Compiler',
  'Timeseries Aggregation Downsampler',
  'File Stream Backpressure Valve',
  'JSON Serializer Fast-Path',
  'Blob Memory URL Revoker',
  'Redundant State Re-render Filter',
  'Disk I/O Queue De-duplicator',
  'Network Packet Batcher',
  'LRU Cache Capacity Resizer',
  'Worker Thread Pool Balancer',
  'State Snapshot Delta Diff Engine'
];

// Generate exactly 400 distinct tools programmatically to ensure full coverage
export const generate400Tools = (): ToolDefinition[] => {
  const tools: ToolDefinition[] = [];
  let idCount = 1;

  const groups = [
    { cat: 'SQL & Database' as const, templates: SQL_TEMPLATES },
    { cat: 'System Integration' as const, templates: SYSTEM_TEMPLATES },
    { cat: 'Code & Syntax Repair' as const, templates: CODE_REPAIR_TEMPLATES },
    { cat: 'AI & Heuristics' as const, templates: AI_HEURISTIC_TEMPLATES },
    { cat: 'Docker & Runtime' as const, templates: DOCKER_RUNTIME_TEMPLATES },
    { cat: 'Security & Network' as const, templates: SECURITY_TEMPLATES },
    { cat: 'Data & Performance' as const, templates: DATA_PERF_TEMPLATES }
  ];

  // Generate 400 unique tools
  while (tools.length < 400) {
    const groupIdx = tools.length % groups.length;
    const group = groups[groupIdx];
    const templateIdx = Math.floor(tools.length / groups.length) % group.templates.length;
    const templateName = group.templates[templateIdx];
    const variantNumber = Math.floor(tools.length / (groups.length * group.templates.length)) + 1;

    const toolName = variantNumber === 1 ? templateName : `${templateName} [v${variantNumber}]`;
    const toolId = `tool_${String(idCount).padStart(3, '0')}`;

    tools.push({
      id: toolId,
      name: toolName,
      category: group.cat,
      description: `Self-aware tool ${toolId}: Automated ${toolName.toLowerCase()} routine for autonomous platform self-healing, active monitoring, and API proxy execution.`,
      endpoint: `/api/toolchain/execute/${toolId}`,
      method: 'POST',
      parameters: ['target_scope', 'auto_apply', 'log_level'],
      executionTimeMs: Math.floor(generateDeterministicNumber(12, 92, performance.now())),
      tags: [group.cat.toLowerCase().replace(/\s+/g, '-'), 'self-aware', 'v3-engine', 'auto-repair'],
      autoRepairable: true
    });

    idCount++;
  }

  return tools;
};

export const TOOLCHAIN_400 = generate400Tools();
