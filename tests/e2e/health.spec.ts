import { test, expect } from '@playwright/test';

test.describe('Health Endpoints', () => {
  test('GET /api/health/liveness should return 200', async ({ request }) => {
    const response = await request.get('/api/health/liveness');
    expect(response.status()).toBe(200);
  });

  test('GET /api/health should return 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('GET /api/health/readiness should return 200', async ({ request }) => {
    const response = await request.get('/api/health/readiness');
    expect(response.status()).toBe(200);
  });
});

test.describe('API Security', () => {
  test('unregistered route should return 403', async ({ request }) => {
    const response = await request.get('/api/unknown/endpoint');
    expect(response.status()).toBe(403);
  });
});
