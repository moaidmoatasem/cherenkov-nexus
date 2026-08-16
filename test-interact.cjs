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
  await page.waitForTimeout(1000);
  
  // Skip tour
  const tourCloseBtn = page.locator('button[title="Skip Tour (Esc)"]');
  if (await tourCloseBtn.count() > 0) {
      await tourCloseBtn.first().click();
      await page.waitForTimeout(500);
  }

  // Open Onboarding Wizard
  // In App.tsx, we have a profile button on the sidebar that triggers it or isIdentityVaultOpen?
  // Let's find "Import Profile" or something
  const importBtn = page.locator('text=Import');
  if (await importBtn.count() > 0) {
      await importBtn.first().click();
      await page.waitForTimeout(1000);
  } else {
      // Find the Identity Vault button? Let's just click all buttons and see if any crash
      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
          try {
              if (await btn.isVisible()) {
                  await btn.click({ timeout: 500 });
                  await page.waitForTimeout(200);
              }
          } catch(e) {}
      }
  }
  
  console.log('BROWSER LOGS AFTER INTERACTION:');
  console.log(logs.join('\n'));
  
  await browser.close();
})();
