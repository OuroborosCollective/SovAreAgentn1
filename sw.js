// Service Worker - N+1 ARE-Logik Offline Queue & Background Sync
// Upholds "Immutable Information" axiom by preserving offline tick sequences in IndexedDB

const CACHE_NAME = 'n-plus-one-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const DB_NAME = 'ARELogicOfflineQueueDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_ticks';

// Helper to open IndexedDB in Service Worker scope
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper to queue program to IndexedDB from SW
async function queueProgramOffline(program) {
  try {
    const db = await openOfflineDB();
    const tick = {
      id: `tick_sw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tickId: Date.now(),
      program,
      queuedAt: Date.now(),
      retryCount: 0,
      status: 'PENDING'
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(tick);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    console.log('[ServiceWorker] Successfully queued ARE program offline in IndexedDB:', tick.id);
    return tick;
  } catch (err) {
    console.error('[ServiceWorker] Failed to queue ARE program offline:', err);
    throw err;
  }
}

// Helper to flush offline queue to server from SW
async function flushOfflineQueue() {
  try {
    const db = await openOfflineDB();
    const pendingTicks = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('queuedAt');
      const req = index.getAll();
      req.onsuccess = () => resolve((req.result || []).filter(t => t.status === 'PENDING' || t.status === 'FAILED'));
      req.onerror = () => reject(req.error);
    });

    if (pendingTicks.length === 0) {
      console.log('[ServiceWorker] Background Sync: No pending ARE ticks to flush.');
      return;
    }

    // Sort chronologically (Immutable Information Axiom requirement)
    pendingTicks.sort((a, b) => (a.queuedAt || 0) - (b.queuedAt || 0));

    const batchId = `sw_batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[ServiceWorker] Background Sync: Flushing atomic batch ${batchId} with ${pendingTicks.length} ARE ticks...`);

    const response = await fetch('/api/arekappa/ledger/sync-ticks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId,
        ticks: pendingTicks.map(t => ({
          id: t.id,
          program: t.program,
          queuedAt: t.queuedAt
        }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.syncedIds)) {
        // Remove synced ticks atomically from IndexedDB
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const syncedId of data.syncedIds) {
          store.delete(syncedId);
        }
        console.log(`[ServiceWorker] Background Sync: Successfully flushed atomic batch ${batchId} (${data.syncedIds.length} ticks).`);

        // Notify client windows
        const clientsList = await self.clients.matchAll({ type: 'window' });
        for (const client of clientsList) {
          client.postMessage({
            type: 'ARE_SYNC_COMPLETED',
            batchId,
            syncedCount: data.syncedIds.length,
            isChainValid: data.isChainValid,
            timestamp: Date.now()
          });
        }
      }
    }
  } catch (err) {
    console.warn('[ServiceWorker] Background Sync flush attempt failed:', err);
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Intercept ARE-Logik ledger execution requests when offline
  if (url.pathname === '/api/arekappa/ledger/execute' && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        try {
          // Clone request to read body
          const clonedReq = event.request.clone();
          const body = await clonedReq.json();

          // Attempt normal network fetch first
          const response = await fetch(event.request);
          return response;
        } catch (networkErr) {
          console.warn('[ServiceWorker] Network error on /api/arekappa/ledger/execute. Intercepting for offline queue...');

          try {
            const reqForBody = event.request.clone();
            const body = await reqForBody.json();
            if (body && body.program) {
              const queuedTick = await queueProgramOffline(body.program);

              // Register background sync if available
              if ('sync' in self.registration) {
                self.registration.sync.register('are-logic-sync').catch(() => {});
              }

              return new Response(
                JSON.stringify({
                  status: 'queued_offline',
                  queued: true,
                  tickId: queuedTick.id,
                  resultValue: 'QUEUED_IN_OFFLINE_INDEXEDDB',
                  message: 'Network offline. ARE-Logik tick safely queued in Service Worker for background sync.',
                  executionLog: [
                    'Network connection unavailable.',
                    'Immutable Information Axiom activated: Tick queued in IndexedDB.',
                    'Automatic Background Sync will flush to database once connection is restored.'
                  ]
                }),
                {
                  status: 202,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
          } catch (e) {
            console.error('[ServiceWorker] Failed to process offline request body:', e);
          }

          return new Response(
            JSON.stringify({ status: 'error', message: 'Offline request failed to queue' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })()
    );
    return;
  }

  // Standard static asset cache fallthrough
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// Service Worker Background Sync Event
self.addEventListener('sync', event => {
  if (event.tag === 'are-logic-sync' || event.tag === 'are-tick-sync') {
    console.log('[ServiceWorker] "are-logic-sync" event triggered!');
    event.waitUntil(flushOfflineQueue());
  }
});

// Service Worker Message Listener
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ARE_SYNC_NOW') {
    event.waitUntil(flushOfflineQueue());
  }
});
