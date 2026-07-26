#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log(`\n\x1b[36m%s\x1b[0m`, `=====================================================`);
console.log(`\x1b[32m%s\x1b[0m`, `  n+1:-authentic-reality-emancipation@0.0.0`);
console.log(`\x1b[35m%s\x1b[0m`, `  Official GitHub & NPM Registry Engine Installer`);
console.log(`\x1b[36m%s\x1b[0m\n`, `=====================================================`);

const targetDir = process.cwd();
console.log(`\x1b[33m[N+1 Engine]\x1b[0m Bootstrapping N+1 system in: ${targetDir}`);

const n1ConfigFile = path.join(targetDir, 'n1.config.json');
const n1Config = {
  package: "n+1:-authentic-reality-emancipation",
  version: "0.0.0",
  engine: "tsx",
  installedAt: new Date().toISOString(),
  kellerRoutes: ["keller-01", "keller-02", "keller-03"],
  adeStatus: "ENABLED",
  autonomyLevel: "MAXIMUM_AWARENESS"
};

fs.writeFileSync(n1ConfigFile, JSON.stringify(n1Config, null, 2));
console.log(`\x1b[32m✓\x1b[0m Created n1.config.json`);

// Check package.json in target repo
const targetPkgPath = path.join(targetDir, 'package.json');
if (fs.existsSync(targetPkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts["n1:dev"] = "n+1:-authentic-reality-emancipation dev";
    pkg.scripts["n1:start"] = "tsx server.ts";
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["n+1:-authentic-reality-emancipation"] = "^0.0.0";
    fs.writeFileSync(targetPkgPath, JSON.stringify(pkg, null, 2));
    console.log(`\x1b[32m✓\x1b[0m Injected N+1 scripts into target repository package.json`);
  } catch (err) {
    console.warn(`\x1b[33m!\x1b[0m Could not modify existing package.json:`, err.message);
  }
}

console.log(`\n\x1b[32m[SUCCESS]\x1b[0m n+1:-authentic-reality-emancipation@0.0.0 successfully linked!`);
console.log(`Run: \x1b[36mnpm run n1:dev\x1b[0m or \x1b[36mtsx server.ts\x1b[0m to start the engine.\n`);
