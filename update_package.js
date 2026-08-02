const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "test:unit": "vitest run --dir tests/unit",
  "test:integration": "vitest run --dir tests/integration",
  "test:e2e": "playwright test tests/e2e",
  "test:contract": "vitest run --dir tests/contract",
  "test:docker": "echo 'Docker tests to be implemented'",
  "test:security": "npm audit --audit-level=high",
  "test:all": "npm run test:unit && npm run test:integration && npm run test:contract && npm run test:security"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
