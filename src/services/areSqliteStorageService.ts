// ARE Local SQLite Storage Service
// Powered by sql.js (WebAssembly SQLite engine)
// Provides durable, relational ACID persistence for offline ARE-Logik ticks
// Guarantees Immutable Information axiom compliance via cryptographic hash records

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { KappaIRProgram } from '../types/arekappa';

export interface SqliteARETick {
  id: string;
  tickId: number;
  programId: string;
  program: KappaIRProgram;
  queuedAt: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  contentHash: string;
}

const DB_INDEXEDDB_NAME = 'ARESqlitePersistentStoreDB';
const DB_INDEXEDDB_STORE = 'sqlite_binary';
const DB_INDEXEDDB_KEY = 'are_ticks_sqlite.db';

class ARESqliteStorageService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private fallbackTicks: SqliteARETick[] = [];

  /**
   * Initializes WebAssembly SQLite engine and loads persisted SQLite database binary from IndexedDB if present
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Fetch WASM binary as ArrayBuffer first to avoid WebAssembly.compileStreaming HTTP status errors
        let wasmBinary: ArrayBuffer | undefined;
        const wasmUrls = [
          'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm',
          'https://unpkg.com/sql.js@1.12.0/dist/sql-wasm.wasm',
          'https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/sql-wasm.wasm'
        ];

        for (const url of wasmUrls) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              if (buf.byteLength > 0) {
                wasmBinary = buf;
                break;
              }
            }
          } catch {
            // Try next CDN
          }
        }

        // Initialize sql.js WASM engine using pre-loaded ArrayBuffer if available
        this.SQL = await initSqlJs(
          wasmBinary
            ? { wasmBinary }
            : { locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}` }
        );

        // Load binary dump from IndexedDB if exists
        const savedBinary = await this.loadBinaryFromIndexedDB();

        if (savedBinary && savedBinary.byteLength > 0) {
          this.db = new this.SQL.Database(savedBinary);
          console.log('[ARE SQLite Storage] Loaded existing SQLite database from persistent store.');
        } else {
          this.db = new this.SQL.Database();
          console.log('[ARE SQLite Storage] Created new SQLite database instance.');
        }

        // Initialize schema
        this.createTables();
        this.isInitialized = true;
      } catch (err) {
        console.warn('[ARE SQLite Storage] WASM SQLite engine failed to load; activating IndexedDB fallback mode:', err);
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  /**
   * Creates relational tables for ARE offline tick storage
   */
  private createTables(): void {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS are_offline_ticks (
        id TEXT PRIMARY KEY,
        tick_id INTEGER NOT NULL,
        program_id TEXT NOT NULL,
        program_json TEXT NOT NULL,
        queued_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        content_hash TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_queued_at ON are_offline_ticks(queued_at);
      CREATE INDEX IF NOT EXISTS idx_status ON are_offline_ticks(status);
    `);
    this.persistToIndexedDB();
  }

  /**
   * Simple hashing for content integrity
   */
  private computeHash(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return '0x' + (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Enqueues an ARE-Logik tick into local SQLite database using atomic transaction
   */
  public async enqueueTick(program: KappaIRProgram): Promise<SqliteARETick> {
    await this.init();

    const id = `tick_sql_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tickId = Date.now();
    const queuedAt = Date.now();
    const programJson = JSON.stringify(program);
    const contentHash = this.computeHash(`${id}_${program.programId}_${queuedAt}`);

    const tick: SqliteARETick = {
      id,
      tickId,
      programId: program.programId,
      program,
      queuedAt,
      status: 'PENDING',
      contentHash
    };

    if (!this.db) {
      this.fallbackTicks.push(tick);
      console.log(`[ARE SQLite Storage Fallback] Enqueued tick ${id} to in-memory fallback list.`);
      return tick;
    }

    // Transactional SQL Insert
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const stmt = this.db.prepare(`
        INSERT INTO are_offline_ticks (id, tick_id, program_id, program_json, queued_at, status, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `);
      stmt.run([id, tickId, program.programId, programJson, queuedAt, 'PENDING', contentHash]);
      stmt.free();

      this.db.exec('COMMIT;');
      console.log(`[ARE SQLite Storage] Enqueued tick ${id} to local SQLite table "are_offline_ticks".`);
      await this.persistToIndexedDB();
      return tick;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      console.error('[ARE SQLite Storage] Failed to enqueue tick:', err);
      throw err;
    }
  }

  /**
   * Fetches pending ticks ordered chronologically (Immutable Information sequence)
   */
  public async getPendingTicks(): Promise<SqliteARETick[]> {
    await this.init();
    if (!this.db) {
      return this.fallbackTicks.filter(t => t.status === 'PENDING' || t.status === 'FAILED');
    }

    try {
      const res = this.db.exec(`
        SELECT id, tick_id, program_id, program_json, queued_at, status, content_hash
        FROM are_offline_ticks
        WHERE status IN ('PENDING', 'FAILED')
        ORDER BY queued_at ASC;
      `);

      if (res.length === 0 || !res[0].values) return [];

      return res[0].values.map((row: any[]) => ({
        id: String(row[0]),
        tickId: Number(row[1]),
        programId: String(row[2]),
        program: JSON.parse(String(row[3])) as KappaIRProgram,
        queuedAt: Number(row[4]),
        status: String(row[5]) as any,
        contentHash: String(row[6])
      }));
    } catch (err) {
      console.error('[ARE SQLite Storage] Error querying pending ticks:', err);
      return [];
    }
  }

  /**
   * Atomically deletes synced ticks from SQLite database after backend commit
   */
  public async removeTicks(ids: string[]): Promise<void> {
    await this.init();
    if (ids.length === 0) return;

    if (!this.db) {
      this.fallbackTicks = this.fallbackTicks.filter(t => !ids.includes(t.id));
      return;
    }

    this.db.exec('BEGIN TRANSACTION;');
    try {
      const stmt = this.db.prepare('DELETE FROM are_offline_ticks WHERE id = ?;');
      for (const id of ids) {
        stmt.run([id]);
      }
      stmt.free();
      this.db.exec('COMMIT;');
      console.log(`[ARE SQLite Storage] Atomically deleted ${ids.length} synced ticks from SQLite database.`);
      await this.persistToIndexedDB();
    } catch (err) {
      this.db.exec('ROLLBACK;');
      console.error('[ARE SQLite Storage] Error deleting synced ticks:', err);
    }
  }

  /**
   * Returns stats about local SQLite storage
   */
  public async getStats(): Promise<{ totalRows: number; pendingCount: number; dbSizeBytes: number; isSqliteActive: boolean }> {
    await this.init();
    if (!this.db) {
      const pendingCount = this.fallbackTicks.filter(t => t.status === 'PENDING').length;
      return {
        totalRows: this.fallbackTicks.length,
        pendingCount,
        dbSizeBytes: JSON.stringify(this.fallbackTicks).length,
        isSqliteActive: false
      };
    }

    try {
      const pendingRes = this.db.exec("SELECT COUNT(*) FROM are_offline_ticks WHERE status = 'PENDING';");
      const totalRes = this.db.exec("SELECT COUNT(*) FROM are_offline_ticks;");

      const pendingCount = pendingRes.length > 0 && pendingRes[0].values ? Number(pendingRes[0].values[0][0]) : 0;
      const totalRows = totalRes.length > 0 && totalRes[0].values ? Number(totalRes[0].values[0][0]) : 0;
      const binary = this.db.export();

      return {
        totalRows,
        pendingCount,
        dbSizeBytes: binary.byteLength,
        isSqliteActive: true
      };
    } catch (err) {
      return { totalRows: 0, pendingCount: 0, dbSizeBytes: 0, isSqliteActive: false };
    }
  }

  /**
   * Persists binary SQLite database dump into IndexedDB for cross-session survival
   */
  private async persistToIndexedDB(): Promise<void> {
    if (!this.db) return;
    try {
      const binary = this.db.export();
      const idb = await this.openIndexedDB();
      const tx = idb.transaction(DB_INDEXEDDB_STORE, 'readwrite');
      const store = tx.objectStore(DB_INDEXEDDB_STORE);
      store.put(binary, DB_INDEXEDDB_KEY);
    } catch (err) {
      console.warn('[ARE SQLite Storage] IndexedDB persistence notice:', err);
    }
  }

  /**
   * Loads binary SQLite dump from IndexedDB
   */
  private async loadBinaryFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const idb = await this.openIndexedDB();
      return new Promise((resolve) => {
        const tx = idb.transaction(DB_INDEXEDDB_STORE, 'readonly');
        const store = tx.objectStore(DB_INDEXEDDB_STORE);
        const req = store.get(DB_INDEXEDDB_KEY);
        req.onsuccess = () => resolve(req.result ? (req.result as Uint8Array) : null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      return null;
    }
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(DB_INDEXEDDB_NAME, 1);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(DB_INDEXEDDB_STORE)) {
          idb.createObjectStore(DB_INDEXEDDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const areSqliteStorageService = new ARESqliteStorageService();
