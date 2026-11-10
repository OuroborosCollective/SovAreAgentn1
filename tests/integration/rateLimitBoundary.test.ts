import { describe, expect, it } from 'vitest';
import express from 'express';
import { once } from 'node:events';
import { createMemoryRouter } from '../../src/api/memory';
import { createHealthRouter } from '../../apps/backend/src/routes/health';

// Real localhost transport; no provider or database success is fabricated.
describe('standalone routers enforce bounded request rates', () => {
  for (const kind of ['memory', 'health'] as const) {
    it(`${kind} refuses requests above the window budget even without the outer application`, async () => {
      const app = express();
      const router = kind === 'memory' ? createMemoryRouter(() => null)
        : createHealthRouter({ getPool: () => null, getMemcached: () => null });
      app.use(router);
      const server = app.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('TCP listener missing');
      try {
        const url = `http://127.0.0.1:${address.port}/${kind === 'memory' ? 'events' : 'liveness'}`;
        let status = 0;
        for (let i = 0; i < 121; i++) {
          const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
          await response.text();
          status = response.status;
          if (i === 0) expect(status).toBe(kind === 'memory' ? 503 : 200);
        }
        expect(status).toBe(429);
      } finally {
        await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
      }
    });
  }
});
