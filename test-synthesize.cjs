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
  
  // Try to synthesize a job to trigger JobSynthesizer component to render the patched section
  // Let's look for the synthesis button or a preset
  const synthesisBtn = page.locator('text=Synthesize Role & Tailor Weaponry');
  
  // if it exists, click it
  if (await synthesisBtn.count() > 0) {
      await synthesisBtn.first().click();
      await page.waitForTimeout(2000);
  }
  
  // See if there's any errors
  if (errors.length > 0) {
      console.log('CRASH ERRORS:', errors);
  } else {
      console.log('No crash errors during synthesis');
  }
  
  await browser.close();
})();
