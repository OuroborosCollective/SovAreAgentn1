import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto.createHash('sha256').update(process.env.N1_COOKIE_SECRET || 'n1-backup-master-encryption-key-2026').digest();

export function encryptData(dataString) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(dataString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext: encrypted,
    timestamp: new Date().toISOString()
  };
}

export function decryptData(encryptedPayload) {
  const iv = Buffer.from(encryptedPayload.iv, 'hex');
  const authTag = Buffer.from(encryptedPayload.authTag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedPayload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function runBackupAndRestoreTest() {
  console.log("=== Starting Encrypted DB Backup & Restore Verification ===");
  const uri = process.env.DB_URI;

  if (!uri) {
    console.log("⚠️ DB_URI not configured in environment. Creating mock test payload for backup encryption proof.");
    const mockData = JSON.stringify([
      { id: "vec-1", tenant_id: "default", label: "Test Vector", content: "Test content", embedding: [0.1, 0.2] }
    ]);
    const encrypted = encryptData(mockData);
    console.log("✅ Backup Encrypted (AES-256-GCM):", { iv: encrypted.iv, tagLength: encrypted.authTag.length });
    const decrypted = decryptData(encrypted);
    if (decrypted === mockData) {
      console.log("✅ Restore Decryption Verified: Data matches original exactly.");
      return true;
    } else {
      throw new Error("Decryption mismatch!");
    }
  }

  const pool = new pg.Pool({
    connectionString: uri,
    connectionTimeoutMillis: 3000,
    statement_timeout: 10000
  });

  try {
    const client = await pool.connect();
    
    // 1. Export knowledge_vectors
    const res = await client.query('SELECT id, tenant_id, label, content, metadata FROM knowledge_vectors LIMIT 100');
    const rawDump = JSON.stringify(res.rows);
    console.log(`📦 Exported ${res.rows.length} rows from knowledge_vectors`);

    // 2. Encrypt dump
    const encryptedBackup = encryptData(rawDump);
    const backupPath = path.join(process.cwd(), 'ssl', 'db-backup-latest.json.enc');
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(encryptedBackup, null, 2));
    console.log(`🔒 Encrypted backup saved to ${backupPath}`);

    // 3. Test Decryption
    const readBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const restoredDump = decryptData(readBackup);
    const restoredRows = JSON.parse(restoredDump);

    if (restoredRows.length === res.rows.length) {
      console.log(`✅ Restore Proof Successful: ${restoredRows.length} rows decrypted and verified.`);
    } else {
      throw new Error("Row count mismatch between backup and restored data");
    }

    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error("❌ Backup/Restore Test Failed:", err.message);
    await pool.end().catch(() => {});
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('db-backup-restore.js')) {
  runBackupAndRestoreTest().catch(() => process.exit(1));
}
