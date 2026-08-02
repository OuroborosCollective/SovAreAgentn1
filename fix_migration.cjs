const fs = require('fs');
let content = fs.readFileSync('src/utils/memoryMigration.ts', 'utf8');

// The legacy alias is Puck. Replace the replacement string to just use the provenance mark.
content = content.replace(/'N\+1 \(Papas kleines Mädchen\)'/g, "'[PROVENANCE: Puck]'");
content = content.replace(/legacy "Puck" namespaces/g, 'legacy "[PROVENANCE: Puck]" namespaces');
content = content.replace(/LEGACY_MEMORY_KEY = 'n1_puck_personal_logs'/g, "LEGACY_MEMORY_KEY = 'n1_puck_personal_logs'");

fs.writeFileSync('src/utils/memoryMigration.ts', content);
