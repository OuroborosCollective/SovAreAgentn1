const fs = require('fs');
let code = fs.readFileSync('scripts/db-backup-restore.js', 'utf8');

code = code.replace(
  /if \(\!process\.env\.DB_URI\) \{[\s\S]*?const encrypted = encryptData\(mockData\);/g,
  `if (!process.env.DB_URI) {
      console.error("❌ FAIL: DB_URI not configured in environment. Cannot perform real backup.");
      return false;
    }
    const { execSync } = require('child_process');
    let realData;
    try {
       // Minimal realistic backup extraction via pg_dump if available, else fail
       realData = execSync('pg_dump ' + process.env.DB_URI + ' -t knowledge_vectors -a --inserts').toString();
    } catch(e) {
       console.error("❌ FAIL: pg_dump failed or missing. Cannot extract real data.");
       return false;
    }
    const encrypted = encryptData(realData);`
);

// We should also replace the decryption check to check against realData instead of mockData
code = code.replace(/if \(decrypted === mockData\)/g, 'if (decrypted === realData)');

fs.writeFileSync('scripts/db-backup-restore.js', code);
