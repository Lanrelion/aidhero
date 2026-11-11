import { test, expect } from '@playwright/test';
import { scenarios, getScenario } from '../lib/data/scenarios';
import { decisionTrees, getDecisionTree } from '../lib/data/decisionTrees';
import { validateTreeDepth } from '../lib/data/validateTreeDepth';
import type { DecisionTree, QuestionNode } from '../types/decision-tree';

test('every incident has a registered flow with valid branches', () => {
  expect(new Set(decisionTrees.map(tree => tree.id)).size).toBe(decisionTrees.length);

  for (const scenario of scenarios) {
    const tree = getDecisionTree(`${scenario.slug}-flow`);
    expect(tree, `Missing flow for ${scenario.slug}`).toBeDefined();
    expect(tree!.incident_id).toBe(scenario.id);
    expect(() => validateTreeDepth(tree!)).not.toThrow();

    for (const [nodeId, node] of Object.entries(tree!.nodes)) {
      if (node.type === 'question') {
        expect(node.options.length).toBeGreaterThanOrEqual(2);
        expect(node.options.length).toBeLessThanOrEqual(3);
        for (const option of node.options) {
          expect(tree!.nodes[option.next_node_id], `${tree!.id}/${nodeId}`).toBeDefined();
        }
      }
    }
  }
});

// Enumerate every answer path so alternative branches are covered as well.
function answerPaths(tree: DecisionTree, nodeId = tree.root_node_id): string[][] {
  const node = tree.nodes[nodeId];
  if (node.type === 'instruction') return [[]];

  return node.options.flatMap(option =>
    answerPaths(tree, option.next_node_id).map(path => [option.label, ...path])
  );
}

test('all incident answer paths navigate to steps on mobile', async ({ page }) => {
  test.setTimeout(240_000);
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));

  await page.goto('/en/onboarding');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  for (const scenario of scenarios) {
    console.log(`Rescue navigation: ${scenario.slug}`);
    const tree = getDecisionTree(`${scenario.slug}-flow`)!;
    for (const answers of answerPaths(tree)) {
      await page.goto(`/en/incidents/${scenario.slug}/rescue`);
      let nodeId = tree.root_node_id;
      for (const answer of answers) {
        const node = tree.nodes[nodeId] as QuestionNode;
        await expect(page.getByRole('heading', { name: node.text, exact: true })).toBeVisible();
        const optionButton = page.getByRole('button', { name: answer, exact: true });
        const bounds = await optionButton.boundingBox();
        expect(bounds!.height).toBeGreaterThanOrEqual(64);
        await optionButton.click();
        nodeId = node.options.find(option => option.label === answer)!.next_node_id;
      }

      const destination = tree.nodes[nodeId];
      expect(destination.type).toBe('instruction');
      if (destination.type !== 'instruction') throw new Error('Expected instructions');
      const targetSlug = getScenario(destination.steps_reference)?.slug ?? scenario.slug;
      await expect(page).toHaveURL(new RegExp(`/en/incidents/${targetSlug}/steps\\?variant=`));
      await expect(page.getByText('Flow not found', { exact: false })).toHaveCount(0);
      await expect(page.getByText('No steps available.', { exact: true })).toHaveCount(0);
      const pendingBranches = ['cardiac-arrest:recovery', 'drowning:recovery', 'choking-child:cough'];
      if (pendingBranches.includes(`${scenario.slug}:${destination.variant}`)) {
        await expect(page.getByRole('status').getByText('Pending medical review', { exact: true })).toBeVisible();
        await expect(page.locator('main h3')).toHaveCount(0);
      } else {
        await expect(page.locator('main h3').first()).toBeVisible();
      }
    }
  }
  expect(runtimeErrors).toEqual([]);
});

test('emergency and step controls sit above the bottom navigation', async ({ page }) => {
  await page.goto('/en/onboarding');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);

  const routes = [
    { path: '/en/incidents/angina', controls: 'main a[href^="tel:"]', count: 1 },
    { path: '/en/incidents/angina/rescue', controls: 'main a[href^="tel:"]', count: 1 },
    { path: '/en/incidents/angina/steps', controls: 'main a[href^="tel:"], main button:has-text("Next Step"), main button[aria-label="Voice Mode"]', count: 3 },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();
    const navBounds = await navigation.boundingBox();
    await expect(page.locator(route.controls)).toHaveCount(route.count);
    for (const control of await page.locator(route.controls).all()) {
      await expect(control).toBeVisible();
      const bounds = await control.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(64);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(navBounds!.y);
      const uncovered = await control.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      });
      expect(uncovered).toBe(true);
    }
  }
});

test('a cached rescue question and its instructions work offline', async ({ page, context }) => {
  await page.goto('/en/onboarding');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 25_000 });
  await page.goto('/en/incidents/anaphylaxis/rescue');
  const question = page.getByRole('heading', { name: 'Does the person have an adrenaline auto-injector (EpiPen)?', exact: true });
  await expect(question).toBeVisible();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.locator('main h3').first()).toBeVisible();
  await context.setOffline(true);
  await page.goto('/en/incidents/anaphylaxis/rescue');
  await expect(question).toBeVisible();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.locator('main h3').first()).toBeVisible();
});
