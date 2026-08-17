const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Wait for tour to open (750ms + some delay)
  await page.waitForTimeout(2000);
  
  // Is the tour wrapper visible?
  const tourCloseBtn = page.locator('button[title="Skip Tour (Esc)"]');
  if (await tourCloseBtn.count() > 0) {
      console.log('Tour close button found');
      await tourCloseBtn.first().click();
      console.log('Clicked close button');
  } else {
      console.log('Tour close button NOT found');
  }
  
  await browser.close();
})();
