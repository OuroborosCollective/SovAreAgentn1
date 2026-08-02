const fs = require('fs');
let content = fs.readFileSync('src/components/GoogleNotebooksAnalyzer.tsx', 'utf8');

// Replace property names
content = content.replace(/importedToPuckLog/g, 'importedToN1Log');
content = content.replace(/Puck_Ego_Physics/g, '[PROVENANCE: Puck]_Ego_Physics');
content = content.replace(/Puck Personal Logs/g, 'N+1 Personal Logs');
content = content.replace(/newPuckEntry/g, 'newN1Entry');
content = content.replace(/existingPuckLogs/g, 'existingN1Logs');

// Fix the storage read/write
const storageReadRegex = /const existingN1Logs = JSON\.parse\(localStorage\.getItem\('n1_puck_personal_logs'\) \|\| '\[\]'\);/;
const storageReadReplacement = `const legacyLogs = JSON.parse(localStorage.getItem('n1_puck_personal_logs') || '[]');
    const canonicalLogs = JSON.parse(localStorage.getItem('n_plus_one_personal_logs') || '[]');
    const existingN1Logs = [...canonicalLogs, ...legacyLogs.filter(l => !canonicalLogs.some(c => c.id === l.id))];`;
content = content.replace(storageReadRegex, storageReadReplacement);

content = content.replace(/localStorage\.setItem\('n1_puck_personal_logs'/g, "localStorage.setItem('n_plus_one_personal_logs'");
content = content.replace(/Puck Log/g, 'N+1 Log');

fs.writeFileSync('src/components/GoogleNotebooksAnalyzer.tsx', content);
