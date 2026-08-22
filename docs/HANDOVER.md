# Handover — data-honesty pass

State as of `10678c9` (PR #17). Written for whoever picks this up next.

## What this pass was

A sweep for one defect class: **the UI presenting invented data as fact**. Not
cosmetics — content a user could act on. The rule applied throughout:

> Every figure shown must come from somewhere a reader can point at — a record
> rendered on the same screen, or a response from the backend. Anything else is
> either removed, or labelled as sample data.

Where a value cannot be measured, the code says so explicitly rather than
substituting a plausible number. See `Measured<T>` in `src/server/telemetry.ts`
for the shape that encodes this.

## Surfaces already done

| Surface | What was wrong | PR |
|---|---|---|
| Job Synthesizer | static 96% match; fabricated AI provenance; one person's name/email leaking into everyone's generated applications | #5 |
| Sponsor check | `LIKE '%o%'` resolved to "Google — verified sponsor"; posting claims conflated with register facts | #7 |
| Interview Sandbox | scores derived from character count; a failed request produced a flattering 88/100 | #8 |
| Community Radar | invented crowdsourced telemetry; real employers (Monzo, Revolut) labelled likely ghost-job posters | #9 |
| MCP Marketplace | "Global Installs" summed from a counter that incremented when *you* clicked Install; two buttons that lied | #10 |
| Telemetry panel | four hardcoded metrics under "ALL SYSTEMS OPERATIONAL"; sponsor count wrong (114,820 vs 126,998) | #15 |
| Zero-trust routing / vault | fail-open routing; vault not actually encrypted | #16 |

**Do not regress these.** `e2e/data-provenance.spec.ts` exists specifically to
catch it, and asserts the *property* (headline equals what is on screen, or
equals what the API returned) rather than the wording, so it survives copy edits.

## Still open

Nothing here is urgent; none of it is a correctness bug in shipped behaviour.

1. **CI runs its checks twice.** `.github/workflows/main.yml` has discrete
   `Typecheck` / `seal-check` / `Unit tests` steps, then a `Run tests and
   linting` step invoking `npm run test:ci`, which is those same three. ~14s
   wasted per run. Delete either the three steps or the `test:ci` step.
2. **CI has no `push` trigger** — `on: pull_request` only. `main` itself is
   never verified after a merge, so a bad squash-merge resolution would go
   unnoticed. Adding `push: branches: [main]` is the fix.
3. **`activeMcpPackages` is dead config.** Declared in
   `UserWorkspaceConfig` (`src/types.ts`), set by all five archetype presets in
   `src/data/initialData.ts`, read by nothing. Either wire it to the Marketplace
   catalogue or delete it — as-is it implies a connection that does not exist.
4. **Locale fragility in the telemetry panel.** `TelemetryModal.tsx` renders the
   sponsor count with `toLocaleString()` (runtime default) while
   `e2e/data-provenance.spec.ts` expects `toLocaleString('en-US')`. They agree
   under en-US, which is what CI uses, so this is latent rather than live. Pin
   the component to `'en-US'` to close it.
5. **`/api/visa-check` has no UI caller.** Exercised only from
   `e2e/live-integrations-headed.spec.ts`. Works; just unreferenced.
6. **`SPONSORS_DATABASE`** (32 entries, `src/server/sponsorCheck.ts`) is now
   reachable only when the register is unreachable. Possibly worth deleting.

## Conventions worth keeping

- **Mutation-test new regression tests.** Every honesty test added in this pass
  was verified by reintroducing the bug and confirming *that* test — and only
  that test — went red. A test that passes alongside the bug is worse than none.
- **CRLF files.** `src/types.ts` and `src/data/initialData.ts` use CRLF.
  Python `read_text()`/`write_text()` silently normalises them and produces
  1900-line phantom diffs. Operate on bytes, or use the Edit tool.
- **`nexus.db` is tracked and holds the real 126,998-row register.** Never
  `git checkout` it while a server holds it open — that corrupts the file. Stop
  the server, delete `nexus.db-wal` / `nexus.db-shm`, then restore. A stale WAL
  paired with a newer `nexus.db` also reads as corrupt; deleting the WAL fixes it.
- **Don't `pkill -f` a pattern that matches your own shell.** `pkill -f "tsx
  server.ts"` kills the shell running it, aborting whatever came next. Verify
  restores actually ran rather than assuming.
- **This sandbox cannot reach `boards.greenhouse.io` or `github.com`.** Those
  specs are tagged `@live` and excluded from CI via `npm run test:e2e:ci`.
- **Playwright browser mismatch locally.** The sandbox ships Chromium 1194;
  `@playwright/test` wants a newer build. Run with a throwaway config setting
  `launchOptions.executablePath` to
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, plus an absolute
  `globalSetup` path. Do not commit that config — CI installs its own browsers.

## Verifying a change

```
npm run lint           # tsc
npm run test:unit      # 136+ tests
npm run test:e2e:ci    # Playwright, @live excluded
npm run build
```
