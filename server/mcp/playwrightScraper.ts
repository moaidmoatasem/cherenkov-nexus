// playwright-core, not playwright. `playwright` is a devDependency, so a
// production install (npm ci --omit=dev) would throw MODULE_NOT_FOUND on the
// first scrape. playwright-core is the declared runtime dependency; it drives
// a browser but does not download one, which is what the postinstall step and
// PLAYWRIGHT_BROWSERS_PATH are for.
import { chromium } from 'playwright-core';

/**
 * Remote browser endpoint. Held in an env var rather than hardcoded because
 * the hosted Chrome providers move their endpoints and a wrong URL should be
 * a config change, not a patch release.
 */
const REMOTE_BROWSER_WS =
  process.env.BROWSERLESS_WS_ENDPOINT ?? 'wss://chrome.browserless.io';

export async function executeServerlessScrape(targetUrl: string) {
  let browser;
  if (process.env.BROWSERLESS_API_KEY) {
    // Connect to a scalable edge cluster
    const url = new URL(REMOTE_BROWSER_WS);
    url.searchParams.set('token', process.env.BROWSERLESS_API_KEY);
    browser = await chromium.connectOverCDP(url.toString());
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
