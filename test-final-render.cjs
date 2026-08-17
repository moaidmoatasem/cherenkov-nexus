const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  const rootHtml = await page.locator('#root').innerHTML();
  if (rootHtml.length > 100) {
      console.log('App is rendering fine after restart.');
  } else {
      console.log('App is NOT rendering!');
  }
  
  await browser.close();
})();
