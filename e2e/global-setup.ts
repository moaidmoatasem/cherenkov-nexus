import type { FullConfig } from '@playwright/test';

/**
 * The first call to `/api/oracle/sponsor` runs a one-off migration: it adds a
 * `nameCore` column to the sponsors table and backfills it across ~127k rows in
 * 5,000-row chunks (`src/oracle/register.ts` → `ensureMatchIndex`). The result
 * is memoised per server process, so exactly one request pays for it.
 *
 * Without this, whichever spec happens to run first absorbs that cost and times
 * out, and the suite's timings say more about a migration than about the
 * product. Warm it once here so the tests measure what they claim to measure.
 */
async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ?? process.env.BASE_URL ?? 'http://localhost:3000';

  const deadline = Date.now() + 180_000;
  for (;;) {
    try {
      const res = await fetch(`${baseURL}/api/oracle/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: 'Monzo Bank' }),
      });
      if (res.ok) {
        console.log('[global-setup] sponsor register index warm');
        return;
      }
    } catch {
      // Server may still be booting — webServer readiness only gates on /api/health.
    }
    if (Date.now() > deadline) {
      console.warn('[global-setup] register did not warm in time; specs may be slow');
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

export default globalSetup;
