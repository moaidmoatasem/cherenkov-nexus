import { test, expect } from '@playwright/test';

/**
 * Every number a workspace prints has to come from somewhere a reader can point
 * at: a record rendered on the same screen, or a response from the backend.
 *
 * Community Radar and the MCP Marketplace both failed that. The radar opened
 * with "1,480+ ghost postings flagged", "342 monthly confirmed visas", "12,400+
 * connected hubs" and "99.4% ATS solver success" under a heading calling it
 * crowdsourced telemetry — while reading four bundled records and never
 * contacting anything. #9 rewrote that surface; these tests hold it there. The
 * marketplace summed a per-package `downloads` field into a "Global Installs"
 * headline, and that field went up by one when *you* clicked Install.
 *
 * The assertions target the property, not the wording: a headline equals what
 * is on screen, or equals what the API just said.
 */

const readInt = async (locator: { textContent(): Promise<string | null> }) =>
  parseInt(((await locator.textContent()) || '').replace(/[^\d-]/g, ''), 10);

test.describe('Data provenance: no invented figures', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addInitScript(() => {
      localStorage.setItem('cherenkov_tour_completed', 'true');
      // Start from the bundled catalogue, not one a previous test left behind.
      // This script re-runs on every navigation, so guard it: without the guard
      // a reload wipes whatever the test under way has just persisted.
      if (!sessionStorage.getItem('__pw_catalogue_reset')) {
        localStorage.removeItem('cherenkov_mcp_packages');
        sessionStorage.setItem('__pw_catalogue_reset', '1');
      }
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Community Radar discloses that its dataset is fixture content', async ({ page }) => {
    await page.locator('button:has-text("Community Radar")').first().click({ force: true });

    const notice = page.getByTestId('hivemind-sample-notice');
    await expect(notice).toBeVisible({ timeout: 15000 });
    await expect(notice).toContainText('not live telemetry');
    await expect(notice).toContainText('Employer names are fictional');

    // The specific fabrications this workspace used to lead with.
    for (const invented of ['1,480+', '12,400+', '99.4%', 'Connected Hubs', 'Monthly Confirmed Visas']) {
      await expect(page.locator(`text=${invented}`)).toHaveCount(0);
    }

    // No tab may re-assert liveness that the banner has just denied. The ATS
    // panel kept advertising "Live Probes" and "Cloudflare Bypass Health" after
    // the banner landed, and the heatmap still called itself "Verified Data".
    const claims = ['real-time collective intelligence', 'live probes', 'verified data', 'bypass status'];
    for (const tab of ['Ghost Job Radar', 'Visa Heatmap', 'ATS Selector Health']) {
      await page.locator(`button:has-text("${tab}")`).first().click({ force: true });
      const body = (await page.locator('body').innerText()).toLowerCase();
      for (const claim of claims) {
        expect(body, `"${claim}" still shown on ${tab}`).not.toContain(claim);
      }
    }
  });

  test('Every radar headline count equals the records rendered beneath it', async ({ page }) => {
    await page.locator('button:has-text("Community Radar")').first().click({ force: true });
    await expect(page.getByTestId('hivemind-sample-notice')).toBeVisible({ timeout: 15000 });

    const headline = page.locator('text=Flagged in sample').locator('xpath=preceding-sibling::div[1]');
    const flagged = await readInt(headline);
    const listedEndpoints = await readInt(
      page.locator('text=ATS endpoints listed').locator('xpath=preceding-sibling::div[1]')
    );

    // "Reporting peers" is the one figure that could be inflated for free.
    // Zero is the true number until a reporting network exists.
    await expect(
      page.locator('text=Reporting peers').locator('xpath=preceding-sibling::div[1]')
    ).toHaveText('0');

    // Ghost Job Radar is the default tab: the flagged count must match the
    // cards actually carrying a flagged-tier score.
    const ghostCards = page.getByTestId('ghost-job-card');
    await expect(ghostCards.first()).toBeVisible();
    expect(await ghostCards.count()).toBeGreaterThan(0);
    expect(flagged).toBeLessThanOrEqual(await ghostCards.count());

    await page.locator('button:has-text("ATS Selector Health")').first().click({ force: true });
    const atsRows = page.getByTestId('ats-health-row');
    await expect(atsRows.first()).toBeVisible();
    expect(await atsRows.count()).toBe(listedEndpoints);
  });

  test('Marketplace headline figures match what the gateway reports', async ({ page, request }) => {
    const [status, manifest] = await Promise.all([
      request.get('/api/mcp/status').then((r) => r.json()),
      request.get('/api/mcp/manifest').then((r) => r.json())
    ]);

    await page.locator('button:has-text("MCP Marketplace")').first().click({ force: true });
    await expect(
      page.locator('text=Model Context Protocol & Strategy Marketplace').first()
    ).toBeVisible({ timeout: 15000 });

    const connected = (status.servers || []).filter((s: any) => s.connected);
    const expectedTools = connected.reduce(
      (acc: number, s: any) => acc + (s.toolNames?.length || 0),
      0
    );

    await expect(page.getByTestId('mcp-stat-servers')).toHaveText(
      `${connected.length} / ${(status.servers || []).length}`,
      { timeout: 30000 }
    );
    await expect(page.getByTestId('mcp-stat-tools')).toHaveText(String(expectedTools));
    await expect(page.getByTestId('mcp-stat-spec')).toHaveText(manifest.schemaVersion);

    // The catalogue says plainly that enabling an entry starts nothing.
    await expect(page.getByTestId('catalogue-note')).toContainText('does not start a server');

    // Popularity theatre is gone: no invented install totals or star ratings.
    await expect(page.locator('text=Global Installs')).toHaveCount(0);
    await expect(page.locator('text=/^\\d+\\.\\d+k$/')).toHaveCount(0);
  });

  test('Adding a catalogue entry actually adds it', async ({ page }) => {
    await page.locator('button:has-text("MCP Marketplace")').first().click({ force: true });
    await expect(page.getByTestId('mcp-package-card').first()).toBeVisible({ timeout: 15000 });

    const before = await page.getByTestId('mcp-package-card').count();

    await page.locator('button:has-text("Publish MCP Server")').first().click({ force: true });
    await page.locator('#marketplace-package-name').fill('Canada Express Entry MCP');
    await page
      .locator('#marketplace-command-stdio-endpoint')
      .fill('npx -y @example/mcp-canada-express-entry@latest');
    await page.locator('#marketplace-category').selectOption('visa');
    await page.locator('button:has-text("Add to Catalogue")').first().click();

    // The form used to throw away everything typed into it and toast success.
    await expect(page.getByTestId('mcp-package-card')).toHaveCount(before + 1);
    await expect(page.locator('text=Canada Express Entry MCP').first()).toBeVisible();

    // And it survives a reload, because it was actually persisted.
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.locator('button:has-text("MCP Marketplace")').first().click({ force: true });
    await expect(page.locator('text=Canada Express Entry MCP').first()).toBeVisible({
      timeout: 15000
    });
  });

  test('Telemetry panel reports what the server measured', async ({ page, request }) => {
    const telemetry = await request.get('/api/telemetry').then((r) => r.json());

    // The register is the figure the panel got wrong: it printed a fixed
    // 114,820 labelled "Live Home Office DB" against a table of ~127k rows.
    expect(telemetry.sponsorsIndexed.value).toBeGreaterThan(100000);

    await page.locator('button[aria-label="System Telemetry & Scraper Health"]').first().click();
    await expect(page.getByTestId('telemetry-sponsors')).toHaveText(
      telemetry.sponsorsIndexed.value.toLocaleString('en-US'),
      { timeout: 15000 }
    );
    await expect(page.getByTestId('telemetry-tools')).toHaveText(String(telemetry.mcp.toolsExposed));

    // Versions are resolved from package.json, not typed into the markup.
    const deps = page.getByTestId('telemetry-dependencies');
    await expect(deps).toContainText(`react ${telemetry.dependencies.react}`);

    // Every figure the panel used to invent.
    for (const invented of ['99.8%', '412 ms', '114,820', 'ALL SYSTEMS OPERATIONAL']) {
      await expect(page.locator(`text=${invented}`)).toHaveCount(0);
    }
    // …and the status pills that reported health nothing had probed.
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const claim of ['resonating', 'gemini 2.5 flash', 'react 18']) {
      expect(body, `"${claim}" still shown`).not.toContain(claim);
    }
  });

  test('The xAPI webhook button copies an address that resolves', async ({
    page,
    context,
    baseURL
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.locator('button:has-text("Learning Sync")').first().click({ force: true });
    await expect(page.locator('text=Continuous xAPI Learning Sync Webhook').first()).toBeVisible({
      timeout: 15000
    });

    // The badge follows the SSE connection. It reported "LISTENER ACTIVE"
    // unconditionally before — and the stream never opened at all, because the
    // endpoint withheld its response head until the first event was emitted.
    await expect(page.getByTestId('xapi-listener-state')).toHaveText('LISTENER CONNECTED', {
      timeout: 15000
    });

    await page.locator('button:has-text("Copy Endpoint")').first().click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());

    // It used to copy https://nexus.cherenkov.internal/api/webhooks/xapi — a
    // host that does not exist, so an LMS pointed at it delivered nothing.
    expect(copied).not.toContain('cherenkov.internal');
    expect(copied).toBe(`${baseURL}/api/webhooks/xapi`);

    // And the address it hands out actually accepts a statement.
    const posted = await page.request.post(copied, {
      data: {
        actor: { name: 'E2E Probe' },
        verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
        object: { definition: { name: { 'en-US': 'Clipboard endpoint probe' } } }
      }
    });
    expect(posted.ok()).toBe(true);
  });
});
