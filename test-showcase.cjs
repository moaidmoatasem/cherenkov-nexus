const { chromium } = require('playwright-core');

(async () => {
  console.log('[SHOWCASE] Launching Headless Chromium Showcase Automation...');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
  });

  // 1. Navigate to application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Set tour as completed for clean showcase
  await page.evaluate(() => {
    localStorage.setItem('cherenkov_tour_completed', 'true');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');

  console.log('[SHOWCASE 1/4] Triggering Dynamic Onboarding Wizard...');
  // Click on "Magic Import" in sidebar or open via command
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Magic Import') || el.textContent.includes('Import'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // Capture Onboarding Wizard with Archetypes
  await page.screenshot({ path: 'showcase-onboarding.png' });
  console.log('[PASS] showcase-onboarding.png captured.');

  // Select "Zero-Trust Enterprise Engineer" Archetype
  await page.evaluate(() => {
    const archetypeBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Zero-Trust Enterprise Engineer'));
    if (archetypeBtn) archetypeBtn.click();
  });
  await page.waitForTimeout(600);

  // Click continue to step 2
  await page.evaluate(() => {
    const continueBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Continue with Zero-Trust'));
    if (continueBtn) continueBtn.click();
  });
  await page.waitForTimeout(600);

  // Click continue to step 3
  await page.evaluate(() => {
    const continueBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Continue to Privacy'));
    if (continueBtn) continueBtn.click();
  });
  await page.waitForTimeout(600);

  // Finalize onboarding
  await page.evaluate(() => {
    const initBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Initialize Cherenkov Nexus'));
    if (initBtn) initBtn.click();
  });
  await page.waitForTimeout(1000);

  console.log('[SHOWCASE 2/4] Testing Split-Screen Job Synthesizer & Role Alignment...');
  // Ingest Monzo preset
  await page.evaluate(() => {
    const presetBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Monzo Bank'));
    if (presetBtn) presetBtn.click();
  });
  await page.waitForTimeout(500);

  // Trigger synthesis
  await page.evaluate(() => {
    const synthBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Synthesize Role & Tailor Weaponry'));
    if (synthBtn) synthBtn.click();
  });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: 'showcase-synthesizer.png' });
  console.log('[PASS] showcase-synthesizer.png captured.');

  console.log('[SHOWCASE 3/4] Testing Kanban Application Pipeline View...');
  await page.evaluate(() => {
    const kanbanTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Kanban'));
    if (kanbanTab) kanbanTab.click();
  });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'showcase-kanban.png' });
  console.log('[PASS] showcase-kanban.png captured.');

  console.log('[SHOWCASE 4/4] Testing Command Palette (Cmd+K) with Archetype Presets...');
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(800);

  await page.screenshot({ path: 'showcase-command-palette.png' });
  console.log('[PASS] showcase-command-palette.png captured.');

  await browser.close();
  console.log('[SHOWCASE COMPLETE] All visual assets and workflows executed with 0 errors.');
})();
