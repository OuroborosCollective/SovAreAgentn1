// ARE Background Sync Service
// Handles offline queuing of ARE-Logik ticks & KappaIR programs in SQLite & IndexedDB
// Flushes queued ticks via Service Worker BackgroundSync or online reconnect triggers
// Upholds the "Immutable Information" axiom by preserving strict sequential link order

import { KappaIRProgram, EvidenceReceipt } from '../types/arekappa';
import { areSqliteStorageService } from './areSqliteStorageService';

export interface QueuedARETick {
  id: string;
  tickId: number;
  program: KappaIRProgram;
  queuedAt: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  storageEngine?: 'SQLite WASM' | 'IndexedDB';
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  lastError: string | null;
  sqliteActive: boolean;
  sqliteRows: number;
  sqliteSizeBytes: number;
}

const DB_NAME = 'ARELogicOfflineQueueDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_ticks';

class AREBackgroundSyncService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private lastError: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
      areSqliteStorageService.init().catch(() => {});

      // Listen for network status changes
      window.addEventListener('online', () => {
        console.log('[ARE Background Sync] Connectivity restored. Flushing offline ARE ticks...');
        this.notifyStatus();
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        console.log('[ARE Background Sync] Network offline. ARE ticks will be queued locally.');
        this.notifyStatus();
      });

      // Listen for messages from Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'ARE_SYNC_COMPLETED') {
            console.log('[ARE Background Sync] Service Worker completed background sync.');
            this.lastSyncedAt = Date.now();
            this.notifyStatus();
          }
        });
      }

      // Automated Integrity & Maintenance Utility (Periodic - Vacuum & Orphan Check)
      setInterval(() => {
        areSqliteStorageService.runMaintenanceUtility().then(mResult => {
          if (mResult.vacuumExecuted || mResult.orphanedCleaned > 0) {
            console.log(`[ARE Maintenance Utility] Automated background maintenance complete. Reclaimed ${mResult.bytesReclaimed} bytes, purged ${mResult.orphanedCleaned} orphans.`);
            this.notifyStatus();
          }
        }).catch(err => console.warn('[ARE Maintenance Utility] Scheduled maintenance failed:', err));
      }, 1000 * 60 * 5); // Every 5 minutes
    }
  }

  /**
   * Initializes IndexedDB database for ARE tick offline queue
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('queuedAt', 'queuedAt', { unique: false });
          store.createIndex('tickId', 'tickId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Enqueues an ARE-Logik tick into both SQLite WASM engine & IndexedDB for max durability
   */
  public async enqueueTick(program: KappaIRProgram): Promise<QueuedARETick> {
    let sqliteTick: QueuedARETick | null = null;

    try {
      // 1. Primary persistence: SQLite WASM Database
      const res = await areSqliteStorageService.enqueueTick(program);
      sqliteTick = {
        id: res.id,
        tickId: res.tickId,
        program: res.program,
        queuedAt: res.queuedAt,
        retryCount: 0,
        status: res.status,
        storageEngine: 'SQLite WASM'
      };
    } catch (sqliteErr) {
      console.warn('[ARE Background Sync] SQLite enqueue notice:', sqliteErr);
    }

    // 2. Secondary redundancy: IndexedDB
    const db = await this.initDB();
    const tick: QueuedARETick = sqliteTick || {
      id: `tick_idb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tickId: Date.now(),
      program,
      queuedAt: Date.now(),
      retryCount: 0,
      status: 'PENDING',
      storageEngine: 'IndexedDB'
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(tick);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    console.log(`[ARE Background Sync] Enqueued tick ${tick.id} into persistent storage layer.`);
    this.notifyStatus();
    this.requestBackgroundSync();

    // Attempt immediate atomic flush if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.flushQueue();
    }

    return tick;
  }

  /**
   * Fetches all pending ticks ordered chronologically by queuedAt from SQLite & IndexedDB
   */
  public async getPendingTicks(): Promise<QueuedARETick[]> {
    const sqliteTicks = await areSqliteStorageService.getPendingTicks().catch(() => []);
    
    if (sqliteTicks.length > 0) {
      return sqliteTicks.map((t) => ({
        id: t.id,
        tickId: t.tickId,
        program: t.program,
        queuedAt: t.queuedAt,
        retryCount: 0,
        status: t.status,
        storageEngine: 'SQLite WASM' as const
      }));
    }

    // Fallback to IndexedDB
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('queuedAt');
      const req = index.getAll();

      req.onsuccess = () => {
        const ticks = (req.result as QueuedARETick[]).filter(
          (t) => t.status === 'PENDING' || t.status === 'FAILED'
        );
        resolve(ticks);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Removes synced ticks from both SQLite WASM & IndexedDB
   */
  private async removeTicks(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    // Remove from SQLite
    await areSqliteStorageService.removeTicks(ids).catch(() => {});

    // Remove from IndexedDB
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let remaining = ids.length;

      for (const id of ids) {
        const req = store.delete(id);
        req.onsuccess = () => {
          remaining--;
          if (remaining === 0) resolve();
        };
        req.onerror = () => {
          remaining--;
          if (remaining === 0) resolve();
        };
      }
    });
  }

  /**
   * Registers a Service Worker background sync tag if supported
   */
  public async requestBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('are-logic-sync');
        console.log('[ARE Background Sync] Service Worker background sync tag "are-logic-sync" registered.');
      } catch (err) {
        console.warn('[ARE Background Sync] Background Sync registration warning:', err);
      }
    }
  }

  /**
   * Flushes all pending offline ticks to the server in exact sequential order,
   * guaranteeing the Immutable Information axiom (hash chain unbroken).
   */
  public async flushQueue(): Promise<{ syncedCount: number; errors: string[] }> {
    if (this.isSyncing) return { syncedCount: 0, errors: ['Sync already in progress'] };
    if (!navigator.onLine) return { syncedCount: 0, errors: ['Network offline'] };

    const pending = await this.getPendingTicks();
    if (pending.length === 0) return { syncedCount: 0, errors: [] };

    this.isSyncing = true;
    this.notifyStatus();

    let syncedCount = 0;
    const errors: string[] = [];

    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Send atomic batch of pending programs to backend sync endpoint
      const res = await fetch('/api/arekappa/ledger/sync-ticks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          ticks: pending.map((t) => ({
            id: t.id,
            program: t.program,
            queuedAt: t.queuedAt
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.syncedIds)) {
          await this.removeTicks(data.syncedIds);
          syncedCount = data.syncedIds.length;
          this.lastSyncedAt = Date.now();
          this.lastError = null;
        } else if (data.message) {
          errors.push(data.message);
          this.lastError = data.message;
        }
      } else {
        const errData = await res.json().catch(() => ({ message: 'Server returned HTTP ' + res.status }));
        const errMsg = errData.message || 'Sync HTTP Error ' + res.status;
        errors.push(errMsg);
        this.lastError = errMsg;
      }
    } catch (err: any) {
      const msg = err.message || 'Network flush failed';
      errors.push(msg);
      this.lastError = msg;
    } finally {
      this.isSyncing = false;
      this.notifyStatus();
    }

    return { syncedCount, errors };
  }

  /**
   * Get current offline sync status metrics
   */
  public async getStatus(): Promise<SyncStatus> {
    const pending = await this.getPendingTicks();
    const sqliteStats = await areSqliteStorageService.getStats().catch(() => ({
      totalRows: 0,
      pendingCount: 0,
      dbSizeBytes: 0,
      isSqliteActive: false
    }));

    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingCount: pending.length,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
      sqliteActive: sqliteStats.isSqliteActive,
      sqliteRows: sqliteStats.totalRows,
      sqliteSizeBytes: sqliteStats.dbSizeBytes
    };
  }

  /**
   * Subscribe to status changes
   */
  public subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    this.getStatus().then((status) => callback(status));
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async notifyStatus() {
    const status = await this.getStatus();
    this.listeners.forEach((cb) => cb(status));
  }
}

export const areBackgroundSyncService = new AREBackgroundSyncService();
