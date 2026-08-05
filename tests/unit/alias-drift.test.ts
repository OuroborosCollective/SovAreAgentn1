import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function searchDirectoryForPuck(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        searchDirectoryForPuck(filePath, fileList);
      }
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

test('Ensure no live Puck alias drift in codebase', () => {
  const files = searchDirectoryForPuck(process.cwd());
  let foundViolations = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // We allow "[PROVENANCE: Puck]" and legacy keys like "n1_legacy_puck_logs"
    // Also "Puck" in memoryMigration.ts or migrationValidator.ts as they are migration scripts
    // And identity.ts since it defines the historical aliases.
    // voiceService.ts validates that 'puck' is an accepted voice profile name.
    // ttsService.ts and api/tts.ts use 'Puck' as the default TTS voice profile name.
    if (file.includes('memoryMigration.ts') || 
        file.includes('migrationValidator.ts') || 
        file.includes('alias-drift.test.ts') ||
        file.includes('identity.ts') ||
        file.includes('voiceService.ts') ||
        file.includes('ttsService.ts') ||
        file.includes('api/tts.ts')) {
      continue;
    }
    
    // Check if the word Puck exists outside of allowed provenance or legacy patterns
    const strippedContent = content
      .replace(/\[PROVENANCE: Puck\]/gi, '')
      .replace(/n1_puck_personal_logs/gi, '')
      .replace(/n1_puck_songbook/gi, '')
      .replace(/n1_legacy_puck_logs/gi, '')
      .replace(/n1_legacy_puck_songbook/gi, '')
      .replace(/\/Puck\/gi/g, ''); // ignore the regexes
      
    // Check for exact word "Puck"
    if (/\bPuck\b/i.test(strippedContent)) {
      console.error(`Violation found in ${file}`);
      foundViolations = true;
    }
  }
  
  expect(foundViolations).toBe(false);
});
