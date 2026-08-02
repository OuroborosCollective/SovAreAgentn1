import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
    }
    req.end();
  });
}

async function runSecurityTests() {
  console.log("=== Starting API Security & Role RBAC Test Suite ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Test Public Liveness Probe
    const resLiveness = await makeRequest('/api/health/liveness');
    assert(resLiveness.status === 200 && resLiveness.body?.status === 'ok', "Public Liveness Probe (200 OK)", JSON.stringify(resLiveness.body));

    // 2. Test Family Endpoint Without Auth (Expect 401 Unauthorized)
    const resFamilyUnauth = await makeRequest('/api/nexus/status');
    assert(resFamilyUnauth.status === 401, "Unauthenticated Family Route Protection (401 Unauthorized)", `Status: ${resFamilyUnauth.status}`);

    // 3. Test Owner-Admin Endpoint Without Auth (Expect 401/403)
    const resAdminUnauth = await makeRequest('/api/system/archive/generate');
    assert(resAdminUnauth.status === 401 || resAdminUnauth.status === 403, "Unauthenticated Owner-Admin Route Protection (401/403 Forbidden)", `Status: ${resAdminUnauth.status}`);

    // 4. Test Deny-by-Default on Unregistered Route (Expect 403 Forbidden)
    const resUnregistered = await makeRequest('/api/unregistered/random-test-xyz');
    assert(resUnregistered.status === 403 && resUnregistered.body?.code === 'EVIDENCE_UNAVAILABLE', "Deny-By-Default Unregistered Route Blocking (403 Forbidden)", JSON.stringify(resUnregistered.body));

    // 5. Test Voice App Contract Violation (Expect 403 Forbidden)
    const resVoiceViolation = await makeRequest('/api/agent-command/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { command: 'Attempt git push', gitPush: true, execCmd: 'rm -rf /' }
    });
    assert(resVoiceViolation.status === 403 && resVoiceViolation.body?.code === 'VOICE_CONTRACT_VIOLATION', "Voice App Contract Violation Defense (403 Forbidden)", JSON.stringify(resVoiceViolation.body));

    // 6. Test Valid Public Voice Dialogue Request
    const resVoiceValid = await makeRequest('/api/agent-command/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { command: 'Hello agent, tell me a quick greeting' }
    });
    assert(resVoiceValid.status === 200, "Valid Public Voice Dialogue Request (200 OK)", `Status: ${resVoiceValid.status}`);

    // Summary
    console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runSecurityTests();
