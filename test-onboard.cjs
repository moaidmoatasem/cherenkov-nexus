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
  await page.waitForTimeout(1000); // let tour bypass or wait
  
  // try to open onboarding modal
  // Is there a button to open it? 
  // In App.tsx: onOpenOnboarding={() => setIsOnboardingOpen(true)}
  // Where is it?
  // Let's just run the evaluate to set the state or click the button.
  // We can look for "Import Profile" or something?
  const importBtn = page.locator('text=Import');
  if (await importBtn.count() > 0) {
      await importBtn.first().click();
      await page.waitForTimeout(1000);
      console.log('Clicked import');
  } else {
      console.log('No import button');
  }
  
  console.log('Errors:', errors);
  
  await browser.close();
})();
