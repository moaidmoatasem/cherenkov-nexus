import { test, expect } from '@playwright/test';
import { seedWorkspace } from './fixtures';

/**
 * The practice evaluator used to return `Math.random() * 8 + 91` with a fixed
 * list of strengths, without ever reading the answer. Someone rehearsing for a
 * real interview was told they scored in the nineties no matter what they
 * typed.
 *
 * CI runs without GEMINI_API_KEY, so the evaluator has nothing to assess with.
 * That makes "declines to score" the deterministic outcome here, and it is
 * exactly the case the old code papered over — which is what makes it worth
 * asserting.
 */
test.describe('Interview practice: no score without an assessment', () => {
  // Every test here synthesises a role in beforeEach before it starts asserting;
  // that alone can take 25s, so the suite-wide 45s budget is too tight.
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await seedWorkspace(context);
    page.on('pageerror', err => console.log(`[BROWSER UNHANDLED ERROR] ${err.message}`));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Reach the drill: it only exists once a role has been synthesised.
    //
    // No `force: true` anywhere here. These buttons re-render as synthesis
    // state lands, and a forced click skips the actionability retry that
    // handles a node being swapped underneath it — under load that silently
    // clicks a detached element and the tab never changes. Let Playwright
    // wait, then assert each step actually took effect.
    await page.locator('button:has-text("Monzo Bank")').first().click();
    await page.locator('button:has-text("Synthesize Role & Tailor Weaponry")').first().click();
    await expect(page.locator('text=Competency Alignment Match').first()).toBeVisible({ timeout: 25000 });

    await page.locator('button:has-text("Mock Drill")').first().click();
    await expect(page.locator('#job-synthesizer-practice-star-answer')).toBeVisible();
  });

  test('declines to score rather than inventing a number when no engine is configured', async ({ page }) => {
    const answer = page.locator('#job-synthesizer-practice-star-answer');
    await answer.fill(
      'Situation: our regression suite took 40 minutes and blocked every deploy. ' +
      'Task: I owned cutting that without losing coverage. ' +
      'Action: I sharded the Playwright suite across eight workers and moved contract checks to the API layer. ' +
      'Result: the suite runs in six minutes and deploy frequency roughly doubled.'
    );
    const evaluate = page.locator('button:has-text("Evaluate STAR Response")');
    await expect(evaluate).toBeEnabled();
    await evaluate.click();

    const notAssessed = page.locator('[data-testid="practice-not-assessed"]');
    await expect(notAssessed).toBeVisible({ timeout: 15000 });
    await expect(notAssessed).toContainText(/not assessed/i);

    // The regression assertion: no score card, and no percentage anywhere near
    // it. The old build rendered "STAR Score: 94%" for this exact input.
    await expect(page.locator('[data-testid="practice-scored"]')).toHaveCount(0);
    await expect(notAssessed).not.toContainText(/\d+\s*%/);
    await expect(notAssessed).not.toContainText(/RECRUITER READY/i);
  });

  test('a too-short answer is refused on its own terms, not scored', async ({ page }) => {
    await page.locator('#job-synthesizer-practice-star-answer').fill('hi');
    const evaluate = page.locator('button:has-text("Evaluate STAR Response")');
    await expect(evaluate).toBeEnabled();
    await evaluate.click();

    const notAssessed = page.locator('[data-testid="practice-not-assessed"]');
    await expect(notAssessed).toBeVisible({ timeout: 15000 });
    await expect(notAssessed).toContainText(/too short to assess/i);
    await expect(page.locator('[data-testid="practice-scored"]')).toHaveCount(0);
  });
});
