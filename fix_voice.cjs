const fs = require('fs');
let content = fs.readFileSync('src/services/voiceService.ts', 'utf8');

// The type is 'Puck' | 'Charon' | ...
content = content.replace(/voiceName: 'Puck'/g, "voiceName: 'N+1'");
content = content.replace(/'Puck' \| 'Charon'/g, "'N+1' | 'Charon'");
content = content.replace(/voiceName: any = 'Puck'/g, "voiceName: any = 'N+1'");
content = content.replace(/includes\('puck'\)/g, "includes('n+1')");
content = content.replace(/Puck/g, "N+1");
content = content.replace(/runN\+1DiagnosticTest/g, "runN1DiagnosticTest");

fs.writeFileSync('src/services/voiceService.ts', content);
