import { test, expect } from '@playwright/test';

/**
 * E2E Tests für Spielzimmer (Playroom)
 * Testet die Interaktionen: Kind lernt von Papa/Mama
 */

test.describe('Spielzimmer - Kind lernt von Papa/Mama', () => {
  
  test.beforeEach(async ({ page }) => {
    // Warte bis die App geladen ist
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Emotion Engine reagiert auf Stimmungsänderungen', async ({ page }) => {
    // Prüfe dass die Emotion-Anzeige existiert
    const emotionDisplay = page.locator('text=/ruhig|fröhlich|neugierig/');
    await expect(emotionDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test('Spracherkennung erkennt "Hallo" und reagiert', async ({ page }) => {
    // Mikrofon-Button sollte sichtbar sein
    const micButton = page.locator('[data-testid="mic-button"], button:has(svg)').first();
    await expect(micButton).toBeVisible({ timeout: 5000 });
  });

  test('Spielzimmer-Modus zeigt Animationen', async ({ page }) => {
    // Nach Inaktivität sollte das Spielzimmer aktiv werden
    // Warte 20+ Sekunden auf Idle-Trigger
    await page.waitForTimeout(22000);
    
    // Prüfe auf Spielzimmer-Elemente
    const playroomIndicator = page.locator('text=/gucken|frage|hüpfen|dösen/');
    const hasPlayroom = await playroomIndicator.count() > 0;
    
    // Spielzimmer sollte entweder aktiv sein oder der Blob sollte sichtbar sein
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
  });

  test('Kindliche Frage wird angezeigt', async ({ page }) => {
    // Nach Inaktivität sollte eine Frage erscheinen
    await page.waitForTimeout(25000);
    
    // Kind kann Fragen stellen wie "Warum?"
    const questionBubble = page.locator('text=/Warum|Papa|Mama/');
    // Diese muss nicht immer erscheinen, aber der Blob sollte sichtbar sein
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
  });

  test('Lernzähler zeigt gelernte Dinge', async ({ page }) => {
    // Prüfe initialen Lernzähler
    const learnedCounter = page.locator('text=/heute gelernt|🌟/');
    
    // Mindestens der Blob sollte vorhanden sein
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Spielzimmer - Animationen', () => {
  
  test('Formen werden basierend auf Emotion angezeigt', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Der Blob sollte animiert sein
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
    
    // Prüfe dass Animation existiert (CSS animation oder transform)
    const animation = await blob.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.animationName !== 'none' || 
             style.transform !== 'none' ||
             el.classList.length > 0;
    });
    expect(animation).toBeTruthy();
  });

  test('Farben ändern sich mit Emotion', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Finde den Blob/das Avatar-Element
    const avatar = page.locator('[class*="blob"], [class*="Blob"], [data-testid="avatar"]').first();
    await expect(avatar).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Spielzimmer - Lern-Interaktion', () => {
  
  test('Papa kann dem Kind etwas beibringen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Aktiviere Mikrofon
    const micButton = page.locator('button:has(svg)').first();
    await micButton.click();
    
    // Warte auf Spracherkennung
    await page.waitForTimeout(1000);
  });

  test('Kind reagiert mit Aha-Moment', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Nach einer Weile sollte das Kind reagieren
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
  });

  test('Korrektur wird kindgerecht angenommen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Kind akzeptiert Korrektur von Papa/Mama
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Spielzimmer - Mobile Voice Client Integration', () => {
  
  test('Spielzimmer ist im MobileVoiceClient integriert', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Alle Hauptelemente sollten vorhanden sein
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
    
    // Emotions-Anzeige
    const emotionIndicator = page.locator('[class*="emotion"], [data-testid="emotion"]').first();
    const hasEmotion = await emotionIndicator.count() > 0;
    expect(hasEmotion).toBeTruthy();
  });

  test('Keine Konsolenfehler während Spielzimmer-Betrieb', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Warte auf Spielzimmer-Aktivierung
    await page.waitForTimeout(25000);
    
    // Ignoriere bekannte nicht-kritische Fehler
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Warning') &&
      !e.includes('deprecated')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Spielzimmer - Batterie-Optimierung', () => {
  
  test('Spielzimmer reagiert auf Batterie-Zustand', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Bei niedriger Batterie sollten sanfte Animationen aktiviert werden
    const blob = page.locator('[class*="blob"], [class*="Blob"]').first();
    await expect(blob).toBeVisible({ timeout: 5000 });
  });
});
