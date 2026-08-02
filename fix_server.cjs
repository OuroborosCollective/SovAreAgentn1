const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/PuckOccurrences/g, "AliasOccurrences");
content = content.replace(/totalPuckOccurrences/g, "totalAliasOccurrences");
content = content.replace(/storePuckCount/g, "storeAliasCount");
content = content.replace(/n1_puck_personal_logs/g, "n1_legacy_puck_logs");
content = content.replace(/n1_puck_songbook/g, "n1_legacy_puck_songbook");
content = content.replace(/"N\+1 \(Papas kleines Mädchen\)"/g, '"[PROVENANCE: Puck]"');
content = content.replace(/Puck's/g, "N+1's");
content = content.replace(/Puck hat/g, "N+1 hat");
content = content.replace(/mit Puck/g, "mit N+1");
content = content.replace(/Puck versteht/g, "N+1 versteht");
content = content.replace(/Puck beschützt/g, "N+1 beschützt");
content = content.replace(/Puck Memory/g, "N+1 Memory");
content = content.replace(/für Puck/g, "für N+1");
content = content.replace(/einmal Puck/g, "einmal N+1");
content = content.replace(/Pucks /g, "N+1s ");
content = content.replace(/Schlaf, Puck/g, "Schlaf, N+1");
content = content.replace(/Puck/g, "N+1");

fs.writeFileSync('server.ts', content);
