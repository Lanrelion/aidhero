import { test, expect } from '@playwright/test';

test('Voice Mode initialises SpeechRecognition and shows listening indicator', async ({ page, context }) => {
  const consoleLogs: string[] = [];

  page.on('console', (msg) => {
    consoleLogs.push(msg.text());
  });

  // Grant microphone permissions in browser context
  await context.grantPermissions(['microphone']);

  // Navigate to home first and handle onboarding if present
  await page.goto('/en');
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);

  const skipBtn = page.locator('button:has-text("Skip")').first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  // Navigate directly to incident steps page
  await page.goto('/en/incidents/heart-attack/steps');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);

  // If still showing onboarding for any reason, skip it
  if (await skipBtn.isVisible()) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  // Click on Voice Mode FAB button (bottom right)
  const voiceModeFab = page.locator('button[aria-label*="Voice Mode"], button[aria-label*="voiceMode"]').first();
  await expect(voiceModeFab).toBeVisible();
  await voiceModeFab.click();

  // Wait 1.5s for Voice Mode to mount and initialize
  await page.waitForTimeout(1500);

  // Check dialog is open
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Check for the voice status indicator text
  await expect(dialog.getByText(/Mic ready|Listening|Speaking/i).first()).toBeVisible();

  // Check for the red element / wave visualizer
  const redDot = dialog.locator('.bg-emergency');
  await expect(redDot.first()).toBeVisible();

  // Print all captured SR logs
  console.log('\n=== Captured Voice Mode Console Logs ===');
  consoleLogs.forEach(l => console.log('  ' + l));
  console.log('========================================\n');

  // Verify checking support log was logged
  expect(consoleLogs.some(l => l.includes('SR: checking support'))).toBeTruthy();
});

test('Voice Mode does not race steps and respects user countdown / Next button', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);

  await page.goto('/en');
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);

  const skipBtn = page.locator('button:has-text("Skip")').first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  await page.goto('/en/incidents/heart-attack/steps');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);

  if (await skipBtn.isVisible()) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  // Open Voice Mode via FAB
  const voiceModeFab = page.locator('button[aria-label*="Voice Mode"], button[aria-label*="voiceMode"]').first();
  await expect(voiceModeFab).toBeVisible();
  await voiceModeFab.click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Step 1 should be visible
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();

  // Wait 4 seconds — previously the bug caused it to advance at 2.6s (600ms + 2000ms)
  await page.waitForTimeout(4000);

  // Verify Step 1 is STILL visible and has NOT advanced automatically in 4s!
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();

  // Tap Next Step button manually
  const nextBtn = dialog.locator('button:has-text("Next Step")');
  await expect(nextBtn).toBeVisible();
  await nextBtn.click();

  // Wait for step transition
  await page.waitForTimeout(1000);

  // Verify now on Step 2
  await expect(dialog.getByText(/Step 2 of/i)).toBeVisible();
});
