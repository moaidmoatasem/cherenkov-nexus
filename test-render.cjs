const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  const rootHtml = await page.locator('#root').innerHTML();
  console.log('Root HTML length:', rootHtml.length);
  
  if (rootHtml.length < 100) {
      console.log('Root HTML is too small, app might not be rendering!');
      console.log(rootHtml);
  } else {
      console.log('App is rendering fine (HTML size > 100).');
  }
  
  await browser.close();
})();
