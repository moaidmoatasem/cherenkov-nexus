import { test, expect } from '@playwright/test';

test.describe('CHERENKOV-NEXUS Comprehensive E2E System & Component Suite', () => {

  test.beforeEach(async ({ context, page }) => {
    // Enable browser console logs to be forwarded to our runner for debugging
    page.on('console', msg => console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER UNHANDLED ERROR] ${err.message}`));

    // Pre-populate localStorage prior to page load to bypass first-time tour modal
    await context.addInitScript(() => {
      localStorage.setItem('cherenkov_tour_completed', 'true');
    });

    // Clean single navigation to app entrypoint
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Module 1: Navigation & Header Controls across all core hubs', async ({ page }) => {
    // 1. Verify Header branding
    await expect(page.locator('text=CHERENKOV NEXUS').first()).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Kanban Pipeline
    const kanbanBtn = page.locator('button:has-text("Kanban Pipeline")').first();
    await kanbanBtn.click({ force: true });
    await expect(page.locator('text=Ready to Pitch').first()).toBeVisible();

    // 3. Navigate to Learning Sync
    const learningBtn = page.locator('button:has-text("Learning Sync")').first();
    await learningBtn.click({ force: true });
    await expect(page.locator('text=Learning Sync & Competency Matrix').first()).toBeVisible();

    // 4. Navigate to MCP Marketplace
    const marketplaceBtn = page.locator('button:has-text("MCP Marketplace")').first();
    await marketplaceBtn.click({ force: true });
    await expect(page.locator('text=Model Context Protocol & Strategy Marketplace').first()).toBeVisible();

    // 5. Navigate to Agent Canvas
    const agentCanvasBtn = page.locator('button:has-text("Agent Canvas")').first();
    await agentCanvasBtn.click({ force: true });
    await expect(page.locator('text=Visual Multi-Agent Canvas').first()).toBeVisible();

    // 6. Navigate back to Job Synthesizer
    const synthBtn = page.locator('button:has-text("Job Synthesizer")').first();
    await synthBtn.click({ force: true });
    await expect(page.locator('text=Job Synthesizer & Weaponry Arsenal').first()).toBeVisible();
  });

  test('Module 2: Identity Vault & Inference Routing State-Driven Toggles', async ({ page }) => {
    // Open Identity Vault Modal via Sidebar button
    const vaultBtn = page.locator('button:has-text("Zero-Trust Vault")').first();
    await vaultBtn.click({ force: true });

    // Verify modal container and header are visible
    const vaultModal = page.locator('div.fixed:has-text("Portable Identity & Zero-Trust Security Vault")').first();
    await expect(vaultModal).toBeVisible();

    // Verify toggle buttons exist
    const geminiToggle = vaultModal.locator('button:has-text("Gemini (Cloud)")').first();
    const ollamaToggle = vaultModal.locator('button:has-text("Ollama (Local)")').first();
    const hybridToggle = vaultModal.locator('button:has-text("Hybrid Smart Router")').first();

    await expect(geminiToggle).toBeVisible();
    await expect(ollamaToggle).toBeVisible();
    await expect(hybridToggle).toBeVisible();

    // Toggle to Ollama (Local) with force to bypass backdrop
    await ollamaToggle.click({ force: true });
    await page.waitForTimeout(300);

    // Close Vault using programmatic click
    const closeBtn = vaultModal.locator('button:has-text("✕")').first();
    await closeBtn.evaluate(el => (el as HTMLButtonElement).click());

    // Verify Active LLM in header updated or visible
    await expect(page.locator('text=Active LLM:').first()).toBeVisible();
  });

  test('Module 3: Dynamic Job Preset Ingestion & Role Alignment Execution', async ({ page }) => {
    // Ingest Monzo preset
    const monzoPreset = page.locator('button:has-text("Monzo Bank")').first();
    await monzoPreset.click({ force: true });

    // Run synthesis
    const synthActionBtn = page.locator('button:has-text("Synthesize Role & Tailor Weaponry")').first();
    await synthActionBtn.click({ force: true });

    // Wait for synthesis to complete
    await expect(page.locator('text=Competency Alignment Match').first()).toBeVisible({ timeout: 25000 });

    // Verify key sections generated
    await expect(page.locator('text=Executive Resume Summary').first()).toBeVisible();
    await expect(page.locator('text=Gap Analysis & Mitigation').first()).toBeVisible();
    await expect(page.locator('text=3-Sentence Hook').first()).toBeVisible();
  });

  test('Module 4: Multi-Model Concurrent Comparison Modal', async ({ page }) => {
    // Load a preset first so that jobDescription is populated for comparison auto-run
    const wisePreset = page.locator('button:has-text("Wise")').first();
    await wisePreset.click({ force: true });

    // Open Compare Models modal
    const compareBtn = page.locator('button:has-text("Compare Models")').first();
    await compareBtn.click({ force: true });

    // Verify comparison modal container is visible
    const compareModal = page.locator('div.fixed:has-text("Dual-Engine Synthesis Benchmark: Cloud vs. Local")').first();
    await expect(compareModal).toBeVisible();

    // Verify both headers/sections are visible
    await expect(compareModal.locator('text=Cloud Enterprise Engine').first()).toBeVisible({ timeout: 15000 });
    await expect(compareModal.locator('text=Zero-Egress Air-Gapped Engine').first()).toBeVisible({ timeout: 15000 });

    // Close modal programmatically
    const closeBtn = compareModal.locator('button:has-text("✕")').first();
    await closeBtn.evaluate(el => (el as HTMLButtonElement).click());
  });

  test('Module 5: Magic Profile Import & Onboarding Wizard', async ({ page }) => {
    // Open Onboarding Modal via Sidebar
    const onboardingBtn = page.locator('button:has-text("Magic Import")').first();
    await onboardingBtn.click({ force: true });

    // Verify onboarding modal container is visible
    const onboardingModal = page.locator('div.fixed').first();
    await expect(onboardingModal).toBeVisible();

    // Close modal programmatically if close button exists
    const closeBtn = onboardingModal.locator('button:has-text("✕"), button:has-text("Exit"), button:has-text("Skip")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.evaluate(el => (el as HTMLButtonElement).click());
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('Module 6: Command Palette (Cmd+K) & Theme Engine Switcher', async ({ page }) => {
    // Prefer clicking the UI button if available, fallback to keyboard
    const paletteBtn = page.locator('button[title*="Command Palette"], button[title*="Cmd+K"]').first();
    
    if (await paletteBtn.isVisible()) {
      await paletteBtn.click({ force: true });
    } else {
      await page.keyboard.press('Control+k');
    }
       
    // Verify command palette input has opened
    const paletteInput = page.locator('input[placeholder*="Type a command"]').first();
    await expect(paletteInput).toBeVisible();
    await paletteInput.focus();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');

    // Wait for command palette to be completely hidden to ensure backdrop is gone
    await expect(paletteInput).toBeHidden();
    await page.waitForTimeout(500);

    // Test Theme Selector. Assert the theme actually applied, not that a menu
    // appeared — the picker opening proves nothing about whether switching works.
    const themeBtn = page.locator('button[title*="Switch Visual Theme"]').first();
    await themeBtn.click({ force: true });

    const before = await page.evaluate(() => document.body.className);
    await page.locator('button:has-text("Quantum Emerald")').first().click({ force: true });

    await expect
      .poll(() => page.evaluate(() => document.body.className))
      .toContain('theme-emerald');

    expect(await page.evaluate(() => document.body.className)).not.toBe(before);

    // The choice must survive a reload, or it is not a setting.
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => document.body.className))
      .toContain('theme-emerald');
  });

});
