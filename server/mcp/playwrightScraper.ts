import { chromium } from 'playwright-core';

export async function executeServerlessScrape(targetUrl: string) {
  // Instead of launching a local browser, connect to a scalable edge cluster
  const browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`);
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  const accessibilityTree = await (page as any).accessibility.snapshot();
  
  await browser.close();
  return accessibilityTree;
}
