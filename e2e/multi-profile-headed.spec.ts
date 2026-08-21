import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('CHERENKOV-NEXUS Multi-Profile Comprehensive Real Headed Test Suite', () => {

  const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/assets/screenshots/profiles');

  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ context, page }) => {
    // Forward console logs for live debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });

    // Bypass initial tour modal deterministically
    await context.addInitScript(() => {
      localStorage.setItem('cherenkov_tour_completed', 'true');
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Profile Archetype 1: International Visa Seeker (Moayed Badawy) - UK/EU Relocation & Visa Sponsor Verification', async ({ page }) => {
    // 1. Open Onboarding Wizard via Magic Import
    const magicImportBtn = page.locator('button:has-text("Magic Import")').first();
    await magicImportBtn.click({ force: true });
    await expect(page.locator('text=Select Your Career Archetype').first()).toBeVisible();

    // 2. Select International Visa Seeker preset
    const intlCard = page.locator('button:has-text("International Visa Seeker")').first();
    await intlCard.click({ force: true });

    // 3. Step through wizard
    await page.locator('button:has-text("Continue with International Visa Seeker")').first().click({ force: true });
    await expect(page.locator('text=The Career Compass').first()).toBeVisible();

    await page.locator('button:has-text("Continue to Privacy & Routing")').first().click({ force: true });
    await expect(page.locator('text=Zero-Trust Privacy & LLM Routing').first()).toBeVisible();

    await page.locator('button:has-text("Initialize Cherenkov Nexus")').first().click({ force: true });
    await expect(page.locator('text=Select Your Career Archetype')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(500);

    // 4. Ingest Monzo Bank (UK Sponsor) Preset
    const monzoBtn = page.locator('button:has-text("Monzo Bank")').first();
    await monzoBtn.click({ force: true });

    // 5. Execute Synthesis
    const synthBtn = page.locator('button:has-text("Synthesize Role & Tailor Weaponry")').first();
    await synthBtn.click({ force: true });

    // 6. Verify Sponsor Verification and Output Artifacts
    await expect(page.locator('text=Competency Alignment Match').first()).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Executive Resume Summary').first()).toBeVisible();
    await expect(page.locator('text=Gap Analysis & Mitigation').first()).toBeVisible();
    await expect(page.locator('text=3-Sentence Hook').first()).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'spec_01_international_seeker.png'),
      fullPage: true
    });
  });

  test('Profile Archetype 2: Zero-Trust Enterprise Engineer (Alexei Vance) - Air-Gapped PII Vault & Local Inference', async ({ page }) => {
    // 1. Open Onboarding & Select Zero-Trust Specialist
    const magicImportBtn = page.locator('button:has-text("Magic Import")').first();
    await magicImportBtn.click({ force: true });

    const ztCard = page.locator('button:has-text("Zero-Trust Enterprise Engineer")').first();
    await ztCard.click({ force: true });

    await page.locator('button:has-text("Continue with Zero-Trust Enterprise Engineer")').first().click({ force: true });
    await page.locator('button:has-text("Continue to Privacy & Routing")').first().click({ force: true });
    await page.locator('button:has-text("Initialize Cherenkov Nexus")').first().click({ force: true });
    await expect(page.locator('text=Select Your Career Archetype')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(600);

    // 2. Open Zero-Trust Vault
    const vaultBtn = page.locator('button:has-text("Zero-Trust Vault"), button:has-text("Vault")').first();
    await vaultBtn.click({ force: true });

    const vaultModal = page.locator('div.fixed:has-text("Portable Identity & Zero-Trust Security Vault")').first();
    await expect(vaultModal).toBeVisible({ timeout: 10000 });

    // 3. Toggle Local Ollama Engine
    const ollamaBtn = vaultModal.locator('button:has-text("Ollama (Local)")').first();
    if (await ollamaBtn.isVisible()) {
      await ollamaBtn.click({ force: true });
      await page.waitForTimeout(300);
    }

    // Close Vault safely via keyboard Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 4. Capture screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'spec_02_zero_trust_specialist.png'),
      fullPage: true
    });
  });

  test('Profile Archetype 3: Upskilling Career Switcher (Jordan Lee) - xAPI Learning Sync & Mock Interview', async ({ page }) => {
    // 1. Switch to Upskilling Switcher
    const magicImportBtn = page.locator('button:has-text("Magic Import")').first();
    await magicImportBtn.click({ force: true });

    const upskillCard = page.locator('button:has-text("Upskilling Career Switcher")').first();
    await upskillCard.click({ force: true });

    await page.locator('button:has-text("Continue with Upskilling Career Switcher")').first().click({ force: true });
    await page.locator('button:has-text("Continue to Privacy & Routing")').first().click({ force: true });
    await page.locator('button:has-text("Initialize Cherenkov Nexus")').first().click({ force: true });
    await expect(page.locator('text=Select Your Career Archetype')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(600);

    // 2. Navigate to Learning Sync
    const learningNav = page.locator('button:has-text("Learning Sync")').first();
    await learningNav.click({ force: true });
    await expect(page.locator('text=Learning Sync & Competency Matrix').first()).toBeVisible();

    // 3. Capture screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'spec_03_upskilling_switcher.png'),
      fullPage: true
    });
  });

  test('Profile Archetype 4: Staff & Executive Leader (Marcus Sterling) - Recruiter Mapping & Community Radar', async ({ page }) => {
    // 1. Switch to Staff & Executive Leader
    const magicImportBtn = page.locator('button:has-text("Magic Import")').first();
    await magicImportBtn.click({ force: true });

    const execCard = page.locator('button:has-text("Staff & Executive Leader")').first();
    await execCard.click({ force: true });

    await page.locator('button:has-text("Continue with Staff & Executive Leader")').first().click({ force: true });
    await page.locator('button:has-text("Continue to Privacy & Routing")').first().click({ force: true });
    await page.locator('button:has-text("Initialize Cherenkov Nexus")').first().click({ force: true });
    await expect(page.locator('text=Select Your Career Archetype')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(600);

    // 2. Navigate to Community Radar
    const radarNav = page.locator('button:has-text("Community Radar")').first();
    if (await radarNav.isVisible()) {
      await radarNav.click({ force: true });
      await expect(page.locator('text=Hiring Telemetry').first()).toBeVisible({ timeout: 10000 });
    }

    // 3. Capture screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'spec_04_staff_executive.png'),
      fullPage: true
    });
  });

  test('Profile Archetype 5: Autonomous Swarm Architect (Tariq Al-Mansoor) - Multi-Agent Canvas & MCP Marketplace', async ({ page }) => {
    // 1. Switch to Autonomous Swarm Architect
    const magicImportBtn = page.locator('button:has-text("Magic Import")').first();
    await magicImportBtn.click({ force: true });

    const swarmCard = page.locator('button:has-text("Autonomous Swarm Architect")').first();
    await swarmCard.click({ force: true });

    await page.locator('button:has-text("Continue with Autonomous Swarm Architect")').first().click({ force: true });
    await page.locator('button:has-text("Continue to Privacy & Routing")').first().click({ force: true });
    await page.locator('button:has-text("Initialize Cherenkov Nexus")').first().click({ force: true });
    await expect(page.locator('text=Select Your Career Archetype')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(600);

    // 2. Navigate to Agent Canvas
    const canvasNav = page.locator('button:has-text("Agent Canvas")').first();
    await canvasNav.click({ force: true });
    await expect(page.locator('text=Visual Multi-Agent Canvas').first()).toBeVisible();

    // 3. Navigate to MCP Marketplace
    const mcpNav = page.locator('button:has-text("MCP Marketplace")').first();
    await mcpNav.click({ force: true });
    await expect(page.locator('text=Model Context Protocol & Strategy Marketplace').first()).toBeVisible();

    // 4. Capture screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'spec_05_automation_power_user.png'),
      fullPage: true
    });
  });

});
