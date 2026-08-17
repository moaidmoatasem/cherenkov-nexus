# Contributing

Welcome! We appreciate your interest in contributing to **Cherenkov Nexus**. Our
goal is to make the onboarding process as frictionless and user-centric as
possible while keeping the documentation honest with respect to the live
codebase.

---

## Quick Start

To get your local development environment set up quickly:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   > The `postinstall` script automatically downloads the Playwright Chromium
   > binaries required by the E2E suite. Node.js v20+ and npm v10+ are expected.

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   Populate `GEMINI_API_KEY` (and optionally `TURSO_*` / `LOCAL_LLM_*` /
   `BROWSERLESS_API_KEY`). See `.env.example` for the full list and defaults.

3. **Seed the Sponsor Database:**
   ```bash
   npx tsx seed-database.ts
   ```
   This populates the local `nexus.db` SQLite file from the Home Office CSV.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The app boots on <http://localhost:3000>.

5. **Verify your environment:**
   ```bash
   npm run lint        # tsc --noEmit type check
   npm run test:ci     # type check + unit tests (vitest)
   ```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Express + Vite dev server |
| `npm run build` | Vite build + esbuild bundle of `server.ts` (run by CI) |
| `npm run start` | Run the bundled production server (`dist/server.cjs`) |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run lint:eslint` | ESLint over the project |
| `npm run test` | Playwright E2E suite (`e2e/`) |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:ci` | Type check + unit tests (CI gate) |
| `npm run cli` | Run the standalone CLI (`cherenkov.ts`) |

## Development Workflow

1. **Branch from `main`** using a descriptive name, e.g.
   `feat/visa-batch-lookup` or `fix/sse-reconnect`.
2. **Keep changes focused.** Make the smallest correct change and stay in scope.
3. **Validate before pushing.** All of the following must pass locally:
   ```bash
   npm run lint        # type check
   npm run test:ci     # type check + unit tests
   npm run build       # production build (CI runs this on every PR)
   ```
   Run the Playwright E2E suite (`npm run test`) for UI/CLI/integration changes.
4. **Open a Pull Request** against `main` with a clear description of the problem
   being solved and how it was verified.

## Commit Message Convention

This project uses **Conventional Commits** (see `git log` for examples):

```
<type>(<optional scope>): <imperative summary>
```

Common `type` values: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`,
`perf`, `build`, `ci`. Examples from this repo:

```
feat: live data integrations with aligned headed test suite
test(e2e): align test suite locators and tab selectors with archetype UI
docs: update engineering handover with candidate archetype milestones
fix(build): resolve framer-motion module alias in vite configuration
```

## Code Style & Standards

- TypeScript is configured with `isolatedModules` and strict module resolution;
  avoid implicit `any` across network boundaries.
- UI components live in `src/components/`; keep them modular and defensive
  against nullish/empty data during generative streaming.
- API endpoints follow the standard response envelope documented in
  [docs/CODE_STANDARDS.md](docs/CODE_STANDARDS.md).
- See [docs/CODE_STANDARDS.md](docs/CODE_STANDARDS.md) and
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture and
  conventions.

## Documentation

When changing behavior, update the related docs so they stay accurate against the
codebase — this repo prioritizes documentation fidelity:

- New endpoints → update the capability table in [README.md](README.md) and
  [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md).
- Dependency changes → update [docs/TECH_STACK.md](docs/TECH_STACK.md).
- Structural changes → update the directory tree in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [README.md](README.md).
- Ensure all code blocks specify proper syntax highlighting
  (`typescript`, `bash`, `powershell`, `json`, `mermaid`).

## Reporting Issues

When filing an issue, include:

- The command(s) you ran and the exact error output.
- Node.js / OS version and whether you used cloud or local (`--mode`) inference.
- Steps to reproduce, plus the expected vs. actual behavior.

Please respect the [Code of Conduct](docs/CODE_OF_CONDUCT.md) in all
interactions.
