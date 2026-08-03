const fs = require('fs');
let code = fs.readFileSync('src/services/voiceService.ts', 'utf8');

// Replace the speak method's Gemini client part with a fetch call
const oldBlockStart = `      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";`;
const oldBlockEnd = `        if (base64Audio) {`;

// Just to be safe, let's use a regex that matches from `const apiKey =` up to `if (base64Audio) {`
const regex = /const apiKey = process\.env\.API_KEY \|\| process\.env\.GEMINI_API_KEY \|\| "";[\s\S]*?const base64Audio = [^;]+;/;

const newBlock = `      const requestStart = performance.now();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName, mood })
      });
      
      if (!res.ok) {
         throw new Error("TTS API failed with status " + res.status);
      }
      
      if (speechSessionId !== this.activeSpeechId) {
          console.log("[Single Voice Lock] Speech call preempted by newer request. Aborting audio playback.");
          return false;
      }
      
      const data = await res.json();
      const ttfb = Math.round(performance.now() - requestStart);
      const base64Audio = data.audio;`;

code = code.replace(regex, newBlock);

fs.writeFileSync('src/services/voiceService.ts', code);
