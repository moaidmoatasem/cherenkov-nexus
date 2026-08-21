import { test, expect, Page } from '@playwright/test';

/**
 * The Sponsorship Oracle is the highest-stakes surface in the product: it tells
 * someone whether a role can sponsor them. These assert the *answer* — the
 * verdict, the rule that decided it, and its citation — not that elements are
 * on screen. A test that only proves the page rendered would pass while the
 * engine returned the wrong verdict.
 *
 * Figures come from the sealed snapshot the app ships
 * (data/snapshots/uk-skilled-worker-2026-08-14.json): general threshold
 * £41,700, and SOC 2136 at a £49,400 going rate on a 37.5h basis.
 */

const SNAPSHOT_ID = 'uk-skilled-worker-2026-08-14';

async function openOracle(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('cherenkov_tour_completed', 'true'));
  await page.reload();
  await page.locator('text=Sponsorship Oracle').first().click();
  await expect(page.locator('#o-company')).toBeVisible();
}

/** Drive posting → SOC confirmation → verdict. */
async function runCheck(
  page: Page,
  opts: { company: string; title: string; salary: string; hours: string; soc: string }
) {
  await page.locator('#o-company').fill(opts.company);
  await page.locator('#o-title').fill(opts.title);
  await page.locator('#o-salary').fill(opts.salary);
  await page.locator('#o-hours').fill(opts.hours);

  await page.locator('button.o-act', { hasText: /check role/i }).click();

  // The tool suggests codes but never selects one — state it explicitly.
  // Generous timeout: global setup warms the sponsor-register migration, but if
  // that ever fails this should surface as a slow check rather than a missing
  // element, because the real cause is a 127k-row backfill, not a bad selector.
  await expect(page.locator('#o-manual-soc')).toBeVisible({ timeout: 60000 });
  await page.locator('#o-manual-soc').fill(opts.soc);
  await page.locator('button.o-act', { hasText: new RegExp(`run check with ${opts.soc}`, 'i') }).click();

  await expect(page.locator('.o-verdict-word')).toBeVisible({ timeout: 20000 });
}

test.describe('Sponsorship Oracle — eligibility verdicts', () => {
  test('names the going rate as the binding constraint when salary clears the general threshold but not the occupation rate', async ({
    page,
  }) => {
    await openOracle(page);
    await runCheck(page, {
      company: 'Monzo Bank',
      title: 'Senior QA Automation Engineer',
      salary: '44000',
      hours: '37.5',
      soc: '2136',
    });

    // The outcome itself.
    await expect(page.locator('.o-verdict-word')).toHaveText(/not eligible/i);

    // Which rule decided. This is the product's whole reason to exist: £44,000
    // passes the £41,700 general threshold and fails the £49,400 going rate.
    const binding = page.locator('.o-lrow.o-bind');
    await expect(binding).toContainText(/going rate/i);
    await expect(binding).toContainText('£49,400');
    await expect(binding).toContainText('£44,000');
    await expect(binding.locator('.o-bindmark')).toHaveText(/binding/i);

    // The rule it is citing, so the claim is checkable against the tables.
    await expect(binding.locator('.o-lref')).toContainText('SW 14.2');

    // The general threshold must be shown as passed, not silently omitted —
    // otherwise the reader cannot see which test the salary actually failed.
    const ledger = page.locator('.o-ledger');
    await expect(ledger).toContainText(/general salary threshold/i);
    await expect(ledger).toContainText('£41,700');

    // Provenance: the verdict is only valid for the snapshot that produced it.
    await expect(page.locator('.o-cite')).toContainText(SNAPSHOT_ID);
  });

  test('marks every verdict provisional while the shipped rules snapshot is unverified', async ({
    page,
  }) => {
    await openOracle(page);

    // The flag is raised before any check runs — the reader is warned up front.
    await expect(page.locator('.o-flag')).toHaveText(/unverified rules/i);

    await runCheck(page, {
      company: 'Monzo Bank',
      title: 'Senior QA Automation Engineer',
      salary: '44000',
      hours: '37.5',
      soc: '2136',
    });

    // An unverified snapshot must not produce a verdict that reads as settled.
    await expect(page.locator('.o-warnbox').first()).toContainText(/provisional/i);
  });

  test('the same posting and snapshot produce the same verdict twice', async ({ page }) => {
    const input = {
      company: 'Monzo Bank',
      title: 'Senior QA Automation Engineer',
      salary: '44000',
      hours: '37.5',
      soc: '2136',
    };

    await openOracle(page);
    await runCheck(page, input);
    const first = await page.locator('.o-binding').first().innerText();

    await page.locator('button.o-act', { hasText: /check another/i }).click();
    await expect(page.locator('#o-company')).toBeVisible();
    await runCheck(page, input);
    const second = await page.locator('.o-binding').first().innerText();

    // Reproducibility is a claim the Oracle makes in its own citation block.
    expect(second).toBe(first);
  });
});
