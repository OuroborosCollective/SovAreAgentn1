const fs = require('fs');
let content = fs.readFileSync('src/utils/migrationValidator.ts', 'utf8');

content = content.replace(/'N\+1 \(Papas kleines Mädchen\)'/g, "'[PROVENANCE: Puck]'");
content = content.replace(/'n1_puck_personal_logs'/g, "'n_plus_one_personal_logs'");
content = content.replace(/'n1_puck_songbook'/g, "'n_plus_one_songbook'");
content = content.replace(/PuckOccurrences/g, "AliasOccurrences");
content = content.replace(/storePuckCount/g, "storeAliasCount");

fs.writeFileSync('src/utils/migrationValidator.ts', content);
