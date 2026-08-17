const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Close the tour
  const tourCloseBtn = page.locator('button[title="Skip Tour (Esc)"]');
  if (await tourCloseBtn.count() > 0) {
      await tourCloseBtn.first().click();
      await page.waitForTimeout(500);
  }
  
  // Click preset
  const presetBtn = page.locator('text=Google (UK)');
  if (await presetBtn.count() > 0) {
      await presetBtn.first().click();
      await page.waitForTimeout(1000);
  }
  
  // Click synthesize
  const synthesisBtn = page.locator('text=Synthesize Role & Tailor Weaponry');
  if (await synthesisBtn.count() > 0) {
      await synthesisBtn.first().click();
      await page.waitForTimeout(4000); // wait for synthesize
  }
  
  console.log('Errors during flow:', errors);
  
  await browser.close();
})();
