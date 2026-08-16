import { test, expect } from '@playwright/test';

test.describe('CHERENKOV-NEXUS UI Workflows (Phase 3 & 4)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Bypass tour
    await page.evaluate(() => {
      localStorage.setItem('cherenkov_tour_completed', 'true');
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('UI Workflow 1: Kanban Board Interaction', async ({ page }) => {
    // Navigate to Kanban Pipeline
    await page.click('button:has-text("Kanban Pipeline")');
    await expect(page.locator('text=Ready to Pitch').first()).toBeVisible();

    // Verify Add Application modal can be opened
    const addAppBtn = page.locator('button:has-text("Add Application")').first();
    if (await addAppBtn.isVisible()) {
      await addAppBtn.click();
      await expect(page.locator('text=Manual Entry').first()).toBeVisible();
      await page.click('button:has-text("Cancel")');
    }
    
    // Verify Column Headers exist
    await expect(page.locator('text=Targeted Prospects').first()).toBeVisible();
    await expect(page.locator('text=Active Interviews').first()).toBeVisible();
  });

  test('UI Workflow 2: Learning Sync xAPI Simulation', async ({ page }) => {
    // Navigate to Learning Sync
    await page.click('button:has-text("Learning Sync")');
    await expect(page.locator('text=Learning Sync & Competency Matrix').first()).toBeVisible();

    // Verify Add Course form is available
    await page.click('button:has-text("Log External Certification")');
    await expect(page.locator('input[placeholder="e.g. Distributed Performance & Stress Testing"]').first()).toBeVisible();
    
    // Verify Webhook configuration UI is present
    await expect(page.locator('text=xAPI Webhook Stream').first()).toBeVisible();
  });
});
