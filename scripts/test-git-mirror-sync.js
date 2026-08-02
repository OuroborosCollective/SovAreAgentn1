import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const AUTH_HEADER = { 'Authorization': 'Bearer test-nexus-sync-token', 'Content-Type': 'application/json' };

async function runMirrorSyncTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING GIT REPOSITORY MIRROR SYNC TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // 1. Unauthenticated Route Protection Test
  try {
    const resUnauth = await fetch(`${BASE_URL}/api/nexus/mirror-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(resUnauth.status === 401 || resUnauth.status === 403, 'Unauthenticated mirror sync protected with 401/403', `Got ${resUnauth.status}`);
  } catch (err) {
    assert(false, 'Unauthenticated mirror sync protection', err.message);
  }

  // 2. Authenticated GET /api/nexus/status
  try {
    const resStatus = await fetch(`${BASE_URL}/api/nexus/status`, {
      headers: AUTH_HEADER
    });
    const data = await resStatus.json();
    assert(
      resStatus.ok && typeof data.syncStatus === 'string' && typeof data.fileCount === 'number',
      'GET /api/nexus/status returns valid sync state structure',
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'GET /api/nexus/status', err.message);
  }

  // 3. Authenticated POST /api/nexus/mirror-sync
  try {
    const resMirror = await fetch(`${BASE_URL}/api/nexus/mirror-sync`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ autoPush: false })
    });
    const data = await resMirror.json();
    assert(
      resMirror.ok || resMirror.status === 409,
      'POST /api/nexus/mirror-sync executes mirror sync check',
      `HTTP ${resMirror.status}: ${JSON.stringify(data)}`
    );
  } catch (err) {
    assert(false, 'POST /api/nexus/mirror-sync', err.message);
  }

  // 4. Authenticated POST /api/nexus/conflicts/resolve validation
  try {
    const resInvalid = await fetch(`${BASE_URL}/api/nexus/conflicts/resolve`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ strategy: 'invalid-strategy' })
    });
    assert(
      resInvalid.status === 400,
      'POST /api/nexus/conflicts/resolve rejects invalid strategy with 400 Bad Request',
      `Got HTTP ${resInvalid.status}`
    );
  } catch (err) {
    assert(false, 'POST /api/nexus/conflicts/resolve strategy validation', err.message);
  }

  // 5. Authenticated POST /api/nexus/conflicts/resolve valid 'use-local' strategy
  try {
    const resResolve = await fetch(`${BASE_URL}/api/nexus/conflicts/resolve`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ strategy: 'use-local' })
    });
    const data = await resResolve.json();
    assert(
      resResolve.ok && data.status === 'success',
      'POST /api/nexus/conflicts/resolve resolves using strategy use-local',
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'POST /api/nexus/conflicts/resolve use-local', err.message);
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMirrorSyncTests();
