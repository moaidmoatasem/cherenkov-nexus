import { test, expect } from '@playwright/test';
import { seedWorkspace } from './fixtures';

test.describe('CHERENKOV-NEXUS UI Workflows (Phase 3 & 4)', () => {

  test.beforeEach(async ({ context, page }) => {
    // The app boots empty by design; this spec needs a populated workspace.
    await seedWorkspace(context);
    await context.addInitScript(() => {
      localStorage.setItem('cherenkov_tour_completed', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('UI Workflow 1: Kanban Board Interaction', async ({ page }) => {
    // Navigate to Kanban Pipeline
    const kanbanBtn = page.getByRole('button', { name: /Kanban/i }).first();
    await kanbanBtn.click({ force: true });
    await expect(page.locator('text=Ready to Pitch').first()).toBeVisible();

    // Verify Column Headers exist
    await expect(page.locator('text=Saved Discovery').first()).toBeVisible();
    await expect(page.locator('text=Active Interviews').first()).toBeVisible();
  });

  test('UI Workflow 2: Learning Sync xAPI Simulation', async ({ page }) => {
    // Navigate to Learning Sync
    const learningBtn = page.getByRole('button', { name: /Learning/i }).first();
    await learningBtn.click({ force: true });
    await expect(page.locator('text=Learning Sync & Competency Matrix').first()).toBeVisible({ timeout: 15000 });

    // Verify Add Course form is available
    const addPathwayBtn = page.getByRole('button', { name: /Add Custom Pathway/i }).first();
    await addPathwayBtn.click({ force: true });
    await expect(page.locator('input[placeholder*="Advanced Playwright"]').first()).toBeVisible();
    
    // Verify Webhook configuration UI is present
    await expect(page.locator('text=Continuous xAPI Learning Sync Webhook').first()).toBeVisible();
  });
});
