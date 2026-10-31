import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/en',
  '/en/incidents',
  '/en/incidents/heart-attack',
  '/en/incidents/heart-attack/rescue',
  '/en/incidents/heart-attack/steps',
  '/en/emergency',
  '/en/settings',
  '/en/onboarding',
];

for (const route of routes) {
  test(`Accessibility check on ${route}`, async ({ page }) => {
    await page.goto(route);
    
    // Wait for the page to be fully loaded, not networkidle (which blocks on Next.js HMR)
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000); // Give React a moment to mount client components

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log(`\nViolations on ${route}:`);
      accessibilityScanResults.violations.forEach((v) => {
        console.log(`- [${v.id}] ${v.description}`);
        console.log(`  Nodes: ${v.nodes.map(n => n.html).join(' | ')}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
