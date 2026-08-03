const fs = require('fs');
let code = fs.readFileSync('scripts/test-db-hardening.js', 'utf8');

code = code.replace(
  /resValidVector.status === 200 \|\| \(resValidVector.status === 500 && resValidVector.body\?\.message\?\.includes\('database'\)\)/g,
  'resValidVector.status === 200'
);

code = code.replace(
  /"Valid 1536-Dimension Vector Search Endpoint Routing \(200 OK or Graceful DB Error\)"/g,
  '"Valid 1536-Dimension Vector Search Endpoint Routing (200 OK)"'
);

fs.writeFileSync('scripts/test-db-hardening.js', code);
