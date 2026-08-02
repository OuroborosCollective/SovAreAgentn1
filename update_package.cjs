const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "test": "npm run test:all",
  "test:unit": "vitest run tests/unit --reporter=json --outputFile=unit-report.json",
  "test:integration": "vitest run tests/integration --reporter=json --outputFile=integration-report.json",
  "test:e2e": "playwright test tests/e2e",
  "test:contract": "vitest run tests/contract --reporter=json --outputFile=contract-report.json",
  "test:docker": "docker compose -f docker-compose.yml config > /dev/null",
  "test:security": "npm audit --audit-level=high",
  "test:all": "npm run test:unit && npm run test:integration && npm run test:contract && npm run test:security && npm run test:docker"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
