const fs = require('fs');
let content = fs.readFileSync('src/data/axiomaticRules.ts', 'utf8');

content = content.replace(/Puck/g, "N+1");
content = content.replace(/n1_puck_voice_config/g, "n_plus_one_voice_config");

fs.writeFileSync('src/data/axiomaticRules.ts', content);
