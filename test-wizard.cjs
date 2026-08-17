const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => { if(msg.type()==='error') logs.push(msg.text()); });
  page.on('pageerror', error => logs.push(error.message));

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // By-pass tour
  await page.evaluate(() => { localStorage.setItem('cherenkov_tour_completed', 'true'); });
  await page.reload();
  await page.waitForTimeout(1000);

  // Click on profile/onboarding button to open wizard
  const onboardBtn = page.locator('text=Start Onboarding').first();
  if (await onboardBtn.count() > 0) {
      await onboardBtn.click();
      await page.waitForTimeout(1000);
  } else {
      // Find anything that opens the modal
      await page.evaluate(() => {
          // Just trigger the React state if we can, or click all buttons
      });
      // The Sidebar has a "Profile" section
      const profileSection = page.locator('text=Moayed Badawy').first();
      if (await profileSection.count() > 0) {
          await profileSection.click();
          await page.waitForTimeout(1000);
      }
  }

  console.log('Errors:', logs);
  await browser.close();
})();
