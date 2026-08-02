import http from 'http';
import { runBackupAndRestoreTest } from './db-backup-restore.js';

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

async function runHardeningTests() {
  console.log("=== Starting PostgreSQL & Vector Hardening Integration Suite ===");
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
    // 1. Unauthenticated / Arbitrary SQL Query Attempt (Expect 401 Unauthorized or 403 Forbidden)
    const resArbitrarySql = await makeRequest('/api/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { query: 'DROP TABLE IF EXISTS knowledge_vectors; SELECT * FROM pg_user;' }
    });
    assert(
      resArbitrarySql.status === 401 || resArbitrarySql.status === 403,
      "Arbitrary SQL Execution Protection (401/403 Blocked)",
      `Status: ${resArbitrarySql.status}`
    );

    // 2. Vector Dimension Validation Failure (Expect 400 Bad Request on invalid dimensions)
    const resInvalidVector = await makeRequest('/api/vectors/upsert', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer n1-dev-master-family-token'
      },
      body: { id: 'test-vec-invalid', embedding: [0.1, 0.2, 0.3] } // 3 dims instead of 1536
    });
    assert(
      resInvalidVector.status === 400 && resInvalidVector.body?.message?.includes('1536'),
      "Vector Dimension Validation Defense (400 Bad Request on < 1536 dims)",
      JSON.stringify(resInvalidVector.body)
    );

    // 3. Vector Valid Dimension Acceptance (1536 dimensions)
    const dummyEmbedding = new Array(1536).fill(0.01);
    const resValidVector = await makeRequest('/api/vectors/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer n1-dev-master-family-token'
      },
      body: { embedding: dummyEmbedding, tenantId: 'default', limit: 5 }
    });
    assert(
      resValidVector.status === 200 || (resValidVector.status === 500 && resValidVector.body?.message?.includes('database')),
      "Valid 1536-Dimension Vector Search Endpoint Routing (200 OK or Graceful DB Error)",
      `Status: ${resValidVector.status}`
    );

    // 4. Encrypted DB Backup and Restore Verification
    const backupResult = await runBackupAndRestoreTest();
    assert(backupResult === true, "AES-256-GCM Encrypted DB Backup & Restore Verification Passed");

    console.log(`\n=== Hardening Test Results: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  }
}

runHardeningTests();
