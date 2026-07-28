import { voiceService } from '../services/voiceService';

export interface ValidationTestResult {
  testName: string;
  category: 'API_ENDPOINT' | 'VOICE_SERVICE' | 'BUFFER_STATE' | 'DETERMINISTIC_ROUTER';
  success: boolean;
  latencyMs: number;
  details: string;
}

export async function runCompleteRuntimeValidation(): Promise<{
  totalTests: number;
  passCount: number;
  failCount: number;
  results: ValidationTestResult[];
  timestamp: string;
}> {
  const results: ValidationTestResult[] = [];
  const startTimeTotal = performance.now();

  // Test 1: FreeLLM Status Endpoint
  const start1 = performance.now();
  let success1 = false;
  let details1 = '';
  try {
    const res = await fetch('/api/freellm/v0.5.0/status');
    const data = await res.json();
    success1 = res.ok && data.status === 'HEALTHY';
    details1 = `Status code ${res.status}, response: ${JSON.stringify(data).substring(0, 100)}`;
  } catch (e: any) {
    details1 = `Error: ${e.message}`;
  }
  results.push({
    testName: 'GET /api/freellm/v0.5.0/status',
    category: 'API_ENDPOINT',
    success: success1,
    latencyMs: Math.round(performance.now() - start1),
    details: details1
  });

  // Test 2: FreeLLM Routes Endpoint
  const start2 = performance.now();
  let success2 = false;
  let details2 = '';
  try {
    const res = await fetch('/api/freellm/v0.5.0/routes');
    const data = await res.json();
    success2 = res.ok && Array.isArray(data.routes) && data.routes.length > 0;
    details2 = `Found ${data.routes?.length || 0} routes with active failover priorities.`;
  } catch (e: any) {
    details2 = `Error: ${e.message}`;
  }
  results.push({
    testName: 'GET /api/freellm/v0.5.0/routes',
    category: 'API_ENDPOINT',
    success: success2,
    latencyMs: Math.round(performance.now() - start2),
    details: details2
  });

  // Test 3: FreeLLM Generate Endpoint with Rate Limit Simulation
  const start3 = performance.now();
  let success3 = false;
  let details3 = '';
  try {
    const res = await fetch('/api/freellm/v0.5.0/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_path: '/api/freellm/v0.5.0/generate?route=keller-01', simulate_rate_limit: true })
    });
    const data = await res.json();
    success3 = res.ok && data.rate_limit_resolved === true;
    details3 = `Rate limit simulation resolved via ${data.active_route_used}, ADE hash: ${data.ade_hash}`;
  } catch (e: any) {
    details3 = `Error: ${e.message}`;
  }
  results.push({
    testName: 'POST /api/freellm/v0.5.0/generate (429 Simulate)',
    category: 'DETERMINISTIC_ROUTER',
    success: success3,
    latencyMs: Math.round(performance.now() - start3),
    details: details3
  });

  // Test 4: FreeLLM ADE Check Endpoint
  const start4 = performance.now();
  let success4 = false;
  let details4 = '';
  try {
    const res = await fetch('/api/freellm/v0.5.0/ade-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_path: '/api/freellm/v0.5.0/generate?route=keller-01' })
    });
    const data = await res.json();
    success4 = res.ok && data.ade_verified === true;
    details4 = `ADE Signature: ${data.signature}, status: ${data.status}`;
  } catch (e: any) {
    details4 = `Error: ${e.message}`;
  }
  results.push({
    testName: 'POST /api/freellm/v0.5.0/ade-check',
    category: 'API_ENDPOINT',
    success: success4,
    latencyMs: Math.round(performance.now() - start4),
    details: details4
  });

  // Test 5: Voice Service Puck Diagnostic & Serialization
  const start5 = performance.now();
  let success5 = false;
  let details5 = '';
  try {
    const diag = voiceService.runPuckDiagnosticTest();
    success5 = diag.success && diag.voiceName === 'Puck' && diag.streamBufferHealth === 100;
    details5 = `Puck config verified: Pitch=${diag.pitch}, Rate=${diag.rate}, SampleRate=${diag.sampleRate}Hz`;
  } catch (e: any) {
    details5 = `Error: ${e.message}`;
  }
  results.push({
    testName: 'Puck Voice Diagnostic & Parameter Serialization',
    category: 'VOICE_SERVICE',
    success: success5,
    latencyMs: Math.round(performance.now() - start5),
    details: details5
  });

  // Test 6: Voice Service Streaming Buffer & TTL Queue Status
  const start6 = performance.now();
  let success6 = false;
  let details6 = '';
  try {
    const buf = voiceService.getBufferStatus();
    success6 = typeof buf.bufferSizeKb === 'number' && typeof buf.offsetMs === 'number';
    details6 = `Buffer Size: ${buf.bufferSizeKb}KB, Offset: ${buf.offsetMs}ms, Queue: ${buf.queueLength}, TTL Expired: ${buf.ttlExpiredCount}`;
  } catch (e: any) {
    details6 = `Error: ${e.message}`;
  }
  results.push({
    testName: 'HiaResonance Voice Streaming Buffer & TTL Validation',
    category: 'BUFFER_STATE',
    success: success6,
    latencyMs: Math.round(performance.now() - start6),
    details: details6
  });

  const passCount = results.filter(r => r.success).length;
  const failCount = results.length - passCount;

  return {
    totalTests: results.length,
    passCount,
    failCount,
    results,
    timestamp: new Date().toISOString()
  };
}
