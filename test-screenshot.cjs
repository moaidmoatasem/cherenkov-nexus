const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  console.log('Screenshot saved to screenshot.png');
  
  await browser.close();
})();
