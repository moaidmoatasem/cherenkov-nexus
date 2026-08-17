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
  await page.waitForTimeout(2000);
  
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  if (!rootHtml || rootHtml.trim() === '') {
      console.log('APP IS CRASHED - #root is empty!');
      console.log('ERRORS:', errors);
  } else {
      console.log('App is rendering fine, #root has content.');
  }
  
  await browser.close();
})();
