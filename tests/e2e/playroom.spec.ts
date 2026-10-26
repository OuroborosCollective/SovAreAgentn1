import { expect, test, type Page } from '@playwright/test';

/**
 * Browser reality: test observable UI and request boundaries, not fabricated
 * learning, automatic transcription, hidden battery signals or CSS name guesses.
 * The family-specific playroom flows are tested in family-home.spec.ts.
 */
async function openActualVoiceStudio(page: Page) {
  await page.addInitScript(() => localStorage.removeItem('n1_active_tab'));
  await page.goto('/');
  const home = page.getByTestId('n1-family-home');
  const studio = page.getByRole('heading', { name: 'Hia Resonance Voice Engine Interface' });
  await expect.poll(async () => await home.isVisible() || await studio.isVisible(), {
    timeout: 20000,
    message: 'Expected the existing studio or family home to actually render',
  }).toBe(true);
  if (await home.isVisible()) {
    await page.getByRole('button', { name: 'Technische Arbeitsflächen öffnen' }).click();
  }
  await expect(studio).toBeVisible({ timeout: 15000 });
}

test.describe('N+1 real browser and privacy boundaries', () => {
  test('reaches the current voice studio through its actual UI', async ({ page }) => {
    await openActualVoiceStudio(page);
    await expect(page.getByRole('button', { name: 'Start Voice Input' })).toBeVisible();
  });

  test('starts with voice input disabled rather than pretending to hear speech', async ({ page }) => {
    await openActualVoiceStudio(page);
    await expect(page.getByRole('button', { name: 'Start Voice Input' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop Listening' })).toHaveCount(0);
  });

  test('keeps authenticated family data inaccessible to anonymous visitors', async ({ request }) => {
    const memories = await request.get('/api/memory/events');
    const consent = await request.get('/api/privacy/consent');
    expect(memories.status()).toBe(403);
    expect(consent.status()).toBe(403);
    expect(await memories.text()).not.toContain('insightContent');
  });

  test('does not advertise CORS approval to an unapproved origin', async ({ request }) => {
    const response = await request.get('/api/health/liveness', {
      headers: { Origin: 'https://attacker.invalid' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBeUndefined();
    const privateMemory = await request.get('/api/memory/events', {
      headers: { Origin: 'https://attacker.invalid' },
    });
    expect(privateMemory.status()).toBe(403);
    expect(privateMemory.headers()['access-control-allow-origin']).toBeUndefined();
  });
});
