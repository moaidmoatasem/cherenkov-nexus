const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => { localStorage.setItem('cherenkov_tour_completed', 'true'); });
  await page.reload();
  await page.waitForTimeout(1000);

  // Try to click Open Onboarding
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Import'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'wizard.png' });
  
  await browser.close();
})();
