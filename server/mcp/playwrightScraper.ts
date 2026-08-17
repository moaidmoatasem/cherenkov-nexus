import { chromium } from 'playwright';

export async function executeServerlessScrape(targetUrl: string) {
  let browser;
  if (process.env.BROWSERLESS_API_KEY) {
    // Connect to a scalable edge cluster
    browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`);
  } else {
    // Local-First Fallback
    console.log(`[SCRAPER] 🔌 No BROWSERLESS_API_KEY found. Falling back to local headless Chromium.`);
    browser = await chromium.launch({ headless: true });
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    const accessibilityTree = await (page as any).accessibility.snapshot();
    
    return accessibilityTree;
  } finally {
    await browser.close();
  }
}
