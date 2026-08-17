const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.push(`[PAGE ERROR] ${error.message}`);
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  
  console.log('BROWSER LOGS:');
  console.log(logs.join('\n'));
  
  await browser.close();
})();
