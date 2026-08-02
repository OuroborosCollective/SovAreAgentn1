const fs = require('fs');
let content = fs.readFileSync('src/utils/runtimeValidator.ts', 'utf8');

content = content.replace(/Puck/g, "N+1");
content = content.replace(/runN\+1DiagnosticTest/g, "runN1DiagnosticTest");

fs.writeFileSync('src/utils/runtimeValidator.ts', content);
