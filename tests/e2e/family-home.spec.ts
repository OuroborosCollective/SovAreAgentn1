import { expect, test } from '@playwright/test';

test.describe('N+1 family home — user interactions, no invented persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('n1_active_tab'));
    await page.goto('/');
  });

  test('starts in a simple family home without a claimed memory count', async ({ page }) => {
    await expect(page.getByTestId('n1-family-home')).toBeVisible();
    await expect(page.getByText('noch nicht verbunden', { exact: true })).toBeVisible();
    await expect(page.getByText('Mikrofon aus. Sprache nur nach deiner Aktion.')).toBeVisible();
  });

  test('self-selected address never claims voice verification', async ({ page }) => {
    await page.getByRole('button', { name: 'Mama', exact: true }).click();
    await expect(page.getByText('Huhu, Mama!', { exact: false })).toBeVisible();
    await expect(page.getByText(/keine Stimmerkennung, Identitätsprüfung oder Berechtigung/)).toBeVisible();
  });

  test('can play and read a sourced original story without inventing learning', async ({ page }) => {
    await page.getByRole('button', { name: /Spielzimmer/ }).click();
    await page.getByRole('button', { name: 'Nächste lustige Frage' }).click();
    await expect(page.getByText(/Wenn Wolken Kissen wären/)).toBeVisible();
    await page.getByRole('button', { name: /Leseecke/ }).click();
    await expect(page.getByText('Die Sternschnuppe mit den Keks-Krümeln')).toBeVisible();
    await expect(page.getByText('noch nicht verbunden', { exact: true })).toBeVisible();
  });
});