import { expect, type Page } from '@playwright/test';

export async function openRescueSteps(page: Page, incident = 'heart-attack') {
  await page.goto('/en/onboarding');
  const skip = page.getByRole('button', { name: 'Skip', exact: true });
  // The server can render Skip before its client handler has loaded.
  await expect(async () => {
    if (new URL(page.url()).pathname.endsWith('/onboarding')) await skip.click({ timeout: 1000 });
    await expect(page).toHaveURL(/\/en$/, { timeout: 1000 });
  }).toPass({ timeout: 10000 });
  await page.goto(`/en/incidents/${incident}/steps`);
}
